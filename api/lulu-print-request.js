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
    
    // 确定是否使用sandbox环境，并设置正确的API端点
    // 强制使用sandbox环境进行测试
    const forceSandbox = true; // 临时设置，之后可以改为false或使用环境变量
    const isSandbox = forceSandbox || process.env.LULU_SANDBOX === 'true';
    const LULU_API_ENDPOINT = isSandbox 
      ? 'https://api.sandbox.lulu.com' 
      : (process.env.LULU_API_ENDPOINT || 'https://api.lulu.com');
    
    console.log(`Using Lulu API endpoint: ${LULU_API_ENDPOINT} (Sandbox: ${isSandbox})`);
    
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
    if (!order.cover_pdf_url || !order.interior_pdf_url) {
      return res.status(400).json({
        success: false,
        error: 'Order is missing required PDF files'
      });
    }
    
    // 获取客户信息
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('client_id', order.client_id)
      .single();
      
    if (customerError || !customer) {
      console.error(`Error fetching customer for order ${orderId}:`, customerError);
      return res.status(404).json({
        success: false,
        error: `Customer information not found: ${customerError?.message || 'Unknown error'}`
      });
    }
    
    // 获取Lulu API访问令牌
    console.log('Requesting token from Lulu API...');
    const tokenResponse = await fetch(`${LULU_API_ENDPOINT}/auth/realms/glasstree/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': LULU_API_KEY,
        'client_secret': LULU_API_SECRET
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
      contact_email: 'orders@wishiyo.com',
      external_id: orderId,
      line_items: [
        {
          external_id: `${orderId}-item-1`,
          title: order.title || 'Custom Book',
          quantity: 1,
          // 使用printable_normalization结构，根据API文档要求
          printable_normalization: {
            pod_package_id: order.pod_package_id || '0600X0900BWSTDPB060UW444MXX',
            cover: {
              source_url: order.cover_pdf_url
            },
            interior: {
              source_url: order.interior_pdf_url
            }
          },
          shipping_level: 'MAIL' // 或者 'GROUND_HD' 或其他选项
        }
      ],
      shipping_address: {
        name: `${customer.first_name} ${customer.last_name}`,
        street1: customer.address_line1,
        street2: customer.address_line2 || '',
        city: customer.city,
        state_code: customer.state,
        country_code: customer.country || 'US',
        postcode: customer.postal_code,
        phone_number: customer.phone || '',
        email: customer.email || order.customer_email || 'orders@wishiyo.com'
      }
    };
    
    console.log('Print job payload:', JSON.stringify(printJobData, null, 2));
    
    // 发送请求时显示完整端点
    const printJobsEndpoint = `${LULU_API_ENDPOINT}/print-jobs/`;
    console.log(`Submitting print job to: ${printJobsEndpoint}`);
    const printResponse = await fetch(printJobsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(printJobData)
    });
    
    const printResponseData = await printResponse.json();
    
    if (!printResponse.ok) {
      console.error(`Error submitting print job: ${printResponse.status} ${printResponse.statusText}`, printResponseData);
      return res.status(500).json({
        success: false,
        error: `Failed to submit print job: ${printResponseData.error || 'Unknown error'}`,
        details: printResponseData
      });
    }
    
    // 更新数据库中的订单状态
    const printJobId = printResponseData.id || printResponseData.job_id;
    
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
        details: printResponseData
      });
    }
    
    // 返回成功响应
    return res.status(200).json({
      success: true,
      message: 'Print job submitted successfully',
      print_job_id: printJobId,
      details: printResponseData
    });
    
  } catch (error) {
    console.error('Error processing print request:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
} 