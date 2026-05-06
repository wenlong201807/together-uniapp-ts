<template>
  <view class="test-page">
    <view v-if="!isWechat" class="header">
      <text class="title">H5 图片上传测试</text>
    </view>

    <view class="info-section">
      <view class="info-card">
        <text class="info-label">平台：</text>
        <text class="info-value">{{ platform }}</text>
      </view>

      <view class="info-card">
        <text class="info-label">H5 环境：</text>
        <text class="info-value" :class="{ success: isH5 }">{{ isH5 ? '✓ 是' : '✕ 否' }}</text>
      </view>

      <view class="info-card">
        <text class="info-label">浏览器：</text>
        <text class="info-value">{{ browserInfo.browser }}</text>
      </view>

      <view class="info-card">
        <text class="info-label">设备类型：</text>
        <text class="info-value">{{ deviceType }}</text>
      </view>

      <view class="info-card">
        <text class="info-label">已选图片：</text>
        <text class="info-value">{{ selectedImages.length }} 张</text>
      </view>
    </view>

    <view class="upload-section">
      <!-- #ifdef H5 -->
      <view class="h5-section">
        <view class="section-header">
          <text class="section-title">H5 上传组件</text>
          <text class="section-badge">测试中</text>
        </view>
        <H5ImageUploader
          ref="uploaderRef"
          :max-count="9"
          :max-size="10"
          @change="handleImageChange"
        />
      </view>
      <!-- #endif -->

      <!-- #ifdef APP-PLUS -->
      <view class="app-section">
        <text class="section-title">App 上传</text>
        <button @tap="handleAppUpload">选择图片</button>
      </view>
      <!-- #endif -->

      <!-- #ifndef H5 || APP-PLUS -->
      <view class="other-section">
        <text>其他平台</text>
      </view>
      <!-- #endif -->
    </view>

    <!-- 上传操作区域 -->
    <view v-if="selectedImages.length > 0" class="action-section">
      <view class="section-header">
        <text class="section-title">上传操作</text>
      </view>
      <view class="action-buttons">
        <button class="action-btn upload-btn" @tap="handleUploadToQiniu" :disabled="uploading">
          <view class="btn-content">
            <text class="btn-icon">☁️</text>
            <text class="btn-text">{{ uploading ? '上传中...' : '上传到七牛云' }}</text>
          </view>
        </button>
        <button
          class="action-btn avatar-btn"
          @tap="handleSetAvatar"
          :disabled="!qiniuUrls.length || uploading"
        >
          <view class="btn-content">
            <text class="btn-icon">👤</text>
            <text class="btn-text">设置为头像</text>
          </view>
        </button>
      </view>
      <view v-if="qiniuUrls.length > 0" class="upload-result">
        <text class="result-title">✅ 已上传到七牛云：</text>
        <view v-for="(url, index) in qiniuUrls" :key="index" class="result-item">
          <text class="result-text">{{ index + 1 }}. {{ url }}</text>
        </view>
      </view>
    </view>

    <!-- 图片预览区域 -->
    <view v-if="selectedImages.length > 0" class="preview-section">
      <view class="section-header">
        <text class="section-title">图片预览</text>
        <text class="clear-btn" @tap="handleClearImages">清空</text>
      </view>
      <view class="preview-grid">
        <view
          v-for="(image, index) in selectedImages"
          :key="index"
          class="preview-item"
          @tap="handlePreviewImage(index)"
        >
          <image
            v-img-proxy="image.url"
            class="preview-image"
            mode="aspectFill"
          />
          <view class="image-info">
            <text class="image-name">{{ image.name }}</text>
            <text class="image-size">{{ image.size }}</text>
          </view>
          <view v-if="image.isProxy" class="proxy-badge">
            <text class="badge-text">代理</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 调用日志 -->
    <view class="log-section">
      <view class="section-header">
        <text class="log-title">调用日志</text>
        <text class="clear-btn" @tap="handleClearLogs">清空</text>
      </view>
      <view v-if="logs.length === 0" class="empty-logs">
        <text class="empty-text">暂无日志</text>
      </view>
      <view v-else class="log-list">
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-text">{{ log }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { uploadFile } from '@/api/modules/file'
import { setAvatar } from '@/api/profile'
import { useAuthStore } from '@/stores'
import { userApi } from '@/api'
// #ifdef H5
import H5ImageUploader from '@/components/business/H5ImageUploader.vue'
// #endif

