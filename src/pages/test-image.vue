<template>
  <view class="test-page">
    <text class="title">图片加载测试</text>

    <view class="test-section">
      <text class="section-title">1. 原生 image 标签（对照组）</text>
      <image
        class="test-image"
        src="https://images.unsplash.com/photo-1500000000211?w=400&h=600&fit=crop&q=80"
        mode="aspectFill"
      />
    </view>

    <view class="test-section">
      <text class="section-title">2. LazyImage 组件（测试组）</text>
      <LazyImage
        class="test-image"
        src="https://images.unsplash.com/photo-1500000000211?w=400&h=600&fit=crop&q=80"
        :lazy="false"
        priority="high"
        mode="aspectFill"
      />
    </view>

    <view class="test-section">
      <text class="section-title">3. LazyImage 懒加载</text>
      <LazyImage
        class="test-image"
        src="https://images.unsplash.com/photo-1500000000429?w=400&h=600&fit=crop&q=80"
        :lazy="true"
        priority="high"
        mode="aspectFill"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import LazyImage from '@/components/LazyImage.vue'
</script>

<style scoped lang="scss">
.test-page {
  padding: 32rpx;

  .title {
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 32rpx;
    display: block;
  }

  .test-section {
    margin-bottom: 48rpx;

    .section-title {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 16rpx;
      display: block;
    }

    .test-image {
      width: 200rpx;
      height: 200rpx;
      border-radius: 12rpx;
      background: #f0f0f0;
    }
  }
}
</style>
