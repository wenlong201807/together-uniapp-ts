/**
 * 图片 LRU 缓存管理器
 * 最多缓存 50 张图片，按 LRU 策略淘汰
 */

export interface CachedImage {
  url: string
  width?: number
  height?: number
  size?: number // 图片大小（字节）
  timestamp: number // 缓存时间
  lastAccess: number // 最后访问时间
}

export class ImageLRUCache {
  private cache: Map<string, CachedImage> = new Map()
  private maxSize: number
  private totalSize: number = 0 // 总缓存大小（字节）
  private maxMemory: number = 30 * 1024 * 1024 // 30MB
  private hitCount: number = 0 // 命中次数
  private missCount: number = 0 // 未命中次数

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize
  }

  /**
   * 获取缓存的图片
   */
  get(url: string): CachedImage | undefined {
    const cached = this.cache.get(url)
    if (cached) {
      this.hitCount++

      // 更新最后访问时间
      cached.lastAccess = Date.now()

      // 移到 Map 末尾（最近使用）- Map 保持插入顺序
      this.cache.delete(url)
      this.cache.set(url, cached)

      return cached
    }
    this.missCount++
    return undefined
  }

  /**
   * 设置缓存
   */
  set(url: string, imageInfo: Partial<CachedImage> = {}) {
    const now = Date.now()

    // 如果已存在，先删除旧的
    if (this.cache.has(url)) {
      const old = this.cache.get(url)!
      this.totalSize -= old.size || 0
      this.cache.delete(url)
    }

    const cached: CachedImage = {
      url,
      width: imageInfo.width,
      height: imageInfo.height,
      size: imageInfo.size || this.estimateImageSize(imageInfo.width, imageInfo.height),
      timestamp: now,
      lastAccess: now
    }

    // 检查是否超过数量限制
    while (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    // 检查是否超过内存限制
    while (this.totalSize + cached.size! > this.maxMemory && this.cache.size > 0) {
      this.evictLRU()
    }

    // 添加到缓存
    this.cache.set(url, cached)
    this.totalSize += cached.size || 0

    console.log(`[ImageCache] Cached ${url}, total: ${this.cache.size}/${this.maxSize}, memory: ${(this.totalSize / 1024 / 1024).toFixed(2)}MB`)
  }

  /**
   * 检查是否已缓存
   */
  has(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * 删除缓存
   */
  delete(url: string): boolean {
    const cached = this.cache.get(url)
    if (cached) {
      this.totalSize -= cached.size || 0
      this.cache.delete(url)
      console.log(`[ImageCache] Deleted ${url}`)
      return true
    }
    return false
  }

  /**
   * 淘汰最久未使用的图片（LRU）
   */
  private evictLRU() {
    // Map 的迭代顺序是插入顺序，第一个就是最久未使用的
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      const cached = this.cache.get(firstKey)!
      this.totalSize -= cached.size || 0
      this.cache.delete(firstKey)
      console.log(`[ImageCache] Evicted LRU: ${firstKey}`)
    }
  }

  /**
   * 估算图片大小（字节）
   */
  private estimateImageSize(width?: number, height?: number): number {
    if (!width || !height) {
      // 默认估算 400x400 的图片约 30KB（WebP/JPG 压缩后）
      return 30 * 1024
    }
    // 粗略估算：width * height * 4 (RGBA) * 0.08 (WebP/JPG 压缩率)
    return Math.floor(width * height * 4 * 0.08)
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear()
    this.totalSize = 0
    console.log('[ImageCache] Cleared all cache')
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.hitCount + this.missCount
    return {
      count: this.cache.size,
      maxSize: this.maxSize,
      totalSize: this.totalSize,
      maxMemory: this.maxMemory,
      memoryUsage: (this.totalSize / this.maxMemory * 100).toFixed(2) + '%',
      hitRate: total > 0 ? ((this.hitCount / total) * 100).toFixed(2) + '%' : '0%'
    }
  }

  /**
   * 获取所有缓存的 URL
   */
  getUrls(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 批量淘汰 N 个最久未使用的图片
   */
  evictN(count: number): number {
    let evicted = 0
    const urls = Array.from(this.cache.keys())

    for (let i = 0; i < count && i < urls.length; i++) {
      const url = urls[i]
      const cached = this.cache.get(url)
      if (cached) {
        this.totalSize -= cached.size || 0
        this.cache.delete(url)
        evicted++
      }
    }

    if (evicted > 0) {
      console.log(`[ImageCache] Evicted ${evicted} images`)
    }

    return evicted
  }

  /**
   * 清理过期缓存（超过指定时间未访问）
   */
  clearExpired(maxAge: number = 30 * 60 * 1000) {
    const now = Date.now()
    const toDelete: string[] = []

    this.cache.forEach((cached, url) => {
      if (now - cached.lastAccess > maxAge) {
        toDelete.push(url)
      }
    })

    toDelete.forEach(url => this.delete(url))

    if (toDelete.length > 0) {
      console.log(`[ImageCache] Cleared ${toDelete.length} expired images`)
    }

    return toDelete.length
  }
}

// 全局单例
let globalCache: ImageLRUCache | null = null

/**
 * 获取全局图片缓存
 */
export function getGlobalImageCache(maxSize: number = 50): ImageLRUCache {
  if (!globalCache) {
    globalCache = new ImageLRUCache(maxSize)
  }
  return globalCache
}

/**
 * 销毁全局图片缓存
 */
export function destroyGlobalImageCache() {
  if (globalCache) {
    globalCache.clear()
    globalCache = null
  }
}
