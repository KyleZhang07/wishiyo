
import Stripe from 'stripe';
import { supabase } from '../src/integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { session_id, order_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Retrieve the session to verify it exists and was paid
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if the payment was successful
    if (session.payment_status === 'paid') {
      // If order_id is provided, retrieve the order data from Supabase
      let orderData = null;
      
      if (order_id) {
        const { data, error } = await supabase
          .from('book_orders')
          .select('*')
          .eq('order_id', order_id)
          .single();
          
        if (error) {
          console.error('Error retrieving order data:', error);
        } else {
          orderData = data;
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        orderData
      });
    } else {
      return res.status(200).json({ 
        success: false, 
        paymentStatus: session.payment_status
      });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}
