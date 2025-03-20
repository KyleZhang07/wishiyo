-- 从 love_story_books 表中删除拆分的地址字段
ALTER TABLE love_story_books
DROP COLUMN IF EXISTS recipient_name,
DROP COLUMN IF EXISTS address_line1,
DROP COLUMN IF EXISTS address_line2,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS postal_code,
DROP COLUMN IF EXISTS country;

-- 从 funny_biography_books 表中删除拆分的地址字段
ALTER TABLE funny_biography_books
DROP COLUMN IF EXISTS recipient_name,
DROP COLUMN IF EXISTS address_line1,
DROP COLUMN IF EXISTS address_line2,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS postal_code,
DROP COLUMN IF EXISTS country;
