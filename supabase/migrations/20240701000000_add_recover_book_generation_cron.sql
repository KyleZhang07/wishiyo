-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;  -- 任务调度
CREATE EXTENSION IF NOT EXISTS pg_net;   -- HTTP 调用

-- 删除现有的 cronjob（如果存在）
SELECT cron.unschedule('recover_book_generation_job');

-- 创建一个每 10 分钟运行一次的 cronjob
SELECT cron.schedule(
  'recover_book_generation_job',  -- 任务名称
  '*/10 * * * *',                 -- cron 表达式：每 10 分钟运行一次
  $$
  -- 调用 Edge Function
  SELECT net.http_post(
    url := 'https://hbkgbggctzvqffqfrmhl.supabase.co/functions/v1/recover-book-generation',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 添加注释
COMMENT ON FUNCTION cron.schedule(text, text, text) IS 'Schedule a cron job to run a SQL command at the specified interval';

-- 注意：确保已在 Vault 或通过 ALTER ROLE 设置了 service_role_key
-- 如果未设置，请执行以下命令（替换为实际的服务角色密钥）：
-- ALTER ROLE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
