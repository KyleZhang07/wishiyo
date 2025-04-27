
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: '请提供优惠码'
      });
    }

    // Current date in ISO format
    const now = new Date().toISOString();

    // Query the database for the promotion code
    const { data, error } = await supabase
      .from('promotion_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .single();

    if (error || !data) {
      console.log("Error or no data:", error);
      return res.status(200).json({
        valid: false,
        message: '优惠码无效或已过期'
      });
    }

    // Check if the code has reached its usage limit
    if (data.usage_limit !== null && data.usage_count >= data.usage_limit) {
      return res.status(200).json({
        valid: false,
        message: '优惠码已达到使用上限'
      });
    }

    // Increment the usage count
    const { error: updateError } = await supabase
      .from('promotion_codes')
      .update({ usage_count: data.usage_count + 1 })
      .eq('id', data.id);

    if (updateError) {
      console.log("Error updating usage count:", updateError);
    }

    // Return the valid promotion code details
    return res.status(200).json({
      valid: true,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      product_type: data.product_type
    });
  } catch (err) {
    console.error('Error processing promotion code:', err);
    return res.status(500).json({
      valid: false,
      message: '处理优惠码时出错'
    });
  }
}
