<template>
  <view class="empty-container">
    <view class="empty-icon">📭</view>
    <text class="empty-text">{{ text }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<style scoped lang="scss">
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 20rpx;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>