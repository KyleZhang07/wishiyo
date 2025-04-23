import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 用于解析请求体的辅助函数
export const config = {
  api: {
    bodyParser: true,
  },
};

// 验证Lulu HMAC签名的函数
async function verifyLuluHmac(payload, hmacHeader, apiSecret) {
  try {
    // 如果没有提供HMAC头或API密钥，则跳过验证
    if (!hmacHeader || !apiSecret) {
      console.warn('[LULU-WEBHOOK] 缺少HMAC头或API密钥，跳过验证');
      return true;
    }

    // 在生产环境中，应该实现HMAC验证
    // 这需要使用与LuluPress相同的算法计算HMAC
    // 并与请求头中的HMAC进行比较
    console.log('[LULU-WEBHOOK] HMAC验证已跳过，请在生产环境中实现');
    return true;
  } catch (error) {
    console.error('[LULU-WEBHOOK] HMAC验证失败:', error);
    return false;
  }
}

// 更新订单状态并发送通知的辅助函数
async function updateOrderStatusAndNotify(supabase, orderId, type, status, trackingInfo = null) {
  try {
    // 确定表名
    const tableName = type === 'love_story' ? 'love_story_books' : 'funny_biography_books';
    
    // 准备更新数据
    const updateData = {
      lulu_print_status: status
    };
    
    // 根据状态更新订单状态字段
    if (status === 'SHIPPED') {
      updateData.status = 'shipped';
      if (trackingInfo) {
        if (trackingInfo.tracking_id) {
          updateData.lulu_tracking_number = trackingInfo.tracking_id;
        }
        if (trackingInfo.tracking_urls && trackingInfo.tracking_urls.length > 0) {
          updateData.lulu_tracking_url = trackingInfo.tracking_urls[0];
        }
      }
    } else if (status === 'REJECTED' || status === 'CANCELED') {
      updateData.status = 'error';
    } else if (status === 'CREATED' || status === 'ACCEPTED') {
      updateData.status = 'print_submitted';
    } else if (status === 'IN_PRODUCTION' || status === 'MANUFACTURING') {
      updateData.status = 'printing';
    }
    
    // 更新数据库
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('order_id', orderId)
      .select('customer_email, title')
      .single();
    
    if (error) {
      throw new Error(`更新订单状态失败: ${error.message}`);
    }
    
    // 如果有客户邮箱，发送通知
    if (data && data.customer_email) {
      // 调用Supabase函数发送邮件通知
      const notificationResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-order-status-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            email: data.customer_email,
            orderId,
            status,
            bookTitle: data.title || 'Your Book',
            trackingInfo,
            type
          })
        }
      );
      
      if (!notificationResponse.ok) {
        const errorText = await notificationResponse.text();
        console.error(`发送订单状态通知失败: ${notificationResponse.status} ${notificationResponse.statusText} - ${errorText}`);
      } else {
        console.log(`订单状态通知已发送至 ${data.customer_email}`);
      }
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('更新订单状态和发送通知时出错:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  console.log(`[LULU-WEBHOOK] 收到webhook请求，时间: ${new Date().toISOString()}`);
  
  // 只允许POST请求
  if (req.method !== 'POST') {
    console.log('[LULU-WEBHOOK] 不允许的方法:', req.method);
    return res.status(405).json({ error: '方法不允许' });
  }
  
  try {
    // 验证Supabase凭证
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[LULU-WEBHOOK] 缺少Supabase凭证');
      return res.status(500).json({
        success: false,
        error: '服务器配置错误: 缺少Supabase凭证'
      });
    }
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 获取HMAC签名头
    const hmacHeader = req.headers['lulu-hmac-sha256'];
    const luluApiSecret = process.env.LULU_CLIENT_SECRET;
    
    // 解析请求体
    const webhookData = req.body;
    console.log('[LULU-WEBHOOK] 收到的数据:', JSON.stringify(webhookData));
    
    // 验证HMAC签名
    const isValidHmac = await verifyLuluHmac(JSON.stringify(webhookData), hmacHeader, luluApiSecret);
    if (!isValidHmac) {
      console.error('[LULU-WEBHOOK] HMAC验证失败');
      return res.status(401).json({
        success: false,
        error: 'HMAC验证失败'
      });
    }
    
    // 验证webhook数据格式
    if (!webhookData || !webhookData.topic || webhookData.topic !== 'PRINT_JOB_STATUS_CHANGED' || !webhookData.data) {
      console.error('[LULU-WEBHOOK] 无效的webhook数据格式');
      return res.status(400).json({
        success: false,
        error: '无效的webhook数据格式'
      });
    }
    
    // 提取打印作业数据
    const printJobData = webhookData.data;
    
    // 验证必要字段
    if (!printJobData.external_id || !printJobData.status) {
      console.error('[LULU-WEBHOOK] 无效的打印作业数据');
      return res.status(400).json({
        success: false,
        error: '无效的打印作业数据，缺少必要字段'
      });
    }
    
    const orderId = printJobData.external_id;
    const status = printJobData.status.name;
    
    // 查找订单以确定类型
    let orderType = null;
    let order = null;
    
    // 先检查love_story_books表
    const { data: loveStoryOrder, error: loveStoryError } = await supabase
      .from('love_story_books')
      .select('order_id')
      .eq('order_id', orderId)
      .single();
    
    if (loveStoryOrder) {
      orderType = 'love_story';
      order = loveStoryOrder;
    } else {
      // 如果不在love_story_books表中，检查funny_biography_books表
      const { data: funnyBiographyOrder, error: funnyBiographyError } = await supabase
        .from('funny_biography_books')
        .select('order_id')
        .eq('order_id', orderId)
        .single();
      
      if (funnyBiographyOrder) {
        orderType = 'funny_biography';
        order = funnyBiographyOrder;
      }
    }
    
    // 如果找不到订单
    if (!order) {
      console.error(`[LULU-WEBHOOK] 找不到订单 ${orderId}`);
      return res.status(404).json({
        success: false,
        error: `找不到订单 ${orderId}`
      });
    }
    
    // 提取跟踪信息（如果有）
    let trackingInfo = null;
    if (status === 'SHIPPED' && printJobData.line_item_statuses && printJobData.line_item_statuses.length > 0) {
      const lineItemStatus = printJobData.line_item_statuses[0];
      if (lineItemStatus.messages) {
        trackingInfo = {
          tracking_id: lineItemStatus.messages.tracking_id,
          tracking_urls: lineItemStatus.messages.tracking_urls,
          carrier_name: lineItemStatus.messages.carrier_name
        };
      }
    }
    
    // 更新订单状态并发送通知
    const updateResult = await updateOrderStatusAndNotify(
      supabase,
      orderId,
      orderType,
      status,
      trackingInfo
    );
    
    if (!updateResult.success) {
      console.error(`[LULU-WEBHOOK] 更新订单状态失败: ${updateResult.error}`);
      return res.status(500).json({
        success: false,
        error: `更新订单状态失败: ${updateResult.error}`
      });
    }
    
    console.log(`[LULU-WEBHOOK] 订单 ${orderId} 状态已更新为 ${status}`);
    
    // 返回成功响应
    return res.status(200).json({
      success: true,
      message: `订单 ${orderId} 状态已更新为 ${status}`
    });
  } catch (error) {
    console.error('[LULU-WEBHOOK] 处理webhook时出错:', error);
    return res.status(500).json({
      success: false,
      error: `处理webhook时出错: ${error.message}`
    });
  }
}
