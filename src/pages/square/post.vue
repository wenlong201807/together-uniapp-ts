<template>
  <view class="post-detail-container">
    <view v-if="squareStore.currentPost" class="post-detail">
      <PostCard
        :post="squareStore.currentPost"
        @like="handleLike"
        @report="handleReport"
        @share="handleShare"
        @delete="handleDeletePost"
      />

      <view class="comments-section">
        <view class="section-header">
          <text class="section-title"
            >评论 ({{ squareStore?.currentPost?.commentCount || 0 }})</text
          >
        </view>

        <BilibiliComment
          :post-id="squareStore.currentPost?.id"
          :post-author-id="squareStore.currentPost?.userId"
          @success="handleCommentSuccess"
          @delete="handleCommentDelete"
        />
      </view>
    </view>

    <Loading v-else text="加载中..." />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSquareStore } from '@/stores';
import { formatTime } from '@/utils';
import type { Comment } from '@/types';
import PostCard from '@/components/business/PostCard.vue';
import BilibiliComment from '@/components/business/BilibiliComment.vue';
import Loading from '@/components/common/Loading.vue';
import { useLikeSync } from '@/composables/useLikeSync';

const squareStore = useSquareStore();

// 评论点赞同步
const comments = computed(() => ({ list: squareStore.comments }));
useLikeSync(comments, { targetType: 2 });

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

  const originalIsLiked = squareStore.currentPost.isLiked;
  const originalLikeCount = squareStore.currentPost.likeCount;

  // 乐观更新 UI
  squareStore.currentPost.isLiked = !originalIsLiked;
  squareStore.currentPost.likeCount = originalIsLiked
    ? originalLikeCount - 1
    : originalLikeCount + 1;

  try {
    await squareStore.toggleLike({
      targetId: squareStore.currentPost.id,
      targetType: 1,
    });
  } catch (error) {
    console.error('Like error:', error);
    // 失败时回滚
    squareStore.currentPost.isLiked = originalIsLiked;
    squareStore.currentPost.likeCount = originalLikeCount;
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

const handleReplyComment = (comment: Comment) => {
  replyToComment.value = comment;
};

const handleCommentSuccess = async () => {
  replyToComment.value = undefined;

  // 乐观更新评论计数
  const originalCount = squareStore.currentPost?.commentCount || 0;
  if (squareStore.currentPost) {
    squareStore.currentPost.commentCount = originalCount + 1;
  }

  try {
    // 重新加载评论列表
    await squareStore.fetchComments(postId.value, {
      page: 1,
      pageSize: 20,
      sort: 'time',
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    // 失败时回滚计数
    if (squareStore.currentPost) {
      squareStore.currentPost.commentCount = originalCount;
    }
    uni.showToast({
      title: '刷新评论失败',
      icon: 'none',
    });
  }
};

const handleCommentDelete = () => {
  // 更新评论计数（减1）
  if (squareStore.currentPost) {
    squareStore.currentPost.commentCount = Math.max(0, (squareStore.currentPost.commentCount || 0) - 1);
  }
};

const handleReport = async (data: { reason: number; description: string }) => {
  if (!squareStore.currentPost) return;

  try {
    await squareStore.report({
      postId: squareStore.currentPost.id,
      reason: data.reason,
      description: data.description,
    });
    uni.showToast({
      title: '举报成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('Report error:', error);
    uni.showToast({
      title: '举报失败',
      icon: 'none'
    });
  }
};

const handleDeletePost = async () => {
  if (!squareStore.currentPost) return;

  try {
    await squareStore.deletePost(squareStore.currentPost.id);
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none'
    });
  }
};

const handleShare = () => {
  if (!squareStore.currentPost) return;

  uni.showActionSheet({
    itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
    success: (res) => {
      if (res.tapIndex === 0) {
        shareToWeChat();
      } else if (res.tapIndex === 1) {
        shareToMoments();
      } else if (res.tapIndex === 2) {
        copyLink();
      }
    }
  });
};

const shareToWeChat = () => {
  if (!squareStore.currentPost) return;

  // #ifdef MP-WEIXIN
  uni.shareAppMessage({
    title: squareStore.currentPost.content.substring(0, 30) + (squareStore.currentPost.content.length > 30 ? '...' : ''),
    path: `/pages/square/post?id=${squareStore.currentPost.id}`,
    imageUrl: squareStore.currentPost.images?.[0] || '',
  });
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅支持微信小程序',
    icon: 'none'
  });
  // #endif
};

const shareToMoments = () => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  });
  uni.showToast({
    title: '请点击右上角分享',
    icon: 'none'
  });
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅支持微信小程序',
    icon: 'none'
  });
  // #endif
};

const copyLink = () => {
  if (!squareStore.currentPost) return;

  const link = `${window.location.origin}/pages/square/post?id=${squareStore.currentPost.id}`;
  uni.setClipboardData({
    data: link,
    success: () => {
      uni.showToast({
        title: '链接已复制',
        icon: 'success'
      });
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      });
    }
  });
};
</script>

<style scoped lang="scss">
.post-detail-container {
  
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
