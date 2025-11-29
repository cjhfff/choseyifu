# 🔧 AI 接口调试指南

## 问题诊断

你的 AI 接口 `/api/analyze` 无法工作的**主要原因**是：

### ❌ 问题 1: 本地环境无法使用 Vercel API
- **现象**: 直接打开 `index.html` 文件时，AI 识别功能不工作
- **原因**: `/api/analyze` 是 Vercel 的无服务器函数，只能在部署后的环境运行
- **表现**: 浏览器控制台会显示 404 错误（找不到 `/api/analyze`）

### ❌ 问题 2: 缺少 vercel.json 配置
- **原因**: 之前没有 `vercel.json`，Vercel 可能无法正确识别 API 路由
- **已修复**: ✅ 现在已添加 `vercel.json` 配置文件

## ✅ 解决方案

### 方案 1: 部署到 Vercel（推荐）

这是**唯一能让 AI 功能完全工作**的方法：

#### 步骤 1: 部署项目
```bash
# 1. 确保代码已提交到 GitHub
git add .
git commit -m "添加 vercel.json 和 AI 诊断工具"
git push

# 2. 访问 https://vercel.com 并登录
# 3. 点击 "New Project"
# 4. 导入你的 GitHub 仓库 (cjhfff/choseyifu)
# 5. 点击 "Deploy"
```

#### 步骤 2: 配置环境变量（重要！）
1. 在 Vercel 项目页面，点击 **Settings**
2. 左侧菜单选择 **Environment Variables**
3. 添加以下变量：
   - **Name**: `SILICON_FLOW_API_KEY`
   - **Value**: `sk-gocqsbrafyqklzgiwmasvmonueucwlropzngfmfosfrodtjl`
4. 点击 **Save**
5. 回到 **Deployments** 页面，点击最新部署右侧的 **⋯** → **Redeploy**

#### 步骤 3: 测试部署
1. 访问你的 Vercel 部署地址（例如：`https://choseyifu.vercel.app`）
2. 打开 `test-ai-api.html` 进行诊断：`https://你的域名.vercel.app/test-ai-api.html`
3. 按照页面指引完成三个测试步骤

---

### 方案 2: 本地开发测试（使用 Vercel Dev）

如果你想在本地测试，需要使用 Vercel CLI：

#### 安装 Vercel CLI
```bash
# 全局安装
npm install -g vercel

# 或使用 PowerShell
npm i -g vercel
```

#### 配置本地环境变量
在项目根目录创建 `.env.local` 文件：
```env
SILICON_FLOW_API_KEY=sk-gocqsbrafyqklzgiwmasvmonueucwlropzngfmfosfrodtjl
```

#### 启动本地开发服务器
```bash
# 在项目目录运行
vercel dev

# 然后访问
# http://localhost:3000
# http://localhost:3000/test-ai-api.html
```

**注意**: 
- ⚠️ 不要直接双击打开 `index.html`，要通过 `http://localhost:3000` 访问
- ⚠️ `.env.local` 不要提交到 GitHub

---

### 方案 3: 快速测试（不需要部署）

如果只是想测试 AI 功能，可以暂时使用降级的本地算法：

#### 修改 `js/ai-helper.js` (第 297 行附近)

将这段代码：
```javascript
async analyzeClothing(imageDataUrl) {
    console.log('🤖 正在请求 AI 分析...');
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
```

**临时改为**（绕过 API 直接使用本地算法）：
```javascript
async analyzeClothing(imageDataUrl) {
    console.log('💡 使用本地算法分析（测试模式）...');
    // 暂时直接使用本地算法进行测试
    return await this.analyzeClothingLocal(imageDataUrl);
    
    // 原来的 AI API 调用代码（保留）
    /*
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
```

这样修改后，即使不部署也能测试基本的颜色识别功能（但识别准确度会降低）。

---

## 🧪 使用诊断工具

我已经为你创建了一个专门的诊断页面：**`test-ai-api.html`**

### 使用方法：

#### 如果已部署到 Vercel：
访问：`https://你的域名.vercel.app/test-ai-api.html`

#### 如果使用 vercel dev：
访问：`http://localhost:3000/test-ai-api.html`

### 诊断步骤：
1. **步骤 1**: 自动检测运行环境
2. **步骤 2**: 测试 API 连通性
3. **步骤 3**: 上传图片进行实际识别测试

诊断工具会告诉你具体哪里出了问题，并提供对应的解决方案。

---

## 📋 快速检查清单

在部署前，请确认：

- [ ] ✅ `vercel.json` 文件已创建
- [ ] ✅ `api/analyze.js` 文件存在
- [ ] ✅ 代码已提交到 GitHub
- [ ] ✅ 已在 Vercel 创建项目
- [ ] ✅ 已配置 `SILICON_FLOW_API_KEY` 环境变量
- [ ] ✅ 已重新部署项目
- [ ] ✅ 使用 `test-ai-api.html` 测试成功

---

## 🆘 常见错误及解决

### 错误 1: `404 Not Found - /api/analyze`
**原因**: 没有部署到 Vercel，或者 `vercel.json` 配置错误
**解决**: 按照方案 1 部署到 Vercel

### 错误 2: `Missing SILICON_FLOW_API_KEY`
**原因**: 环境变量未配置
**解决**: 在 Vercel Settings → Environment Variables 中添加 API Key

### 错误 3: `CORS Error`
**原因**: 跨域问题
**解决**: 确保通过 Vercel 部署的域名访问，不要用 `file://` 协议

### 错误 4: `SiliconFlow 401/403`
**原因**: API Key 无效或过期
**解决**: 
1. 检查 API Key 是否正确
2. 访问 https://cloud.siliconflow.cn 确认账户状态
3. 如需要，注册新账户获取新的 API Key

---

## 💡 建议

1. **最佳实践**: 部署到 Vercel（方案 1）
2. **开发测试**: 使用 `vercel dev`（方案 2）
3. **快速验证**: 临时使用本地算法（方案 3）

完成部署后，AI 识别功能就能正常工作了！🎉

---

## 📞 需要帮助？

如果按照以上步骤操作后还有问题，请：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的请求详情
4. 将错误信息提供给我，我会帮你进一步诊断
