/**
 * H5 图片选择器
 * 支持相册选择和拍照
 * 纯原生实现，无第三方依赖
 */

export interface H5ImagePickerOptions {
  count?: number          // 最多选择数量，默认 9
  sourceType?: ('album' | 'camera')[]  // 来源类型
  sizeType?: ('original' | 'compressed')[]  // 尺寸类型
  maxSize?: number        // 最大文件大小（MB），默认 10
  quality?: number        // 压缩质量 0-1，默认 0.8
  maxWidth?: number       // 最大宽度，默认 1920
  maxHeight?: number      // 最大高度，默认 1920
}

export interface H5ImageResult {
  tempFilePaths: string[]  // 临时文件路径（blob URL）
  tempFiles: File[]        // 原始 File 对象
}

export interface BrowserCapabilities {
  isMobile: boolean       // 是否移动端
  isIOS: boolean          // 是否 iOS
  isAndroid: boolean      // 是否 Android
  isWechat: boolean       // 是否微信浏览器
  supportCapture: boolean // 是否支持 capture 属性
  supportFileAPI: boolean // 是否支持 FileReader API
  supportCanvas: boolean  // 是否支持 Canvas
}

/**
 * 检测浏览器能力
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const ua = navigator.userAgent
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isWechat = /MicroMessenger/i.test(ua)

  // iOS Safari 对 capture 支持不好，Android 支持较好
  const supportCapture = isMobile && !isIOS

  // 检测 FileReader API
  const supportFileAPI = typeof FileReader !== 'undefined'

  // 检测 Canvas API
  const supportCanvas = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext && canvas.getContext('2d'))
    } catch (e) {
      return false
    }
  })()

  return {
    isMobile,
    isIOS,
    isAndroid,
    isWechat,
    supportCapture,
    supportFileAPI,
    supportCanvas
  }
}

/**
 * 创建文件选择器
 */
function createFileInput(options: H5ImagePickerOptions): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  // 是否支持多选
  if (options.count && options.count > 1) {
    input.multiple = true
  }

  // 是否直接调起相机
  const sourceType = options.sourceType || ['album', 'camera']
  if (sourceType.length === 1 && sourceType[0] === 'camera') {
    // 仅拍照模式
    // environment: 后置摄像头, user: 前置摄像头
    input.setAttribute('capture', 'environment')
  }

  input.style.display = 'none'
  document.body.appendChild(input)

  return input
}

/**
 * H5 选择图片
 */
export function h5ChooseImage(options: H5ImagePickerOptions = {}): Promise<H5ImageResult> {
  return new Promise((resolve, reject) => {
    const input = createFileInput(options)

    // 文件选择完成
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])

      // 移除 input 元素
      document.body.removeChild(input)

      if (files.length === 0) {
        reject(new Error('未选择文件'))
        return
      }

      // 检查文件数量
      const count = options.count || 9
      const selectedFiles = files.slice(0, count)

      // 检查文件类型
      const invalidFiles = selectedFiles.filter(f => !f.type.startsWith('image/'))
      if (invalidFiles.length > 0) {
        reject(new Error('只能选择图片文件'))
        return
      }

      // 检查文件大小
      const maxSize = (options.maxSize || 10) * 1024 * 1024
      const oversizedFiles = selectedFiles.filter(f => f.size > maxSize)
      if (oversizedFiles.length > 0) {
        reject(new Error(`图片大小不能超过 ${options.maxSize || 10}MB`))
        return
      }

      try {
        // 处理图片（压缩）
        const sizeType = options.sizeType || ['compressed']
        const needCompress = sizeType.includes('compressed')

        const processedFiles = needCompress
          ? await Promise.all(selectedFiles.map(f => compressImage(f, {
              quality: options.quality || 0.8,
              maxWidth: options.maxWidth || 1920,
              maxHeight: options.maxHeight || 1920
            })))
          : selectedFiles

        // 创建 blob URL
        const tempFilePaths = processedFiles.map(f => URL.createObjectURL(f))

        resolve({
          tempFilePaths,
          tempFiles: processedFiles
        })
      } catch (error) {
        reject(error)
      }
    }

    // 用户取消选择
    input.oncancel = () => {
      document.body.removeChild(input)
      reject(new Error('用户取消选择'))
    }

    // 触发选择
    input.click()
  })
}

/**
 * 压缩图片（使用 Canvas）
 */
async function compressImage(
  file: File,
  options: {
    quality: number
    maxWidth: number
    maxHeight: number
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          let { width, height } = img
          const { maxWidth, maxHeight } = options

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }

          // 创建 Canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'))
            return
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height)

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'))
                return
              }

              // 创建新的 File 对象
              const compressedFile = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now()
              })

              console.log(`[H5ImagePicker] 压缩完成: ${file.name}`)
              console.log(`[H5ImagePicker] 原始大小: ${(file.size / 1024).toFixed(2)}KB`)
              console.log(`[H5ImagePicker] 压缩后: ${(compressedFile.size / 1024).toFixed(2)}KB`)
              console.log(`[H5ImagePicker] 压缩率: ${((1 - compressedFile.size / file.size) * 100).toFixed(2)}%`)

              resolve(compressedFile)
            },
            file.type || 'image/jpeg',
            options.quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 释放 blob URL（避免内存泄漏）
 */
export function revokeBlobURL(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * 批量释放 blob URL
 */
export function revokeBlobURLs(urls: string[]) {
  urls.forEach(url => revokeBlobURL(url))
}
