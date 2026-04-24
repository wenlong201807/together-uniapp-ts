<template>
  <view class="comment-input-container">
    <input
      v-model="content"
      class="input"
      :placeholder="placeholder"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <button
      class="submit-btn"
      :disabled="!content.trim() || loading"
      @click="submit"
    >
      {{ buttonText }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDebounceButton } from '@/composables/useDebounce';
import type { Comment } from '@/types';

interface Props {
  postId: number;
  replyToComment?: Comment;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
}>();

const content = ref('');
const { loading, buttonText, execute } = useDebounceButton('发送', '发送中...');

const placeholder = computed(() => {
  if (props.replyToComment) {
    return `回复 @${props.replyToComment.user?.nickname}...`;
  }
  return '写下你的评论...';
});

const handleFocus = () => {
  // uni.hideKeyboard();
};

const handleBlur = () => {
  // uni.hideKeyboard();
};

const submit = async () => {
  if (!content.value.trim()) return;

  await execute(async () => {
    const { squareApi } = await import('@/api');
    await squareApi.createComment({
      postId: props.postId,
      parentId: props.replyToComment?.parentId || props.replyToComment?.id,
      replyToId: props.replyToComment?.id,
      replyToUserId: props.replyToComment?.userId,
      content: content.value,
    });

    content.value = '';
    emit('success');
    uni.showToast({
      title: '评论成功',
      icon: 'success',
    });
  });
};
</script>

<style scoped lang="scss">
.comment-input-container {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;

  .input {
    flex: 1;
    height: 72rpx;
    padding: 0 24rpx;
    background: #f8f8f8;
    border-radius: 36rpx;
    font-size: 28rpx;
    margin-right: 20rpx;
  }

  .submit-btn {
    padding: 0 32rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 500;
    border-radius: 36rpx;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active:not(:disabled) {
      transform: scale(0.95);
      box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.2);
    }

    &:disabled {
      opacity: 0.5;
      background: #e0e0e0;
      color: #999;
      box-shadow: none;
    }
  }
}
</style>
