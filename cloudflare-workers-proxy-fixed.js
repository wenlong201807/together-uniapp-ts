/**
 * Cloudflare Workers - 七牛云图片 HTTPS 代理
 * 功能：将七牛云 HTTP 图片转换为 HTTPS 访问
 * 使用方法：https://your-worker.workers.dev?url=http://xxx.bkt.clouddn.com/image.jpg
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // 只允许 GET 和 HEAD 请求
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return createErrorResponse('Method not allowed', 405);
    }

    // 获取要代理的图片 URL
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return createErrorResponse(
        'Missing url parameter. Usage: ?url=http://xxx.bkt.clouddn.com/image.jpg',
        400
      );
    }

    // 验证 URL 格式
    if (!isValidUrl(imageUrl)) {
      return createErrorResponse('Invalid URL format', 400);
    }

    // 验证域名白名单（只允许七牛云域名）
    if (!isAllowedDomain(imageUrl)) {
      return createErrorResponse(
        'Domain not allowed. Only Qiniu domains are supported.',
        403
      );
    }

    // 检查缓存
    const cache = caches.default;
    const cacheKey = new Request(imageUrl, {
      method: 'GET',
      headers: request.headers,
    });

    let response = await cache.match(cacheKey);

    if (response) {
      // 缓存命中
      console.info('Cache HIT:', imageUrl);
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Status', 'Cloudflare Workers Cache');
      return addCorsHeaders(response);
    }

    // 缓存未命中，从源站获取
    console.info('Cache MISS:', imageUrl);

    try {
      response = await fetch(imageUrl, {
        method: request.method,
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Workers-Proxy/1.0',
          'Accept': request.headers.get('Accept') || 'image/*',
        },
        cf: {
          cacheTtl: 86400, // 缓存 1 天（更合理）
          cacheEverything: true,
        },
      });

      if (!response.ok) {
        console.error('Fetch failed:', response.status, response.statusText);
        return createErrorResponse(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      // 验证内容类型（可选，但推荐）
      const contentType = response.headers.get('Content-Type');
      if (contentType && !contentType.startsWith('image/')) {
        console.warn('Non-image content type:', contentType);
        // 不阻止，但记录日志
      }

      // 克隆响应用于缓存
      const responseToCache = response.clone();

      // 构建新响应
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // 添加自定义响应头
      newResponse.headers.set('Cache-Control', 'public, max-age=86400');
      newResponse.headers.set('X-Cache', 'MISS');
      newResponse.headers.set('X-Proxy-By', 'Cloudflare Workers');

      // 添加 CORS 头
      const finalResponse = addCorsHeaders(newResponse);

      // 异步存入缓存
      ctx.waitUntil(cache.put(cacheKey, responseToCache));

      return finalResponse;
    } catch (error) {
      console.error('Fetch error:', error);
      return createErrorResponse(`Failed to fetch image: ${error.message}`, 502);
    }
  },
};

/**
 * 验证 URL 格式
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * 验证域名白名单（只允许七牛云域名）
 * 🔴 修复：添加了缺失的参数，并使用更严格的匹配规则
 */
function isAllowedDomain(urlString) {
  const allowedDomains = [
    'qiniucdn.com',
    'qiniup.com',
    'clouddn.com',
    'qbox.me',
    'qnssl.com',
  ];

  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // 严格匹配：完全匹配或以 .domain 结尾
    return allowedDomains.some((domain) =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
}

/**
 * 添加 CORS 头
 */
function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  newResponse.headers.set('Access-Control-Max-Age', '86400');
  return newResponse;
}

/**
 * 处理 OPTIONS 请求（CORS 预检）
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * 创建错误响应
 */
function createErrorResponse(message, status) {
  return new Response(
    JSON.stringify({
      error: message,
      status: status,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
