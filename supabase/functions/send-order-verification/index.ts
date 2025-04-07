
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("必要的环境变量未设置");
    }

    // 初始化Supabase和Resend客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // 解析请求数据
    const { email } = await req.json();

    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return new Response(
        JSON.stringify({ success: false, error: "邮箱格式无效" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置验证码有效期 (15分钟)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 检查是否有之前未过期的验证码，如果有则更新它
    const { data: existingCodes } = await supabase
      .from('order_verifications')
      .select()
      .eq('email', email)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());

    // 删除所有该邮箱的未使用验证码
    if (existingCodes && existingCodes.length > 0) {
      await supabase
        .from('order_verifications')
        .update({ is_used: true })
        .eq('email', email)
        .eq('is_used', false);
    }

    // 创建新的验证码记录
    const { error: insertError } = await supabase
      .from('order_verifications')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      throw new Error(`验证码保存失败: ${insertError.message}`);
    }

    // 发送邮件
    const emailResponse = await resend.emails.send({
      from: "WISHIYO <verify@wishiyo.com>",
      to: [email],
      subject: "订单查询验证码",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF7F50;">WISHIYO 订单查询验证码</h2>
          <p>您好，</p>
          <p>您正在尝试查询WISHIYO订单信息。请使用以下验证码进行验证：</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${code}</strong>
          </div>
          <p>此验证码将在15分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
          <p>感谢您使用WISHIYO的服务！</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">本邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    });

    console.log("邮件发送响应:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "验证码已发送至您的邮箱" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("发送验证码失败:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
