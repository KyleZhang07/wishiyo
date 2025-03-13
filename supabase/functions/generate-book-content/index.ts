import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// 添加Deno类型声明，避免TypeScript错误
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Define book chapter structure
interface BookChapter {
  chapterNumber: number;
  title: string;
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, title, author, format } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating book content for order ${orderId}`);

    // 获取Supabase连接信息
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从数据库直接获取图书数据
    console.log(`Fetching book data for order ${orderId} from database`);
    const { data: bookData, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId)
      .single();

    console.log('Book data fetch response:', { 
      success: !!bookData, 
      hasError: !!fetchError, 
      errorMessage: fetchError?.message || 'none' 
    });

    if (fetchError || !bookData) {
      throw new Error(`Failed to fetch book data: ${fetchError?.message || 'No data returned'}`);
    }

    // 使用直接传递的title和author，如果没有则使用数据库值
    const bookTitle = title || bookData.title;
    const bookAuthor = author || bookData.author;
    const { selected_idea, answers, chapters } = bookData;
    
    if (!bookTitle || !bookAuthor || !selected_idea || !chapters) {
      throw new Error('Incomplete book data for content generation');
    }

    const bookChapters: BookChapter[] = [];

    // Process chapters data from database to build outline
    const outline = chapters.map((chapter: any, index: number) => {
      return `Chapter ${index + 1}: ${chapter.title}\n${chapter.description || ''}`;
    }).join('\n\n');

    // Generate prompts for OpenAI
    // Get the selected idea description to use as a basis for the book
    const ideaDescription = selected_idea.description || '';
    
    // Process answers to questions as additional context
    const answersContext = answers && Array.isArray(answers) 
      ? answers.map((answer: any) => `Q: ${answer.question}\nA: ${answer.answer}`).join('\n\n')
      : '';

    // Generate content for 20 chapters with 4 sections each
    for (let i = 1; i <= 2; i++) {  // 从20章减少到2章用于测试
      console.log(`Generating chapter ${i} content...`);
      
      let chapterTitle = '';
      let chapterDescription = '';
      
      // Try to find matching chapter in the existing chapter outlines
      if (chapters && Array.isArray(chapters) && chapters.length >= i) {
        const existingChapter = chapters[i - 1];
        if (existingChapter) {
          chapterTitle = existingChapter.title || `Chapter ${i}`;
          chapterDescription = existingChapter.description || '';
        }
      }
      
      if (!chapterTitle) {
        chapterTitle = `Chapter ${i}`;
      }

      const prompt = `
You are writing a humorous biography book titled "${bookTitle}" about ${bookAuthor}. 
The book concept is: ${ideaDescription}

Additional context about the subject:
${answersContext}

This is Chapter ${i}: ${chapterTitle}
${chapterDescription ? `Chapter description: ${chapterDescription}` : ''}

Write this chapter with 2 distinct sections. Make it entertaining, humorous and engaging.
For each section, provide a creative section title and approximately 300-400 words of content.
Write in a conversational, entertaining style appropriate for a funny biography.
Include anecdotes, humorous observations, and witty commentary.

Format your response as JSON with this structure:
{
  "chapterNumber": ${i},
  "title": "Chapter title",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Section title",
      "content": "Section content..."
    },
    ...
  ]
}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You must respond with valid JSON only. Do not include any explanation outside the JSON structure.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const chapterContent = result.choices[0].message.content;
      
      try {
        // Parse the JSON response
        const parsedChapter = JSON.parse(chapterContent);
        bookChapters.push(parsedChapter);
      } catch (parseError) {
        console.error(`Error parsing chapter ${i} content:`, parseError);
        // 记录原始内容的前300个字符用于调试
        console.error(`Original content (first 300 chars): ${chapterContent.substring(0, 300)}...`);
        
        // If parsing fails, create a structured chapter with the raw content
        bookChapters.push({
          chapterNumber: i,
          title: chapterTitle,
          sections: [
            {
              sectionNumber: 1,
              title: "Content Error",
              content: "There was an error processing this chapter's content."
            }
          ]
        });
      }
    }

    // 直接更新数据库中的内容，而不是通过另一个函数调用
    console.log('Updating database with the generated book content');
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({
        book_content: bookChapters
      })
      .eq('order_id', orderId);

    if (updateError) {
      throw new Error(`Failed to update book data: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Book content generated successfully',
        bookContent: bookChapters,
        chaptersCount: bookChapters.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating book content:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
