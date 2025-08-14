# 人生小站 (Life Island) 🌊

把思念交给海，把故事交给风的浪漫漂流瓶网站

## 📦 项目结构

```
人生小站/
├── 前端文件/
│   ├── index.html          # 主页面
│   ├── style.css          # 样式文件
│   ├── script.js          # 主脚本
│   └── config.js          # 配置文件
├── 后端API (Cloudflare Workers)/
│   ├── src/
│   │   └── index.js       # Workers 主文件
│   ├── wrangler.toml      # Cloudflare 配置
│   ├── package.json       # 依赖配置
│   └── API_README.md      # API 文档
└── README.md              # 此文件
```

## 🚀 快速部署

### 1. 部署后端 API (Cloudflare Workers)

#### 安装 Cloudflare Wrangler CLI
```bash
npm install -g wrangler
```

#### 登录 Cloudflare
```bash
wrangler login
```

#### 安装项目依赖
```bash
npm install
```

#### 创建 KV 命名空间
```bash
# 创建生产环境 KV 命名空间
npx wrangler kv:namespace create "BOTTLES_KV"

# 创建预览环境 KV 命名空间  
npx wrangler kv:namespace create "BOTTLES_KV" --preview
```

#### 更新配置文件
复制上述命令的输出，更新 `wrangler.toml` 中的 namespace ID：
```toml
[[kv_namespaces]]
binding = "BOTTLES_KV"
id = "你的生产环境ID"
preview_id = "你的预览环境ID" 
```

#### 本地测试
```bash
npm run dev
```

#### 部署到生产环境
```bash
npm run deploy
```

部署完成后，记录下 Workers URL，例如：
`https://life-station-api.your-subdomain.workers.dev`

### 2. 配置前端

#### 更新 config.js
```javascript
window.LifeStationConfig = {
    // 替换为您的 Workers URL
    API_BASE_URL: 'https://life-station-api.your-subdomain.workers.dev/api',
    
    // 启用 API 模式
    USE_LOCAL_STORAGE: false,
    
    // 生产环境关闭调试
    DEBUG_MODE: false,
};
```

### 3. 部署前端 (GitHub Pages)

#### 创建 GitHub 仓库
1. 在 GitHub 创建新仓库
2. 上传前端文件到仓库

#### 启用 GitHub Pages
1. 进入仓库 Settings
2. 找到 Pages 选项
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "main" 或 "master"
5. 点击 Save

您的网站将在几分钟内可通过以下地址访问：
`https://your-username.github.io/your-repo-name`

## 🛠️ 开发模式

### 本地开发
1. 设置 `config.js` 中 `USE_LOCAL_STORAGE: true`
2. 直接用浏览器打开 `index.html`
3. 数据存储在浏览器本地存储中

### API 开发
1. 启动 Workers 开发服务器：`npm run dev`
2. 设置 `config.js` 中 `USE_LOCAL_STORAGE: false`
3. 确保 `API_BASE_URL` 指向本地开发服务器

## 🔧 API 端点

- `GET /api/bottles` - 获取所有漂流瓶
- `POST /api/bottles` - 创建新漂流瓶
- `GET /api/bottles/{id}` - 获取单个漂流瓶
- `GET /api/search?q=关键词` - 搜索漂流瓶
- `GET /api/health` - 健康检查

详细 API 文档请参考 `API_README.md`

## 💡 特色功能

- ✨ **双模式运行**: 本地存储模式用于开发，API模式用于生产
- 🌊 **优雅降级**: API 不可用时自动回退到本地模式
- 💕 **爱情诗句**: 集成诗词 API，每个漂流瓶都有浪漫诗句
- 🎨 **kawaii 设计**: 梦幻少女风格，极致可爱
- 🔍 **实时搜索**: 支持关键词搜索思念内容
- 📱 **响应式**: 完美支持手机、平板、桌面端

## 🎯 使用场景

- 💑 **情侣专用**: 记录彼此的思念和回忆
- 📝 **个人日记**: 私密的情感记录空间  
- 🎁 **浪漫惊喜**: 为 TA 准备的专属网站
- 💌 **异地恋**: 跨越距离的情感连接

## 🌟 自定义建议

- 修改 `style.css` 中的颜色主题
- 在 `lovePoems` 数组中添加更多诗句
- 调整瓶子的 SVG 设计
- 添加更多可爱的动画效果

## 💎 高级功能(TODO)

- [ ] 用户登录系统
- [ ] 瓶子加密存储
- [ ] 定时发布功能
- [ ] 主题切换功能
- [ ] 导出备份功能
- [ ] 多语言支持

祝您使用愉快！愿思念如海风，故事如潮汐 🌊💕
