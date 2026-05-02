// Cloudflare Workers 图片代理工具

import { CLOUDFLARE_CONFIG, isProxyEnabled, getWorkerUrl } from '@/config/cloudflare'

/**
 * 转换七牛云 HTTP URL 为 HTTPS 代理 URL
 */
export function convertToHttpsUrl(qiniuUrl: string): string {
  console.log('[convertToHttpsUrl] 开始转换，输入 URL:', qiniuUrl)

  // 如果未启用代理，直接返回原 URL
  if (!isProxyEnabled()) {
    console.log('[convertToHttpsUrl] 代理未启用，返回原 URL')
    return qiniuUrl
  }

  // 如果 URL 为空，直接返回
  if (!qiniuUrl) {
    console.log('[convertToHttpsUrl] URL 为空，返回空字符串')
    return ''
  }

  // 如果已经是 HTTPS，直接返回
  if (qiniuUrl.startsWith('https://')) {
    console.log('[convertToHttpsUrl] 已经是 HTTPS，直接返回')
    return qiniuUrl
  }

  // 如果是 HTTP，通过 Cloudflare Workers 代理
  if (qiniuUrl.startsWith('http://')) {
    const workerUrl = getWorkerUrl()

    if (!workerUrl) {
      console.warn('[convertToHttpsUrl] Worker URL 未配置，返回原 URL')
      return qiniuUrl
    }

    const proxyUrl = `${workerUrl}?url=${encodeURIComponent(qiniuUrl)}`
    console.log('[convertToHttpsUrl] 转换成功')
    console.log('[convertToHttpsUrl] 原始 URL:', qiniuUrl)
    console.log('[convertToHttpsUrl] Worker URL:', workerUrl)
    console.log('[convertToHttpsUrl] 代理 URL:', proxyUrl)

    // 测试代理 URL 是否可访问
    testProxyUrl(proxyUrl, qiniuUrl)

    return proxyUrl
  }

  // 其他情况直接返回
  console.log('[convertToHttpsUrl] 不是 HTTP/HTTPS 协议，返回原 URL')
  return qiniuUrl
}

/**
 * 测试代理 URL 是否可访问
 */
async function testProxyUrl(proxyUrl: string, originalUrl: string) {
  try {
    console.log('[testProxyUrl] 开始测试代理 URL:', proxyUrl)

    const response = await fetch(proxyUrl, {
      method: 'HEAD',
      mode: 'cors'
    })

    console.log('[testProxyUrl] 响应状态:', response.status, response.statusText)
    console.log('[testProxyUrl] 响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error('[testProxyUrl] ❌ 代理请求失败!')
      console.error('[testProxyUrl] 状态码:', response.status)
      console.error('[testProxyUrl] 原始', originalUrl)
      console.error('[testProxyUrl] 代理 URL:', proxyUrl)

      // 尝试直接访问原始 URL
      console.log('[testProxyUrl] 尝试直接访问原始 URL...')
      const directResponse = await fetch(originalUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      })
      console.log('[testProxyUrl] 原始 URL 响应:', directResponse.type, directResponse.status)
    } else {
      console.log('[testProxyUrl] ✅ 代理 URL 可访问')
    }
  } catch (error) {
    console.error('[testProxyUrl] ❌ 测试代理 URL 失败:', error)
    console.error('[testProxyUrl] 错误详情:', {
      message: (error as Error).message,
      originalUrl,
      proxyUrl
    })
  }
}

/**
 * 批量转换 URL
 */
export function convertUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) {
    return []
  }

  return urls.map(convertToHttpsUrl)
}

/**
 * 转换对象中的图片字段
 * @param obj 要转换的对象
 * @param fields 需要转换的字段名数组
 * @returns 转换后的对象
 */
export function convertImageFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  if (!obj) {
    return obj
  }

  const result = { ...obj }

  fields.forEach(field => {
    const value = result[field]

    if (typeof value === 'string') {
      // 单个字符串
      result[field] = convertToHttpsUrl(value) as any
    } else if (Array.isArray(value)) {
      // 字符串数组
      result[field] = convertUrls(value) as any
    }
  })

  return result
}

/**
 * 检查 URL 是否需要代理
 */
export function needsProxy(url: string): boolean {
  if (!url) return false
  if (!isProxyEnabled()) return false

  // 只有 HTTP 的七牛云 URL 需要代理
  if (url.startsWith('http://')) {
    const qiniuDomains = ['qiniucdn.com', 'clouddn.com', 'qiniup.com', 'qbox.me']
    return qiniuDomains.some(domain => url.includes(domain))
  }

  return false
}

/**
 * 获取原始 URL（从代理 URL 中提取）
 */
export function getOriginalUrl(proxyUrl: string): string {
  try {
    const url = new URL(proxyUrl)
    const originalUrl = url.searchParams.get('url')
    return originalUrl || proxyUrl
  } catch (e) {
    return proxyUrl
  }
}
