
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
      throw new Error("Required environment variables not set");
    }

    // Initialize Supabase and Resend clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Parse request data
    const { email } = await req.json();

    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate 6-digit random verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set verification code expiration time (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Check if there are previous unused verification codes, if so update them
    const { data: existingCodes } = await supabase
      .from('order_verifications')
      .select()
      .eq('email', email)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());

    // Delete all unused verification codes for this email
    if (existingCodes && existingCodes.length > 0) {
      await supabase
        .from('order_verifications')
        .update({ is_used: true })
        .eq('email', email)
        .eq('is_used', false);
    }

    // Create new verification code record
    const { error: insertError } = await supabase
      .from('order_verifications')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to save verification code: ${insertError.message}`);
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "WISHIYO <verify@wishiyo.com>",
      to: [email],
      subject: "Order Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #FF7F50;">WISHIYO Order Verification Code</h2>
          <p>Hello,</p>
          <p>You are attempting to access your WISHIYO order information. Please use the verification code below:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${code}</strong>
          </div>
          <p>This verification code will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
          <p>Thank you for using WISHIYO's services!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent automatically, please do not reply.</p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent to your email" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to send verification code:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
