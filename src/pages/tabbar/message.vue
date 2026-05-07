<template>
  <view class="message-container">
    <!-- 好友列表 -->
    <scroll-view class="friend-list" scroll-y :show-scrollbar="false">
      <view
        v-for="friend in friendsWithUnread"
        :key="friend.friendId"
        class="friend-item"
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
        </view>

        <view class="friend-info">
          <view class="friend-header">
            <text class="nickname">{{ friend.nickname }}</text>
            <text v-if="friend.lastMessageTime" class="time">
              {{ formatTime(friend.lastMessageTime) }}
            </text>
          </view>
          <view class="friend-content">
            <text class="last-message">
              {{ friend.lastMessage || '开始聊天吧~' }}
            </text>
            <view v-if="friend.unreadCount > 0" class="unread-badge">
              {{ friend.unreadCount > 99 ? '99+' : friend.unreadCount }}
            </view>
          </view>
        </view>
      </view>

      <Empty v-if="friendsWithUnread.length === 0" text="暂无好友" description="去广场认识新朋友吧" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useChatStore, useFriendStore } from '@/stores';
import { formatTime } from '@/utils';
import Avatar from '@/components/common/Avatar.vue';
import Empty from '@/components/common/Empty.vue';

const chatStore = useChatStore();
const friendStore = useFriendStore();

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
    // friend 是 Friendship 类型，friend.friend 才是好友的用户信息
    const friendUser = friend.friend || friend.user;
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
});

onShow(async () => {
  // 每次显示页面时刷新数据
  await loadData();
});

const loadData = async () => {
  try {
    await Promise.all([
      chatStore.fetchConversations(),
      friendStore.fetchFriendList(),
    ]);
  } catch (error) {
    console.error('Load data error:', error);
  }
};

const goToChat = async (friend: any) => {
  if (!friend.userId || !friend.nickname) {
    return uni.showToast({
      title: '用户信息不完整',
      icon: 'none',
    });
  }

  try {
    const status = await friendStore.getFriendshipStatus(friend.userId);

    if (!status.canChat) {
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
      url: `/pages/chat/detail?userId=${friend.userId}&nickname=${friend.nickname}`,
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
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;

  .friend-list {
    flex: 1;
    padding: 20rpx;

    .friend-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: $bg-primary;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      box-shadow: $shadow-xs;
      @include transition(all);

      &:active {
        transform: scale(0.98);
        box-shadow: $shadow-sm;
      }

      .avatar-wrapper {
        position: relative;
        margin-right: 24rpx;
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
        }
      }

      .friend-info {
        flex: 1;
        min-width: 0;

        .friend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8rpx;

          .nickname {
            font-size: 30rpx;
            font-weight: $font-weight-medium;
            color: $text-primary;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            margin-right: 16rpx;
          }

          .time {
            font-size: 22rpx;
            color: $text-tertiary;
            flex-shrink: 0;
          }
        }

        .friend-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .last-message {
            flex: 1;
            font-size: 26rpx;
            color: $text-secondary;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 16rpx;
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
          }
        }
      }
    }
  }
}
</style>
