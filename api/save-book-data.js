import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 获取表单数据
    const orderId = req.body.orderId;
    const bookTitle = req.body.bookTitle;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing order ID' });
    }

    console.log(`Received beacon request to save data for order ${orderId}`);

    // 从数据库检查数据是否已经存在
    const { data, error: checkError } = await supabase
      .from('funny_biography_books')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116是"未找到记录"的错误
      console.error('Error checking for existing record:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    // 如果记录已存在，不需要处理
    if (data) {
      console.log(`Data for order ${orderId} already exists in database`);
      return res.status(200).json({ success: true, message: 'Data already exists' });
    }

    // 记录不存在，但我们需要更多信息才能保存完整记录
    // 在这里，我们只记录订单ID和基本信息，后续由webhook处理完整数据
    const { error: insertError } = await supabase
      .from('funny_biography_books')
      .insert({
        order_id: orderId,
        title: bookTitle || 'Untitled Book',
        author: 'Unknown', // 占位符，将通过webhook更新
        status: 'pending_checkout',
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting backup record:', insertError);
      return res.status(500).json({ error: 'Failed to save backup data' });
    }

    console.log(`Successfully saved basic data for order ${orderId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing beacon request:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}