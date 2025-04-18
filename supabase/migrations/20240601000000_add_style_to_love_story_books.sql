-- Add style column to love_story_books table
ALTER TABLE love_story_books ADD COLUMN style VARCHAR DEFAULT 'classic';

-- Add comment to the column
COMMENT ON COLUMN love_story_books.style IS 'The cover style selected by the user (classic, vintage, modern, playful, elegant)';
