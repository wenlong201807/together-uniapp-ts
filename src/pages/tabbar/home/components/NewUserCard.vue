<template>
  <view class="new-user-card" @click="handleCardClick">
    <view class="new-badge">
      <text class="badge-icon">🌟</text>
      <text class="badge-text">新人 · {{ joinDays }}天</text>
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

    <view class="welcome-tip">
      <text class="tip-icon">👋</text>
      <text class="tip-text">新人刚加入，快来打个招呼吧！</text>
    </view>

    <view class="card-actions">
      <view class="action-btn skip-btn" @click.stop="handleSkip">
        <text class="action-text">跳过</text>
      </view>
      <view class="action-btn like-btn" @click.stop="handleLike">
        <text class="action-text">欢迎TA</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { RecommendUser } from './RecommendationCard.vue';

interface Props {
  user: RecommendUser;
  joinDays: number;
  index?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cardClick: [user: RecommendUser];
  like: [user: RecommendUser];
  skip: [user: RecommendUser];
}>();

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

.new-user-card {
  position: relative;
  background: $bg-primary;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transition: transform 0.3s, box-shadow 0.3s;

  &:active {
    transform: scale(0.98);
  }

  .new-badge {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    display: flex;
    align-items: center;
    padding: 8rpx 16rpx;
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    border-radius: $radius-full;
    box-shadow: 0 4rpx 12rpx rgba(67, 233, 123, 0.4);

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
      width: 6.25rem;
      height: 6.25rem;
      border-radius: $radius-md;
      background: $bg-secondary;
      flex-shrink: 0;
    }
  }

  .welcome-tip {
    display: flex;
    align-items: center;
    padding: $padding-md;
    background: rgba(67, 233, 123, 0.05);
    border-radius: $radius-md;
    margin-bottom: $margin-md;

    .tip-icon {
      font-size: 32rpx;
      margin-right: $margin-sm;
    }

    .tip-text {
      flex: 1;
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.5;
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
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
