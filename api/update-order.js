import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 更新订单信息的API端点
 * 可用于设置订单的ready_to_print状态
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { orderId, type, ready_to_print = true } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: orderId'
      });
    }

    // 确定要更新的表名
    const tableName = type === 'love_story' ? 'love_story_books' : 'funny_biography_books';

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 更新订单状态
    const { data, error } = await supabase
      .from(tableName)
      .update({ 
        ready_to_print: ready_to_print,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error(`Error updating order ${orderId} in ${tableName}:`, error);
      return res.status(500).json({
        success: false,
        error: `Failed to update order: ${error.message}`
      });
    }

    console.log(`Successfully updated order ${orderId} in ${tableName}, set ready_to_print=${ready_to_print}`);
    return res.status(200).json({
      success: true,
      message: `Order ${orderId} updated successfully`,
      data
    });
  } catch (error) {
    console.error('Error in update-order handler:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
}
