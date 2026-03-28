<template>
  <view class="chat-detail-container">
    <view class="messages-list" scroll-y>
      <MessageBubble
        v-for="message in chatStore.messages"
        :key="message.id"
        :message="message"
      />
      <Loading v-if="loading" text="加载中..." />
    </view>

    <view class="input-bar">
      <input
        v-model="inputText"
        class="message-input"
        placeholder="输入消息..."
        @confirm="sendMessage"
      />
      <button
        class="send-btn"
        :disabled="!inputText.trim()"
        @click="sendMessage"
      >
        发送
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useChatStore, useAuthStore } from '@/stores';
import { wsManager } from '@/utils';
import MessageBubble from '@/components/business/MessageBubble.vue';
import Loading from '@/components/common/Loading.vue';

const chatStore = useChatStore();
const authStore = useAuthStore();

const inputText = ref('');
const loading = ref(false);
const targetUserId = ref<number>(0);
const targetNickname = ref('');

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options;

  targetUserId.value = parseInt(options.userId);
  targetNickname.value = options.nickname || '用户';

  uni.setNavigationBarTitle({
    title: targetNickname.value,
  });

  chatStore.setCurrentChat({
    userId: targetUserId.value,
    nickname: targetNickname.value,
    unreadCount: 0,
  });

  await loadMessages();

  wsManager.connect();
});

onUnmounted(() => {
  chatStore.clearMessages();
  chatStore.setCurrentChat(null);
});

const loadMessages = async () => {
  loading.value = true;
  try {
    await chatStore.fetchHistory(targetUserId.value, { page: 1, pageSize: 50 });
    await chatStore.markAsRead(targetUserId.value);
  } catch (error) {
    console.error('Load messages error:', error);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!inputText.value.trim()) return;

  try {
    await chatStore.sendMessage({
      receiverId: targetUserId.value + '',
      content: inputText.value,
      msgType: 1,
    });
    inputText.value = '';
  } catch (error) {
    console.error('Send message error:', error);
  }
};
</script>

<style scoped lang="scss">
.chat-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;

  .messages-list {
    flex: 1;
    padding: 20rpx;
    overflow-y: auto;
  }

  .input-bar {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #fff;
    border-top: 1rpx solid #e0e0e0;

    .message-input {
      flex: 1;
      height: 72rpx;
      padding: 0 24rpx;
      background: #f8f8f8;
      border-radius: 36rpx;
      font-size: 28rpx;
      margin-right: 20rpx;
    }

    .send-btn {
      width: 120rpx;
      height: 72rpx;
      line-height: 72rpx;
      background: #007aff;
      color: #fff;
      font-size: 28rpx;
      border-radius: 36rpx;
      border: none;
      padding: 0;

      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>