interface ImageInfo {
  url: string
  name: string
  size: string
  isProxy: boolean
  file?: File
}

interface BrowserInfo {
  browser: string
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  userAgent: string
}

const authStore = useAuthStore()

const platform = ref('')
const isH5 = ref(false)
const logs = ref<string[]>([])
const selectedImages = ref<ImageInfo[]>([])
const qiniuUrls = ref<string[]>([])
const uploading = ref(false)
const isWechat = ref(false)  // 是否微信浏览器
const browserInfo = ref<BrowserInfo>({
  browser: '未知',
  isMobile: false,
  isIOS: false,
  isAndroid: false,
  userAgent: ''
})

// #ifdef H5
const uploaderRef = ref<InstanceType<typeof H5ImageUploader>>()
// #endif

// 计算设备类型
const deviceType = computed(() => {
  if (browserInfo.value.isIOS) return 'iOS'
  if (browserInfo.value.isAndroid) return 'Android'
  if (browserInfo.value.isMobile) return '移动设备'
  return '桌面设备'
})

// 获取浏览器信息
const detectBrowser = (): BrowserInfo => {
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

onMounted(() => {
  // 检测浏览器
  browserInfo.value = detectBrowser()

  // 检测是否微信浏览器
  isWechat.value = /MicroMessenger/i.test(navigator.userAgent)

  // 检测平台
  // #ifdef H5
  platform.value = 'H5'
  isH5.value = true
  addLog('✅ H5 环境检测成功')
  addLog(`✅ 浏览器: ${browserInfo.value.browser}`)
  addLog(`✅ 设备: ${deviceType.value}`)
  if (isWechat.value) {
    addLog('✅ 微信浏览器环境')
  }
  addLog('✅ H5ImageUploader 组件已导入')
  addLog('✅ v-img-proxy 指令已注册')
  console.log('[测试页面] UserAgent:', browserInfo.value.userAgent)
  console.log('[测试页面] 是否微信浏览器:', isWechat.value)
  // #endif

  // #ifdef APP-PLUS
  platform.value = 'APP-PLUS'
  isH5.value = false
  addLog('✅ App 环境检测成功')
  // #endif

  // #ifdef MP-WEIXIN
  platform.value = 'MP-WEIXIN'
  isH5.value = false
  addLog('✅ 微信小程序环境检测成功')
  // #endif
})

const addLog = (message: string) => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift(`[${time}] ${message}`)
  console.log(message)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// #ifdef H5
const handleImageChange = (files: File[]) => {
  addLog(`📸 选择了 ${files.length} 张图片`)
  addLog(`🌐 当前浏览器: ${browserInfo.value.browser}`)

  files.forEach((file, index) => {
    const url = URL.createObjectURL(file)
    const isProxy = url.startsWith('http://') // 检查是否需要代理

    selectedImages.value.push({
      url,
      name: file.name,
      size: formatFileSize(file.size),
      isProxy,
      file
    })

    addLog(`  - 图片 ${index + 1}: ${file.name} (${formatFileSize(file.size)})`)
    addLog(`    📍 Blob URL: ${url}`)

    if (isProxy) {
      addLog(`    ⚡ 检测到 HTTP URL`)
    }
  })

  addLog(`✅ 图片已添加到预览区域`)
}

// 上传到七牛云
const handleUploadToQiniu = async () => {
  if (selectedImages.value.length === 0) {
    uni.showToast({
      title: '请先选择图片',
      icon: 'none'
    })
    return
  }

  uploading.value = true
  qiniuUrls.value = []

  addLog('🚀 开始上传到七牛云...')
  console.log('[上传] 开始上传，图片数量:', selectedImages.value.length)

  uni.showLoading({
    title: '上传中...',
    mask: true
  })

  try {
    for (let i = 0; i < selectedImages.value.length; i++) {
      const image = selectedImages.value[i]

      addLog(`📤 上传图片 ${i + 1}/${selectedImages.value.length}: ${image.name}`)
      console.log(`[上传] 图片 ${i + 1}:`, {
        name: image.name,
        size: image.size,
        type: image.file?.type,
        currentUrl: image.url,
        isBlobUrl: image.url.startsWith('blob:')
      })

      // ✅ H5 环境下，uploadFile 需要传递 Blob URL（字符串），而不是 File 对象
      // image.url 就是 Blob URL
      const uploadRes = await uploadFile(image.url, { type: 'avatar' })

      console.log(`[上传] 图片 ${i + 1} 上传成功:`, uploadRes)
      addLog(`✅ 图片 ${i + 1} 上传成功`)
      addLog(`   📍 七牛云 URL: ${uploadRes.url}`)
      addLog(`   📁 文件路径: ${uploadRes.filePath}`)

      // 记录七牛云 URL
      qiniuUrls.value.push(uploadRes.url)

      // ✅ 关键修改：释放旧的 Blob URL，更新为七牛云 URL
      if (image.url.startsWith('blob:')) {
        addLog(`   🔄 释放 Blob URL: ${image.url}`)
        URL.revokeObjectURL(image.url)
      }

      // 更新预览 URL 为七牛云 URL
      selectedImages.value[i].url = uploadRes.url
      selectedImages.value[i].isProxy = uploadRes.url.startsWith('http://')

      addLog(`   🔄 更新预览 URL 为七牛云 URL`)
      console.log(`[上传] 图片 ${i + 1} URL 已更新:`, {
        oldUrl: image.url,
        newUrl: uploadRes.url,
        needsProxy: selectedImages.value[i].isProxy
      })

      if (selectedImages.value[i].isProxy) {
        addLog(`   ⚡ 检测到 HTTP URL，将自动转换为 HTTPS CDN 地址`)
      }
    }

    uni.hideLoading()
    uni.showToast({
      title: '上传成功',
      icon: 'success'
    })

    addLog(`🎉 全部上传完成！共 ${qiniuUrls.value.length} 张`)
    addLog(`✅ 图片预览已更新为七牛云 URL`)
    console.log('[上传] 全部上传完成，七牛云 URLs:', qiniuUrls.value)
    console.log('[上传] 预览 URLs 已更新:', selectedImages.value.map(img => img.url))
  } catch (error: any) {
    uni.hideLoading()
    console.error('[上传] 上传失败:', error)
    addLog(`❌ 上传失败: ${error.message || '未知错误'}`)

    uni.showToast({
      title: error.message || '上传失败',
      icon: 'none'
    })
  } finally {
    uploading.value = false
  }
}

// 设置为头像
const handleSetAvatar = async () => {
  if (qiniuUrls.value.length === 0) {
    uni.showToast({
      title: '请先上传图片到七牛云',
      icon: 'none'
    })
    return
  }

  addLog('.')
  console.log('[设置头像] 使用第一张图片:', qiniuUrls.value[0])

  uni.showLoading({
    title: '设置中...',
    mask: true
  })

  try {
    // 注意：setAvatar 接口需要 photoId，这里需要先创建照片记录
    // 由于测试环境可能没有 photoId，我们直接调用用户信息更新接口
    addLog('📝 调用头像设置接口...')
    console.log('[设置头像] 请求参数:', {
      avatarUrl: qiniuUrls.value[0]
    })

    // 这里需要调用更新用户信息的接口
    // 假设有一个更新头像的接口
    const updateRes = await userApi.updateProfile({
      avatarUrl: qiniuUrls.value[0]
    })

    console.log('[设置头像] 接口响应:', updateRes)
    addLog('✅ 头像设置成功')

    // 刷新用户信息
    addLog('🔄 刷新用户信息...')
    const userRes = await userApi.getCurrentUser()
    console.log('[设置头像] 用户信息:', userRes.data)

    if (userRes.data) {
      authStore.updateUserInfo(userRes.data)
      addLog('✅ 用户信息已更新')
      addLog(`   👤 新头像: ${userRes.data.avatarUrl}`)
    }

    uni.hideLoading()
    uni.showToast({
      title: '头像设置成功',
      icon: 'success'
    })

    addLog('🎉 头像设置流程完成！')
  } catch (error: any) {
    uni.hideLoading()
    console.error('[设置头像] 失败:', error)
    addLog(`❌ 设置头像失败: ${error.message || '未知错误'}`)

    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none'
    })
  }
}
// #endif

