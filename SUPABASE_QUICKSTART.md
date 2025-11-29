# ☁️ Supabase 云端存储 - 5分钟配置清单

## 🎯 快速开始（复制粘贴即可）

### 第 1 步：创建数据库表

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 进入你的项目（URL: `https://zffopygwvczaeixfxzzm.supabase.co`）
3. 点击左侧 **SQL Editor**
4. 点击 **New Query**
5. 复制粘贴以下代码，点击 **Run**：

```sql
-- 创建表和配置（一键完成）
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

CREATE TABLE IF NOT EXISTS outfits (
  id text PRIMARY KEY,
  name text DEFAULT '今日搭配',
  clothes jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 添加索引（提速）
CREATE INDEX IF NOT EXISTS idx_clothes_category ON clothes(category);
CREATE INDEX IF NOT EXISTS idx_clothes_created_at ON clothes(created_at DESC);

-- 开启访问权限
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_all_clothes" ON clothes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public_all_outfits" ON outfits FOR ALL TO public USING (true) WITH CHECK (true);
```

### 第 2 步：创建图片存储桶

1. 点击左侧 **Storage**
2. 点击 **New bucket**
3. 填写：
   - Name: `cloth-images`
   - ✅ **勾选 "Public bucket"**（重要！）
4. 点击 **Create bucket**

### 第 3 步：配置存储桶权限

1. 点击刚创建的 `cloth-images` bucket
2. 点击 **Policies** 标签
3. 点击 **New Policy**
4. 选择 **Full customization**
5. 复制粘贴以下 3 条策略：

**策略 1: 允许上传**
```sql
CREATE POLICY "public_upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'cloth-images');
```

**策略 2: 允许查看**
```sql
CREATE POLICY "public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cloth-images');
```

**策略 3: 允许删除**
```sql
CREATE POLICY "public_delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'cloth-images');
```

### ✅ 完成！

配置完成后，刷新你的网页应用，就可以开始使用云端存储了！

## 🧪 测试配置

打开你的应用，按 F12 打开浏览器控制台，输入：

```javascript
// 测试连接
console.log('Supabase 连接:', supabase);

// 测试数据库
supabase.from('clothes').select('*').then(res => {
    console.log('数据库连接成功:', res);
});
```

如果看到返回结果（即使是空数组），说明配置成功！

## 🎉 优势

- ☁️ **无限制存储**：Supabase 免费版 500MB（约 1000+ 件衣服）
- 🚀 **自动备份**：数据存在云端，不怕丢失
- 📱 **多设备同步**：手机、电脑数据互通
- 🔒 **安全可靠**：PostgreSQL + CDN 加速

## ❓ 常见问题

**Q: 为什么要设置 Public bucket？**  
A: 因为我们需要直接在前端显示图片，Public bucket 可以生成公开 URL

**Q: API Key 会泄露吗？**  
A: 代码中使用的是 `anon` 公钥，专门用于前端，安全无忧

**Q: 可以限制用户吗？**  
A: 当前配置是开放访问，如需限制可以启用 Supabase Auth 认证

## 📚 更多资料

完整配置说明请查看：`SUPABASE_SETUP.md`
