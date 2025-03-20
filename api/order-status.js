// API endpoint to check and update order status
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // 检查Supabase凭证
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

  try {
    // 处理GET请求 - 获取订单状态
    if (req.method === 'GET') {
      const { orderId, type } = req.query;

      if (!orderId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
      }

      // 默认为love_story类型
      const orderType = type || 'love_story';
      
      // 根据订单类型选择表名
      const tableName = orderType === 'love_story' 
        ? 'love_story_books' 
        : 'funny_biography_books';

      // 查询订单
      const { data: order, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        console.error(`Error fetching ${orderType} order:`, error);
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }

      // 返回订单信息
      return res.status(200).json({
        success: true,
        order
      });
    }
    
    // 处理POST请求 - 对准备好打印的订单提交打印请求
    else if (req.method === 'POST') {
      const { autoSubmit = false } = req.body;
      
      // 如果autoSubmit参数为true，则自动查找并提交准备好打印的订单
      if (autoSubmit) {
        // 查询Love Story书籍，状态为ready_for_printing=true但print_status为空
        const { data: loveStoryBooks, error: loveStoryError } = await supabase
          .from('love_story_books')
          .select('*')
          .eq('ready_for_printing', true)
          .is('lulu_print_status', null);
          
        if (loveStoryError) {
          console.error('Error fetching love story books:', loveStoryError);
        } else {
          console.log(`Found ${loveStoryBooks?.length || 0} love story books ready for printing`);
          
          // 处理每个准备好打印的love story书籍
          if (loveStoryBooks && loveStoryBooks.length > 0) {
            for (const book of loveStoryBooks) {
              await submitPrintRequest(book, 'love_story');
            }
          }
        }
        
        // 查询Funny Biography书籍，状态为ready_for_printing=true但print_status为空
        const { data: funnyBiographyBooks, error: funnyBiographyError } = await supabase
          .from('funny_biography_books')
          .select('*')
          .eq('ready_for_printing', true)
          .is('lulu_print_status', null);
          
        if (funnyBiographyError) {
          console.error('Error fetching funny biography books:', funnyBiographyError);
        } else {
          console.log(`Found ${funnyBiographyBooks?.length || 0} funny biography books ready for printing`);
          
          // 处理每个准备好打印的funny biography书籍
          if (funnyBiographyBooks && funnyBiographyBooks.length > 0) {
            for (const book of funnyBiographyBooks) {
              await submitPrintRequest(book, 'funny_biography');
            }
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Print job submission process completed',
          loveStoryCount: loveStoryBooks?.length || 0,
          funnyBiographyCount: funnyBiographyBooks?.length || 0
        });
      }
      
      // 处理针对特定订单的请求
      const { orderId, type } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
      }
      
      // 默认为love_story类型
      const orderType = type || 'love_story';
      
      // 根据订单类型选择表名
      const tableName = orderType === 'love_story' 
        ? 'love_story_books' 
        : 'funny_biography_books';
        
      // 查询订单
      const { data: order, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('order_id', orderId)
        .single();
        
      if (error) {
        console.error(`Error fetching ${orderType} order:`, error);
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }
      
      // 检查订单是否准备好打印
      if (!order.ready_for_printing) {
        return res.status(400).json({
          success: false,
          error: 'Order is not ready for printing'
        });
      }
      
      // 提交打印请求
      const result = await submitPrintRequest(order, orderType);
      
      return res.status(200).json({
        success: result.success,
        message: result.message,
        order: result.order
      });
    } 
    
    // 处理不支持的请求方法
    else {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

// 提交打印请求的辅助函数
async function submitPrintRequest(book, type) {
  try {
    console.log(`Submitting print request for ${type} book: ${book.order_id}`);
    
    // 获取基础URL - 修正为使用Vercel URL环境变量或域名
    let baseUrl;
    if (process.env.NODE_ENV === 'production') {
      baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://wishiyo.com';
    } else {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    console.log(`Using baseUrl: ${baseUrl} for print request`);
    
    // 添加调试日志，检查地址信息
    console.log(`Order ${book.order_id} address information:`, {
      has_shipping_address: !!book.shipping_address,
      shipping_address: book.shipping_address ? JSON.stringify(book.shipping_address) : null
    });
    
    // 调用Vercel API函数发送打印请求
    const response = await fetch(`${baseUrl}/api/lulu-print-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: book.order_id,
        type: type
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error calling lulu-print-request API: ${response.status} ${response.statusText} - ${errorText}`);
      return {
        success: false,
        message: `Failed to submit print request: ${response.statusText}`,
        order: book
      };
    }
    
    const data = await response.json();
    
    // 如果API返回成功但有警告，记录警告
    if (data.warning) {
      console.warn(`Warning from print request: ${data.warning}`);
    }
    
    // 返回API响应
    return {
      success: data.success,
      message: data.message || 'Print request submitted successfully',
      order: data.order || book,
      print_job_id: data.print_job_id
    };
  } catch (error) {
    console.error(`Error in submitPrintRequest for ${type} book ${book.order_id}:`, error);
    return {
      success: false,
      message: `Error submitting print request: ${error.message}`,
      order: book
    };
  }
} 