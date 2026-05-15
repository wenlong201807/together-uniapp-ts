<!--
  ⚠️ 已废弃：此页面已合并到 /pages/tabbar/message.vue
  统一使用 tabbar/message 作为聊天列表入口
  保留此文件仅为兼容可能的深度链接
-->
<template>
  <view class="chat-list-container">
    <view class="chat-list">
      <!-- 骨架屏 -->
      <template v-if="loading && (chatStore.conversations?.length ?? 0) === 0">
        <view v-for="i in 5" :key="i" class="conversation-skeleton">
          <view class="skeleton-avatar" />
          <view class="skeleton-content">
            <view class="skeleton-line" style="width: 60%; height: 28rpx" />
            <view class="skeleton-line" style="width: 80%; height: 24rpx; margin-top: 12rpx" />
          </view>
        </view>
      </template>

      <!-- 会话列表 -->
      <template v-else>
        <view
          v-for="(conversation, index) in chatStore.conversations"
          :key="conversation.userId"
          class="conversation-item"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="goToChat(conversation)"
        >
          <view class="avatar-wrapper">
            <image
              class="avatar"
              :src="(conversation as any).avatarUrl || conversation.avatar || '/static/images/default-avatar.png'"
              mode="aspectFill"
            />
            <view v-if="conversation.unreadCount > 0" class="unread-dot" />

            <!-- 气泡角标 -->
            <view
              v-if="notificationStore.hasNotification(conversation.userId)"
              class="notification-badge"
              :class="notificationStore.getNotificationRelationType(conversation.userId)"
            >
              <text>{{ notificationStore.getNotificationCount(conversation.userId) }}</text>
            </view>
          </view>
          <view class="conversation-info">
            <view class="conversation-header">
              <text class="nickname">{{ conversation.nickname }}</text>
              <text class="time">{{
                formatTime((conversation as any).lastTime || conversation.lastMessageTime)
              }}</text>
            </view>
            <view class="conversation-content">
              <text class="last-message">{{
                conversation.lastMessage || '暂无消息'
              }}</text>
              <view v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
              </view>
            </view>
          </view>
        </view>

        <Empty
          v-if="!loading && (chatStore.conversations?.length ?? 0) === 0"
          text="暂无聊天"
        />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useChatStore, useNotificationStore } from '@/stores';
import { formatTime } from '@/utils';
import Empty from '@/components/common/Empty.vue';
import { useAvatarSync } from '@/composables/useAvatarSync';

const chatStore = useChatStore();
const notificationStore = useNotificationStore();
const loading = ref(false);

// 头像同步 - 会话列表直接在 item 上有 userId
const conversations = computed(() => ({ list: chatStore.conversations }));
useAvatarSync(conversations, {
  userIdField: 'userId',
  avatarIdField: 'avatarId',
  avatarUrlField: 'avatar',
  nestedUserField: undefined
});

onMounted(async () => {
  await loadConversations();

  // 页面显示时，更新气泡展开状态
  notificationStore.updateExpandState(true);

  // 触发全局事件，通知 App.vue 更新气泡状态
  uni.$emit('onPageShow');
});

const loadConversations = async () => {
  loading.value = true;
  try {
    await chatStore.fetchConversations();
  } catch (error) {
    console.error('Load conversations error:', error);
  } finally {
    loading.value = false;
  }
};

const goToChat = (conversation: any) => {
  // 清除该用户的气泡通知
  notificationStore.clearNotification(conversation.userId);

  uni.navigateTo({
    url: `/pages/chat/detail?userId=${conversation.userId}&nickname=${conversation.nickname}`,
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.chat-list-container {
  
  background: $bg-secondary;

  .chat-list {
    padding: $padding-md;

    .conversation-skeleton {
      display: flex;
      align-items: center;
      padding: $padding-lg;
      background: $bg-primary;
      border-radius: $radius-lg;
      margin-bottom: $margin-md;

      .skeleton-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: $radius-circle;
        background: $bg-tertiary;
        margin-right: $margin-md;
        position: relative;
        overflow: hidden;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: skeleton-loading 1.5s ease-in-out infinite;
        }
      }

      .skeleton-content {
        flex: 1;

        .skeleton-line {
          background: $bg-tertiary;
          border-radius: $radius-xs;
          position: relative;
          overflow: hidden;

          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            animation: skeleton-loading 1.5s ease-in-out infinite;
          }
        }
      }
    }

    .conversation-item {
      display: flex;
      align-items: center;
      padding: $padding-lg;
      background: $bg-primary;
      border-radius: $radius-lg;
      margin-bottom: $margin-md;
      box-shadow: $shadow-xs;
      animation: conversation-fade-in $duration-base $ease-out both;
      @include transition(all);

      &:active {
        transform: scale(0.98);
        background: $bg-secondary;
      }

      .avatar-wrapper {
        position: relative;
        margin-right: $margin-md;

        .avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: $radius-circle;
          background: $bg-tertiary;
          display: block;
        }

        .unread-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 16rpx;
          height: 16rpx;
          background: $error-color;
          border: 2rpx solid $bg-primary;
          border-radius: $radius-circle;
          animation: dot-pulse 2s ease-in-out infinite;
        }

        .notification-badge {
          position: absolute;
          top: -8rpx;
          right: -8rpx;
          min-width: 36rpx;
          height: 36rpx;
          padding: 0 8rpx;
          border-radius: 18rpx;
          border: 2rpx solid $bg-primary;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20rpx;
          color: #fff;
          font-weight: bold;

          animation: badge-bounce 0.5s ease;

          &.friend {
            background: #4CAF50;
            box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.4);
          }

          &.stranger {
            background: #FF9800;
            box-shadow: 0 2rpx 8rpx rgba(255, 152, 0, 0.4);
          }
        }
      }

      .conversation-info {
        flex: 1;
        overflow: hidden;

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $margin-xs;

          .nickname {
            font-size: $font-size-base;
            font-weight: $font-weight-medium;
            color: $text-primary;
          }

          .time {
            font-size: $font-size-xs;
            color: $text-tertiary;
          }
        }

        .conversation-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .last-message {
            flex: 1;
            font-size: $font-size-sm;
            color: $text-secondary;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .unread-badge {
            min-width: 32rpx;
            height: 32rpx;
            padding: 0 8rpx;
            background: $error-color;
            color: #fff;
            font-size: 20rpx;
            border-radius: 16rpx;
            @include flex-center;
            margin-left: $margin-sm;
            box-shadow: 0 2rpx 8rpx rgba($error-color, 0.4);
            animation: badge-bounce 0.5s ease;
          }
        }
      }
    }
  }
}

@keyframes skeleton-loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes conversation-fade-in {
  from {
    opacity: 0;
    transform: translateX(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes dot-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes badge-bounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
