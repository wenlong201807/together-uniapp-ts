<template>
  <view class="nearby-card" @click="handleCardClick">
    <view class="nearby-badge">
      <text class="badge-icon">📍</text>
      <text class="badge-text">附近 {{ distance }}</text>
    </view>

    <view class="card-header">
      <view class="user-info">
        <image class="avatar" :src="user.avatar" mode="aspectFill" />
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
        v-for="(photo, index) in user.photos.slice(0, 3)"
        :key="index"
        class="photo"
        :src="photo"
        mode="aspectFill"
        :lazy-load="true"
      />
    </view>

    <view class="card-actions">
      <view class="action-btn skip-btn" @click.stop="handleSkip">
        <text class="action-text">跳过</text>
      </view>
      <view class="action-btn like-btn" @click.stop="handleLike">
        <text class="action-text">打招呼</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { RecommendUser } from './RecommendationCard.vue';

interface Props {
  user: RecommendUser;
  distance: string;
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

.nearby-card {
  position: relative;
  background: $bg-primary;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transition: transform 0.3s, box-shadow 0.3s;

  &:active {
    transform: scale(0.98);
  }

  .nearby-badge {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    display: flex;
    align-items: center;
    padding: 8rpx 16rpx;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border-radius: $radius-full;
    box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.4);

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
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .photo {
      width: 100%;
      height: 200rpx;
      border-radius: $radius-md;
      background: $bg-secondary;
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
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
