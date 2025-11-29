-- 创建 outfits 表
CREATE TABLE IF NOT EXISTS outfits (
  id text PRIMARY KEY,
  name text DEFAULT '今日搭配',
  clothes jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON outfits(created_at DESC);

-- 启用 RLS
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- 添加访问策略（允许所有操作）
CREATE POLICY IF NOT EXISTS "public_all_outfits" 
ON outfits FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
