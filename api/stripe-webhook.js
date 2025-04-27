import Stripe from 'stripe';
import fetch from 'node-fetch';

// Vercel环境的API配置
export const config = {
  api: {
    bodyParser: false, // 禁用默认的bodyParser
  },
};

console.log("===== WEBHOOK FILE LOADED =====");

// 从可读流中获取原始请求体
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// 更新图书状态的辅助函数
async function updateBookStatus(supabaseUrl, supabaseKey, orderId, status, error = null) {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/update-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId, status, error })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`更新图书状态失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('更新图书状态时出错:', error);
    throw error;
  }
}

// 添加一个触发打印请求检查的函数
async function triggerPrintRequestCheck(orderId, type) {
  try {
    // 详细记录环境变量信息
    console.log(`[${orderId}] 环境变量检查:`, {
      supabaseUrl: process.env.SUPABASE_URL ? '已设置' : '未设置',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置(长度:' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : '未设置'
    });

    // 调用 Supabase 函数更新打印请求状态
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/update-print-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          orderId,
          type
        })
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('Print request check triggered successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Error triggering print request check: ${response.status} ${response.statusText}`, {
        errorText,
        baseUrl: process.env.SUPABASE_URL
      });
      return false;
    }
  } catch (error) {
    console.error('Error in triggerPrintRequestCheck:', error);
    return false;
  }
}

