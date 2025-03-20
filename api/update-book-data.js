// API endpoint to update book data
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
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
      print_attempts,
      // 拆分的地址字段
      recipient_name,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country
    } = req.body;

    // Debug logging for shipping address
    console.log('update-book-data DEBUG INFO:', {
      orderId,
      table_name,
      has_shipping_address: !!shipping_address,
      shipping_address_type: shipping_address ? typeof shipping_address : 'N/A',
      shipping_address_json: shipping_address ? JSON.stringify(shipping_address) : 'N/A',
      // 添加拆分字段的日志
      has_split_address: !!(recipient_name || address_line1 || city || state || postal_code || country),
      recipient_name,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country
    });

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // 验证Supabase凭证
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 确定要更新的表名
    const targetTable = table_name || 'funny_biography_books'; // 默认为 funny_biography_books

    // Prepare update data
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
      console.log('Setting shipping_address in database:', JSON.stringify(shipping_address));
      
      // Handle different formats of shipping_address to ensure proper JSONB storage
      try {
        // First determine if shipping_address is already a string or an object
        let shippingAddressObj;
        
        if (typeof shipping_address === 'string') {
          // If it's a string, parse it to ensure it's valid JSON
          try {
            shippingAddressObj = JSON.parse(shipping_address);
          } catch (e) {
            console.error('Failed to parse shipping_address string:', e);
            // If parsing fails, use the original string
            shippingAddressObj = { raw: shipping_address };
          }
        } else {
          // If it's already an object, use it directly
          shippingAddressObj = shipping_address;
        }
        
        // Now ensure we have a proper object for JSONB field
        // For PostgreSQL JSONB, we need a plain JavaScript object that can be stringified
        updateData.shipping_address = shippingAddressObj;
        
        console.log('Final shipping_address format for database:', 
          typeof updateData.shipping_address, 
          JSON.stringify(updateData.shipping_address)
        );
      } catch (error) {
        console.error('Error processing shipping_address:', error);
        // If all else fails, try storing as a plain nested object
        updateData.shipping_address = { data: shipping_address };
      }
    }
    
    // 处理拆分的地址字段
    if (recipient_name) {
      updateData.recipient_name = recipient_name;
    }
    
    if (address_line1) {
      updateData.address_line1 = address_line1;
    }
    
    if (address_line2) {
      updateData.address_line2 = address_line2;
    }
    
    if (city) {
      updateData.city = city;
    }
    
    if (state) {
      updateData.state = state;
    }
    
    if (postal_code) {
      updateData.postal_code = postal_code;
    }
    
    if (country) {
      updateData.country = country;
    }
    
    // 如果没有传递 shipping_address 但有拆分字段，尝试构建 shipping_address
    if (!shipping_address && (recipient_name || address_line1 || city || state || postal_code || country)) {
      updateData.shipping_address = {
        name: recipient_name || '',
        address: {
          line1: address_line1 || '',
          line2: address_line2 || '',
          city: city || '',
          state: state || '',
          postal_code: postal_code || '',
          country: country || ''
        }
      };
      console.log('Constructed shipping_address from split fields:', JSON.stringify(updateData.shipping_address));
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
    console.log(`Updating ${targetTable} with order ID ${orderId}`, updateData);
    
    const { data, error } = await supabase
      .from(targetTable)
      .update(updateData)
      .eq('order_id', orderId)
      .select();
      
    if (error) {
      console.error(`Error updating ${targetTable}:`, error);
      return res.status(500).json({
        success: false,
        error: `Database update failed: ${error.message}`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully updated ${targetTable} for order ${orderId}`,
      data
    });
    
  } catch (error) {
    console.error('Error updating book data:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
}
