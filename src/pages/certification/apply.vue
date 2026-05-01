<template>
  <view class="apply-container">
    <view class="form-section">
      <view class="form-title">{{ certTypeName }}</view>
      <view class="form-subtitle">{{ certTypeDescription }}</view>

      <view class="form-item">
        <text class="label">上传证件照片</text>
        <view class="upload-area" @click="chooseImage">
          <image
            v-if="formData.localPreviewUrl || formData.imageUrl"
            v-img-proxy="formData.localPreviewUrl || formData.imageUrl"
            mode="aspectFit"
            class="preview-image"
          />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">点击上传</text>
          </view>
          <!-- 上传中遮罩 -->
          <view v-if="uploading" class="upload-mask">
            <text class="upload-progress">上传中...</text>
          </view>
        </view>
        <text v-if="uploading" class="upload-tip">正在上传，请稍候</text>
        <text v-else-if="formData.imageUrl" class="upload-tip success">✓ 上传成功</text>
      </view>

      <view class="form-item">
        <text class="label">补充说明（选填）</text>
        <textarea
          v-model="formData.description"
          placeholder="请输入补充说明"
          class="textarea-input"
          maxlength="200"
        />
        <text class="char-count">{{ formData.description.length }}/200</text>
      </view>

      <button class="submit-btn" @click="handleSubmit" :disabled="!canSubmit || submitting">
        <text v-if="submitting">提交中...</text>
        <text v-else-if="uploading">上传中，请稍候</text>
        <text v-else-if="!formData.imageUrl">请先上传图片</text>
        <text v-else>提交申请</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { certificationApi, type CertificationType } from '@/api/modules/certification'
import { fileApi } from '@/api'

// 常量定义
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUBMIT_SUCCESS_DELAY = 1500; // 提交成功后延迟返回时间（毫秒）

// 类型定义
interface PageOptions {
  type?: string;
}

interface Page {
  options?: PageOptions;
  route?: string;
}

const certType = ref('')
const certTypeName = ref('认证申请')
const certTypeDescription = ref('')
const submitting = ref(false)
const uploading = ref(false)

const formData = ref({
  imageUrl: '',
  localPreviewUrl: '', // 本地预览URL
  description: ''
})

// 是否可以提交
const canSubmit = computed(() => {
  return formData.value.imageUrl && !uploading.value
})

onMounted(async () => {
  const pages = getCurrentPages() as Page[]
  const currentPage = pages[pages.length - 1]
  certType.value = currentPage?.options?.type || ''

  // 从后端获取认证类型信息
  try {
    const res = await certificationApi.getTypes()
    const typeInfo = res.data.list?.find((t: CertificationType) => t.code === certType.value)
    if (typeInfo) {
      certTypeName.value = typeInfo.name
      certTypeDescription.value = typeInfo.description
    }
  } catch (error) {
    console.error('Failed to load cert type:', error)
  }

  // 加载该类型的历史认证记录，用于反显
  await loadExistingCertification()
})

