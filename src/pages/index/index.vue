<template>
  <view class="index-container">
    <view v-if="authStore.isLoggedIn" class="logged-in">
      <view class="welcome-section">
        <text class="welcome-text">欢迎回来，{{ authStore.userInfo?.nickname }}</text>
      </view>
      <button class="go-home-btn" @click="goToHome">进入首页</button>
    </view>
    <view v-else class="not-logged-in">
      <view class="logo-section">
        <text class="logo">WeTogether</text>
        <text class="slogan">遇见美好，从这里开始</text>
      </view>
      <view class="action-buttons">
        <button class="login-btn" @click="goToLogin">登录</button>
        <button class="register-btn" @click="goToRegister">注册</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

onMounted(() => {
  authStore.init()
})

const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/auth/login'
  })
}

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/auth/register'
  })
}

const goToHome = () => {
  uni.switchTab({
    url: '/pages/tabbar/home'
  })
}
</script>

<style scoped lang="scss">
.index-container {
  
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .logged-in {
    text-align: center;
    padding: 40rpx;

    .welcome-section {
      margin-bottom: 60rpx;

      .welcome-text {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
      }
    }

    .go-home-btn {
      width: 400rpx;
      height: 88rpx;
      line-height: 88rpx;
      background: #fff;
      color: #667eea;
      font-size: 32rpx;
      border-radius: 44rpx;
      border: none;
      font-weight: bold;
    }
  }

  .not-logged-in {
    text-align: center;
    padding: 40rpx;

    .logo-section {
      margin-bottom: 80rpx;

      .logo {
        display: block;
        font-size: 64rpx;
        color: #fff;
        font-weight: bold;
        margin-bottom: 20rpx;
      }

      .slogan {
        display: block;
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 30rpx;

      .login-btn,
      .register-btn {
        width: 400rpx;
        height: 88rpx;
        line-height: 88rpx;
        font-size: 32rpx;
        border-radius: 44rpx;
        border: none;
        font-weight: bold;
      }

      .login-btn {
        background: #fff;
        color: #667eea;
      }

      .register-btn {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border: 2rpx solid #fff;
      }
    }
  }
}
</style>