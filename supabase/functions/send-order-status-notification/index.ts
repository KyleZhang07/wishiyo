import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

// CORS headers setup
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Get email subject and content based on order status
function getEmailContent(status: string, bookTitle: string, orderId: string, trackingInfo: any = null) {
  let subject = '';
  let content = '';

  switch (status) {
    case 'CREATED':
    case 'ACCEPTED':
      subject = `Your Order #${orderId} Has Been Received - WISHIYO`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B35;">WISHIYO Order Status Update</h2>
          <p>Hello,</p>
          <p>Thank you for your order with WISHIYO. We have received your order and sent it to our printing partner.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Current Status:</strong> Received, awaiting printing</p>
          </div>
          <p>We will notify you when there are updates to your order status.</p>
          <p>Thank you for using WISHIYO's services!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;
      break;

    case 'IN_PRODUCTION':
    case 'MANUFACTURING':
      subject = `Your Order #${orderId} Is Being Printed - WISHIYO`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B35;">WISHIYO Order Status Update</h2>
          <p>Hello,</p>
          <p>We're pleased to inform you that your book is now being printed!</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Current Status:</strong> Printing in progress</p>
          </div>
          <p>Once printing is complete, we will arrange shipping and notify you again.</p>
          <p>Thank you for using WISHIYO's services!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;
      break;

    case 'SHIPPED':
      subject = `Your Order #${orderId} Has Been Shipped - WISHIYO`;
      let trackingSection = '';

      if (trackingInfo && trackingInfo.tracking_id) {
        trackingSection = `
          <p><strong>Tracking Number:</strong> ${trackingInfo.tracking_id}</p>
        `;

        if (trackingInfo.tracking_urls && trackingInfo.tracking_urls.length > 0) {
          trackingSection += `
            <p><a href="${trackingInfo.tracking_urls[0]}" style="color: #FF6B35; text-decoration: none;">Click here to track your shipment</a></p>
          `;
        }
      }

      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B35;">WISHIYO Order Status Update</h2>
          <p>Hello,</p>
          <p>Good news! Your book has been printed and shipped.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Current Status:</strong> Shipped</p>
            ${trackingSection}
          </div>
          <p>Thank you for using WISHIYO's services! We hope you enjoy your custom book.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;
      break;

    case 'REJECTED':
    case 'CANCELED':
      subject = `Your Order #${orderId} Status Update - WISHIYO`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B35;">WISHIYO Order Status Update</h2>
          <p>Hello,</p>
          <p>We regret to inform you that there was an issue with processing your order.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Current Status:</strong> ${status === 'REJECTED' ? 'Rejected' : 'Canceled'}</p>
          </div>
          <p>Please contact our customer support team for more information and assistance.</p>
          <p>Email: <a href="mailto:support@wishiyo.com" style="color: #FF6B35; text-decoration: none;">support@wishiyo.com</a></p>
          <p>Thank you for your understanding.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;
      break;

    default:
      subject = `Your Order #${orderId} Status Update - WISHIYO`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF6B35;">WISHIYO Order Status Update</h2>
          <p>Hello,</p>
          <p>There has been an update to your order status.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            <p><strong>Current Status:</strong> ${status}</p>
          </div>
          <p>If you have any questions, please contact our customer support team.</p>
          <p>Email: <a href="mailto:support@wishiyo.com" style="color: #FF6B35; text-decoration: none;">support@wishiyo.com</a></p>
          <p>Thank you for using WISHIYO's services!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;
  }

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
    const { subject, content } = getEmailContent(status, bookTitle || "Your Book", orderId, trackingInfo);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "WISHIYO <orders@wishiyo.com>",
      to: [email],
      subject: subject,
      html: content,
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
