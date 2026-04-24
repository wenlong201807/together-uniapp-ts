<template>
  <view class="mine-container">
    <view class="user-header">
      <!-- 预设头像显示 -->
      <view
        v-if="avatarDisplay.type === 'preset' && avatarDisplay.icon"
        class="avatar mbti-avatar"
      >
        <text class="mbti-icon">{{ avatarDisplay.icon }}</text>
      </view>
      <!-- 自定义头像显示 -->
      <image
        v-else
        class="avatar"
        :src="avatarDisplay.displayUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="nickname">{{
          authStore.userInfo?.nickname || '未登录'
        }}</text>
        <text class="mobile">{{ authStore.userInfo?.mobile || '' }}</text>
      </view>
      <view class="edit-btn" @click="goToProfile">
        <text>编辑</text>
      </view>
    </view>

    <view class="points-card" @click="goToPoints">
      <view class="points-content">
        <view class="points-info">
          <text class="points-label">我的积分</text>
          <text class="points-value">{{ pointsStore.balance.balance || 0 }}</text>
          <view
            class="continuous-days"
            v-if="pointsStore.signStatus.continuousDays > 0"
          >
            <text>连续签到 {{ pointsStore.signStatus.continuousDays }} 天</text>
          </view>
        </view>
        <view
          class="sign-btn"
          :class="{ signed: pointsStore.signStatus.signedToday, signing: isSigning }"
          @click.stop="handleSign"
        >
          <text>{{
            pointsStore.signStatus.signedToday ? '✓ 已签到' : '签到'
          }}</text>
        </view>
      </view>
      <view class="points-decoration">
        <view class="decoration-circle circle-1" />
        <view class="decoration-circle circle-2" />
        <view class="decoration-circle circle-3" />
      </view>
    </view>

    <view class="invite-card" @click="copyInviteLink">
      <view class="invite-content">
        <view class="invite-info">
          <text class="invite-label">我的邀请码</text>
          <text class="invite-code">{{ authStore.userInfo?.inviteCode || '-' }}</text>
        </view>
        <view class="copy-btn">
          <text>复制链接</text>
        </view>
      </view>
      <view class="invite-decoration">
        <text class="decoration-icon">🎁</text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goToMbti">
        <text class="menu-icon">🧠</text>
        <text class="menu-text">MBTI测试</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPoints">
        <text class="menu-icon">💰</text>
        <text class="menu-text">积分明细</text>
        <text class="menu-arrow">›</text>
      </view>
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
      <view class="menu-item" @click="goToCertification">
        <text class="menu-icon">📋</text>
        <text class="menu-text">认证中心</text>
        <text class="menu-arrow">›</text>
      </view>
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
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAuthStore, usePointsStore } from '@/stores';
import { getAvatarDisplay } from '@/utils/avatar';
import '@/assets/styles/avatar.scss';

const authStore = useAuthStore();
const pointsStore = usePointsStore();
const isSigning = ref(false);

// 计算头像显示信息
const avatarDisplay = computed(() => {
  return getAvatarDisplay(
    authStore.userInfo?.avatarId,
    authStore.userInfo?.avatarUrl
  );
});

onShow(() => {
  if (authStore.isLoggedIn) {
    pointsStore.fetchBalance();
    pointsStore.fetchSignStatus();
  }
});

const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/user/profile',
  });
};

const goToMbti = () => {
  uni.navigateTo({
    url: '/pages/mbti/intro',
  });
};

const goToPoints = () => {
  uni.navigateTo({
    url: '/pages/points/index',
  });
};

const goToCertification = () => {
  uni.navigateTo({
    url: '/pages/certification/index',
  });
};

const goToFriendList = () => {
  uni.navigateTo({
    url: '/pages/friend/list',
  });
};

const goToFollowing = () => {
  uni.navigateTo({
    url: '/pages/friend/following',
  });
};

const goToBlocklist = () => {
  uni.navigateTo({
    url: '/pages/friend/blacklist',
  });
};

const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/user/settings',
  });
};

const handleSign = async () => {
  if (!authStore.isLoggedIn) {
    uni.navigateTo({
      url: '/pages/auth/login',
    });
    return;
  }

  if (pointsStore.signStatus.signedToday) {
    uni.showToast({
      title: '今日已签到',
      icon: 'none',
    });
    return;
  }

  isSigning.value = true;
  const result = await pointsStore.sign();

  setTimeout(() => {
    isSigning.value = false;
    if (result) {
      uni.showToast({
        title: `签到成功，获得 ${result.pointsEarned} 积分`,
        icon: 'success',
      });
    }
  }, 600);
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout();
        uni.reLaunch({
          url: '/pages/auth/login',
        });
      }
    },
  });
};

