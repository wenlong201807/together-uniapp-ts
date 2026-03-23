<template>
  <view class="mine-container">
    <view class="user-header">
      <image class="avatar" :src="authStore.userInfo?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
      <view class="user-info">
        <text class="nickname">{{ authStore.userInfo?.nickname || '未登录' }}</text>
        <text class="mobile">{{ authStore.userInfo?.mobile || '' }}</text>
      </view>
      <view class="edit-btn" @click="goToProfile">
        <text>编辑</text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goToFriendList">
        <text class="menu-icon">👥</text>
        <text class="menu-text">好友列表</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToFollowing">
        <text class="menu-icon">⭐</text>
        <text class="menu-text">关注列表</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToBlocklist">
        <text class="menu-icon">🚫</text>
        <text class="menu-text">黑名单</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">›</text>
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

const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/user/profile'
  })
}

const goToFriendList = () => {
  uni.navigateTo({
    url: '/pages/friend/list'
  })
}

const goToFollowing = () => {
  uni.navigateTo({
    url: '/pages/friend/following'
  })
}

const goToBlocklist = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/user/settings'
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
.mine-container {
  min-height: 100vh;
  background: #f8f8f8;

  .user-header {
    display: flex;
    align-items: center;
    padding: 60rpx 40rpx;
    background: #fff;
    margin-bottom: 20rpx;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 24rpx;
      background: #f0f0f0;
    }

    .user-info {
      flex: 1;

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

    .edit-btn {
      padding: 12rpx 24rpx;
      background: #007aff;
      color: #fff;
      border-radius: 24rpx;
      font-size: 24rpx;
    }
  }

  .menu-list {
    background: #fff;
    margin-bottom: 20rpx;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .menu-icon {
        font-size: 36rpx;
        margin-right: 20rpx;
      }

      .menu-text {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }

      .menu-arrow {
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