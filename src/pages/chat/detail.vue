<template>
  <view class="chat-detail-container">
    <scroll-view class="messages-list" scroll-y :scroll-into-view="scrollToView">
      <MessageBubble
        v-for="message in chatStore.messages"
        :key="message.id"
        :message="message"
        @retry="handleRetry"
      />
      <view v-if="loading" class="loading-wrapper">
        <view class="loading-dots">
          <view class="dot" />
          <view class="dot" />
          <view class="dot" />
        </view>
      </view>
    </scroll-view>

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
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useChatStore, useAuthStore } from '@/stores';
import { wsManager } from '@/utils';
import MessageBubble from '@/components/business/MessageBubble.vue';

const chatStore = useChatStore();
const authStore = useAuthStore();

const inputText = ref('');
const loading = ref(false);
const targetUserId = ref<number>(0);
const targetNickname = ref('');
const scrollToView = ref('');

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

  const content = inputText.value;
  inputText.value = '';

  try {
    await chatStore.sendMessage({
      receiverId: targetUserId.value + '',
      content,
      msgType: 1,
    });

    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Send message error:', error);
  }
};

const handleRetry = async (messageId: number) => {
  // 重试发送失败的消息
  const message = chatStore.messages.find(m => m.id === messageId);
  if (message) {
    try {
      await chatStore.sendMessage({
        receiverId: targetUserId.value + '',
        content: message.content,
        msgType: 1,
      });
    } catch (error) {
      console.error('Retry message error:', error);
    }
  }
};

const scrollToBottom = () => {
  const lastMessage = chatStore.messages[chatStore.messages.length - 1];
  if (lastMessage) {
    scrollToView.value = `msg-${lastMessage.id}`;
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.chat-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;

  .messages-list {
    flex: 1;
    padding: $padding-md;
    overflow-y: auto;

    .loading-wrapper {
      @include flex-center;
      padding: $padding-lg 0;

      .loading-dots {
        display: flex;
        gap: 8rpx;

        .dot {
          width: 12rpx;
          height: 12rpx;
          background: $text-tertiary;
          border-radius: $radius-circle;
          animation: dot-bounce 1.4s ease-in-out infinite;

          &:nth-child(1) {
            animation-delay: 0s;
          }

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
  }

  .input-bar {
    display: flex;
    align-items: center;
    padding: $padding-md;
    background: $bg-primary;
    border-top: 1rpx solid $divider-color;
    box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);

    .message-input {
      flex: 1;
      height: 72rpx;
      padding: 0 $padding-lg;
      background: $bg-secondary;
      border-radius: 36rpx;
      font-size: $font-size-base;
      margin-right: $margin-md;
      @include transition(background);

      &:focus {
        background: $bg-tertiary;
      }
    }

    .send-btn {
      width: 120rpx;
      height: 72rpx;
      line-height: 72rpx;
      background: linear-gradient(135deg, $primary-color, $primary-hover);
      color: #fff;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      border-radius: 36rpx;
      border: none;
      padding: 0;
      box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
      @include transition(all);

      &:active {
        transform: scale(0.95);
      }

      &:disabled {
        opacity: 0.5;
        background: $bg-tertiary;
        color: $text-tertiary;
        box-shadow: none;
      }
    }
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
