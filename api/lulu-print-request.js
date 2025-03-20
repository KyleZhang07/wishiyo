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
    // 解析请求体
    const { orderId, type = 'love_story' } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    // 验证LuluPress API凭证
    const LULU_API_KEY = process.env.LULU_CLIENT_ID;
    const LULU_API_SECRET = process.env.LULU_CLIENT_SECRET;
    // 使用沙盒环境
    const LULU_API_ENDPOINT = 'https://api.sandbox.lulu.com'; // 使用沙盒环境
    // 定义认证端点和打印作业端点
    const AUTH_ENDPOINT = `${LULU_API_ENDPOINT}/auth/realms/glasstree/protocol/openid-connect/token`;
    const PRINT_JOBS_ENDPOINT = `${LULU_API_ENDPOINT}/print-jobs/v1/print-jobs`;
    
    if (!LULU_API_KEY || !LULU_API_SECRET) {
      console.error('Missing Lulu API credentials', {
        hasClientId: !!LULU_API_KEY,
        hasClientSecret: !!LULU_API_SECRET
      });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
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
    
    // 查询订单数据
    const tableName = type === 'love_story' ? 'love_story_books' : 'funny_biography_books';
    
    const { data: order, error: orderError } = await supabase
      .from(tableName)
      .select('*')
      .eq('order_id', orderId)
      .single();
      
    if (orderError || !order) {
      console.error(`Error fetching order ${orderId}:`, orderError);
      return res.status(404).json({
        success: false,
        error: `Order not found: ${orderError?.message || 'Unknown error'}`
      });
    }
    
    // 检查订单是否已准备好打印
    if (!order.ready_for_printing) {
      return res.status(400).json({
        success: false,
        error: 'Order is not ready for printing'
      });
    }
    
    // 检查必要的PDF URL
    if (!order.cover_source_url || !order.interior_source_url) {
      return res.status(400).json({
        success: false,
        error: 'Order is missing required PDF files'
      });
    }
    
    // 检查订单的shipping_address
    if (!order.shipping_address) {
      console.log(`Order ${orderId} is missing shipping address information`, {
        order_id: order.order_id,
        order_keys: Object.keys(order),
        shipping_address_value: order.shipping_address
      });
      
      return res.status(400).json({
        success: false,
        error: 'Order is missing shipping address information'
      });
    }
    
    // 检查shipping_address的结构
    console.log(`Order ${orderId} shipping address debug:`, {
      shipping_address_type: typeof order.shipping_address,
      shipping_address_keys: order.shipping_address ? Object.keys(order.shipping_address) : [],
      shipping_address_json: JSON.stringify(order.shipping_address)
    });
    
    // 确保shipping_address具有期望的结构
    let shippingAddress;
    
    try {
      // 如果shipping_address是字符串，尝试解析它
      if (typeof order.shipping_address === 'string') {
        shippingAddress = JSON.parse(order.shipping_address);
      } else {
        shippingAddress = order.shipping_address;
      }
      
      // 确保shipping_address包含电话号码
      if (!shippingAddress.phone_number && order.recipient_phone) {
        shippingAddress.phone_number = order.recipient_phone;
      }
      
      // 如果仍然没有电话号码，添加一个默认的
      if (!shippingAddress.phone_number) {
        shippingAddress.phone_number = '1234567890'; // 默认电话号码
      }
      
      // 确保地址格式正确
      if (shippingAddress.address) {
        // 如果地址在嵌套的address对象中，将其展平
        const { address } = shippingAddress;
        shippingAddress = {
          name: shippingAddress.name,
          phone_number: shippingAddress.phone_number,
          street1: address.line1,
          street2: address.line2 || '',
          city: address.city,
          state_code: address.state,
          postal_code: address.postal_code,
          country_code: address.country
        };
      }
      
      console.log(`Formatted shipping address for order ${orderId}:`, shippingAddress);
    } catch (error) {
      console.error(`Error formatting shipping address for order ${orderId}:`, error);
      return res.status(400).json({
        success: false,
        error: `Invalid shipping address format: ${error.message}`
      });
    }
    
    // 使用订单提供的shipping_level或默认值
    let shippingLevel = order.shipping_level || 'MAIL';
    
    // 验证shipping_level是否为有效值
    const validShippingLevels = ['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS'];
    if (!validShippingLevels.includes(shippingLevel)) {
      console.warn(`Invalid shipping level: ${shippingLevel}, using default: MAIL`);
      shippingLevel = 'MAIL';
    }
    
    // 获取Lulu API访问令牌
    console.log('Requesting token from Lulu API...');
    console.log(`Using Lulu API endpoint: ${LULU_API_ENDPOINT}`);
    
    // 使用正确的令牌端点
    const authEndpoint = AUTH_ENDPOINT;
    console.log(`Auth endpoint: ${authEndpoint}`);
    
    // 创建 Basic Auth 凭证
    const credentials = Buffer.from(`${LULU_API_KEY}:${LULU_API_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Error getting Lulu token: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to authenticate with Lulu API'
      });
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to obtain access token from Lulu API'
      });
    }
    
    // 准备打印请求
    // 构建打印请求数据
    const printJobData = {
      contact_email: order.customer_email || 'support@wishiyo.com',
      external_id: orderId,
      line_items: [
        {
          title: order.title || 'Custom Book',
          cover_url: order.cover_source_url,
          interior_url: order.interior_source_url,
          pod_package_id: '0600X0900BWSTDPB060UW444MXX', // 使用文档中的有效值
          quantity: order.print_quantity || 1,
          page_count: order.page_count || 100 // 添加默认页数
        }
      ],
      shipping_level: shippingLevel,
      shipping_address: shippingAddress
    };
    
    // 使用获取的令牌提交打印作业
    console.log('Submitting print job to Lulu...');
    const printEndpoint = PRINT_JOBS_ENDPOINT;
    
    console.log(`Print endpoint: ${printEndpoint}`);
    console.log('Print job data:', JSON.stringify(printJobData, null, 2));
    
    try {
      const printResponse = await fetch(printEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(printJobData)
      });
      
      console.log(`Print job response status: ${printResponse.status}`);
      
      // 检查响应是否为 JSON
      const contentType = printResponse.headers.get('content-type');
      console.log(`Response content type: ${contentType}`);
      
      if (!printResponse.ok) {
        let errorText;
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await printResponse.json();
            errorText = JSON.stringify(errorData);
          } else {
            errorText = await printResponse.text();
          }
        } catch (e) {
          errorText = `Failed to parse error response: ${e.message}`;
        }
        
        console.error(`Error from Lulu API: ${printResponse.status} ${printResponse.statusText}`, errorText);
        return res.status(500).json({
          success: false,
          error: `Failed to create print job: ${printResponse.status} ${printResponse.statusText} - ${errorText}`
        });
      }
      
      const printData = await printResponse.json();
      
      console.log('Print job response:', JSON.stringify(printData, null, 2));
      
      // 更新数据库中的订单状态
      const printJobId = printData.id || printData.job_id;
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          lulu_print_status: 'SUBMITTED',
          status: 'print_submitted',
          print_job_id: printJobId,
          print_submission_date: new Date().toISOString()
        })
        .eq('order_id', orderId);
        
      if (updateError) {
        console.error(`Error updating order status: ${updateError.message}`);
        // 尽管更新失败，打印请求已成功提交
        return res.status(200).json({
          success: true,
          warning: `Print job submitted but failed to update order status: ${updateError.message}`,
          print_job_id: printJobId,
          details: printData
        });
      }
      
      // 返回成功响应
      return res.status(200).json({
        success: true,
        message: 'Print job submitted successfully',
        print_job_id: printJobId,
        details: printData
      });
      
    } catch (error) {
      console.error('Error submitting print job:', error);
      return res.status(500).json({
        success: false,
        error: `Internal server error: ${error.message}`
      });
    }
    
  } catch (error) {
    console.error('Error processing print request:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
}