/**
 * 性能监控模块
 * 监控图片加载性能和用户体验指标
 */

export interface PerformanceMetrics {
  // 图片加载指标
  imageLoadSuccess: number // 成功加载的图片数
  imageLoadFailed: number // 失败的图片数
  imageLoadTotal: number // 总加载次数
  imageLoadSuccessRate: number // 成功率
  imageLoadAvgTime: number // 平均加载时间（ms）
  cacheHitCount: number // 缓存命中次数
  cacheHitRate: number // 缓存命中率

  // 内存指标
  currentMemory: number // 当前内存占用（字节）
  peakMemory: number // 峰值内存占用
  memoryReleaseCount: number // 内存释放次数
  memoryWarningCount: number // 内存警告次数

  // 用户体验指标
  firstImageTime?: number // 首张图片加载时间
  firstScreenImageCount?: number // 首屏图片数量
  firstScreenLoadTime?: number // 首屏加载时间

  // 时间戳
  timestamp: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    imageLoadSuccess: 0,
    imageLoadFailed: 0,
    imageLoadTotal: 0,
    imageLoadSuccessRate: 0,
    imageLoadAvgTime: 0,
    cacheHitCount: 0,
    cacheHitRate: 0,
    currentMemory: 0,
    peakMemory: 0,
    memoryReleaseCount: 0,
    memoryWarningCount: 0,
    timestamp: Date.now()
  }

  private loadTimes: number[] = [] // 记录每次加载时间
  private maxLoadTimesSize: number = 100 // 最多保留最近 100 次加载时间
  private firstImageLoaded: boolean = false
  private sessionStartTime: number = Date.now()

  /**
   * 记录图片加载成功
   */
  recordImageLoadSuccess(loadTime: number, fromCache: boolean = false) {
    this.metrics.imageLoadSuccess++
    this.metrics.imageLoadTotal++

    // 只记录非缓存的加载时间
    if (!fromCache) {
      this.loadTimes.push(loadTime)

      // 限制数组大小，保留最近的记录
      if (this.loadTimes.length > this.maxLoadTimesSize) {
        this.loadTimes.shift()
      }
    }

    if (fromCache) {
      this.metrics.cacheHitCount++
    }

    // 记录首张图片加载时间
    if (!this.firstImageLoaded) {
      this.metrics.firstImageTime = Date.now() - this.sessionStartTime
      this.firstImageLoaded = true
    }

    this.updateMetrics()
  }

  /**
   * 记录图片加载失败
   */
  recordImageLoadFailed() {
    this.metrics.imageLoadFailed++
    this.metrics.imageLoadTotal++
    this.updateMetrics()
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit() {
    this.metrics.cacheHitCount++
    this.metrics.imageLoadTotal++
    this.metrics.imageLoadSuccess++
    this.updateMetrics()
  }

  /**
   * 更新内存指标
   */
  updateMemoryMetrics(currentMemory: number) {
    this.metrics.currentMemory = currentMemory
    if (currentMemory > this.metrics.peakMemory) {
      this.metrics.peakMemory = currentMemory
    }
  }

  /**
   * 记录内存释放
   */
  recordMemoryRelease() {
    this.metrics.memoryReleaseCount++
  }

  /**
   * 记录内存警告
   */
  recordMemoryWarning() {
    this.metrics.memoryWarningCount++
  }

  /**
   * 设置首屏指标
   */
  setFirstScreenMetrics(imageCount: number, loadTime: number) {
    this.metrics.firstScreenImageCount = imageCount
    this.metrics.firstScreenLoadTime = loadTime
  }

  /**
   * 更新计算指标
   */
  private updateMetrics() {
    // 计算成功率
    if (this.metrics.imageLoadTotal > 0) {
      this.metrics.imageLoadSuccessRate =
        (this.metrics.imageLoadSuccess / this.metrics.imageLoadTotal) * 100
    }

    // 计算平均加载时间
    if (this.loadTimes.length > 0) {
      const sum = this.loadTimes.reduce((a, b) => a + b, 0)
      this.metrics.imageLoadAvgTime = sum / this.loadTimes.length
    }

    // 计算缓存命中率
    if (this.metrics.imageLoadTotal > 0) {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitCount / this.metrics.imageLoadTotal) * 100
    }

    this.metrics.timestamp = Date.now()
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      imageLoadSuccess: 0,
      imageLoadFailed: 0,
      imageLoadTotal: 0,
      imageLoadSuccessRate: 0,
      imageLoadAvgTime: 0,
      cacheHitCount: 0,
      cacheHitRate: 0,
      currentMemory: 0,
      peakMemory: 0,
      memoryReleaseCount: 0,
      memoryWarningCount: 0,
      timestamp: Date.now()
    }
    this.loadTimes = []
    this.firstImageLoaded = false
    this.sessionStartTime = Date.now()
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const m = this.metrics
    return `
=== 图片加载性能报告 ===
加载统计:
  - 总加载次数: ${m.imageLoadTotal}
  - 成功: ${m.imageLoadSuccess} (${m.imageLoadSuccessRate.toFixed(2)}%)
  - 失败: ${m.imageLoadFailed}
  - 平均加载时间: ${m.imageLoadAvgTime.toFixed(2)}ms

缓存统计:
  - 缓存命中: ${m.cacheHitCount}
  - 命中率: ${m.cacheHitRate.toFixed(2)}%

内存统计:
  - 当前内存: ${(m.currentMemory / 1024 / 1024).toFixed(2)}MB
  - 峰值内存: ${(m.peakMemory / 1024 / 1024).toFixed(2)}MB
  - 释放次数: ${m.memoryReleaseCount}
  - 警告次数: ${m.memoryWarningCount}

用户体验:
  - 首张图片加载: ${m.firstImageTime || 'N/A'}ms
  - 首屏图片数量: ${m.firstScreenImageCount || 'N/A'}
  - 首屏加载时间: ${m.firstScreenLoadTime || 'N/A'}ms
========================
    `.trim()
  }

  /**
   * 上报性能数据
   */
  async report(endpoint?: string) {
    const metrics = this.getMetrics()

    console.log('[PerformanceMonitor] Reporting metrics:', metrics)

    // TODO: 实际项目中应该上报到后端
    if (endpoint) {
      try {
        await uni.request({
          url: endpoint,
          method: 'POST',
          data: {
            type: 'image_performance',
            metrics,
            userAgent: uni.getSystemInfoSync().platform,
            timestamp: Date.now()
          }
        })
        console.log('[PerformanceMonitor] Report sent successfully')
      } catch (error) {
        console.error('[PerformanceMonitor] Report failed:', error)
      }
    }

    return metrics
  }
}

// 全局单例
let globalMonitor: PerformanceMonitor | null = null

/**
 * 获取全局性能监控器
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor()
  }
  return globalMonitor
}

/**
 * 销毁全局性能监控器
 */
export function destroyGlobalPerformanceMonitor() {
  if (globalMonitor) {
    globalMonitor.reset()
    globalMonitor = null
  }
}
