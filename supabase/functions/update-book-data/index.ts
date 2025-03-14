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
      table_name, 
      bookContent, 
      coverPdf, 
      interiorPdf, 
      status,
      shipping_address,
      shipping_option,
      customer_email,
      shipping_level,
      recipient_phone,
      cover_source_url,
      interior_source_url,
      pod_package_id,
      print_quantity,
      book_size,
      page_count,
      is_color,
      paper_type,
      binding_type,
      ready_for_printing,
      lulu_print_job_id,
      lulu_print_status,
      lulu_tracking_number,
      lulu_tracking_url,
      print_date,
      print_attempts
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

    // 确定要更新的表名
    const targetTable = table_name || 'funny_biography_books'; // 默认为 funny_biography_books

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

    if (shipping_address) {
      updateData.shipping_address = shipping_address;
    }
    
    if (shipping_option) {
      updateData.shipping_option = shipping_option;
    }
    
    if (customer_email) {
      updateData.customer_email = customer_email;
    }
    
    if (shipping_level) {
      updateData.shipping_level = shipping_level;
    }
    
    if (recipient_phone) {
      updateData.recipient_phone = recipient_phone;
    }
    
    if (cover_source_url) {
      updateData.cover_source_url = cover_source_url;
    }
    
    if (interior_source_url) {
      updateData.interior_source_url = interior_source_url;
    }
    
    if (pod_package_id) {
      updateData.pod_package_id = pod_package_id;
    }
    
    if (print_quantity !== undefined) {
      updateData.print_quantity = print_quantity;
    }
    
    if (book_size) {
      updateData.book_size = book_size;
    }
    
    if (page_count !== undefined) {
      updateData.page_count = page_count;
    }
    
    if (is_color !== undefined) {
      updateData.is_color = is_color;
    }
    
    if (paper_type) {
      updateData.paper_type = paper_type;
    }
    
    if (binding_type) {
      updateData.binding_type = binding_type;
    }
    
    if (ready_for_printing !== undefined) {
      updateData.ready_for_printing = ready_for_printing;
    }
    
    if (lulu_print_job_id) {
      updateData.lulu_print_job_id = lulu_print_job_id;
    }
    
    if (lulu_print_status) {
      updateData.lulu_print_status = lulu_print_status;
    }
    
    if (lulu_tracking_number) {
      updateData.lulu_tracking_number = lulu_tracking_number;
    }
    
    if (lulu_tracking_url) {
      updateData.lulu_tracking_url = lulu_tracking_url;
    }
    
    if (print_date) {
      updateData.print_date = print_date;
    }
    
    if (print_attempts !== undefined) {
      updateData.print_attempts = print_attempts;
    }

    // Update the database
    const { data, error } = await supabase
      .from(targetTable) // 使用动态表名
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
