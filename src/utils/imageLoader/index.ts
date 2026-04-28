/**
 * 图片加载器主入口
 * 整合 IntersectionObserver、ImageLoadQueue、缓存管理、性能监控、网络检测等
 */

import { IntersectionObserverManager, getGlobalObserver, destroyGlobalObserver } from './IntersectionObserver'
import { ImageLoadQueue, ImagePriority, getGlobalImageQueue, destroyGlobalImageQueue } from './ImageLoadQueue'
import { ImageLRUCache, getGlobalImageCache, destroyGlobalImageCache } from './ImageCache'
import { MemoryManager, getGlobalMemoryManager, destroyGlobalMemoryManager } from './MemoryManager'
import { PerformanceMonitor, getGlobalPerformanceMonitor, destroyGlobalPerformanceMonitor } from './PerformanceMonitor'
import { NetworkDetector, NetworkType, NetworkSpeed, getGlobalNetworkDetector, destroyGlobalNetworkDetector } from './NetworkDetector'
import { WebPDetector, getGlobalWebPDetector, destroyGlobalWebPDetector, initWebPDetection } from './WebPDetector'
import { OfflineCache, getGlobalOfflineCache, destroyGlobalOfflineCache } from './OfflineCache'
import { H5Optimizer, getGlobalH5Optimizer, destroyGlobalH5Optimizer } from './H5Optimizer'

// 重新导出所有模块
export { IntersectionObserverManager, getGlobalObserver, destroyGlobalObserver }
export { ImageLoadQueue, ImagePriority, getGlobalImageQueue, destroyGlobalImageQueue }
export { ImageLRUCache, getGlobalImageCache, destroyGlobalImageCache }
export { MemoryManager, getGlobalMemoryManager, destroyGlobalMemoryManager }
export { PerformanceMonitor, getGlobalPerformanceMonitor, destroyGlobalPerformanceMonitor }
export { NetworkDetector, NetworkType, NetworkSpeed, getGlobalNetworkDetector, destroyGlobalNetworkDetector }
export { WebPDetector, getGlobalWebPDetector, destroyGlobalWebPDetector, initWebPDetection }
export { OfflineCache, getGlobalOfflineCache, destroyGlobalOfflineCache }
export { H5Optimizer, getGlobalH5Optimizer, destroyGlobalH5Optimizer }

export type { ImageLoadTask } from './ImageLoadQueue'
export type { ObserverCallback, ObserverOptions } from './IntersectionObserver'
export type { CachedImage } from './ImageCache'
export type { MemoryStats } from './MemoryManager'
export type { PerformanceMetrics } from './PerformanceMonitor'
export type { NetworkInfo } from './NetworkDetector'
export type { PersistentCacheItem } from './OfflineCache'
export type { H5OptimizationOptions } from './H5Optimizer'

/**
 * 初始化图片加载器
 */
export async function initImageLoader(options: {
  maxConcurrent?: number
  maxCacheSize?: number
  memoryThreshold?: number
  enableMonitoring?: boolean
  enableOfflineCache?: boolean
} = {}) {
  const {
    maxConcurrent = 3,
    maxCacheSize = 50,
    memoryThreshold = 30 * 1024 * 1024,
    enableMonitoring = true,
    enableOfflineCache = true
  } = options

  // 初始化各个模块（使用已导入的函数）
  const observer = getGlobalObserver()
  const queue = getGlobalImageQueue(maxConcurrent)
  const cache = getGlobalImageCache(maxCacheSize)
  const memoryManager = getGlobalMemoryManager({ memoryThreshold })
  const performanceMonitor = getGlobalPerformanceMonitor()
  const networkDetector = getGlobalNetworkDetector()
  const webpDetector = getGlobalWebPDetector()
  const offlineCache = enableOfflineCache ? getGlobalOfflineCache() : null

  // 检测 WebP 支持
  await webpDetector.detect()

  // H5 平台特殊处理
  let h5Optimizer: H5Optimizer | null = null

  // #ifdef H5
  h5Optimizer = getGlobalH5Optimizer({
    enableNativeLazyLoad: true,
    enableWebPAutoDetect: true,
    preloadCriticalImages: true
  })

  if (import.meta.env.DEV) {
    const recommendations = h5Optimizer.getOptimizationRecommendations()
    if (recommendations.length > 0) {
      console.log('[ImageLoader] H5 Optimization recommendations:', recommendations)
    }
  }
  // #endif

  if (enableMonitoring) {
    // 启动内存监控
    memoryManager.start()
    memoryManager.setupVisibilityListener()
    memoryManager.setupMemoryWarningListener()
  }

  if (import.meta.env.DEV) {
    const logData: any = {
      ...options,
      webpSupported: webpDetector.isSupported(),
      networkType: networkDetector.getNetworkInfo().type
    }

    // #ifdef H5
    logData.platform = 'H5'
    logData.nativeLazyLoad = h5Optimizer?.isNativeLazyLoadSupported()
    // #endif

    console.log('[ImageLoader] Initialized with options:', logData)
  }

  return {
    observer,
    queue,
    cache,
    memoryManager,
    performanceMonitor,
    networkDetector,
    webpDetector,
    offlineCache
  }
}

/**
 * 清理所有图片加载相关资源
 */
export function cleanupImageLoader() {
  destroyGlobalObserver()
  destroyGlobalImageQueue()
  destroyGlobalImageCache()
  destroyGlobalMemoryManager()
  destroyGlobalPerformanceMonitor()
  destroyGlobalNetworkDetector()
  destroyGlobalWebPDetector()
  destroyGlobalOfflineCache()

  // #ifdef H5
  destroyGlobalH5Optimizer()
  // #endif

  if (import.meta.env.DEV) {
    console.log('[ImageLoader] Cleaned up all resources')
  }
}
