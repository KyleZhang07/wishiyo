
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters');
    }

    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const openai = new OpenAIApi(configuration);

    // Create a system prompt based on the book type and category
    let systemPrompt = "";
    let userPrompt = "";

    if (category === 'friends' && bookType === 'funny-biography') {
      systemPrompt = `You are a creative book idea generator. Generate engaging and humorous biography book ideas based on real stories and anecdotes about a person.`;
      userPrompt = `Generate 3 unique and entertaining biography book ideas based on these stories about ${authorName}:\n\n${JSON.stringify(stories)}\n\nEach book idea should have:\n- A catchy title\n- Author name as "${authorName}"\n- An engaging description that captures the essence of the stories in a humorous way`;
    } else if (category === 'love' && bookType === 'love-story') {
      systemPrompt = `You are a romantic book outline generator. Create a detailed chapter outline for a love story based on the provided information.`;
      userPrompt = `Create a romantic book outline with chapters based on this love story about ${authorName}:\n\n${JSON.stringify(stories)}\n\nInclude:\n- A romantic title\n- Author name as "${authorName}"\n- A heartfelt description\n- 5-7 chapters with titles and brief descriptions`;
    } else {
      throw new Error('Unsupported book type or category');
    }

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
    });

    if (!response.data.choices[0].message) {
      throw new Error('No response from OpenAI');
    }

    const rawContent = response.data.choices[0].message.content;
    console.log('Raw OpenAI response:', rawContent);

    let processedData;
    
    if (category === 'friends') {
      // For friends category, parse multiple book ideas
      try {
        // Extract book ideas from the response
        const ideas = rawContent.split(/(?=Title:)/).filter(Boolean).map(ideaText => {
          const title = (ideaText.match(/Title: (.+)/) || [])[1] || 'Untitled';
          const author = authorName;
          const description = (ideaText.match(/Description: (.+)/s) || [])[1] || 'No description available';
          
          return {
            title: title.trim(),
            author,
            description: description.trim(),
            praises: []
          };
        });

        processedData = { ideas };
      } catch (error) {
        console.error('Error parsing friends category response:', error);
        throw new Error('Failed to parse book ideas');
      }
    } else {
      // For love category, parse single book with chapters
      try {
        const lines = rawContent.split('\n');
        let title = 'Untitled';
        let description = '';
        let chapters: any[] = [];
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

        // Clean up chapter descriptions
        chapters = chapters.map(chapter => ({
          ...chapter,
          description: chapter.description.trim()
        }));

        const idea = {
          title,
          author: authorName,
          description: description.trim(),
          praises: [],
          chapters
        };

        processedData = { idea };
      } catch (error) {
        console.error('Error parsing love category response:', error);
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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
