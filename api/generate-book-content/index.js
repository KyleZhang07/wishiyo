// CommonJS format for Vercel serverless functions
const fetch = require('isomorphic-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API configuration
module.exports = {
  config: {
    api: {
      bodyParser: true,
      externalResolver: true, // Allows external API calls
    },
    maxDuration: 300, // 5 minutes (adjust based on your Vercel plan)
  }
};

// Main handler function
module.exports = async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating book content for order ${orderId}`);

    // Get environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key');
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Fetch book data from the database
    const getBookResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/funny_biography_books?order_id=eq.${orderId}&select=*`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );

    if (!getBookResponse.ok) {
      throw new Error(`Failed to fetch book data: ${getBookResponse.status}`);
    }

    const bookData = await getBookResponse.json();
    if (!bookData || bookData.length === 0) {
      throw new Error(`No book data found for order ID: ${orderId}`);
    }

    const book = bookData[0];
    const { title, author, selected_idea, answers, chapters } = book;
    
    if (!title || !author || !selected_idea) {
      throw new Error('Incomplete book data for content generation');
    }

    const bookChapters = [];

    // Process chapters data from database to build outline
    const outline = chapters && Array.isArray(chapters) ? 
      chapters.map((chapter, index) => {
        return `Chapter ${index + 1}: ${chapter.title}\n${chapter.description || ''}`;
      }).join('\n\n') : '';

    // Get the selected idea description to use as a basis for the book
    const ideaDescription = selected_idea.description || '';
    
    // Process answers to questions as additional context
    const answersContext = answers && Array.isArray(answers) 
      ? answers.map((answer) => `Q: ${answer.question}\nA: ${answer.answer}`).join('\n\n')
      : '';

    // Generate content for 20 chapters with 4 sections each
    for (let i = 1; i <= 20; i++) {
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
You are writing a humorous biography book titled "${title}" about ${author}. 
The book concept is: ${ideaDescription}

Additional context about the subject:
${answersContext}

This is Chapter ${i}: ${chapterTitle}
${chapterDescription ? `Chapter description: ${chapterDescription}` : ''}

Write this chapter with 4 distinct sections. Make it entertaining, humorous and engaging.
For each section, provide a creative section title and approximately 500-700 words of content.
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
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
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

    // Update the database with the generated content
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/funny_biography_books?order_id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          book_content: bookChapters,
          status: 'content_generated'
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update book data: ${await updateResponse.text()}`);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Book content generated successfully',
      chaptersCount: bookChapters.length,
      bookContent: bookChapters // Return the generated content
    });
  } catch (error) {
    console.error('Error generating book content:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}