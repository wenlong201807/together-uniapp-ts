<template>
  <view v-if="visible" class="toast-container" :class="position">
    <view class="toast" :class="[type, { 'with-icon': showIcon }]">
      <view v-if="showIcon" class="toast-icon">
        <text v-if="type === 'success'">✓</text>
        <text v-else-if="type === 'error'">✕</text>
        <text v-else-if="type === 'warning'">!</text>
        <text v-else-if="type === 'info'">i</text>
      </view>
      <text class="toast-message">{{ message }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  duration: 2000,
  position: 'center',
  showIcon: true,
});

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(true);

watch(
  () => props.message,
  () => {
    visible.value = true;
    if (props.duration > 0) {
      setTimeout(() => {
        visible.value = false;
        emit('close');
      }, props.duration);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.toast-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-toast;
  pointer-events: none;

  &.top {
    top: 100rpx;
  }

  &.center {
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &.bottom {
    bottom: 200rpx;
  }
}

.toast {
  min-width: 200rpx;
  max-width: 500rpx;
  padding: $padding-md $padding-lg;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: $radius-base;
  font-size: $font-size-base;
  text-align: center;
  animation: toast-fade-in $duration-base $ease-out;
  backdrop-filter: blur(10rpx);

  &.with-icon {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &.success {
    background: rgba(82, 196, 26, 0.9);
  }

  &.error {
    background: rgba(255, 77, 79, 0.9);
  }

  &.warning {
    background: rgba(250, 173, 20, 0.9);
  }

  &.info {
    background: rgba(24, 144, 255, 0.9);
  }

  .toast-icon {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: bold;
  }

  .toast-message {
    flex: 1;
    word-break: break-all;
  }
}

@keyframes toast-fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
