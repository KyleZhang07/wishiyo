-- 创建订单通知历史表
CREATE TABLE IF NOT EXISTS order_notifications (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS order_notifications_order_id_idx ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS order_notifications_email_idx ON order_notifications(email);
