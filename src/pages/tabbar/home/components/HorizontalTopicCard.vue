<template>
  <view class="horizontal-topic-card" @click="handleClick">
    <view class="cover-wrapper">
      <image
        v-if="coverUrl"
        class="cover"
        v-img-proxy="coverUrl"
        mode="aspectFill"
      />
      <view v-else class="cover-placeholder">
        <text class="placeholder-icon">💬</text>
      </view>
    </view>
    <view class="topic-info">
      <text class="topic-name">{{ topic.name }}</text>
      <text class="topic-stats">{{ formatDisplayCount(topic.participantCount) }}人参与</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCount } from '@/utils/format';

interface Topic {
  id: number;
  name: string;
  description?: string;
  participantCount: number;
  postCount: number;
  coverImage?: string;
  coverImages?: string[];
}

interface Props {
  topic: Topic;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [topic: Topic];
}>();

const coverUrl = computed(() => {
  if (props.topic.coverImages && props.topic.coverImages.length > 0) {
    return props.topic.coverImages[0];
  }
  return props.topic.coverImage || '';
});

const formatDisplayCount = formatCount;

const handleClick = () => {
  emit('click', props.topic);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.horizontal-topic-card {
  display: flex;
  flex-direction: column;
  width: 180rpx;
  flex-shrink: 0;
  border-radius: $radius-lg;
  overflow: hidden;
  background: $bg-primary;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }

  .cover-wrapper {
    width: 100%;
    height: 140rpx;
    overflow: hidden;
    position: relative;

    .cover {
      width: 100%;
      height: 100%;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));

      .placeholder-icon {
        font-size: 48rpx;
      }
    }
  }

  .topic-info {
    display: flex;
    flex-direction: column;
    padding: $padding-sm $padding-sm $padding-base;

    .topic-name {
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: $text-primary;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 2rpx;
    }

    .topic-stats {
      font-size: 18rpx;
      color: $text-tertiary;
    }
  }
}
</style>
