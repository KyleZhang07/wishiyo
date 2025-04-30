import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { email, page = 1, pageSize = 20 } = req.query;

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

  try {
    // 查询 love_story_books
    const { data: loveOrders = [], count: loveCount } = await supabase
      .from('love_story_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // 查询 funny_biography_books
    const { data: funnyOrders = [], count: funnyCount } = await supabase
      .from('funny_biography_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // 合并并按时间排序
    const mergedOrders = [...loveOrders, ...funnyOrders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // 只返回当前页的数据
    const pagedOrders = mergedOrders.slice(0, limit);
    const total = (loveCount || 0) + (funnyCount || 0);

    return res.status(200).json({
      success: true,
      orders: pagedOrders,
      total,
      page: parseInt(page, 10),
      pageSize: limit
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}
