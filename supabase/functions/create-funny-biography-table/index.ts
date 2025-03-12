import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

console.log('Create funny_biography_books table function started')

serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Create the table if it doesn't exist
  const { error } = await supabaseClient.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS funny_biography_books (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        selected_idea JSONB,
        ideas JSONB,
        answers JSONB,
        style JSONB,
        images JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending'
      );
    `
  })

  if (error) {
    console.error('Error creating table:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Table funny_biography_books created or already exists' 
    }),
    { 
      headers: { 'Content-Type': 'application/json' },
      status: 200
    }
  )
})