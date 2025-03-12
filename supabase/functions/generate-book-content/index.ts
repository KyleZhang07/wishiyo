
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating book content for order ${orderId}`);

    // Fetch book data from the database
    const { data: bookData, error: fetchError } = await fetch(
      `${req.url.split('/generate-book-content')[0]}/get-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ orderId }),
      }
    ).then(res => res.json());

    if (fetchError || !bookData) {
      throw new Error(`Failed to fetch book data: ${fetchError || 'No data returned'}`);
    }

    const { title, author, selected_idea, answers, chapters } = bookData;
    
    if (!title || !author || !selected_idea || !chapters) {
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
    const { error: updateError } = await fetch(
      `${req.url.split('/generate-book-content')[0]}/update-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          orderId,
          bookContent: bookChapters,
        }),
      }
    ).then(res => res.json());

    if (updateError) {
      throw new Error(`Failed to update book data: ${updateError}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Book content generated successfully',
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
