/**
 * Cloudflare Workers - 图片 HTTPS 代理
 * 用于将 HTTP 图片代理为 HTTPS，解决混合内容问题
 */

// 允许代理的域名白名单
const allowedDomains = [
  'qiniucdn.com',
  'clouddn.com',
  'qiniup.com',
  'qbox.me',
  // 可以根据需要添加更多七牛云域名
];

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * 处理请求
 */
async function handleRequest(request) {
  const url = new URL(request.url);

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 只允许 GET 和 HEAD 请求
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  // 获取目标 URL
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // 验证目标 URL
  let targetURL;
  try {
    targetURL = new URL(targetUrl);
  } catch (e) {
    return new Response('Invalid url parameter', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // 检查是否在白名单中
  if (!isAllowedDomain(targetURL)) {
    return new Response('Domain not allowed', {
      status: 403,
      headers: corsHeaders,
    });
  }

  // 代理请求
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Workers-Proxy',
        'Referer': targetURL.origin,
      },
    });

    // 构建响应头
    const responseHeaders = new Headers(response.headers);

    // 添加 CORS 头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // 添加缓存控制
    responseHeaders.set('Cache-Control', 'public, max-age=31536000');

    // 返回代理响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, {
      status: 502,
      headers: corsHeaders,
    });
  }
}

/**
 * 检查域名是否在白名单中
 */
function isAllowedDomain(url) {
  return allowedDomains.some((domain) => url.hostname.endsWith(domain));
}

/**
 * 入口函数
 */
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
