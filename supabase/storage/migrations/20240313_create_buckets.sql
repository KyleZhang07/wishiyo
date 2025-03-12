-- 创建book-covers存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('book-covers', 'book-covers', true, 10485760, '{image/jpeg,image/png,image/gif}') 
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = '{image/jpeg,image/png,image/gif}';

-- 设置public访问策略
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES 
  ('Public Access', '(bucket_id = ''book-covers''::text)', 'book-covers')
ON CONFLICT (name, bucket_id) DO NOTHING; 