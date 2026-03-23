<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">欢迎回来</text>
      <text class="subtitle">登录您的账号</text>
    </view>

    <view class="login-form">
      <view class="form-item">
        <text class="label">手机号</text>
        <input
          v-model="formData.mobile"
          class="input"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <input
          v-model="formData.password"
          class="input"
          type="password"
          placeholder="请输入密码"
          maxlength="20"
        />
      </view>

      <button class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <view class="form-footer">
        <text class="link" @click="goToRegister">注册账号</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores';

const authStore = useAuthStore();

const formData = ref({
  mobile: '13800138001',
  password: '123456',
});

const loading = ref(false);

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
    const aa = await authStore.login(formData.value);
    console.log(99, aa);
    uni.showToast({
      title: '登录成功11',
      // https://uniapp.dcloud.net.cn/api/ui/prompt.html#showtoast
      // success: () => {
      //   uni.switchTab({
      //     url: '/pages/tabbar/home',
      //   });
      // },
      // complete: () => {
      //   console.log(123);
      //   uni.hideToast();
      // },
    });
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/tabbar/home',
      });
      // http://192.168.100.199:3008/#/pages/auth/login
      // http://192.168.100.1:3008/#/pages/auth/login
    }, 1500);
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/auth/register',
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
      justify-content: center;
      margin-top: 40rpx;

      .link {
        font-size: 28rpx;
        color: #007aff;
      }
    }
  }
}
</style>
