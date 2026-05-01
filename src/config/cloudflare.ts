// Cloudflare Workers 配置

export const CLOUDFLARE_CONFIG = {
  // Worker URL（请替换为你的实际 URL）
  // 格式：https://image-proxy.你的用户名.workers.dev
  workerUrl: 'https://image-proxy.zhu1573511441.workers.dev',

  // 是否启用代理
  enabled: true,

  // 超时时间（毫秒）
  timeout: 10000,

  // 是否在开发环境启用
  enableInDev: true
}

/**
 * 获取 Worker URL
 */
export function getWorkerUrl(): string {
  // 开发环境检查
  if (import.meta.env.DEV && !CLOUDFLARE_CONFIG.enableInDev) {
    console.warn('Cloudflare proxy is disabled in development mode')
    return ''
  }

  return CLOUDFLARE_CONFIG.workerUrl
}

/**
 * 检查是否启用代理
 */
export function isProxyEnabled(): boolean {
  if (!CLOUDFLARE_CONFIG.enabled) {
    return false
  }

  if (import.meta.env.DEV && !CLOUDFLARE_CONFIG.enableInDev) {
    return false
  }

  return true
}
