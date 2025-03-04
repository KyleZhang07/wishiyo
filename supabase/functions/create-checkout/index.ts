import { corsHeaders } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';

// 处理OPTIONS请求以支持CORS预检
function handleCorsOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
}

// Deno Deploy处理函数
Deno.serve(async (req) => {
  // 处理CORS
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  
  try {
    // 解析请求体
    const { productInfo, shippingRequired } = await req.json();
    
    // 从产品信息中提取必要的详细信息
    const { title, price, format } = productInfo;
    
    // 为结账会话生成行项目
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: title,
          description: `${title} - ${format}`,
        },
        unit_amount: parseFloat(price) * 100, // 转换为美分
      },
      quantity: 1,
    }];
    
    // 生成唯一订单ID
    const orderId = `WY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // 创建结账会话
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success?order_id=${orderId}`,
      cancel_url: `${req.headers.get('origin')}/user-center`,
      metadata: {
        orderId,
        title,
        format,
      },
      shipping_address_collection: shippingRequired ? {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      } : undefined,
    });
    
    // 返回会话ID和URL
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        orderId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    // 错误处理
    console.error('Stripe checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
}); 