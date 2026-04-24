<template>
  <BaseCard
    :user="user"
    :badge="{ icon: '📍', text: `附近 ${distance}` }"
    badge-color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    card-class="nearby-card"
    like-text="打招呼"
    :show-detail-btn="false"
    @card-click="handleCardClick"
    @like="handleLike"
    @skip="handleSkip"
  />
</template>

<script setup lang="ts">
import BaseCard from './BaseCard.vue';
import type { UserData } from '../types/recommendation';

interface Props {
  user: UserData;
  distance: string;
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

.nearby-card {
  border: 2rpx solid transparent;
  background-image: linear-gradient($bg-primary, $bg-primary),
    linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
</style>
