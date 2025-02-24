import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIGHTX_EXPAND_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";
const LIGHTX_STATUS_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo/status";

/**
 * 将 Blob 转为 Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

/**
 * 睡眠(等待)若干毫秒的帮助函数
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. 读取请求体
    const { imageUrl } = await req.json();
    console.log("Received image URL for expansion:", imageUrl);

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image URL provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. 获取 LightX 的 API Key
    const LIGHTX_API_KEY = Deno.env.get("LIGHTX_API_KEY");
    if (!LIGHTX_API_KEY) {
      throw new Error("LightX API key not configured");
    }

    // 3. 调用"expand-photo"接口，让 LightX 开始处理
    console.log("Calling LightX API to expand image...");
    const leftPadding = 1024; // 演示：向左扩展 1024 像素
    const startResp = await fetch(LIGHTX_EXPAND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LIGHTX_API_KEY,
      },
      body: JSON.stringify({
        imageUrl,
        leftPadding,
        rightPadding: 0,
        topPadding: 0,
        bottomPadding: 0,
        textPrompt:
          "clean, clear, empty background with solid colors and no objects, perfect for text overlay, minimalist design",
      }),
    });

    // 如果 HTTP 非 2xx，则返回错误
    if (!startResp.ok) {
      const errorText = await startResp.text();
      console.error("LightX expand-photo API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `LightX expand-photo error: ${startResp.status} ${startResp.statusText}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // 4. 解析初始响应 (通常会包含 orderId, status="init" 等)
    const startData = await startResp.json();
    console.log("LightX expand-photo initial response:", startData);

    const { orderId, status } = startData.body ?? {};
    if (!orderId) {
      return new Response(JSON.stringify({ 
        error: "No orderId returned from LightX" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 如果 LightX 是同步立即返回"已完成"的情况，这里可能直接有 url
    // 但根据你的贴图显示 status="init"，所以要继续轮询

    // 5. 轮询获取最终结果
    let finalImageUrl: string | null = null;
    let attempt = 0;
    const maxAttempts = 10; // 最多轮询 10 次
    const intervalMs = 3000; // 每次轮询间隔 3s (示例)

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Polling LightX expand status... attempt #${attempt}`);
      const statusUrl = `${LIGHTX_STATUS_ENDPOINT}?orderId=${orderId}`;
      const statusResp = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "x-api-key": LIGHTX_API_KEY,
        },
      });

      if (!statusResp.ok) {
        const txt = await statusResp.text();
        console.error("LightX status API error:", txt);
        throw new Error(`Failed to get expand status: ${txt}`);
      }

      const statusData = await statusResp.json();
      console.log("Status check response:", statusData);

      const currentStatus = statusData.body?.status;
      if (currentStatus === "done") {
        // 假设最终的图片链接在 data.url 或 data.finalUrl
        finalImageUrl = statusData.body?.url;
        break;
      } else if (currentStatus === "failed") {
        throw new Error("LightX expansion failed according to status check");
      }

      // 其他状态还在处理，比如 "init" / "in-progress"
      if (attempt < maxAttempts) {
        console.log(`Still processing, waiting ${intervalMs}ms...`);
        await sleep(intervalMs);
      }
    }

    if (!finalImageUrl) {
      // 超过 maxAttempts 次还没完成
      throw new Error("Timed out waiting for LightX expansion result");
    }

    // 6. 下载扩展后的图片
    console.log("Downloading expanded image from final URL:", finalImageUrl);
    const downloadResp = await fetch(finalImageUrl);
    if (!downloadResp.ok) {
      throw new Error(
        `Failed to download expanded image: ${downloadResp.statusText}`
      );
    }
    const expandedBlob = await downloadResp.blob();

    // 7. 转为 Base64 并返回给前端
    const base64Data = await blobToBase64(expandedBlob);
    const finalResp = {
      imageData: `data:${expandedBlob.type};base64,${base64Data}`,
    };

    return new Response(JSON.stringify(finalResp), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in expand-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
