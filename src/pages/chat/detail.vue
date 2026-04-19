<template>
  <view class="chat-detail-container">
    <scroll-view
      class="messages-list"
      scroll-y
      :scroll-into-view="scrollToView"
      :scroll-with-animation="true"
      :style="{ height: scrollViewHeight + 'px' }"
    >
      <view class="messages-wrapper">
        <MessageBubble
          v-for="message in chatStore.messages"
          :key="message.id"
          :id="`msg-${message.id}`"
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
      </view>
    </scroll-view>

    <view class="input-bar" :style="{ bottom: keyboardHeight + 'px' }">
      <input
        v-model="inputText"
        class="message-input"
        placeholder="输入消息..."
        :adjust-position="false"
        @focus="handleFocus"
        @blur="handleBlur"
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useChatStore, useAuthStore } from '@/stores';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { wsManager } from '@/utils';
import MessageBubble from '@/components/business/MessageBubble.vue';

const chatStore = useChatStore();
const authStore = useAuthStore();
const { checkBeforeAction } = useNetworkStatus();

const inputText = ref('');
const loading = ref(false);
const targetUserId = ref<number>(0);
const targetNickname = ref('');
const scrollToView = ref('');
const keyboardHeight = ref(0);
const scrollViewHeight = ref(0);
const inputBarHeight = 100; // 输入框固定高度（px）

// 计算滚动区域高度
const calculateScrollHeight = () => {
  const systemInfo = uni.getSystemInfoSync();
  const windowHeight = systemInfo.windowHeight;
  const statusBarHeight = systemInfo.statusBarHeight || 0;
  const navBarHeight = 44; // 导航栏高度

  // 可用高度 = 窗口高度 - 状态栏 - 导航栏 - 输入框 - 键盘
  scrollViewHeight.value = windowHeight - statusBarHeight - navBarHeight - inputBarHeight - keyboardHeight.value;
};

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

  // 计算初始高度
  calculateScrollHeight();

  await loadMessages();

  wsManager.connect();
});

onUnmounted(() => {
  chatStore.clearMessages();
  chatStore.setCurrentChat(null);
});

// 监听消息变化，自动滚动到底部
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  scrollToBottom();
}, { flush: 'post' });

const loadMessages = async () => {
  loading.value = true;
  try {
    await chatStore.fetchHistory(targetUserId.value, { page: 1, pageSize: 50 });
    await chatStore.markAsRead(targetUserId.value);

    // 加载完成后滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Load messages error:', error);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!inputText.value.trim()) return;
  if (!checkBeforeAction('发送消息')) return;

  const content = inputText.value;
  inputText.value = '';

  try {
    await chatStore.sendMessage({
      receiverId: targetUserId.value,
      content,
      msgType: 1,
    });

    // 发送后滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Send message error:', error);
  }
};

const handleRetry = async (messageId: number) => {
  const message = chatStore.messages.find(m => m.id === messageId);
  if (message) {
    try {
      await chatStore.sendMessage({
        receiverId: targetUserId.value,
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
    // 重置 scrollToView，允许下次滚动
    setTimeout(() => {
      scrollToView.value = '';
    }, 300);
  }
};

const handleFocus = () => {
  // 监听键盘高度变化
  uni.onKeyboardHeightChange((res) => {
    keyboardHeight.value = res.height;
    calculateScrollHeight();

    // 键盘弹起后滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  });
};

const handleBlur = () => {
  // 键盘收起，延迟恢复以避免闪烁
  setTimeout(() => {
    keyboardHeight.value = 0;
    calculateScrollHeight();
  }, 100);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.chat-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
  position: relative;

  .messages-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    .messages-wrapper {
      padding: $padding-md;
      padding-bottom: $padding-xl;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }

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
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding: $padding-md;
    background: $bg-primary;
    border-top: 1rpx solid $divider-color;
    box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
    z-index: 100;
    transition: bottom 0.3s ease;

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
