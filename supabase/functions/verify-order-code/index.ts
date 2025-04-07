
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

// CORS 头设置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
      throw new Error("必要的环境变量未设置");
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析请求数据
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ success: false, error: "邮箱和验证码都是必填项" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 查找匹配的有效验证码
    const { data: verifications, error: queryError } = await supabase
      .from('order_verifications')
      .select()
      .eq('email', email)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      throw new Error(`验证码查询失败: ${queryError.message}`);
    }

    if (!verifications || verifications.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "验证码无效或已过期" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 标记验证码为已使用
    await supabase
      .from('order_verifications')
      .update({ is_used: true })
      .eq('id', verifications[0].id);

    // 生成JWT令牌，有效期24小时
    const secret = new TextEncoder().encode(jwtSecret);
    const jwt = await new jose.SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // 查询用户的订单
    const { data: loveStoryOrders } = await supabase
      .from('love_story_books')
      .select('*')
      .eq('customer_email', email)
      .order('timestamp', { ascending: false });

    const { data: funnyBiographyOrders } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('customer_email', email)
      .order('timestamp', { ascending: false });

    // 合并订单列表
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: jwt,
        orders: allOrders,
        message: "验证成功" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("验证码验证失败:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
