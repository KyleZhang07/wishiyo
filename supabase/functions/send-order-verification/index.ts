
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

// CORS 头设置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 从电子邮件中提取名字
function getFirstName(email: string): string {
  // 从电子邮件地址中提取名字部分
  const namePart = email.split('@')[0];

  // 尝试从常见的电子邮件格式中提取名字
  // 例如：john.doe@example.com, john_doe@example.com, johndoe@example.com
  const possibleName = namePart.split(/[._]/)[0];

  // 首字母大写
  return possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
}

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

    // 获取收件人名字
    const firstName = getFirstName(email);

    // HTML 邮件内容
    const htmlContent = `
      <div style="font-family:Arial,Helvetica,sans-serif;
                  max-width:600px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="color:#FF6B35;margin:0 0 16px;">
          Your Wishiyo Verification Code
        </h2>

        <p>Hi ${firstName},</p>

        <p>You're trying to access your Wishiyo order information. Please use the verification code below:</p>

        <div style="background-color:#f5f5f5;padding:15px;border-radius:5px;text-align:center;font-size:24px;letter-spacing:5px;margin:20px 0;">
          <strong>${code}</strong>
        </div>

        <p>This code will expire in 15 minutes. If you didn't request this code, please ignore this email.</p>

        <p>Thanks for choosing Wishiyo!</p>

        <p>— Wishiyo</p>

        <hr style="border:none;border-top:1px solid #E0E0E0;margin:32px 0;">
        <p style="font-size:12px;color:#777;margin:0;">
           This email was sent automatically from an unmonitored address.<br>
           Need help? Please visit
           <a href="https://wishiyo.com/contact" style="color:#FF6B35;text-decoration:none;">
             wishiyo.com/contact
           </a> to reach our customer service team.
        </p>
      </div>
    `;

    // 纯文本邮件内容
    const textContent = `
      Your Wishiyo Verification Code

      Hi ${firstName},

      You're trying to access your Wishiyo order information. Please use the verification code below:

      ${code}

      This code will expire in 15 minutes. If you didn't request this code, please ignore this email.

      Thanks for choosing Wishiyo!

      — Wishiyo

      ---
      This email was sent automatically from an unmonitored address.
      Need help? Please visit wishiyo.com/contact to reach our customer service team.
    `;

    // 发送邮件
    const emailResponse = await resend.emails.send({
      from: "Wishiyo <hi@wishiyo.com>",
      to: [email],
      subject: "Your Wishiyo Verification Code",
      html: htmlContent,
      text: textContent,
      headers: {
        "X-Entity-Ref-ID": Date.now().toString(), // 唯一标识符
      }
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
