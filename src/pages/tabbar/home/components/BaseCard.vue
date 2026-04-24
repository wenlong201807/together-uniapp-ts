<template>
  <view class="base-card" :class="cardClass" @click="handleCardClick">
    <!-- 标签徽章插槽 -->
    <view v-if="$slots.badge || badge" class="card-badge">
      <slot name="badge">
        <view class="badge-content" :style="{ background: badgeColor }">
          <text class="badge-icon">{{ badge?.icon }}</text>
          <text class="badge-text">{{ badge?.text }}</text>
        </view>
      </slot>
    </view>

    <!-- 卡片头部 -->
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
      <!-- 头部额外内容插槽 -->
      <slot name="header-extra"></slot>
    </view>

    <!-- 个人简介 -->
    <view v-if="user.bio && showBio" class="bio">
      <text class="bio-text">{{ user.bio }}</text>
    </view>

    <!-- 标签 -->
    <view v-if="user.tags && user.tags.length && showTags" class="tags">
      <view v-for="(tag, index) in user.tags.slice(0, 3)" :key="index" class="tag">
        <text class="tag-text">{{ tag }}</text>
      </view>
    </view>

    <!-- 照片墙 -->
    <view v-if="user.photos && user.photos.length && showPhotos" class="photo-grid">
      <image
        v-for="(photo, index) in user.photos.slice(0, 3)"
        :key="index"
        class="photo"
        :src="photo"
        mode="aspectFill"
        :lazy-load="true"
      />
    </view>

    <!-- 自定义内容插槽 -->
    <slot name="content"></slot>

    <!-- 卡片底部操作 -->
    <view class="card-actions">
      <slot name="actions">
        <view class="action-btn skip-btn" @click.stop="handleSkip">
          <text class="action-text">跳过</text>
        </view>
        <view class="action-btn like-btn" @click.stop="handleLike">
          <text class="action-text">{{ likeText }}</text>
        </view>
        <view v-if="showDetailBtn" class="action-btn detail-btn" @click.stop="handleDetail">
          <text class="action-text">详情</text>
        </view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { UserData } from '../types/recommendation';

interface Badge {
  icon: string;
  text: string;
}

interface Props {
  user: UserData;
  badge?: Badge;
  badgeColor?: string;
  showBio?: boolean;
  showTags?: boolean;
  showPhotos?: boolean;
  showDetailBtn?: boolean;
  likeText?: string;
  cardClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showBio: true,
  showTags: true,
  showPhotos: true,
  showDetailBtn: true,
  likeText: '喜欢',
  cardClass: '',
});

const emit = defineEmits<{
  cardClick: [user: UserData];
  like: [user: UserData];
  skip: [user: UserData];
  detail: [user: UserData];
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

const handleDetail = () => {
  emit('detail', props.user);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.base-card {
  position: relative;
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

  .card-badge {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    z-index: 1;

    .badge-content {
      display: flex;
      align-items: center;
      padding: 8rpx 16rpx;
      border-radius: $radius-full;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);

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
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $margin-md;

    .user-info {
      display: flex;
      align-items: center;
      flex: 1;

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
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);

        .action-text {
          color: #ffffff;
        }
      }

      &.detail-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
