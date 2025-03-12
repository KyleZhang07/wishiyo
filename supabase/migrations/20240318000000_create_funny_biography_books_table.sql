-- Create the funny_biography_books table
CREATE TABLE IF NOT EXISTS funny_biography_books (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  selected_idea JSONB,
  ideas JSONB,
  answers JSONB,
  chapters JSONB,
  style JSONB,
  images JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
); 