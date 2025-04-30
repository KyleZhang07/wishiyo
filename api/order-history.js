import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const email = req.query.email;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 20;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing email' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 查询 love_story_books
    const { data: loveOrders, count: loveCount, error: loveError } = await supabase
      .from('love_story_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // 查询 funny_biography_books
    const { data: funnyOrders, count: funnyCount, error: funnyError } = await supabase
      .from('funny_biography_books')
      .select('*', { count: 'exact' })
      .eq('customer_email', email)
      .order('timestamp', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (loveError || funnyError) {
      return res.status(500).json({ success: false, error: loveError?.message || funnyError?.message });
    }

    // 合并并排序
    const allOrders = [...(loveOrders || []).map(o => ({ ...o, type: 'love_story' })), ...(funnyOrders || []).map(o => ({ ...o, type: 'funny_biography' }))];
    allOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const pagedOrders = allOrders.slice(0, pageSize); // 这里保证合并后分页
    const total = (loveCount || 0) + (funnyCount || 0);

    return res.status(200).json({
      success: true,
      orders: pagedOrders,
      total,
      page,
      pageSize
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
