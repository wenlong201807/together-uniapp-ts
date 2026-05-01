<template>
  <view class="h5-image-uploader">
    <!-- 图片预览网格 -->
    <view class="image-grid">
      <!-- 已选择的图片 -->
      <view
        v-for="(item, index) in imageList"
        :key="index"
        class="image-item"
      >
        <image :src="item.url" class="image-preview" mode="aspectFill" />
        <view class="image-mask">
          <view class="delete-btn" @tap="handleDelete(index)">
            <text class="delete-icon">✕</text>
          </view>
        </view>
        <!-- 上传进度 -->
        <view v-if="item.uploading" class="upload-progress">
          <view class="progress-bar" :style="{ width: item.progress + '%' }" />
          <text class="progress-text">{{ item.progress }}%</text>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="imageList.length < maxCount"
        class="upload-btn-wrapper"
      >
        <!-- #ifdef H5 -->
        <view class="upload-actions">
          <view class="action-btn album-btn" @tap="handleChooseFromAlbum">
            <view class="btn-icon-wrapper">
              <text class="action-icon">📁</text>
            </view>
            <text class="action-text">相册</text>
            <text class="action-hint">选择照片</text>
          </view>
          <view class="action-btn camera-btn" @tap="handleChooseFromCamera">
            <view class="btn-icon-wrapper">
              <text class="action-icon">📸</text>
            </view>
            <text class="action-text">拍照</text>
            <text class="action-hint">即时拍摄</text>
          </view>
        </view>
        <!-- #endif -->

        <!-- #ifdef APP-PLUS -->
        <view class="upload-btn" @tap="handleChooseImage">
          <text class="upload-icon">+</text>
          <text class="upload-text">上传图片</text>
        </view>
        <!-- #endif -->
      </view>
    </view>

    <!-- 提示信息 -->
    <view v-if="showTips" class="tips">
      <text class="tips-text">最多上传 {{ maxCount }} 张，单张不超过 {{ maxSize }}MB</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
// #ifdef H5
import { h5ChooseImage, revokeBlobURLs } from '@/utils/h5-image-picker'
import type { H5ImageResult } from '@/utils/h5-image-picker'
// #endif

interface ImageItem {
  url: string          // 预览 URL（blob URL 或七牛云 URL）
  file?: File          // 原始文件对象（H5）
  uploading?: boolean  // 是否正在上传
  progress?: number    // 上传进度 0-100
  uploaded?: boolean   // 是否已上传
  qiniuUrl?: string    // 七牛云 URL
}

interface Props {
  maxCount?: number      // 最多上传数量
  maxSize?: number       // 最大文件大小（MB）
  quality?: number       // 压缩质量 0-1
  maxWidth?: number      // 最大宽度
  maxHeight?: number     // 最大高度
  showTips?: boolean     // 是否显示提示
  autoUpload?: boolean   // 是否自动上传
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
  maxSize: 10,
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  showTips: true,
  autoUpload: false,
})

const emit = defineEmits<{
  change: [files: File[]]           // 文件选择变化
  upload: [file: File, index: number]  // 单个文件上传
  delete: [index: number]           // 删除文件
  complete: [urls: string[]]        // 全部上传完成
}>()

const imageList = ref<ImageItem[]>([])

// 剩余可上传数量
const remainCount = computed(() => props.maxCount - imageList.value.length)

// #ifdef H5
// H5 - 从相册选择
const handleChooseFromAlbum = async () => {
  console.log('[H5ImageUploader] 从相册选择')
  console.log('[H5ImageUploader] 浏览器信息:', getBrowserInfo())

  try {
    const result: H5ImageResult = await h5ChooseImage({
      count: remainCount.value,
      sourceType: ['album'],
      sizeType: ['compressed'],
      maxSize: props.maxSize,
      quality: props.quality,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    })

    handleImageResult(result)
  } catch (error: any) {
    console.error('[H5ImageUploader] 选择失败:', error)
    if (error.message !== '用户取消选择') {
      uni.showToast({
        title: error.message || '选择失败',
        icon: 'none',
      })
    }
  }
}

// H5 - 拍照
const handleChooseFromCamera = async () => {
  console.log('[H5ImageUploader] 拍照')
  console.log('[H5ImageUploader] 浏览器信息:', getBrowserInfo())

  try {
    const result: H5ImageResult = await h5ChooseImage({
      count: 1,
      sourceType: ['camera'],
      sizeType: ['compressed'],
      maxSize: props.maxSize,
      quality: props.quality,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    })

    handleImageResult(result)
  } catch (error: any) {
    console.error('[H5ImageUploader] 拍照失败:', error)
    if (error.message !== '用户取消选择') {
      uni.showToast({
        title: error.message || '拍照失败',
        icon: 'none',
      })
    }
  }
}

// 获取浏览器信息
const getBrowserInfo = () => {
  const ua = navigator.userAgent
  let browser = '未知浏览器'

  if (/MicroMessenger/i.test(ua)) {
    browser = '微信浏览器'
  } else if (/QQ\//i.test(ua)) {
    browser = 'QQ浏览器'
  } else if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
    browser = 'Chrome'
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari'
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox'
  } else if (/Edge/i.test(ua)) {
    browser = 'Edge'
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  return {
    browser,
    isMobile,
    isIOS,
    isAndroid,
    userAgent: ua
  }
}

