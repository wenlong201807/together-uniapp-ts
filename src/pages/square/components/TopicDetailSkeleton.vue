<template>
  <view class="topic-detail-skeleton">
    <!-- 话题头部骨架 -->
    <view class="skeleton-header">
      <view class="skeleton-cover shimmer" />
      <view class="skeleton-info">
        <view class="skeleton-title shimmer" />
        <view class="skeleton-desc shimmer" />
        <view class="skeleton-stats">
          <view v-for="i in 3" :key="i" class="skeleton-stat shimmer" />
        </view>
      </view>
    </view>

    <!-- 操作按钮骨架 -->
    <view class="skeleton-actions">
      <view class="skeleton-btn shimmer" />
      <view class="skeleton-btn shimmer" />
    </view>

    <!-- 动态列表骨架 -->
    <view class="skeleton-posts">
      <view v-for="i in 3" :key="i" class="skeleton-post-card">
        <view class="skeleton-post-header">
          <view class="skeleton-avatar shimmer" />
          <view class="skeleton-user-info">
            <view class="skeleton-name shimmer" />
            <view class="skeleton-time shimmer" />
          </view>
        </view>
        <view class="skeleton-content shimmer" />
        <view class="skeleton-images">
          <view v-for="j in 3" :key="j" class="skeleton-image shimmer" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.topic-detail-skeleton {
  min-height: 100vh;
  background: $bg-secondary;

  .skeleton-header {
    background: $bg-primary;
    padding: $padding-xl;
    margin-bottom: $margin-md;

    .skeleton-cover {
      width: 100%;
      height: 200rpx;
      border-radius: $radius-md;
      margin-bottom: $margin-lg;
    }

    .skeleton-info {
      .skeleton-title {
        width: 60%;
        height: 40rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-md;
      }

      .skeleton-desc {
        width: 100%;
        height: 60rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-lg;
      }

      .skeleton-stats {
        display: flex;
        gap: $spacing-lg;

        .skeleton-stat {
          width: 120rpx;
          height: 32rpx;
          border-radius: $radius-sm;
        }
      }
    }
  }

  .skeleton-actions {
    padding: 0 $padding-xl $padding-md;
    display: flex;
    gap: $spacing-md;

    .skeleton-btn {
      flex: 1;
      height: $button-height-lg;
      border-radius: $radius-full;
    }
  }

  .skeleton-posts {
    padding: $padding-md;

    .skeleton-post-card {
      background: $bg-primary;
      border-radius: $radius-md;
      padding: $padding-lg;
      margin-bottom: $margin-md;

      .skeleton-post-header {
        display: flex;
        align-items: center;
        margin-bottom: $margin-md;

        .skeleton-avatar {
          width: $avatar-size-sm;
          height: $avatar-size-sm;
          border-radius: $radius-circle;
          margin-right: $margin-md;
          flex-shrink: 0;
        }

        .skeleton-user-info {
          flex: 1;

          .skeleton-name {
            width: 120rpx;
            height: 28rpx;
            border-radius: $radius-sm;
            margin-bottom: $margin-xs;
          }

          .skeleton-time {
            width: 80rpx;
            height: 24rpx;
            border-radius: $radius-sm;
          }
        }
      }

      .skeleton-content {
        width: 100%;
        height: 100rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-md;
      }

      .skeleton-images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: $spacing-sm;

        .skeleton-image {
          aspect-ratio: 1;
          border-radius: $radius-sm;
        }
      }
    }
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      $bg-tertiary 25%,
      #e8e8e8 50%,
      $bg-tertiary 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
}
</style>
