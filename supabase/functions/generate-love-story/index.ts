
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
    Create a romantic book outline with exactly 10 pairs of chapters (20 chapters total).
    Each pair should consist of:
    - A text chapter describing a romantic scene or moment
    - An illustration chapter that visually captures the scene from the previous chapter

    Format the chapters exactly like this:
    Chapter [odd number]: [Title for text chapter]
    "[A poetic paragraph describing the romantic scene, emotions, and setting]"
    
    Chapter [even number]: [Title including 'Illustration' word]
    "[A detailed description of the illustration that would accompany the previous chapter, focusing on visual elements, composition, colors, and mood]"

    Example format:
    Chapter 1: Where We First Met
    "We first crossed paths on a warm afternoon, when a gentle breeze carried our laughter through the air. I still remember the look in your eyes—part curiosity, part excitement—as though we both knew this was the start of something extraordinary."

    Chapter 2: Illustration: The Fateful Encounter
    "A watercolor illustration capturing two figures meeting in a sunlit park. Cherry blossoms drift through the air as their eyes meet for the first time. Soft pastel colors blend together, emphasizing the magical quality of the moment."

    Use the provided love stories to create a personalized narrative that flows naturally from the couple's first meeting to their current relationship.
    Make each text chapter emotionally engaging and each illustration chapter visually descriptive.`

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
          { role: "user", content: `Create a romantic illustrated book for ${authorName}'s love story, using these details from their relationship: ${JSON.stringify(stories)}. Remember to alternate between text chapters and illustration chapters, with illustration chapters specifically describing what the illustration should show.` }
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
      description: "A journey of love told through alternating words and illustrations, each chapter pair capturing a special moment in our story - one to read, one to see.",
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
