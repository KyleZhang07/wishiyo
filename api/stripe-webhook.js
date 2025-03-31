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
async function updateBookStatus(supabaseUrl, supabaseKey, orderId, status) {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/update-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId, status })
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
    // 获取基础URL - 在生产环境中使用域名或环境变量
    const baseUrl = process.env.VERCEL_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || 'wishiyo.com'}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    
    console.log(`Triggering print request check for orderId: ${orderId}`, {
      baseUrl,
      environment: process.env.VERCEL_ENV || 'development'
    });
    
    const response = await fetch(`${baseUrl}/api/order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        autoSubmit: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Print request check triggered successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Error triggering print request check: ${response.status} ${response.statusText}`, {
        errorText,
        baseUrl
      });
      return false;
    }
  } catch (error) {
    console.error('Error in triggerPrintRequestCheck:', error);
    return false;
  }
}

// 完整的图书生成过程，替代FormatStep.tsx中的startBookGeneration
async function generateBookProcess(supabaseUrl, supabaseKey, orderId) {
  try {
    // 添加详细的诊断日志
    console.log(`[DIAGNOSTIC] generateBookProcess parameters:`, {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlPreview: supabaseUrl?.substring(0, 30) + '...',
      hasSupabaseKey: !!supabaseKey,
      supabaseKeyLength: supabaseKey?.length,
      supabaseKeyPreview: supabaseKey?.substring(0, 10) + '...',
      orderId
    });
    
    // 测试REST API直接调用
    console.log(`[DIAGNOSTIC] Testing Supabase REST API directly...`);
    try {
      const testResponse = await fetch(
        `${supabaseUrl}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=id,title`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }
      );
      console.log(`[DIAGNOSTIC] REST API Test Response Status: ${testResponse.status}`);
      const testData = await testResponse.text();
      console.log(`[DIAGNOSTIC] REST API Test Response: ${testData}`);
    } catch (testError) {
      console.error(`[DIAGNOSTIC] REST API Test Error:`, testError);
    }
    
    // 测试Edge Function调用
    console.log(`[DIAGNOSTIC] Testing Supabase Edge Function call...`);
    try {
      const testEdgeResponse = await fetch(
        `${supabaseUrl}/functions/v1/update-book-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ orderId, status: "diagnostic_test" })
        }
      );
      console.log(`[DIAGNOSTIC] Edge Function Test Response Status: ${testEdgeResponse.status}`);
      const testEdgeData = await testEdgeResponse.text();
      console.log(`[DIAGNOSTIC] Edge Function Test Response: ${testEdgeData}`);
    } catch (testEdgeError) {
      console.error(`[DIAGNOSTIC] Edge Function Test Error:`, testEdgeError);
    }

    // 1. 将图书状态更新为"处理中"
    await updateBookStatus(supabaseUrl, supabaseKey, orderId, "processing");
    console.log(`[${orderId}] Book status set to processing`);
    
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

    // 构建完整的 API URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const contentEndpoint = `${baseUrl}/api/generate-book-content`;
    console.log(`[${orderId}] Content generation endpoint: ${contentEndpoint}`);
    
    // 3. 开始内容生成并详细记录日志
    console.log(`[${orderId}] Starting content generation with API endpoint`);
    
    // 记录图书数据（排除大型字段）
    const bookDataLog = { ...book };
    // 移除大型字段以保持日志大小可管理
    if (bookDataLog.images) delete bookDataLog.images;
    if (bookDataLog.book_content) bookDataLog.book_content = 'Truncated for logging';
    console.log(`[${orderId}] Book data for content generation:`, bookDataLog);
    
    const contentPromise = fetch(
      contentEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          orderId,
          // 直接包含必要数据以确保函数可用
          title: book.title,
          author: book.author,
          format: book.format
        })
      }
    )
      .then(response => {
        console.log(`[${orderId}] Content generation response status:`, response.status);
        // 记录响应头用于调试
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log(`[${orderId}] Content generation response headers:`, headers);
        return response;
      })
      .catch(error => {
        console.error(`[${orderId}] Error calling content generation function:`, error);
        throw error;
      });
    
    // 4. 如果图片可用，并行启动封面PDF生成
    let coverPromise = Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    if (images.frontCover && images.spine && images.backCover) {
      console.log(`[${orderId}] Starting cover PDF generation`);
      console.log(`[${orderId}] Cover images found:`, {
        frontCover: images.frontCover.substring(0, 50) + '...',
        spine: images.spine.substring(0, 50) + '...',
        backCover: images.backCover.substring(0, 50) + '...'
      });
      
      // 检查图片URL有效性
      const validateImageUrl = (url) => {
        if (!url) return false;
        // 检查是否是Supabase Storage URL
        if (url.includes('supabase.co/storage/v1/object/public/book-covers')) {
          return true;
        }
        // 支持数据URI
        if (url.startsWith('data:')) {
          return true;
        }
        // 支持其他有效URL
        try {
          new URL(url);
          return true;
        } catch (e) {
          return false;
        }
      };
      
      // 验证所有图片URL
      if (!validateImageUrl(images.frontCover) || 
          !validateImageUrl(images.spine) || 
          !validateImageUrl(images.backCover)) {
        console.warn(`[${orderId}] One or more image URLs are invalid:`, {
          frontCoverValid: validateImageUrl(images.frontCover),
          spineValid: validateImageUrl(images.spine),
          backCoverValid: validateImageUrl(images.backCover)
        });
      }
      
      const coverEndpoint = `${baseUrl}/api/generate-cover-pdf`;
      console.log(`[${orderId}] Cover PDF generation endpoint: ${coverEndpoint}`);
      
      coverPromise = fetch(
        coverEndpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            frontCover: images.frontCover, 
            spine: images.spine, 
            backCover: images.backCover,
            orderId
          })
        }
      );
    } else {
      console.warn(`[${orderId}] Missing cover images, skipping cover PDF generation`);
    }
    
    // 5. 等待内容生成完成
    const contentResponse = await contentPromise;
    const contentResult = await contentResponse.json();
    
    if (!contentResponse.ok || !contentResult.success) {
      throw new Error(`内容生成失败: ${JSON.stringify(contentResult)}`);
    }
    
    console.log(`[${orderId}] Content generation completed`);
    
    // 书籍内容生成和数据库更新已在generate-book-content函数内完成
    // 内页PDF生成也在generate-book-content函数中直接触发
    console.log(`[${orderId}] Book content generated and interior PDF generation triggered automatically`);
    
    // 获取生成的内容用于后续操作（如有需要）
    const bookContent = contentResult.bookContent;
    if (!bookContent) {
      console.warn(`[${orderId}] No book content returned from generator, but interior PDF should already be in progress`);
    }
    
    // 9. 等待封面PDF生成完成
    console.log(`[${orderId}] Waiting for cover PDF generation to complete`);
    const coverResponse = await coverPromise;
    const coverResult = await coverResponse.json();
    if (!coverResult.success) {
      throw new Error(`封面PDF生成失败: ${JSON.stringify(coverResult)}`);
    }
    
    console.log(`[${orderId}] Cover PDF generation completed`);
    
    // 封面PDF处理现在在generate-cover-pdf函数内部完成
    // 所有存储上传和数据库更新都在那里处理
    console.log(`[${orderId}] Cover PDF processed with URL: ${coverResult.coverSourceUrl || 'No URL provided'}`);
    
    // 11. 将图书状态更新为"已完成"
    console.log(`[${orderId}] Completing book generation process`);
    await updateBookStatus(supabaseUrl, supabaseKey, orderId, "completed");
    
    // 12. 设置为准备好打印 - 现在由generate-interior-pdf处理
    console.log(`[${orderId}] Book ready for printing status is managed by the interior PDF generation process`);
    
    console.log(`[${orderId}] Book generation process completed successfully`);
    
    // 触发打印请求检查
    try {
      console.log('Triggering print request check for newly completed orders...');
      await triggerPrintRequestCheck(orderId, 'funny_biography');
    } catch (printCheckError) {
      console.error('Error triggering print request check:', printCheckError);
      // 不中断处理流程
    }
    
    return { success: true, message: '图书生成成功完成' };
  } catch (error) {
    console.error(`[${orderId}] Error during book generation process:`, error);
    // 将状态更新为"失败"
    try {
      await updateBookStatus(supabaseUrl, supabaseKey, orderId, "failed");
    } catch (statusError) {
      console.error(`[${orderId}] Failed to update book status to failed:`, statusError);
    }
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  console.log("===== WEBHOOK CALLED =====");
  if (req.method !== 'POST') {
    console.log("Not a POST request:", req.method);
    return res.status(405).json({ message: '方法不允许' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // 获取原始请求体
    const rawBody = await buffer(req);
    console.log("===== REQUEST BODY RECEIVED =====", rawBody.length, "bytes");
    
    // 获取Stripe签名头
    const signature = req.headers['stripe-signature'];
    
    // 验证webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log("===== WEBHOOK SIGNATURE VERIFIED =====");
    } catch (err) {
      console.error(`Webhook签名验证失败: ${err.message}`);
      return res.status(400).json({ error: `Webhook错误: ${err.message}` });
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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // 确保支付成功
      console.log("Payment status:", session.payment_status);
      if (session.payment_status === 'paid') {
        try {
          // 获取完整的会话数据，包括客户和运输信息
          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id, {
              expand: ['customer', 'shipping', 'shipping_cost', 'line_items']
            }
          );

          // 从会话元数据中提取图书信息
          const { productId, format, title, orderId, binding_type, is_color, paper_type } = session.metadata || {};
          
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
          
          // 提取运输速度信息
          const shippingOption = expandedSession.shipping_cost ? {
            shipping_rate: expandedSession.shipping_cost.shipping_rate,
            display_name: expandedSession.shipping_cost.display_name,
            delivery_estimate: expandedSession.shipping_cost.delivery_estimate
          } : null;

          console.log('Payment successful for order', orderId);
          console.log('Product ID:', productId);
          console.log('Shipping Address:', shippingAddress);
          console.log('Shipping Option:', shippingOption);

          // 如果图书类型是funny-biography，启动生成过程
          if (productId === 'funny-biography') {
            console.log('Starting funny biography book generation process');
            
            // 检查Supabase环境变量
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
              console.error('缺少必需的Supabase环境变量');
              return res.status(200).json({ 
                received: true, 
                warning: '由于缺少配置，跳过图书生成' 
              });
            }
            
            // 在数据库中更新运输信息
            try {
              // 获取Supabase凭证
              const supabaseUrl = process.env.SUPABASE_URL;
              // 优先使用服务角色密钥，如果没有则使用匿名密钥
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
              
              console.log("===== CALLING SUPABASE FUNCTION =====", {
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
                    shipping_address: shippingAddress,
                    shipping_option: shippingOption,
                    customer_email: expandedSession.customer_details?.email,
                    shipping_level: shippingOption?.display_name === 'Express Shipping' ? 'EXPRESS' : 'GROUND',
                    recipient_phone: expandedSession.customer_details?.phone || '',
                    binding_type: binding_type || (format === 'Hardcover' ? 'hardcover' : 'softcover'),
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
              console.log(`Supabase response status: ${updateResponse.status}`);
              console.log(`Supabase response body: ${updateResponseText}`);
              
              // 启动图书生成过程
              console.log(`===== STARTING BOOK GENERATION FOR ORDER ${orderId} ASYNCHRONOUSLY =====`);
              try {
                // 完全异步触发图书生成过程，不等待其完成
                // 使用setTimeout确保这是一个完全非阻塞的操作
                setTimeout(() => {
                  generateBookProcess(supabaseUrl, supabaseKey, orderId)
                    .then(result => {
                      console.log(`Book generation process completed for order ${orderId}:`, result);
                    })
                    .catch(error => {
                      console.error(`Error in book generation process for ${orderId}:`, error);
                    });
                }, 0);
                
                console.log(`Book generation process triggered asynchronously for order ${orderId}`);
              } catch (error) {
                console.error('启动图书生成过程时出错:', error);
                console.error(error.stack); // 打印堆栈跟踪
                // 记录错误但仍继续处理
              }
            } catch (error) {
              console.error('启动图书生成过程时出错:', error);
              console.error(error.stack); // 打印堆栈跟踪
              // 记录错误但仍向Stripe返回成功，以防止重试逻辑
            }
          }
          
          // 如果图书类型是love-story，启动生成过程
          else if (productId === 'love-story') {
            console.log('Starting love story book generation process');
            
            // 检查Supabase环境变量
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
              console.error('缺少必需的Supabase环境变量');
              return res.status(200).json({ 
                received: true, 
                warning: '由于缺少配置，跳过图书生成' 
              });
            }
            
            // 在数据库中更新运输信息
            try {
              // 获取Supabase凭证
              const supabaseUrl = process.env.SUPABASE_URL;
              // 优先使用服务角色密钥，如果没有则使用匿名密钥
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
              
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
                    shipping_level: shippingOption?.display_name === 'Express Shipping' ? 'EXPRESS' : 'GROUND',
                    recipient_phone: expandedSession.customer_details?.phone || '',
                    binding_type: binding_type || (format === 'Hardcover' ? 'hardcover' : 'softcover'),
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
