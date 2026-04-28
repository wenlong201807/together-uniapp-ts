/**
 * WebP 支持检测工具
 * 检测平台是否支持 WebP 格式
 */

export class WebPDetector {
  private supported: boolean | null = null

  /**
   * 检测 WebP 支持
   */
  async detect(): Promise<boolean> {
    if (this.supported !== null) {
      return this.supported
    }

    // 方法1: 通过系统信息判断
    const systemInfo = uni.getSystemInfoSync()
    const platform = systemInfo.platform
    const version = systemInfo.system

    // iOS 14+ 支持 WebP
    if (platform === 'ios') {
      const match = version.match(/iOS (\d+)/)
      if (match) {
        const iosVersion = parseInt(match[1])
        this.supported = iosVersion >= 14
        console.log(`[WebPDetector] iOS ${iosVersion}, WebP supported: ${this.supported}`)
        return this.supported
      }
    }

    // Android 4.0+ 支持 WebP
    if (platform === 'android') {
      const match = version.match(/Android (\d+)/)
      if (match) {
        const androidVersion = parseInt(match[1])
        this.supported = androidVersion >= 4
        console.log(`[WebPDetector] Android ${androidVersion}, WebP supported: ${this.supported}`)
        return this.supported
      }
    }

    // 方法2: 尝试加载 WebP 测试图片
    try {
      await this.testWebPImage()
      this.supported = true
      console.log('[WebPDetector] WebP test image loaded successfully')
    } catch (error) {
      this.supported = false
      console.log('[WebPDetector] WebP test image failed to load')
    }

    return this.supported
  }

  /**
   * 测试加载 WebP 图片
   */
  private testWebPImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 1x1 透明 WebP 图片 (data URL)
      const webpDataUrl = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='

      uni.getImageInfo({
        src: webpDataUrl,
        success: () => resolve(),
        fail: () => reject(new Error('WebP not supported'))
      })
    })
  }

  /**
   * 是否支持 WebP
   */
  isSupported(): boolean {
    return this.supported === true
  }

  /**
   * 转换图片 URL（如果不支持 WebP，转换为 JPG）
   */
  convertImageUrl(url: string): string {
    if (this.supported === false && url.includes('.webp')) {
      // 将 .webp 替换为 .jpg
      return url.replace(/\.webp(\?|$)/, '.jpg$1')
    }
    return url
  }

  /**
   * 获取推荐的图片格式
   */
  getRecommendedFormat(): 'webp' | 'jpg' {
    return this.supported ? 'webp' : 'jpg'
  }
}

// 全局单例
let globalDetector: WebPDetector | null = null

/**
 * 获取全局 WebP 检测器
 */
export function getGlobalWebPDetector(): WebPDetector {
  if (!globalDetector) {
    globalDetector = new WebPDetector()
  }
  return globalDetector
}

/**
 * 销毁全局 WebP 检测器
 */
export function destroyGlobalWebPDetector() {
  if (globalDetector) {
    globalDetector = null
  }
}

/**
 * 初始化 WebP 检测（异步）
 */
export async function initWebPDetection(): Promise<boolean> {
  const detector = getGlobalWebPDetector()
  return await detector.detect()
}
