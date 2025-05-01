import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

// CORS headers setup
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 获取收件人的名字（从电子邮件中提取）
function getFirstName(email: string): string {
  // 从电子邮件地址中提取名字部分
  const namePart = email.split('@')[0];

  // 尝试从常见的电子邮件格式中提取名字
  // 例如：john.doe@example.com, john_doe@example.com, johndoe@example.com
  const possibleName = namePart.split(/[._]/)[0];

  // 首字母大写
  return possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
}

// 根据订单状态生成电子邮件主题和内容
function getEmailContent(status: string, bookTitle: string, orderId: string, trackingInfo: any = null, email: string = '') {
  // 提取收件人名字
  const firstName = getFirstName(email);

  // 定义电子邮件模板变量
  let subject = '';
  let headline = '';
  let body = '';
  let optionalBlock = '';
  let nextStep = '';
  let statusText = '';

  // 根据状态设置相应的内容
  switch (status) {
    case 'CREATED':
    case 'ACCEPTED':
      subject = `We've got your order #${orderId} 🎉`;
      headline = "We've received your order!";
      body = `Thank you for ordering <strong>${bookTitle}</strong>. Our team is queuing it for printing.`;
      nextStep = "<p>We'll email you the moment it hits the press.</p>";
      statusText = 'Received, awaiting printing';
      break;

    case 'IN_PRODUCTION':
    case 'MANUFACTURING':
      subject = `Your book is on the press! (Order #${orderId})`;
      headline = 'Your book is being printed';
      body = 'Great news – the pages are rolling through our press right now.';
      nextStep = '<p>Next up: binding and a quick quality check.</p>';
      statusText = 'Printing in progress';
      break;

    case 'SHIPPED':
      subject = `Your book is on the way 🚚 – track Order #${orderId}`;
      headline = 'Your book has shipped!';
      body = "It's officially on its way.";
      statusText = 'Shipped';

      // 添加跟踪信息（如果有）
      if (trackingInfo && trackingInfo.tracking_id) {
        optionalBlock = `<p><strong>Tracking #</strong>: ${trackingInfo.tracking_id}`;

        if (trackingInfo.tracking_urls && trackingInfo.tracking_urls.length > 0) {
          optionalBlock += ` (<a href="${trackingInfo.tracking_urls[0]}" style="color:#FF6B35;">track here</a>)`;
        }

        optionalBlock += '</p>';
      }

      nextStep = '<p>Watch your mailbox – delivery is usually just a few days.</p>';
      break;

    case 'REJECTED':
      subject = `Update on Order #${orderId} – we need your help`;
      headline = "There's a hiccup with your order";
      body = "Something didn't pass our checks and we had to stop the job.";
      nextStep = "<p>Hit reply and we'll sort it out together.</p>";
      statusText = 'Rejected';
      break;

    case 'CANCELED':
      subject = `Update on Order #${orderId} – we need your help`;
      headline = 'Your order was canceled';
      body = "As requested, we've canceled the order. No worries - you can reorder anytime.";
      nextStep = "<p>Questions? Reply and we're here to help.</p>";
      statusText = 'Canceled';
      break;

    default:
      // 不处理其他状态，返回null表示不发送通知
      return null;
  }

  // 使用统一的HTML模板
  const content = `
<div style="font-family:Arial,Helvetica,sans-serif;
            max-width:600px;margin:0 auto;padding:24px;color:#333;">
  <h2 style="color:#FF6B35;margin:0 0 16px;">
    ${headline}
  </h2>

  <p>Hi ${firstName},</p>

  <p>${body}</p>

  <div style="background:#F6F6F6;padding:16px;border-radius:6px;margin:24px 0;">
    <p style="margin:4px 0;"><strong>Order&nbsp;ID:</strong> ${orderId}</p>
    <p style="margin:4px 0;"><strong>Book&nbsp;Title:</strong> ${bookTitle}</p>
    <p style="margin:4px 0;"><strong>Status:</strong> ${statusText}</p>
    ${optionalBlock}
  </div>

  ${nextStep}

  <p>Thanks for choosing Wishiyo – we can't wait for you to hold your book!</p>

  <p>— Wishiyo</p>

  <hr style="border:none;border-top:1px solid #E0E0E0;margin:32px 0;">
  <p style="font-size:12px;color:#777;margin:0;">
     Need help? Simply reply to this email and our customer service team will assist you.
  </p>
</div>
  `;

  return { subject, content };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("Required environment variables are not set");
    }

    // Initialize Supabase and Resend clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Parse request data
    const { email, orderId, status, bookTitle, trackingInfo, type } = await req.json();

    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ success: false, error: "Order ID and status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 获取邮件内容
    const emailContent = getEmailContent(status, bookTitle || "Your Book", orderId, trackingInfo, email);

    // 如果没有为该状态定义邮件内容，则不发送通知
    if (!emailContent) {
      console.log(`No notification configured for status: ${status}, skipping email notification`);
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped for this status", status }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { subject, content } = emailContent;

    // 创建纯文本版本
    const plainText = content
      .replace(/<[^>]*>/g, '') // 移除所有HTML标签
      .replace(/\s+/g, ' ')    // 将多个空白字符替换为单个空格
      .trim();                 // 移除首尾空白

    // Send email with improved headers
    const emailResponse = await resend.emails.send({
      from: "Wishiyo <hi@wishiyo.com>",
      reply_to: "hi@wishiyo.com", // 添加回复地址，使用户可以直接回复
      to: [email],
      subject: subject,
      html: content,
      text: plainText,
      headers: {
        "X-Entity-Ref-ID": orderId || Date.now().toString(), // 唯一标识符
      }
    });

    console.log("Email send response:", emailResponse);

    // Record notification history (optional)
    const { error: historyError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        email,
        status,
        type,
        sent_at: new Date().toISOString()
      });

    if (historyError) {
      console.error("Failed to record notification history:", historyError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order status notification sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to send order status notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
