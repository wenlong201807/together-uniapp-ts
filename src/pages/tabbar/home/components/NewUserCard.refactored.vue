<template>
  <BaseCard
    :user="user"
    :badge="{ icon: '🌟', text: `新人 · ${joinDays}天` }"
    badge-color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    card-class="new-user-card"
    like-text="欢迎TA"
    :show-detail-btn="false"
    @card-click="handleCardClick"
    @like="handleLike"
    @skip="handleSkip"
  >
    <template #content>
      <view class="welcome-tip">
        <text class="tip-icon">👋</text>
        <text class="tip-text">新人刚加入，快来打个招呼吧！</text>
      </view>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue';
import type { UserData } from '../types/recommendation';

interface Props {
  user: UserData;
  joinDays: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cardClick: [user: UserData];
  like: [user: UserData];
  skip: [user: UserData];
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
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.new-user-card {
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.welcome-tip {
  display: flex;
  align-items: center;
  padding: $padding-md;
  background: rgba(67, 233, 123, 0.05);
  border-radius: $radius-md;
  margin-bottom: $margin-md;

  .tip-icon {
    font-size: 32rpx;
    margin-right: $margin-sm;
  }

  .tip-text {
    flex: 1;
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.5;
  }
}
</style>
