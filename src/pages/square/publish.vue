<template>
  <view class="publish-container">
    <view class="publish-form">
      <view class="form-item">
        <textarea
          v-model="formData.content"
          class="content-input"
          placeholder="分享你的想法..."
          maxlength="500"
          :show-confirm-bar="false"
        />
        <text class="char-count">{{ formData.content.length }}/500</text>
      </view>

      <view class="form-item">
        <view class="image-list">
          <view
            v-for="(img, index) in formData.images"
            :key="index"
            class="image-item"
          >
            <image class="image" :src="img" mode="aspectFill" />
            <view class="delete-btn" @click="removeImage(index)">
              <text>×</text>
            </view>
          </view>
          <view v-if="formData.images.length < 9" class="add-image-btn" @click="chooseImage">
            <text>+</text>
          </view>
        </view>
      </view>

      <button class="publish-btn" :disabled="loading || !formData.content.trim()" @click="handlePublish">
        {{ loading ? '发布中...' : '发布' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSquareStore } from '@/stores'

const squareStore = useSquareStore()

const formData = ref({
  content: '',
  images: [] as string[]
})

const loading = ref(false)

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - formData.value.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.images.push(...res.tempFilePaths)
    }
  })
}

const removeImage = (index: number) => {
  formData.value.images.splice(index, 1)
}

const handlePublish = async () => {
  if (!formData.value.content.trim()) {
    uni.showToast({
      title: '请输入内容',
      icon: 'none'
    })
    return
  }

  loading.value = true
  try {
    await squareStore.createPost({
      content: formData.value.content,
      images: formData.value.images
    })
    uni.showToast({
      title: '发布成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('Publish error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.publish-container {
  min-height: 100vh;
  padding: 40rpx;
  background: #fff;

  .publish-form {
    .form-item {
      margin-bottom: 40rpx;

      .content-input {
        width: 100%;
        min-height: 300rpx;
        padding: 20rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        font-size: 28rpx;
        line-height: 1.6;
        background: #f8f8f8;

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

      .image-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20rpx;

        .image-item {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          border-radius: 12rpx;
          overflow: hidden;

          .image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .delete-btn {
            position: absolute;
            top: 8rpx;
            right: 8rpx;
            width: 40rpx;
            height: 40rpx;
            background: rgba(0, 0, 0, 0.6);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32rpx;
          }
        }

        .add-image-btn {
          width: 100%;
          padding-bottom: 100%;
          border: 2rpx dashed #e0e0e0;
          border-radius: 12rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60rpx;
          color: #999;
          background: #f8f8f8;
        }
      }
    }

    .publish-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      background: #007aff;
      color: #fff;
      font-size: 32rpx;
      border-radius: 12rpx;
      border: none;
      margin-top: 40rpx;

      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>