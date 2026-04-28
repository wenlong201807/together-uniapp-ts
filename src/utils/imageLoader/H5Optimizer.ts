/**
 * H5 平台专用优化器
 * 提供 H5 平台特定的图片加载优化策略
 */

export interface H5OptimizationOptions {
  enableNativeLazyLoad?: boolean  // 是否启用浏览器原生懒加载
  enableWebPAutoDetect?: boolean  // 是否自动检测 WebP 支持
  enableServiceWorkerCache?: boolean  // 是否启用 Service Worker 缓存
  preloadCriticalImages?: boolean  // 是否预加载关键图片
}

export class H5Optimizer {
  private options: Required<H5OptimizationOptions>
  private supportsNativeLazyLoad: boolean = false
  private supportsWebP: boolean = false

  constructor(options: H5OptimizationOptions = {}) {
    this.options = {
      enableNativeLazyLoad: options.enableNativeLazyLoad ?? true,
      enableWebPAutoDetect: options.enableWebPAutoDetect ?? true,
      enableServiceWorkerCache: options.enableServiceWorkerCache ?? false,
      preloadCriticalImages: options.preloadCriticalImages ?? true
    }

    this.detectFeatures()
  }

  /**
   * 检测浏览器特性
   */
  private detectFeatures() {
    // #ifdef H5
    // 检测原生懒加载支持
    if (typeof HTMLImageElement !== 'undefined') {
      this.supportsNativeLazyLoad = 'loading' in HTMLImageElement.prototype
    }

    // 检测 WebP 支持
    if (typeof document !== 'undefined') {
      this.detectWebPSupport()
    }

    if (import.meta.env.DEV) {
      console.log('[H5Optimizer] Browser features:', {
        nativeLazyLoad: this.supportsNativeLazyLoad,
        webp: this.supportsWebP
      })
    }
    // #endif

    // #ifndef H5
    // 非 H5 平台不支持这些特性
    this.supportsNativeLazyLoad = false
    this.supportsWebP = false
    // #endif
  }

  /**
   * 检测 WebP 支持
   */
  private detectWebPSupport() {
    // #ifdef H5
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas')
      if (canvas.getContext && canvas.getContext('2d')) {
        // 检查 toDataURL 是否支持 image/webp
        this.supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      }
    }
    // #endif
  }

  /**
   * 是否支持原生懒加载
   */
  isNativeLazyLoadSupported(): boolean {
    return this.supportsNativeLazyLoad && this.options.enableNativeLazyLoad
  }

  /**
   * 是否支持 WebP
   */
  isWebPSupported(): boolean {
    return this.supportsWebP
  }

  /**
   * 转换图片 URL（WebP 优化）
   */
  optimizeImageUrl(url: string, options: {
    width?: number
    height?: number
    quality?: number
  } = {}): string {
    // 如果支持 WebP，尝试转换 URL
    if (this.supportsWebP && this.options.enableWebPAutoDetect) {
      // 如果 URL 包含图片服务参数，添加 WebP 格式
      if (url.includes('?')) {
        return `${url}&format=webp`
      } else if (url.match(/\.(jpg|jpeg|png)$/i)) {
        return url.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      }
    }

    return url
  }

  /**
   * 预加载关键图片
   */
  preloadImage(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.options.preloadCriticalImages) {
        resolve()
        return
      }

      // #ifdef H5
      if (typeof document === 'undefined') {
        resolve()
        return
      }

      // 使用 <link rel="preload"> 预加载
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url

      if (priority === 'high') {
        link.setAttribute('fetchpriority', 'high')
      }

      link.onload = () => {
        // 加载完成后移除 link 元素，避免 DOM 膨胀
        setTimeout(() => {
          if (link.parentNode) {
            document.head.removeChild(link)
          }
        }, 1000)
        resolve()
      }

      link.onerror = () => {
        if (link.parentNode) {
          document.head.removeChild(link)
        }
        reject(new Error(`Failed to preload image: ${url}`))
      }

      document.head.appendChild(link)
      // #endif

      // #ifndef H5
      // 非 H5 平台不支持预加载
      resolve()
      // #endif
    })
  }

  /**
   * 使用 Intersection Observer 实现懒加载
   */
  createIntersectionObserver(
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    // #ifdef H5
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('[H5Optimizer] IntersectionObserver not supported')
      return null
    }

    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    }

    return new IntersectionObserver((entries) => {
      entries.forEach(callback)
    }, defaultOptions)
    // #endif

    // #ifndef H5
    // 非 H5 平台不支持
    return null
    // #endif
  }

  /**
   * 获取优化建议
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []

    if (!this.supportsNativeLazyLoad) {
      recommendations.push('浏览器不支持原生懒加载，使用 Intersection Observer 降级')
    }

    if (!this.supportsWebP) {
      recommendations.push('浏览器不支持 WebP，使用 JPG/PNG 格式')
    }

    if (this.options.enableServiceWorkerCache) {
      recommendations.push('建议启用 Service Worker 缓存以提升离线体验')
    }

    return recommendations
  }

  /**
   * 清理资源
   */
  cleanup() {
    // H5 平台清理逻辑
    if (import.meta.env.DEV) {
      console.log('[H5Optimizer] Cleanup completed')
    }
  }
}

// 全局单例
let globalH5Optimizer: H5Optimizer | null = null

/**
 * 获取全局 H5 优化器
 */
export function getGlobalH5Optimizer(options?: H5OptimizationOptions): H5Optimizer {
  if (!globalH5Optimizer) {
    globalH5Optimizer = new H5Optimizer(options)
  }
  return globalH5Optimizer
}

/**
 * 销毁全局 H5 优化器
 */
export function destroyGlobalH5Optimizer() {
  if (globalH5Optimizer) {
    globalH5Optimizer.cleanup()
    globalH5Optimizer = null
  }
}
