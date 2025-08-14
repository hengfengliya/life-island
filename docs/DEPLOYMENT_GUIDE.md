# 🚀 Cloudflare Workers 部署详细指南

## 📋 前置准备

### 你需要准备的：
1. **Cloudflare 账户**（免费即可）
2. **Node.js**（版本 16 或更高）
3. **命令行终端**（Windows PowerShell / Mac Terminal / Linux Shell）

---

## 步骤 1: 创建 Cloudflare 账户

1. 访问 [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. 注册免费账户（只需邮箱）
3. 验证邮箱并登录

**免费套餐包含：**
- ✅ 每天 100,000 次请求
- ✅ KV 存储：读取 10万次/天，写入 1千次/天
- ✅ 对于个人网站完全够用

---

## 步骤 2: 安装和配置 Wrangler CLI

### 2.1 安装 Wrangler
```bash
npm install -g wrangler
```

### 2.2 验证安装
```bash
wrangler --version
```

### 2.3 登录 Cloudflare
```bash
wrangler login
```

这会打开浏览器，点击"Allow"授权。

### 2.4 验证登录
```bash
wrangler whoami
```

---

## 步骤 3: 创建 KV 存储命名空间

### 3.1 创建生产环境命名空间
```bash
npx wrangler kv:namespace create "BOTTLES_KV"
```

**输出示例：**
```
🌀 Creating namespace with title "life-station-api-BOTTLES_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BOTTLES_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 3.2 创建预览环境命名空间
```bash
npx wrangler kv:namespace create "BOTTLES_KV" --preview
```

**输出示例：**
```
🌀 Creating namespace with title "life-station-api-BOTTLES_KV_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BOTTLES_KV", preview_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 3.3 复制这两个 ID，下一步需要用到！

---

## 步骤 4: 更新配置文件

### 4.1 打开 `wrangler.toml` 文件

### 4.2 替换配置信息
```toml
name = "life-station-api"  # 这个名字会成为你的 Workers URL 的一部分
main = "src/index.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# KV 存储绑定 - 替换为步骤3获得的真实ID
[[kv_namespaces]]
binding = "BOTTLES_KV"
id = "你的生产环境ID"           # 步骤3.1的输出
preview_id = "你的预览环境ID"    # 步骤3.2的输出

# 环境变量
[vars]
ENVIRONMENT = "development"

# 开发环境配置
[env.development.vars]
ENVIRONMENT = "development"

# 生产环境配置
[env.production.vars]
ENVIRONMENT = "production"
```

### 4.3 示例配置（用你的真实ID替换）
```toml
name = "life-station-api"
main = "src/index.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "BOTTLES_KV"
id = "a1b2c3d4e5f6789012345678901234567890abcd"
preview_id = "z9y8x7w6v5u4321098765432109876543210zyxw"

[vars]
ENVIRONMENT = "development"
```

---

## 步骤 5: 本地测试

### 5.1 安装项目依赖
```bash
npm install
```

### 5.2 启动本地开发服务器
```bash
npm run dev
```

**成功输出示例：**
```
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### 5.3 测试 API 端点

打开新的终端窗口，测试API：

```bash
# 健康检查
curl http://localhost:8787/api/health

# 创建漂流瓶
curl -X POST http://localhost:8787/api/bottles \
  -H "Content-Type: application/json" \
  -d '{"message":"测试消息"}'

# 获取所有漂流瓶
curl http://localhost:8787/api/bottles
```

---

## 步骤 6: 部署到生产环境

### 6.1 部署命令
```bash
npm run deploy
```

### 6.2 部署成功示例
```
Uploaded life-station-api (1.23 sec)
Published life-station-api (0.45 sec)
  https://life-station-api.your-subdomain.workers.dev
Current Deployment ID: 12345678-1234-1234-1234-123456789012
```

### 6.3 记录你的 API URL
部署成功后，你会得到类似这样的URL：
`https://life-station-api.your-subdomain.workers.dev`

---

## 步骤 7: 配置前端

### 7.1 更新 `config.js`
```javascript
window.LifeStationConfig = {
    // 替换为你的实际 Workers URL
    API_BASE_URL: 'https://life-station-api.your-subdomain.workers.dev/api',
    
    // 启用 API 模式
    USE_LOCAL_STORAGE: false,
    
    // 生产环境关闭调试
    DEBUG_MODE: false,
};
```

### 7.2 测试前端连接
1. 打开 `index.html`
2. 按 F12 打开开发者工具
3. 查看 Console 是否有连接错误

---

## 🔧 常见问题解决

### Q1: "wrangler command not found"
**解决:** 重新安装 wrangler
```bash
npm uninstall -g wrangler
npm install -g wrangler@latest
```

### Q2: KV 权限错误
**解决:** 确保 wrangler.toml 中的 namespace ID 正确

### Q3: CORS 错误
**解决:** 检查 API URL 是否正确，确保以 `/api` 结尾

### Q4: 部署失败
**解决:** 检查 wrangler 是否已登录
```bash
wrangler whoami
```

---

## 📊 监控和维护

### 查看部署信息
```bash
wrangler deployments list
```

### 查看实时日志
```bash
wrangler tail
```

### KV 数据管理
```bash
# 列出所有键
wrangler kv:key list --namespace-id="你的namespace-id"

# 查看特定键的值
wrangler kv:key get "bottle:123" --namespace-id="你的namespace-id"
```

---

## 💰 费用说明

**免费套餐限制：**
- 每天 100,000 次 Workers 请求
- KV 存储：每天 100,000 次读取，1,000 次写入
- 对于个人使用完全免费

**超出后的费用：**
- Workers: $0.50/百万请求
- KV: $0.50/百万次读取，$5.00/百万次写入

---

## ✅ 检查清单

在部署前，请确认：

- [ ] Cloudflare 账户已创建并验证
- [ ] Wrangler CLI 已安装并登录
- [ ] KV 命名空间已创建
- [ ] wrangler.toml 已更新正确的 namespace ID
- [ ] 本地测试成功（npm run dev）
- [ ] 生产环境部署成功
- [ ] 前端 config.js 已更新 API URL
- [ ] 前端可以成功连接后端 API

完成后，你的漂流瓶网站就可以在全球范围内访问了！🌊✨