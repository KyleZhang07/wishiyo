
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { stories, authorName } = await req.json()

    const systemPrompt = `You are a professional writer specializing in creating romantic illustrated books. 
    Create a table of contents for an illustrated book with exactly 20 chapters. 
    Each chapter should alternate between text and illustration pages.
    The text should be romantic, poetic, and personal, reflecting the couple's journey together.
    
    Format each chapter like this:
    Chapter [number]: [Title]
    "[A short, poetic paragraph describing the scene and emotions]"

    Use the provided stories and details to craft a cohesive narrative that flows naturally from their first meeting to their current relationship.
    Make the content emotional, personal, and incorporate specific details from their stories.
    Each chapter's text should directly relate to its accompanying illustration.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a romantic illustrated book table of contents for ${authorName}'s love story. Use these details from their story: ${JSON.stringify(stories)}` }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the generated content into a structured format
    const chapters = content.split('\n\n').filter(Boolean).map((chapter: string) => {
      const titleMatch = chapter.match(/Chapter \d+: (.+)/)
      const descriptionMatch = chapter.match(/"([^"]+)"/)
      
      return {
        title: titleMatch ? titleMatch[1] : '',
        description: descriptionMatch ? descriptionMatch[1] : ''
      }
    })

    const bookIdea = {
      title: "Our Illustrated Love Story",
      author: authorName,
      description: "A journey of love told through words and illustrations, capturing the magical moments that make our story unique.",
      chapters: chapters
    }

    return new Response(
      JSON.stringify({ idea: bookIdea }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
