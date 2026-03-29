<template>
  <view class="profile-container">
    <view class="profile-header">
      <view class="avatar-wrapper" @click="handleChooseAvatar">
        <image
          class="avatar"
          :src="
            authStore.userInfo?.avatarUrl || '/static/images/default-avatar.png'
          "
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
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores';
import { authApi, fileApi } from '@/api';
import { Gender } from '@/types/enums';

const authStore = useAuthStore();

const formData = ref({
  nickname: '',
  gender: Gender.UNKNOWN,
});

const loading = ref(false);
const avatarLoading = ref(false);

onMounted(() => {
  if (authStore.userInfo) {
    formData.value.nickname = authStore.userInfo.nickname || '';
    formData.value.gender = authStore.userInfo.gender || Gender.UNKNOWN;
  }
});

const handleChooseAvatar = async () => {
  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    });

    // H5端可能返回tempFiles而不是tempFilePaths
    let filePath = result.tempFilePaths?.[0];
    if (!filePath && result.tempFiles?.[0]) {
      // H5端兼容：使用tempFiles中的路径或base64
      const tempFile = result.tempFiles[0];
      if (tempFile.path) {
        filePath = tempFile.path;
      } else if (tempFile.base64) {
        // 转换为data URL格式
        filePath = `data:image/${tempFile.name?.split('.').pop() || 'jpeg'};base64,${tempFile.base64}`;
      }
    }

    if (!filePath) {
      throw new Error('无法获取图片文件');
    }

    avatarLoading.value = true;
    console.log('Selected file path:', filePath);

    const { url } = await fileApi.uploadAvatar(filePath);
    console.log('Upload success, url:', url);

    // 更新用户头像
    await authApi.updateUser({ avatarUrl: url });
    authStore.updateUserInfo({ ...authStore.userInfo, avatarUrl: url });

    uni.showToast({
      title: '头像更新成功',
      icon: 'success',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    uni.showToast({
      title: '头像更新失败',
      icon: 'none',
    });
  } finally {
    avatarLoading.value = false;
  }
};

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
    const res = await authApi.updateUser({
      nickname: formData.value.nickname,
      gender: formData.value.gender,
    });

    authStore.updateUserInfo(res.data);
    // uni.setStorageSync('userInfo', res.data);

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
.profile-container {
  min-height: 100vh;
  background: #f8f8f8;

  .profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 40rpx;
    background: #fff;
    margin-bottom: 20rpx;

    .avatar-wrapper {
      position: relative;

      .avatar {
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        margin-bottom: 24rpx;
        background: #f0f0f0;
      }

      .avatar-edit {
        position: absolute;
        bottom: 20rpx;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.5);
        padding: 4rpx 16rpx;
        border-radius: 20rpx;

        .edit-icon {
          font-size: 20rpx;
          color: #fff;
        }
      }
    }

    .user-info {
      text-align: center;

      .nickname {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }

      .mobile {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .profile-form {
    padding: 40rpx;

    .form-item {
      margin-bottom: 40rpx;

      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }

      .input {
        width: 100%;
        height: 88rpx;
        padding: 0 24rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        font-size: 28rpx;
        background: #f8f8f8;

        &:focus {
          border-color: #007aff;
          background: #fff;
        }
      }

      .gender-options {
        display: flex;
        gap: 20rpx;

        .gender-option {
          flex: 1;
          height: 88rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          font-size: 28rpx;
          color: #666;
          background: #f8f8f8;

          &.active {
            border-color: #007aff;
            background: #007aff;
            color: #fff;
          }
        }
      }
    }

    .save-btn {
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
