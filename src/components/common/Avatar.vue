<template>
  <view :class="['avatar-container', sizeClass]" @click="handleClick">
    <!-- MBTI 预设头像 -->
    <view v-if="avatarDisplay.type === 'preset' && avatarDisplay.icon" class="mbti-avatar">
      <text class="mbti-icon">{{ avatarDisplay.icon }}</text>
    </view>
    <!-- 自定义头像 -->
    <image
      v-else
      class="custom-avatar"
      :src="avatarDisplay.displayUrl"
      mode="aspectFill"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getAvatarDisplay } from '@/utils/avatar';

const props = defineProps<{
  avatarId?: number;
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large';
}>();

const emit = defineEmits<{
  click: [];
}>();

const avatarDisplay = computed(() => {
  return getAvatarDisplay(props.avatarId, props.avatarUrl);
});

const sizeClass = computed(() => {
  return `size-${props.size || 'medium'}`;
});

const handleClick = () => {
  emit('click');
};
</script>

<style scoped lang="scss">
.avatar-container {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;

  &.size-small {
    width: 60rpx;
    height: 60rpx;

    .mbti-icon {
      font-size: 30rpx;
    }
  }

  &.size-medium {
    width: 80rpx;
    height: 80rpx;

    .mbti-icon {
      font-size: 40rpx;
    }
  }

  &.size-large {
    width: 160rpx;
    height: 160rpx;

    .mbti-icon {
      font-size: 80rpx;
    }
  }

  .mbti-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .custom-avatar {
    width: 100%;
    height: 100%;
  }
}
</style>