const copyInviteLink = () => {
  if (!authStore.userInfo?.inviteCode) {
    uni.showToast({
      title: '邀请码不存在',
      icon: 'none',
    });
    return;
  }

  // 构建邀请链接
  const inviteLink = `http://23.94.103.190:8107/#/pages/auth/register?inviteCode=${authStore.userInfo.inviteCode}`;

  // 复制到剪贴板
  uni.setClipboardData({
    data: inviteLink,
    success: () => {
      uni.showToast({
        title: '邀请链接已复制',
        icon: 'success',
      });
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none',
      });
    },
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.mine-container {
  
  background: $bg-secondary;

  .user-header {
    display: flex;
    align-items: center;
    padding: 60rpx $padding-xl;
    background: $bg-primary;
    margin-bottom: $margin-md;
    box-shadow: $shadow-sm;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: $radius-circle;
      margin-right: $margin-lg;
      background: $bg-tertiary;
      display: block;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

      &.mbti-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .mbti-icon {
          font-size: 60rpx;
        }
      }
    }

    .user-info {
      flex: 1;

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

    .edit-btn {
      padding: 12rpx 24rpx;
      background: $primary-color;
      color: #fff;
      border-radius: 24rpx;
      font-size: $font-size-sm;
      @include transition(all);

      &:active {
        transform: scale(0.95);
        background: $primary-hover;
      }
    }
  }

  .points-card {
    position: relative;
    padding: $padding-xl;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0 $margin-md $margin-md;
    border-radius: $radius-lg;
    box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
    overflow: hidden;
    @include transition(transform);

    &:active {
      transform: scale(0.98);
    }

    .points-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .points-info {
      .points-label {
        display: block;
        font-size: $font-size-sm;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: $margin-xs;
      }

      .points-value {
        display: block;
        font-size: 48rpx;
        font-weight: $font-weight-bold;
        color: #fff;
        animation: points-pulse 2s ease-in-out infinite;
      }

      .continuous-days {
        margin-top: $margin-sm;
        padding: 4rpx 12rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12rpx;
        display: inline-block;

        text {
          font-size: 20rpx;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .sign-btn {
      padding: 16rpx 32rpx;
      background: #fff;
      color: #667eea;
      border-radius: 30rpx;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
      @include transition(all);

      &:active {
        transform: scale(0.95);
      }

      &.signing {
        animation: sign-bounce 0.6s ease;
      }

      &.signed {
        background: rgba(255, 255, 255, 0.3);
        color: #fff;
        box-shadow: none;
      }
    }

    .points-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;

      .decoration-circle {
        position: absolute;
        border-radius: $radius-circle;
        background: rgba(255, 255, 255, 0.1);
        animation: float 6s ease-in-out infinite;

        &.circle-1 {
          width: 100rpx;
          height: 100rpx;
          top: -20rpx;
          right: 40rpx;
          animation-delay: 0s;
        }

        &.circle-2 {
          width: 60rpx;
          height: 60rpx;
          bottom: 20rpx;
          left: 60rpx;
          animation-delay: 2s;
        }

        &.circle-3 {
          width: 80rpx;
          height: 80rpx;
          top: 50%;
          right: -20rpx;
          animation-delay: 4s;
        }
      }
    }
  }

  .invite-card {
    position: relative;
    padding: $padding-xl;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    margin: 0 $margin-md $margin-md;
    border-radius: $radius-lg;
    box-shadow: 0 8rpx 24rpx rgba(240, 147, 251, 0.4);
    overflow: hidden;
    @include transition(transform);

    &:active {
      transform: scale(0.98);
    }

    .invite-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .invite-info {
      .invite-label {
        display: block;
        font-size: $font-size-sm;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: $margin-xs;
      }

      .invite-code {
        display: block;
        font-size: 40rpx;
        font-weight: $font-weight-bold;
        color: #fff;
        letter-spacing: 4rpx;
      }
    }

    .copy-btn {
      padding: 16rpx 32rpx;
      background: #fff;
      color: #f5576c;
      border-radius: 30rpx;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
      @include transition(all);

      &:active {
        transform: scale(0.95);
      }
    }

    .invite-decoration {
      position: absolute;
      top: 50%;
      right: 20rpx;
      transform: translateY(-50%);
      z-index: 1;
      opacity: 0.2;

      .decoration-icon {
        font-size: 120rpx;
        animation: float 3s ease-in-out infinite;
      }
    }
  }

  .menu-list {
    background: $bg-primary;
    margin-bottom: $margin-md;
    border-radius: $radius-base;
  margin-left: $margin-md;
    margin-right: $margin-md;
    overflow: hidden;
    box-shadow: $shadow-xs;

    .menu-item {
      display: flex;
      align-items: center;
      padding: $padding-lg $padding-xl;
      border-bottom: 1rpx solid $divider-color;
      @include transition(background);

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background: $bg-secondary;
      }

      .menu-icon {
        font-size: 36rpx;
        margin-right: $margin-md;
      }

      .menu-text {
        flex: 1;
    font-size: $font-size-base;
        color: $text-primary;
      }

      .menu-arrow {
        font-size: 36rpx;
        color: $text-tertiary;
      }
    }
  }

  .logout-section {
    padding: $padding-xl;

    .logout-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      background: $bg-primary;
      color: $error-color;
      font-size: $font-size-lg;
      border-radius: $radius-base;
      border: none;
      box-shadow: $shadow-xs;
      @include transition(all);

      &:active {
        transform: scale(0.98);
        background: $bg-secondary;
      }
    }
  }
}

@keyframes points-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes sign-bounce {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2) rotate(-5deg);
  }
  50% {
    transform: scale(0.9) rotate(5deg);
  }
  75% {
    transform: scale(1.1) rotate(-3deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20rpx) scale(1.1);
    opacity: 0.6;
  }
}
</style>
