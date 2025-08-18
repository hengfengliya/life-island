# Cloudflare Workers 国内优化配置指南

## 🌐 需要在Cloudflare控制台配置的自定义域名

要让国内用户能够访问，你需要在Cloudflare Workers控制台添加以下自定义域名：

### 步骤1：进入Cloudflare Workers控制台
1. 登录 https://dash.cloudflare.com/
2. 选择你的域名 `life-island.workers.dev`
3. 进入 "Workers" 页面
4. 选择你的 `life-station-api` worker

### 步骤2：添加自定义路由 (Custom Routes)
如果你有自己的域名，可以添加这些路由：

```
api.your-domain.com/api/*  -> life-station-api
cn-api.your-domain.com/api/*  -> life-station-api
```

### 步骤3：或者使用Workers子域名
如果没有自定义域名，可以尝试这些Workers子域名（需要确认是否可用）：

1. `https://life-island.workers.dev` (简化版)
2. `https://api-life-island.workers.dev` (备用版)

### 步骤4：测试国内可访问的Cloudflare IP

以下是一些相对稳定的Cloudflare IP地址（国内可访问）：

```bash
# 测试这些IP是否可访问
curl -H "Host: life-station-api.life-island.workers.dev" https://162.159.192.1/api/health
curl -H "Host: life-station-api.life-island.workers.dev" https://162.159.193.1/api/health
curl -H "Host: life-station-api.life-island.workers.dev" https://162.159.195.1/api/health
```

### 步骤5：更新配置文件

如果找到可用的IP，可以在config.js中添加：

```javascript
{
    name: 'Cloudflare Workers（国内IP）',
    url: 'https://162.159.192.1/api',
    region: 'china-ip',
    priority: 2,
    headers: {
        'Host': 'life-station-api.life-island.workers.dev'
    }
}
```

## 🚀 快速验证方法

在不同网络环境下测试这些地址：

1. **海外网络**：应该都能访问
2. **国内网络（无VPN）**：测试哪个能访问
3. **手机网络**：测试移动端兼容性

## ⚡ 最佳实践

1. **多节点冗余**：配置3-5个备用节点
2. **智能切换**：系统自动选择最快节点
3. **实时监控**：监控各节点连通性
4. **用户反馈**：收集不同地区用户的访问情况