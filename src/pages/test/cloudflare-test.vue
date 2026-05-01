<template>
  <view class="cloudflare-test">
    <view class="header">
      <text class="title">Cloudflare Workers 测试</text>
    </view>

    <!-- 配置信息 -->
    <view class="section">
      <view class="section-title">配置信息</view>
      <view class="info-item">
        <text class="label">Worker URL:</text>
        <text class="value">{{ workerUrl }}</text>
      </view>
      <view class="info-item">
        <text class="label">状态:</text>
        <text :class="['status', isEnabled ? 'enabled' : 'disabled']">
          {{ isEnabled ? '已启用' : '未启用' }}
        </text>
      </view>
    </view>

    <!-- 测试输入 -->
    <view class="section">
      <view class="section-title">测试图片 URL</view>
      <textarea
        v-model="testUrl"
        class="input"
        placeholder="请输入七牛云 HTTP 图片地址&#10;例如: http://xxx.bkt.clouddn.com/image.jpg"
        :auto-height="true"
      />
      <button @click="handleTest" class="btn-primary" :disabled="!testUrl || testing">
        {{ testing ? '测试中...' : '开始测试' }}
      </button>
    </view>

    <!-- 转换结果 -->
    <view v-if="convertedUrl" class="section">
      <view class="section-title">转换后的 URL</view>
      <view class="url-box">
        <text class="url-text">{{ convertedUrl }}</text>
      </view>
      <button @click="copyUrl" class="btn-secondary">复制 URL</button>
    </view>

    <!-- 图片预览 -->
    <view v-if="convertedUrl" class="section">
      <view class="section-title">图片预览</view>
      <view class="image-container">
        <image
          :src="convertedUrl"
          mode="aspectFit"
          class="preview-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </view>
      <view v-if="imageStatus" :class="['status-message', imageStatus.type]">
        <text>{{ imageStatus.message }}</text>
      </view>
    </view>

    <!-- 测试结果 -->
    <view v-if="testResult" class="section">
      <view class="section-title">测试结果</view>
      <view :class="['result-box', testResult.success ? 'success' : 'error']">
        <text class="result-title">
          {{ testResult.s ? '✅ 测试成功' : '❌ 测试失败' }}
        </text>
        <text class="result-message">{{ testResult.message }}</text>
        <view v-if="testResult.details" class="result-details">
          <text v-for="(detail, index) in testResult.details" :key="index" class="detail-item">
            {{ detail }}
          </text>
        </view>
      </view>
    </view>

    <!-- 使用示例 -->
    <view class="section">
      <view class="section-title">使用示例</view>
      <view class="example-box">
        <text class="example-title">1. 单个图片转换</text>
        <text class="example-code">import { convertToHttpsUrl } from '@/utils/cloudflare-proxy'

const imageUrl = convertToHttpsUrl('http://xxx.bkt.clouddn.com/image.jpg')</text>

        <text class="example-title">2. 使用 Composable</text>
        <text class="example-code">import { useCloudflareProxy } from '@/composables/useCloudflareProxy'

const { convertUrl } = useCloudflareProxy()
const httpsUrl = convertUrl(httpUrl)</text>

        <text class="example-title">3. 批量转换</text>
        <text class="example-code">import { convertUrls } from '@/utils/cloudflare-proxy'

const photos = ['http://...jpg', 'http://...png']
const httpsPhotos = convertUrls(photos)</text>
      </view>
    </view>

    <!-- 常见问题 -->
    <view class="section">
      <view class="section-title">常见问题</view>
      <view class="faq-box">
       iew class="faq-item">
          <text class="faq-q">Q: Worker URL 在哪里获取？</text>
          <text class="faq-a">A: 在 Cloudflare 控制台部署 Worker 后会显示，格式为 https://xxx.workers.dev</text>
        </view>
        <view class="faq-item">
          <text class="faq-q">Q: 如何修改 Worker URL？</text>
          <text class="faq-a">A: 修改 src/config/cloudflare.ts 文件中的 workerUrl 配置</text>
        </view>
        <view class="faq-item">
          <text class="faq-q">Q: 图片加载失败怎么办？</text>
          <text class="faq-a">A: 检查 Worker 是否正确部署，URL 是否正确，七牛云图片是否可访问</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCloudflareProxy } from '@/composables/useCloudflareProxy'
import { CLOUDFLARE_CONFIG, isProxyEnabled, getWorkerUrl } from '@/config/cloudflare'

const { convertUrl } = useCloudflareProxy()

// 配置信息
const workerUrl = computed(() => getWorkerUrl())
const isEnabled = computed(() => isProxyEnabled())

// 测试数据
const testUrl = ref('')
const convertedUrl = ref('')
const testing = ref(false)
const testResult = ref<{
  success: boolean
  message: string
  details?: string[]
} | null>(null)

const imageStatus = ref<{
  type: 'success' | 'error' | 'loading'
  message: string
} | null>(null)

/**
 * 开始测试
 */
