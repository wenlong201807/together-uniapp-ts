<template>
  <view class="profile-container">
    <view class="profile-header">
      <view class="avatar-wrapper" @click="showAvatarSelector">
        <!-- 预设 MBTI 头像显示 -->
        <view
          v-if="selectedAvatar.type === 'preset' && selectedAvatar.icon"
          class="avatar mbti-avatar"
        >
          <text class="mbti-icon">{{ selectedAvatar.icon }}</text>
        </view>
        <!-- 自定义头像显示 -->
        <image
          v-else
          class="avatar"
          :src="selectedAvatar.displayUrl || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="avatar-edit">
          <text class="edit-icon">编辑</text>
        </view>
      </view>
      <view class="user-info">
        <text class="nickname">{{ authStore.userInfo?.nickname }}</text>
        <text class="mobile">{{ authStore.userInfo?.mobile }}</text>
      </view>
    </view>

    <view class="profile-form">
      <view class="form-item">
        <text class="label">昵称</text>
        <input
          v-model="formData.nickname"
          class="input"
          type="text"
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-options">
          <view
            :class="['gender-option', formData.gender === 1 ? 'active' : '']"
            @click="formData.gender = 1"
          >
            <text>男</text>
          </view>
          <view
            :class="['gender-option', formData.gender === 2 ? 'active' : '']"
            @click="formData.gender = 2"
          >
            <text>女</text>
          </view>
        </view>
      </view>

      <button class="save-btn" :disabled="loading" @click="handleSave">
        {{ loading ? '保存中...' : '保存' }}
      </button>
    </view>

    <!-- 头像选择器弹窗 -->
    <view v-if="showSelector" class="avatar-selector-modal">
      <!-- 标签页 -->
      <view class="modal-overlay" @click="showSelector = false" />
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择头像</text>
          <text class="modal-close" @click="showSelector = false">✕</text>
        </view>

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

        <!-- 预设头像网格 -->
        <view v-if="activeTab === 'preset'" class="avatar-selector">
          <view
            v-for="avatar in mbtiAvatars"
            :key="avatar.id"
            class="avatar-item"
            :class="{ selected: isSelected('preset', String(avatar.id)) }"
            @click="selectPreset(avatar.id)"
          >
            <view class="mbti-avatar-item">
              <text class="mbti-icon">{{ avatar.icon }}</text>
              <text class="mbti-type">{{ avatar.type }}</text>
            </view>
          </view>
        </view>

        <!-- 自定义上传 -->
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

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button class="btn-cancel" @click="showSelector = false">取消</button>
          <button class="btn-confirm" :disabled="!tempSelection" @click="handleAvatarConfirm">
            确认
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useAuthStore } from '@/stores';
import { authApi, fileApi } from '@/api';
import { Gender } from '@/types/enums';
import { MBTI_AVATARS, getAvatarDisplay } from '@/utils/avatar';
import { eventBus, EVENTS } from '@/utils/event-bus';
import '@/assets/styles/avatar.scss';

const authStore = useAuthStore();

const formData = ref({
  nickname: '',
  gender: Gender.UNKNOWN,
});

const loading = ref(false);
const showSelector = ref(false);
const activeTab = ref<'preset' | 'custom'>('preset');
const previewUrl = ref('');
const tempSelection = ref<any>(null);
const mbtiAvatars = MBTI_AVATARS;

// 当前选择的头像状态
const selectedAvatar = reactive({
  type: 'custom' as 'preset' | 'custom',
  value: '1',
  displayUrl: '',
  icon: '',
  mbtiType: '',
});

onMounted(() => {
  if (authStore.userInfo) {
    formData.value.nickname = authStore.userInfo.nickname || '';
    formData.value.gender = authStore.userInfo.gender || Gender.UNKNOWN;

    // 使用工具函数初始化头像显示
    const avatarDisplay = getAvatarDisplay(
      authStore.userInfo.avatarId,
      authStore.userInfo.avatarUrl
    );
    Object.assign(selectedAvatar, avatarDisplay);
  }
});

/**
 * 显示头像选择器
 */
const showAvatarSelector = () => {
  showSelector.value = true;
  activeTab.value = 'preset';
  tempSelection.value = null;
  previewUrl.value = '';
};

/**
 * 选择预设头像
 */
const selectPreset = (id: number) => {
  const mbtiAvatar = MBTI_AVATARS.find(a => a.id === id);
  if (mbtiAvatar) {
    tempSelection.value = {
      type: 'preset',
      value: String(id),
      displayUrl: '',
      icon: mbtiAvatar.icon,
      mbtiType: mbtiAvatar.type,
    };
  }
};

