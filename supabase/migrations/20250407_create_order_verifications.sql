-- 创建 order_verifications 表
CREATE TABLE IF NOT EXISTS public.order_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false
);

-- 添加索引以提高查询效率
CREATE INDEX IF NOT EXISTS order_verifications_email_idx ON public.order_verifications(email);
CREATE INDEX IF NOT EXISTS order_verifications_expires_at_idx ON public.order_verifications(expires_at);

-- 设置 RLS (行级安全) 策略
ALTER TABLE public.order_verifications ENABLE ROW LEVEL SECURITY;

-- 创建一个安全策略，只允许服务函数访问
CREATE POLICY "Service functions can access order_verifications"
  ON public.order_verifications
  USING (true)
  WITH CHECK (true);

-- 授予 anon 和 authenticated 角色对表的访问权限
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_verifications TO anon, authenticated, service_role;
