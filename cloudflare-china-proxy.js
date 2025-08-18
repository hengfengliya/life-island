/**
 * Cloudflare Workers 代理服务
 * 用于国内访问 life-station-api
 * 部署到: china-proxy.your-domain.workers.dev
 */

const TARGET_API = 'https://life-station-api.life-island.workers.dev';

// CORS 头部
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

// 添加响应头
function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      
      // 构建目标 URL
      let targetUrl = TARGET_API;
      
      // 保留路径和查询参数
      if (url.pathname !== '/') {
        targetUrl += url.pathname;
      }
      if (url.search) {
        targetUrl += url.search;
      }

      console.log(`Proxying request to: ${targetUrl}`);

      // 创建新的请求
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // 发送请求到目标服务器
      const response = await fetch(proxyRequest);
      
      // 返回带CORS头的响应
      return addCorsHeaders(response);

    } catch (error) {
      console.error('Proxy error:', error);
      
      return new Response(JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
};