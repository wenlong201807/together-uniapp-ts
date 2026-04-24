<template>
  <view class="quick-actions">
    <scroll-view class="actions-scroll" scroll-x :show-scrollbar="false">
      <view class="actions-container">
        <view
          v-for="(action, index) in actions"
          :key="index"
          class="action-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="handleActionClick(action)"
        >
          <view class="action-icon-wrapper" :style="{ background: action.gradient }">
            <text class="action-icon">{{ action.icon }}</text>
          </view>
          <text class="action-text">{{ action.text }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
export interface QuickAction {
  id: string;
  icon: string;
  text: string;
  gradient: string;
  path?: string;
  handler?: () => void;
}

interface Props {
  actions: QuickAction[];
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
});

const emit = defineEmits<{
  actionClick: [action: QuickAction];
}>();

const handleActionClick = (action: QuickAction) => {
  if (action.handler) {
    action.handler();
  } else if (action.path) {
    uni.navigateTo({ url: action.path });
  }
  emit('actionClick', action);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.quick-actions {
  margin-bottom: $margin-lg;

  .actions-scroll {
    width: 100%;
    white-space: nowrap;

    .actions-container {
      display: inline-flex;
      gap: $spacing-md;
      padding: 0 $padding-xs;

      .action-item {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        min-width: 140rpx;
        padding: $padding-md;
        background: $bg-primary;
        border-radius: $radius-lg;
        box-shadow: $shadow-sm;
        animation: action-fade-in $duration-base $ease-out both;
        @include transition(all);

        &:active {
          transform: scale(0.95);
          box-shadow: $shadow-xs;
        }

        .action-icon-wrapper {
          width: 96rpx;
          height: 96rpx;
          @include flex-center;
          border-radius: $radius-lg;
          margin-bottom: $margin-sm;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
          @include transition(transform);

          .action-icon {
            font-size: 48rpx;
          }
        }

        &:active .action-icon-wrapper {
          transform: scale(0.9);
        }

        .action-text {
          font-size: $font-size-sm;
          color: $text-secondary;
          font-weight: $font-weight-medium;
          white-space: nowrap;
        }
      }
    }
  }
}

@keyframes action-fade-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
