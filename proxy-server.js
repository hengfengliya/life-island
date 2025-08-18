/**
 * 简单的本地代理服务器
 * 用于绕过CORS限制和网络封锁
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 3000;
const TARGET_API = 'https://life-station-api.life-island.workers.dev/api';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);
  let targetPath = parsedUrl.pathname;
  
  // Remove /proxy prefix if exists
  if (targetPath.startsWith('/proxy')) {
    targetPath = targetPath.replace('/proxy', '');
  }
  
  // Build target URL
  const targetUrl = TARGET_API + targetPath + (parsedUrl.search || '');
  
  console.log(`Proxying to: ${targetUrl}`);

  // Prepare request options
  const targetParsed = url.parse(targetUrl);
  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80),
    path: targetParsed.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetParsed.hostname
    }
  };

  // Use https or http based on target protocol
  const httpModule = targetParsed.protocol === 'https:' ? https : http;

  const proxyReq = httpModule.request(options, (proxyRes) => {
    // Set CORS headers
    const responseHeaders = {
      ...corsHeaders,
      ...proxyRes.headers
    };

    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ 
      error: 'Proxy Error', 
      message: err.message 
    }));
  });

  // Forward request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`🚀 代理服务器启动成功！`);
  console.log(`📡 监听端口: http://localhost:${PROXY_PORT}`);
  console.log(`🎯 目标API: ${TARGET_API}`);
  console.log(`💡 使用方法: 将前端API地址改为 http://localhost:${PROXY_PORT}`);
  console.log(`⏹️  停止服务: Ctrl+C`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PROXY_PORT} 已被占用，请关闭其他程序或更换端口`);
  } else {
    console.error('❌ 服务器启动失败:', err);
  }
});