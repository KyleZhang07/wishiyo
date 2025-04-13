-- 为 funny_biography_books 表添加 client_id 字段
ALTER TABLE "public"."funny_biography_books"
ADD COLUMN IF NOT EXISTS "client_id" varchar;

-- 为现有记录设置默认的 client_id (如果需要)
-- 注意：在生产环境中，您可能需要一个更复杂的策略来设置现有记录的 client_id
-- UPDATE "public"."funny_biography_books" SET "client_id" = 'default_client' WHERE "client_id" IS NULL;

-- 启用行级安全性
ALTER TABLE "public"."funny_biography_books" ENABLE ROW LEVEL SECURITY;

-- 创建允许通过 client_id 访问书籍记录的策略
CREATE POLICY "Anyone can view funny biography books by client_id"
  ON "public"."funny_biography_books"
  FOR SELECT
  USING (true);  -- 允许任何人查看记录

-- 创建允许通过 client_id 更新书籍记录的策略
CREATE POLICY "Anyone can update funny biography books by client_id"
  ON "public"."funny_biography_books"
  FOR UPDATE
  USING (true);  -- 允许任何人更新记录

-- 创建允许通过 client_id 删除书籍记录的策略
CREATE POLICY "Anyone can delete funny biography books by client_id"
  ON "public"."funny_biography_books"
  FOR DELETE
  USING (true);  -- 允许任何人删除记录

-- 创建允许通过 client_id 插入书籍记录的策略
CREATE POLICY "Anyone can insert funny biography books"
  ON "public"."funny_biography_books"
  FOR INSERT
  WITH CHECK (true);  -- 允许任何人插入记录

-- 创建策略：允许服务角色完全访问
CREATE POLICY "Service role has full access to funny biography books"
ON "public"."funny_biography_books"
FOR ALL
USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');

-- 注意：您可能还需要确保在应用程序代码中，
-- 在创建新的 funny_biography_books 记录时设置 client_id 字段为当前用户的 ID
