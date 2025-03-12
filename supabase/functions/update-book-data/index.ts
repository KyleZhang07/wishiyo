
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      orderId, 
      bookContent, 
      coverPdf, 
      interiorPdf, 
      status 
    } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare update data
    const updateData: Record<string, any> = {};
    
    if (bookContent) {
      updateData.book_content = bookContent;
    }
    
    if (coverPdf) {
      updateData.cover_pdf = coverPdf;
    }
    
    if (interiorPdf) {
      updateData.interior_pdf = interiorPdf;
    }
    
    if (status) {
      updateData.status = status;
    }

    // Update the database
    const { data, error } = await supabase
      .from('funny_biography_books')
      .update(updateData)
      .eq('order_id', orderId)
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Book data updated successfully',
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating book data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
