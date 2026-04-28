<template>
  <view
    :id="elementId"
    class="lazy-image-container"
    :style="containerStyle"
  >
    <!-- 占位符 -->
    <image
      v-if="imageState === ImageState.IDLE || imageState === ImageState.LOADING"
      class="lazy-image-placeholder"
      :src="placeholder"
      mode="aspectFill"
      :style="imageStyle"
    />

    <!-- 加载中骨架屏 -->
    <view
      v-if="imageState === ImageState.LOADING"
      class="lazy-image-skeleton"
      :style="imageStyle"
    >
      <view class="skeleton-shimmer" />
    </view>

    <!-- 实际图片 -->
    <image
      v-if="imageState === ImageState.LOADED || imageState === ImageState.CACHED"
      class="lazy-image"
      :class="{ 'fade-in': imageState === ImageState.LOADED }"
      :src="currentSrc"
      :mode="mode"
      :style="imageStyle"
      @load="handleImageLoad"
      @error="handleImageError"
    />

    <!-- 错误状态 - 显示兜底图 -->
    <image
      v-if="imageState === ImageState.ERROR"
      class="lazy-image-fallback"
      :src="fallback"
      :mode="mode"
      :style="imageStyle"
    />

    <!-- 隐藏的 canvas，用于图片转 base64（仅非 H5 平台） -->
    <!-- #ifndef H5 -->
    <canvas
      canvas-id="imageCanvas"
      class="hidden-canvas"
      :style="{ width: '800px', height: '800px' }"
    />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getGlobalObserver } from '@/utils/imageLoader/IntersectionObserver'
import { getGlobalImageQueue, ImagePriority } from '@/utils/imageLoader/ImageLoadQueue'
import { getGlobalImageCache } from '@/utils/imageLoader/ImageCache'
import { getGlobalPerformanceMonitor } from '@/utils/imageLoader/PerformanceMonitor'
import { getGlobalNetworkDetector } from '@/utils/imageLoader/NetworkDetector'
import { getGlobalWebPDetector } from '@/utils/imageLoader/WebPDetector'
import { getGlobalOfflineCache } from '@/utils/imageLoader/OfflineCache'
import { FALLBACK_IMAGE, PLACEHOLDER_IMAGE } from '@/constants/images'

// 图片状态枚举
enum ImageState {
  IDLE = 'idle',           // 初始状态
  LOADING = 'loading',     // 加载中
  LOADED = 'loaded',       // 加载完成
  CACHED = 'cached',       // 已缓存
  ERROR = 'error'          // 加载失败
}

interface Props {
  src: string
  placeholder?: string
  fallback?: string  // 加载失败时的兜底图
  priority?: 'critical' | 'high' | 'low'
  width?: number | string
  height?: number | string
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
  alt?: string
  lazy?: boolean  // 是否启用懒加载
  isAvatar?: boolean  // 是否为头像（弱网时优先加载）
  enableOfflineCache?: boolean  // 是否启用离线缓存和 base64 转换
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: PLACEHOLDER_IMAGE,
  fallback: FALLBACK_IMAGE,
  priority: 'high',
  mode: 'aspectFill',
  lazy: true,
  isAvatar: false,
  enableOfflineCache: false  // 默认不启用离线缓存
})

const emit = defineEmits<{
  load: [src: string]
  error: [error: Error]
}>()

// 生成唯一 ID（使用递增计数器）
let imageIdCounter = 0
const elementId = `lazy-image-${++imageIdCounter}-${Date.now()}`

// 图片状态
const imageState = ref<ImageState>(ImageState.IDLE)
const currentSrc = ref('')

