// Vercel Serverless Function for sending order verification code
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 初始化环境变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  console.log('[DEBUG] Starting send-order-verification function');

  try {
    // 检查环境变量
    console.log('[DEBUG] Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasResendApiKey: !!resendApiKey,
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      resendKeyLength: resendApiKey ? resendApiKey.length : 0
    });

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      console.error('[ERROR] Missing required environment variables');
      return res.status(500).json({ success: false, error: '必要的环境变量未设置' });
    }

    // 初始化Supabase和Resend客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // 解析请求数据
    console.log('[DEBUG] Parsing request data');
    const { email } = req.body;
    console.log(`[DEBUG] Received verification request for email: ${email ? email.substring(0, 3) + '***' : 'undefined'}`);

    if (!email) {
      console.log('[DEBUG] Missing email in request');
      return res.status(400).json({ success: false, error: '邮箱是必填项' });
    }

    // 生成6位随机验证码
    console.log('[DEBUG] Generating verification code');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[DEBUG] Verification code generated');

    // 设置过期时间（15分钟后）
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    console.log(`[DEBUG] Expiration time set to: ${expiresAt}`);

    // 检查是否已经发送过验证码给该邮箱（例如，过去24小时内）
    console.log('[DEBUG] Checking recent verification attempts');
    const { data: recentVerifications, error: recentError } = await supabase
      .from('order_verifications')
      .select('created_at')
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('[ERROR] Failed to check recent verifications:', recentError);
    } else {
      console.log(`[DEBUG] Found ${recentVerifications?.length || 0} recent verification attempts`);
    }

    // 如果24小时内已经发送了超过5次验证码，则拒绝请求
    if (recentVerifications && recentVerifications.length >= 5) {
      console.log('[DEBUG] Too many verification attempts');
      return res.status(429).json({
        success: false,
        error: "您已超过验证码请求限制，请24小时后再试"
      });
    }

    // 将验证码保存到数据库
    console.log('[DEBUG] Saving verification code to database');
    const { data: insertData, error: insertError } = await supabase
      .from('order_verifications')
      .insert([
        {
          email,
          code,
          expires_at: expiresAt,
          is_used: false
        }
      ]);

    if (insertError) {
      console.error('[ERROR] Failed to save verification code:', insertError);
      throw new Error(`验证码保存失败: ${insertError.message}`);
    }

    console.log('[DEBUG] Verification code saved successfully');

    // 发送邮件
    console.log('[DEBUG] Sending verification email');
    try {
      const emailResponse = await resend.emails.send({
        from: "WISHIYO <verify@wishiyo.com>",
        to: [email],
        subject: "订单查询验证码",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://wishiyo.com/logo.png" alt="WISHIYO Logo" style="height: 40px;">
            </div>
            <h2 style="color: #333; text-align: center;">您的订单查询验证码</h2>
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
              ${code}
            </div>
            <p style="color: #666; margin-bottom: 20px; text-align: center;">
              此验证码将在 15 分钟内有效。请勿将验证码分享给他人。
            </p>
            <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center; color: #999; font-size: 12px;">
              <p>此邮件由系统自动发送，请勿回复。</p>
              <p>&copy; ${new Date().getFullYear()} WISHIYO. All rights reserved.</p>
            </div>
          </div>
        `
      });

      console.log('[DEBUG] Email sent successfully:', {
        id: emailResponse.id,
        status: 'sent'
      });
    } catch (emailError) {
      console.error('[ERROR] Failed to send email:', emailError);
      
      // 即使邮件发送失败，我们也返回成功，因为验证码已经保存到数据库
      // 用户可以请求重新发送验证码
      console.log('[DEBUG] Returning success despite email failure');
      return res.status(200).json({
        success: true,
        message: "验证码已发送，但邮件发送可能失败，请稍后重试或检查垃圾邮件"
      });
    }

    console.log('[DEBUG] Verification process completed successfully');
    return res.status(200).json({
      success: true,
      message: "验证码已发送到您的邮箱"
    });
  } catch (error) {
    console.error(`[ERROR] 验证码发送失败: ${error.message}`);
    console.error('[ERROR] Error stack:', error.stack || 'No stack trace available');

    // 检查是否与配额相关
    const isQuotaError = error.message && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded') ||
      error.message.includes('capacity')
    );

    if (isQuotaError) {
      console.error('[ERROR] This appears to be a quota or capacity related error');
      // 记录当前内存使用情况
      try {
        const memoryInfo = process.memoryUsage();
        console.error('[ERROR] Memory usage at error time:', memoryInfo);
      } catch (memError) {
        console.error('[ERROR] Could not get memory usage info');
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: isQuotaError ? 'quota_exceeded' : 'general_error'
    });
  }
}
