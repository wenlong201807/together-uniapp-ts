<template>
  <view :class="['message-bubble', isSelf ? 'self' : 'other']">
    <image v-if="!isSelf" class="avatar" :src="message.sender?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
    <view class="bubble-content">
      <text class="message-text">{{ message.content }}</text>
      <text class="message-time">{{ formatTime(message.createdAt) }}</text>
    </view>
    <image v-if="isSelf" class="avatar" :src="message.sender?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime } from '@/utils'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  message: any
}>()

const authStore = useAuthStore()

const isSelf = computed(() => {
  return props.message.isSelf === true || props.message.senderId === authStore.userInfo?.id
})
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  align-items: flex-end;
  margin-bottom: 30rpx;
  padding: 0 24rpx;

  &.self {
    flex-direction: row-reverse;

    .bubble-content {
      background: #007aff;
      color: #fff;
      border-radius: 20rpx 20rpx 0 20rpx;
    }
  }

  &.other {
    .bubble-content {
      background: #fff;
      color: #333;
      border-radius: 20rpx 20rpx 20rpx 0;
    }
  }

  .avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    margin: 0 16rpx;
    background: #f0f0f0;
  }

  .bubble-content {
    max-width: 70%;
    padding: 20rpx 24rpx;
    position: relative;

    .message-text {
      font-size: 28rpx;
      line-height: 1.5;
      word-break: break-all;
    }

    .message-time {
      display: block;
      font-size: 20rpx;
      margin-top: 8rpx;
      opacity: 0.7;
    }
  }
}
</style>