// 样式计算
const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}rpx` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  }
  return style
})

const imageStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    display: 'block'
  }
})

// IntersectionObserver、ImageQueue、Cache、PerformanceMonitor、NetworkDetector、WebPDetector、OfflineCache
const observer = getGlobalObserver()
const imageQueue = getGlobalImageQueue(3) // 最多3个并发
const imageCache = getGlobalImageCache(50) // 最多缓存50张
const performanceMonitor = getGlobalPerformanceMonitor()
const networkDetector = getGlobalNetworkDetector()
const webpDetector = getGlobalWebPDetector()
const offlineCache = getGlobalOfflineCache()

// 记录加载开始时间
const loadStartTime = ref(0)

/**
 * 处理图片 URL（WebP 支持检测）
 */
const processImageUrl = (url: string): string => {
  return webpDetector.convertImageUrl(url)
}

/**
 * 检查是否应该加载（弱网降级）
 */
const shouldLoad = (): boolean => {
  const networkInfo = networkDetector.getNetworkInfo()

  // 离线状态，不加载
  if (networkInfo.isOffline) {
    return false
  }

  // 移除弱网降级限制，所有图片都正常加载
  return true
}

/**
 * 开始加载图片
 */
const startLoading = async () => {
  if (!props.src || imageState.value === ImageState.LOADING) {
    return
  }

  // 检查是否应该加载（弱网降级）
  if (!shouldLoad()) {
    imageState.value = ImageState.IDLE
    return
  }

  // 处理图片 URL（WebP 转换）
  const processedUrl = processImageUrl(props.src)

  if (import.meta.env.DEV) {
    console.log(`[LazyImage] Loading image: ${elementId}, enableOfflineCache: ${props.enableOfflineCache}, url: ${processedUrl}`)
  }

  // H5 平台降级：跳过离线缓存检查，直接使用内存缓存和网络加载
  // #ifndef H5
  // 1. 检查离线缓存（仅非 H5 平台且启用了离线缓存）
  if (props.enableOfflineCache) {
    const offlineCached = await offlineCache.get(processedUrl)
    if (offlineCached) {
      currentSrc.value = offlineCached.base64
      imageState.value = ImageState.CACHED
      emit('load', processedUrl)
      performanceMonitor.recordCacheHit()
      if (import.meta.env.DEV) {
        console.log(`[LazyImage] Offline cache hit: ${elementId}`)
      }
      return
    }
  }
  // #endif

  // 2. 检查内存缓存（所有平台）
  if (imageCache.has(processedUrl)) {
    const cached = imageCache.get(processedUrl)
    if (cached) {
      imageState.value = ImageState.CACHED
      currentSrc.value = processedUrl
      emit('load', processedUrl)
      performanceMonitor.recordCacheHit()
      if (import.meta.env.DEV) {
        console.log(`[LazyImage] Memory cache hit: ${elementId}`)
      }
      return
    }
  }

  imageState.value = ImageState.LOADING
  loadStartTime.value = Date.now()

  // 映射优先级
  const priority = props.priority === 'critical'
    ? ImagePriority.CRITICAL
    : props.priority === 'high'
    ? ImagePriority.HIGH
    : ImagePriority.LOW

  // 添加到加载队列
  imageQueue.add(
    elementId,
    processedUrl,
    priority,
    (url) => {
      // 加载成功
      const loadTime = Date.now() - loadStartTime.value
      currentSrc.value = url
      imageState.value = ImageState.LOADED

      if (import.meta.env.DEV) {
        console.log(`[LazyImage] Image loaded successfully: ${elementId}, url: ${url}, time: ${loadTime}ms`)
      }

      // 获取图片信息并缓存
      uni.getImageInfo({
        src: url,
        success: async (res) => {
          // 存入内存缓存（所有平台）
          imageCache.set(url, {
            width: res.width,
            height: res.height
          })

          // H5 平台降级：跳过离线缓存存储
          // #ifndef H5
          // 存入离线缓存（仅在启用离线缓存时，且仅头像和关键图片，仅非 H5 平台）
          if (props.enableOfflineCache && (props.isAvatar || props.priority === 'critical')) {
            try {
              // 将图片转为 base64
              const base64 = await convertImageToBase64(url)
              if (base64) {
                await offlineCache.set(url, base64, {
                  width: res.width,
                  height: res.height
                })
              }
            } catch (error) {
              console.error('[LazyImage] Failed to cache offline:', error)
            }
          }
          // #endif

          // 记录性能指标（非缓存加载）
          performanceMonitor.recordImageLoadSuccess(loadTime, false)

          if (import.meta.env.DEV) {
            console.log(`[LazyImage] Loaded and cached: ${elementId}, ${res.width}x${res.height}`)
          }
        },
        fail: () => {
          // 即使获取信息失败，也记录性能指标
          performanceMonitor.recordImageLoadSuccess(loadTime, false)
        }
      })

      emit('load', url)
    },
    (error) => {
      // 加载失败
      imageState.value = ImageState.ERROR

      // 记录失败
      performanceMonitor.recordImageLoadFailed()

      emit('error', error)
    },
    3 // 最多重试3次
  )
}

/**
 * 将图片转为 base64
 * 使用 canvas 将图片转换为 base64 格式
 */
const convertImageToBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    // 检查平台是否支持文件系统管理器
    // #ifdef H5
    // H5 平台不支持 canvas 转 base64，直接返回 null
    console.warn('[LazyImage] H5 platform does not support image to base64 conversion')
    resolve(null)
    return
    // #endif

    // #ifndef H5
    // 检查是否支持 getFileSystemManager
    if (typeof uni.getFileSystemManager !== 'function') {
      console.warn('[LazyImage] Platform does not support getFileSystemManager')
      resolve(null)
      return
    }

    // 获取图片信息
    uni.getImageInfo({
      src: url,
      success: (res) => {
        try {
          // 创建 canvas 上下文
          const canvas = uni.createCanvasContext('imageCanvas')

          // 计算缩放比例（限制最大尺寸为 800x800，减少存储空间）
          const maxSize = 800
          let width = res.width
          let height = res.height

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height)
            width = width * ratio
            height = height * ratio
          }

          // 绘制图片到 canvas
          canvas.drawImage(res.path, 0, 0, width, height)
          canvas.draw(false, () => {
            // 导出为 base64
            uni.canvasToTempFilePath({
              canvasId: 'imageCanvas',
              fileType: 'jpg',
              quality: 0.8,
              success: (canvasRes) => {
                try {
                  // 读取文件为 base64
                  const fs = uni.getFileSystemManager()
                  fs.readFile({
                    filePath: canvasRes.tempFilePath,
                    encoding: 'base64',
                    success: (fileRes) => {
                      resolve(`data:image/jpeg;base64,${fileRes.data}`)
                    },
                    fail: (err) => {
                      console.warn('[LazyImage] Failed to read file as base64:', err)
                      resolve(null)
                    }
                  })
                } catch (error) {
                  console.warn('[LazyImage] Error reading file:', error)
                  resolve(null)
                }
              },
              fail: (err) => {
                console.warn('[LazyImage] Failed to convert canvas to file:', err)
                resolve(null)
              }
            })
          })
        } catch (error) {
          console.warn('[LazyImage] Error in canvas conversion:', error)
          resolve(null)
        }
      },
      fail: (err) => {
        console.warn('[LazyImage] Failed to get image info for base64 conversion:', err)
        resolve(null)
      }
    })
    // #endif
  })
}

/**
 * 处理图片加载完成
 */
const handleImageLoad = () => {
  if (import.meta.env.DEV) {
    console.log(`[LazyImage] Image loaded: ${elementId}`)
  }
}

/**
 * 处理图片加载错误
 */
const handleImageError = (e: any) => {
  if (import.meta.env.DEV) {
    console.error(`[LazyImage] Image error: ${elementId}`, e)
  }
  imageState.value = ImageState.ERROR
}

/**
 * IntersectionObserver 回调
 */
const handleIntersection = (isIntersecting: boolean) => {
  if (isIntersecting && imageState.value === ImageState.IDLE) {
    if (import.meta.env.DEV) {
      console.log(`[LazyImage] Image entering viewport: ${elementId}`)
    }
    startLoading()
  } else if (!isIntersecting && (imageState.value === ImageState.LOADED || imageState.value === ImageState.CACHED)) {
    // 图片离开可视区域
    if (import.meta.env.DEV) {
      console.log(`[LazyImage] Image leaving viewport: ${elementId}`)
    }

    // 注意：不立即释放内存，因为用户可能会滚回来
    // 图片已经在 LRU 缓存中，会自动按 LRU 策略淘汰
    // 这里只是记录日志，实际释放由 MemoryManager 自动处理
  }
}

// 监听 src 变化
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    // 取消旧的加载任务
    imageQueue.cancel(elementId)

    // 重置状态
    imageState.value = ImageState.IDLE
    currentSrc.value = ''

    if (!props.lazy) {
      // 非懒加载，直接加载
      startLoading()
    } else {
      // 懒加载模式，重新检查是否在可视区域
      // IntersectionObserver 会自动触发回调
      // 如果已经在可视区域，会立即触发 startLoading
    }
  }
})

onMounted(() => {
  if (import.meta.env.DEV) {
    console.log(`[LazyImage] Mounted: ${elementId}, src: ${props.src}, lazy: ${props.lazy}, state: ${imageState.value}`)
  }

  if (props.lazy) {
    // 启用懒加载，使用 IntersectionObserver
    observer.observe(elementId, handleIntersection)
  } else {
    // 不启用懒加载，直接加载
    startLoading()
  }
})

onUnmounted(() => {
  // 取消观察
  observer.unobserve(elementId)

  // 取消加载任务
  imageQueue.cancel(elementId)
})
</script>

<style scoped lang="scss">
.lazy-image-container {
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;

  .lazy-image-placeholder,
  .lazy-image,
  .lazy-image-fallback {
    width: 100%;
    height: 100%;
  }

  .lazy-image-placeholder {
    opacity: 0.6;
  }

  .lazy-image,
  .lazy-image-fallback {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;

    &.fade-in {
      opacity: 1;
    }
  }

  .lazy-image-fallback {
    opacity: 1;
  }

  .lazy-image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;

    .skeleton-shimmer {
      width: 100%;
      height: 100%;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.hidden-canvas {
  position: absolute;
  left: -9999px;
  top: -9999px;
  visibility: hidden;
}
</style>
