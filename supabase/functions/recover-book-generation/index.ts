import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS 头设置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 定义最大并发恢复任务数
const MAX_CONCURRENT_RECOVERIES = 3;
// 定义最大章节数
const TOTAL_CHAPTERS = 20;

// 定义类型
type Chapter = {
  chapterNumber: number;
  title: string;
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
};

type Book = {
  id: number;
  order_id: string;
  title: string;
  author: string;
  status: string;
  timestamp: string;
  book_content?: Chapter[];
  [key: string]: any;
};

type RecoveryResult = {
  recovered: boolean;
  reason?: string;
  error?: string;
  nextBatch?: number;
  completedChapters: number;
  totalChapters: number;
  lastCompletedChapter?: number;
};

serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // 初始化 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析请求参数
    const { manualCheck, orderId } = await req.json().catch(() => ({}));

    // 如果提供了特定的订单ID，只检查该订单
    if (orderId) {
      console.log(`Checking specific order: ${orderId}`);
      const { data: book, error } = await supabase
        .from('funny_biography_books')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error || !book) {
        throw new Error(`Order not found: ${error?.message || 'Unknown error'}`);
      }

      const recoveryResult = await checkAndRecoverBook(supabase, book, supabaseUrl, supabaseServiceKey);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Book generation recovery check completed',
          recovered: recoveryResult.recovered,
          details: recoveryResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 查找状态为 'processing' 的书籍
    const { data: processingBooks, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('status', 'processing');

    if (fetchError) {
      throw new Error(`Failed to fetch processing books: ${fetchError.message}`);
    }

    console.log(`Found ${processingBooks?.length || 0} books in 'processing' status`);

    // 筛选出需要恢复的书籍
    const booksToRecover: Book[] = [];
    for (const book of processingBooks || []) {
      // 检查书籍内容是否存在且是否完整
      if (book.book_content && Array.isArray(book.book_content)) {
        // 检查是否所有章节都已生成完成
        const completedChapters = book.book_content.filter(
          (chapter: Chapter) => chapter && chapter.chapterNumber && chapter.sections && chapter.sections.length === 4
        );

        // 如果章节数量不足，或者有章节的部分不完整，则需要恢复
        if (completedChapters.length < TOTAL_CHAPTERS) {
          // 检查最后更新时间，如果在过去30分钟内有更新，可能仍在生成中，暂不恢复
          const lastUpdateTime = new Date(book.timestamp).getTime();
          const currentTime = new Date().getTime();
          const timeDifference = currentTime - lastUpdateTime;

          // 如果超过30分钟没有更新，或者是手动检查，则添加到恢复列表
          if (manualCheck || timeDifference > 30 * 60 * 1000) {
            booksToRecover.push(book as Book);
          }
        }
      } else if (book.status === 'processing') {
        // 如果状态是processing但没有book_content，也需要恢复
        booksToRecover.push(book as Book);
      }
    }

    console.log(`Found ${booksToRecover.length} books that need recovery`);

    // 限制并发恢复的数量
    const booksToProcess = booksToRecover.slice(0, MAX_CONCURRENT_RECOVERIES);

    // 并发处理需要恢复的书籍
    const recoveryPromises = booksToProcess.map(book =>
      checkAndRecoverBook(supabase, book, supabaseUrl, supabaseServiceKey)
        .then(result => ({
          orderId: book.order_id,
          result
        }))
        .catch(error => {
          console.error(`Error recovering book ${book.order_id}:`, error);
          return {
            orderId: book.order_id,
            error: error.message
          };
        })
    );

    // 等待所有恢复任务完成
    const recoveryResults = await Promise.all(recoveryPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Book generation recovery process completed',
        totalProcessing: processingBooks?.length || 0,
        needRecovery: booksToRecover.length,
        processed: booksToProcess.length,
        results: recoveryResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in recover-book-generation:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// 检查并恢复书籍生成
async function checkAndRecoverBook(
  supabase: any,
  book: Book,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<RecoveryResult> {
  const orderId = book.order_id;
  console.log(`Checking book ${orderId} for recovery...`);

  // 如果没有book_content或不是数组，初始化为空数组
  const bookContent = Array.isArray(book.book_content) ? [...book.book_content] : [];

  // 检查已完成的章节
  const completedChapters = bookContent.filter(
    (chapter: Chapter) => chapter && chapter.chapterNumber && chapter.sections && chapter.sections.length === 4
  );

  console.log(`Book ${orderId} has ${completedChapters.length} completed chapters out of ${TOTAL_CHAPTERS}`);

  // 如果所有章节都已完成，更新状态为completed
  if (completedChapters.length >= TOTAL_CHAPTERS) {
    console.log(`Book ${orderId} has all chapters completed, updating status to 'completed'`);

    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ status: 'completed' })
      .eq('order_id', orderId);

    if (updateError) {
      console.error(`Error updating book ${orderId} status:`, updateError);
    }

    // 检查是否已经有PDF
    if (!book.interior_pdf && !book.interior_source_url) {
      // 触发内页PDF生成
      try {
        console.log(`Book ${orderId} has no PDF yet, triggering interior PDF generation`);
        fetch(`${supabaseUrl}/functions/v1/generate-interior-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            orderId,
            bookContent,
            bookTitle: book.title,
            authorName: book.author
          })
        }).catch(error => {
          console.error(`Error triggering PDF generation: ${error.message}`);
        });
      } catch (error) {
        console.error('Error calling interior PDF generation:', error);
      }
    } else {
      console.log(`Book ${orderId} already has PDF (interior_pdf: ${!!book.interior_pdf}, interior_source_url: ${!!book.interior_source_url}), skipping PDF generation`);
    }

    return {
      recovered: false,
      reason: 'all_chapters_complete',
      completedChapters: completedChapters.length,
      totalChapters: TOTAL_CHAPTERS
    };
  }

  // 确定下一个批次
  // 找出最后一个完整的章节编号
  let lastCompletedChapterNumber = 0;
  for (const chapter of bookContent) {
    if (chapter && chapter.chapterNumber && chapter.sections && chapter.sections.length === 4) {
      lastCompletedChapterNumber = Math.max(lastCompletedChapterNumber, chapter.chapterNumber);
    }
  }

  // 计算下一个批次号和起始章节
  const nextBatchNumber = Math.floor(lastCompletedChapterNumber / 1) + 1;

  console.log(`Recovering book ${orderId} from batch ${nextBatchNumber} (after chapter ${lastCompletedChapterNumber})`);

  // 触发下一批次生成
  try {
    console.log(`Triggering next batch (${nextBatchNumber}) for book ${orderId}`);

    fetch(`${supabaseUrl}/functions/v1/generate-book-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        orderId,
        batchNumber: nextBatchNumber,
        existingContent: bookContent
      })
    }).catch(error => {
      console.error(`Error triggering next batch: ${error.message}`);
    });

    return {
      recovered: true,
      nextBatch: nextBatchNumber,
      completedChapters: completedChapters.length,
      totalChapters: TOTAL_CHAPTERS,
      lastCompletedChapter: lastCompletedChapterNumber
    };
  } catch (error) {
    console.error(`Error recovering book ${orderId}:`, error);
    return {
      recovered: false,
      error: error instanceof Error ? error.message : String(error),
      completedChapters: completedChapters.length,
      totalChapters: TOTAL_CHAPTERS
    };
  }
}
