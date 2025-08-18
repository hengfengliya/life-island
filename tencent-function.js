/**
 * 腾讯云函数版本 - 人生小站API
 * 基于Cloudflare Workers代码修改
 */

// CORS 头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求
function handleCors(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  return null;
}

// 生成响应的辅助函数
function jsonResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(data)
  };
}

// 生成唯一ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// 验证漂流瓶数据
function validateBottle(bottle) {
  if (!bottle.message || typeof bottle.message !== 'string') {
    return false;
  }
  if (bottle.message.trim().length === 0 || bottle.message.length > 1000) {
    return false;
  }
  return true;
}

// 模拟数据存储（实际项目中应使用腾讯云数据库）
let bottlesStore = [];

exports.main_handler = async (event, context) => {
  console.log('Received event:', event);

  // 处理 CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const path = event.path || '/';
  const method = event.httpMethod || 'GET';
  
  try {
    // 路由处理
    if (path === '/api/bottles' && method === 'GET') {
      return handleGetBottles(event);
    }
    
    if (path === '/api/bottles' && method === 'POST') {
      return await handleCreateBottle(event);
    }
    
    if (path === '/api/health' && method === 'GET') {
      return jsonResponse({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: 'tencent-cloud',
        region: 'china'
      });
    }

    if (path === '/api/search' && method === 'GET') {
      return handleSearchBottles(event);
    }

    // 404 处理
    return jsonResponse({ error: 'Not Found' }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ 
      error: 'Internal Server Error',
      message: error.message 
    }, 500);
  }
};

/**
 * 获取所有漂流瓶
 */
function handleGetBottles(event) {
  const queryParams = event.queryStringParameters || {};
  const limit = Math.min(parseInt(queryParams.limit) || 50, 100);

  // 按时间戳降序排序
  const sortedBottles = bottlesStore.sort((a, b) => b.timestamp - a.timestamp);
  const limitedBottles = sortedBottles.slice(0, limit);

  return jsonResponse({
    bottles: limitedBottles,
    total: limitedBottles.length,
  });
}

/**
 * 创建新的漂流瓶
 */
async function handleCreateBottle(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // 验证数据
    if (!validateBottle(body)) {
      return jsonResponse({ 
        error: 'Invalid bottle data',
        message: '消息内容不能为空，且长度不能超过1000字符' 
      }, 400);
    }

    const now = Date.now();
    const bottleId = generateId();
    
    const bottle = {
      id: bottleId,
      message: body.message.trim(),
      date: new Date(now).toISOString(),
      timestamp: now,
      created_at: now,
    };

    // 存储到内存（实际项目中应使用数据库）
    bottlesStore.unshift(bottle);

    // 限制内存中的瓶子数量（避免内存溢出）
    if (bottlesStore.length > 1000) {
      bottlesStore = bottlesStore.slice(0, 1000);
    }

    return jsonResponse({ 
      success: true,
      bottle,
      message: '思念已经交给大海 🌊'
    }, 201);

  } catch (error) {
    console.error('Error creating bottle:', error);
    return jsonResponse({ 
      error: 'Failed to create bottle',
      message: '装瓶失败，请重试' 
    }, 500);
  }
}

/**
 * 搜索漂流瓶
 */
function handleSearchBottles(event) {
  const queryParams = event.queryStringParameters || {};
  const query = queryParams.q;
  const limit = Math.min(parseInt(queryParams.limit) || 20, 50);

  if (!query || query.trim().length === 0) {
    return jsonResponse({ error: 'Search query is required' }, 400);
  }

  const searchTerm = query.toLowerCase().trim();
  const searchResults = bottlesStore.filter(bottle => 
    bottle.message.toLowerCase().includes(searchTerm)
  );

  // 按时间戳降序排序并限制结果数量
  searchResults.sort((a, b) => b.timestamp - a.timestamp);
  const limitedResults = searchResults.slice(0, limit);

  return jsonResponse({
    bottles: limitedResults,
    query: query,
    total: limitedResults.length,
    message: limitedResults.length > 0 ? 
      `🌊 海风带来了 ${limitedResults.length} 个漂流瓶` : 
      '🌊 海面很平静，没有找到相关的漂流瓶'
  });
}