export default async function handler(req, res) {
  console.log(`[WEBHOOK] Received webhook request at ${new Date().toISOString()}`);

  if (req.method !== 'POST') {
    console.log('[WEBHOOK] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 获取环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // 记录环境变量状态（不记录实际值，只记录是否存在）
  console.log('[WEBHOOK] Environment variables check:', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey,
    STRIPE_SECRET_KEY: !!stripeSecret,
    STRIPE_WEBHOOK_SECRET: !!endpointSecret,
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    VERCEL_URL: !!process.env.VERCEL_URL
  });

  const stripe = new Stripe(stripeSecret);

  try {
    // 获取原始请求体
    const rawBody = await buffer(req);
    console.log("===== REQUEST BODY RECEIVED =====", rawBody.length, "bytes");

    // 获取Stripe签名头
    const signature = req.headers['stripe-signature'];

    // 验证webhook
    let event;
    try {
      console.log('[WEBHOOK] Verifying webhook signature...');
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log('[WEBHOOK] Signature verification successful');
    } catch (err) {
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 检查所需的环境变量
    console.log("Environment variables check:", {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'undefined',
      supabaseKeyLength: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0,
      supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0
    });

    // 处理支付成功事件
    console.log("===== EVENT TYPE:", event.type, "=====");

    // 记录完整的事件数据（排除敏感信息）
    const eventLog = { ...event };
    if (eventLog.data && eventLog.data.object) {
      // 移除可能的敏感信息
      if (eventLog.data.object.customer_details) {
        eventLog.data.object.customer_details = '*** REDACTED ***';
      }
      if (eventLog.data.object.payment_method_details) {
        eventLog.data.object.payment_method_details = '*** REDACTED ***';
      }
    }
    console.log('[DEBUG] Full event data:', JSON.stringify(eventLog, null, 2).substring(0, 1000) + '...');

    // 处理事件
    console.log(`[WEBHOOK] Event type received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log("[WEBHOOK] Processing checkout.session.completed event");

        const session = event.data.object;
        console.log(`[WEBHOOK] Session ID: ${session.id}`);
        console.log(`[WEBHOOK] Session metadata:`, session.metadata);

        const orderId = session.metadata.orderId;

        if (!orderId) {
          console.error("[WEBHOOK] ERROR: No orderId found in session metadata:", session.metadata);
          return res.status(400).json({ error: "Missing orderId in session metadata" });
        }

        console.log(`[WEBHOOK] Processing order ID: ${orderId}`);

        // 确保支付成功
        console.log("Payment status:", session.payment_status);
        if (session.payment_status === 'paid') {
          try {
            // 获取会话元数据
            console.log(`[DEBUG] Session metadata:`, session.metadata);
            console.log(`[DEBUG] Payment status:`, session.payment_status);
            // 获取完整的会话数据，包括客户和运输信息
            console.log(`[DEBUG] Retrieving expanded session with ID: ${session.id}`);
            console.log(`[DEBUG] Expand parameters:`, ['customer', 'shipping', 'shipping_cost', 'line_items']);

            const expandedSession = await stripe.checkout.sessions.retrieve(
              session.id, {
                expand: ['customer', 'shipping', 'shipping_cost', 'line_items']
              }
            );

            console.log(`[DEBUG] Expanded session retrieved successfully. Session object keys:`, Object.keys(expandedSession));
            console.log(`[DEBUG] Has shipping_cost:`, !!expandedSession.shipping_cost);
            console.log(`[DEBUG] Has shipping_details:`, !!expandedSession.shipping_details);

            // 记录完整的 expandedSession 结构
            console.log('[DEBUG] Full expandedSession structure (truncated):',
              JSON.stringify(expandedSession, (key, value) => {
                // 对敏感信息进行脱敏
                if (key === 'customer_details' && value && value.email) {
                  return { ...value, email: '***@***.com' };
                }
                if (key === 'customer_details' && value && value.phone) {
                  return { ...value, phone: '***********' };
                }
                return value;
              }, 2).substring(0, 2000) + '...');

            // 特别记录与运输相关的字段
            console.log('[DEBUG] Shipping related fields:', {
              shipping_cost: expandedSession.shipping_cost,
              shipping_details: expandedSession.shipping_details,
              shipping_options: expandedSession.shipping_options,
              shipping_rate: expandedSession.shipping_rate,
              shipping_address_collection: expandedSession.shipping_address_collection,
              shipping_methods: expandedSession.shipping_methods,
              total_details: expandedSession.total_details
            });

            // 如果存在 shipping_cost，记录其完整结构
            if (expandedSession.shipping_cost) {
              console.log('[DEBUG] Full shipping_cost structure:', JSON.stringify(expandedSession.shipping_cost, null, 2));
              console.log('[DEBUG] shipping_cost keys:', Object.keys(expandedSession.shipping_cost));
            }

            // 如果存在 total_details，记录其完整结构
            if (expandedSession.total_details) {
              console.log('[DEBUG] Full total_details structure:', JSON.stringify(expandedSession.total_details, null, 2));
            }

            // 如果存在 line_items，记录其完整结构
            if (expandedSession.line_items && expandedSession.line_items.data) {
              console.log('[DEBUG] First line item:', JSON.stringify(expandedSession.line_items.data[0], null, 2));
            }

            // 从会话元数据中提取图书信息
            const { productId, format, title, orderId, binding_type, is_color, paper_type } = session.metadata || {};

            // 输出完整的元数据信息以进行调试
            console.log('[DEBUG] Complete session metadata:', session.metadata);
            console.log('[DEBUG] Extracted binding_type:', binding_type);

            if (!productId) {
              console.warn('会话元数据中缺少productId');
              return res.status(200).json({ received: true, warning: '元数据中缺少productId' });
            }

            // 提取运输地址信息
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
            } : (expandedSession.customer_details?.address ? {
              name: expandedSession.customer_details.name || '',
              address: {
                line1: expandedSession.customer_details.address.line1 || '',
                line2: expandedSession.customer_details.address.line2 || '',
                city: expandedSession.customer_details.address.city || '',
                state: expandedSession.customer_details.address.state || '',
                postal_code: expandedSession.customer_details.address.postal_code || '',
                country: expandedSession.customer_details.address.country || ''
              }
            } : null);

            // 调试日志 - 详细输出shipping地址信息
            console.log('DETAILED SHIPPING ADDRESS DEBUG:', {
              hasShipping: !!expandedSession.shipping,
              hasCustomerDetails: !!expandedSession.customer_details,
              hasCustomerAddress: !!expandedSession.customer_details?.address,
              shippingAddress: JSON.stringify(shippingAddress),
              customerDetailsName: expandedSession.customer_details?.name,
              customerDetailsAddress: expandedSession.customer_details?.address ? JSON.stringify(expandedSession.customer_details.address) : null,
              expandedSession: JSON.stringify({
                customer: expandedSession.customer ? { id: expandedSession.customer.id, email: expandedSession.customer.email } : null,
                shipping: expandedSession.shipping,
                customer_details: expandedSession.customer_details
              }),
              sessionId: session.id
            });

            // 检查所有可能包含运输信息的字段
            console.log('[DEBUG] Checking all possible shipping fields:', {
              'shipping_cost': expandedSession.shipping_cost,
              'shipping_cost_type': typeof expandedSession.shipping_cost,
              'shipping_cost.shipping_rate': expandedSession.shipping_cost?.shipping_rate,
              'shipping_cost.amount_total': expandedSession.shipping_cost?.amount_total,
              'shipping_cost.amount_subtotal': expandedSession.shipping_cost?.amount_subtotal,
              'shipping_cost.amount_tax': expandedSession.shipping_cost?.amount_tax,
              'total_details': expandedSession.total_details,
              'total_details.amount_shipping': expandedSession.total_details?.amount_shipping,
              'shipping_options': expandedSession.shipping_options,
              'shipping_rate': expandedSession.shipping_rate,
              'shipping_methods': expandedSession.shipping_methods,
              'line_items': expandedSession.line_items ? 'exists' : 'null',
              'line_items.data.length': expandedSession.line_items?.data?.length || 0
            });

            // 如果存在 line_items，检查其中的运输信息
            if (expandedSession.line_items && expandedSession.line_items.data && expandedSession.line_items.data.length > 0) {
              console.log('[DEBUG] First line item shipping info:', {
                'shipping_rate': expandedSession.line_items.data[0].shipping_rate,
                'shipping_details': expandedSession.line_items.data[0].shipping_details,
                'shipping': expandedSession.line_items.data[0].shipping,
                'has_shipping_cost': !!expandedSession.line_items.data[0].shipping_cost
              });
            }

            // 提取运输速度信息
            const shippingOption = expandedSession.shipping_cost ? {
              shipping_rate: expandedSession.shipping_cost.shipping_rate,
              display_name: expandedSession.shipping_cost.display_name,
              delivery_estimate: expandedSession.shipping_cost.delivery_estimate
            } : null;

            // 记录提取的 shippingOption 对象
            console.log('[DEBUG] Extracted shippingOption object:', shippingOption);

            console.log('Payment successful for order', orderId);
            console.log('Product ID:', productId);
            console.log('Shipping Address:', shippingAddress);
            console.log('Shipping Option:', shippingOption);

            // 添加详细的 shipping_level 日志
            console.log('[DEBUG] Shipping level details:', {
              shipping_option_exists: !!shippingOption,
              display_name: shippingOption?.display_name || 'null',
              shipping_rate_id: shippingOption?.shipping_rate || 'null',
              mapped_shipping_level: shippingOption?.display_name === 'Express Shipping' ? 'EXPEDITED' : 'MAIL'
            });

            // 检查是否有运输费用，可能用于判断是否是快递运输
            if (expandedSession.total_details) {
              const hasShippingCost = expandedSession.total_details.amount_shipping > 0;
              console.log('[DEBUG] Shipping cost check:', {
                total_details: expandedSession.total_details,
                amount_shipping: expandedSession.total_details.amount_shipping,
                has_shipping_cost: hasShippingCost,
                shipping_level_by_cost: hasShippingCost ? 'EXPEDITED' : 'MAIL'
              });
            }

            // 检查是否有其他可能的运输相关字段
            console.log('[DEBUG] Additional shipping related fields:', {
              amount_subtotal: expandedSession.amount_subtotal,
              amount_total: expandedSession.amount_total,
              payment_intent: expandedSession.payment_intent ? 'exists' : 'null',
              metadata: expandedSession.metadata,
              shipping_cost_object_id: expandedSession.shipping_cost_object_id,
              shipping_rate_object: expandedSession.shipping_rate_object
            });

            // 如果图书类型是funny-biography，启动生成过程
            if (productId === 'funny-biography') {
              try {
                console.log(`[${orderId}] Processing funny-biography book`);

                // 1. 将图书状态更新为"处理中"
                await updateBookStatus(supabaseUrl, supabaseKey, orderId, "processing");
                console.log(`[${orderId}] Book status set to processing`);

                // 1.1 更新书籍的 binding_type 和其他元数据
                const updateMetadataResponse = await fetch(
                  `${supabaseUrl}/functions/v1/update-book-data`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({
                      orderId,
                      table_name: 'funny_biography_books',
                      binding_type: binding_type || (format === 'Hardcover' ? 'hardcover' : 'softcover'),
                      is_color: is_color === 'true' ? true : false,
                      paper_type: paper_type || 'Standard',
                      shipping_address: shippingAddress,
                      shipping_option: shippingOption,
                      customer_email: expandedSession.customer_details?.email,
                      shipping_level: expandedSession.total_details?.amount_shipping > 0 ? 'EXPEDITED' : 'MAIL',
                      recipient_phone: expandedSession.customer_details?.phone || ''
                    })
                  }
                );

                if (!updateMetadataResponse.ok) {
                  console.warn(`[${orderId}] Warning: Failed to update book metadata: ${updateMetadataResponse.status}`);
                } else {
                  console.log(`[${orderId}] Successfully updated book metadata including binding_type`);
                }

                // 2. 从数据库获取图书数据以获取图片
                const getBookResponse = await fetch(
                  `${supabaseUrl}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=*`,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseKey}`,
                      'apikey': supabaseKey
                    }
                  }
                );

                if (!getBookResponse.ok) {
                  throw new Error(`获取图书数据失败: ${getBookResponse.status}`);
                }

                const bookData = await getBookResponse.json();
                if (!bookData || bookData.length === 0) {
                  throw new Error(`未找到订单ID对应的图书数据: ${orderId}`);
                }

                const book = bookData[0];
                const images = book.images || {};

                // 记录详细的图片数据用于调试
                console.log(`[${orderId}] Images data check:`, {
                  hasImagesObject: !!book.images,
                  hasFrontCover: !!(book.images && book.images.frontCover),
                  frontCoverLength: book.images && book.images.frontCover ? book.images.frontCover.substring(0, 30) + '...' : 'N/A',
                  hasSpine: !!(book.images && book.images.spine),
                  spineLength: book.images && book.images.spine ? book.images.spine.substring(0, 30) + '...' : 'N/A',
                  hasBackCover: !!(book.images && book.images.backCover),
                  backCoverLength: book.images && book.images.backCover ? book.images.backCover.substring(0, 30) + '...' : 'N/A'
                });

                // 3. 调用内容生成函数
                console.log(`[${orderId}] Calling content generation function`);
                const contentPromise = fetch(
                  `${supabaseUrl}/functions/v1/generate-book-content`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({
                      orderId
                    })
                  }
                );

                // 4. 如果图片可用，并行启动封面PDF生成
                let coverPromise = Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
                if (images.frontCover && images.spine && images.backCover) {
                  console.log(`[${orderId}] Starting cover PDF generation`);
                  console.log(`[${orderId}] Cover images found:`, {
                    frontCover: images.frontCover ? `${images.frontCover.substring(0, 30)}...` : 'missing',
                    spine: images.spine ? `${images.spine.substring(0, 30)}...` : 'missing',
                    backCover: images.backCover ? `${images.backCover.substring(0, 30)}...` : 'missing'
                  });

                  // 验证图片URL
                  function validateImageUrl(url) {
                    return url && (url.startsWith('http://') || url.startsWith('https://'));
                  }

                  if (!validateImageUrl(images.frontCover) ||
                      !validateImageUrl(images.spine) ||
                      !validateImageUrl(images.backCover)) {
                    console.warn(`[${orderId}] One or more image URLs are invalid:`, {
                      frontCoverValid: validateImageUrl(images.frontCover),
                      spineValid: validateImageUrl(images.spine),
                      backCoverValid: validateImageUrl(images.backCover)
                    });
                  }

                  // 重新从数据库获取最新的 binding_type
                  console.log(`[${orderId}] Fetching latest book data for binding_type`);
                  const getUpdatedBookResponse = await fetch(
                    `${supabaseUrl}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=binding_type,style`,
                    {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey
                      }
                    }
                  );

                  let bindingType = 'softcover'; // 默认值
                  let coverStyle = 'classic'; // 默认封面样式

                  if (getUpdatedBookResponse.ok) {
                    const updatedBookData = await getUpdatedBookResponse.json();
                    if (updatedBookData && updatedBookData.length > 0) {
                      if (updatedBookData[0].binding_type) {
                        bindingType = updatedBookData[0].binding_type.toLowerCase();
                        console.log(`[${orderId}] Retrieved binding_type from database: ${bindingType}`);
                      } else {
                        console.log(`[${orderId}] Could not retrieve binding_type from database, using default: ${bindingType}`);
                      }

                      if (updatedBookData[0].style) {
                        coverStyle = updatedBookData[0].style;
                        console.log(`[${orderId}] Retrieved style from database: ${coverStyle}`);
                      } else {
                        console.log(`[${orderId}] Could not retrieve style from database, using default: ${coverStyle}`);
                      }
                    }
                  } else {
                    console.warn(`[${orderId}] Failed to fetch updated book data, using default values: binding_type=${bindingType}, style=${coverStyle}`);
                  }

                  console.log(`[${orderId}] Cover images validated, calling cover PDF generation`);
                  coverPromise = fetch(
                    `${supabaseUrl}/functions/v1/generate-cover-pdf`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                      },
                      body: JSON.stringify({
                        orderId,
                        frontCover: images.frontCover,
                        spine: images.spine,
                        backCover: images.backCover,
                        binding_type: bindingType,
                        format: bindingType, // 保留 format 参数以确保兼容性
                        style: coverStyle // 使用 style 字段而不是 cover_template
                      })
                    }
                  );
                } else {
                  console.warn(`[${orderId}] Missing cover images, skipping cover PDF generation`);
                }

                // 5. 等待内容生成完成
                const contentResponse = await contentPromise;
                const contentResult = await contentResponse.json();
                if (!contentResult.success) {
                  throw new Error(`内容生成失败: ${JSON.stringify(contentResult)}`);
                }

                console.log(`[${orderId}] Content generation initiated successfully`);
                console.log(`[${orderId}] Cover PDF generation initiated in parallel`);
                console.log(`[${orderId}] Note: Interior PDF will be generated automatically after all 20 chapters are complete`);
                console.log(`[${orderId}] Book status will be updated to 'completed' when both PDFs are generated`);

                return res.status(200).json({ success: true, message: '图书生成过程已启动' });
              } catch (error) {
                console.error(`[${orderId}] Error in book generation process:`, error);

                // 更新图书状态为"错误"
                try {
                  await updateBookStatus(supabaseUrl, supabaseKey, orderId, "error", error.message);
                  console.log(`[${orderId}] Book status updated to error`);
                } catch (updateError) {
                  console.error(`[${orderId}] Error updating book status:`, updateError);
                }

                return res.status(500).json({
                  success: false,
                  message: '图书生成过程出错',
                  error: error.message
                });
              }
            } else if (productId === 'love-story') {
              console.log('Starting love story book generation process');

              // 检查Supabase环境变量
              const supabaseUrl = process.env.SUPABASE_URL;
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

              // 记录环境变量状态（不记录实际值）
              console.log(`[DEBUG] Supabase环境变量检查:`, {
                SUPABASE_URL: supabaseUrl ? `已设置 (${supabaseUrl.substring(0, 10)}...)` : '未设置',
                SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? `已设置 (长度: ${supabaseKey.length})` : '未设置',
                OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '已设置' : '未设置',
                NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '未设置',
                VERCEL_URL: process.env.VERCEL_URL || '未设置'
              });

              if (!supabaseUrl || !supabaseKey) {
                console.error('[ERROR] 缺少Supabase环境变量，无法继续图书生成');
                throw new Error('Missing Supabase environment variables');
              }

              // 在数据库中更新运输信息
              try {
                // 获取Supabase凭证
                console.log("===== CALLING SUPABASE FUNCTION FOR LOVE STORY =====", {
                  supabaseUrl: supabaseUrl,
                  hasKey: !!supabaseKey,
                  keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
                  endpoint: `${supabaseUrl}/functions/v1/update-book-data`
                });

                // 更新运输地址和客户电子邮件
                const updateResponse = await fetch(
                  `${supabaseUrl}/functions/v1/update-book-data`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({
                      orderId,
                      table_name: 'love_story_books', // 指定表名
                      shipping_address: shippingAddress,
                      shipping_option: shippingOption,
                      customer_email: expandedSession.customer_details?.email,
                      shipping_level: expandedSession.total_details?.amount_shipping > 0 ? 'EXPEDITED' : 'MAIL',
                      recipient_phone: expandedSession.customer_details?.phone || '',
                      binding_type: binding_type, // 直接使用传递的binding_type，不再使用format进行回退
                      is_color: is_color === 'true' ? true : false,
                      paper_type: paper_type || 'Standard',
                      book_size: '6x9',
                      print_quantity: 1,
                      ready_for_printing: false,
                      print_attempts: 0
                    })
                  }
                );

                const updateResponseJson = await updateResponse.json().catch(e => ({ error: e.message }));
                const updateResponseText = JSON.stringify(updateResponseJson);
                console.log(`Supabase response status for love story: ${updateResponse.status}`);
                console.log(`Supabase response body for love story: ${updateResponseText}`);

                // 调用函数生成PDF
                console.log(`===== STARTING LOVE STORY PDF GENERATION FOR ORDER ${orderId} ASYNCHRONOUSLY =====`);
                try {
                  // 异步触发PDF生成，但不等待其完成
                  fetch(
                    `${supabaseUrl}/functions/v1/generate-love-story-pdfs`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                      },
                      body: JSON.stringify({ orderId })
                    }
                  ).catch(error => {
                    console.error(`Async error in Love Story PDF generation process for ${orderId}:`, error);
                  });

                  console.log(`Love Story PDF generation triggered asynchronously for order ${orderId}`);
                } catch (error) {
                  console.error(`Error triggering Love Story PDF generation for ${orderId}:`, error);
                  // 记录详细错误信息，但不终止webhook处理
                  console.error(`Error details:`, error.stack || error);
                }

                console.log(`Love Story book generation process initiated for order ${orderId}`);

                // 不再同步触发打印请求检查
                console.log('Print request check will be handled separately after PDF generation completes');
              } catch (error) {
                console.error('启动Love Story图书生成过程时出错:', error);
                console.error(error.stack); // 打印堆栈跟踪
                // 记录错误但仍向Stripe返回成功，以防止重试逻辑
              }
            }

            // 成功处理付款
            return res.status(200).json({ received: true, success: true });
          } catch (error) {
            console.error('处理成功付款时出错:', error);
            console.error(error.stack); // 打印堆栈跟踪
            // 不向客户端暴露详细错误信息
            return res.status(500).json({ error: '无法处理付款确认' });
          }
        }
    }

    // 向Stripe返回成功响应
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('处理webhook时出错:', error.message);
    console.error(error.stack); // 打印堆栈跟踪
    res.status(500).json({ error: '无法处理webhook' });
  }
}
