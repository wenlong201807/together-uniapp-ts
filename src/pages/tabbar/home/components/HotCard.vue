<template>
  <view class="hot-card" @click="handleCardClick">
    <view class="hot-badge">
      <text class="badge-icon">🔥</text>
      <text class="badge-text">热门</text>
    </view>

    <view class="card-header">
      <view class="user-info">
        <image
          class="avatar"
          v-img-proxy="user.avatar"
          mode="aspectFill"
        />
        <view class="user-details">
          <view class="user-name-row">
            <text class="username">{{ user.nickname }}</text>
            <text v-if="user.age" class="age">{{ user.age }}岁</text>
          </view>
          <text v-if="user.city" class="location">📍 {{ user.city }}</text>
        </view>
      </view>
    </view>

    <view v-if="user.bio" class="bio">
      <text class="bio-text">{{ user.bio }}</text>
    </view>

    <view v-if="user.photos && user.photos.length" class="photo-grid">
      <image
        v-for="(photo, photoIndex) in user.photos.slice(0, 3)"
        :key="photoIndex"
        class="photo"
        v-img-proxy="photo"
        mode="aspectFill"
        style="width: 6.25rem; height: 6.25rem;"
      />
    </view>

    <view class="hot-stats">
      <view class="stat-item">
        <text class="stat-icon">❤️</text>
        <text class="stat-text">{{ formatCount(hotScore.likes) }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-icon">💬</text>
        <text class="stat-text">{{ formatCount(hotScore.comments) }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-icon">⭐</text>
        <text class="stat-text">{{ formatCount(hotScore.favorites) }}</text>
      </view>
    </view>

    <view class="card-actions">
      <view class="action-btn skip-btn" @click.stop="handleSkip">
        <text class="action-text">跳过</text>
      </view>
      <view class="action-btn like-btn" @click.stop="handleLike">
        <text class="action-text">喜欢</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { RecommendUser } from './RecommendationCard.vue';

export interface HotScore {
  likes: number;
  comments: number;
  favorites: number;
}

interface Props {
  user: RecommendUser;
  hotScore: HotScore;
  index?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cardClick: [user: RecommendUser];
  like: [user: RecommendUser];
  skip: [user: RecommendUser];
}>();

const formatCount = (count?: number): string => {
  // 处理 undefined、null 或 0 的情况
  if (!count && count !== 0) {
    return '0';
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  return count.toString();
};

const handleCardClick = () => {
  emit('cardClick', props.user);
};

const handleLike = () => {
  emit('like', props.user);
};

const handleSkip = () => {
  emit('skip', props.user);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.hot-card {
  position: relative;
  background: $bg-primary;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transition: transform 0.3s, box-shadow 0.3s;

  &:active {
    transform: scale(0.98);
  }

  .hot-badge {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    display: flex;
    align-items: center;
    padding: 8rpx 16rpx;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
    border-radius: $radius-full;
    box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);

    .badge-icon {
      font-size: 24rpx;
      margin-right: 4rpx;
    }

    .badge-text {
      font-size: $font-size-xs;
      color: #ffffff;
      font-weight: $font-weight-bold;
    }
  }

  .card-header {
    margin-bottom: $margin-md;

    .user-info {
      display: flex;
      align-items: center;

      .avatar {
        width: 96rpx;
        height: 96rpx;
        border-radius: $radius-circle;
        margin-right: $margin-md;
        border: 4rpx solid $bg-secondary;
      }

      .user-details {
        flex: 1;

        .user-name-row {
          display: flex;
          align-items: center;
          margin-bottom: $margin-xs;

          .username {
            font-size: $font-size-lg;
            font-weight: $font-weight-bold;
            color: $text-primary;
            margin-right: $margin-sm;
          }

          .age {
            font-size: $font-size-sm;
            color: $text-secondary;
            padding: 4rpx 12rpx;
            background: $bg-secondary;
            border-radius: $radius-full;
          }
        }

        .location {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }

  .bio {
    margin-bottom: $margin-md;

    .bio-text {
      font-size: $font-size-base;
      color: $text-secondary;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .photo-grid {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .photo {
      display: block;
      width: 6.25rem;
      height: 6.25rem;
      border-radius: $radius-md;
      overflow: hidden;
      flex-shrink: 0;
    }
  }

  .hot-stats {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $margin-md;
    padding: $padding-md;
    background: rgba(255, 107, 107, 0.05);
    border-radius: $radius-md;

    .stat-item {
      display: flex;
      align-items: center;

      .stat-icon {
        font-size: 32rpx;
        margin-right: $margin-xs;
      }

      .stat-text {
        font-size: $font-size-sm;
        color: $text-secondary;
        font-weight: $font-weight-medium;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: $spacing-md;

    .action-btn {
      flex: 1;
      padding: $padding-md;
      border-radius: $radius-md;
      text-align: center;
      @include transition(all);

      &:active {
        transform: scale(0.95);
      }

      .action-text {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
      }

      &.skip-btn {
        background: rgba(0, 0, 0, 0.05);

        .action-text {
          color: $text-tertiary;
        }
      }

      &.like-btn {
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
