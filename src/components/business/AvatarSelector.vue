<template>
  <view class="avatar-selector-modal">
    <!-- 标签页 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'preset' }"
        @click="activeTab = 'preset'"
      >
        预设头像
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'custom' }"
        @click="activeTab = 'custom'"
      >
        自定义上传
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 预设头像网格 (7x7) -->
      <view v-if="activeTab === 'preset'" class="avatar-selector">
        <view
          v-for="i in 49"
          :key="i"
          class="avatar-item"
          :class="{ selected: isSelected('preset', String(i)) }"
          @click="selectPreset(i)"
        >
          <view :class="`sprite-avatar avatar-${i}`" />
        </view>
      </view>

      <!-- 自定义上传区域 -->
      <view v-else class="custom-upload">
        <view class="upload-area" @click="chooseImage">
          <text class="upload-icon">📤</text>
          <text class="upload-text">点击选择图片</text>
        </view>
        <image
          v-if="previewUrl"
          :src="previewUrl"
          mode="aspectFill"
          class="preview-image"
        />
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-confirm" @click="handleConfirm">确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAvatarStore } from '@/stores/avatar';
import type { AvatarOption } from '@/types/avatar';

// 使用头像状态管理
const avatarStore = useAvatarStore();

// 定义事件
const emit = defineEmits<{
  confirm: [avatar: AvatarOption];
  cancel: [];
}>();

// 当前活跃标签页
const activeTab = ref<'preset' | 'custom'>('preset');

// 预览图片 URL
const previewUrl = ref('');

// 临时选择的头像
const tempSelection = ref<AvatarOption | null>(null);

/**
 * 选择预设头像
 * @param id 头像 ID (1-49)
 */
const selectPreset = (id: number) => {
  tempSelection.value = {
    type: 'preset',
    value: String(id),
    displayUrl: ''
  };
};

/**
 * 选择自定义图片
 * 调用 uni.chooseImage API 打开图片选择器
 */
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFilePaths[0];
      previewUrl.value = filePath;
      tempSelection.value = {
        type: 'custom',
        value: filePath,
        displayUrl: filePath
      };
    },
    fail: () => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
    }
  });
};

/**
 * 检查是否已选中
 * @param type 头像类型
 * @param value 头像值
 */
const isSelected = (type: string, value: string): boolean => {
  return tempSelection.value?.type === type && tempSelection.value?.value === value;
};

/**
 * 处理确认按钮
 * 保存选择到状态管理并触发 confirm 事件
 */
const handleConfirm = () => {
  if (tempSelection.value) {
    avatarStore.setSelectedAvatar(tempSelection.value);
    emit('confirm', tempSelection.value);
  } else {
    uni.showToast({
      title: '请先选择头像',
      icon: 'error'
    });
  }
};

/**
 * 处理取消按钮
 * 触发 cancel 事件，关闭选择器
 */
const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="scss">
@import '@/assets/styles/avatar.scss';

.avatar-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 999;

  .tabs {
    display: flex;
    background: #fff;
    border-bottom: 1rpx solid #f0f0f0;

    .tab-item {
      flex: 1;
      padding: 20rpx;
      text-align: center;
      font-size: 28rpx;
      color: #999;
      border-bottom: 4rpx solid transparent;
      transition: all 0.3s;
      cursor: pointer;

      &.active {
        color: #333;
        border-bottom-color: #007aff;
      }
    }
  }

  .content-wrapper {
    flex: 1;
    overflow-y: auto;
    background: #fff;
  }

  .custom-upload {
    padding: 40rpx 30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .upload-area {
      width: 100%;
      height: 300rpx;
      border: 2rpx dashed #d9d9d9;
      border-radius: 12rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      background: #fafafa;

      &:active {
        background: #f0f0f0;
        border-color: #007aff;
      }

      .upload-icon {
        font-size: 80rpx;
        margin-bottom: 20rpx;
      }

      .upload-text {
        font-size: 28rpx;
        color: #666;
      }
    }

    .preview-image {
      width: 200rpx;
      height: 200rpx;
      border-radius: 12rpx;
      margin-top: 30rpx;
      object-fit: cover;
    }
  }

  .action-buttons {
    display: flex;
    gap: 20rpx;
    padding: 30rpx;
    background: #fff;
    border-top: 1rpx solid #f0f0f0;

    button {
      flex: 1;
      padding: 20rpx;
      border-radius: 8rpx;
      font-size: 28rpx;
      font-weight: 500;
      transition: all 0.3s;
      border: none;
      cursor: pointer;

      &.btn-cancel {
        background: #f0f0f0;
        color: #333;

        &:active {
          background: #e0e0e0;
        }
      }

      &.btn-confirm {
        background: #007aff;
        color: #fff;

        &:active {
          background: #0051d5;
        }
      }
    }
  }
}
</style>
