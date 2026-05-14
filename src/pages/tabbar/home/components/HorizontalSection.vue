<template>
  <view class="horizontal-section">
    <!-- Section Header -->
    <view class="section-header">
      <view class="header-left">
        <text class="section-icon">{{ icon }}</text>
        <text class="section-title">{{ title }}</text>
      </view>
      <view class="more-btn" @click="handleMore">
        <text class="more-text">更多</text>
        <text class="more-arrow">></text>
      </view>
    </view>

    <!-- Horizontal Scroll Cards -->
    <scroll-view class="card-scroll" scroll-x :show-scrollbar="false">
      <view class="card-list">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <view v-for="i in 5" :key="i" class="skeleton-card">
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

          <!-- Empty placeholder -->
          <view
            v-if="items.length === 0"
            class="empty-card"
          >
            <text class="empty-text">暂无数据</text>
          </view>
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
  return props.items.map(item => {
    // 利用类型守卫安全提取 topic 数据
    const topic = isTopicItem(item) ? item.data.topic : (item.data as unknown as { topic: TopicData }).topic;
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
  return props.items.map(item => {
    // 所有非 topic 类型都有 user 字段
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

const handleItemClick = (_data: any, item: RecommendationItem) => {
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
    margin-bottom: $margin-md;
    padding: 0 $padding-xs;

    .header-left {
      display: flex;
      align-items: center;

      .section-icon {
        font-size: 36rpx;
        margin-right: $margin-xs;
      }

      .section-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }
    }

    .more-btn {
      display: flex;
      align-items: center;
      padding: 8rpx 16rpx;
      border-radius: $radius-full;
      background: $bg-secondary;

      .more-text {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-right: 4rpx;
      }

      .more-arrow {
        font-size: $font-size-sm;
        color: $text-tertiary;
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
    width: 240rpx;
    flex-shrink: 0;
    padding: $padding-md;
    background: $bg-primary;
    border-radius: $radius-lg;

    .skeleton-avatar {
      width: 120rpx;
      height: 120rpx;
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

  .empty-card {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 240rpx;
    height: 280rpx;
    flex-shrink: 0;
    background: $bg-primary;
    border-radius: $radius-lg;

    .empty-text {
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }
}
</style>
