<template>
  <view class="apply-container">
    <view class="form-section">
      <view class="form-title">{{ certTypeName }}</view>
      <view class="form-subtitle">{{ certTypeDescription }}</view>

      <view class="form-item">
        <text class="label">上传证件照片</text>
        <view class="upload-area" @click="chooseImage">
          <image v-if="formData.imageUrl" :src="formData.imageUrl" mode="aspectFit" class="preview-image" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">点击上传</text>
          </view>
        </view>
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

      <button class="submit-btn" @click="handleSubmit" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { certificationApi, type CertificationType } from '@/api/modules/certification'
import { fileApi } from '@/api'

const certType = ref('')
const certTypeName = ref('认证申请')
const certTypeDescription = ref('')
const submitting = ref(false)
const uploading = ref(false)

const formData = ref({
  imageUrl: '',
  description: ''
})

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  certType.value = currentPage.options?.type || ''

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
})

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 获取临时文件路径
      let tempFilePath = ''
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        tempFilePath = res.tempFilePaths[0]
      } else if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFile = res.tempFiles[0]
        if (tempFile.path) {
          tempFilePath = tempFile.path
        } else if (tempFile.base64) {
          const ext = tempFile.name?.split('.').pop() || 'jpeg'
          tempFilePath = `data:image/${ext};base64,${tempFile.base64}`
        }
      }

      if (tempFilePath) {
        // 先显示预览
        formData.value.imageUrl = tempFilePath
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
      title: '上传失败',
      icon: 'none'
    })
    formData.value.imageUrl = ''
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
    }, 1500)
  } catch (error) {
    console.error('Submit failed:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
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
