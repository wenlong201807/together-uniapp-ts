<template>
  <view class="settings-container">
    <view class="settings-list">
      <view class="settings-item">
        <text class="settings-label">版本</text>
        <text class="settings-value">1.0.0</text>
      </view>
      <view class="settings-item" @click="clearCache">
        <text class="settings-label">清除缓存</text>
        <text class="settings-arrow">›</text>
      </view>
      <view class="settings-item" @click="showAbout">
        <text class="settings-label">关于我们</text>
        <text class="settings-arrow">›</text>
      </view>
    </view>

    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({
          title: '缓存已清除',
          icon: 'success'
        })
      }
    }
  })
}

const showAbout = () => {
  uni.showModal({
    title: '关于我们',
    content: 'WeTogether - 遇见美好，从这里开始',
    showCancel: false
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        uni.reLaunch({
          url: '/pages/auth/login'
        })
      }
    }
  })
}
</script>

<style scoped lang="scss">
.settings-container {
  min-height: 100vh;
  background: #f8f8f8;

  .settings-list {
    background: #fff;
    margin-bottom: 20rpx;

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .settings-label {
        font-size: 28rpx;
        color: #333;
      }

      .settings-value {
        font-size: 28rpx;
        color: #999;
      }

      .settings-arrow {
        font-size: 36rpx;
        color: #999;
      }
    }
  }

  .logout-section {
    padding: 40rpx;

    .logout-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      background: #fff;
      color: #ff4d4f;
      font-size: 32rpx;
      border-radius: 12rpx;
      border: none;
    }
  }
}
</style>