/**
 * 选择自定义图片
 */
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      let filePath = res.tempFilePaths?.[0];
      if (!filePath && res.tempFiles?.[0]) {
        const tempFile = res.tempFiles[0];
        if (tempFile.path) {
          filePath = tempFile.path;
        } else if (tempFile.base64) {
          filePath = `data:image/${tempFile.name?.split('.').pop() || 'jpeg'};base64,${tempFile.base64}`;
        }
      }

      if (filePath) {
        previewUrl.value = filePath;
        tempSelection.value = {
          type: 'custom',
          value: filePath,
          displayUrl: filePath,
        };
      }
    },
    fail: () => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    },
  });
};

/**
 * 判断是否已选中
 */
const isSelected = (type: string, value: string): boolean => {
  return tempSelection.value?.type === type && tempSelection.value?.value === value;
};

/**
 * 处理头像确认
 */
const handleAvatarConfirm = async () => {
  if (!tempSelection.value) {
    return;
  }

  try {
    // 如果是自定义上传，需要先上传文件
    if (tempSelection.value.type === 'custom') {
      await uploadCustomAvatar(tempSelection.value.value);
    } else {
      // 预设头像直接更新状态
      Object.assign(selectedAvatar, tempSelection.value);
    }

    showSelector.value = false;
    uni.showToast({
      title: '头像已更新',
      icon: 'success',
    });
  } catch (error) {
    console.error('Avatar confirm error:', error);
    uni.showToast({
      title: '头像更新失败',
      icon: 'none',
    });
  }
};

/**
 * 上传自定义头像
 */
const uploadCustomAvatar = async (filePath: string) => {
  try {
    const { url } = await fileApi.uploadAvatar(filePath);
    selectedAvatar.type = 'custom';
    selectedAvatar.displayUrl = url;
    selectedAvatar.icon = '';
    selectedAvatar.mbtiType = '';
  } catch (error) {
    console.error('Upload custom avatar error:', error);
    throw error;
  }
};

/**
 * 保存用户信息
 */
