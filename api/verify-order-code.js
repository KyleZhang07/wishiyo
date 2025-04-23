// Vercel Serverless Function for order verification
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { TextEncoder } from 'util';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;

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

  console.log('[DEBUG] Starting verify-order-code function');

  try {
    // 检查环境变量
    console.log('[DEBUG] Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasJwtSecret: !!jwtSecret,
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      jwtSecretLength: jwtSecret ? jwtSecret.length : 0
    });

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
      console.error('[ERROR] Missing required environment variables');
      return res.status(500).json({ success: false, error: '必要的环境变量未设置' });
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析请求数据
    console.log('[DEBUG] Parsing request data');
    const { email, code } = req.body;
    console.log(`[DEBUG] Received verification request for email: ${email ? email.substring(0, 3) + '***' : 'undefined'}, code: ${code ? '*****' : 'undefined'}`);

    if (!email || !code) {
      console.log('[DEBUG] Missing email or code in request');
      return res.status(400).json({ success: false, error: '邮箱和验证码都是必填项' });
    }

    // 查找匹配的有效验证码
    console.log('[DEBUG] Querying database for verification code');
    const currentTime = new Date().toISOString();
    console.log(`[DEBUG] Current time for expiration check: ${currentTime}`);

    const { data: verifications, error: queryError } = await supabase
      .from('order_verifications')
      .select()
      .eq('email', email)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', currentTime)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error(`[ERROR] Verification code query failed: ${queryError.message}`);
      console.error('[ERROR] Query error details:', queryError);
      return res.status(500).json({ success: false, error: `验证码查询失败: ${queryError.message}` });
    }

    console.log(`[DEBUG] Verification query result: found ${verifications ? verifications.length : 0} matching codes`);
    if (verifications && verifications.length > 0) {
      console.log('[DEBUG] Verification code details:', {
        id: verifications[0].id,
        created_at: verifications[0].created_at,
        expires_at: verifications[0].expires_at,
        is_used: verifications[0].is_used
      });
    }

    if (!verifications || verifications.length === 0) {
      console.log('[DEBUG] No valid verification code found');

      // 查询所有相关的验证码记录，不考虑是否过期或已使用，仅用于调试
      const { data: allCodes } = await supabase
        .from('order_verifications')
        .select()
        .eq('email', email)
        .order('created_at', { ascending: false });

      console.log(`[DEBUG] All verification codes for this email: ${allCodes ? allCodes.length : 0}`);
      if (allCodes && allCodes.length > 0) {
        console.log('[DEBUG] Latest verification code status:', {
          id: allCodes[0].id,
          code_matches: allCodes[0].code === code,
          is_used: allCodes[0].is_used,
          expires_at: allCodes[0].expires_at,
          is_expired: new Date(allCodes[0].expires_at) < new Date(currentTime)
        });
      }

      return res.status(401).json({ success: false, error: '验证码无效或已过期' });
    }

    // 标记验证码为已使用
    console.log(`[DEBUG] Marking verification code ${verifications[0].id} as used`);
    const { data: updateData, error: updateError } = await supabase
      .from('order_verifications')
      .update({ is_used: true })
      .eq('id', verifications[0].id);

    if (updateError) {
      console.error(`[ERROR] Failed to mark verification code as used: ${updateError.message}`);
      console.error('[ERROR] Update error details:', updateError);
    } else {
      console.log('[DEBUG] Verification code marked as used successfully');
    }

    // 生成JWT令牌，有效期24小时
    console.log('[DEBUG] Generating JWT token');
    let jwt;
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      console.log('[DEBUG] JWT secret encoded successfully');

      jwt = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      console.log('[DEBUG] JWT token generated successfully');
      console.log(`[DEBUG] JWT token length: ${jwt.length} characters`);
    } catch (jwtError) {
      console.error('[ERROR] JWT generation failed:', jwtError);
      return res.status(500).json({ success: false, error: `JWT生成失败: ${jwtError.message}` });
    }

    // 查询用户的订单
    console.log('[DEBUG] Querying user orders');
    console.log(`[DEBUG] Querying love story books for email: ${email.substring(0, 3)}***`);

    const startTime = Date.now();
    const { data: loveStoryOrders, error: loveStoryError } = await supabase
      .from('love_story_books')
      .select('*')
      .eq('customer_email', email)
      .order('timestamp', { ascending: false });

    const loveStoryQueryTime = Date.now() - startTime;
    console.log(`[DEBUG] Love story query completed in ${loveStoryQueryTime}ms`);

    if (loveStoryError) {
      console.error('[ERROR] Love story orders query failed:', loveStoryError);
    } else {
      console.log(`[DEBUG] Found ${loveStoryOrders?.length || 0} love story orders`);
    }

    console.log(`[DEBUG] Querying funny biography books for email: ${email.substring(0, 3)}***`);
    const fbStartTime = Date.now();
    const { data: funnyBiographyOrders, error: funnyBiographyError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('customer_email', email)
      .order('timestamp', { ascending: false });

    const funnyBiographyQueryTime = Date.now() - fbStartTime;
    console.log(`[DEBUG] Funny biography query completed in ${funnyBiographyQueryTime}ms`);

    if (funnyBiographyError) {
      console.error('[ERROR] Funny biography orders query failed:', funnyBiographyError);
    } else {
      console.log(`[DEBUG] Found ${funnyBiographyOrders?.length || 0} funny biography orders`);
    }

    // 合并订单列表
    console.log('[DEBUG] Merging and sorting orders');
    const allOrders = [
      ...(loveStoryOrders || []).map(order => ({
        ...order,
        type: 'love_story'
      })),
      ...(funnyBiographyOrders || []).map(order => ({
        ...order,
        type: 'funny_biography'
      }))
    ].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`[DEBUG] Total orders after merging: ${allOrders.length}`);
    console.log(`[DEBUG] Memory usage estimate for orders: ~${JSON.stringify(allOrders).length / 1024}KB`);

    // 检查订单数据大小
    const ordersJsonSize = JSON.stringify(allOrders).length;
    if (ordersJsonSize > 1024 * 1024) { // 大于1MB
      console.warn(`[WARN] Orders data is very large: ${ordersJsonSize / (1024 * 1024)}MB`);
    }

    console.log('[DEBUG] Preparing successful response');
    const responseData = {
      success: true,
      token: jwt,
      orders: allOrders,
      message: "验证成功"
    };

    // 记录响应大小
    const responseSize = JSON.stringify(responseData).length;
    console.log(`[DEBUG] Response size: ${responseSize} bytes (~${(responseSize / 1024).toFixed(2)}KB)`);

    if (responseSize > 5 * 1024 * 1024) { // 大于5MB
      console.error('[ERROR] Response size exceeds 5MB, this may cause issues');
    } else if (responseSize > 1 * 1024 * 1024) { // 大于1MB
      console.warn('[WARN] Response size is large (>1MB), consider optimizing');
    }

    console.log('[DEBUG] Verification completed successfully');
    return res.status(200).json(responseData);
  } catch (error) {
    console.error(`[ERROR] 验证码验证失败: ${error.message}`);
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
