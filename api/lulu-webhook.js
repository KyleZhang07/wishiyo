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
          console.log(`[LULU-WEBHOOK] 设置跟踪号码: ${trackingInfo.tracking_id}`);
        } else {
          console.log('[LULU-WEBHOOK] 跟踪信息中没有 tracking_id');
        }

        if (trackingInfo.tracking_urls && trackingInfo.tracking_urls.length > 0) {
          updateData.lulu_tracking_url = trackingInfo.tracking_urls[0];
          console.log(`[LULU-WEBHOOK] 设置跟踪URL: ${trackingInfo.tracking_urls[0]}`);
        } else {
          console.log('[LULU-WEBHOOK] 跟踪信息中没有 tracking_urls 或为空');
        }
      } else {
        console.log('[LULU-WEBHOOK] 没有跟踪信息可用');
      }
    } else if (status === 'REJECTED' || status === 'CANCELED') {
      updateData.status = 'error';
    } else if (status === 'CREATED' || status === 'ACCEPTED') {
      updateData.status = 'print_submitted';
    } else if (status === 'IN_PRODUCTION' || status === 'MANUFACTURING') {
      updateData.status = 'printing';
    }

    console.log(`[LULU-WEBHOOK] 更新数据:`, JSON.stringify(updateData));

    // 更新数据库
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('order_id', orderId)
      .select('*') // 选择所有字段以验证更新
      .single();

    if (error) {
      console.error(`[LULU-WEBHOOK] 数据库更新错误:`, error);
      throw new Error(`更新订单状态失败: ${error.message}`);
    }

    // 验证更新是否成功
    console.log(`[LULU-WEBHOOK] 更新后的数据:`, JSON.stringify(data));
    if (status === 'SHIPPED' && trackingInfo) {
      if (trackingInfo.tracking_id && data.lulu_tracking_number !== trackingInfo.tracking_id) {
        console.warn(`[LULU-WEBHOOK] 跟踪号码未正确更新! 期望: ${trackingInfo.tracking_id}, 实际: ${data.lulu_tracking_number}`);
      }
      if (trackingInfo.tracking_urls && trackingInfo.tracking_urls.length > 0 && data.lulu_tracking_url !== trackingInfo.tracking_urls[0]) {
        console.warn(`[LULU-WEBHOOK] 跟踪URL未正确更新! 期望: ${trackingInfo.tracking_urls[0]}, 实际: ${data.lulu_tracking_url}`);
      }
    }

    // 只在特定状态下发送通知
    // 不再为 'CREATED' 和 'ACCEPTED' 状态发送通知，因为我们已经在订单提交时发送了确认邮件
    const notificationStatuses = ['IN_PRODUCTION', 'MANUFACTURING', 'SHIPPED', 'REJECTED', 'CANCELED'];

    // 如果有客户邮箱，且状态在需要通知的列表中，发送通知
    if (data && data.customer_email && notificationStatuses.includes(status)) {
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
    } else if (data && data.customer_email) {
      console.log(`订单 ${orderId} 状态 ${status} 不在通知列表中，跳过邮件通知`);
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
    console.log('[LULU-WEBHOOK] 打印作业数据:', JSON.stringify(printJobData));

    // 验证必要字段
    let orderId, status;

    // 根据文档，print_job_id 应该存在于 printJobData 中
    if (printJobData.print_job_id) {
      // 需要查询数据库，根据 print_job_id 找到对应的 order_id
      // 这里假设我们已经在数据库中存储了 lulu_print_job_id 字段
      const { data: orderData, error: orderError } = await supabase
        .from('love_story_books')
        .select('order_id')
        .eq('lulu_print_job_id', printJobData.print_job_id)
        .single();

      if (orderData) {
        orderId = orderData.order_id;
      } else {
        // 如果在 love_story_books 中找不到，尝试在 funny_biography_books 中查找
        const { data: funnyOrderData, error: funnyOrderError } = await supabase
          .from('funny_biography_books')
          .select('order_id')
          .eq('lulu_print_job_id', printJobData.print_job_id)
          .single();

        if (funnyOrderData) {
          orderId = funnyOrderData.order_id;
        } else {
          console.error(`[LULU-WEBHOOK] 找不到与 print_job_id ${printJobData.print_job_id} 对应的订单`);
          return res.status(404).json({
            success: false,
            error: `找不到与 print_job_id ${printJobData.print_job_id} 对应的订单`
          });
        }
      }
    } else if (printJobData.external_id) {
      // 兼容旧版本的 webhook 数据结构
      orderId = printJobData.external_id;
    } else {
      console.error('[LULU-WEBHOOK] 无法找到订单ID字段');
      return res.status(400).json({
        success: false,
        error: '无效的打印作业数据，缺少订单ID字段'
      });
    }

    // 根据文档，状态应该在 name 字段中
    if (printJobData.name) {
      status = printJobData.name;
    } else if (printJobData.status && printJobData.status.name) {
      // 兼容旧版本的 webhook 数据结构
      status = printJobData.status.name;
    } else {
      console.error('[LULU-WEBHOOK] 无法找到状态字段');
      return res.status(400).json({
        success: false,
        error: '无效的打印作业数据，缺少状态字段'
      });
    }

    console.log(`[LULU-WEBHOOK] 提取的订单ID: ${orderId}, 状态: ${status}`);

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
    if (status === 'SHIPPED') {
      // 从 line_items 数组中提取跟踪信息
      if (printJobData.line_items && printJobData.line_items.length > 0) {
        const lineItem = printJobData.line_items[0];
        console.log('[LULU-WEBHOOK] Line item:', JSON.stringify(lineItem));

        if (lineItem.status && lineItem.status.messages) {
          trackingInfo = {
            tracking_id: lineItem.status.messages.tracking_id,
            tracking_urls: lineItem.status.messages.tracking_urls,
            carrier_name: lineItem.status.messages.carrier_name
          };
          console.log('[LULU-WEBHOOK] 提取的跟踪信息:', JSON.stringify(trackingInfo));
        } else {
          console.log('[LULU-WEBHOOK] Line item 中没有 status.messages 字段');
        }
      } else {
        console.log('[LULU-WEBHOOK] 没有找到 line_items 字段或为空');
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
