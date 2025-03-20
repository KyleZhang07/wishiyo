-- 为 love_story_books 表添加拆分的地址字段
ALTER TABLE love_story_books
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 为 funny_biography_books 表添加拆分的地址字段
ALTER TABLE funny_biography_books
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 注意：我们暂时保留原始的 shipping_address 字段以保持向后兼容
-- 在确认新字段正常工作后，可以考虑移除原始字段
-- ALTER TABLE love_story_books DROP COLUMN shipping_address;
-- ALTER TABLE funny_biography_books DROP COLUMN shipping_address;
