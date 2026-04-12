<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">欢迎回来</text>
      <text class="subtitle">登录您的账号</text>
    </view>

    <view class="login-form">
      <view class="form-item">
        <text class="label">手机号</text>
        <view class="input-wrapper">
          <input
            v-model="formData.mobile"
            class="input"
            type="number"
            placeholder="请输入手机号"
            maxlength="11"
          />
          <text v-if="formData.mobile" class="clear-icon" @click="formData.mobile = ''">
            ✕
          </text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <view class="password-input">
          <input
            v-model="formData.password"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            maxlength="20"
          />
          <text class="eye-icon" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <button class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <view class="form-footer">
        <text class="link" @click="goToForgotPassword">忘记密码？</text>
        <text class="link" @click="goToRegister">注册账号</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores';
import { CryptoUtil } from '@/utils/crypto';

const authStore = useAuthStore();

const formData = ref({
  mobile: '13800138001',
  password: '123456',
});

const loading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  if (!formData.value.mobile || !formData.value.password) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none',
    });
    return;
  }

  loading.value = true;
  try {
    // 加密密码后再发送
    const encryptedPassword = CryptoUtil.encryptPassword(formData.value.password);
    const aa = await authStore.login({
      mobile: formData.value.mobile,
      password: encryptedPassword,
    });
    console.log(99, aa);
    uni.showToast({
      title: '登录成功',
    });
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/tabbar/home',
      });
    }, 1500);
  } catch (error: any) {
    console.error('Login error:', error);
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/auth/register',
  });
};

const goToForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/auth/forgot-password',
  });
};
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  padding: 80rpx 40rpx;
  background: #fff;

  .login-header {
    margin-bottom: 80rpx;

    .title {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }

    .subtitle {
      display: block;
      font-size: 28rpx;
      color: #999;
    }
  }

  .login-form {
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

      .input-wrapper,
      .password-input {
        position: relative;
        display: flex;
        align-items: center;

        .input {
          flex: 1;
          padding-right: 80rpx;
        }

        .clear-icon,
        .eye-icon {
          position: absolute;
          right: 24rpx;
          width: 40rpx;
          height: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rpx;
          color: #999;
          cursor: pointer;
          user-select: none;
        }

        .eye-icon {
          font-size: 36rpx;
        }
      }
    }

    .login-btn {
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

    .form-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40rpx;

      .link {
        font-size: 28rpx;
        color: #007aff;
      }
    }
  }
}
</style>
