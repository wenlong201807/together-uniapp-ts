<template>
  <view class="like-animation-container" @click="handleLike">
    <view
      class="like-icon"
      :class="{ 'is-liked': isLiked, 'is-animating': isAnimating }"
    >
      <text class="icon">{{ isLiked ? '❤️' : '🤍' }}</text>
    </view>

    <!-- 粒子效果 -->
    <view v-if="showParticles" class="particles">
      <view
        v-for="i in 6"
        :key="i"
        class="particle"
        :style="getParticleStyle(i)"
      ></view>
    </view>

    <!-- 点赞数 -->
    <text v-if="showCount" class="like-count" :class="{ 'count-increase': countIncreasing }">
      {{ displayCount }}
    </text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  liked?: boolean;
  count?: number;
  showCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  liked: false,
  count: 0,
  showCount: true,
});

const emit = defineEmits<{
  like: [];
  unlike: [];
}>();

const isLiked = ref(props.liked);
const currentCount = ref(props.count);
const isAnimating = ref(false);
const showParticles = ref(false);
const countIncreasing = ref(false);

const displayCount = computed(() => {
  if (currentCount.value >= 10000) {
    return `${(currentCount.value / 10000).toFixed(1)}w`;
  }
  return currentCount.value.toString();
});

watch(() => props.liked, (newVal) => {
  isLiked.value = newVal;
});

watch(() => props.count, (newVal) => {
  currentCount.value = newVal;
});

const handleLike = () => {
  if (isAnimating.value) return;

  isAnimating.value = true;
  isLiked.value = !isLiked.value;

  if (isLiked.value) {
    // 点赞
    currentCount.value++;
    countIncreasing.value = true;
    showParticles.value = true;
    emit('like');

    // 粒子效果持续时间
    setTimeout(() => {
      showParticles.value = false;
    }, 800);

    // 数字增加动画
    setTimeout(() => {
      countIncreasing.value = false;
    }, 300);
  } else {
    // 取消点赞
    currentCount.value--;
    emit('unlike');
  }

  // 动画结束
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
};

const getParticleStyle = (index: number) => {
  const angle = (index / 6) * 360;
  const radian = (angle * Math.PI) / 180;
  const distance = 60;
  const x = Math.cos(radian) * distance;
  const y = Math.sin(radian) * distance;

  return {
    '--tx': `${x}rpx`,
    '--ty': `${y}rpx`,
    animationDelay: `${index * 50}ms`,
  };
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.like-animation-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  user-select: none;

  .like-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    transition: transform 0.3s $ease-out;

    .icon {
      font-size: 48rpx;
      transition: transform 0.2s $ease-out;
    }

    &.is-animating {
      animation: like-bounce 0.3s $ease-out;

      .icon {
        animation: icon-scale 0.3s $ease-out;
      }
    }

    &.is-liked .icon {
      filter: drop-shadow(0 4rpx 8rpx rgba(255, 107, 107, 0.4));
    }

    &:active {
      transform: scale(0.9);
    }
  }

  .particles {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;

    .particle {
      position: absolute;
      width: 12rpx;
      height: 12rpx;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
      border-radius: 50%;
      animation: particle-fly 0.8s $ease-out forwards;
    }
  }

  .like-count {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-medium;
    transition: all 0.3s $ease-out;

    &.count-increase {
      animation: count-pop 0.3s $ease-out;
      color: #ff6b6b;
    }
  }
}

@keyframes like-bounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes icon-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes particle-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}

@keyframes count-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
