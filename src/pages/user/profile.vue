<template>
  <view class="profile-container">
    <view class="profile-header">
      <image
        class="avatar"
        :src="authStore.userInfo?.avatar || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
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
import { Gender } from '@/types/enums';

const authStore = useAuthStore();

const formData = ref({
  nickname: '',
  gender: Gender.UNKNOWN,
});

const loading = ref(false);

onMounted(() => {
  if (authStore.userInfo) {
    formData.value.nickname = authStore.userInfo.nickname || '';
    formData.value.gender = authStore.userInfo.gender || Gender.UNKNOWN;
  }
});

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
    // TODO 缺少接口请求，接口是ok的
    // api/v1/user/me
    uni.showToast({
      title: '保存成功',
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error('Save profile error:', error);
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

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      margin-bottom: 24rpx;
      background: #f0f0f0;
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
