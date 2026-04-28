<template>
  <view class="skeleton-card">
    <view class="skeleton-header">
      <view class="skeleton-avatar skeleton-shimmer"></view>
      <view class="skeleton-user-info">
        <view class="skeleton-name skeleton-shimmer"></view>
        <view class="skeleton-location skeleton-shimmer"></view>
      </view>
    </view>

    <view v-if="showBio" class="skeleton-bio skeleton-shimmer"></view>

    <view v-if="showTags" class="skeleton-tags">
      <view v-for="i in 3" :key="i" class="skeleton-tag skeleton-shimmer"></view>
    </view>

    <view v-if="showPhotos" class="skeleton-photos">
      <view v-for="i in 3" :key="i" class="skeleton-photo skeleton-shimmer"></view>
    </view>

    <view class="skeleton-actions">
      <view v-for="i in 3" :key="i" class="skeleton-action skeleton-shimmer"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  showBio?: boolean;
  showTags?: boolean;
  showPhotos?: boolean;
}

withDefaults(defineProps<Props>(), {
  showBio: true,
  showTags: true,
  showPhotos: true,
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.skeleton-card {
  background: $bg-primary;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

  .skeleton-header {
    display: flex;
    align-items: center;
    margin-bottom: $margin-md;

    .skeleton-avatar {
      width: 96rpx;
      height: 96rpx;
      border-radius: $radius-circle;
      margin-right: $margin-md;
      background: $bg-secondary;
    }

    .skeleton-user-info {
      flex: 1;

      .skeleton-name {
        width: 200rpx;
        height: 32rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-xs;
        background: $bg-secondary;
      }

      .skeleton-location {
        width: 150rpx;
        height: 24rpx;
        border-radius: $radius-sm;
        background: $bg-secondary;
      }
    }
  }

  .skeleton-bio {
    width: 100%;
    height: 80rpx;
    border-radius: $radius-sm;
    margin-bottom: $margin-md;
    background: $bg-secondary;
  }

  .skeleton-tags {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .skeleton-tag {
      width: 120rpx;
      height: 48rpx;
      border-radius: $radius-full;
      background: $bg-secondary;
    }
  }

  .skeleton-photos {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .skeleton-photo {
      width: 6.25rem;
      height: 6.25rem;
      border-radius: $radius-md;
      background: $bg-secondary;
      flex-shrink: 0;
    }
  }

  .skeleton-actions {
    display: flex;
    gap: $spacing-md;

    .skeleton-action {
      flex: 1;
      height: 80rpx;
      border-radius: $radius-md;
      background: $bg-secondary;
    }
  }
}

.skeleton-shimmer {
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
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>
