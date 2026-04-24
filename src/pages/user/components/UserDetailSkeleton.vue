<template>
  <view class="user-detail-skeleton">
    <!-- 用户头部骨架 -->
    <view class="skeleton-header">
      <view class="skeleton-avatar shimmer" />
      <view class="skeleton-info">
        <view class="skeleton-nickname shimmer" />
        <view class="skeleton-tag shimmer" />
      </view>
    </view>

    <!-- 统计数据骨架 -->
    <view class="skeleton-stats">
      <view v-for="i in 3" :key="i" class="skeleton-stat-item">
        <view class="skeleton-stat-value shimmer" />
        <view class="skeleton-stat-label shimmer" />
      </view>
    </view>

    <!-- 操作按钮骨架 -->
    <view class="skeleton-actions">
      <view class="skeleton-btn shimmer" />
      <view class="skeleton-btn shimmer" />
    </view>

    <!-- 动态列表骨架 -->
    <view class="skeleton-posts">
      <view class="skeleton-section-title shimmer" />
      <view v-for="i in 3" :key="i" class="skeleton-post-card">
        <view class="skeleton-post-header">
          <view class="skeleton-post-avatar shimmer" />
          <view class="skeleton-post-info">
            <view class="skeleton-post-name shimmer" />
            <view class="skeleton-post-time shimmer" />
          </view>
        </view>
        <view class="skeleton-post-content shimmer" />
        <view class="skeleton-post-images">
          <view v-for="j in 3" :key="j" class="skeleton-post-image shimmer" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.user-detail-skeleton {
  min-height: 100vh;
  background: $bg-secondary;

  .skeleton-header {
    background: $bg-primary;
    padding: $padding-xl;
    display: flex;
    align-items: center;
    margin-bottom: $margin-md;

    .skeleton-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: $radius-circle;
      margin-right: $margin-lg;
      flex-shrink: 0;
    }

    .skeleton-info {
      flex: 1;

      .skeleton-nickname {
        width: 200rpx;
        height: 36rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-sm;
      }

      .skeleton-tag {
        width: 120rpx;
        height: 32rpx;
        border-radius: $radius-sm;
      }
    }
  }

  .skeleton-stats {
    background: $bg-primary;
    padding: $padding-lg $padding-xl;
    display: flex;
    justify-content: space-around;
    margin-bottom: $margin-md;

    .skeleton-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-xs;

      .skeleton-stat-value {
        width: 80rpx;
        height: 40rpx;
        border-radius: $radius-sm;
      }

      .skeleton-stat-label {
        width: 60rpx;
        height: 24rpx;
        border-radius: $radius-sm;
      }
    }
  }

  .skeleton-actions {
    padding: 0 $padding-xl $padding-md;
    display: flex;
    gap: $spacing-md;

    .skeleton-btn {
      flex: 1;
      height: 80rpx;
      border-radius: $radius-full;
    }
  }

  .skeleton-posts {
    padding: $padding-md;

    .skeleton-section-title {
      width: 160rpx;
      height: 32rpx;
      border-radius: $radius-sm;
      margin-bottom: $margin-lg;
    }

    .skeleton-post-card {
      background: $bg-primary;
      border-radius: $radius-md;
      padding: $padding-lg;
      margin-bottom: $margin-md;

      .skeleton-post-header {
        display: flex;
        align-items: center;
        margin-bottom: $margin-md;

        .skeleton-post-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: $radius-circle;
          margin-right: $margin-md;
          flex-shrink: 0;
        }

        .skeleton-post-info {
          flex: 1;

          .skeleton-post-name {
            width: 160rpx;
            height: 28rpx;
            border-radius: $radius-sm;
            margin-bottom: $margin-xs;
          }

          .skeleton-post-time {
            width: 120rpx;
            height: 24rpx;
            border-radius: $radius-sm;
          }
        }
      }

      .skeleton-post-content {
        width: 100%;
        height: 120rpx;
        border-radius: $radius-sm;
        margin-bottom: $margin-md;
      }

      .skeleton-post-images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: $spacing-sm;

        .skeleton-post-image {
          aspect-ratio: 1;
          border-radius: $radius-sm;
        }
      }
    }
  }

  // 闪烁动画
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
