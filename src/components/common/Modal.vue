<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" :class="{ 'modal-enter': entering }" @click.stop>
      <view v-if="title" class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <view v-if="showClose" class="modal-close" @click="handleClose">
          <text>✕</text>
        </view>
      </view>

      <view class="modal-body">
        <slot>
          <text v-if="content" class="modal-content">{{ content }}</text>
        </slot>
      </view>

      <view v-if="showFooter" class="modal-footer">
        <button v-if="showCancel" class="modal-btn cancel-btn" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="modal-btn confirm-btn" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  title?: string;
  content?: string;
  showClose?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  closeOnClickOverlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true,
  showFooter: true,
  showCancel: true,
  confirmText: '确定',
  cancelText: '取消',
  closeOnClickOverlay: true,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [];
  cancel: [];
  close: [];
}>();

const entering = ref(false);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      entering.value = true;
      setTimeout(() => {
        entering.value = false;
      }, 300);
    }
  }
);

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const handleConfirm = () => {
  emit('confirm');
  handleClose();
};

const handleCancel = () => {
  emit('cancel');
  handleClose();
};

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  animation: fade-in $duration-base $ease-out;
}

.modal-container {
  width: 600rpx;
  max-height: 80vh;
  background: $bg-primary;
  border-radius: $radius-lg;
  overflow: hidden;
  animation: modal-slide-up $duration-base $ease-out;

  &.modal-enter {
    animation: modal-bounce $duration-slow $ease-bounce;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $padding-lg $padding-xl;
  border-bottom: 1rpx solid $divider-color;

  .modal-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  .modal-close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size:px;
    color: $text-tertiary;
    cursor: pointer;

    &:active {
      opacity: 0.6;
    }
  }
}

.modal-body {
  padding: $padding-xl;
  max-height: 60vh;
  overflow-y: auto;

  .modal-content {
    font-size: $font-size-base;
    color: $text-secondary;
    line-height: $line-height-relaxed;
  }
}

.modal-footer {
  display: flex;
  gap: $spacing-md;
  padding: $padding-lg $padding-xl;
  border-top: 1rpx solid $divider-color;

  .modal-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: $radius-base;
    font-size: $font-size-base;
    bor none;
    cursor: pointer;
    @include transition(all);

    &:active {
      transform: scale(0.95);
    }

    &.cancel-btn {
      background: $bg-secondary;
      color: $text-secondary;
    }

    &.confirm-btn {
      background: $primary-color;
      color: #fff;
    }
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(100rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-bounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
