/**
 * 离线缓存工具
 * 使用 uni.storage 持久化图片缓存
 */

export interface PersistentCacheItem {
  url: string
  base64: string // 图片的 base64 数据
  width?: number
  height?: number
  size: number
  timestamp: number
  lastAccess: number
}

export class OfflineCache {
  private cacheKeyPrefix = 'img_cache_'
  private indexKey = 'img_cache_index'
  private maxSize: number = 10 * 1024 * 1024 // 10MB
  private maxCount: number = 20 // 最多缓存 20 张图片

  /**
   * 获取缓存索引
   */
  private async getIndex(): Promise<string[]> {
    try {
      const index = uni.getStorageSync(this.indexKey)
      return index ? JSON.parse(index) : []
    } catch (error) {
      console.error('[OfflineCache] Failed to get index:', error)
      return []
    }
  }

  /**
   * 保存缓存索引
   */
  private async saveIndex(urls: string[]) {
    try {
      uni.setStorageSync(this.indexKey, JSON.stringify(urls))
    } catch (error) {
      console.error('[OfflineCache] Failed to save index:', error)
    }
  }

  /**
   * 获取缓存
   */
  async get(url: string): Promise<PersistentCacheItem | null> {
    try {
      const key = this.cacheKeyPrefix + this.hashUrl(url)
      const data = uni.getStorageSync(key)

      if (data) {
        try {
          const item: PersistentCacheItem = JSON.parse(data)

          // 验证数据完整性
          if (!item.url || !item.base64 || !item.timestamp) {
            console.warn('[OfflineCache] Invalid cache data, removing:', url)
            await this.delete(url)
            return null
          }

          // 更新最后访问时间
          item.lastAccess = Date.now()
          uni.setStorageSync(key, JSON.stringify(item))

          return item
        } catch (parseError) {
          console.error('[OfflineCache] Failed to parse cache data:', parseError)
          // 删除损坏的缓存
          await this.delete(url)
          return null
        }
      }

      return null
    } catch (error) {
      console.error('[OfflineCache] Failed to get cache:', error)
      return null
    }
  }

  /**
   * 设置缓存
   */
  async set(url: string, base64: string, metadata: Partial<PersistentCacheItem> = {}) {
    try {
      const key = this.cacheKeyPrefix + this.hashUrl(url)
      const size = this.estimateBase64Size(base64)

      // 检查大小限制
      if (size > 1024 * 1024) {
        console.warn('[OfflineCache] Image too large to cache:', url, size)
        return
      }

      const item: PersistentCacheItem = {
        url,
        base64,
        width: metadata.width,
        height: metadata.height,
        size,
        timestamp: Date.now(),
        lastAccess: Date.now()
      }

      // 获取当前索引
      const index = await this.getIndex()

      // 检查是否需要清理
      if (index.length >= this.maxCount) {
        await this.evictLRU(index)
      }

      // 保存缓存
      try {
        uni.setStorageSync(key, JSON.stringify(item))
      } catch (storageError) {
        console.error('[OfflineCache] Storage quota exceeded, clearing old cache')
        // 存储空间不足，清理一半缓存
        const toRemove = Math.ceil(index.length / 2)
        for (let i = 0; i < toRemove; i++) {
          await this.delete(index[i])
        }
        // 重试保存
        uni.setStorageSync(key, JSON.stringify(item))
      }

      // 更新索引
      if (!index.includes(url)) {
        index.push(url)
        await this.saveIndex(index)
      }

      if (import.meta.env.DEV) {
        console.log(`[OfflineCache] Cached ${url}, size: ${(size / 1024).toFixed(2)}KB`)
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to set cache:', error)
    }
  }

  /**
   * 检查是否已缓存
   */
  async has(url: string): Promise<boolean> {
    try {
      const key = this.cacheKeyPrefix + this.hashUrl(url)
      const data = uni.getStorageSync(key)
      return !!data
    } catch (error) {
      return false
    }
  }

  /**
   * 删除缓存
   */
  async delete(url: string) {
    try {
      const key = this.cacheKeyPrefix + this.hashUrl(url)
      uni.removeStorageSync(key)

      // 更新索引
      const index = await this.getIndex()
      const newIndex = index.filter(u => u !== url)
      await this.saveIndex(newIndex)

      if (import.meta.env.DEV) {
        console.log('[OfflineCache] Deleted:', url)
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to delete cache:', error)
    }
  }

  /**
   * 淘汰最久未使用的缓存
   */
  private async evictLRU(index: string[]) {
    // 获取所有缓存项的访问时间
    const items: Array<{ url: string; lastAccess: number }> = []

    for (const url of index) {
      const item = await this.get(url)
      if (item) {
        items.push({ url, lastAccess: item.lastAccess })
      }
    }

    // 按访问时间排序
    items.sort((a, b) => a.lastAccess - b.lastAccess)

    // 删除最久未使用的
    if (items.length > 0) {
      await this.delete(items[0].url)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    try {
      const index = await this.getIndex()

      for (const url of index) {
        const key = this.cacheKeyPrefix + this.hashUrl(url)
        uni.removeStorageSync(key)
      }

      uni.removeStorageSync(this.indexKey)

      if (import.meta.env.DEV) {
        console.log('[OfflineCache] Cleared all cache')
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to clear cache:', error)
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats() {
    const index = await this.getIndex()
    let totalSize = 0

    for (const url of index) {
      const item = await this.get(url)
      if (item) {
        totalSize += item.size
      }
    }

    return {
      count: index.length,
      maxCount: this.maxCount,
      totalSize,
      maxSize: this.maxSize,
      usage: (totalSize / this.maxSize * 100).toFixed(2) + '%'
    }
  }

  /**
   * URL 哈希（简单实现）
   */
  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 估算 base64 大小
   */
  private estimateBase64Size(base64: string): number {
    // base64 编码后大小约为原始大小的 4/3
    return Math.floor(base64.length * 0.75)
  }
}

// 全局单例
let globalCache: OfflineCache | null = null

/**
 * 获取全局离线缓存
 */
export function getGlobalOfflineCache(): OfflineCache {
  if (!globalCache) {
    globalCache = new OfflineCache()
  }
  return globalCache
}

/**
 * 销毁全局离线缓存
 */
export function destroyGlobalOfflineCache() {
  if (globalCache) {
    globalCache = null
  }
}
