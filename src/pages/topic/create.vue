<template>
  <view class="create-topic-container">
    <view class="form-section">
      <!-- 话题名称 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">话题名称</text>
          <text class="required">*</text>
        </view>
        <input
          v-model="formData.name"
          class="form-input"
          placeholder="请输入话题名称（1-100字）"
          maxlength="100"
          @blur="checkTopicName"
        />
        <text v-if="nameError" class="error-text">{{ nameError }}</text>
      </view>

      <!-- 话题描述 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">话题描述</text>
          <text class="optional">（选填）</text>
        </view>
        <textarea
          v-model="formData.description"
          class="form-textarea"
          placeholder="请输入话题描述（最多180字）"
          maxlength="180"
        />
        <text class="char-count">{{ formData.description?.length || 0 }}/180</text>
      </view>

      <!-- 封面图片 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">封面图片</text>
          <text class="required">*</text>
        </view>

        <!-- 默认封面选择 -->
        <view class="cover-section">
          <text class="section-title">选择默认封面</text>
          <scroll-view class="default-covers-scroll" scroll-x>
            <view class="default-covers-list">
              <view
                v-for="cover in defaultCovers"
                :key="cover.id"
                class="cover-item"
                :class="{ active: selectedCoverId === cover.id }"
                @click="selectDefaultCover(cover)"
              >
                <image :src="cover.url" mode="aspectFill" class="cover-image" />
                <view v-if="selectedCoverId === cover.id" class="cover-check">
                  <text class="check-icon">✓</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 自定义上传 -->
        <view class="upload-section">
          <text class="section-title">或上传自定义封面</text>
          <view v-if="formData.coverImage && !selectedCoverId" class="uploaded-cover">
            <image :src="formData.coverImage" mode="aspectFill" class="preview-image" />
            <view class="delete-btn" @click="removeCustomCover">
              <text class="delete-icon">✕</text>
            </view>
          </view>
          <button v-else class="upload-btn" @click="uploadCustomCover">
            <uni-icons type="image" size="24" color="#999" />
            <text class="upload-text">上传图片</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button class="submit-btn" :disabled="!canSubmit || submitting" @click="handleSubmit">
        {{ submitting ? '创建中...' : '创建话题' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { createTopic, searchTopics } from '@/api';
import { DEFAULT_TOPIC_COVERS, type TopicCover } from '@/config/topic-covers';
import { fileApi } from '@/api';

const formData = ref({
  name: '',
  description: '',
  coverImage: '',
});

const defaultCovers = ref<TopicCover[]>(DEFAULT_TOPIC_COVERS);
const selectedCoverId = ref<string>('');
const nameError = ref('');
const submitting = ref(false);
let checkNameTimer: ReturnType<typeof setTimeout> | null = null;

// 选择默认封面
const selectDefaultCover = (cover: TopicCover) => {
  selectedCoverId.value = cover.id;
  formData.value.coverImage = cover.url;
};

// 上传自定义封面
const uploadCustomCover = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0];

      uni.showLoading({ title: '上传中...', mask: true });

      try {
        const uploadRes = await fileApi.uploadImage(tempFilePath);
        if (uploadRes.code === 0) {
          formData.value.coverImage = uploadRes.data.url;
          selectedCoverId.value = ''; // 清除默认封面选择
          uni.hideLoading();
          uni.showToast({
            title: '上传成功',
            icon: 'success',
            duration: 1500,
          });
        } else {
          throw new Error(uploadRes.message || '上传失败');
        }
      } catch (error: any) {
        uni.hideLoading();
        let errorMsg = '上传失败';

        // 细化错误提示
        if (error.message?.includes('timeout') || error.message?.includes('超时')) {
          errorMsg = '上传超时，请检查网络后重试';
        } else if (error.message?.includes('network') || error.message?.includes('网络')) {
          errorMsg = '网络异常，请检查网络连接';
        } else if (error.message?.includes('size') || error.message?.includes('大小')) {
          errorMsg = '图片过大，请选择小于5MB的图片';
        } else if (error.message) {
          errorMsg = error.message;
        }

        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000,
        });
      }
    },
    fail: (error) => {
      console.error('选择图片失败:', error);
      if (error.errMsg?.includes('cancel')) {
        // 用户取消，不提示
        return;
      }
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    },
  });
};

// 删除自定义封面
const removeCustomCover = () => {
  formData.value.coverImage = '';
};

