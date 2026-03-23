<template>
  <view class="message-container">
    <view class="message-tabs">
      <view
        :class="['tab-item', activeTab === 'chat' ? 'active' : '']"
        @click="activeTab = 'chat'"
      >
        <text>聊天</text>
        <view v-if="chatStore.unreadCount > 0" class="badge">{{ chatStore.unreadCount }}</view>
      </view>
      <view
        :class="['tab-item', activeTab === 'friend' ? 'active' : '']"
        @click="activeTab = 'friend'"
      >
        <text>好友</text>
      </view>
    </view>

    <scroll-view class="message-list" scroll-y>
      <view v-if="activeTab === 'chat'">
        <view
          v-for="conversation in chatStore.conversations"
          :key="conversation.userId"
          class="conversation-item"
          @click="goToChat(conversation)"
        >
          <image class="avatar" :src="conversation.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
          <view class="conversation-info">
            <view class="conversation-header">
              <text class="nickname">{{ conversation.nickname }}</text>
              <text class="time">{{ formatTime(conversation.lastMessageTime) }}</text>
            </view>
            <view class="conversation-content">
              <text class="last-message">{{ conversation.lastMessage || '暂无消息' }}</text>
              <view v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount }}
              </view>
            </view>
          </view>
        </view>

        <Empty v-if="chatStore.conversations.length === 0" text="暂无聊天" />
      </view>

      <view v-if="activeTab === 'friend'">
        <view
          v-for="friend in friendStore.friendList"
          :key="friend.id"
          class="friend-item"
          @click="goToChat({ userId: friend.friendId, nickname: friend.user?.nickname, avatar: friend.user?.avatar })"
        >
          <image class="avatar" :src="friend.user?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
          <view class="friend-info">
            <text class="nickname">{{ friend.user?.nickname }}</text>
          </view>
        </view>

        <Empty v-if="friendStore.friendList.length === 0" text="暂无好友" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore, useFriendStore } from '@/stores'
import { formatTime } from '@/utils'
import Empty from '@/components/common/Empty.vue'

const chatStore = useChatStore()
const friendStore = useFriendStore()

const activeTab = ref('chat')

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    await Promise.all([chatStore.fetchConversations(), friendStore.fetchFriendList()])
  } catch (error) {
    console.error('Load data error:', error)
  }
}

const goToChat = (conversation: any) => {
  uni.navigateTo({
    url: `/pages/chat/detail?userId=${conversation.userId}&nickname=${conversation.nickname}`
  })
}
</script>

<style scoped lang="scss">
.message-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;

  .message-tabs {
    display: flex;
    padding: 20rpx 40rpx;
    background: #fff;
    gap: 40rpx;

    .tab-item {
      position: relative;
      font-size: 28rpx;
      color: #666;

      &.active {
        font-weight: bold;
        color: #007aff;

        &::after {
          content: '';
          position: absolute;
          bottom: -8rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background: #007aff;
          border-radius: 2rpx;
        }
      }

      .badge {
        position: absolute;
        top: -8rpx;
        right: -20rpx;
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;
        background: #ff4d4f;
        color: #fff;
        font-size: 20rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .message-list {
    flex: 1;
    padding: 20rpx;

    .conversation-item,
    .friend-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background: #f0f0f0;
      }

      .conversation-info,
      .friend-info {
        flex: 1;
        overflow: hidden;

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8rpx;

          .nickname {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
          }

          .time {
            font-size: 24rpx;
            color: #999;
          }
        }

        .conversation-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .last-message {
            flex: 1;
            font-size: 24rpx;
            color: #999;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .unread-badge {
            min-width: 32rpx;
            height: 32rpx;
            padding: 0 8rpx;
            background: #ff4d4f;
            color: #fff;
            font-size: 20rpx;
            border-radius: 16rpx;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .nickname {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
        }
      }
    }
  }
}
</style>