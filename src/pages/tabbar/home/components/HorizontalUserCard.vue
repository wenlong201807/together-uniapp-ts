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
      </view>
      <!-- Default avatar placeholder when no avatar -->
      <view v-if="!user.avatar" class="avatar-fallback">
        <text class="fallback-text">{{ (user.nickname || '?').charAt(0) }}</text>
      </view>
    </view>
    <view class="user-info">
      <text class="nickname">{{ user.nickname || '用户' }}</text>
      <view class="meta-row">
        <text v-if="joinDays" class="meta-item highlight">{{ joinDays }}天加入</text>
        <text v-if="user.age" class="meta-item">{{ user.age }}岁</text>
        <text v-if="distance" class="meta-item distance">{{ distance }}</text>
      </view>
      <view v-if="user.city" class="city-row">
        <text class="city-text">{{ user.city }}</text>
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
  width: 160rpx;
  flex-shrink: 0;
  padding: $padding-base $padding-sm $padding-base;
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }

  .avatar-wrapper {
    position: relative;
    margin-bottom: $margin-sm;

    .avatar {
      width: 96rpx;
      height: 96rpx;
      border-radius: $radius-circle;
      border: 3rpx solid $bg-tertiary;
    }

    .avatar-fallback {
      position: absolute;
      top: 0;
      left: 0;
      width: 96rpx;
      height: 96rpx;
      border-radius: $radius-circle;
      background: $bg-tertiary;
      display: flex;
      align-items: center;
      justify-content: center;

      .fallback-text {
        font-size: $font-size-lg;
        color: $text-secondary;
        font-weight: $font-weight-bold;
      }
    }

    .card-badge {
      position: absolute;
      bottom: -4rpx;
      right: -4rpx;
      width: 32rpx;
      height: 32rpx;
      border-radius: $radius-circle;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid $bg-primary;

      .badge-icon {
        font-size: 18rpx;
      }
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;

    .nickname {
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: $text-primary;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      margin-bottom: 2rpx;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4rpx;
      margin-bottom: 2rpx;

      .meta-item {
        font-size: 18rpx;
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

    .city-row {
      .city-text {
        font-size: 18rpx;
        color: $text-tertiary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 120rpx;
        text-align: center;
      }
    }
  }
}
</style>
