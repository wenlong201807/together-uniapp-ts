<template>
  <view :id="`msg-${message.id}`" class="message-wrapper">
    <!-- 时间戳居中显示 -->
    <view v-if="showTime" class="message-time-center">
      <text>{{ formatTime(message.createdAt) }}</text>
    </view>

    <view :class="['message-bubble', isSelf ? 'self' : 'other', { 'bubble-enter': isEntering }]">
      <image
        v-if="!isSelf"
        class="avatar"
        :src="message.sender?.avatarUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="bubble-content-wrapper">
        <view class="bubble-content">
          <text class="message-text">{{ message.content }}</text>
        </view>
        <view v-if="message.status === 'sending'" class="message-status">
          <view class="loading-dots">
            <view class="dot" />
            <view class="dot" />
            <view class="dot" />
          </view>
        </view>
        <view v-else-if="message.status === 'failed'" class="message-status error" @click="handleRetry">
          <text>!</text>
        </view>
      </view>
      <image
        v-if="isSelf"
        class="avatar"
        :src="authStore.userInfo?.avatarUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatTime } from '@/utils'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  message: any
  showTime?: boolean
}>()

const emit = defineEmits<{
  retry: [messageId: number]
}>()

const authStore = useAuthStore()
const isEntering = ref(true)

const isSelf = computed(() => {
  return props.message.isSelf === true || props.message.senderId === authStore.userInfo?.id
})

onMounted(() => {
  setTimeout(() => {
    isEntering.value = false
  }, 300)
})

const handleRetry = () => {
  emit('retry', props.message.id)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.message-wrapper {
  width: 100%;
  margin-bottom: 24rpx;

  .message-time-center {
    text-align: center;
    margin: 20rpx 0;

    text {
      font-size: 24rpx;
      color: #999;
      background: rgba(0, 0, 0, 0.05);
      padding: 4rpx 16rpx;
      border-radius: 8rpx;
    }
  }
}

.message-bubble {
  display: flex;
  align-items: flex-start;
  padding: 0 24rpx;
  opacity: 1;
  transform: translateY(0);
  width: 100%;

  &.bubble-enter {
    animation: bubble-slide-in 0.3s ease-out;
  }

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
    background: #f0f0f0;
  }

  .bubble-content-wrapper {
    display: flex;
    align-items: center;
    max-width: calc(100% - 160rpx);
  }

  .bubble-content {
    padding: 20rpx 24rpx;
    word-break: break-word;
    position: relative;

    .message-text {
      font-size: 32rpx;
      line-height: 1.5;
      word-break: break-word;
      white-space: pre-wrap;
    }
  }

  .message-status {
    display: flex;
    align-items: center;
    margin-left: 16rpx;

    &.error {
      width: 40rpx;
      height: 40rpx;
      background: #ff4d4f;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      font-weight: bold;
      cursor: pointer;

      &:active {
        transform: scale(0.9);
      }
    }

    .loading-dots {
      display: flex;
      gap: 8rpx;

      .dot {
        width: 10rpx;
        height: 10rpx;
        background: #999;
        border-radius: 50%;
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

  &.other {
    flex-direction: row;
    justify-content: flex-start;

    .avatar {
      margin-right: 20rpx;
    }

    .bubble-content {
      background: #fff;
      color: #000;
      border-radius: 8rpx;
      box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    }
  }

  &.self {
    flex-direction: row-reverse;
    justify-content: flex-end;

    .avatar {
      margin-left: 20rpx;
    }

    .bubble-content-wrapper {
      flex-direction: row-reverse;
    }

    .bubble-content {
      background: #95EC69;
      color: #000;
      border-radius: 8rpx;
      box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    }

    .message-status {
      margin-left: 0;
      margin-right: 16rpx;
    }
  }
}

@keyframes bubble-slide-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