// #ifdef APP-PLUS
const handleAppUpload = () => {
  addLog('📱 调用 App 上传')
  uni.chooseImage({
    count: 9,
    success: (res) => {
      addLog(`📸 选择了 ${res.tempFilePaths.length} 张图片`)

      res.tempFilePaths.forEach((path, index) => {
        selectedImages.value.push({
          url: path,
          name: `图片${index + 1}`,
          size: '未知',
          isProxy: false
        })
        addLog(`  - 图片 ${index + 1}: ${path}`)
      })
    }
  })
}
// #endif

const handlePreviewImage = (index: number) => {
  const urls = selectedImages.value.map(img => img.url)
  uni.previewImage({
    current: index,
    urls
  })
}

const handleClearImages = () => {
  // #ifdef H5
  // 释放 Blob URL
  selectedImages.value.forEach(img => {
    if (img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
  })
  // #endif

  selectedImages.value = []
  qiniuUrls.value = []

  // #ifdef H5
  uploaderRef.value?.clear()
  // #endif

  addLog('🗑️ 已清空所有图片')
}

const handleClearLogs = () => {
  logs.value = []
  console.clear()
}
</script>

<style scoped lang="scss">
.test-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.header {
  padding: 40rpx 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);

  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.info-section {
  margin-bottom: 24rpx;
}

.info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .info-label {
    font-size: 28rpx;
    color: #666;
  }

  .info-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;

    &.success {
      color: #52c41a;
    }
  }
}

