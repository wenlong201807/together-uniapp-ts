<template>
  <view class="message-container">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 自定义导航栏 -->
    <view class="nav-header">
      <text class="nav-title">消息</text>
      <view v-if="totalUnreadCount > 0" class="nav-badge">
        <text class="nav-badge-text">{{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}</text>
      </view>
    </view>

    <!-- 会话列表 -->
    <scroll-view class="conversation-list" scroll-y :show-scrollbar="false">
      <!-- 骨架屏 -->
      <template v-if="loading && friendsWithUnread.length === 0">
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
          v-for="(friend, index) in friendsWithUnread"
          :key="friend.friendId"
          class="conversation-item"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="goToChat(friend)"
        >
          <view class="avatar-wrapper">
            <Avatar
              :avatar-id="friend.avatarId"
              :avatar-url="friend.avatarUrl"
              size="large"
              class="avatar"
            />
            <view v-if="friend.unreadCount > 0" class="unread-dot" />

            <!-- 气泡角标 -->
            <view
              v-if="notificationStore.hasNotification(friend.userId)"
              class="notification-badge"
              :class="notificationStore.getNotificationRelationType(friend.userId)"
            >
              <text>{{ notificationStore.getNotificationCount(friend.userId) }}</text>
            </view>
          </view>

          <view class="conversation-info">
            <view class="conversation-header">
              <text class="nickname">{{ friend.nickname }}</text>
              <text v-if="friend.lastMessageTime" class="time">{{ formatTime(friend.lastMessageTime) }}</text>
            </view>
            <view class="conversation-content">
              <text class="last-message">{{ friend.lastMessage || '开始聊天吧~' }}</text>
              <view v-if="friend.unreadCount > 0" class="unread-badge">
                {{ friend.unreadCount > 99 ? '99+' : friend.unreadCount }}
              </view>
            </view>
          </view>
        </view>

        <Empty v-if="friendsWithUnread.length === 0" text="暂无好友" description="去广场认识新朋友吧" />
      </template>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useChatStore, useFriendStore, useNotificationStore } from '@/stores';
import { formatTime } from '@/utils';
import Avatar from '@/components/common/Avatar.vue';
import Empty from '@/components/common/Empty.vue';

const chatStore = useChatStore();
const friendStore = useFriendStore();
const notificationStore = useNotificationStore();

const loading = ref(false);

// 状态栏高度
const statusBarHeight = ref(0);
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0;
} catch {
  statusBarHeight.value = 0;
}

// 防止 onMounted + onShow 首次加载时重复请求
let hasInitialized = false;

// 合并好友列表和未读消息
const friendsWithUnread = computed(() => {
  const friends = friendStore.friendList || [];
  const conversations = chatStore.conversations || [];

  // 创建会话映射表（按 userId 索引）
  const conversationMap = new Map();
  conversations.forEach(conv => {
    conversationMap.set(conv.userId, conv);
  });

  // 合并好友信息和会话信息
  const merged = friends.map(friend => {
    const conv = conversationMap.get(friend.friendId);
    const friendUser = friend.user;
    return {
      id: friend.id,
      friendId: friend.friendId,
      userId: friend.friendId,
      nickname: friendUser?.nickname || '未知用户',
      avatarId: friendUser?.avatarId,
      avatarUrl: friendUser?.avatarUrl,
      unreadCount: conv?.unreadCount || 0,
      lastMessage: conv?.lastMessage || '',
      lastMessageTime: conv?.lastMessageTime || conv?.lastTime || '',
      // 排序权重：有未读消息的排前面，然后按时间排序
      sortWeight: (conv?.unreadCount || 0) * 10000000000 +
                  (conv?.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : 0)
    };
  });

  // 排序：有未读消息的在前，然后按最后消息时间倒序
  return merged.sort((a, b) => b.sortWeight - a.sortWeight);
});

// 总未读数
const totalUnreadCount = computed(() => {
  return friendsWithUnread.value.reduce((sum, friend) => sum + friend.unreadCount, 0);
});

