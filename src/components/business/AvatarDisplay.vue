<template>
  <view class="avatar-display" @click="handleClick">
    <!-- 预设头像 -->
    <view
      v-if="avatarStore.selectedAvatar.type === 'preset'"
      :class="`sprite-avatar avatar-${avatarStore.selectedAvatar.value}`"
    />

    <!-- 自定义头像 -->
    <image
      v-else
      :src="avatarStore.selectedAvatar.displayUrl"
      mode="aspectFill"
      class="custom-avatar"
    />

    <!-- 编辑按钮覆盖层 -->
    <view class="edit-overlay">
      <text class="edit-icon">✏️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAvatarStore } from '@/stores/avatar';

// 使用头像状态管理
const avatarStore = useAvatarStore();

// 定义事件
const emit = defineEmits<{
  select: [];
}>();

/**
 * 处理头像点击事件
 * 触发 select 事件，通知父组件打开选择器
 */
const handleClick = () => {
  emit('select');
};
</script>

<style scoped lang="scss">
@import '@/assets/styles/avatar.scss';

.avatar-display {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .sprite-avatar,
  .custom-avatar {
    width: 100%;
    height: 100%;
  }

  .edit-overlay {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 40rpx;
    height: 40rpx;
    background: #007aff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
    transition: all 0.3s;

    &:active {
      transform: scale(0.95);
    }

    .edit-icon {
      font-size: 20rpx;
      color: #fff;
    }
  }
}
</style>
