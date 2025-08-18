# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

**人生小站** 是一个浪漫的"漂流瓶"网站，用于记录思念和美好回忆。这是一个全栈应用，前端托管在 GitHub Pages，后端运行在 Cloudflare Workers，使用 KV 存储。

### 架构设计

- **前端**: 原生 HTML5/CSS3/JavaScript ES6 (无框架)
- **后端**: Cloudflare Workers + KV 存储
- **托管**: GitHub Pages (前端) + Cloudflare Workers (API)
- **数据库**: Cloudflare KV (NoSQL 键值存储)

## 常用命令

### 后端开发 (Cloudflare Workers)
```bash
cd backend
npm install                    # 安装依赖
npm run dev                   # 启动本地开发服务器
npm run deploy               # 部署到 Cloudflare Workers
npm run tail                 # 查看已部署 Worker 的实时日志
wrangler kv key list --binding=BOTTLES_KV  # 列出所有存储的键
wrangler kv key get "bottle:ID" --binding=BOTTLES_KV  # 获取特定漂流瓶
```

### 前端开发
```bash
# 无需构建步骤 - 直接使用 HTML/CSS/JS
python -m http.server 8000   # 本地服务器测试
node proxy-server.js         # 启动本地代理服务器（国内用户）
```

### 数据导出
```bash
node export_data.js          # 导出所有格式 (JSON, CSV, MD, HTML)
node export_data.js json     # 导出指定格式
./export_data.sh            # 使用 Bash 脚本导出
```

## 架构详解

### 智能API选择系统
前端实现了智能API端点选择，以处理网络限制（特别是中国大陆访问）：

1. **优先级测试**: 按顺序测试多个代理服务
2. **自动故障转移**: 回退到可用的端点
3. **配置驱动**: 端点定义在 `config.js` 中
4. **运行时选择**: `script.js` 中的 `selectBestAPI()` 函数

关键文件:
- `config.js`: API 端点配置，包含优先级
- `script.js`: 智能API选择逻辑 (`selectBestAPI()`, `getCurrentApiUrl()`)
- `proxy-server.js`: 本地 Node.js 代理服务器

### 配置架构
系统使用 `config.js` 中的集中配置：
- `API_ENDPOINTS[]`: 带优先级和请求头的API端点数组
- `SMART_API_SELECTION`: 智能路由功能开关
- `DEBUG_MODE`: 控制日志输出（生产环境设为 `false`）
- `USE_LOCAL_STORAGE`: 在云端存储和本地存储间切换

### 后端API设计
Cloudflare Workers 后端 (`backend/src/index.js`):
- 支持CORS的RESTful API
- 使用 `BOTTLES_KV` 绑定的KV存储
- 路由: `/health`, `/bottles` (GET/POST), `/search`
- 数据验证和错误处理
- 速率限制和内容过滤

### 前端状态管理
无框架 - 使用原生JavaScript：
- 全局状态变量 (`bottles[]`, `searchResults[]`)
- 动态API URL/请求头 (`SELECTED_API_URL`, `SELECTED_API_HEADERS`)
- 本地存储作为离线模式后备
- 基于Canvas的动画 (`initOceanAnimation()`)

### 中国访问优化
多层次方法处理中国大陆对 Cloudflare Workers 的访问限制：
1. **免费代理服务**: AllOrigins, CORS Anywhere, ThingProxy
2. **本地代理服务器**: `proxy-server.js` 用于开发
3. **IP直连**: 使用Host头的Cloudflare IP地址
4. **自定义Workers代理**: `cloudflare-china-proxy.js` 模板

## 关键配置要点

### Cloudflare Workers 设置
- **KV命名空间**: `wrangler.toml` 中的 `BOTTLES_KV` 绑定
- **环境变量**: 在 `wrangler.toml` 的 [vars] 部分设置
- **自定义域名**: 可配置以改善中国访问

### 前端配置模式
- **生产环境**: `DEBUG_MODE: false`，使用智能API选择
- **开发环境**: `DEBUG_MODE: true`，显示调试面板
- **本地模式**: `USE_LOCAL_STORAGE: true`，无API调用

### 调试和开发
- 默认**禁用**调试模式 (`DEBUG_MODE: false`)
- 生产环境中禁用所有控制台日志
- 故障排除时可临时启用，在 `config.js` 中设置 `DEBUG_MODE: true`

## 数据导出和管理

系统包含完整的数据导出功能：
- **export_data.js**: Node.js 脚本，支持多种格式
- **export_data.sh**: Unix 系统的 Bash 等效脚本
- **直接API**: 快速导出的 `curl` 命令
- **Wrangler CLI**: 高级操作的直接KV访问

支持的导出格式：JSON、CSV、Markdown、HTML，包含时间戳和元数据。

## 网络限制处理

代码库专门设计用于处理网络访问限制：
- 自动代理检测和选择
- 从云端到本地存储的优雅降级
- 静默故障处理（网络问题不向用户显示错误）
- 多种冗余访问方法

修改网络相关代码时，务必测试直连访问和代理场景。

## 重要文件说明

### 核心文件
- `index.html`: 主页面，GitHub Pages 入口
- `script.js`: 前端主逻辑，包含智能API选择
- `config.js`: 集中配置，定义所有API端点
- `backend/src/index.js`: Cloudflare Workers API 后端

### 网络优化文件
- `proxy-server.js`: 本地代理服务器
- `cloudflare-china-proxy.js`: CF Workers 代理模板
- `tencent-function.js`: 腾讯云函数版本

### 工具和脚本
- `export_data.js`: 数据导出 Node.js 脚本
- `export_data.sh`: 数据导出 Bash 脚本

### 文档
- `docs/国内访问解决方案.md`: 完整的网络访问指南
- `docs/API_README.md`: API 接口文档
- `docs/DEPLOYMENT_GUIDE.md`: 部署指南