const handleSave = async () => {
  if (!formData.value.nickname) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none',
    });
    return;
  }

  loading.value = true;
  try {
    // 构建更新数据，根据头像类型发送不同字段
    const updateData: any = {
      nickname: formData.value.nickname,
      gender: formData.value.gender,
    };

    // 如果头像有变化，添加头像字段
    if (selectedAvatar.type === 'preset') {
      // 选择预设头像时，设置 avatarId 并清空 avatarUrl
      updateData.avatarId = parseInt(selectedAvatar.value);
      updateData.avatarUrl = null;
    } else if (selectedAvatar.displayUrl) {
      // 选择自定义头像时，设置 avatarUrl 并清空 avatarId
      updateData.avatarUrl = selectedAvatar.displayUrl;
      updateData.avatarId = null;
    }

    const res = await authApi.updateUser(updateData);

    // 更新本地用户信息
    authStore.updateUserInfo(res.data);

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error('Save profile error:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.profile-container {
  min-height: 100vh;
  background: $bg-secondary;

  .profile-header {
    @include flex-center;
    flex-direction: column;
    padding: $padding-xxl $padding-xl;
    background: $bg-primary;
    margin-bottom: $margin-md;

    .avatar-wrapper {
      position: relative;
      @include transition(transform);

      &:active {
        transform: scale(0.95);
      }

      .avatar {
        width: $avatar-size-xl;
        height: $avatar-size-xl;
        border-radius: $radius-circle;
        margin-bottom: $margin-lg;
        background: $bg-tertiary;
        display: block;

        &.mbti-avatar {
          @include flex-center;
          background: $gradient-primary;

          .mbti-icon {
            font-size: 80rpx;
          }
        }
      }

      .avatar-edit {
        position: absolute;
        bottom: $spacing-md;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.6);
        padding: $padding-xs $padding-sm;
        border-radius: $radius-full;

        .edit-icon {
          font-size: $font-size-xs;
          color: $bg-primary;
        }
      }
    }

    .user-info {
      text-align: center;

      .nickname {
        display: block;
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-xs;
      }

      .mobile {
        display: block;
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }
  }

  .profile-form {
    padding: $padding-xl;

    .form-item {
      margin-bottom: $margin-xl;

      .label {
        display: block;
        font-size: $font-size-base;
        color: $text-primary;
        margin-bottom: $margin-sm;
        font-weight: $font-weight-medium;
      }

      .input {
        width: 100%;
        height: $input-height-lg;
        padding: 0 $padding-lg;
        border: 2rpx solid $border-color;
        border-radius: $radius-base;
        font-size: $font-size-base;
        background: $bg-secondary;
        @include transition(all);

        &:focus {
          border-color: $primary-color;
          background: $bg-primary;
        }
      }

      .gender-options {
        display: flex;
        gap: $spacing-md;

        .gender-option {
          flex: 1;
          height: $input-height-lg;
          @include flex-center;
          border: 2rpx solid $border-color;
          border-radius: $radius-base;
          font-size: $font-size-base;
          color: $text-secondary;
          background: $bg-secondary;
          @include transition(all);

          &:active {
            transform: scale(0.98);
          }

          &.active {
            border-color: $primary-color;
            background: $primary-color;
            color: $bg-primary;
          }
        }
      }
    }

    .save-btn {
      width: 100%;
      height: $button-height-lg;
      line-height: $button-height-lg;
      background: $primary-color;
      color: $bg-primary;
      font-size: $font-size-lg;
      border-radius: $radius-base;
      border: none;
      margin-top: $margin-xl;
      @include active-scale;

      &:disabled {
        opacity: 0.6;
      }

      &::after {
        border: none;
      }
    }
  }

  // 头像选择器弹窗样式
  .avatar-selector-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-index-modal;
    display: flex;
    align-items: flex-end;

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      width: 100%;
      background: $bg-primary;
      border-radius: $radius-xl $radius-xl 0 0;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      z-index: $z-index-modal + 1;
      animation: slideUp $duration-base $ease-out;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $padding-lg $padding-xl;
        border-bottom: 1rpx solid $divider-color;

        .modal-title {
          font-size: $font-size-lg;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }

        .modal-close {
          font-size: $font-size-xl;
          color: $text-tertiary;
          @include transition(opacity);

          &:active {
            opacity: 0.6;
          }
        }
      }

      .tabs {
        display: flex;
        border-bottom: 1rpx solid $divider-color;

        .tab-item {
          flex: 1;
          padding: $padding-md;
          text-align: center;
          font-size: $font-size-base;
          color: $text-tertiary;
          border-bottom: 4rpx solid transparent;
          @include transition(all);

          &.active {
            color: $primary-color;
            border-bottom-color: $primary-color;
            font-weight: $font-weight-medium;
          }
        }
      }

      .avatar-selector {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: $spacing-md;
        padding: $padding-lg;
        overflow-y: auto;
        flex: 1;

        .avatar-item {
          position: relative;
          border-radius: $radius-md;
          overflow: hidden;
          border: 3rpx solid transparent;
          @include transition(all);
          aspect-ratio: 1;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

          &:active {
            transform: scale(0.95);
          }

          &.selected {
            border-color: $primary-color;
            box-shadow: 0 0 20rpx rgba(0, 122, 255, 0.5);
          }

          .mbti-avatar-item {
            width: 100%;
            height: 100%;
            @include flex-center;
            flex-direction: column;
            gap: $spacing-xs;

            .mbti-icon {
              font-size: 60rpx;
            }

            .mbti-type {
              font-size: $font-size-xs;
              font-weight: $font-weight-bold;
              color: $text-primary;
            }
          }
        }
      }

      .custom-upload {
        padding: $padding-xl $padding-lg;
        overflow-y: auto;
        flex: 1;

        .upload-area {
          @include flex-center;
          flex-direction: column;
          height: 300rpx;
          border: 2rpx dashed $border-color;
          border-radius: $radius-base;
          @include transition(all);

          &:active {
            background: $bg-secondary;
            border-color: $primary-color;
          }

          .upload-icon {
            font-size: 80rpx;
            margin-bottom: $margin-sm;
          }

          .upload-text {
            font-size: $font-size-base;
            color: $text-tertiary;
          }
        }

        .preview-image {
          width: 100%;
          height: 300rpx;
          border-radius: $radius-base;
          margin-top: $margin-lg;
          object-fit: cover;
        }
      }

      .action-buttons {
        display: flex;
        gap: $spacing-md;
        padding: $padding-lg;
        border-top: 1rpx solid $divider-color;

        .btn-cancel,
        .btn-confirm {
          flex: 1;
          height: $button-height-lg;
          line-height: $button-height-lg;
          padding: 0;
          border-radius: $radius-base;
          font-size: $font-size-base;
          border: none;
          text-align: center;
          @include flex-center;
          @include active-scale;

          &::after {
            border: none;
          }
        }

        .btn-cancel {
          background: $bg-tertiary;
          color: $text-primary;
        }

        .btn-confirm {
          background: $primary-color;
          color: $bg-primary;

          &:disabled {
            opacity: 0.6;
          }
        }
      }
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
}
</style>
