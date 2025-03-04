import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // 初始化 Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_your_key_here", {
      apiVersion: "2023-10-16",
    });
    
    // 获取请求数据
    const { amount, currency = "usd", shipping_options, metadata } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }
    
    // 创建 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // 确保金额为整数（分单位）
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
      shipping: shipping_options ? {
        address: {
          line1: shipping_options.address_line1 || '',
          line2: shipping_options.address_line2 || '',
          city: shipping_options.city || '',
          state: shipping_options.state || '',
          postal_code: shipping_options.postal_code || '',
          country: shipping_options.country || 'US',
        },
        name: shipping_options.name || '',
        phone: shipping_options.phone || '',
      } : undefined,
    });
    
    // 返回客户端密钥
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
