import Stripe from 'stripe';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // 检查必要的环境变量
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing required environment variables for Stripe webhook');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 确保有原始请求体用于验证
  const rawBody = req.rawBody || req.body;

  let event;

  try {
    // 验证webhook签名
    event = stripe.webhooks.constructEvent(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 仅处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // 确保支付已成功
    if (session.payment_status === 'paid') {
      try {
        // 获取完整的会话数据，包括客户和发货信息
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id, {
            expand: ['customer', 'shipping', 'shipping_cost', 'line_items']
          }
        );

        // 从会话元数据提取书籍信息
        const { productId, format, title, orderId } = session.metadata || {};
        
        if (!productId) {
          console.warn('Missing productId in session metadata');
          return res.status(200).json({ received: true, warning: 'Missing productId in metadata' });
        }

        // 提取配送地址信息
        const shippingAddress = expandedSession.shipping ? {
          name: expandedSession.shipping.name,
          address: {
            line1: expandedSession.shipping.address.line1,
            line2: expandedSession.shipping.address.line2 || '',
            city: expandedSession.shipping.address.city,
            state: expandedSession.shipping.address.state,
            postal_code: expandedSession.shipping.address.postal_code,
            country: expandedSession.shipping.address.country
          }
        } : null;
        
        // 提取配送速度信息
        const shippingOption = expandedSession.shipping_cost ? {
          shipping_rate: expandedSession.shipping_cost.shipping_rate,
          display_name: expandedSession.shipping_cost.display_name,
          delivery_estimate: expandedSession.shipping_cost.delivery_estimate
        } : null;

        console.log('Payment successful for order', orderId);
        console.log('Product ID:', productId);
        console.log('Shipping Address:', shippingAddress);
        console.log('Shipping Option:', shippingOption);

        // 如果书籍类型是funny-biography，则调用Supabase函数生成书籍
        if (productId === 'funny-biography') {
          console.log('Starting to generate funny biography book');
          
          // 检查Supabase相关环境变量
          if (!process.env.SUPABASE_FUNCTIONS_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error('Missing required Supabase environment variables');
            return res.status(200).json({ 
              received: true, 
              warning: 'Book generation skipped due to missing configuration' 
            });
          }
          
          // 构建请求数据
          const generateBookData = {
            orderId,
            title,
            format,
            shippingAddress,
            shippingOption,
            customer: {
              email: expandedSession.customer_details?.email
            }
          };

          // 调用Supabase函数生成书籍
          try {
            const supabaseUrl = process.env.SUPABASE_FUNCTIONS_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            
            const response = await fetch(
              `${supabaseUrl}/functions/v1/generate-book`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify(generateBookData)
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to generate book: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Book generation initiated:', result);
          } catch (error) {
            console.error('Error calling generate-book function:', error);
            // 记录错误但仍返回成功给Stripe，防止重试逻辑
          }
        }

        // 成功处理付款
        return res.status(200).json({ received: true, success: true });
      } catch (error) {
        console.error('Error processing successful payment:', error);
        // 不向客户端暴露详细错误信息
        return res.status(500).json({ error: 'Failed to process payment confirmation' });
      }
    }
  }

  // 返回成功响应给Stripe
  return res.status(200).json({ received: true });
}