.upload-section {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .section-badge {
      padding: 4rpx 12rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 22rpx;
      border-radius: 12rpx;
      font-weight: 500;
    }
  }

  .h5-section,
  .app-section,
  .other-section {
    min-height: 200rpx;
  }
}

.preview-section {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .clear-btn {
      font-size: 26rpx;
      color: #ff4d4f;
      padding: 8rpx 16rpx;
      background: rgba(255, 77, 79, 0.1);
      border-radius: 8rpx;
    }
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
  }

  .preview-item {
    position: relative;
    background: #f5f5f5;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

    .preview-image {
      width: 100%;
      height: 280rpx;
      display: block;
    }

    .image-info {
      padding: 16rpx;
      background: #fff;

      .image-name {
        display: block;
        font-size: 24rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .image-size {
        display: block;
        font-size: 22rpx;
        color: #999;
      }
    }

    .proxy-badge {
      position: absolute;
      top: 12rpx;
      right: 12rpx;
      padding: 6rpx 12rpx;
      background: rgba(102, 126, 234, 0.9);
      border-radius: 8rpx;
      backdrop-filter: blur(10rpx);

      .badge-text {
        font-size: 20rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

.log-section {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;

    .log-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
    }

    .clear-btn {
      font-size: 24rpx;
      color: #999;
      padding: 6rpx 12rpx;
      background: #f5f5f5;
      border-radius: 8rpx;
    }
  }

  .empty-logs {
    padding: 60rpx 0;
    text-align: center;

    .empty-text {
      font-size: 26rpx;
      color: #999;
    }
  }

  .log-list {
    max-height: 600rpx;
    overflow-y: auto;
  }

  .log-item {
    padding: 12rpx 16rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
    margin-bottom: 8rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .log-text {
      font-size: 24rpx;
      color: #666;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      line-height: 1.6;
      word-break: break-all;
    }
  }
}

.action-section {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .action-btn {
      width: 100%;
      height: 96rpx;
      padding: 0;
      border-radius: 16rpx;
      border: none;
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;

      &::after {
        border: none;
      }

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

      &:active:not([disabled])::before {
        opacity: 1;
      }

      &:active:not([disabled]) {
        transform: scale(0.98);
      }

      &[disabled] {
        opacity: 0.5;
      }

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        height: 100%;
      }

      .btn-icon {
        font-size: 36rpx;
        line-height: 1;
      }

      .btn-text {
        font-size: 30rpx;
        font-weight: 600;
        line-height: 1;
      }

      &.upload-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.35);

        &:active:not([disabled]) {
          box-shadow: 0 2rpx 12rpx rgba(102, 126, 234, 0.25);
        }
      }

      &.avatar-btn {
        background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
        color: #fff;
        box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.35);

        &:active:not([disabled]) {
          box-shadow: 0 2rpx 12rpx rgba(82, 196, 26, 0.25);
        }
      }
    }
  }

  .upload-result {
    margin-top: 24rpx;
    padding: 20rpx;
    background: #f6ffed;
    border: 2rpx solid #b7eb8f;
    border-radius: 12rpx;

    .result-title {
      display: block;
      font-size: 26rpx;
      font-weight: 600;
      color: #52c41a;
      margin-bottom: 12rpx;
    }

    .result-item {
      margin-bottom: 8rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .result-text {
        font-size: 22rpx;
        color: #666;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        line-height: 1.6;
        word-break: break-all;
      }
    }
  }
}
</style>
