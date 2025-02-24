
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * 这些是固定的 LightX API Endpoint
 * 根据官方文档说明：
 *  - /expand-photo 发起扩展请求 => 返回 orderId, status=init
 *  - /order-status 轮询获取结果 => 若 status=active 则 body.output 中含最终图像URL
 */
const LIGHTX_EXPAND_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";
const LIGHTX_STATUS_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/order-status";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** 将二进制 Blob 转为 Base64 字符串 */
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

/** 等待指定毫秒 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 从请求体获取待扩展的图像URL
    const { imageUrl, leftPadding, rightPadding, topPadding, bottomPadding, textPrompt } = await req.json();
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'imageUrl' in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 从环境变量获取LightX的 API Key
    const LIGHTX_API_KEY = Deno.env.get("LIGHTX_API_KEY");
    if (!LIGHTX_API_KEY) {
      throw new Error("LightX API key not configured (env var LIGHTX_API_KEY not found)");
    }

    // 1) 发起"扩展请求"到 LightX
    // 注意要传入有效的 x-api-key: LIGHTX_API_KEY
    console.log("Calling LightX /expand-photo...");
    const expandBody = {
      imageUrl,
      leftPadding: leftPadding ?? 1024,  // 如果没传就用 1024 作为演示
      rightPadding: rightPadding ?? 0,
      topPadding: topPadding ?? 0,
      bottomPadding: bottomPadding ?? 0,
    };
    // 如果有 textPrompt，就加上；否则不传
    if (textPrompt) {
      (expandBody as any).textPrompt = textPrompt;
    }

    const expandResp = await fetch(LIGHTX_EXPAND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LIGHTX_API_KEY,
      },
      body: JSON.stringify(expandBody),
    });

    if (!expandResp.ok) {
      const errText = await expandResp.text();
      console.error("LightX expand-photo API error:", errText);
      return new Response(
        JSON.stringify({ 
          error: `LightX /expand-photo error: ${expandResp.status} ${expandResp.statusText}`, 
          details: errText 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 2) 解析"扩展请求"返回
    //  例: { statusCode:2000, message:"SUCCESS", body:{ orderId:"xxx", status:"init", ... } }
    const expandData = await expandResp.json();
    console.log("LightX /expand-photo response:", expandData);

    const orderId = expandData?.body?.orderId;
    let status = expandData?.body?.status;
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "No orderId returned from LightX expand-photo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 如果立刻就是 "active"，可直接取 output，不走轮询；否则进入轮询
    let finalUrl: string | null = null;
    if (status === "active") {
      finalUrl = expandData?.body?.output || null;
    } else {
      // 3) 轮询 /order-status，最多 5 次，每次间隔 3秒
      // 文档说: "You need to repeatedly call up to 5 times until status is 'active' or 'failed'"
      let attempts = 0;
      const maxAttempts = expandData?.body?.maxRetriesAllowed ?? 5; // doc: "maxRetriesAllowed":5
      const interval = 3000; // 3秒

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Polling /order-status (#${attempts}) for orderId=${orderId}...`);
        
        const statusResp = await fetch(LIGHTX_STATUS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": LIGHTX_API_KEY,
          },
          body: JSON.stringify({ orderId }),
        });

        if (!statusResp.ok) {
          const errText = await statusResp.text();
          console.error("LightX status API error:", errText);
          throw new Error(`Failed to retrieve order status. HTTP ${statusResp.status}: ${errText}`);
        }

        const statusData = await statusResp.json();
        console.log("LightX /order-status response:", statusData);

        status = statusData.body?.status;
        if (status === "active") {
          // 拿到最终结果
          finalUrl = statusData.body?.output;
          break;
        } else if (status === "failed") {
          throw new Error("LightX indicates expansion has 'failed', no credit consumed.");
        }

        // 如果还处于 "init" / "processing" 之类，就等待3秒再试
        if (attempts < maxAttempts) {
          await sleep(interval);
        }
      }
    }

    // 若5次(或maxAttempts次)轮询后还没拿到 active，则可能超时
    if (!finalUrl) {
      throw new Error("Timed out or never reached status=active from LightX");
    }

    // 4) 下载最终 output 图像
    console.log("Downloading final expanded image:", finalUrl);
    const imgResp = await fetch(finalUrl);
    if (!imgResp.ok) {
      throw new Error(`Failed to download final image: ${imgResp.statusText}`);
    }
    const blob = await imgResp.blob();

    // 5) 转成 Base64 返回
    const base64Data = await blobToBase64(blob);
    const respBody = {
      imageData: `data:${blob.type};base64,${base64Data}`,
      // 也可以额外返回 finalUrl 方便调试
      finalUrl
    };

    return new Response(JSON.stringify(respBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error in expand-image function:", err);
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
