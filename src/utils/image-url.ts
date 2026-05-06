/**
 * 图片 URL 处理工具
 * 将七牛云域名转换为 CDN 代理域名
 *
 * 转换规则：
 * http://td42nzl7d.hn-bkt.clouddn.com/album/xxx.jpg
 * → https://img.wetogether.best/proxy/album/xxx.jpg
 */

/**
 * 获取 CDN 代理域名（包含 /proxy 前缀）
 */
function getCdnDomain(): string {
  return import.meta.env.VITE_IMAGE_CDN || 'https://img.wetogether.best/proxy'
}

/**
 * 获取七牛云原始域名
 */
function getQiniuDomain(): string {
  return import.meta.env.VITE_QINIU_DOMAIN || 'http://td42nzl7d.hn-bkt.clouddn.com'
}

/**
 * 从七牛云 URL 中提取路径部分
 * @param url 七牛云完整 URL
 * @param qiniuDomain 七牛云域名
 * @returns 路径部分（如 /album/xxx.jpg）
 */
function extractPath(url: string, qiniuDomain: string): string {
  // 移除域名，保留路径
  let path = url.replace(qiniuDomain, '')

  // 确保路径以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  return path
}

/**
 * 将七牛云 URL 转换为 CDN 代理 URL
 * @param url 原始图片 URL
 * @returns CDN 代理 URL
 *
 * @example
 * convertToCdnUrl('http://td42nzl7d.hn-bkt.clouddn.com/album/photo.jpg')
 * // 返回: 'https://img.wetogether.best/proxy/album/photo.jpg'
 *
 * convertToCdnUrl('http://td42nzl7d.hn-bkt.clouddn.com/certificate/xxx.jpg?imageView2/1/w/200')
 * // 返回: 'https://img.wetogether.best/proxy/certificate/xxx.jpg?imageView2/1/w/200'
 */
export function convertToCdnUrl(url: string | undefined | null): string {
  if (!url) return ''

  // 如果是 data URL 或 blob URL，直接返回（不做转换）
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  // 如果已经是 CDN 代理地址，直接返回
  const cdnDomain = getCdnDomain()
  if (url.includes(cdnDomain)) {
    return url
  }

  const qiniuDomain = getQiniuDomain()

  // 处理七牛云域名（带或不带斜杠）
  const qiniuDomainWithSlash = qiniuDomain.endsWith('/') ? qiniuDomain : `${qiniuDomain}/`
  const qiniuDomainWithoutSlash = qiniuDomain.endsWith('/') ? qiniuDomain.slice(0, -1) : qiniuDomain

  // 检查是否包含七牛云域名
  if (url.includes(qiniuDomainWithoutSlash) || url.includes(qiniuDomainWithSlash)) {
    // 提取路径部分（包括查询参数）
    const path = extractPath(url, qiniuDomainWithoutSlash)

    // 拼接 CDN 代理地址
    // cdnDomain 已经包含 /proxy，path 以 / 开头
    // 需要确保不会出现双斜杠
    const cdnUrl = cdnDomain + path

    return cdnUrl
  }

  // 如果是相对路径（如 album/xxx.jpg 或 /album/xxx.jpg），拼接 CDN 域名
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    return cdnDomain + cleanUrl
  }

  // 其他情况直接返回
  return url
}

/**
 * 批量转换图片 URL
 * @param urls 图片 URL 数组
 * @returns CDN URL 数组
 */
export function convertUrlsToCdn(urls: (string | undefined | null)[]): string[] {
  if (!urls || !Array.isArray(urls)) {
    return []
  }
  return urls.map(convertToCdnUrl)
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
      result[field] = convertToCdnUrl(value) as any
    } else if (Array.isArray(value)) {
      result[field] = convertUrlsToCdn(value) as any
    }
  })

  return result
}

/**
 * 确保图片 URL 使用 HTTPS 协议
 * @param url 原始图片 URL
 * @returns HTTPS 协议的图片 URL
 */
export function ensureHttps(url: string | undefined | null): string {
  const cdnUrl = convertToCdnUrl(url)

  if (!cdnUrl) return ''

  // 如果是相对路径或已经是 HTTPS，直接返回
  if (cdnUrl.startsWith('/') || cdnUrl.startsWith('https://') || cdnUrl.startsWith('data:')) {
    return cdnUrl
  }

  // 将 HTTP 转换为 HTTPS
  if (cdnUrl.startsWith('http://')) {
    return cdnUrl.replace('http://', 'https://')
  }

  return cdnUrl
}

/**
 * 获取图片缩略图 URL（七牛云图片处理）
 * @param url 原始图片 URL
 * @param width 宽度
 * @param height 高度
 * @returns 缩略图 URL
 */
export function getThumbnail(url: string | undefined | null, width: number, height?: number): string {
  const cdnUrl = ensureHttps(url)

  if (!cdnUrl) {
    return cdnUrl
  }

  // 检查 URL 是否已经包含参数
  const hasParams = cdnUrl.includes('?')
  const separator = hasParams ? '&' : '?'

  const params = height
    ? `imageView2/1/w/${width}/h/${height}`
    : `imageView2/2/w/${width}`

  return cdnUrl + separator + params
}
