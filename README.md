# 人生小站 - 把思念交给海，把故事交给风 🌊

> 一个浪漫的漂流瓶网站，专为记录思念和美好回忆而生

[![部署状态](https://img.shields.io/badge/部署-已上线-brightgreen)](https://hengfengliya.github.io/life-island/)
[![API状态](https://img.shields.io/badge/API-云端运行-blue)](https://life-station-api.life-island.workers.dev)
[![技术栈](https://img.shields.io/badge/技术栈-HTML%2BCSS%2BJS-orange)](#技术栈)

## 🌟 在线访问

- **📱 网站地址**: [https://hengfengliya.github.io/life-island](https://hengfengliya.github.io/life-island)
- **⚡ API 服务**: [https://life-station-api.life-island.workers.dev](https://life-station-api.life-island.workers.dev)

## ✨ 特色功能

- 🌊 **漂流瓶隐喻** - 每个思念都是海上的漂流瓶
- 💕 **爱情诗句** - 每次打开瓶子都有浪漫诗句相伴  
- 🎨 **kawaii 设计** - 梦幻少女风格，极致可爱
- 🔍 **实时搜索** - 风会替你找到那个人
- 📱 **响应式设计** - 完美支持所有设备
- ⚡ **云端存储** - Cloudflare Workers + KV 全球分布
- 🌈 **双模式运行** - 本地/云端无缝切换
- 📦 **数据导出** - 支持JSON、CSV、Markdown、HTML多种格式导出

## 📁 项目结构

```
人生小站/
├── index.html          # 主页面 (GitHub Pages 入口)
├── style.css           # 样式文件
├── script.js           # 前端脚本
├── config.js           # 配置文件
├── export_data.js      # 数据导出脚本 (Node.js)
├── export_data.sh      # 数据导出脚本 (Bash)
├── backend/            # 后端API (Cloudflare Workers)
│   ├── src/
│   │   └── index.js    # Workers 主文件
│   ├── package.json    # 后端依赖
│   └── wrangler.toml   # Cloudflare 配置
└── docs/               # 项目文档
    ├── README.md       # 详细文档
    ├── API_README.md   # API 文档
    └── DEPLOYMENT_GUIDE.md # 部署指南
```

## 🚀 快速开始

### 方式一：直接使用（推荐）

1. **访问网站**: [https://hengfengliya.github.io/life-island](https://hengfengliya.github.io/life-island)
2. **写下思念**: 点击"写下思念"按钮
3. **搜索回忆**: 在搜索框输入关键词
4. **收集漂流瓶**: 点击海面上的漂流瓶

### 方式二：本地运行

```bash
# 克隆项目
git clone https://github.com/hengfengliya/life-island.git
cd life-island

# 直接用浏览器打开 index.html
# 或使用本地服务器
python -m http.server 8000
```

### 方式三：开发模式

```bash
# 后端开发（需要 Cloudflare 账户）
cd backend
npm install
npm run dev

# 前端开发
# 直接编辑前端文件，浏览器打开 index.html
```

## 🛠️ 技术栈

| 类型 | 技术 | 说明 |
|------|------|------|
| **前端** | HTML5 + CSS3 + JavaScript ES6 | 原生技术栈，轻量快速 |
| **后端** | Cloudflare Workers | 边缘计算，全球分布 |
| **数据库** | Cloudflare KV | NoSQL 键值存储 |
| **托管** | GitHub Pages | 静态网站托管 |
| **CDN** | Cloudflare | 全球加速 |
| **API** | RESTful | 标准接口设计 |

## 🔧 配置说明

### 云端模式（默认）
```javascript
// config.js
window.LifeStationConfig = {
    API_BASE_URL: 'https://life-station-api.life-island.workers.dev/api',
    USE_LOCAL_STORAGE: false,
    DEBUG_MODE: true
};
```

### 本地模式
```javascript
// config.js
window.LifeStationConfig = {
    USE_LOCAL_STORAGE: true,  // 使用浏览器本地存储
    DEBUG_MODE: true
};
```

## 📦 数据管理

### 📊 数据导出

支持多种格式批量导出你的漂流瓶数据：

#### 快速导出（推荐）
```bash
# 导出JSON格式
curl "https://life-station-api.life-island.workers.dev/api/bottles?limit=1000" > bottles_backup.json
```

#### 使用导出脚本
```bash
# 导出所有格式 (JSON, CSV, Markdown, HTML)
node export_data.js

# 导出特定格式
node export_data.js json     # JSON 格式
node export_data.js csv      # CSV 表格格式
node export_data.js md       # Markdown 文档格式  
node export_data.js html     # HTML 网页格式
```

#### 使用Bash脚本
```bash
chmod +x export_data.sh
./export_data.sh
```

### 🔍 数据查看

#### 通过Cloudflare Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Workers & Pages" → "KV"
3. 找到 `life-station-api-BOTTLES_KV` 命名空间
4. 查看所有存储的漂流瓶数据

#### 通过API接口
```bash
# 获取所有漂流瓶
curl "https://life-station-api.life-island.workers.dev/api/bottles"

# 搜索特定内容
curl "https://life-station-api.life-island.workers.dev/api/search?q=关键词"

# 健康检查
curl "https://life-station-api.life-island.workers.dev/api/health"
```

#### 使用Wrangler CLI
```bash
cd backend

# 列出所有存储键
wrangler kv key list --binding=BOTTLES_KV

# 获取特定漂流瓶
wrangler kv key get "bottle:ID" --binding=BOTTLES_KV
```

### 💾 数据备份建议

- **📅 定期导出**: 建议每周导出一次数据
- **📂 多格式备份**: JSON用于数据恢复，CSV/HTML用于查看
- **☁️ 云端备份**: 将导出文件上传到云盘保存
- **🏷️ 版本管理**: 用时间戳区分不同版本的备份

## 📖 文档

- 📚 **[详细文档](docs/README.md)** - 完整的项目说明
- 🔌 **[API 文档](docs/API_README.md)** - 后端接口说明
- 🚀 **[部署指南](docs/DEPLOYMENT_GUIDE.md)** - 自己部署教程

## 💝 寓意与愿景

> **把思念交给海，把故事交给风**
> 
> 每一个漂流瓶都承载着最真挚的情感  
> 愿所有美好的回忆都能在数字海洋中永远漂流  
> 愿每一份思念都能找到属于它的彼岸

## 🎯 使用场景

- 💑 **情侣专用** - 记录彼此的思念和回忆
- 📝 **个人日记** - 私密的情感记录空间  
- 🎁 **浪漫惊喜** - 为TA准备的专属网站
- 💌 **异地恋** - 跨越距离的情感连接
- 🌟 **纪念册** - 珍藏重要时刻

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 💖 致谢

感谢所有为这个项目贡献想法和代码的朋友们！

---

*用爱编织的代码，用心守护的回忆* 🌊💕

**⭐ 如果这个项目对你有帮助，请给我们一个星星！**