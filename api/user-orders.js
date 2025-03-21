import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 获取查询参数
    const { email, all } = req.query;
    
    // 如果不是获取所有订单，则需要验证邮箱
    if (!all && !email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required unless fetching all orders'
      });
    }
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 查询 love_story_books 表
    let loveStoryQuery = supabase
      .from('love_story_books')
      .select('*')
      .order('timestamp', { ascending: false });
      
    // 如果不是获取所有订单，则按邮箱筛选
    if (!all && email) {
      loveStoryQuery = loveStoryQuery.eq('customer_email', email);
    }
    
    const { data: loveStoryOrders, error: loveStoryError } = await loveStoryQuery;
      
    if (loveStoryError) {
      console.error('Error fetching love story orders:', loveStoryError);
    }
    
    // 查询 funny_biography_books 表
    let funnyBiographyQuery = supabase
      .from('funny_biography_books')
      .select('*')
      .order('timestamp', { ascending: false });
      
    // 如果不是获取所有订单，则按邮箱筛选
    if (!all && email) {
      funnyBiographyQuery = funnyBiographyQuery.eq('customer_email', email);
    }
    
    const { data: funnyBiographyOrders, error: funnyBiographyError } = await funnyBiographyQuery;
      
    if (funnyBiographyError) {
      console.error('Error fetching funny biography orders:', funnyBiographyError);
    }
    
    // 合并结果并添加类型标识
    const loveStoryWithType = (loveStoryOrders || []).map(order => ({
      ...order,
      book_type: 'love_story'
    }));
    
    const funnyBiographyWithType = (funnyBiographyOrders || []).map(order => ({
      ...order,
      book_type: 'funny_biography'
    }));
    
    // 合并所有订单并按时间排序
    const allOrders = [...loveStoryWithType, ...funnyBiographyWithType]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 返回成功响应
    return res.status(200).json({
      success: true,
      orders: allOrders
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch orders: ${error.message}`
    });
  }
}
