
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

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
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
      throw new Error("Required environment variables not set");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request data
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and verification code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find matching valid verification code
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
      throw new Error(`Verification code query failed: ${queryError.message}`);
    }

    if (!verifications || verifications.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired verification code" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark verification code as used
    await supabase
      .from('order_verifications')
      .update({ is_used: true })
      .eq('id', verifications[0].id);

    // Generate JWT token, valid for 24 hours
    const secret = new TextEncoder().encode(jwtSecret);
    const jwt = await new jose.SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Query user's orders
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

    // Merge order lists
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
        message: "Verification successful" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Verification code verification failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
