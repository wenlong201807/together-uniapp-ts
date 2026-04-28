<template>
  <view class="topic-card" @click="handleCardClick">
    <view class="card-header">
      <text class="topic-icon">💬</text>
      <view class="topic-info">
        <text class="topic-title">{{ topic.title }}</text>
        <text class="topic-stats">{{ formatCount(topic.participantCount) }}人参与 · {{ formatCount(topic.postCount) }}条动态</text>
      </view>
    </view>

    <view v-if="topic.description" class="topic-description">
      <text class="description-text">{{ topic.description }}</text>
    </view>

    <view v-if="coverImageList.length" class="cover-images">
      <LazyImage
        v-for="(image, imageIndex) in coverImageList.slice(0, 3)"
        :key="imageIndex"
        class="cover-image"
        :src="image"
        :width="400"
        :height="300"
        :priority="imagePriority"
        mode="aspectFill"
      />
    </view>

    <view class="card-actions">
      <view class="action-btn view-btn" @click.stop="handleView">
        <text class="action-text">查看话题</text>
      </view>
      <view class="action-btn join-btn" @click.stop="handleJoin">
        <text class="action-text">参与讨论</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LazyImage from '@/components/LazyImage.vue'

export interface Topic {
  id: number;
  title: string;
  description?: string;
  participantCount: number;
  postCount: number;
  coverImage?: string;
  coverImages?: string[];
}

interface Props {
  topic: Topic;
  index?: number;
}

const props = defineProps<Props>();

const imagePriority = computed(() => {
  if (props.index === undefined) return 'low';
  if (props.index < 3) return 'high';
  return 'low';
});

const emit = defineEmits<{
  cardClick: [topic: Topic];
  view: [topic: Topic];
  join: [topic: Topic];
}>();

// 处理封面图片列表
const coverImageList = computed(() => {
  if (props.topic.coverImages && props.topic.coverImages.length > 0) {
    return props.topic.coverImages;
  }
  if (props.topic.coverImage) {
    return [props.topic.coverImage];
  }
  return [];
});

const formatCount = (count?: number): string => {
  if (!count && count !== 0) {
    return '0';
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  return count.toString();
};

const handleCardClick = () => {
  emit('cardClick', props.topic);
};

const handleView = () => {
  emit('view', props.topic);
};

const handleJoin = () => {
  emit('join', props.topic);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.topic-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid rgba(102, 126, 234, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;

  &:active {
    transform: scale(0.98);
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: $margin-md;

    .topic-icon {
      font-size: 64rpx;
      margin-right: $margin-md;
    }

    .topic-info {
      flex: 1;

      .topic-title {
        display: block;
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-xs;
      }

      .topic-stats {
        font-size: $font-size-xs;
        color: $text-tertiary;
      }
    }
  }

  .topic-description {
    margin-bottom: $margin-md;

    .description-text {
      font-size: $font-size-base;
      color: $text-secondary;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .cover-images {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $margin-md;

    .cover-image {
      width: 6.25rem;
      height: 6.25rem;
      border-radius: $radius-md;
      background: $bg-secondary;
      flex-shrink: 0;
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

      &.view-btn {
        background: rgba(102, 126, 234, 0.1);

        .action-text {
          color: $primary-color;
        }
      }

      &.join-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .action-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
