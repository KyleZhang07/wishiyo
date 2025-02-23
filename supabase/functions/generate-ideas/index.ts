
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, stories, bookType, category } = await req.json();
    console.log('Received request:', { authorName, bookType, category });
    console.log('Stories:', stories);

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (category === 'fun' && bookType === 'funny-book') {
      systemPrompt = `You are a creative book idea generator. Generate engaging and humorous book ideas based on real stories and anecdotes about a person. Always follow this format for each idea:

Title: [The catchy title]
Description: [A detailed, engaging description of the book idea that captures the essence of the stories in a humorous way. Make it at least 2-3 sentences long.]

Separate multiple ideas with two newlines.`;
      
      userPrompt = `Generate 3 unique and entertaining book ideas based on these stories about ${authorName}:\n\n${JSON.stringify(stories)}\n\nMake sure each idea has both a title and description section, properly formatted as specified. Focus on humor and entertainment value.`;
    } else if (category === 'fantasy' && bookType === 'fantasy-book') {
      systemPrompt = `You are a fantasy book outline generator. Create a detailed chapter outline for an imaginative story.`;
      userPrompt = `Create a fantasy book outline with chapters based on this story about ${authorName}:\n\n${JSON.stringify(stories)}\n\nFormat your response as:\n\nTitle: [An imaginative title]\nDescription: [A captivating description]\n\nChapter 1: [Title]\n[Chapter description]\n\n[Continue with 5-7 chapters]`;
    } else {
      throw new Error('Unsupported book type or category');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const rawContent = data.choices[0].message.content;
    console.log('Raw content:', rawContent);

    let processedData;
    
    if (category === 'fun') {
      try {
        const ideas = rawContent.split(/\n\n+/).filter(Boolean).map(ideaText => {
          const titleMatch = ideaText.match(/Title:\s*(.+?)(?=\n|$)/);
          const descMatch = ideaText.match(/Description:\s*(.+?)(?=\n\n|$)/s);
          
          const title = titleMatch ? titleMatch[1].trim() : 'Untitled Fun Story';
          const description = descMatch ? descMatch[1].trim() : 'A collection of hilarious moments and memorable stories.';

          return {
            title,
            author: authorName,
            description,
            praises: []
          };
        });

        processedData = { ideas };
      } catch (error) {
        console.error('Error parsing fun category response:', error);
        throw new Error('Failed to parse book ideas');
      }
    } else {
      try {
        const lines = rawContent.split('\n');
        let title = '';
        let description = '';
        let chapters = [];
        let currentSection = '';

        lines.forEach(line => {
          if (line.startsWith('Title:')) {
            title = line.replace('Title:', '').trim();
          } else if (line.startsWith('Description:')) {
            currentSection = 'description';
          } else if (line.toLowerCase().includes('chapter')) {
            if (currentSection === 'description') {
              description = description.trim();
            }
            currentSection = 'chapter';
            const titleMatch = line.match(/Chapter \d+:?\s*(.+)/i);
            if (titleMatch) {
              chapters.push({
                title: titleMatch[1].trim(),
                description: ''
              });
            }
          } else if (line.trim() && currentSection === 'description') {
            description += ' ' + line.trim();
          } else if (line.trim() && currentSection === 'chapter' && chapters.length > 0) {
            chapters[chapters.length - 1].description += ' ' + line.trim();
          }
        });

        chapters = chapters.map(chapter => ({
          ...chapter,
          description: chapter.description.trim()
        }));

        const idea = {
          title: title || 'Untitled Fantasy Story',
          author: authorName,
          description: description.trim() || 'A magical journey into a world of imagination and wonder.',
          praises: [],
          chapters
        };

        processedData = { idea };
      } catch (error) {
        console.error('Error parsing fantasy category response:', error);
        throw new Error('Failed to parse book outline');
      }
    }

    console.log('Processed data:', processedData);

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
