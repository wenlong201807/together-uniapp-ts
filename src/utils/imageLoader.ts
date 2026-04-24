/**
 * 图片懒加载和预加载管理
 */

import { ref, onMounted } from 'vue';

export interface ImageLoadOptions {
  placeholder?: string; // 占位图
  errorImage?: string; // 错误图片
  threshold?: number; // 预加载阈值（像素）
  retryTimes?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
}

export interface ImageItem {
  src: string;
  loaded: boolean;
  loading: boolean;
  error: boolean;
  retryCount: number;
}

/**
 * 图片加载管理器
 */
export class ImageLoader {
  private images: Map<string, ImageItem>;
  private options: Required<ImageLoadOptions>;
  private loadingQueue: string[];
  private maxConcurrent: number;
  private currentLoading: number;

  constructor(options: ImageLoadOptions = {}) {
    this.images = new Map();
    this.options = {
      placeholder: options.placeholder || '',
      errorImage: options.errorImage || '',
      threshold: options.threshold || 500,
      retryTimes: options.retryTimes || 3,
      retryDelay: options.retryDelay || 1000,
    };
    this.loadingQueue = [];
    this.maxConcurrent = 3; // 最大并发加载数
    this.currentLoading = 0;
  }

  /**
   * 预加载图片
   */
  async preload(src: string): Promise<void> {
    if (!src) return;

    // 检查是否已加载
    const item = this.images.get(src);
    if (item?.loaded) {
      return;
    }

    // 检查是否正在加载
    if (item?.loading) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const currentItem = this.images.get(src);
          if (currentItem?.loaded) {
            clearInterval(checkInterval);
            resolve();
          } else if (currentItem?.error) {
            clearInterval(checkInterval);
            reject(new Error('Image load failed'));
          }
        }, 100);
      });
    }

    // 添加到加载队列
    this.loadingQueue.push(src);
    this.processQueue();
  }

  /**
   * 批量预加载图片
   */
  async preloadBatch(srcs: string[]): Promise<void> {
    const promises = srcs.map((src) => this.preload(src));
    await Promise.allSettled(promises);
  }

  /**
   * 处理加载队列
   */
  private async processQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.currentLoading < this.maxConcurrent) {
      const src = this.loadingQueue.shift();
      if (src) {
        this.currentLoading++;
        this.loadImage(src).finally(() => {
          this.currentLoading--;
          this.processQueue();
        });
      }
    }
  }

  /**
   * 加载单张图片
   */
  private async loadImage(src: string, retryCount: number = 0): Promise<void> {
    // 初始化图片项
    if (!this.images.has(src)) {
      this.images.set(src, {
        src,
        loaded: false,
        loading: true,
        error: false,
        retryCount: 0,
      });
    }

    const item = this.images.get(src)!;
    item.loading = true;
    item.error = false;

    try {
      // 使用 uni.getImageInfo 预加载图片
      await new Promise<void>((resolve, reject) => {
        uni.getImageInfo({
          src,
          success: () => {
            item.loaded = true;
            item.loading = false;
            item.error = false;
            resolve();
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    } catch (error) {
      console.error(`Image load failed: ${src}`, error);

      // 重试逻辑
      if (retryCount < this.options.retryTimes) {
        await new Promise((resolve) => setTimeout(resolve, this.options.retryDelay));
        return this.loadImage(src, retryCount + 1);
      }

      // 重试失败
      item.loaded = false;
      item.loading = false;
      item.error = true;
      item.retryCount = retryCount;
    }
  }

  /**
   * 获取图片状态
   */
  getImageStatus(src: string): ImageItem | null {
    return this.images.get(src) || null;
  }

  /**
   * 清除图片缓存
   */
  clear(): void {
    this.images.clear();
    this.loadingQueue = [];
  }

  /**
   * 获取当前加载队列长度
   */
  getQueueLength(): number {
    return this.loadingQueue.length;
  }
}

/**
 * 全局图片加载器实例
 */
let globalImageLoader: ImageLoader | null = null;

/**
 * 获取全局图片加载器
 */
export function getImageLoader(): ImageLoader {
  if (!globalImageLoader) {
    globalImageLoader = new ImageLoader();
  }
  return globalImageLoader;
}

/**
 * 图片懒加载 Composable
 */
export function useImageLazyLoad(options: ImageLoadOptions = {}) {
  const loader = getImageLoader();

  /**
   * 预加载图片
   */
  const preloadImage = async (src: string) => {
    if (!src) return;
    await loader.preload(src);
  };

  /**
   * 批量预加载图片
   */
  const preloadImages = async (srcs: string[]) => {
    await loader.preloadBatch(srcs);
  };

  /**
   * 获取图片显示源（考虑占位图和错误图）
   */
  const getImageSrc = (src: string): string => {
    if (!src) return options.placeholder || '';

    const status = loader.getImageStatus(src);
    if (!status) {
      // 未加载，返回占位图
      return options.placeholder || src;
    }

    if (status.error) {
      // 加载失败，返回错误图
      return options.errorImage || options.placeholder || src;
    }

    if (status.loaded) {
      // 已加载，返回原图
      return src;
    }

    // 正在加载，返回占位图
    return options.placeholder || src;
  };

  return {
    preloadImage,
    preloadImages,
    getImageSrc,
  };
}

/**
 * 渐进式图片加载
 * 先加载模糊图，再加载高清图
 */
export interface ProgressiveImageOptions {
  lowQualitySrc: string; // 低质量图片URL
  highQualitySrc: string; // 高质量图片URL
  placeholder?: string; // 占位图
}

export function useProgressiveImage(options: ProgressiveImageOptions) {
  const { lowQualitySrc, highQualitySrc, placeholder } = options;
  const loader = getImageLoader();

  const currentSrc = ref(placeholder || lowQualitySrc);
  const isHighQualityLoaded = ref(false);

  onMounted(async () => {
    // 先加载低质量图
    if (lowQualitySrc) {
      await loader.preload(lowQualitySrc);
      currentSrc.value = lowQualitySrc;
    }

    // 再加载高质量图
    if (highQualitySrc) {
      await loader.preload(highQualitySrc);
      currentSrc.value = highQualitySrc;
      isHighQualityLoaded.value = true;
    }
  });

  return {
    currentSrc,
    isHighQualityLoaded,
  };
}

/**
 * 图片预加载策略
 */
export class ImagePreloadStrategy {
  private loader: ImageLoader;

  constructor() {
    this.loader = getImageLoader();
  }

  /**
   * 预加载下一页的图片
   * @param items 推荐项列表
   * @param currentIndex 当前索引
   * @param preloadCount 预加载数量
   */
  async preloadNextPage(items: any[], currentIndex: number, preloadCount: number = 3): Promise<void> {
    const startIndex = currentIndex + 1;
    const endIndex = Math.min(startIndex + preloadCount, items.length);

    const imagesToPreload: string[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      if (item.data?.user?.avatar) {
        imagesToPreload.push(item.data.user.avatar);
      }
      if (item.data?.user?.photos) {
        imagesToPreload.push(...item.data.user.photos.slice(0, 3));
      }
      if (item.data?.coverImages) {
        imagesToPreload.push(...item.data.coverImages.slice(0, 3));
      }
    }

    await this.loader.preloadBatch(imagesToPreload);
  }

  /**
   * 预加载可视区域附近的图片
   * @param items 推荐项列表
   * @param visibleIndexes 可视区域索引
   * @param threshold 阈值（前后预加载的数量）
   */
  async preloadNearbyImages(items: any[], visibleIndexes: number[], threshold: number = 2): Promise<void> {
    if (visibleIndexes.length === 0) return;

    const minIndex = Math.max(0, Math.min(...visibleIndexes) - threshold);
    const maxIndex = Math.min(items.length - 1, Math.max(...visibleIndexes) + threshold);

    const imagesToPreload: string[] = [];

    for (let i = minIndex; i <= maxIndex; i++) {
      const item = items[i];
      if (item.data?.user?.avatar) {
        imagesToPreload.push(item.data.user.avatar);
      }
      if (item.data?.user?.photos) {
        imagesToPreload.push(...item.data.user.photos.slice(0, 3));
      }
      if (item.data?.coverImages) {
        imagesToPreload.push(...item.data.coverImages.slice(0, 3));
      }
    }

    await this.loader.preloadBatch(imagesToPreload);
  }
}
