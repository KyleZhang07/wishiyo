// 辅助函数：自动提交打印请求到 Lulu Press
export async function submitPrintRequest(
  orderId: string,
  type: 'love_story' | 'funny_biography',
  baseUrl: string,
  serviceKey: string,
  supabase?: any // 可选的 Supabase 客户端，用于检查订单状态
): Promise<{ success: boolean; message: string; print_job_id?: string }> {
  try {
    console.log(`Auto-submitting print request for ${type} book: ${orderId}`);

    // 如果提供了 Supabase 客户端，检查订单状态以防止重复提交
    if (supabase) {
      const tableName = type === 'love_story' ? 'love_story_books' : 'funny_biography_books';
      const { data: order, error } = await supabase
        .from(tableName)
        .select('status, lulu_print_status, lulu_print_job_id')
        .eq('order_id', orderId)
        .single();

      if (error) {
        console.error(`Error checking order status: ${error.message}`);
      } else if (order) {
        // 如果订单已经提交到 Lulu Press，不再重复提交
        if (order.lulu_print_status || order.status === 'print_submitted' || order.lulu_print_job_id) {
          console.log(`Order ${orderId} already submitted to Lulu Press (status: ${order.status}, lulu_status: ${order.lulu_print_status}), skipping`);
          return {
            success: false,
            message: `Order already submitted to Lulu Press`
          };
        }
      }
    }

    // 调用 API 发送打印请求
    const response = await fetch(`${baseUrl}/api/lulu-print-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        orderId,
        type,
        autoSubmit: true // 标记为自动提交
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error calling lulu-print-request API: ${response.status} ${response.statusText} - ${errorText}`);
      return {
        success: false,
        message: `Failed to submit print request: ${response.statusText}`
      };
    }

    const data = await response.json();

    // 如果 API 返回成功但有警告，记录警告
    if (data.warning) {
      console.warn(`Warning from print request: ${data.warning}`);
    }

    return {
      success: true,
      message: data.message || 'Print request submitted successfully',
      print_job_id: data.print_job_id
    };
  } catch (error) {
    console.error(`Error submitting print request for ${orderId}:`, error);
    return {
      success: false,
      message: `Error submitting print request: ${error.message}`
    };
  }
}
