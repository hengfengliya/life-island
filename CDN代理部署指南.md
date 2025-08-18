# 国内CDN/代理部署指南

## 🚀 方案一：使用免费代理服务（已配置）

系统已配置以下免费代理服务，按优先级自动测试：

### 1. AllOrigins（优先级最高）
- URL: `https://api.allorigins.win`
- 特点: 国内访问较好，支持CORS
- 稳定性: ⭐⭐⭐⭐

### 2. CORS Anywhere  
- URL: `https://cors-anywhere.herokuapp.com`
- 特点: 老牌代理服务
- 稳定性: ⭐⭐⭐

### 3. ThingProxy
- URL: `https://thingproxy.freeboard.io`
- 特点: 简单可靠
- 稳定性: ⭐⭐⭐⭐

## 🛠 方案二：自建Cloudflare Workers代理

### 部署步骤：

1. **创建新的Workers项目**：
   ```bash
   # 登录Cloudflare Dashboard
   # 创建新的Worker，命名为 china-proxy
   ```

2. **粘贴代理代码**：
   - 使用 `cloudflare-china-proxy.js` 文件中的代码
   - 部署到 `china-proxy.your-domain.workers.dev`

3. **更新配置**：
   ```javascript
   {
       name: '自建代理（推荐）',
       url: 'https://china-proxy.your-domain.workers.dev',
       region: 'custom-proxy',
       priority: 1
   }
   ```

## 🌐 方案三：使用国内CDN服务

### jsDelivr CDN（中国节点）
```javascript
{
    name: 'jsDelivr中国CDN',
    url: 'https://cdn.jsdelivr.net/gh/your-username/cors-proxy@main/?url=target',
    region: 'china-cdn',
    priority: 1
}
```

### UNPKG中国镜像
```javascript  
{
    name: 'UNPKG中国镜像',
    url: 'https://unpkg.com.cn/cors-proxy@1.0.0/?target=url',
    region: 'china-cdn', 
    priority: 2
}
```

## 📱 使用效果对比

| 方案 | 国内访问 | 稳定性 | 延迟 | 配置难度 |
|------|---------|--------|------|----------|
| AllOrigins | ✅ 良好 | ⭐⭐⭐⭐ | 低 | 无需配置 |
| 自建CF代理 | ✅ 优秀 | ⭐⭐⭐⭐⭐ | 极低 | 简单 |
| 本地代理 | ✅ 完美 | ⭐⭐⭐⭐⭐ | 最低 | 需要Node.js |
| 国内CDN | ✅ 较好 | ⭐⭐⭐ | 低 | 中等 |

## 🔧 故障排除

### 如果代理服务失效：
1. 系统会自动切换到下一个可用代理
2. 查看调试信息了解当前使用的代理
3. 可以手动调整优先级

### 推荐配置顺序：
1. 自建CF Workers代理（如果有）
2. AllOrigins免费代理
3. 本地代理服务器
4. 其他备用代理
5. 直连（最后选择）

## 💡 最佳实践

1. **多节点冗余**：配置3-5个不同的代理服务
2. **地域优化**：优先使用对中国大陆友好的服务
3. **监控检查**：定期测试各代理服务的可用性
4. **自动切换**：依赖系统的智能节点选择功能