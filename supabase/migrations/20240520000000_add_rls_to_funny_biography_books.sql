-- 为 funny_biography_books 表添加 client_id 字段
ALTER TABLE "public"."funny_biography_books"
ADD COLUMN IF NOT EXISTS "client_id" varchar;

-- 为现有记录设置默认的 client_id (如果需要)
-- 注意：在生产环境中，您可能需要一个更复杂的策略来设置现有记录的 client_id
-- UPDATE "public"."funny_biography_books" SET "client_id" = 'default_client' WHERE "client_id" IS NULL;

-- 启用行级安全性
ALTER TABLE "public"."funny_biography_books" ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许用户只能查看自己的记录
CREATE POLICY "Users can view their own funny biography books"
ON "public"."funny_biography_books"
FOR SELECT
USING (client_id = (SELECT coalesce(nullif(current_setting('request.headers', true)::json->>'x-client-id', ''), 'anonymous')));

-- 创建策略：允许用户只能更新自己的记录
CREATE POLICY "Users can update their own funny biography books"
ON "public"."funny_biography_books"
FOR UPDATE
USING (client_id = (SELECT coalesce(nullif(current_setting('request.headers', true)::json->>'x-client-id', ''), 'anonymous')));

-- 创建策略：允许用户只能删除自己的记录
CREATE POLICY "Users can delete their own funny biography books"
ON "public"."funny_biography_books"
FOR DELETE
USING (client_id = (SELECT coalesce(nullif(current_setting('request.headers', true)::json->>'x-client-id', ''), 'anonymous')));

-- 创建策略：允许用户插入记录，但必须设置正确的 client_id
CREATE POLICY "Users can insert funny biography books with their client_id"
ON "public"."funny_biography_books"
FOR INSERT
WITH CHECK (client_id = (SELECT coalesce(nullif(current_setting('request.headers', true)::json->>'x-client-id', ''), 'anonymous')));

-- 创建策略：允许服务角色完全访问
CREATE POLICY "Service role has full access to funny biography books"
ON "public"."funny_biography_books"
FOR ALL
USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');

-- 注意：您可能还需要确保在应用程序代码中，
-- 在创建新的 funny_biography_books 记录时设置 client_id 字段为当前用户的 ID
