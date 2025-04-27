import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export default async function handler(req, res) {
  // 初始化 Supabase 客户端
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 初始化 Stripe 客户端
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.error('Missing Stripe secret key');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }
  
  const stripe = new Stripe(stripeSecretKey);

  // 处理 GET 请求 - 获取促销码列表
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('promotion_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error fetching promotion codes:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch promotion codes' });
    }
  }

  // 处理 POST 请求 - 创建新促销码
  if (req.method === 'POST') {
    try {
      const {
        code,
        description,
        discount_type,
        discount_value,
        min_purchase_amount = 0,
        max_discount_amount = null,
        start_date,
        end_date,
        is_active = true,
        usage_limit = null,
        product_type = null
      } = req.body;

      // 验证必要字段
      if (!code || !discount_type || !discount_value || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // 创建 Stripe 优惠券
      let stripeCoupon;
      if (discount_type === 'percentage') {
        stripeCoupon = await stripe.coupons.create({
          percent_off: discount_value,
          duration: 'once',
          name: description || `${discount_value}% off`,
          max_redemptions: usage_limit || undefined
        });
      } else {
        stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(discount_value * 100), // 转换为美分
          currency: 'usd',
          duration: 'once',
          name: description || `$${discount_value} off`,
          max_redemptions: usage_limit || undefined
        });
      }

      // 创建 Stripe 促销码
      const stripePromoCode = await stripe.promotionCodes.create({
        coupon: stripeCoupon.id,
        code: code,
        active: is_active,
        expires_at: Math.floor(new Date(end_date).getTime() / 1000)
      });

      // 将促销码保存到数据库
      const { data, error } = await supabase
        .from('promotion_codes')
        .insert({
          code,
          description,
          discount_type,
          discount_value,
          min_purchase_amount,
          max_discount_amount,
          start_date,
          end_date,
          is_active,
          usage_limit,
          product_type,
          stripe_coupon_id: stripeCoupon.id,
          stripe_promotion_code_id: stripePromoCode.id
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data,
        stripe: {
          coupon: stripeCoupon,
          promotionCode: stripePromoCode
        }
      });
    } catch (error) {
      console.error('Error creating promotion code:', error);
      return res.status(500).json({ success: false, error: 'Failed to create promotion code' });
    }
  }

  // 处理 PATCH 请求 - 更新促销码
  if (req.method === 'PATCH') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing promotion code ID'
        });
      }

      // 获取当前促销码信息
      const { data: existingCode, error: fetchError } = await supabase
        .from('promotion_codes')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingCode) {
        return res.status(404).json({
          success: false,
          error: 'Promotion code not found'
        });
      }

      // 更新 Stripe 促销码状态（如果需要）
      if ('is_active' in updateData && existingCode.stripe_promotion_code_id) {
        await stripe.promotionCodes.update(
          existingCode.stripe_promotion_code_id,
          { active: updateData.is_active }
        );
      }

      // 更新数据库中的促销码
      const { data, error } = await supabase
        .from('promotion_codes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error updating promotion code:', error);
      return res.status(500).json({ success: false, error: 'Failed to update promotion code' });
    }
  }

  // 处理 DELETE 请求 - 删除促销码
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing promotion code ID'
        });
      }

      // 获取当前促销码信息
      const { data: existingCode, error: fetchError } = await supabase
        .from('promotion_codes')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingCode) {
        return res.status(404).json({
          success: false,
          error: 'Promotion code not found'
        });
      }

      // 禁用 Stripe 促销码（而不是删除）
      if (existingCode.stripe_promotion_code_id) {
        await stripe.promotionCodes.update(
          existingCode.stripe_promotion_code_id,
          { active: false }
        );
      }

      // 从数据库中删除促销码
      const { error } = await supabase
        .from('promotion_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting promotion code:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete promotion code' });
    }
  }

  // 如果请求方法不支持
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
