import { createClient } from '@supabase/supabase-js';
import nodeFetch from 'node-fetch';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 处理Lulu打印请求
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @returns {Promise<Object>} - HTTP响应
 */
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

    // =====================================================================
    // 1. 沙盒环境 (Sandbox Environment)
    // =====================================================================
    // 验证LuluPress API凭证
    const LULU_CLIENT_KEY = process.env.LULU_CLIENT_KEY;
    const LULU_CLIENT_SECRET = process.env.LULU_CLIENT_SECRET;
    // 从环境变量中获取API端点，默认为沙盒环境
    const LULU_API_ENDPOINT = process.env.LULU_API_ENDPOINT || 'https://api.sandbox.lulu.com';
    // 定义认证端点和打印作业端点
    const AUTH_ENDPOINT = `${LULU_API_ENDPOINT}/auth/realms/glasstree/protocol/openid-connect/token`;
    const PRINT_JOBS_ENDPOINT = `${LULU_API_ENDPOINT}/print-jobs`;

    if (!LULU_CLIENT_KEY || !LULU_CLIENT_SECRET) {
      console.error('Missing Lulu API credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Lulu API credentials'
      });
    }

    // 验证Supabase凭证
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
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

    // 添加详细的订单数据日志
    console.log(`[DEBUG] Full order data for ${orderId}:`, {
      order_id: order?.order_id,
      shipping_level: order?.shipping_level,
      shipping_option: order.shipping_option ? JSON.stringify(order.shipping_option) : 'null',
      shipping_address: order.shipping_address ? 'exists' : 'missing',
      ready_for_printing: order?.ready_for_printing,
      lulu_print_status: order?.lulu_print_status,
      table_name: tableName
    });

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

    // =====================================================================
    // 2. 认证 (Authorization) & 3. 生成令牌 (Generate a Token)
    // =====================================================================
    // 使用 nodeFetch 或全局 fetch
    const fetchFunc = typeof fetch !== 'undefined' ? fetch : nodeFetch;

    // 获取Lulu API访问令牌
    let accessToken;
    try {
      const tokenResponse = await fetchFunc(AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic YTAyMjU0YjQtYmZkYS00NmIzLTkzNWYtYzg5OTU5NzVhNGM3OmlVWHpGRXYzM3kydDJXc0M4RlU0ZzZLdWJuY0R3WTB1'
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token received from Lulu API');
      }

      // 验证token是否获取成功（仅显示token的前10个字符，后面用***替代，保护安全）
      console.log('Lulu API token获取成功:', {
        token_preview: accessToken.substring(0, 10) + '***',
        token_length: accessToken.length,
        expires_in: tokenData.expires_in || 'unknown',
        token_type: tokenData.token_type || 'unknown'
      });

    } catch (error) {
      console.error('Error obtaining Lulu API token:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to authenticate with Lulu API: ${error.message}`
      });
    }

    // =====================================================================
    // 4. 认证请求准备 (Prepare authenticated requests)
    // =====================================================================
    // 定义 Lulu API 接受的 shipping_level 值
    const validShippingLevels = ['MAIL', 'PRIORITY_MAIL', 'GROUND', 'GROUND_HD', 'EXPEDITED', 'EXPRESS'];

    // 详细记录订单的 shipping_level 信息
    console.log(`[DEBUG] Order ${orderId} shipping_level details:`, {
      original_value: order.shipping_level,
      shipping_option: order.shipping_option ? JSON.stringify(order.shipping_option) : 'null',
      has_shipping_level: !!order.shipping_level,
      shipping_level_type: typeof order.shipping_level
    });

    // 使用订单提供的shipping_level或默认值
    let shippingLevel = order.shipping_level || 'MAIL';

    // 验证 shipping_level 是否为有效值
    if (!validShippingLevels.includes(shippingLevel)) {
      console.warn(`Invalid shipping_level: ${shippingLevel}, using default: MAIL`);
      shippingLevel = 'MAIL';
    }

    console.log(`[DEBUG] Final shipping_level for order ${orderId}: ${shippingLevel}`);

    // =====================================================================
    // 5. 选择产品 (Select a Product)
    // =====================================================================
    // 准备打印请求数据
    const printJobData = {
      contact_email: order.customer_email || 'support@wishiyo.com',
      external_id: orderId,
      line_items: [
        {
          external_id: `item-${orderId}`,
          title: order.title || 'Custom Book',
          printable_normalization: {
            cover: {
              source_url: order.cover_source_url
            },
            interior: {
              source_url: order.interior_source_url
            },
            pod_package_id: getPodPackageId(tableName, order.binding_type)
          },
          quantity: order.print_quantity || 1
        }
      ],
      production_delay: 120, // 添加 production_delay 参数
      shipping_level: shippingLevel,
      shipping_address: null // 将在验证文件后设置
    };

    // 根据书籍类型和装订类型获取正确的 pod_package_id
    function getPodPackageId(bookType, bindingType) {
      // 默认值，以防没有指定装订类型
      const defaultId = '0600X0900BWSTDPB060UW444MXX';

      // 如果没有指定装订类型，使用默认值
      if (!bindingType) {
        return defaultId;
      }

      // 根据书籍类型和装订类型选择正确的 pod_package_id
      if (bookType === 'love_story_books') {
        // Love Story 书籍 - 只使用精装本，分为高光和哑光两种
        if (bindingType.toLowerCase() === 'hardcover_matte') {
          return '0850X0850FCPRECW080CW444MXX'; // 精装哑光 (Matte)
        } else {
          return '0850X0850FCPRECW080CW444GXX'; // 精装高光 (Glossy) - 默认
        }
      } else if (bookType === 'funny_biography_books') {
        // Funny Biography 书籍
        if (bindingType.toLowerCase() === 'hardcover') {
          return '0600X0900BWSTDCW060UW444MXX'; // 精装
        } else {
          return '0600X0900BWSTDPB060UW444GXX'; // 平装 - 使用光泽封面 (G)
        }
      }

      // 如果无法确定，使用默认值
      return defaultId;
    }

    // =====================================================================
    // 6. 验证文件 (Validate Files)
    // =====================================================================
    // 检查必要的PDF URL
    if (!order.cover_source_url || !order.interior_source_url) {
      return res.status(400).json({
        success: false,
        error: 'Order is missing required PDF files'
      });
    }

    // 检查订单的shipping_address
    if (!order.shipping_address) {
      return res.status(400).json({
        success: false,
        error: 'Order is missing shipping address information'
      });
    }

    // 处理shipping_address
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
          state_code: address.state || '',
          postcode: address.postal_code,
          country_code: address.country
        };
      }

      // 设置验证后的收货地址
      printJobData.shipping_address = shippingAddress;

    } catch (error) {
      console.error(`Error formatting shipping address for order ${orderId}:`, error);
      return res.status(400).json({
        success: false,
        error: `Invalid shipping address format: ${error.message}`
      });
    }

    // =====================================================================
    // 7. 创建打印作业 (Create a Print-Job)
    // =====================================================================
    // 记录完整的请求数据
    console.log(`[DEBUG] Final print job request data for order ${orderId}:`, JSON.stringify(printJobData, null, 2));

    try {
      const printResponse = await fetchFunc(PRINT_JOBS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(printJobData)
      });

      // 处理响应
      if (!printResponse.ok) {
        let errorData = '';
        try {
          const contentType = printResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await printResponse.json();
            errorData = JSON.stringify(errorJson);
          } else {
            errorData = await printResponse.text();
          }
        } catch (e) {
          errorData = 'Failed to parse error response';
        }

        throw new Error(`Print job request failed: ${printResponse.status} ${printResponse.statusText} - ${errorData}`);
      }

      const printData = await printResponse.json();
      const printJobId = printData.id || printData.job_id;

      if (!printJobId) {
        throw new Error('Print job was created but no job ID was returned');
      }

      // 更新数据库中的订单状态
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          lulu_print_status: 'SUBMITTED',
          status: 'print_submitted',
          lulu_print_job_id: printJobId,
          print_date: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error(`Error updating order status:`, updateError);
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
        error: `Failed to submit print job: ${error.message}`
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