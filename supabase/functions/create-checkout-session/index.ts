import { corsHeaders } from "../_shared/cors.ts";
import { stripe } from "../_shared/stripe.ts";

// 优化的Deno服务器处理程序
Deno.serve(async (req) => {
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 解析请求体
    const { productId, quantity = 1, priceId, format, title } = await req.json();

    // 创建Stripe Checkout会话
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success`,
      cancel_url: `${req.headers.get('origin')}/checkout`,
      metadata: {
        productId,
        format,
        title,
      },
    });

    // 返回会话ID
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // 错误处理
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
