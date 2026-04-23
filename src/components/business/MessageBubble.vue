<template>
  <view :id="`msg-${message.id}`" :class="['message-bubble', isSelf ? 'self' : 'other', { 'bubble-enter': isEntering }]">
    <image
      v-if="!isSelf"
      class="avatar"
      :src="message.sender?.avatarUrl || '/static/images/default-avatar.png'"
      mode="aspectFill"
    />
    <view class="bubble-wrapper">
      <view class="bubble-content">
        <text class="message-text">{{ message.content }}</text>
      </view>
      <text class="message-time">{{ formatTime(message.createdAt) }}</text>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatTime } from '@/utils'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  message: any
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

.message-bubble {
  display: flex;
  align-items: flex-end;
  margin-bottom: $margin-lg;
  padding: 0 $padding-md;
  opacity: 1;
  transform: translateY(0);
  width: 100%;

  &.bubble-enter {
    animation: bubble-slide-in $duration-base $ease-out;
  }

  &.self {
    flex-direction: row-reverse;
    justify-content: flex-end;

    .bubble-wrapper {
      align-items: flex-end;
    }

    .bubble-content {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      border-radius: 20rpx 20rpx 0 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
      animation: bubble-pop-right $duration-base $ease-bounce;
    }

    .message-time {
      text-align: right;
    }

    .message-status {
      margin-right: $margin-sm;
    }
  }

  &.other {
    flex-direction: row;
    justify-content: flex-start;

    .bubble-wrapper {
      align-items: flex-start;
    }

    .bubble-content {
      background: $bg-primary;
      color: $text-primary;
      border-radius: 20rpx 20rpx 20rpx 0;
      box-shadow: $shadow-sm;
      animation: bubble-pop-left $duration-base $ease-bounce;
    }

    .message-time {
      text-align: left;
    }

    .message-status {
      margin-left: $margin-sm;
    }
  }

  .avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: $radius-circle;
    margin: 0 $margin-md;
    background: $bg-tertiary;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .bubble-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    min-width: 120rpx;
  }

  .bubble-content {
    padding: $padding-md $padding-lg;
    position: relative;
    @include transition(all);

    &:active {
      transform: scale(0.98);
    }

    .message-text {
      font-size: $font-size-base;
      line-height: $line-height-relaxed;
      word-break: break-word;
      white-space: pre-wrap;
    }
  }

  .message-time {
    display: block;
    font-size: $font-size-xs;
    color: $text-tertiary;
    margin-top: 4rpx;
    padding: 0 $padding-sm;
  }

  .message-status {
    display: flex;
    align-items: center;
    margin-top: $margin-xs;
    padding: 0 $padding-sm;

    &.error {
      width: 32rpx;
      height: 32rpx;
      background: $error-color;
      color: #fff;
      border-radius: $radius-circle;
      @include flex-center;
      font-size: 20rpx;
      font-weight: $font-weight-bold;
      cursor: pointer;
      animation: error-shake 0.5s ease;

      &:active {
        transform: scale(0.9);
      }
    }

    .loading-dots {
      display: flex;
      gap: 6rpx;

      .dot {
        width: 8rpx;
        height: 8rpx;
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

@keyframes bubble-pop-left {
  0% {
    opacity: 0;
    transform: scale(0.3) translateX(-20rpx);
  }
  50% {
    transform: scale(1.05) translateX(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

@keyframes bubble-pop-right {
  0% {
    opacity: 0;
    transform: scale(0.3) translateX(20rpx);
  }
  50% {
    transform: scale(1.05) translateX(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateX(0);
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

@keyframes error-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4rpx);
  }
  75% {
    transform: translateX(4rpx);
  }
}
</style>