// 检查话题名称是否重复（带防抖）
const checkTopicName = async () => {
  if (checkNameTimer) {
    clearTimeout(checkNameTimer);
  }

  if (!formData.value.name.trim()) {
    nameError.value = '';
    return;
  }

  checkNameTimer = setTimeout(async () => {
    try {
      const res = await searchTopics({
        keyword: formData.value.name.trim(),
        page: 1,
        pageSize: 10,
      });

      if (res.code === 0) {
        // 精确匹配检查
        const exactMatch = res.data.list.find(
          (topic) => topic.name === formData.value.name.trim()
        );
        if (exactMatch) {
          nameError.value = '该话题名称已存在';
        } else {
          nameError.value = '';
        }
      }
    } catch (error: any) {
      console.error('检查话题名称失败:', error);
    }
  }, 500);
};

// 是否可以提交
const canSubmit = computed(() => {
  return (
    formData.value.name.trim().length > 0 &&
    formData.value.name.trim().length <= 100 &&
    formData.value.coverImage.length > 0 &&
    !nameError.value
  );
});

// 提交创建
const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return;

  // 最后再检查一次名称
  await checkTopicName();
  if (nameError.value) {
    uni.showToast({
      title: nameError.value,
      icon: 'none',
    });
    return;
  }

  submitting.value = true;

  try {
    const res = await createTopic({
      name: formData.value.name.trim(),
      description: formData.value.description?.trim() || '',
      coverImage: formData.value.coverImage,
    });

    if (res.code === 0) {
      uni.showToast({
        title: '创建成功',
        icon: 'success',
      });

      // 延迟跳转到话题详情页
      setTimeout(() => {
        uni.navigateBack({
          success: () => {
            // 返回后刷新列表（通过事件总线通知）
            uni.$emit('topic-created', res.data);
          },
          fail: () => {
            // 如果无法返回（比如直接进入创建页），则跳转到详情页
            uni.redirectTo({
              url: `/pages/topic/detail?id=${res.data.id}`,
            });
          },
        });
      }, 1500);
    } else {
      throw new Error(res.message || '创建失败');
    }
  } catch (error: any) {
    let errorMsg = '创建失败';

    // 细化错误提示
    if (error.message?.includes('已存在')) {
      errorMsg = '话题名称已存在，请换一个名称';
    } else if (error.message?.includes('timeout') || error.message?.includes('超时')) {
      errorMsg = '请求超时，请检查网络后重试';
    } else if (error.message?.includes('network') || error.message?.includes('网络')) {
      errorMsg = '网络异常，请检查网络连接';
    } else if (error.message?.includes('401') || error.message?.includes('未登录')) {
      errorMsg = '登录已过期，请重新登录';
      // 跳转到登录页
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/auth/login' });
      }, 1500);
    } else if (error.message) {
      errorMsg = error.message;
    }

    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000,
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.create-topic-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.form-section {
  background-color: #fff;
  padding: 40rpx 30rpx;
}

.form-item {
  margin-bottom: 40rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;

  .label-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }

  .required {
    margin-left: 8rpx;
    color: #ff4d4f;
    font-size: 28rpx;
  }

  .optional {
    margin-left: 8rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.form-input {
  width: 100%;
  padding: 24rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.char-count {
  display: block;
  margin-top: 12rpx;
  text-align: right;
  font-size: 24rpx;
  color: #999;
}

.error-text {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #ff4d4f;
}

.cover-section {
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.default-covers-scroll {
  white-space: nowrap;
}

.default-covers-list {
  display: inline-flex;
  gap: 20rpx;
}

.cover-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 3rpx solid transparent;

  &.active {
    border-color: #1890ff;
  }

  .cover-image {
    width: 100%;
    height: 100%;
  }

  .cover-check {
    position: absolute;
    top: 0;
    right: 0;
    width: 40rpx;
    height: 40rpx;
    background: linear-gradient(135deg, transparent 50%, #1890ff 50%);
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 4rpx;

    .check-icon {
      font-size: 20rpx;
      color: #fff;
      font-weight: bold;
    }
  }
}

.upload-section {
  .uploaded-cover {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 12rpx;
    overflow: hidden;

    .preview-image {
      width: 100%;
      height: 100%;
    }

    .delete-btn {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 48rpx;
      height: 48rpx;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .delete-icon {
        font-size: 28rpx;
        color: #fff;
      }
    }
  }

  .upload-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 200rpx;
    height: 200rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    border: 2rpx dashed #d9d9d9;

    .upload-text {
      margin-top: 12rpx;
      font-size: 24rpx;
      color: #999;
    }
  }
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  border: none;

  &:disabled {
    background: #d9d9d9;
    color: #999;
  }
}
</style>
