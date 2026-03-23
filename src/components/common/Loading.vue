<template>
  <view class="loading-container">
    <view class="loading-spinner"></view>
    <text class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<style scoped lang="scss">
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;

  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #f3f3f3;
    border-top: 4rpx solid #007aff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>