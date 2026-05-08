<template>
  <view class="comment-item">
    <view class="comment-main">
      <image
        class="avatar"
        :src="comment.user?.avatarUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="comment-content">
        <view class="comment-header">
          <text class="nickname">{{ comment.user?.nickname }}</text>
          <text class="time">{{ formatTime(comment.createdAt) }}</text>
        </view>
        <view class="comment-text">
          <text v-if="comment.replyToUser" class="reply-to"
            >回复 @{{ comment.replyToUser.nickname }}：</text
          >
          <text>{{ comment.content }}</text>
        </view>
        <view class="comment-actions">
          <text
            v-if="comment.replyCount > 0"
            class="action-btn"
            @click="toggleReplies"
          >
            {{ comment.replyCount }}条回复 {{ expanded ? '收起' : '展开' }}
          </text>
          <text class="action-btn" @click="handleReply">回复</text>
        </view>
      </view>
    </view>

    <view v-if="expanded" class="replies">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :post-id="postId"
        @reply="handleReply"
      />
      <view v-if="hasMore" class="load-more" @click="loadMoreReplies">
        加载更多回复
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatTime } from '@/utils';
import type { Comment } from '@/types';

interface Props {
  comment: Comment;
  postId?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  reply: [comment: Comment];
}>();

const expanded = ref(false);
const loading = ref(false);
const currentPage = ref(1);

const hasMore = computed(() => {
  if (!props.comment.replies) return false;
  return props.comment.replyCount > props.comment.replies.length;
});

const toggleReplies = () => {
  expanded.value = !expanded.value;
  if (expanded.value && props.comment.replies?.length === 0) {
    loadReplies();
  }
};

const loadReplies = async () => {
  loading.value = true;
  try {
    const { squareApi } = await import('@/api');
    const res = await squareApi.getReplies(props.comment.id, {
      page: currentPage.value,
      pageSize: 5,
      postId: props.postId,
    });

    if (currentPage.value === 1) {
      // 第一页直接替换
      props.comment.replies = res.data.list;
    } else {
      // 后续页追加
      props.comment.replies = [
        ...(props.comment.replies || []),
        ...res.data.list,
      ];
    }
  } catch (error) {
    console.error('Load replies error:', error);
  } finally {
    loading.value = false;
  }
};

const loadMoreReplies = () => {
  currentPage.value++;
  loadReplies();
};

const handleReply = () => {
  emit('reply', props.comment);
};
</script>

<style scoped lang="scss">
.comment-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  .comment-main {
    display: flex;
    gap: 20rpx;

    .avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .comment-content {
      flex: 1;
      min-width: 0;

      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;

        .nickname {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
        }

        .time {
          font-size: 24rpx;
          color: #999;
        }
      }

      .comment-text {
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
        margin-bottom: 12rpx;

        .reply-to {
          color: #007aff;
        }
      }

      .comment-actions {
        display: flex;
        gap: 24rpx;

        .action-btn {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }

  .replies {
    margin-left: 84rpx;
    padding-top: 20rpx;

    .load-more {
      text-align: center;
      padding: 20rpx;
      font-size: 28rpx;
      color: #007aff;
    }
  }
}
</style>
