/**
 * 数据缓存管理
 * 用于缓存推荐流、用户信息、话题列表等数据
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expireTime: number; // 过期时间（毫秒）
}

export interface CacheOptions {
  expireTime?: number; // 默认过期时间（毫秒）
  maxSize?: number; // 最大缓存条目数
}

/**
 * 内存缓存管理器
 */
export class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.options = {
      expireTime: options.expireTime || 5 * 60 * 1000, // 默认5分钟
      maxSize: options.maxSize || 100,
    };
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, expireTime?: number): void {
    // 检查缓存大小，超过限制则清理最旧的数据
    if (this.cache.size >= this.options.maxSize) {
      this.clearOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expireTime: expireTime || this.options.expireTime,
    };

    this.cache.set(key, item);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > item.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.expireTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * 清理最旧的缓存
   */
  private clearOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * 本地存储缓存管理器（持久化）
 */
export class StorageCache {
  private prefix: string;
  private options: Required<CacheOptions>;

  constructor(prefix: string = 'cache_', options: CacheOptions = {}) {
    this.prefix = prefix;
    this.options = {
      expireTime: options.expireTime || 30 * 60 * 1000, // 默认30分钟
      maxSize: options.maxSize || 50,
    };
  }

  /**
   * 生成缓存键
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, expireTime?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expireTime: expireTime || this.options.expireTime,
    };

    try {
      uni.setStorageSync(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.error('Storage cache set error:', error);
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    try {
      const itemStr = uni.getStorageSync(this.getKey(key));
      if (!itemStr) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(itemStr);

      // 检查是否过期
      const now = Date.now();
      if (now - item.timestamp > item.expireTime) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Storage cache get error:', error);
      return null;
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    try {
      uni.removeStorageSync(this.getKey(key));
    } catch (error) {
      console.error('Storage cache delete error:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      const info = uni.getStorageInfoSync();
      info.keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          uni.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.error('Storage cache clear error:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpired(): void {
    try {
      const info = uni.getStorageInfoSync();
      const now = Date.now();

      info.keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const itemStr = uni.getStorageSync(key);
          if (itemStr) {
            try {
              const item: CacheItem<any> = JSON.parse(itemStr);
              if (now - item.timestamp > item.expireTime) {
                uni.removeStorageSync(key);
              }
            } catch (e) {
              // 解析失败，删除该缓存
              uni.removeStorageSync(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Storage cache clearExpired error:', error);
    }
  }
}

/**
 * 缓存管理器工厂
 */
export class CacheManager {
  private static memoryCache: MemoryCache;
  private static storageCache: StorageCache;

  /**
   * 获取内存缓存实例
   */
  static getMemoryCache(): MemoryCache {
    if (!this.memoryCache) {
      this.memoryCache = new MemoryCache({
        expireTime: 5 * 60 * 1000, // 5分钟
        maxSize: 100,
      });
    }
    return this.memoryCache;
  }

  /**
   * 获取本地存储缓存实例
   */
  static getStorageCache(): StorageCache {
    if (!this.storageCache) {
      this.storageCache = new StorageCache('app_cache_', {
        expireTime: 30 * 60 * 1000, // 30分钟
        maxSize: 50,
      });
    }
    return this.storageCache;
  }

  /**
   * 清理所有过期缓存
   */
  static clearAllExpired(): void {
    this.getMemoryCache().clearExpired();
    this.getStorageCache().clearExpired();
  }

  /**
   * 清空所有缓存
   */
  static clearAll(): void {
    this.getMemoryCache().clear();
    this.getStorageCache().clear();
  }
}

/**
 * 缓存键常量
 */
export const CACHE_KEYS = {
  // 推荐流缓存
  RECOMMENDATION_FEED: (page: number) => `recommendation_feed_${page}`,
  // Banner缓存
  BANNERS: 'banners',
  // 话题列表缓存
  TOPICS: (page: number) => `topics_${page}`,
  // 用户信息缓存
  USER_INFO: (userId: number) => `user_info_${userId}`,
  // 用户兴趣标签缓存
  USER_INTERESTS: 'user_interests',
  // 用户位置缓存
  USER_LOCATION: 'user_location',
  // 推荐配置缓存
  RECOMMENDATION_CONFIG: 'recommendation_config',
};

/**
 * 缓存过期时间常量（毫秒）
 */
export const CACHE_EXPIRE_TIME = {
  // 推荐流：5分钟
  RECOMMENDATION_FEED: 5 * 60 * 1000,
  // Banner：10分钟
  BANNERS: 10 * 60 * 1000,
  // 话题列表：10分钟
  TOPICS: 10 * 60 * 1000,
  // 用户信息：30分钟
  USER_INFO: 30 * 60 * 1000,
  // 用户兴趣：1小时
  USER_INTERESTS: 60 * 60 * 1000,
  // 用户位置：5分钟
  USER_LOCATION: 5 * 60 * 1000,
  // 推荐配置：1小时
  RECOMMENDATION_CONFIG: 60 * 60 * 1000,
};