onMounted(async () => {
  await loadData();
  hasInitialized = true;

  // 更新气泡展开状态
  notificationStore.updateExpandState(true);
  uni.$emit('onPageShow');
});

onShow(async () => {
  // 非首次显示时才刷新（首次由 onMounted 处理）
  if (hasInitialized) {
    await loadData();
    notificationStore.updateExpandState(true);
    uni.$emit('onPageShow');
  }
});

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      chatStore.fetchConversations(),
      friendStore.fetchFriendList(),
    ]);
  } catch (error) {
    console.error('Load data error:', error);
  } finally {
    loading.value = false;
  }
};

const goToChat = async (friend: any) => {
  if (!friend.userId || !friend.nickname) {
    return uni.showToast({
      title: '用户信息不完整',
      icon: 'none',
    });
  }

  // 清除该用户的气泡通知
  notificationStore.clearNotification(friend.userId);

  try {
    const status = await friendStore.getFriendshipStatus(friend.userId);

    if (!status.isFriend) {
      if (!status.isFollowing) {
        uni.showModal({
          title: '提示',
          content: `您还没有关注 ${friend.nickname}，是否先关注？`,
          success: async (res) => {
            if (res.confirm) {
              await friendStore.follow(friend.userId);
              uni.showToast({
                title: '关注成功',
                icon: 'success'
              });
            }
          }
        });
        return;
      }

      if (status.chatCount < 8) {
        uni.showModal({
          title: '提示',
          content: `与 ${friend.nickname} 互发8条消息后才能解锁私聊，当前已发送 ${status.chatCount} 条消息。`,
          showCancel: false
        });
        return;
      }

      if (status.currentPoints < status.requiredPoints) {
        uni.showModal({
          title: '积分不足',
          content: `解锁私聊需要 ${status.requiredPoints} 积分，当前您只有 ${status.currentPoints} 积分，不足以解锁私聊。`,
          showCancel: false
        });
        return;
      }
    }

    uni.navigateTo({
      url: `/pages/chat/detail?userId=${friend.userId}&nickname=${encodeURIComponent(friend.nickname)}`,
    });
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '进入聊天失败',
      icon: 'none'
    });
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

page {
  height: 100%;
  overflow: hidden;
}

.message-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
  overflow: hidden;

  .status-bar {
    flex-shrink: 0;
    background: $bg-primary;
  }

  .nav-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-md $padding-lg;
    background: $bg-primary;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .nav-title {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }

    .nav-badge {
      min-width: 36rpx;
      height: 36rpx;
      padding: 0 10rpx;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .nav-badge-text {
        font-size: 20rpx;
        color: #ffffff;
        font-weight: $font-weight-bold;
      }
    }
  }

  .conversation-list {
    flex: 1;
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
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
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
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
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
        flex-shrink: 0;

        .avatar {
          // Avatar 组件自带尺寸
        }

        .unread-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 20rpx;
          height: 20rpx;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
          border: 3rpx solid $bg-primary;
          border-radius: 50%;
          box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.4);
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
        min-width: 0;

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $margin-xs;

          .nickname {
            font-size: $font-size-base;
            font-weight: $font-weight-medium;
            color: $text-primary;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            margin-right: $margin-sm;
          }

          .time {
            font-size: $font-size-xs;
            color: $text-tertiary;
            flex-shrink: 0;
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
            margin-right: $margin-sm;
          }

          .unread-badge {
            min-width: 36rpx;
            height: 36rpx;
            padding: 0 10rpx;
            background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
            color: #fff;
            font-size: 22rpx;
            font-weight: $font-weight-bold;
            border-radius: 18rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.3);
            animation: badge-bounce 0.5s ease;
          }
        }
      }
    }
  }
}

@keyframes skeleton-loading {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes conversation-fade-in {
  from { opacity: 0; transform: translateX(-20rpx); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

@keyframes badge-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
