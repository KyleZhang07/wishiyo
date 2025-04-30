import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

  try {
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 获取查询参数
    const { email, page = 1, pageSize = 20 } = req.query;
    
    // 验证必要参数
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing email parameter' 
      });
    }

    // 计算分页偏移量
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * pageSizeNum;
    
    console.log(`Fetching orders for email: ${email}, page: ${pageNum}, pageSize: ${pageSizeNum}`);

    // 查询 love_story_books 表
    const { data: loveStoryBooks, error: loveStoryError, count: loveStoryCount } = await supabase
      .from('love_story_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);

    if (loveStoryError) {
      console.error('Error fetching love story books:', loveStoryError);
    }

    // 查询 funny_biography_books 表
    const { data: funnyBiographyBooks, error: funnyBiographyError, count: funnyBiographyCount } = await supabase
      .from('funny_biography_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);

    if (funnyBiographyError) {
      console.error('Error fetching funny biography books:', funnyBiographyError);
    }

    // 如果两个查询都失败，返回错误
    if (loveStoryError && funnyBiographyError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }

    // 处理结果
    const loveStoryResults = loveStoryBooks || [];
    const funnyBiographyResults = funnyBiographyBooks || [];

    // 为每个订单添加类型标记
    const loveStoryWithType = loveStoryResults.map(book => ({
      ...book,
      type: 'love_story'
    }));

    const funnyBiographyWithType = funnyBiographyResults.map(book => ({
      ...book,
      type: 'funny_biography'
    }));

    // 合并两个表的结果
    let allBooks = [...loveStoryWithType, ...funnyBiographyWithType];
    
    // 按时间戳排序（最新的在前）
    allBooks.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });
    
    // 计算总数
    const totalCount = (loveStoryCount || 0) + (funnyBiographyCount || 0);
    
    // 如果需要分页，截取适当的结果集
    // 注意：这里的分页逻辑是简化的，实际上应该在数据库层面做更精确的分页
    allBooks = allBooks.slice(0, pageSizeNum);

    // 返回结果
    return res.status(200).json({
      success: true,
      orders: allBooks,
      total: totalCount,
      page: pageNum,
      pageSize: pageSizeNum
    });

  } catch (error) {
    console.error('Error in order-history API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
