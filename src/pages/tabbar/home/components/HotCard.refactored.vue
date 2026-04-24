<template>
  <BaseCard
    :user="user"
    :badge="{ icon: '🔥', text: '热门' }"
    badge-color="linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)"
    card-class="hot-card"
    @card-click="handleCardClick"
    @like="handleLike"
    @skip="handleSkip"
  >
    <template #content>
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
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue';
import type { UserData } from '../types/recommendation';

export interface HotScore {
  likes: number;
  comments: number;
  favorites: number;
}

interface Props {
  user: UserData;
  hotScore: HotScore;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cardClick: [user: UserData];
  like: [user: UserData];
  skip: [user: UserData];
}>();

const formatCount = (count: number): string => {
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
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
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
</style>
