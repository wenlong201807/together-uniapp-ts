/**
 * 内存管理器
 * 监控内存使用，自动释放离屏图片
 */

import { getGlobalImageCache } from './ImageCache'

export interface MemoryStats {
  cacheCount: number
  cacheSize: number
  maxMemory: number
  memoryUsage: string
  timestamp: number
}

export class MemoryManager {
  private memoryThreshold: number = 30 * 1024 * 1024 // 30MB
  private checkInterval: number = 10 * 1000 // 10秒检查一次
  private timer: number | null = null
  private onWarning?: (stats: MemoryStats) => void

  constructor(options: {
    memoryThreshold?: number
    checkInterval?: number
    onWarning?: (stats: MemoryStats) => void
  } = {}) {
    this.memoryThreshold = options.memoryThreshold || this.memoryThreshold
    this.checkInterval = options.checkInterval || this.checkInterval
    this.onWarning = options.onWarning
  }

  /**
   * 开始监控
   */
  start() {
    if (this.timer) {
      if (import.meta.env.DEV) {
        console.warn('[MemoryManager] Already started')
      }
      return
    }

    if (import.meta.env.DEV) {
      console.log('[MemoryManager] Started monitoring')
    }
    this.timer = setInterval(() => {
      this.check()
    }, this.checkInterval) as unknown as number
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      if (import.meta.env.DEV) {
        console.log('[MemoryManager] Stopped monitoring')
      }
    }
  }

  /**
   * 检查内存使用
   */
  private check() {
    const cache = getGlobalImageCache()
    const stats = cache.getStats()

    const memoryStats: MemoryStats = {
      cacheCount: stats.count,
      cacheSize: stats.totalSize,
      maxMemory: stats.maxMemory,
      memoryUsage: stats.memoryUsage,
      timestamp: Date.now()
    }

    // 检查是否超过阈值
    if (stats.totalSize > this.memoryThreshold) {
      if (import.meta.env.DEV) {
        console.warn('[MemoryManager] Memory threshold exceeded:', memoryStats)
      }

      // 触发警告回调
      if (this.onWarning) {
        this.onWarning(memoryStats)
      }

      // 自动清理过期缓存
      this.autoCleanup()
    }
  }

  /**
   * 自动清理
   */
  private autoCleanup() {
    const cache = getGlobalImageCache()

    // 1. 清理超过 30 分钟未访问的图片
    const expiredCount = cache.clearExpired(30 * 60 * 1000)

    if (expiredCount > 0 && import.meta.env.DEV) {
      console.log(`[MemoryManager] Auto cleanup: removed ${expiredCount} expired images`)
    }

    // 2. 如果还是超过阈值，强制清理最久未使用的 20%
    const stats = cache.getStats()
    if (stats.totalSize > this.memoryThreshold) {
      const toRemove = Math.ceil(stats.count * 0.2)
      const removed = cache.evictN(toRemove)
      if (import.meta.env.DEV) {
        console.log(`[MemoryManager] Force cleanup: removed ${removed} images`)
      }
    }
  }

  /**
   * 手动触发清理
   */
  cleanup() {
    this.autoCleanup()
  }

  /**
   * 获取当前内存状态
   */
  getStats(): MemoryStats {
    const cache = getGlobalImageCache()
    const stats = cache.getStats()

    return {
      cacheCount: stats.count,
      cacheSize: stats.totalSize,
      maxMemory: stats.maxMemory,
      memoryUsage: stats.memoryUsage,
      timestamp: Date.now()
    }
  }

  /**
   * 监听页面可见性变化
   */
  setupVisibilityListener() {
    // uni-app 的页面生命周期
    // 在页面隐藏时清理缓存并停止监控
    uni.onAppHide(() => {
      if (import.meta.env.DEV) {
        console.log('[MemoryManager] App hidden, cleaning up and stopping')
      }
      this.autoCleanup()
      this.stop()
    })

    uni.onAppShow(() => {
      if (import.meta.env.DEV) {
        console.log('[MemoryManager] App shown, restarting monitoring')
      }
      this.start()
    })
  }

  /**
   * 监听内存警告
   */
  setupMemoryWarningListener() {
    // H5 平台不支持 uni.onMemoryWarning
    // #ifdef H5
    if (import.meta.env.DEV) {
      console.log('[MemoryManager] Memory warning listener not supported on H5')
    }
    return
    // #endif

    // #ifndef H5
    // 检查 API 是否存在
    if (typeof uni.onMemoryWarning !== 'function') {
      if (import.meta.env.DEV) {
        console.warn('[MemoryManager] uni.onMemoryWarning not supported on this platform')
      }
      return
    }

    // uni-app 的内存警告事件
    uni.onMemoryWarning((res: any) => {
      console.error('[MemoryManager] Memory warning:', res.level)

      // 立即清理
      const cache = getGlobalImageCache()

      if (res.level === 10) {
        // 严重警告，清理 50%
        const urls = cache.getUrls()
        const toRemove = Math.ceil(urls.length * 0.5)
        for (let i = 0; i < toRemove; i++) {
          cache.delete(urls[i])
        }
        if (import.meta.env.DEV) {
          console.log(`[MemoryManager] Critical warning: removed ${toRemove} images`)
        }
      } else if (res.level === 5) {
        // 中等警告，清理 30%
        const urls = cache.getUrls()
        const toRemove = Math.ceil(urls.length * 0.3)
        for (let i = 0; i < toRemove; i++) {
          cache.delete(urls[i])
        }
        if (import.meta.env.DEV) {
          console.log(`[MemoryManager] Medium warning: removed ${toRemove} images`)
        }
      } else {
        // 轻微警告，清理过期
        this.autoCleanup()
      }
    })
    // #endif
  }
}

// 全局单例
let globalManager: MemoryManager | null = null

/**
 * 获取全局内存管理器
 */
export function getGlobalMemoryManager(options?: {
  memoryThreshold?: number
  checkInterval?: number
  onWarning?: (stats: MemoryStats) => void
}): MemoryManager {
  if (!globalManager) {
    globalManager = new MemoryManager(options)
  }
  return globalManager
}

/**
 * 销毁全局内存管理器
 */
export function destroyGlobalMemoryManager() {
  if (globalManager) {
    globalManager.stop()
    globalManager = null
  }
}
