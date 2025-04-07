import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Create JWT key
const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  
  return new TextEncoder().encode(jwtSecret);
};

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables not properly configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { email, code } = await request.json();

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
    const secret = getJwtSecret();
    const jwt = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

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
    return NextResponse.json(
      { 
        success: true, 
        token: jwt,
        orderCount: totalOrderCount
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 400, 
        headers: corsHeaders
      }
    );
  }
}
