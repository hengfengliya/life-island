/**
 * 人生小站 - Cloudflare Workers API
 * 提供漂流瓶的存储、检索和搜索功能
 */

// CORS 头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求
function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// 生成响应的辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
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

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // 路由处理
      if (path === '/api/bottles' && method === 'GET') {
        return await handleGetBottles(request, env);
      }
      
      if (path === '/api/bottles' && method === 'POST') {
        return await handleCreateBottle(request, env);
      }
      
      if (path.startsWith('/api/bottles/') && method === 'GET') {
        const bottleId = path.split('/')[3];
        return await handleGetBottle(bottleId, env);
      }
      
      if (path === '/api/search' && method === 'GET') {
        return await handleSearchBottles(request, env);
      }

      if (path === '/api/health' && method === 'GET') {
        return jsonResponse({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'development'
        });
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
  },
};

/**
 * 获取所有漂流瓶
 */
async function handleGetBottles(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const cursor = url.searchParams.get('cursor');

  try {
    // 获取瓶子列表（按时间倒序）
    const listOptions = {
      limit,
      prefix: 'bottle:',
    };
    
    if (cursor) {
      listOptions.cursor = cursor;
    }

    const keys = await env.BOTTLES_KV.list(listOptions);
    
    // 批量获取瓶子数据
    const bottles = [];
    for (const key of keys.keys) {
      const bottleData = await env.BOTTLES_KV.get(key.name);
      if (bottleData) {
        try {
          const bottle = JSON.parse(bottleData);
          bottles.push(bottle);
        } catch (e) {
          console.error('Failed to parse bottle data:', e);
        }
      }
    }

    // 按时间戳降序排序
    bottles.sort((a, b) => b.timestamp - a.timestamp);

    return jsonResponse({
      bottles,
      cursor: keys.list_complete ? null : keys.cursor,
      total: bottles.length,
    });
    
  } catch (error) {
    console.error('Error fetching bottles:', error);
    return jsonResponse({ error: 'Failed to fetch bottles' }, 500);
  }
}

/**
 * 创建新的漂流瓶
 */
async function handleCreateBottle(request, env) {
  try {
    const body = await request.json();
    
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

    // 存储到 KV
    const key = `bottle:${bottleId}`;
    await env.BOTTLES_KV.put(key, JSON.stringify(bottle));

    // 同时存储到时间索引中，方便按时间查询
    const timeKey = `time:${now}:${bottleId}`;
    await env.BOTTLES_KV.put(timeKey, bottleId);

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
 * 获取单个漂流瓶
 */
async function handleGetBottle(bottleId, env) {
  if (!bottleId) {
    return jsonResponse({ error: 'Bottle ID is required' }, 400);
  }

  try {
    const key = `bottle:${bottleId}`;
    const bottleData = await env.BOTTLES_KV.get(key);
    
    if (!bottleData) {
      return jsonResponse({ error: 'Bottle not found' }, 404);
    }

    const bottle = JSON.parse(bottleData);
    return jsonResponse({ bottle });

  } catch (error) {
    console.error('Error fetching bottle:', error);
    return jsonResponse({ error: 'Failed to fetch bottle' }, 500);
  }
}

/**
 * 搜索漂流瓶
 */
async function handleSearchBottles(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);

  if (!query || query.trim().length === 0) {
    return jsonResponse({ error: 'Search query is required' }, 400);
  }

  try {
    // 获取所有瓶子进行搜索（简单实现，生产环境可考虑使用搜索引擎）
    const keys = await env.BOTTLES_KV.list({ 
      prefix: 'bottle:',
      limit: 1000 // 限制搜索范围
    });
    
    const searchResults = [];
    const searchTerm = query.toLowerCase().trim();

    for (const key of keys.keys.slice(0, limit * 2)) { // 多获取一些以便过滤
      const bottleData = await env.BOTTLES_KV.get(key.name);
      if (bottleData) {
        try {
          const bottle = JSON.parse(bottleData);
          if (bottle.message.toLowerCase().includes(searchTerm)) {
            searchResults.push(bottle);
          }
        } catch (e) {
          console.error('Failed to parse bottle data:', e);
        }
      }
    }

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

  } catch (error) {
    console.error('Error searching bottles:', error);
    return jsonResponse({ error: 'Search failed' }, 500);
  }
}