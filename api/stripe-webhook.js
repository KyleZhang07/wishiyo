import Stripe from 'stripe';
import fetch from 'node-fetch';

// API config for Vercel environment
export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser
  },
};

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

    // 3. Start content generation
    console.log(`[${orderId}] Starting content generation`);
    const contentPromise = fetch(
      `${supabaseUrl}/functions/v1/generate-book-content`,
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
        `${supabaseUrl}/functions/v1/generate-cover-pdf`,
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
    }
    
    // 7. Generate interior PDF
    console.log(`[${orderId}] Starting interior PDF generation`);
    const interiorResponse = await fetch(
      `${supabaseUrl}/functions/v1/generate-interior-pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ orderId })
      }
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Get raw request body
    const rawBody = await buffer(req);
    
    // Get Stripe signature header
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Check for required environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing required environment variables for Stripe webhook');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Handle payment success event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Ensure payment was successful
      if (session.payment_status === 'paid') {
        try {
          // Get full session data including customer and shipping info
          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id, {
              expand: ['customer', 'shipping', 'shipping_cost', 'line_items']
            }
          );

          // Extract book info from session metadata
          const { productId, format, title, orderId } = session.metadata || {};
          
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
            if (!process.env.SUPABASE_FUNCTIONS_URL || !process.env.SUPABASE_ANON_KEY) {
              console.error('Missing required Supabase environment variables');
              return res.status(200).json({ 
                received: true, 
                warning: 'Book generation skipped due to missing configuration' 
              });
            }
            
            // Update shipping info in database
            try {
              const supabaseUrl = process.env.SUPABASE_FUNCTIONS_URL;
              const supabaseKey = process.env.SUPABASE_ANON_KEY;
              
              // Update shipping address and customer email
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
                    shipping_address: shippingAddress,
                    shipping_option: shippingOption,
                    customer_email: expandedSession.customer_details?.email
                  })
                }
              );
              
              // Start the book generation process
              // This runs asynchronously without waiting for completion
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
              // Log error but still return success to Stripe to prevent retry logic
            }
          }

          // Successfully processed payment
          return res.status(200).json({ received: true, success: true });
        } catch (error) {
          console.error('Error processing successful payment:', error);
          // Don't expose detailed error info to client
          return res.status(500).json({ error: 'Failed to process payment confirmation' });
        }
      }
    }

    // Return success response to Stripe
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