// H5 - 处理选择结果
const handleImageResult = (result: H5ImageResult) => {
  console.log('[H5ImageUploader] 选择成功，文件数量:', result.tempFiles.length)

  const newImages: ImageItem[] = result.tempFilePaths.map((url, index) => {
    const file = result.tempFiles[index]
    console.log(`[der] 图片 ${index + 1}:`)
    console.log(`  - 文件名: ${file.name}`)
    console.log(`  - 文件大小: ${(file.size / 1024).toFixed(2)} KB`)
    console.log(`  - 文件类型: ${file.type}`)
    console.log(`  - Blob URL: ${url}`)

    return {
      url,
      file,
      uploading: false,
      progress: 0,
      uploaded: false,
    }
  })

  imageList.value.push(...newImages)

  // 触发 change 事件
  emit('change', result.tempFiles)

  // 如果开启自动上传
  if (props.autoUpload) {
    newImages.forEach((item, index) => {
      const globalIndex = imageList.value.length - newImages.length + index
      if (item.file) {
        emit('upload', item.file, globalIndex)
      }
    })
  }
}
// #endif

// #ifdef APP-PLUS
// App - 选择图片
const handleChooseImage = () => {
  uni.chooseImage({
    count: remainCount.value,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      console.log('[H5ImageUploader] App 选择成功，文件数量:', res.tempFilePaths.length)

      const newImages: ImageItem[] = res.tempFilePaths.map(url => ({
        url,
        uploading: false,
        progress: 0,
        uploaded: false,
      }))

      imageList.value.push(...newImages)

      // App 端没有 File 对象，直接传递路径
      emit('change', res.tempFilePaths as any)

      // 如果开启自动上传
      if (props.autoUpload) {
        newImages.forEach((item, index) => {
          const globalIndex = imageList.value.length - newImages.length + index
          emit('upload', item.url as any, globalIndex)
        })
      }
    },
    fail: (error) => {
      console.error('[H5ImageUploader] App 选择失败:', error)
      uni.showToast({
        title: '选择失败',
        icon: 'none',
      })
    },
  })
}
// #endif

// 删除图片
const handleDelete = (index: number) => {
  const item = imageList.value[index]

  // #ifdef H5
  // 释放 blob URL
  if (item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url)
  }
  // #endif

  imageList.value.splice(index, 1)
  emit('delete', index)
}

// 更新上传进度
const updateProgress = (index: number, progress: number) => {
  if (imageList.value[index]) {
    imageList.value[index].uploading = true
    imageList.value[index].progress = progress
  }
}

// 标记上传完成
const markUploaded = (index: number, qiniuUrl: string) => {
  if (imageList.value[index]) {
    imageList.value[index].uploading = false
    imageList.value[index].uploaded = true
    imageList.value[index].qiniuUrl = qiniuUrl
  }

  // 检查是否全部上传完成
  const allUploaded = imageList.value.every(item => item.uploaded)
  if (allUploaded) {
    const urls = imageList.value.map(item => item.qiniuUrl || item.url)
    emit('complete', urls)
  }
}

// 获取所有文件
const getFiles = () => {
  // #ifdef H5
  return imageList.value.map(item => item.file).filter(Boolean) as File[]
  // #endif

  // #ifdef APP-PLUS
  return imageList.value.map(item => item.url)
  // #endif
}

// 清空所有图片
const clear = () => {
  // #ifdef H5
  // 释放所有 blob URL
  const blobUrls = imageList.value
    .map(item => item.url)
    .filter(url => url.startsWith('blob:'))
  revokeBlobURLs(blobUrls)
  // #endif

  imageList.value = []
}

// 暴露方法给父组件
defineExpose({
  updateProgress,
  markUploaded,
  getFiles,
  clear,
})
</script>

<style scoped lang="scss">
.h5-image-uploader {
  .image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
  }

  .image-item {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    background: #f5f5f5;
    border-radius: 12rpx;
    overflow: hidden;

    .image-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .image-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      transition: background 0.3s ease;

      &:active {
        background: rgba(0, 0, 0, 0.1);
      }
    }

    .delete-btn {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      backdrop-filter: blur(10rpx);

      .delete-icon {
        font-size: 28rpx;
        color: #fff;
        font-weight: 300;
      }
    }

    .upload-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 48rpx;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;

      .progress-bar {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
      }

      .progress-text {
        position: relative;
        z-index: 1;
        font-size: 24rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }

  .upload-btn-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    background: #fafbfc;
    border: 3rpx dashed #d0d7de;
    border-radius: 12rpx;
    overflow: hidden;

    .upload-actions {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 20rpx;
      padding: 20rpx;

      .action-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        padding: 32rpx 16rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16rpx;
        box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:active {
          transform: scale(0.95);
          box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.2);

          &::before {
            opacity: 1;
          }
        }

        &.camera-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          box-shadow: 0 4rpx 12rpx rgba(245, 87, 108, 0.3);

          &:active {
            box-shadow: 0 2rpx 8rpx rgba(245, 87, 108, 0.2);
          }
        }

        .btn-icon-wrapper {
          width: 80rpx;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          backdrop-filter: blur(10rpx);
        }

        .action-icon {
          font-size: 48rpx;
          line-height: 1;
        }

        .action-text {
          font-size: 28rpx;
          color: #fff;
          font-weight: 600;
          line-height: 1;
        }

        .action-hint {
          font-size: 22rpx;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1;
        }
      }
    }

    .upload-btn {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:active {
        background: #f6f8fa;
        border-color: #667eea;
      }

      .upload-icon {
        font-size: 56rpx;
        color: #667eea;
        margin-bottom: 12rpx;
        font-weight: 300;
      }

      .upload-text {
        font-size: 26rpx;
        color: #667eea;
        font-weight: 500;
      }
    }
  }

  .tips {
    margin-top: 16rpx;
    padding: 0 8rpx;

    .tips-text {
      font-size: 24rpx;
      color: #999;
      line-height: 1.5;
    }
  }
}
</style>
