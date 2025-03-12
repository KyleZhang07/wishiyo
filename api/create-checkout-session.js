
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../src/integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { productId, title, format, price, quantity, userData } = req.body;

    if (!productId || !title || !format || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields for checkout' });
    }

    // Generate order ID
    const orderId = `order_${uuidv4()}`;

    // Save userData to Supabase instead of passing it through Stripe
    if (userData) {
      try {
        const { error } = await supabase
          .from('book_orders')
          .insert({
            order_id: orderId,
            product_id: productId,
            title,
            format,
            price,
            user_data: userData
          });

        if (error) {
          console.error('Error saving order data to Supabase:', error);
          return res.status(500).json({ error: 'Failed to save order data' });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Database error' });
      }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Format price for Stripe (convert to cents)
    const unitPrice = Math.round(parseFloat(price) * 100);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: `${format} edition`,
              metadata: {
                productId
              }
            },
            unit_amount: unitPrice
          },
          quantity
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.origin}/create/${productId === 'love-story' ? 'love/love-story' : 'friends/funny-biography'}/format`,
      metadata: {
        orderId,
        productId
      }
    });
    
    return res.status(200).json({ url: session.url, orderId });
  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
