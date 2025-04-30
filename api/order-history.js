import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { email, page = 1, pageSize = 20 } = req.query;
  console.log(`[ORDER-HISTORY] 收到请求: email=${email}, page=${page}, pageSize=${pageSize}`);

  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing email' });
  }

  // 初始化 Supabase 客户端
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 分页参数
  const limit = Math.max(1, Math.min(parseInt(pageSize, 10) || 20, 100));
  const offset = (parseInt(page, 10) - 1) * limit;
  console.log(`[ORDER-HISTORY] 分页参数: limit=${limit}, offset=${offset}`);

  try {
    // 查询 love_story_books
    const { data: loveOrders = [], count: loveCount } = await supabase
      .from('love_story_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log(`[ORDER-HISTORY] love_story_books 查询结果: 找到 ${loveCount || 0} 条记录`);
    
    // 记录 love_story_books 的状态分布
    const loveStatusCounts = {};
    loveOrders.forEach(order => {
      loveStatusCounts[order.status] = (loveStatusCounts[order.status] || 0) + 1;
    });
    console.log(`[ORDER-HISTORY] love_story_books 状态分布:`, loveStatusCounts);

    // 查询 funny_biography_books
    const { data: funnyOrders = [], count: funnyCount } = await supabase
      .from('funny_biography_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log(`[ORDER-HISTORY] funny_biography_books 查询结果: 找到 ${funnyCount || 0} 条记录`);
    
    // 记录 funny_biography_books 的状态分布
    const funnyStatusCounts = {};
    funnyOrders.forEach(order => {
      funnyStatusCounts[order.status] = (funnyStatusCounts[order.status] || 0) + 1;
    });
    console.log(`[ORDER-HISTORY] funny_biography_books 状态分布:`, funnyStatusCounts);

    // 合并并按时间排序
    const mergedOrders = [...loveOrders, ...funnyOrders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 记录合并后的状态分布
    const mergedStatusCounts = {};
    mergedOrders.forEach(order => {
      mergedStatusCounts[order.status] = (mergedStatusCounts[order.status] || 0) + 1;
    });
    console.log(`[ORDER-HISTORY] 合并后状态分布:`, mergedStatusCounts);
    
    // 只返回当前页的数据
    const pagedOrders = mergedOrders.slice(0, limit);
    const total = (loveCount || 0) + (funnyCount || 0);

    // 记录最终返回的状态分布
    const finalStatusCounts = {};
    pagedOrders.forEach(order => {
      finalStatusCounts[order.status] = (finalStatusCounts[order.status] || 0) + 1;
    });
    console.log(`[ORDER-HISTORY] 最终返回状态分布:`, finalStatusCounts);

    console.log(`[ORDER-HISTORY] 返回数据: ${pagedOrders.length} 条记录, 总数: ${total}`);

    return res.status(200).json({
      success: true,
      orders: pagedOrders,
      total,
      page: parseInt(page, 10),
      pageSize: limit
    });
  } catch (error) {
    console.error('[ORDER-HISTORY] 查询订单出错:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}
