import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 检查必要的环境变量
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing Stripe secret key in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { productId, title, format, price, quantity = 1, couponCode } = req.body;
    
    // 验证必要的输入数据
    if (!productId) {
      return res.status(400).json({ error: 'Missing product ID' });
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }
    
    // 生成随机订单ID
    const orderId = `WY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    let discounts;
    if (couponCode) {
      const promoList = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
      if (!promoList.data || promoList.data.length === 0) {
        return res.status(400).json({ error: 'Invalid coupon code' });
      }
      discounts = [{ promotion_code: promoList.data[0].id }];
    }
    
    // 创建Stripe Checkout会话，包含shipping address收集
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title || 'Custom Book',
              description: `${format || 'Standard'} Format`,
            },
            unit_amount: Math.round(parseFloat(price) * 100), // Stripe需要以美分为单位，确保四舍五入为整数
          },
          quantity: parseInt(quantity, 10) || 1, // 确保quantity为整数
        },
      ],
      // 应用优惠
      ...(discounts ? { discounts } : {}),
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // 允许的国家列表
      },
      // 收集联系电话 
      phone_number_collection: {
        enabled: true, // 启用电话号码收集
      },
      // 收集完整联系信息
      billing_address_collection: 'required',
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // 免费送货
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500, // $15.00
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 3,
              },
            },
          },
        },
      ],
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
      metadata: {
        orderId,
        productId,
        format: format || 'Standard',
        title: title || 'Custom Book',
        binding_type: format === 'Hardcover' ? 'hardcover' : 'softcover',
        is_color: false,
        paper_type: 'Standard'
      },
    });

    console.log(`Created checkout session for order ${orderId}, product ${productId}`);

    res.status(200).json({ 
      sessionId: session.id, 
      url: session.url,
      orderId 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    // 不向客户端暴露详细错误信息
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}