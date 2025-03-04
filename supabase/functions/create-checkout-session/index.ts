
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { stripe } from '../_shared/stripe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { bookInfo, shippingAddress } = await req.json()
    
    if (!bookInfo || !bookInfo.title || !bookInfo.price) {
      return new Response(
        JSON.stringify({ error: 'Missing required book information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Format price for Stripe (convert to cents)
    const unitAmount = Math.round(parseFloat(bookInfo.price) * 100)
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bookInfo.title,
              description: bookInfo.format || 'Paperback',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/user-center`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'CN'],
      },
      metadata: {
        bookTitle: bookInfo.title,
        bookFormat: bookInfo.format,
        orderId: bookInfo.orderId || 'WY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
