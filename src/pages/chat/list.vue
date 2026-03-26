<template>
  <view class="chat-list-container">
    <view class="chat-list">
      <view
        v-for="conversation in chatStore.conversations"
        :key="conversation.userId"
        class="conversation-item"
        @click="goToChat(conversation)"
      >
        <image
          class="avatar"
          :src="conversation.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="conversation-info">
          <view class="conversation-header">
            <text class="nickname">{{ conversation.nickname }}</text>
            <text class="time">{{
              formatTime(conversation.lastMessageTime)
            }}</text>
          </view>
          <view class="conversation-content">
            <text class="last-message">{{
              conversation.lastMessage || '暂无消息'
            }}</text>
            <view v-if="conversation.unreadCount > 0" class="unread-badge">
              {{ conversation.unreadCount }}
            </view>
          </view>
        </view>
      </view>

      <Loading v-if="loading" text="加载中..." />
      <Empty
        v-if="!loading && chatStore?.conversations.length === 0"
        text="暂无聊天"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChatStore } from '@/stores';
import { formatTime } from '@/utils';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';

const chatStore = useChatStore();
const loading = ref(false);

onMounted(async () => {
  await loadConversations();
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
  uni.navigateTo({
    url: `/pages/chat/detail?userId=${conversation.userId}&nickname=${conversation.nickname}`,
  });
};
</script>

<style scoped lang="scss">
.chat-list-container {
  min-height: 100vh;
  background: #f8f8f8;

  .chat-list {
    padding: 20rpx;

    .conversation-item {
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

      .conversation-info {
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
      }
    }
  }
}
</style>
