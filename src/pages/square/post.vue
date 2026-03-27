<template>
  <view class="post-detail-container">
    <view v-if="squareStore.currentPost" class="post-detail">
      <PostCard :post="squareStore.currentPost" @like="handleLike" />

      <view class="comments-section">
        <view class="section-header">
          <text class="section-title"
            >评论 ({{ squareStore?.currentPost?.commentCount || 0 }})</text
          >
        </view>

        <BilibiliComment
          :post-id="squareStore.currentPost?.id"
          @success="handleCommentSuccess"
        />
      </view>
    </view>

    <Loading v-else text="加载中..." />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSquareStore } from '@/stores';
import { formatTime } from '@/utils';
import type { Comment } from '@/types';
import PostCard from '@/components/business/PostCard.vue';
import BilibiliComment from '@/components/business/BilibiliComment.vue';
import Loading from '@/components/common/Loading.vue';

const squareStore = useSquareStore();

const replyToComment = ref<Comment | undefined>();
const postId = ref<number>(0);

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options;

  postId.value = parseInt(options.id);

  await loadPostDetail();
});

const loadPostDetail = async () => {
  try {
    await Promise.all([
      squareStore.fetchPost(postId.value),
      squareStore.fetchComments(postId.value),
    ]);
  } catch (error) {
    console.error('Load post detail error:', error);
  }
};

const handleLike = async () => {
  if (!squareStore.currentPost) return;

  try {
    await squareStore.toggleLike({
      targetId: squareStore.currentPost.id,
      targetType: 1,
    });
  } catch (error) {
    console.error('Like error:', error);
  }
};

const handleReplyComment = (comment: Comment) => {
  replyToComment.value = comment;
};

const handleCommentSuccess = async () => {
  replyToComment.value = undefined;
  // 只重新加载评论列表，不重新加载帖子详情，避免影响回复的展开/收起状态
  await squareStore.fetchComments(postId.value, {
    page: 1,
    pageSize: 20,
    sort: 'time',
  });
};
</script>

<style scoped lang="scss">
.post-detail-container {
  min-height: 100vh;
  background: #f8f8f8;

  .post-detail {
    padding: 20rpx;

    .comments-section {
      margin-top: 20rpx;

      .section-header {
        padding: 20rpx 0;

        .section-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .comment-input {
        display: flex;
        align-items: center;
        padding: 20rpx;
        background: #fff;
        border-radius: 12rpx;
        margin-bottom: 20rpx;

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
          width: 120rpx;
          height: 72rpx;
          line-height: 72rpx;
          background: #007aff;
          color: #fff;
          font-size: 28rpx;
          border-radius: 36rpx;
          border: none;
          padding: 0;

          &:disabled {
            opacity: 0.6;
          }
        }
      }

      .comments-list {
        padding: 0;
      }
    }
  }
}
</style>
