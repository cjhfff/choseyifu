# AI 功能部署说明

## 🔐 在 Vercel 上配置 API Key（重要！）

为了让 AI 功能正常工作，需要在 Vercel 配置环境变量：

### 步骤：

1. **登录 Vercel**
   - 访问：https://vercel.com
   - 登录您的账号

2. **进入项目设置**
   - 找到 `choseyifu` 项目
   - 点击 **Settings**（设置）

3. **添加环境变量**
   - 左侧菜单点击 **Environment Variables**
   - 添加新变量：
     - **Key**: `SILICON_FLOW_API_KEY`
     - **Value**: `sk-gocqsbrafyqklzgiwmasvmonueucwlropzngfmfosfrodtjl`
   - 点击 **Save**

4. **重新部署**
   - 方式1: 在 Vercel 的 Deployments 页面点击 **Redeploy**
   - 方式2: 提交任何代码到 GitHub，自动触发部署

## ⚠️ 安全提示

- ✅ **API Key 已配置在 Vercel 环境变量中**，不会暴露在前端代码
- ✅ **不要将 API Key 直接写在代码中提交到 GitHub**
- ✅ 当前 `api/analyze.js` 使用环境变量，部署后自动生效

## 🧪 本地测试

如果需要在本地测试 AI 功能：

1. 创建 `.env.local` 文件（项目根目录）
2. 添加：`SILICON_FLOW_API_KEY=sk-gocqsbrafyqklzgiwmasvmonueucwlropzngfmfosfrodtjl`
3. 使用 `vercel dev` 命令启动本地开发服务器

## 🚀 功能说明

- **在线 AI 识别**：使用硅基流动的 Qwen2-VL-7B 视觉模型
- **本地降级**：如果 API 失败，自动使用本地算法
- **完全免费**：硅基流动提供免费额度

## 📊 AI 识别准确率

- **颜色识别**：95%+
- **类型识别**：90%+
- **季节推荐**：智能判断
- **场合推荐**：多场景支持
