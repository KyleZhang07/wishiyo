import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 添加Deno类型声明，避免TypeScript错误
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// 定义批次大小和总章节数（与generate-book-content保持一致）
const BATCH_SIZE = 1;
const TOTAL_CHAPTERS = 20;

// 定义最大不活动时间（毫秒），超过这个时间的生成任务将被视为中断
const MAX_INACTIVITY_TIME = 10 * 60 * 1000; // 10分钟

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取Supabase连接信息
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for incomplete books...');

    // 查找状态为'generating'的书籍
    const { data: generatingBooks, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('order_id, book_content, updated_at')
      .eq('status', 'generating');

    if (fetchError) {
      throw new Error(`Failed to fetch generating books: ${fetchError.message}`);
    }

    console.log(`Found ${generatingBooks?.length || 0} books in 'generating' status`);

    // 处理结果
    const resumedBooks = [];
    const now = new Date();

    if (generatingBooks && generatingBooks.length > 0) {
      for (const book of generatingBooks) {
        const bookChapters = book.book_content || [];
        
        // 检查是否已完成所有章节
        const completedChapters = bookChapters.filter(ch => 
          ch && ch.sections && ch.sections.length === 4 && 
          ch.sections.every(s => s && s.content && !s.content.includes('There was an error processing this chapter'))
        ).length;

        console.log(`Order ${book.order_id}: ${completedChapters}/${TOTAL_CHAPTERS} chapters completed`);

        if (completedChapters < TOTAL_CHAPTERS) {
          // 检查最后更新时间
          const lastUpdated = new Date(book.updated_at);
          const timeSinceUpdate = now.getTime() - lastUpdated.getTime();

          // 如果最后更新时间超过阈值，认为生成过程中断
          if (timeSinceUpdate > MAX_INACTIVITY_TIME) {
            console.log(`Order ${book.order_id} appears stalled (last updated ${Math.round(timeSinceUpdate/60000)} minutes ago), resuming generation...`);

            // 计算下一个批次
            const nextChapter = completedChapters + 1;
            const nextBatchNumber = Math.ceil(nextChapter / BATCH_SIZE);

            // 触发生成过程
            try {
              const response = await fetch(`${supabaseUrl}/functions/v1/generate-book-content`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  orderId: book.order_id,
                  batchNumber: nextBatchNumber,
                  existingContent: bookChapters
                })
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to resume generation: ${errorText}`);
              }

              console.log(`Successfully resumed generation for order ${book.order_id}, batch ${nextBatchNumber}`);
              resumedBooks.push({
                order_id: book.order_id,
                batch: nextBatchNumber,
                completed_chapters: completedChapters
              });
            } catch (error) {
              console.error(`Error resuming generation for order ${book.order_id}:`, error);
            }
          } else {
            console.log(`Order ${book.order_id} was updated recently (${Math.round(timeSinceUpdate/60000)} minutes ago), skipping`);
          }
        } else {
          console.log(`Order ${book.order_id} has all ${TOTAL_CHAPTERS} chapters completed`);
          
          // 如果所有章节都已完成，但状态仍为'generating'，触发PDF生成
          try {
            const { data: bookData } = await supabase
              .from('funny_biography_books')
              .select('title, author')
              .eq('order_id', book.order_id)
              .single();
              
            if (bookData) {
              console.log(`Triggering interior PDF generation for completed book ${book.order_id}`);
              
              const response = await fetch(`${supabaseUrl}/functions/v1/generate-interior-pdf`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  orderId: book.order_id,
                  bookContent: bookChapters,
                  bookTitle: bookData.title,
                  authorName: bookData.author
                })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error triggering PDF generation: ${errorText}`);
              } else {
                console.log(`Successfully triggered PDF generation for order ${book.order_id}`);
              }
            }
          } catch (error) {
            console.error(`Error handling completed book ${book.order_id}:`, error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: generatingBooks?.length || 0,
        resumed: resumedBooks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking incomplete books:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
