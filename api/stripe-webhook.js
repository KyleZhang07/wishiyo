import Stripe from 'stripe';
import fetch from 'node-fetch';

// 为Vercel环境添加API配置
export const config = {
  api: {
    bodyParser: false, // 禁用默认的bodyParser
  },
};

// 从可读流获取原始请求体
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // 获取原始请求体
    const rawBody = await buffer(req);
    
    // 获取Stripe签名头
    const signature = req.headers['stripe-signature'];
    
    // 验证webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // 检查必要的环境变量
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing required environment variables for Stripe webhook');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 处理付款成功事件
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

          // 如果书籍类型是funny-biography，则调用generate-book函数生成书籍
          if (productId === 'funny-biography') {
            console.log('Starting to generate funny biography book');
            
            try {
              // 从本地存储中获取用户数据
              // 在实际应用中，这些数据应该存储在数据库中或通过客户端传递
              // 这里我们假设我们接收到了来自客户端的数据
              const userData = session.metadata.userData ? JSON.parse(session.metadata.userData) : null;
              
              if (!userData) {
                console.error('Missing user data for book generation');
                return res.status(200).json({ 
                  received: true, 
                  warning: 'Book generation skipped due to missing user data' 
                });
              }
              
              // 构建请求数据
              const generateBookData = {
                userAnswers: userData.userAnswers,
                author: userData.author,
                bookTitle: title || userData.bookTitle,
                tableOfContents: userData.tableOfContents,
                coverData: userData.coverData,
                shippingAddress: shippingAddress
              };

              // 调用本地generate-book函数生成并打印书籍
              const generateBookUrl = new URL('/api/generate-book', process.env.BASE_URL || 'http://localhost:3000').href;
              const response = await fetch(generateBookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(generateBookData)
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate book: ${response.status} ${response.statusText} - ${errorText}`);
              }

              const result = await response.json();
              console.log('Book generation initiated:', result);
              
              // 通知客户端清除本地存储
              // 这将需要客户端实现一个处理此事件的机制
              // 例如，通过WebSocket或在客户端轮询订单状态时进行清除
              
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
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
