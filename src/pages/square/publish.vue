<template>
  <view class="publish-container">
    <!-- 话题标签 -->
    <view v-if="topicTitle" class="topic-tag">
      <text class="tag-icon">#</text>
      <text class="tag-text">{{ topicTitle }}</text>
    </view>

    <view class="publish-form">
      <!-- 话题选择器（用户主动选择） -->
      <view v-if="!topicTitle" class="form-item">
        <TopicPicker v-model="formData.topicId" />
      </view>

      <view class="form-item">
        <textarea
          v-model="formData.content"
          class="content-input"
          placeholder="分享你的想法..."
          maxlength="180"
          :show-confirm-bar="false"
        />
        <text class="char-count">{{ formData.content.length }}/180</text>
      </view>

      <view class="form-item">
        <view class="section-label">
          <text class="label-text">添加图片</text>
          <text class="label-hint">最多1张</text>
        </view>
        <view class="image-list">
          <view
            v-for="(img, index) in formData.images"
            :key="index"
            class="image-item"
          >
            <image class="image" :src="img" mode="aspectFill" />
            <view class="delete-btn" @click="removeImage(index)">
              <text class="delete-icon">✕</text>
            </view>
          </view>
          <view v-if="formData.images.length < 1" class="add-image-btn" @click="chooseImage">
            <view class="add-icon-wrapper">
              <text class="add-icon">📷</text>
            </view>
            <text class="add-text">添加图片</text>
          </view>
        </view>
      </view>

      <button class="publish-btn" :disabled="loading" @click="handlePublish">
        {{ loading ? '发布中...' : '发布' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSquareStore } from '@/stores'
import { fileApi } from '@/api'
import { triggerAfterFirstPost } from '@/composables/useNPS'
import TopicPicker from '@/components/TopicPicker.vue'

const squareStore = useSquareStore()

const formData = ref({
  content: '',
  images: [] as string[],
  topicId: undefined as number | undefined
})

const topicTitle = ref('')
const loading = ref(false)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  if (options.topicId) {
    const parsedId = parseInt(options.topicId)
    if (!isNaN(parsedId) && parsedId > 0) {
      formData.value.topicId = parsedId
      topicTitle.value = decodeURIComponent(options.topicTitle || '')
    }
  }
})

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // H5端可能返回tempFiles而不是tempFilePaths
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        formData.value.images.push(...res.tempFilePaths)
      } else if (res.tempFiles && res.tempFiles.length > 0) {
        // H5端兼容：使用tempFiles中的路径或base64
        res.tempFiles.forEach((tempFile: any) => {
          if (tempFile.path) {
            formData.value.images.push(tempFile.path)
          } else if (tempFile.base64) {
            // 转换为data URL格式
            const ext = tempFile.name?.split('.').pop() || 'jpeg'
            formData.value.images.push(`data:image/${ext};base64,${tempFile.base64}`)
          }
        })
      }
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

  let uploadedUrls: string[] = []
  try {
    if (formData.value.images.length > 0) {
      uni.showLoading({ title: '上传图片中...', mask: true })

      const uploadPromises = formData.value.images.map(async (localPath) => {
        const result = await fileApi.uploadFile(localPath, { type: 'square' })
        return result.url
      })

      uploadedUrls = await Promise.all(uploadPromises)
      uni.hideLoading()
    }

    await squareStore.createPost({
      content: formData.value.content,
      images: uploadedUrls,
      topicId: formData.value.topicId
    })
    uni.showToast({
      title: '发布成功',
      icon: 'success'
    })

    // 发帖成功后，检查是否需要触发 NPS
    triggerAfterFirstPost()

    setTimeout(() => {
      if (formData.value.topicId) {
        // 如果是从话题页发布，返回话题详情页
        uni.navigateBack()
      } else {
        // 否则跳转到广场页
        uni.switchTab({ url: '/pages/tabbar/square' })
      }
    }, 1500)
  } catch (error) {
    console.error('Publish error:', error)
    uni.hideLoading()
    uni.showToast({
      title: '发布失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.publish-container {
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);

  .topic-tag {
    display: inline-flex;
    align-items: center;
    padding: 12rpx 24rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);

    .tag-icon {
      font-size: 28rpx;
      color: #fff;
      font-weight: bold;
      margin-right: 8rpx;
    }

    .tag-text {
      font-size: 26rpx;
      color: #fff;
      font-weight: 500;
    }
  }

  .publish-form {
    .form-item {
      margin-bottom: 40rpx;

      .content-input {
        width: 100%;
        min-height: 300rpx;
        padding: 24rpx;
        border: 2rpx solid #e8e8e8;
        border-radius: 16rpx;
        font-size: 30rpx;
        line-height: 1.6;
        background: #fff;
        box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
        transition: all 0.3s ease;

        &:focus {
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.15);
        }
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 24rpx;
        color: #999;
        margin-top: 12rpx;
      }

      .section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20rpx;

        .label-text {
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
        }

        .label-hint {
          font-size: 24rpx;
          color: #999;
        }
      }

      .image-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20rpx;

        .image-item {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          border-radius: 16rpx;
          overflow: hidden;
          box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;

          &:active {
            transform: scale(0.98);
          }

          .image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .delete-btn {
            position: absolute;
            top: 12rpx;
            right: 12rpx;
            width: 48rpx;
            height: 48rpx;
            background: rgba(255, 59, 48, 0.95);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 12rpx rgba(255, 59, 48, 0.3);
            backdrop-filter: blur(10rpx);
            transition: all 0.3s ease;

            &:active {
              transform: scale(0.9);
            }

            .delete-icon {
              font-size: 28rpx;
              font-weight: 300;
              line-height: 1;
            }
          }
        }

        .add-image-btn {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          border: 3rpx dashed #d0d7de;
          border-radius: 16rpx;
          background: linear-gradient(135deg, #fafbfc 0%, #f6f8fa 100%);
          overflow: hidden;
          transition: all 0.3s ease;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:active {
            transform: scale(0.98);
            border-color: #667eea;
            background: linear-gradient(135deg, #f0f2ff 0%, #f8f6ff 100%);

            &::before {
              opacity: 1;
            }

            .add-icon-wrapper {
              transform: scale(1.1);
            }
          }

          .add-icon-wrapper {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12rpx;
            transition: transform 0.3s ease;

            .add-icon {
              font-size: 64rpx;
              line-height: 1;
              filter: grayscale(0.3);
            }
          }

          .add-text {
            position: absolute;
            bottom: 24rpx;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24rpx;
            color: #667eea;
            font-weight: 500;
            white-space: nowrap;
          }
        }
      }
    }

    .publish-btn {
      width: 100%;
      height: 96rpx;
      line-height: 96rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
      border-radius: 48rpx;
      border: none;
      margin-top: 60rpx;
      box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        transform: none;
      }

      &::after {
        border: none;
      }
    }
  }
}
</style>