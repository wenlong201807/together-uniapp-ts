/**
 * 图片URL处理工具
 */

/**
 * 确保图片URL使用HTTPS协议
 * @param url 原始图片URL
 * @returns HTTPS协议的图片URL
 */
export function ensureHttps(url: string | undefined | null): string {
  if (!url) return ''

  // 如果是相对路径或已经是HTTPS，直接返回
  if (url.startsWith('/') || url.startsWith('https://')) {
    return url
  }

  // 将HTTP转换为HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }

  return url
}

/**
 * 批量转换图片URL为HTTPS
 * @param urls 图片URL数组
 * @returns HTTPS协议的图片URL数组
 */
export function ensureHttpsArray(urls: (string | undefined | null)[]): string[] {
  return urls.map(url => ensureHttps(url))
}

/**
 * 获取图片缩略图URL（七牛云）
 * @param url 原始图片URL
 * @param width 宽度
 * @param height 高度
 * @returns 缩略图URL
 */
export function getThumbnail(url: string | undefined | null, width: number, height?: number): string {
  const httpsUrl = ensureHttps(url)

  if (!httpsUrl || !httpsUrl.includes('clouddn.com')) {
    return httpsUrl
  }

  // 检查URL是否已经包含参数
  const hasParams = httpsUrl.includes('?')
  const separator = hasParams ? '&' : '?'

  const params = height
    ? `imageView2/1/w/${width}/h/${height}`
    : `imageView2/2/w/${width}`

  return httpsUrl + separator + params
}