// 加载已有的认证记录并反显
const loadExistingCertification = async () => {
  try {
    const res = await certificationApi.getMyList()
    if (res.data.list && res.data.list.length > 0) {
      // 状态优先级：已通过=3, 待审核=2, 已拒绝=1
      const STATUS_PRIORITY = {
        1: 3,  // 已通过
        0: 2,  // 待审核
        2: 1   // 已拒绝
      }

      // 找到当前类型的记录，按优先级和时间排序（与列表页逻辑一致）
      const existingCert = res.data.list
        .filter((cert) => cert.type === certType.value)
        .sort((a, b) => {
          // 优先级：已通过 > 待审核 > 已拒绝
          const priorityA = STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] || 0
          const priorityB = STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] || 0

          if (priorityA !== priorityB) {
            return priorityB - priorityA  // 优先级高的排前面
          }

          // 同优先级按时间倒序
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })[0]

      if (existingCert) {
        // 反显图片和文案
        formData.value.imageUrl = existingCert.imageUrl || ''
        formData.value.description = existingCert.description || ''

        if (import.meta.env.DEV) {
          console.log('[loadExistingCertification] 已反显历史认证数据:', existingCert)
          console.log('[loadExistingCertification] 状态:', existingCert.status, '优先级:', STATUS_PRIORITY[existingCert.status as keyof typeof STATUS_PRIORITY])
        }
      }
    }
  } catch (error) {
    console.error('Failed to load existing certification:', error)
    // 加载失败不影响用户继续填写
  }
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 获取临时文件路径和文件信息
      let tempFilePath = ''
      let fileSize = 0

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        tempFilePath = res.tempFilePaths[0]
      }

      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFile = res.tempFiles[0]
        fileSize = tempFile.size || 0

        if (tempFile.path) {
          tempFilePath = tempFile.path
        } else if (tempFile.base64) {
          const ext = tempFile.name?.split('.').pop() || 'jpeg'
          tempFilePath = `data:image/${ext};base64,${tempFile.base64}`
        }
      }

      // 检查文件大小
      if (fileSize > MAX_FILE_SIZE) {
        uni.showToast({
          title: `图片大小不能超过${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (tempFilePath) {
        // 先显示本地预览
        formData.value.localPreviewUrl = tempFilePath
        // 清空之前的云端URL
        formData.value.imageUrl = ''
        // 立即上传到七牛云
        uploadImage(tempFilePath)
      }
    }
  })
}

const uploadImage = async (localPath: string) => {
  uploading.value = true
  uni.showLoading({ title: '上传中...', mask: true })

  try {
    const result = await fileApi.uploadFile(localPath, { type: 'certificate' })
    formData.value.imageUrl = result.url
    uni.hideLoading()
    uni.showToast({
      title: '上传成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Upload failed:', error)
    uni.hideLoading()
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    })
    // 上传失败时清空预览
    formData.value.imageUrl = ''
    formData.value.localPreviewUrl = ''
  } finally {
    uploading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.value.imageUrl) {
    uni.showToast({ title: '请上传证件照片', icon: 'none' })
    return
  }

  if (uploading.value) {
    uni.showToast({ title: '图片上传中，请稍候', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await certificationApi.submit({
      type: certType.value,
      imageUrl: formData.value.imageUrl,
      description: formData.value.description
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, SUBMIT_SUCCESS_DELAY)
  } catch (error: any) {
    console.error('Submit failed:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.apply-container {
  min-height: 100vh;
  background: #f8f8f8;
  padding: 20rpx;

  .form-section {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;

    .form-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 12rpx;
    }

    .form-subtitle {
      font-size: 24rpx;
      color: #999;
      line-height: 1.6;
      margin-bottom: 30rpx;
    }

    .form-item {
      margin-bottom: 30rpx;

      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }

      .textarea-input {
        width: 100%;
        min-height: 150rpx;
        padding: 20rpx;
        background: #f8f8f8;
        border-radius: 8rpx;
        font-size: 28rpx;
        line-height: 1.6;
        border: 2rpx solid #e0e0e0;

        &:focus {
          border-color: #007aff;
          background: #fff;
        }
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }

      .upload-area {
        width: 100%;
        height: 400rpx;
        background: #f8f8f8;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx dashed #e0e0e0;
        overflow: hidden;
        position: relative;

        &:active {
          background: #f0f0f0;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          border-radius: 8rpx;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;

          .upload-icon {
            font-size: 60rpx;
            color: #999;
            margin-bottom: 10rpx;
          }

          .upload-text {
            font-size: 24rpx;
            color: #999;
          }
        }

        .upload-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8rpx;

          .upload-progress {
            color: #fff;
            font-size: 28rpx;
          }
        }
      }

      .upload-tip {
        display: block;
        font-size: 24rpx;
        color: #faad14;
        margin-top: 12rpx;

        &.success {
          color: #52c41a;
        }
      }
    }

    .submit-btn {
      width: 100%;
      height: 88rpx;
      background: #007AFF;
      color: #fff;
      border-radius: 8rpx;
      font-size: 32rpx;
      margin-top: 40rpx;
      border: none;

      &::after {
        border: none;
      }

      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>