const handleTest = async () => {
  if (!testUrl.value) {
    uni.showToast({
      title: '请输入测试 URL',
      icon: 'none'
    })
    return
  }

  testing.value = true
  testResult.value = null
  imageStatus.value = { type: 'loading', message: '加载中...' }

  try {
    // 1. 转换 URL
    convertedUrl.value = convertUrl(testUrl.value)

    // 2. 验证转换结果
    if (convertedUrl.value === testUrl.value) {
      testResult.value = {
        success: false,
        message: 'URL 未被转换，请检查配置',
        details: [
          '可能原因：',
          '1. Worker URL 未配置',
          '2. 代理未启用',
          '3. 输入的不是 HTTP URL'
        ]
      }
      testing.value = false
      return
    }

    // 3. 测试 Worker 是否可访问
    const testWorkerResult = await testWorkerAccess(convertedUrl.value)

    if (testWorkerResult.success) {
      testResult.value = {
        success: true,
        message: 'Worker 工作正常！',
        details: [
          `✅ URL 转换成功`,
          `✅ Worker 响应正常`,
          `✅ 图片可以访问`
        ]
      }
    } else {
      testResult.value = {
        success: false,
        message: testWorkerResult.message,
        details: testWorkerResult.details
      }
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: '测试失败',
      details: [error.message || '未知错误']
    }
  } finally {
    testing.value = false
  }
}

/**
 * 测试 Worker 访问
 */
const testWorkerAccess = async (url: string): Promise<{
  success: boolean
  message: string
  details?: string[]
}> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors'
    })

    if (response.ok) {
      return {
        success: true,
        message: 'Worker 响应正常'
      }
    } else {
      return {
        success: false,
        message: `Worker 返回错误: ${response.status}`,
        details: [
          `状态码: ${response.status}`,
          `状态文本: ${response.statusText}`
        ]
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Worker 访问失败',
      details: [
        error.message || '网络错误',
        '请检查 Worker 是否正确部署'
      ]
    }
  }
}

/**
 * 图片加载成功
 */
const handleImageLoad = () => {
  imageStatus.value = {
    type: 'success',
    message: '✅ 图片加载成功'
  }
}

/**
 * 图片加载失败
 */
const handleImageError = () => {
  imageStatus.value = {
    type: 'error',
    message: '❌ 图片加载失败，请检查 URL 是否正确'
  }
}

/**
 * 复制 URL
 */
const copyUrl = () => {
  uni.setClipboardData({
    data: convertedUrl.value,
    success: () => {
      uni.showToast({
        title: '已复制到剪贴板',
        icon: 'success'
      })
    }
  })
}
</script>

<style scoped lang="scss">
.cloudflare-test {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
}

.header {
  margin-bottom: 32rpx;

  .title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
  }
}

.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;

  .label {
    font-size: 28rpx;
    color: #666;
    margin-right: 16rpx;
  }

  .value {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    word-break: break-all;
  }

  .status {
    font-size: 28rpx;
    padding: 4rpx 16rpx;
    border-radius: 8rpx;

    &.enabled {
      color: #52c41a;
      background: #f6ffed;
    }

    &.disabled {
      color: #ff4d4f;
      background: #fff2f0;
    }
  }
}

.input {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.btn-primary {
  background: #1890ff;
  color: #fff;

  &:disabled {
    background: #d9d9d9;
    color: #999;
  }
}

.btn-secondary {
  background: #fff;
  color: #1890ff;
  border: 2rpx solid #1890ff;
  margin-top: 16rpx;
}

.url-box {
  padding: 16rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 16rpx;

  .url-text {
    font-size: 24rpx;
    color: #666;
    word-break: break-all;
  }
}

.image-container {
  width: 100%;
  height: 400rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .preview-image {
    width: 100%;
    height: 100%;
  }
}

.status-message {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  font-size: 28rpx;

  &.success {
    color: #52c41a;
    background: #f6ffed;
  }

  &.error {
    color: #ff4d4f;
    background: #fff2f0;
  }

  &.loading {
    color: #1890ff;
    background: #e6f7ff;
  }
}

.result-box {
  padding: 24rpx;
  border-radius: 8rpx;

  &.success {
    background: #f6ffed;
    border: 2rpx solid #b7eb8f;
  }

  &.error {
    background: #fff2f0;
    border: 2rpx solid #ffccc7;
  }

  .result-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 16rpx;
  }

  .result-message {
    display: block;
    font-size: 28rpx;
    margin-bottom: 16rpx;
  }

  .result-details {
    .detail-item {
      display: block;
      font-size: 24rpx;
      color: #666;
      margin-bottom: 8rpx;
    }
  }
}

.example-box,
.faq-box {
  .example-title,
  .faq-q {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
  }

  .example-code {
    display: block;
    padding: 16rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
    font-size: 24rpx;
    font-family: monospace;
    color: #666;
    margin-bottom: 24rpx;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .faq-item {
    margin-bottom: 24rpx;

    .faq-a {
      display: block;
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
      margin-top: 8rpx;
    }
  }
}
</style>
