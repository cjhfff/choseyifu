# Supabase 云端存储配置指南

## 📊 数据库表结构

### 1. clothes 表（衣服）
```sql
CREATE TABLE clothes (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  color text,
  season text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 添加索引以提升查询性能
CREATE INDEX idx_clothes_category ON clothes(category);
CREATE INDEX idx_clothes_season ON clothes(season);
CREATE INDEX idx_clothes_created_at ON clothes(created_at DESC);
```

### 2. outfits 表（穿搭）
```sql
CREATE TABLE outfits (
  id text PRIMARY KEY,
  name text DEFAULT '今日搭配',
  clothes jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 添加索引
CREATE INDEX idx_outfits_created_at ON outfits(created_at DESC);
```

## 🗂️ Storage Bucket 配置

### cloth-images 桶（图片存储）

1. **创建 Bucket**
   - 进入 Supabase 项目
   - 点击 Storage
   - 创建新 bucket: `cloth-images`
   - ✅ 设置为 **Public**（允许公开访问）

2. **设置存储策略**
```sql
-- 允许所有人上传图片
CREATE POLICY "允许上传图片"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'cloth-images');

-- 允许所有人查看图片
CREATE POLICY "允许查看图片"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cloth-images');

-- 允许删除图片
CREATE POLICY "允许删除图片"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'cloth-images');
```

## 🔐 安全配置

### Row Level Security (RLS)

1. **启用 RLS**
```sql
-- 为 clothes 表启用 RLS
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;

-- 为 outfits 表启用 RLS
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
```

2. **添加访问策略**（简化版 - 允许所有操作）
```sql
-- clothes 表策略
CREATE POLICY "允许所有操作 clothes"
ON clothes FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- outfits 表策略
CREATE POLICY "允许所有操作 outfits"
ON outfits FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

## 🚀 快速部署步骤

### 方式一：使用 Supabase Dashboard

1. **登录 Supabase**
   - 访问 https://supabase.com/dashboard
   - 进入你的项目

2. **创建表结构**
   - 点击左侧 **Table Editor**
   - 点击 **New Table**
   - 创建 `clothes` 表和 `outfits` 表（使用上面的结构）

3. **配置 Storage**
   - 点击左侧 **Storage**
   - 创建 `cloth-images` bucket
   - 设置为 Public

4. **设置 Policies**
   - 点击左侧 **Authentication** → **Policies**
   - 为表和 Storage 添加上述策略

### 方式二：使用 SQL Editor（推荐）

1. 点击左侧 **SQL Editor**
2. 复制粘贴以下完整 SQL：

```sql
-- 创建 clothes 表
CREATE TABLE IF NOT EXISTS clothes (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  color text,
  season text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 创建 outfits 表
CREATE TABLE IF NOT EXISTS outfits (
  id text PRIMARY KEY,
  name text DEFAULT '今日搭配',
  clothes jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_clothes_category ON clothes(category);
CREATE INDEX IF NOT EXISTS idx_clothes_season ON clothes(season);
CREATE INDEX IF NOT EXISTS idx_clothes_created_at ON clothes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON outfits(created_at DESC);

-- 启用 RLS
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- 添加访问策略
CREATE POLICY IF NOT EXISTS "允许所有操作 clothes"
ON clothes FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "允许所有操作 outfits"
ON outfits FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

3. 点击 **Run** 执行

## ✅ 验证配置

运行以下 SQL 检查配置是否正确：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clothes', 'outfits');

-- 检查策略是否启用
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('clothes', 'outfits');
```

## 📱 前端代码说明

### 已配置信息
- **Project URL**: `https://zffopygwvczaeixfxzzm.supabase.co`
- **API Key**: 已集成在 `js/storage.js` 中

### 主要功能
1. ✅ 图片自动上传到云端 Storage
2. ✅ 数据存储在 PostgreSQL 数据库
3. ✅ 支持删除时同时删除图片和数据
4. ✅ 兼容旧版 IndexedDB 代码结构
5. ✅ 无存储容量限制（Supabase 免费版 500MB）

## 🎯 注意事项

1. **API Key 安全**
   - 当前使用的是 `anon` 公钥，安全用于前端
   - 真正的私密操作需要用户认证

2. **存储限制**
   - Supabase 免费版：500MB Storage + 1GB 数据库
   - 如需更多，可升级到 Pro 版

3. **图片压缩**
   - 前端已做压缩（600px, 70% 质量）
   - 每张约 100-300KB，可存储数千件衣服

4. **性能优化**
   - 已添加索引优化查询速度
   - 图片使用 CDN 加速访问

## 🔄 从 IndexedDB 迁移

如果用户已有本地数据，可以使用以下代码迁移：

```javascript
// 迁移脚本（在浏览器控制台运行）
async function migrateFromIndexedDB() {
    // 打开旧数据库
    const oldDB = await indexedDB.open('WardrobeDB', 1);
    const transaction = oldDB.transaction(['wardrobe_clothes'], 'readonly');
    const store = transaction.objectStore('wardrobe_clothes');
    const clothes = await store.getAll();
    
    // 上传到 Supabase
    for (const cloth of clothes) {
        await storage.addCloth(cloth);
    }
    
    console.log('迁移完成！');
}
```

## 📞 支持

如遇问题，请检查：
1. Supabase Dashboard 的 Logs
2. 浏览器控制台的错误信息
3. Storage bucket 是否设置为 Public
4. RLS 策略是否正确配置
