import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Hello from generate ideas!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { authorName, stories, bookType, category } = await req.json()

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters')
    }

    // For friends category (multiple ideas)
    if (category === 'friends') {
      const ideas = generateFriendsIdeas(authorName, stories, bookType)
      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // For love and kids categories (single idea with stories)
    const idea = generateSingleIdea(authorName, stories, bookType, category)
    return new Response(
      JSON.stringify({ idea }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateSingleIdea(authorName: string, stories: any[], bookType: string, category: string) {
  let title = ''
  let generatedStories = []

  if (category === 'love') {
    title = `15 Reasons Why I Love ${authorName}`
    // Generate 15 love-themed story titles
    generatedStories = Array(15).fill(null).map((_, i) => ({
      title: generateLoveStoryTitle(authorName, i)
    }))
  } else if (category === 'kids') {
    title = `Adventures with ${authorName}`
    // Generate 15 kid-friendly story titles
    generatedStories = Array(15).fill(null).map((_, i) => ({
      title: generateKidsStoryTitle(authorName, i)
    }))
  }

  return {
    title,
    author: "Your Loving Friend",
    stories: generatedStories
  }
}

function generateLoveStoryTitle(authorName: string, index: number) {
  const loveTitles = [
    `When ${authorName} Made Me Smile`,
    `The Day I Knew ${authorName} Was Special`,
    `${authorName}'s Perfect Surprise`,
    `Dancing in the Rain with ${authorName}`,
    `${authorName}'s Warm Embrace`,
    `Cooking Together with ${authorName}`,
    `${authorName}'s Beautiful Laughter`,
    `Stargazing with ${authorName}`,
    `${authorName}'s Kind Heart`,
    `Adventures with ${authorName}`,
    `${authorName}'s Little Acts of Love`,
    `The Joy ${authorName} Brings`,
    `${authorName}'s Sweet Words`,
    `Dreaming with ${authorName}`,
    `Why ${authorName} Is My Everything`
  ]
  return loveTitles[index]
}

function generateKidsStoryTitle(authorName: string, index: number) {
  const kidsTitles = [
    `${authorName}'s Magic Garden Adventure`,
    `${authorName} and the Flying Dragon`,
    `${authorName}'s Space Mission`,
    `${authorName} Discovers a Treasure Map`,
    `${authorName}'s Underwater Kingdom`,
    `${authorName} and the Friendly Monster`,
    `${authorName}'s Time Machine Journey`,
    `${authorName} Saves the Forest Animals`,
    `${authorName}'s Cloud Castle`,
    `${authorName} and the Musical Rainbow`,
    `${authorName}'s Dinosaur Discovery`,
    `${authorName}'s Pirate Adventure`,
    `${authorName} and the Magic Paintbrush`,
    `${authorName}'s Circus Adventure`,
    `${authorName}'s Secret Garden`
  ]
  return kidsTitles[index]
}

function generateFriendsIdeas(authorName: string, stories: any[], bookType: string) {
  const ideas = []
  
  if (bookType === 'funny-biography') {
    ideas.push({
      title: `The Hilarious Life of ${authorName}`,
      author: "Your Best Friend",
      description: `A comedic journey through ${authorName}'s most memorable (and embarrassing) moments, filled with inside jokes and funny stories that only true friends would know.`
    })
    ideas.push({
      title: `${authorName}: A Comedy of Errors`,
      author: "Your Partner in Crime",
      description: `From epic fails to legendary victories, this book chronicles the amusing adventures and misadventures of ${authorName} with a healthy dose of humor and friendship.`
    })
    ideas.push({
      title: `The Unofficial Guide to ${authorName}`,
      author: "Chief Entertainment Officer",
      description: `A collection of hilarious stories, quirky habits, and legendary moments that make ${authorName} the uniquely entertaining person we all know and love.`
    })
  } else if (bookType === 'wild-fantasy') {
    ideas.push({
      title: `${authorName}: Hero of the Realm`,
      author: "The Chronicler of Legends",
      description: `An epic fantasy tale where ${authorName} becomes a legendary hero, wielding magical powers and embarking on extraordinary quests in a world of wonder and adventure.`
    })
    ideas.push({
      title: `The Mystical Journey of ${authorName}`,
      author: "Keeper of Tales",
      description: `A magical story where ${authorName}'s real-life personality traits become extraordinary powers in a fantasy realm filled with mythical creatures and epic challenges.`
    })
    ideas.push({
      title: `${authorName}'s Parallel Universe`,
      author: "Master of Mysteries",
      description: `Discover an alternate reality where ${authorName} leads a secret life as a powerful mage, guardian of ancient mysteries, and protector of magical realms.`
    })
  } else if (bookType === 'prank-book') {
    ideas.push({
      title: `${authorName}'s Greatest Pranks`,
      author: "The Mischief Maker",
      description: `A collection of legendary pranks, clever schemes, and hilarious reactions, featuring ${authorName} as both the mastermind and occasional victim of epic practical jokes.`
    })
    ideas.push({
      title: `The Prankster's Guide by ${authorName}`,
      author: "Minister of Mischief",
      description: `An illustrated guide to the art of pranking, featuring ${authorName}'s most memorable pranks, complete with planning details and reaction photos.`
    })
    ideas.push({
      title: `${authorName}: Master of Mayhem`,
      author: "Chief Chaos Coordinator",
      description: `Chronicles the most outrageous and creative pranks involving ${authorName}, complete with behind-the-scenes stories and photographic evidence.`
    })
  }

  return ideas
}
