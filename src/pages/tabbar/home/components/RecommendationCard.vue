<template>
  <view class="recommendation-card" @click="handleCardClick">
    <view class="card-header">
      <view class="user-info">
        <image
          class="avatar"
          v-img-proxy="user.avatar"
          mode="aspectFill"
        />
        <view v-if="!user.avatar" class="avatar-fallback">
          <text class="fallback-text">{{ (user.nickname || '?').charAt(0) }}</text>
        </view>
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

    <view v-if="user.tags && user.tags.length" class="tags">
      <view v-for="(tag, index) in user.tags.slice(0, 3)" :key="index" class="tag">
        <text class="tag-text">{{ tag }}</text>
      </view>
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

    <view class="card-actions">
      <view class="action-btn skip-btn" @click.stop="handleSkip">
        <text class="action-icon">✕</text>
        <text class="action-text">跳过</text>
      </view>
      <view class="action-btn greet-btn" @click.stop="handleGreet">
        <text class="action-icon">👋</text>
        <text class="action-text">打招呼</text>
      </view>
      <view class="action-btn like-btn" @click.stop="handleLike">
        <text class="action-icon">❤️</text>
        <text class="action-text">喜欢</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface RecommendUser {
  id: number;
  nickname: string;
  avatar: string;
  age?: number;
  city?: string;
  bio?: string;
  tags?: string[];
  photos?: string[];
}

interface Props {
  user: RecommendUser;
  index?: number;  // 虚拟列表中的索引，用于动态优先级
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cardClick: [user: RecommendUser];
  greet: [user: RecommendUser];
  like: [user: RecommendUser];
  skip: [user: RecommendUser];
}>();

const handleCardClick = () => {
  emit('cardClick', props.user);
};

const handleGreet = () => {
  emit('greet', props.user);
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

.recommendation-card {
  background: $bg-primary;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
  }

  .card-header {
    margin-bottom: $margin-md;

    .user-info {
      display: flex;
      align-items: center;
      position: relative;

      .avatar {
        width: 96rpx;
        height: 96rpx;
        border-radius: $radius-circle;
        margin-right: $margin-md;
        border: 4rpx solid $bg-secondary;
      }

      .avatar-fallback {
        position: absolute;
        top: 0;
        left: 0;
        width: 96rpx;
        height: 96rpx;
        border-radius: $radius-circle;
        margin-right: $margin-md;
        background: $bg-tertiary;
        display: flex;
        align-items: center;
        justify-content: center;

        .fallback-text {
          font-size: $font-size-xl;
          color: $text-secondary;
          font-weight: $font-weight-bold;
        }
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

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .tag {
      padding: 8rpx 16rpx;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: $radius-full;

      .tag-text {
        font-size: $font-size-xs;
        color: $primary-color;
        font-weight: $font-weight-medium;
      }
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

  .card-actions {
    display: flex;
    gap: $spacing-md;

    .action-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $padding-md;
      border-radius: $radius-md;
      @include transition(all);

      &:active {
        transform: scale(0.95);
      }

      .action-icon {
        font-size: 40rpx;
        margin-bottom: $margin-xs;
      }

      .action-text {
        font-size: $font-size-xs;
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

      &.greet-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
