
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno type declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, type } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get Supabase connection info
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which table to query based on the book type
    let tableName = 'funny_biography_books';
    if (type === 'love_story') {
      tableName = 'love_story_books';
    }

    console.log(`Fetching ${type || 'unknown'} book data for order ${orderId} from table ${tableName}`);
    
    // Query the database
    const { data: bookData, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch book data: ${fetchError.message}`);
    }

    if (!bookData) {
      throw new Error(`No book found with order ID: ${orderId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: bookData 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting book data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
