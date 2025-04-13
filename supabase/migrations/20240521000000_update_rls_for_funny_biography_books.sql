-- 删除现有的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own funny biography books" ON "public"."funny_biography_books";
DROP POLICY IF EXISTS "Users can update their own funny biography books" ON "public"."funny_biography_books";
DROP POLICY IF EXISTS "Users can delete their own funny biography books" ON "public"."funny_biography_books";
DROP POLICY IF EXISTS "Users can insert funny biography books with their client_id" ON "public"."funny_biography_books";
DROP POLICY IF EXISTS "Service role has full access to funny biography books" ON "public"."funny_biography_books";

-- 创建新的 RLS 策略，与 love_story_books 保持一致
CREATE POLICY "Anyone can view funny biography books by client_id" 
  ON "public"."funny_biography_books" 
  FOR SELECT 
  USING (true);  -- 允许任何人查看记录

CREATE POLICY "Anyone can update funny biography books by client_id" 
  ON "public"."funny_biography_books" 
  FOR UPDATE
  USING (true);  -- 允许任何人更新记录

CREATE POLICY "Anyone can delete funny biography books by client_id" 
  ON "public"."funny_biography_books" 
  FOR DELETE
  USING (true);  -- 允许任何人删除记录

CREATE POLICY "Anyone can insert funny biography books" 
  ON "public"."funny_biography_books" 
  FOR INSERT
  WITH CHECK (true);  -- 允许任何人插入记录

-- 允许服务角色完全访问
CREATE POLICY "Service role has full access to funny biography books" 
  ON "public"."funny_biography_books" 
  FOR ALL 
  USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');
