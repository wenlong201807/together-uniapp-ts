<template>
  <!-- 无数据且非加载中时不渲染整个分区 -->
  <view v-if="loading || items.length > 0" class="horizontal-section">
    <!-- Section Header -->
    <view class="section-header">
      <view class="header-left">
        <view class="section-icon-wrapper" :style="{ background: badgeColor }">
          <text class="section-icon">{{ icon }}</text>
        </view>
        <text class="section-title">{{ title }}</text>
        <view v-if="!loading" class="count-badge">
          <text class="count-text">{{ items.length }}</text>
        </view>
      </view>
      <view v-if="items.length > 0" class="more-btn" @click="handleMore">
        <text class="more-text">更多</text>
        <text class="more-arrow">›</text>
      </view>
    </view>

    <!-- Horizontal Scroll Cards -->
    <scroll-view class="card-scroll" scroll-x :show-scrollbar="false">
      <view class="card-list">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <view v-for="i in 3" :key="i" class="skeleton-card">
            <view class="skeleton-avatar" />
            <view class="skeleton-name" />
            <view class="skeleton-meta" />
          </view>
        </template>

        <!-- Actual cards -->
        <template v-else>
          <!-- Topic type uses HorizontalTopicCard -->
          <template v-if="type === 'topic'">
            <HorizontalTopicCard
              v-for="card in topicCards"
              :key="card.id"
              :topic="card.topic"
              @click="handleItemClick($event, card.item)"
            />
          </template>

          <!-- Other types use HorizontalUserCard -->
          <template v-else>
            <HorizontalUserCard
              v-for="card in userCards"
              :key="card.id"
              :user="card.user"
              :distance="card.distance"
              :join-days="card.joinDays"
              :badge="cardBadge"
              :badge-color="badgeColor"
              @click="handleItemClick($event, card.item)"
            />
          </template>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HorizontalUserCard from './HorizontalUserCard.vue';
import HorizontalTopicCard from './HorizontalTopicCard.vue';
import { isTopicItem } from '../types/recommendation';
import type { RecommendationItem, RecommendationType, TopicData, UserData } from '../types/recommendation';

interface Props {
  title: string;
  icon: string;
  type: RecommendationType;
  items: RecommendationItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  more: [type: RecommendationType];
  itemClick: [item: RecommendationItem];
}>();

// Badge config per type
const badgeMap: Record<string, { icon: string; text: string }> = {
  personalized: { icon: '✨', text: '推荐' },
  hot: { icon: '🔥', text: '热门' },
  nearby: { icon: '📍', text: '附近' },
  new: { icon: '🌟', text: '新人' },
};

const colorMap: Record<string, string> = {
  personalized: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  hot: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
  nearby: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  new: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
};

// 类型安全的数据提取 + computed 缓存，避免每次渲染创建新对象导致子组件无意义重渲染
const topicCards = computed(() => {
  if (props.type !== 'topic') return [];
  return props.items
    .filter((item): item is Extract<RecommendationItem, { type: 'topic' }> => item.type === 'topic' && isTopicItem(item))
    .map(item => {
      const topic = item.data.topic;
      return {
        id: item.id,
        item,
        topic: {
          id: topic.id,
          name: topic.name || topic.title || '',
          description: topic.description,
          participantCount: topic.participantCount || 0,
          postCount: topic.postCount || 0,
          coverImage: topic.coverImage,
          coverImages: topic.coverImages,
        },
      };
    });
});

const userCards = computed(() => {
  if (props.type === 'topic') return [];
  return props.items
    .filter(item => item.type !== 'topic')
    .map(item => {
      const data = item.data as { user?: UserData; distance?: string; joinDays?: number };
      return {
        id: item.id,
        item,
        user: data.user || ({} as UserData),
        distance: data.distance,
        joinDays: data.joinDays,
      };
    });
});

const cardBadge = computed(() => badgeMap[props.type]);
const badgeColor = computed(() => colorMap[props.type] || colorMap.personalized);

const handleMore = () => {
  emit('more', props.type);
};

const handleItemClick = (_payload: unknown, item: RecommendationItem) => {
  emit('itemClick', item);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.horizontal-section {
  margin-bottom: $margin-lg;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $margin-base;
    padding: 0 $padding-xs;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .section-icon-wrapper {
        width: 48rpx;
        height: 48rpx;
        border-radius: $radius-md;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .section-icon {
        font-size: 28rpx;
      }

      .section-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }

      .count-badge {
        min-width: 32rpx;
        height: 32rpx;
        border-radius: $radius-full;
        background: $bg-tertiary;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 10rpx;

        .count-text {
          font-size: 18rpx;
          color: $text-tertiary;
          font-weight: $font-weight-medium;
        }
      }
    }

    .more-btn {
      display: flex;
      align-items: center;
      padding: 8rpx 20rpx;
      border-radius: $radius-full;
      background: $bg-secondary;
      gap: 4rpx;

      .more-text {
        font-size: $font-size-sm;
        color: $text-secondary;
      }

      .more-arrow {
        font-size: $font-size-lg;
        color: $text-tertiary;
        line-height: 1;
      }

      &:active {
        opacity: 0.7;
      }
    }
  }

  .card-scroll {
    width: 100%;
    white-space: nowrap;

    .card-list {
      display: flex;
      gap: $spacing-md;
      padding: 0 $padding-xs;
      padding-bottom: $padding-sm;
    }
  }

  .skeleton-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 200rpx;
    flex-shrink: 0;
    padding: $padding-md;
    background: $bg-primary;
    border-radius: $radius-lg;

    .skeleton-avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: $radius-circle;
      background: $bg-secondary;
      margin-bottom: $margin-sm;
    }

    .skeleton-name {
      width: 120rpx;
      height: 28rpx;
      border-radius: $radius-sm;
      background: $bg-secondary;
      margin-bottom: 8rpx;
    }

    .skeleton-meta {
      width: 80rpx;
      height: 20rpx;
      border-radius: $radius-sm;
      background: $bg-secondary;
    }
  }
}
</style>
