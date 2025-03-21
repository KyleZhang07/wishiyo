import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 检查并处理待打印的订单
 * 此端点会检查数据库中 ready_to_print=true 但 lulu_print_id 为空的订单
 * 并为它们触发 Lulu 打印请求
 */
export default async function handler(req, res) {
  console.log('===== CHECKING PENDING PRINTS =====');
  
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 处理结果对象
    const results = {
      success: true,
      processed: {
        love_story: [],
        funny_biography: []
      },
      errors: []
    };
    
    console.log('Checking for pending love story orders...');
    // 处理 love_story_books 表中的待打印订单
    const { data: loveStoryOrders, error: loveStoryError } = await supabase
      .from('love_story_books')
      .select('*')
      .eq('ready_to_print', true)
      .is('lulu_print_id', null)
      .is('lulu_print_status', null);
      
    if (loveStoryError) {
      console.error('Error fetching love story orders:', loveStoryError);
      results.errors.push({
        type: 'love_story',
        error: loveStoryError.message
      });
    }
    
    console.log('Checking for pending funny biography orders...');
    // 处理 funny_biography_books 表中的待打印订单
    const { data: funnyBiographyOrders, error: funnyBiographyError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('ready_to_print', true)
      .is('lulu_print_id', null)
      .is('lulu_print_status', null);
      
    if (funnyBiographyError) {
      console.error('Error fetching funny biography orders:', funnyBiographyError);
      results.errors.push({
        type: 'funny_biography',
        error: funnyBiographyError.message
      });
    }
    
    console.log(`Found ${loveStoryOrders?.length || 0} pending love story orders and ${funnyBiographyOrders?.length || 0} pending funny biography orders`);
    
    // 获取基础URL - 在生产环境中使用域名或环境变量
    const baseUrl = process.env.VERCEL_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || 'wishiyo.com'}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    
    // 为每个待打印的 love_story 订单触发打印请求
    if (loveStoryOrders && loveStoryOrders.length > 0) {
      for (const order of loveStoryOrders) {
        try {
          console.log(`Processing love story order ${order.id}...`);
          // 调用 lulu-print-request API
          const printResponse = await fetch(`${baseUrl}/api/lulu-print-request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: order.id,
              type: 'love_story'
            })
          });
          
          const printResult = await printResponse.json();
          
          if (printResult.success) {
            console.log(`Successfully processed love story order ${order.id}`);
            results.processed.love_story.push({
              id: order.id,
              print_id: printResult.print_id
            });
          } else {
            console.error(`Error processing love story order ${order.id}:`, printResult.error);
            results.errors.push({
              type: 'love_story',
              id: order.id,
              error: printResult.error
            });
          }
        } catch (error) {
          console.error(`Error processing love story order ${order.id}:`, error);
          results.errors.push({
            type: 'love_story',
            id: order.id,
            error: error.message
          });
        }
      }
    }
    
    // 为每个待打印的 funny_biography 订单触发打印请求
    if (funnyBiographyOrders && funnyBiographyOrders.length > 0) {
      for (const order of funnyBiographyOrders) {
        try {
          console.log(`Processing funny biography order ${order.id}...`);
          // 调用 lulu-print-request API
          const printResponse = await fetch(`${baseUrl}/api/lulu-print-request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: order.id,
              type: 'funny_biography'
            })
          });
          
          const printResult = await printResponse.json();
          
          if (printResult.success) {
            console.log(`Successfully processed funny biography order ${order.id}`);
            results.processed.funny_biography.push({
              id: order.id,
              print_id: printResult.print_id
            });
          } else {
            console.error(`Error processing funny biography order ${order.id}:`, printResult.error);
            results.errors.push({
              type: 'funny_biography',
              id: order.id,
              error: printResult.error
            });
          }
        } catch (error) {
          console.error(`Error processing funny biography order ${order.id}:`, error);
          results.errors.push({
            type: 'funny_biography',
            id: order.id,
            error: error.message
          });
        }
      }
    }
    
    console.log('Finished processing pending print orders');
    // 返回处理结果
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error checking pending prints:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to check pending prints: ${error.message}`
    });
  }
}
