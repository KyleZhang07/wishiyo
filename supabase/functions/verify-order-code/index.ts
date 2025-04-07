import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Create JWT key
const getKey = async () => {
  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  
  // Convert the key to Uint8Array using TextEncoder
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables not properly configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { email, code } = await req.json();

    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      throw new Error('Invalid email address or verification code');
    }

    // Query verification code
    const { data, error } = await supabase
      .from('order_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark verification code as used
    await supabase
      .from('order_verifications')
      .update({ used: true })
      .eq('id', data.id);

    // Generate JWT
    const key = await getKey();
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      { 
        email: email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours expiration
      },
      key
    );

    // Query user orders from both book tables
    const { data: funnyBiographyBooks, error: funnyBiographyError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('customer_email', email);
      
    const { data: loveStoryBooks, error: loveStoryError } = await supabase
      .from('love_story_books')
      .select('*')
      .eq('customer_email', email);

    if (funnyBiographyError || loveStoryError) {
      console.error('Error fetching orders:', funnyBiographyError || loveStoryError);
      throw new Error('Failed to fetch order information');
    }

    // Calculate total order count
    const totalOrderCount = (funnyBiographyBooks?.length || 0) + (loveStoryBooks?.length || 0);

    // Return success response with JWT and order count
    return new Response(
      JSON.stringify({ 
        success: true, 
        token: jwt,
        orderCount: totalOrderCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
