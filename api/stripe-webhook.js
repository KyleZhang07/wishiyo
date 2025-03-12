import Stripe from 'stripe';
import fetch from 'node-fetch';
import { AbortController } from 'node-abort-controller';

// API config for Vercel environment
export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser
  },
};

// Helper function to create a fetch request with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  // 创建带超时的Promise
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    // 将中止信号添加到fetch选项
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

console.log("===== WEBHOOK FILE LOADED =====");

// Get raw request body from readable stream
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// 构建API基础URL - 优先使用VERCEL_URL，其次使用自定义域名，最后回退到相对路径
function getBaseUrl() {
  // Vercel自动设置的URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 自定义域名
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 本地开发或回退
  return '';
}

// Helper function to update book status
async function updateBookStatus(supabaseUrl, supabaseKey, orderId, status) {
  try {
    const baseUrl = getBaseUrl();
    // 使用新的API路由
    console.log(`[WEBHOOK:${orderId}] Updating book status to ${status}`);
    const response = await fetchWithTimeout(
      `${baseUrl}/api/update-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId, status })
      },
      15000 // 15秒超时
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update book status to ${status}: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log(`[WEBHOOK:${orderId}] Book status successfully updated to ${status}`);
    return await response.json();
  } catch (error) {
    console.error(`[WEBHOOK:${orderId}] Error updating book status to ${status}:`, error);
    throw error;
  }
}

// Full book generation process that replaces startBookGeneration from FormatStep.tsx
async function generateBookProcess(supabaseUrl, supabaseKey, orderId) {
  try {
    const baseUrl = getBaseUrl();
    // 1. Update book status to "processing"
    await updateBookStatus(supabaseUrl, supabaseKey, orderId, "processing");
    console.log(`[${orderId}] Book status set to processing`);
    
    // 2. Retrieve book data from the database to get the images
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
      throw new Error(`Failed to retrieve book data: ${getBookResponse.status}`);
    }
    
    const bookData = await getBookResponse.json();
    if (!bookData || bookData.length === 0) {
      throw new Error(`No book data found for order ID: ${orderId}`);
    }
    
    const book = bookData[0];
    const images = book.images || {};

    // 3. Start content generation
    console.log(`[${orderId}] Starting content generation`);
    const contentPromise = fetch(
      `${baseUrl}/api/generate-book-content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId })
      }
    );
    
    // 4. Start cover PDF generation in parallel if images are available
    let coverPromise = Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    if (images.frontCover && images.spine && images.backCover) {
      console.log(`[${orderId}] Starting cover PDF generation`);
      coverPromise = fetch(
        `${baseUrl}/api/generate-cover-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            frontCover: images.frontCover, 
            spine: images.spine, 
            backCover: images.backCover 
          })
        }
      );
    } else {
      console.warn(`[${orderId}] Missing cover images, skipping cover PDF generation`);
    }
    
    // 5. Wait for content generation to complete
    const contentResponse = await contentPromise;
    const contentResult = await contentResponse.json();
    
    if (!contentResponse.ok || !contentResult.success) {
      throw new Error(`Content generation failed: ${JSON.stringify(contentResult)}`);
    }
    
    console.log(`[${orderId}] Content generation completed`);
    
    // 6. Update book content in database
    const bookContent = contentResult.bookContent;
    if (bookContent) {
      console.log(`[${orderId}] Updating book content in database`);
      await fetch(
        `${baseUrl}/api/update-book-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ orderId, bookContent })
        }
      );
    }
    
    // 7. Generate interior PDF
    console.log(`[${orderId}] Starting interior PDF generation`);
    const interiorResponse = await fetchWithTimeout(
      `${baseUrl}/api/generate-interior-pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId })
      },
      60000 // PDF生成可能需要更长时间，设置60秒超时
    );
    
    const interiorResult = await interiorResponse.json();
    if (!interiorResponse.ok || !interiorResult.success) {
      throw new Error(`Interior PDF generation failed: ${JSON.stringify(interiorResult)}`);
    }
    
    console.log(`[${orderId}] Interior PDF generation completed`);
    
    // 8. Update interior PDF in database
    const interiorPdf = interiorResult.pdfOutput || interiorResult.pdf;
    if (interiorPdf) {
      console.log(`[${orderId}] Updating interior PDF in database`);
      await fetch(
        `${baseUrl}/api/update-book-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ orderId, interiorPdf })
        }
      );
    }
    
    // 9. Wait for cover PDF generation to complete
    console.log(`[${orderId}] Waiting for cover PDF generation to complete`);
    const coverResponse = await coverPromise;
    const coverResult = await coverResponse.json();
    if (!coverResult.success) {
      throw new Error(`Cover PDF generation failed: ${JSON.stringify(coverResult)}`);
    }
    
    console.log(`[${orderId}] Cover PDF generation completed`);
    
    // 10. Update cover PDF in database
    const coverPdf = coverResult.pdfOutput || coverResult.pdf;
    if (coverPdf) {
      console.log(`[${orderId}] Updating cover PDF in database`);
      await fetch(
        `${baseUrl}/api/update-book-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ orderId, coverPdf })
        }
      );
    }
    
    // 11. Update book status to "completed"
    console.log(`[${orderId}] Completing book generation process`);
    await updateBookStatus(supabaseUrl, supabaseKey, orderId, "completed");
    
    // 12. 设置为准备好打印
    console.log(`[${orderId}] Setting book ready for printing`);
    // 获取PDF存储URL，准备LuluPress集成
    try {
      // 获取内部和封面PDF公共URL
      const bookResponse = await fetch(
        `${supabaseUrl}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=interior_pdf,cover_pdf,book_content`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }
      );
      
      if (bookResponse.ok) {
        const bookData = await bookResponse.json();
        if (bookData && bookData.length > 0) {
          const book = bookData[0];
          
          // 假设PDF已经存储到可访问的URL
          const interiorPdfUrl = book.interior_pdf || '';
          const coverPdfUrl = book.cover_pdf || '';
          
          // 设置书籍为准备打印状态
          if (interiorPdfUrl && coverPdfUrl) {
            await fetch(
              `${baseUrl}/api/update-book-data`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ 
                  orderId, 
                  cover_source_url: coverPdfUrl,
                  interior_source_url: interiorPdfUrl,
                  ready_for_printing: true,
                  // 设置页数（简单估算，每页约500字符）
                  page_count: book.book_content ? Math.ceil(book.book_content.length / 500) : 100
                })
              }
            );
            console.log(`[${orderId}] Book set as ready for printing`);
          } else {
            console.warn(`[${orderId}] Missing PDF files, book not ready for printing`);
          }
        }
      }
    } catch (pdfError) {
      console.error(`[${orderId}] Error setting book ready for printing:`, pdfError);
      // 不抛出错误，让流程继续
    }
    
    console.log(`[${orderId}] Book generation process completed successfully`);
    return { success: true, message: 'Book generation completed successfully' };
  } catch (error) {
    console.error(`[${orderId}] Error during book generation process:`, error);
    // Update status to "failed"
    try {
      await updateBookStatus(supabaseUrl, supabaseKey, orderId, "failed");
    } catch (statusError) {
      console.error(`[${orderId}] Failed to update book status to failed:`, statusError);
    }
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const startTime = Date.now();
  console.log(`[WEBHOOK:${requestId}] ===== WEBHOOK CALLED =====`);
  if (req.method !== 'POST') {
    console.log(`[WEBHOOK:${requestId}] Not a POST request:`, req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Get raw request body
    const bufferStart = Date.now();
    const rawBody = await buffer(req);
    console.log(`[WEBHOOK:${requestId}] ===== REQUEST BODY RECEIVED ===== ${rawBody.length} bytes in ${Date.now() - bufferStart}ms`);
    
    // Get Stripe signature header
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log(`[WEBHOOK:${requestId}] ===== WEBHOOK SIGNATURE VERIFIED =====`);
    } catch (err) {
      console.error(`[WEBHOOK:${requestId}] Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Check for required environment variables
    console.log(`[WEBHOOK:${requestId}] Environment variables check:`, {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Handle payment success event
    console.log(`[WEBHOOK:${requestId}] ===== EVENT TYPE:`, event.type, "=====");
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Ensure payment was successful
      console.log("Payment status:", session.payment_status);
      if (session.payment_status === 'paid') {
        try {
          // Get full session data including customer and shipping info
          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id, {
              expand: ['customer', 'shipping', 'shipping_cost', 'line_items']
            }
          );

          // Extract book info from session metadata
          const { productId, format, title, orderId, binding_type, is_color, paper_type } = session.metadata || {};
          
          if (!productId) {
            console.warn('Missing productId in session metadata');
            return res.status(200).json({ received: true, warning: 'Missing productId in metadata' });
          }

          // Extract shipping address info
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
          
          // Extract shipping speed info
          const shippingOption = expandedSession.shipping_cost ? {
            shipping_rate: expandedSession.shipping_cost.shipping_rate,
            display_name: expandedSession.shipping_cost.display_name,
            delivery_estimate: expandedSession.shipping_cost.delivery_estimate
          } : null;

          console.log('Payment successful for order', orderId);
          console.log('Product ID:', productId);
          console.log('Shipping Address:', shippingAddress);
          console.log('Shipping Option:', shippingOption);

          // If the book type is funny-biography, start the generation process
          if (productId === 'funny-biography') {
            console.log('Starting funny biography book generation process');
            
            // Check Supabase environment variables
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
              console.error('Missing required Supabase environment variables');
              return res.status(200).json({ 
                received: true, 
                warning: 'Book generation skipped due to missing configuration' 
              });
            }
            
            // Update shipping info in database
            try {
              const supabaseUrl = process.env.SUPABASE_URL;
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
              const baseUrl = getBaseUrl();
              
              console.log("===== CALLING API ROUTE =====", {
                supabaseUrl: supabaseUrl,
                hasKey: !!supabaseKey,
                endpoint: `${baseUrl}/api/update-book-data`
              });
              
              // Update shipping address and customer email
              const updateResponse = await fetchWithTimeout(
                `${baseUrl}/api/update-book-data`,
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
                },
                15000 // 15秒超时
              );
              
              const updateResponseText = await updateResponse.text();
              console.log(`Supabase response status: ${updateResponse.status}`);
              console.log(`Supabase response body: ${updateResponseText}`);
              
              // Start the book generation process
              // This runs asynchronously without waiting for completion
              console.log(`===== STARTING BOOK GENERATION FOR ORDER ${orderId} =====`);
              generateBookProcess(supabaseUrl, supabaseKey, orderId)
                .then(result => {
                  console.log(`Book generation process result for ${orderId}:`, result);
                })
                .catch(error => {
                  console.error(`Error in book generation process for ${orderId}:`, error);
                });
              
              console.log(`Book generation process initiated for order ${orderId}`);
            } catch (error) {
              console.error('Error starting book generation process:', error);
              console.error(error.stack); // Print stack trace
              // Log error but still return success to Stripe to prevent retry logic
            }
          }

          // Successfully processed payment
          return res.status(200).json({ received: true, success: true });
        } catch (error) {
          console.error('Error processing successful payment:', error);
          console.error(error.stack); // Print stack trace
          // Don't expose detailed error info to client
          return res.status(500).json({ error: 'Failed to process payment confirmation' });
        }
      }
    }

    // Return success response to Stripe
    const totalTime = Date.now() - startTime;
    console.log(`[WEBHOOK:${requestId}] Completed webhook processing in ${totalTime}ms`);
    return res.status(200).json({ received: true });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[WEBHOOK:${requestId}] Error processing webhook in ${totalTime}ms:`, error.message);
    console.error(error.stack); // Print stack trace
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
