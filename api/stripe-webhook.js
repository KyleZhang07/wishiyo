import Stripe from 'stripe';
import fetch from 'node-fetch';

// API config for Vercel environment
export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser
  },
};

console.log("===== WEBHOOK FILE LOADED =====");

// Get raw request body from readable stream
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper function to update book status
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
      throw new Error(`Failed to update book status: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating book status:', error);
    throw error;
  }
}

// 辅助函数：将PDF数据上传到存储桶并返回公共URL
async function uploadPdfToStorage(supabaseUrl, supabaseKey, orderId, pdfData, fileName) {
  try {
    console.log(`[${orderId}] Uploading ${fileName} to storage...`);
    
    // 从base64 Data URI中提取PDF数据
    let pdfContent = pdfData;
    if (pdfData.startsWith('data:')) {
      pdfContent = pdfData.split(',')[1];
    }
    const pdfBuffer = Buffer.from(pdfContent, 'base64');
    
    // 上传到Supabase Storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/book-covers/${orderId}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'Authorization': `Bearer ${supabaseKey}`,
          'x-upsert': 'true'
        },
        body: pdfBuffer
      }
    );
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload PDF: ${await uploadResponse.text()}`);
    }
    
    console.log(`[${orderId}] PDF uploaded successfully to storage`);
    
    // 获取公共URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/book-covers/${orderId}/${fileName}`;
    console.log(`[${orderId}] Generated URL: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`[${orderId}] Error uploading PDF to storage:`, error);
    return null;
  }
}

// Full book generation process that replaces startBookGeneration from FormatStep.tsx
async function generateBookProcess(supabaseUrl, supabaseKey, orderId) {
  try {
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
    
    // Log detailed image data for debugging
    console.log(`[${orderId}] Images data check:`, {
      hasImagesObject: !!book.images,
      hasFrontCover: !!(book.images && book.images.frontCover),
      frontCoverLength: book.images && book.images.frontCover ? book.images.frontCover.substring(0, 30) + '...' : 'N/A',
      hasSpine: !!(book.images && book.images.spine),
      spineLength: book.images && book.images.spine ? book.images.spine.substring(0, 30) + '...' : 'N/A',
      hasBackCover: !!(book.images && book.images.backCover),
      backCoverLength: book.images && book.images.backCover ? book.images.backCover.substring(0, 30) + '...' : 'N/A'
    });

    // 3. Start content generation with Vercel serverless function
    console.log(`[${orderId}] Starting content generation with Vercel function`);
    console.log(`[${orderId}] Content generation endpoint: /api/generate-book-content`);
    
    // Log book data (excluding large fields)
    const bookDataLog = { ...book };
    // Remove large fields to keep log size manageable
    if (bookDataLog.images) delete bookDataLog.images;
    if (bookDataLog.book_content) bookDataLog.book_content = 'Truncated for logging';
    console.log(`[${orderId}] Book data for content generation:`, bookDataLog);
    
    // Get host URL for API calls to our own Vercel functions
    const hostUrl = process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000';
    
    const contentPromise = fetch(
      `${hostUrl}/api/generate-book-content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderId,
          // Include essential data directly to ensure it's available to the function
          title: book.title,
          author: book.author,
          format: book.format
        })
      }
    )
      .then(response => {
        console.log(`[${orderId}] Content generation response status:`, response.status);
        // Log response headers for debugging
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
    
    // 4. Start cover PDF generation in parallel if images are available
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
      
      // Get host URL for API calls to our own Vercel functions
      const hostUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3000';
      
      coverPromise = fetch(
        `${hostUrl}/api/generate-cover-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
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
    // Extract book content from result
    const bookContent = contentResult.bookContent;
    console.log(`[${orderId}] Book content generation result:`, {
      hasBookContent: !!bookContent,
      contentLength: bookContent ? bookContent.length : 0,
      contentPreview: bookContent ? bookContent.substring(0, 100) + '...' : 'No content'
    });
    
    if (bookContent) {
      console.log(`[${orderId}] Updating book content in database`);
      const contentUpdateResponse = await fetch(
        `${supabaseUrl}/functions/v1/update-book-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ orderId, bookContent })
        }
      );
      
      // Log content update response
      console.log(`[${orderId}] Book content database update status:`, contentUpdateResponse.status);
      const contentUpdateResult = await contentUpdateResponse.text();
      console.log(`[${orderId}] Book content database update result:`, contentUpdateResult);
    } else {
      console.warn(`[${orderId}] No book content received from generator, using existing content if available`);
    }
    
    // 7. Generate interior PDF with detailed logging
    console.log(`[${orderId}] Starting interior PDF generation`);
    console.log(`[${orderId}] Interior PDF generation endpoint: /api/generate-interior-pdf`);
    
    try {
      // Check if book content is available
      if (!bookContent) {
        console.warn(`[${orderId}] No book content available for interior PDF generation. Using fallback content.`);
      }
      
      // Get host URL for API calls to our own Vercel functions
      const hostUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3000';
      
      const interiorResponse = await fetch(
        `${hostUrl}/api/generate-interior-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            orderId,
            // Include content directly to ensure it's available to the function
            bookContent: bookContent || "Default book content if none is available.",
            bookTitle: book.title || "Custom Book",
            authorName: book.author || "Unknown Author"
          })
        }
      );
      
      // Log response details
      console.log(`[${orderId}] Interior PDF response status:`, interiorResponse.status);
      
      // Log response headers for debugging
      const interiorHeaders = {};
      interiorResponse.headers.forEach((value, key) => {
        interiorHeaders[key] = value;
      });
      console.log(`[${orderId}] Interior PDF response headers:`, interiorHeaders);
      
      // Parse response
      const interiorResult = await interiorResponse.json();
      
      if (!interiorResponse.ok || !interiorResult.success) {
        console.error(`[${orderId}] Interior PDF generation failed:`, JSON.stringify(interiorResult));
        throw new Error(`Interior PDF generation failed: ${JSON.stringify(interiorResult)}`);
      }
      
      console.log(`[${orderId}] Interior PDF generation completed successfully`);
      
      // 8. Update interior PDF in database
      const interiorPdf = interiorResult.pdfOutput || interiorResult.pdf;
      if (interiorPdf) {
        console.log(`[${orderId}] Updating interior PDF in database with length ${interiorPdf.length} chars`);
        const updateResponse = await fetch(
          `${supabaseUrl}/functions/v1/update-book-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ orderId, interiorPdf })
          }
        );
        
        // Log update response
        console.log(`[${orderId}] Interior PDF database update status:`, updateResponse.status);
        const updateResult = await updateResponse.text();
        console.log(`[${orderId}] Interior PDF database update result:`, updateResult);
      } else {
        console.warn(`[${orderId}] No interior PDF output received, skipping database update`);
      }
    } catch (error) {
      console.error(`[${orderId}] Error in interior PDF generation process:`, error);
      // Don't throw the error so we can still try to process the cover
      console.log(`[${orderId}] Continuing with process despite interior PDF generation error`);
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
      
      // 首先上传PDF到存储桶以获取URL
      try {
        console.log(`[${orderId}] Uploading cover PDF to storage...`);
        // 从base64 Data URI中提取PDF数据
        const pdfData = coverPdf.split(',')[1];
        const pdfBuffer = Buffer.from(pdfData, 'base64');
        
        // 上传到Supabase REST API
        const uploadResponse = await fetch(
          `${supabaseUrl}/storage/v1/object/book-covers/${orderId}/cover-full.pdf`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/pdf',
              'Authorization': `Bearer ${supabaseKey}`,
              'x-upsert': 'true'
            },
            body: pdfBuffer
          }
        );
        
        if (!uploadResponse.ok) {
          console.error(`[${orderId}] Failed to upload cover PDF:`, await uploadResponse.text());
        } else {
          console.log(`[${orderId}] Cover PDF uploaded successfully to storage`);
          
          // 获取公共URL
          const publicUrlResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/public/book-covers/${orderId}/cover-full.pdf`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`
              }
            }
          );
          
          if (publicUrlResponse.ok) {
            const urlData = await publicUrlResponse.json();
            const coverSourceUrl = urlData.publicUrl || `${supabaseUrl}/storage/v1/object/public/book-covers/${orderId}/cover-full.pdf`;
            
            console.log(`[${orderId}] Generated cover_source_url:`, coverSourceUrl);
            
            // 更新数据库，包含PDF数据和URL
            await fetch(
              `${supabaseUrl}/functions/v1/update-book-data`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ 
                  orderId, 
                  coverPdf,
                  cover_source_url: coverSourceUrl
                })
              }
            );
            
            console.log(`[${orderId}] Database updated with coverPdf and cover_source_url`);
            return;
          }
        }
      } catch (uploadError) {
        console.error(`[${orderId}] Error during PDF upload:`, uploadError);
      }
      
      // 如果上传失败，仍然保存PDF到数据库
      await fetch(
        `${supabaseUrl}/functions/v1/update-book-data`,
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
        `${supabaseUrl}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=interior_pdf,cover_pdf,book_content,cover_source_url,interior_source_url`,
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
          
          // 首选使用已存储的source_url字段，如果没有则使用内部PDF数据
          const interiorSourceUrl = book.interior_source_url || '';
          const coverSourceUrl = book.cover_source_url || '';
          
          // 确保至少有一个有效的URL
          const hasValidInteriorUrl = !!interiorSourceUrl;
          const hasValidCoverUrl = !!coverSourceUrl;
          
          console.log(`[${orderId}] PDF URL check:`, { 
            hasValidInteriorUrl, 
            hasValidCoverUrl,
            interiorSourceUrl: interiorSourceUrl ? interiorSourceUrl.substring(0, 50) + '...' : 'N/A',
            coverSourceUrl: coverSourceUrl ? coverSourceUrl.substring(0, 50) + '...' : 'N/A'
          });
          
          // 设置书籍为准备打印状态
          if (hasValidInteriorUrl && hasValidCoverUrl) {
            await fetch(
              `${supabaseUrl}/functions/v1/update-book-data`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ 
                  orderId, 
                  cover_source_url: coverSourceUrl,
                  interior_source_url: interiorSourceUrl,
                  ready_for_printing: true,
                  // 设置页数（简单估算，每页约500字符）
                  page_count: book.book_content ? Math.ceil(book.book_content.length / 500) : 100
                })
              }
            );
            console.log(`[${orderId}] Book set as ready for printing`);
          } else {
            console.warn(`[${orderId}] Missing PDF URLs, book not ready for printing`);
            
            // 处理缺失的URL
            let updatedCoverUrl = coverSourceUrl;
            let updatedInteriorUrl = interiorSourceUrl;
            let needsUpdate = false;
            
            // 如果缺少封面URL但有PDF数据，创建URL
            if (!hasValidCoverUrl && book.cover_pdf) {
              console.log(`[${orderId}] Cover URL missing but PDF data available. Creating URL...`);
              updatedCoverUrl = await uploadPdfToStorage(
                supabaseUrl, 
                supabaseKey, 
                orderId, 
                book.cover_pdf, 
                'cover-full.pdf'
              );
              
              if (updatedCoverUrl) {
                console.log(`[${orderId}] Created cover URL: ${updatedCoverUrl}`);
                needsUpdate = true;
              }
            }
            
            // 如果缺少内页URL但有PDF数据，创建URL
            if (!hasValidInteriorUrl && book.interior_pdf) {
              console.log(`[${orderId}] Interior URL missing but PDF data available. Creating URL...`);
              updatedInteriorUrl = await uploadPdfToStorage(
                supabaseUrl, 
                supabaseKey, 
                orderId, 
                book.interior_pdf, 
                'interior.pdf'
              );
              
              if (updatedInteriorUrl) {
                console.log(`[${orderId}] Created interior URL: ${updatedInteriorUrl}`);
                needsUpdate = true;
              }
            }
            
            // 如果创建了新的URL，更新数据库
            if (needsUpdate) {
              console.log(`[${orderId}] Updating database with new PDF URLs`);
              
              const updateData = {
                orderId
              };
              
              if (updatedCoverUrl) {
                updateData.cover_source_url = updatedCoverUrl;
              }
              
              if (updatedInteriorUrl) {
                updateData.interior_source_url = updatedInteriorUrl;
              }
              
              // 如果两个URL都有，设置为准备打印
              if (updatedCoverUrl && updatedInteriorUrl) {
                updateData.ready_for_printing = true;
                updateData.page_count = book.book_content ? Math.ceil(book.book_content.length / 500) : 100;
              }
              
              await fetch(
                `${supabaseUrl}/functions/v1/update-book-data`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                  },
                  body: JSON.stringify(updateData)
                }
              );
              
              console.log(`[${orderId}] Database updated with new PDF URLs`);
            }
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
  console.log("===== WEBHOOK CALLED =====");
  if (req.method !== 'POST') {
    console.log("Not a POST request:", req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Get raw request body
    const rawBody = await buffer(req);
    console.log("===== REQUEST BODY RECEIVED =====", rawBody.length, "bytes");
    
    // Get Stripe signature header
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log("===== WEBHOOK SIGNATURE VERIFIED =====");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Check for required environment variables
    console.log("Environment variables check:", {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
    });

    // Handle payment success event
    console.log("===== EVENT TYPE:", event.type, "=====");
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
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
              console.error('Missing required Supabase environment variables');
              return res.status(200).json({ 
                received: true, 
                warning: 'Book generation skipped due to missing configuration' 
              });
            }
            
            // Update shipping info in database
            try {
              const supabaseUrl = process.env.SUPABASE_URL;
              const supabaseKey = process.env.SUPABASE_ANON_KEY;
              
              console.log("===== CALLING SUPABASE FUNCTION =====", {
                supabaseUrl: supabaseUrl,
                hasKey: !!supabaseKey,
                endpoint: `${supabaseUrl}/functions/v1/update-book-data`
              });
              
              // Update shipping address and customer email
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
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    console.error(error.stack); // Print stack trace
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
