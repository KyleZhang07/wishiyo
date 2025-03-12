import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 处理CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // 初始化Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    if (!openaiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 查询书籍数据
    console.log(`Retrieving book data for order ${orderId}`);
    const { data: books, error: queryError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId);

    if (queryError) {
      console.error('Error querying book data:', queryError);
      throw queryError;
    }

    if (!books || books.length === 0) {
      throw new Error(`No book found with order ID: ${orderId}`);
    }

    const book = books[0];
    console.log(`Found book: ${book.title} by ${book.author}`);

    // 准备用于内容生成的数据
    const selectedIdea = book.selected_idea || {};
    const authorName = book.author || 'Friend';
    const answers = book.answers || {};
    const chapters = book.chapters || [];

    // 生成内容提示
    const prompt = generateContentPrompt(authorName, selectedIdea, answers, chapters);
    console.log('Generated content prompt');

    // 调用OpenAI生成内容
    console.log('Calling OpenAI to generate content');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo', // 或当前最佳模型
        messages: [
          { role: 'system', content: 'You are a creative and humorous writer, crafting funny biographies based on provided information.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;
    console.log('Successfully generated content');

    // 准备返回格式化的内容
    const bookContent = {
      title: book.title,
      author: authorName,
      content: generatedContent,
      chapters: chapters
    };

    // 返回生成的内容
    return res.status(200).json({
      success: true,
      bookContent: bookContent
    });
  } catch (error) {
    console.error('Error generating book content:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 生成内容提示函数
function generateContentPrompt(authorName, selectedIdea, answers, chapters) {
  const chapterPrompts = chapters.map(chapter => 
    `Chapter: ${chapter.title}
     Description: ${chapter.description || 'No description provided'}`
  ).join('\n\n');

  // 将answers对象转换为问答格式
  const answerText = Object.entries(answers).map(([question, answer]) => 
    `Question: ${question}
     Answer: ${answer}`
  ).join('\n\n');

  return `Write a funny and engaging biography for ${authorName} based on the following:

Title: ${selectedIdea.title || 'The ' + authorName + ' Chronicles'}

Book Style: Humorous, witty, and lighthearted

Chapters:
${chapterPrompts}

Personal Information:
${answerText}

Important guidelines:
1. Write engaging, humorous content for each chapter
2. The biography should be fictional and exaggerated for comedic effect
3. Each chapter should be approximately 500-800 words
4. Include funny anecdotes and stories
5. Maintain a positive and uplifting tone
6. Avoid any offensive or controversial content
7. Format the output as complete chapters with titles

Please generate the complete book content with all chapters.`;
} 