# 人生小站 Cloudflare Workers API

## 部署说明

### 1. 安装依赖
```bash
npm install
```

### 2. 创建 KV 命名空间
```bash
# 创建生产环境 KV 命名空间
npx wrangler kv:namespace create "BOTTLES_KV"

# 创建预览环境 KV 命名空间
npx wrangler kv:namespace create "BOTTLES_KV" --preview
```

### 3. 更新 wrangler.toml
复制上述命令输出的 namespace ID，更新 `wrangler.toml` 中的：
```toml
[[kv_namespaces]]
binding = "BOTTLES_KV"
id = "your_production_namespace_id"
preview_id = "your_preview_namespace_id"
```

### 4. 本地开发
```bash
npm run dev
```

### 5. 部署到生产环境
```bash
npm run deploy
```

## API 文档

### 获取所有漂流瓶
- **GET** `/api/bottles`
- **参数**:
  - `limit`: 每页数量 (默认50，最大100)
  - `cursor`: 分页游标
- **响应**:
```json
{
  "bottles": [
    {
      "id": "bottle_id",
      "message": "思念内容",
      "date": "2024-01-01T00:00:00.000Z",
      "timestamp": 1704067200000
    }
  ],
  "cursor": "next_page_cursor",
  "total": 10
}
```

### 创建漂流瓶
- **POST** `/api/bottles`
- **请求体**:
```json
{
  "message": "要存储的思念内容"
}
```
- **响应**:
```json
{
  "success": true,
  "bottle": {
    "id": "generated_id",
    "message": "思念内容",
    "date": "2024-01-01T00:00:00.000Z",
    "timestamp": 1704067200000
  },
  "message": "思念已经交给大海 🌊"
}
```

### 获取单个漂流瓶
- **GET** `/api/bottles/{id}`
- **响应**:
```json
{
  "bottle": {
    "id": "bottle_id",
    "message": "思念内容",
    "date": "2024-01-01T00:00:00.000Z",
    "timestamp": 1704067200000
  }
}
```

### 搜索漂流瓶
- **GET** `/api/search`
- **参数**:
  - `q`: 搜索关键词
  - `limit`: 结果数量 (默认20，最大50)
- **响应**:
```json
{
  "bottles": [
    {
      "id": "bottle_id",
      "message": "包含关键词的思念内容",
      "date": "2024-01-01T00:00:00.000Z",
      "timestamp": 1704067200000
    }
  ],
  "query": "搜索关键词",
  "total": 5,
  "message": "🌊 海风带来了 5 个漂流瓶"
}
```

### 健康检查
- **GET** `/api/health`
- **响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## 特性

- ✅ RESTful API 设计
- ✅ CORS 跨域支持
- ✅ 数据验证和错误处理
- ✅ KV 存储持久化
- ✅ 分页查询支持
- ✅ 全文搜索功能
- ✅ 健康检查端点
- ✅ 浪漫的响应消息

## 数据存储结构

### KV 存储键名规范
- `bottle:{id}`: 存储完整的漂流瓶数据
- `time:{timestamp}:{id}`: 时间索引，方便按时间排序

### 漂流瓶数据结构
```json
{
  "id": "唯一标识符",
  "message": "思念内容",
  "date": "ISO格式日期时间",
  "timestamp": "Unix时间戳",
  "created_at": "创建时间戳"
}
```