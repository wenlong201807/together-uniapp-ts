<template>
  <view class="top-navigation">
    <view class="nav-left">
      <view class="location" @click="handleLocationClick">
        <text class="location-icon">📍</text>
        <text class="location-text">{{ currentCity }}</text>
        <text class="location-arrow">▼</text>
      </view>
    </view>

    <view class="nav-center guide-search-box">
      <view class="search-box" @click="handleSearchClick">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索话题</text>
      </view>
    </view>

    <view class="nav-right">
      <view class="message-icon" @click="handleMessageClick">
        <text class="icon">💬</text>
        <view v-if="unreadCount > 0" class="badge">
          <text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  city?: string;
  unreadCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  city: '定位中...',
  unreadCount: 0,
});

const emit = defineEmits<{
  locationClick: [];
  searchClick: [];
  messageClick: [];
}>();

const currentCity = computed(() => props.city);

const handleLocationClick = () => {
  emit('locationClick');
};

const handleSearchClick = () => {
  emit('searchClick');
};

const handleMessageClick = () => {
  emit('messageClick');
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.top-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $padding-md $padding-lg;
  background: $bg-primary;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;

  .nav-left {
    flex-shrink: 0;

    .location {
      display: flex;
      align-items: center;
      padding: $padding-xs $padding-sm;
      background: $bg-secondary;
      border-radius: $radius-full;
      @include transition(all);

      &:active {
        opacity: 0.7;
      }

      .location-icon {
        font-size: $font-size-base;
        margin-right: 4rpx;
      }

      .location-text {
        font-size: $font-size-sm;
        color: $text-primary;
        max-width: 120rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .location-arrow {
        font-size: 20rpx;
        color: $text-tertiary;
        margin-left: 4rpx;
      }
    }
  }

  .nav-center {
    flex: 1;
    margin: 0 $margin-md;

    .search-box {
      display: flex;
      align-items: center;
      padding: $padding-sm $padding-md;
      background: $bg-secondary;
      border-radius: $radius-full;
      @include transition(all);

      &:active {
        opacity: 0.7;
      }

      .search-icon {
        font-size: $font-size-base;
        margin-right: $margin-xs;
      }

      .search-placeholder {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }
  }

  .nav-right {
    flex-shrink: 0;

    .message-icon {
      position: relative;
      width: 72rpx;
      height: 72rpx;
      @include flex-center;
      background: $bg-secondary;
      border-radius: $radius-circle;
      @include transition(all);

      &:active {
        opacity: 0.7;
      }

      .icon {
        font-size: $font-size-lg;
      }

      .badge {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;
        @include flex-center;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
        border-radius: $radius-full;
        box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.4);

        .badge-text {
          font-size: 20rpx;
          color: #ffffff;
          font-weight: $font-weight-bold;
          line-height: 1;
        }
      }
    }
  }
}
</style>
