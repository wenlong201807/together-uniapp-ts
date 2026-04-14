<template>
  <view class="skeleton" :class="{ animated }">
    <view
      v-if="type === 'avatar'"
      class="skeleton-avatar"
      :style="avatarStyle"
    />
    <view
      v-else-if="type === 'image'"
      class="skeleton-image"
      :style="imageStyle"
    />
    <view
      v-else-if="type === 'text'"
      class="skeleton-text"
      :style="textStyle"
    />
    <view v-else-if="type === 'card'">
      <view class="skeleton-card">
        <view class="skeleton-card-header">
          <view class="skeleton-avatar" />
          <view class="skeleton-card-info">
            <view class="skeleton-text" style="width: 120rpx; height: 28rpx" />
            <view
              class="skeleton-text"
              style="width: 80rpx; height: 24rpx; margin-top: 8rpx"
            />
          </view>
        </view>
        <view class="skeleton-card-content">
          <view class="skeleton-text" style="width: 100%; height: 28rpx" />
          <view
            class="skeleton-text"
            style="width: 90%; height: 28rpx; margin-top: 12rpx"
          />
          <view
            class="skeleton-text"
            style="width: 70%; height: 28rpx; margin-top: 12rpx"
          />
        </view>
        <view v-if="showImage" class="skeleton-card-image">
          <view class="skeleton-image" style="width: 100%; height: 200rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'avatar' | 'image' | 'text' | 'card';
  width?: string;
  height?: string;
  animated?: boolean;
  showImage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  width: '100%',
  height: '28rpx',
  animated: true,
  showImage: true,
});

const avatarStyle = computed(() => ({
  width: props.width || '80rpx',
  height: props.height || '80rpx',
}));

const imageStyle = computed(() => ({
  width: props.width,
  height: props.height || '200rpx',
}));

const textStyle = computed(() => ({
  width: props.width,
  height: props.height,
}));
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.skeleton {
  &.animated {
    .skeleton-avatar,
    .skeleton-image,
    .skeleton-text {
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: skeleton-loading 1.5s ease-in-out infinite;
      }
    }
  }
}

@keyframes skeleton-loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.skeleton-avatar {
  background: $bg-tertiary;
  border-radius: $radius-circle;
}

.skeleton-image {
  background: $bg-tertiary;
  border-radius: $radius-sm;
}

.skeleton-text {
  background: $bg-tertiary;
  border-radius: $radius-xs;
}

.skeleton-card {
  background: $bg-primary;
  border-radius: $radius-base;
  padding: $padding-lg;
  margin-bottom: $margin-md;

  .skeleton-card-header {
    display: flex;
    align-items: center;
    margin-bottom: $margin-md;

    .skeleton-avatar {
      width: 80rpx;
      height: 80rpx;
      margin-right: $margin-md;
    }

    .skeleton-card-info {
      flex: 1;
    }
  }

  .skeleton-card-content {
    margin-bottom: $margin-md;
  }

  .skeleton-card-image {
    margin-top: $margin-md;
  }
}
</style>
