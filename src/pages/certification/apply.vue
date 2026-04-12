<template>
  <view class="apply-container">
    <view class="form-section">
      <view class="form-title">{{ certTypeName }}</view>

      <view class="form-item">
        <text class="label">真实姓名</text>
        <input v-model="formData.realName" placeholder="请输入真实姓名" />
      </view>

      <view class="form-item">
        <text class="label">证件号码</text>
        <input v-model="formData.idNumber" placeholder="请输入证件号码" />
      </view>

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

      <button class="submit-btn" @click="handleSubmit" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { certificationApi } from '@/api/modules/certification'

const certType = ref('')
const certTypeName = ref('身份认证')
const submitting = ref(false)

const formData = ref({
  realName: '',
  idNumber: '',
  imageUrl: ''
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  certType.value = currentPage.$route?.query?.type || ''

  const typeMap: Record<string, string> = {
    'id_card': '身份证认证',
    'student': '学生认证',
    'enterprise': '企业认证'
  }
  certTypeName.value = typeMap[certType.value] || '认证申请'
})

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      formData.value.imageUrl = res.tempFilePaths[0]
    }
  })
}

const handleSubmit = async () => {
  if (!formData.value.realName) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (!formData.value.idNumber) {
    uni.showToast({ title: '请输入证件号码', icon: 'none' })
    return
  }
  if (!formData.value.imageUrl) {
    uni.showToast({ title: '请上传证件照片', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await certificationApi.submit({
      type: certType.value,
      imageUrl: formData.value.imageUrl,
      description: `姓名: ${formData.value.realName}, 证件号: ${formData.value.idNumber}`
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

      input {
        width: 100%;
        height: 80rpx;
        padding: 0 20rpx;
        background: #f8f8f8;
        border-radius: 8rpx;
        font-size: 28rpx;
      }

      .upload-area {
        width: 100%;
        height: 300rpx;
        background: #f8f8f8;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;

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

      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>
