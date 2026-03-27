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
      {{ loading ? '发送中...' : '发送' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
const loading = ref(false);

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

  loading.value = true;
  try {
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
  } catch (error) {
    console.error('Submit comment error:', error);
    uni.showToast({
      title: '评论失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
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
    line-height: 72rpx;
    background: #007aff;
    color: #fff;
    font-size: 28rpx;
    border-radius: 36rpx;
    border: none;

    &:disabled {
      opacity: 0.6;
    }
  }
}
</style>
