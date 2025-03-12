import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 处理CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      orderId, 
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
    } = req.body;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // 初始化Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 准备更新数据
    const updateData = {};
    
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

    // 更新数据库
    console.log(`Updating book data for order ${orderId}:`, updateData);
    const { data, error } = await supabase
      .from('funny_biography_books')
      .update(updateData)
      .eq('order_id', orderId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Book data updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating book data:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 