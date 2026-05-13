<template>
  <view class="horizontal-user-card" @click="handleClick">
    <view class="avatar-wrapper">
      <image
        class="avatar"
        v-img-proxy="user.avatar"
        mode="aspectFill"
      />
      <view v-if="badge" class="card-badge" :style="{ background: badgeColor }">
        <text class="badge-icon">{{ badge.icon }}</text>
        <text class="badge-text">{{ badge.text }}</text>
      </view>
    </view>
    <view class="user-info">
      <text class="nickname">{{ user.nickname }}</text>
      <view class="meta-row">
        <text v-if="joinDays" class="meta-item highlight">{{ joinDays }}天加入</text>
        <text v-if="user.age" class="meta-item">{{ user.age }}岁</text>
        <text v-if="user.city" class="meta-item">{{ user.city }}</text>
        <text v-if="distance" class="meta-item distance">{{ distance }}</text>
      </view>
      <view v-if="user.tags && user.tags.length" class="tags">
        <text
          v-for="(tag, idx) in user.tags.slice(0, 2)"
          :key="idx"
          class="tag"
        >{{ tag }}</text>
      </view>
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
  distance?: string;
  joinDays?: number;
  badge?: Badge;
  badgeColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  badgeColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
});

const emit = defineEmits<{
  click: [user: UserData];
}>();

const handleClick = () => {
  emit('click', props.user);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.horizontal-user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 240rpx;
  flex-shrink: 0;
  padding: $padding-md;
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }

  .avatar-wrapper {
    position: relative;
    margin-bottom: $margin-sm;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: $radius-circle;
      border: 4rpx solid $bg-secondary;
    }

    .card-badge {
      position: absolute;
      bottom: -8rpx;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      padding: 2rpx 12rpx;
      border-radius: $radius-full;
      white-space: nowrap;

      .badge-icon {
        font-size: 18rpx;
        margin-right: 2rpx;
      }

      .badge-text {
        font-size: 18rpx;
        color: #ffffff;
        font-weight: $font-weight-bold;
      }
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;

    .nickname {
      font-size: $font-size-base;
      font-weight: $font-weight-bold;
      color: $text-primary;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      margin-bottom: 4rpx;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      margin-bottom: 4rpx;

      .meta-item {
        font-size: $font-size-xs;
        color: $text-tertiary;

        &.distance {
          color: #4facfe;
        }

        &.highlight {
          color: #43e97b;
          font-weight: $font-weight-medium;
        }
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4rpx;

      .tag {
        font-size: 18rpx;
        padding: 2rpx 8rpx;
        background: rgba(102, 126, 234, 0.08);
        color: $primary-color;
        border-radius: $radius-full;
      }
    }
  }
}
</style>
