<template>
  <view class="bubble-container">
    <!-- 展开状态：显示气泡列表 -->
    <view v-if="notificationStore.isExpanded && notificationStore.notifications.length > 0" class="bubble-list">
      <view
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="message-bubble"
        @click="handleBubbleClick(notification)"
      >
        <view class="bubble-header">
          <image :src="notification.senderAvatar || '/static/default-avatar.png'" class="avatar" />
          <view class="user-info">
            <text class="nickname">{{ notification.senderNickname }}</text>
            <view class="relationship-badge" :class="notification.relationshipType">
              <text>{{ notification.relationshipType === 'friend' ? '好友' : '陌生人' }}</text>
            </view>
          </view>
          <view class="unread-count" v-if="notification.unreadCount > 1">
            <text>{{ notification.unreadCount }}</text>
          </view>
        </view>
        <view class="bubble-content">
          <text class="message-text">{{ getLastMessage(notification) }}</text>
        </view>
      </view>
    </view>

    <!-- 折叠状态：显示角标 -->
    <view
      v-if="!notificationStore.isExpanded && notificationStore.totalUnreadCount > 0"
      class="bubble-badge"
      @click="handleBadgeClick"
    >
      <view class="badge-count">
        <text>{{ notificationStore.totalUnreadCount > 99 ? '99+' : notificationStore.totalUnreadCount }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification';
import type { ChatNotification } from '@/stores/notification';
import { MESSAGE_PREVIEW_LENGTH, ROUTES } from '@/constants/notification';

const notificationStore = useNotificationStore();

const getLastMessage = (notification: ChatNotification): string => {
  const lastMsg = notification.messages[notification.messages.length - 1];
  const content = lastMsg?.content || '';
  return content.length > MESSAGE_PREVIEW_LENGTH
    ? content.substring(0, MESSAGE_PREVIEW_LENGTH) + '...'
    : content;
};

const handleBubbleClick = (notification: ChatNotification) => {
  // 清除该通知
  notificationStore.clearNotification(notification.senderId);

  // 跳转到聊天详情
  uni.navigateTo({
    url: `${ROUTES.CHAT_DETAIL}?userId=${notification.senderId}&nickname=${notification.senderNickname}`,
  });
};

const handleBadgeClick = () => {
  notificationStore.handleBadgeClick();
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.bubble-container {
  position: fixed;
  z-index: 9999;
}

// 展开状态：气泡列表
.bubble-list {
  position: fixed;
  bottom: calc(var(--window-bottom) + 100rpx); // TabBar上方
  left: 20rpx;
  right: 20rpx;
  z-index: 9999;

  .message-bubble {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20rpx);
    border-radius: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
    padding: 24rpx;
    margin-bottom: 16rpx;
    animation: slideUp 0.3s ease-out;

    &:active {
      opacity: 0.8;
    }

    .bubble-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .avatar {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .user-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12rpx;

        .nickname {
          font-size: $font-size-lg;
          font-weight: $font-weight-medium;
          color: $text-primary;
        }

        .relationship-badge {
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          font-size: 20rpx;
          font-weight: $font-weight-medium;

          &.friend {
            background: #E8F5E9;
            color: #4CAF50;
          }

          &.stranger {
            background: #FFF3E0;
            color: #FF9800;
          }
        }
      }

      .unread-count {
        min-width: 40rpx;
        height: 40rpx;
        padding: 0 12rpx;
        background: $primary-color;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        text {
          color: #fff;
          font-size: 24rpx;
          font-weight: bold;
        }
      }
    }

    .bubble-content {
      .message-text {
        font-size: $font-size-base;
        color: $text-secondary;
        line-height: 1.5;
      }
    }
  }
}

// 折叠状态：角标
.bubble-badge {
  position: fixed;
  bottom: calc(var(--window-bottom) + 100rpx);
  right: 40rpx;
  z-index: 9999;

  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);

  display: flex;
  align-items: center;
  justify-content: center;

  animation: pulse 2s ease-in-out infinite;

  &:active {
    transform: scale(0.9);
  }

  .badge-count {
    text {
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
