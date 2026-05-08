<template>
  <view class="bilibili-comment">
    <!-- 评论输入框 -->
    <view class="comment-input-area">
      <view class="input-wrapper">
        <textarea
          v-model="content"
          class="comment-textarea"
          :placeholder="placeholder"
          :maxlength="180"
          :focus="isFocused"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <view class="input-actions">
          <text class="char-count">{{ content.length }}/180</text>
          <button
            class="send-btn"
            :class="{ disabled: !canSend }"
            :disabled="!canSend || sending"
            @click="submitComment"
          >
            {{ sendButtonText }}
          </button>
        </view>
      </view>
    </view>

    <!-- 评论列表 -->
    <view class="comments-list">
      <view v-for="comment in comments" :key="comment.id" class="comment-item">
        <!-- 评论主体 -->
        <view class="comment-main">
          <Avatar
            :avatar-id="comment.user?.avatarId"
            :avatar-url="comment.user?.avatarUrl"
            size="medium"
            class="avatar"
          />

          <view class="comment-content">
            <view class="comment-header">
              <text class="nickname">{{ comment.user.nickname }}</text>
              <view class="info-tags">
                <text v-if="comment.isTop" class="tag top-tag">UP主</text>
                <text v-if="comment.isHot" class="tag hot-tag">热评</text>
              </view>
              <text class="time">{{ formatTime(comment.createdAt) }}</text>
            </view>

            <view class="comment-text">
              <text v-if="comment.replyToUser" class="reply-to"
                >@{{ comment.replyToUser.nickname }}:</text
              >
              <text>{{ comment.content }}</text>
            </view>

            <view class="comment-actions">
              <view class="action-item" @click="toggleLike(comment)">
                <text class="action-icon">{{
                  comment.isLiked ? '❤️' : '🤍'
                }}</text>
                <text class="action-text">{{ comment.likeCount || 0 }}</text>
              </view>
              <view class="action-item" @click="startReply(comment)">
                <text class="action-icon">💬</text>
                <text class="action-text">回复</text>
              </view>
              <view
                v-if="isMyComment(comment)"
                class="action-item delete-action"
                @click="deleteComment(comment)"
              >
                <text class="action-icon">🗑️</text>
                <text class="action-text">删除</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 回复列表（根据展开状态显示） -->
        <view
          v-if="comment.replies && comment.replies.length > 0 && isCommentExpanded(comment.id)"
          class="replies-list"
        >
          <view
            v-for="reply in comment.replies"
            :key="reply.id"
            class="reply-item"
          >
            <Avatar
              :avatar-id="reply.user?.avatarId"
              :avatar-url="reply.user?.avatarUrl"
              size="small"
              class="avatar"
            />

            <view class="reply-content">
              <view class="reply-header">
                <text class="nickname">{{ reply.user.nickname }}</text>
                <text class="time">{{ formatTime(reply.createdAt) }}</text>
              </view>

              <view class="reply-text">
                <text v-if="reply.replyToUser" class="reply-to"
                  >@{{ reply.replyToUser.nickname }}:</text
                >
                <text>{{ reply.content }}</text>
              </view>

              <view class="reply-actions">
                <view class="action-item" @click="toggleLike(reply)">
                  <text class="action-icon">{{
                    reply.isLiked ? '❤️' : '🤍'
                  }}</text>
                  <text class="action-text">{{ reply.likeCount || 0 }}</text>
                </view>
                <view class="action-item" @click="startReply(reply, comment)">
                  <text class="action-icon">💬</text>
                  <text class="action-text">回复</text>
                </view>
                <view
                  v-if="isMyComment(reply)"
                  class="action-item delete-action"
                  @click="deleteComment(reply)"
                >
                  <text class="action-icon">🗑️</text>
                  <text class="action-text">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 查看全部回复 / 收起 -->
        <view
          v-if="comment.replyCount > 0"
          class="view-all-replies"
          @click="viewAllReplies(comment)"
        >
          <text v-if="isCommentExpanded(comment.id)">
            收起回复 ▲
          </text>
          <text v-else>
            共 {{ comment.replyCount }} 条回复 ▼
          </text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore" class="load-more" @click="loadMore">
      <text>查看更多评论</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore, useSquareStore } from '@/stores';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { useDebounceButton } from '@/composables/useDebounce';
import type { Comment } from '@/types';
import Avatar from '@/components/common/Avatar.vue';

interface Props {
  postId: number;
  postAuthorId?: number; // 帖子作者ID
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  delete: [];
}>();

const authStore = useAuthStore();
const squareStore = useSquareStore();
const { checkBeforeAction } = useNetworkStatus();
const { loading: sending, buttonText: sendButtonText, execute: executeSubmit } = useDebounceButton('发送', '发送中...');

// 响应式数据
const content = ref('');
const comments = ref<Comment[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const isFocused = ref(false);
const replyingComment = ref<Comment | null>(null);
const replyingRoot = ref<Comment | null>(null);
const expandedComments = ref<Set<number>>(new Set());

// 计算属性
const placeholder = computed(() => {
  if (replyingComment.value) {
    return `回复 @${replyingComment.value.user?.nickname}`;
  }
  return '友善评论，礼貌交流';
});

const canSend = computed(() => {
  return content.value.trim().length > 0 && content.value.length <= 500;
});

// 判断是否可以删除评论（自己的评论 或 自己是帖子作者）
const isMyComment = (comment: Comment) => {
  const currentUserId = authStore.userInfo?.id;
  // 是自己的评论，或者是自己帖子下的评论
  return currentUserId === comment.userId || currentUserId === props.postAuthorId;
};

// 获取评论列表
const loadComments = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    hasMore.value = true;
  }

  try {
    const res = await squareStore.fetchComments(props.postId, {
      page: currentPage.value,
      pageSize: 20,
      sort: 'time',
    });

    if (reset) {
      comments.value = squareStore.comments;

      // 不自动展开，让用户手动点击展开
      expandedComments.value.clear();
    } else {
      comments.value = [...comments.value, ...squareStore.comments];
    }

    hasMore.value = squareStore.comments.length === 20;
  } catch (error) {
    console.error('Load comments error:', error);
  }
};

// 提交评论
const submitComment = async () => {
  if (!canSend.value) return;
  if (!checkBeforeAction('发送评论')) return;

  await executeSubmit(async () => {
    // 构建评论数据
    const commentData: any = {
      postId: props.postId,
      content: content.value,
    };

    // 如果是回复评论
    if (replyingComment.value) {
      commentData.replyToId = replyingComment.value.id;
      commentData.replyToUserId = replyingComment.value.userId;

      // 如果有根评论（回复的是子回复），使用根评论的 parentId
      // 否则使用当前回复对象的 id 作为 parentId
      if (replyingRoot.value) {
        commentData.parentId = replyingRoot.value.id;
      } else {
        commentData.parentId = replyingComment.value.id;
      }
    }

    await squareStore.createComment(commentData);

    // 清空输入
    content.value = '';
    replyingComment.value = null;
    replyingRoot.value = null;

    // 刷新评论列表
    await loadComments(true);

    uni.showToast({
      title: '评论成功',
      icon: 'success',
    });

    emit('success');
  });
};

// 开始回复
const startReply = (comment: Comment, root?: Comment) => {
  replyingComment.value = comment;
  replyingRoot.value = root || null;

  // 滚动到输入框并聚焦
  setTimeout(() => {
    isFocused.value = true;
    // 滚动到页面顶部（输入框位置）
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 300,
    });
  }, 100);
};

// 查看全部回复 - 展开/收起
const viewAllReplies = async (comment: Comment) => {
  const isExpanded = expandedComments.value.has(comment.id);

  if (isExpanded) {
    // 收起
    expandedComments.value.delete(comment.id);
  } else {
    // 展开
    expandedComments.value.add(comment.id);

    // 如果还没有加载回复或回复数量不完整，则加载
    if (!comment.replies || comment.replies.length === 0 || comment.replies.length < comment.replyCount) {
      try {
        uni.showLoading({
          title: '加载中...',
          mask: true,
        });

        const replies = await squareStore.getReplies(comment.id, {
          page: 1,
          pageSize: comment.replyCount || 20,
          postId: props.postId,
        });

        comment.replies = replies;

        uni.hideLoading();
      } catch (e) {
        console.error('Load replies error:', e);
        uni.hideLoading();
        uni.showToast({
          title: '加载失败',
          icon: 'none',
        });
      }
    }
  }
};

// 判断评论是否已展开
const isCommentExpanded = (commentId: number) => {
  return expandedComments.value.has(commentId);
};

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;

  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 点赞/取消点赞
const toggleLike = async (comment: Comment) => {
  if (!checkBeforeAction('点赞')) return;

  const originalIsLiked = comment.isLiked;
  const originalLikeCount = comment.likeCount || 0;

  // 乐观更新 UI
  comment.isLiked = !originalIsLiked;
  comment.likeCount = originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1;

  try {
    await squareStore.toggleLike({
      targetId: comment.id,
      targetType: 2, // 2 表示评论
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    // 失败时回滚
    comment.isLiked = originalIsLiked;
    comment.likeCount = originalLikeCount;
    uni.showToast({
      title: '操作失败',
      icon: 'none',
    });
  }
};

// 删除评论
const deleteComment = async (comment: Comment) => {
  if (!checkBeforeAction('删除评论')) return;

  uni.showModal({
    title: '删除评论',
    content: '确定要删除这条评论吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({
            title: '删除中...',
            mask: true,
          });

          await squareStore.deleteComment(comment.id, props.postId);

          uni.hideLoading();
          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });

          // 刷新评论列表
          await loadComments(true);
          emit('delete');
        } catch (error: any) {
          uni.hideLoading();
          uni.showToast({
            title: error.message || '删除失败',
            icon: 'none',
          });
        }
      }
    },
  });
};

// 输入框事件
const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};

// 加载更多
const loadMore = async () => {
  currentPage.value++;
  await loadComments();
};

// 初始化
onMounted(async () => {
  await loadComments(true);
});
</script>

<style scoped lang="scss">
.bilibili-comment {
  padding: 20rpx;

  .comment-input-area {
    background: #fff;
    padding: 20rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;

    .input-wrapper {
      position: relative;

      .comment-textarea {
        width: 100%;
        height: 120rpx;
        background: #f8f9fa;
        border-radius: 8rpx;
        padding: 20rpx;
        font-size: 28rpx;
        line-height: 1.5;
      }

      .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10rpx;

        .char-count {
          font-size: 24rpx;
          color: #999;
        }

        .send-btn {
          padding: 12rpx 32rpx;
          height: 64rpx;
          line-height: 64rpx;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 28rpx;
          font-weight: 500;
          border-radius: 32rpx;
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

          &.disabled {
            opacity: 0.5;
            background: #e0e0e0;
            color: #999;
            box-shadow: none;
          }
        }
      }
    }
  }

  .comments-list {
    .comment-item {
      padding: 30rpx 0;
      border-bottom: 1rpx solid #eee;

      .comment-main {
        display: flex;
        gap: 20rpx;

        .avatar {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
        }

        .comment-content {
          flex: 1;

          .comment-header {
            display: flex;
            align-items: center;
            gap: 10rpx;
            margin-bottom: 10rpx;

            .nickname {
              font-size: 28rpx;
              font-weight: 500;
              color: #222;
            }

            .info-tags {
              display: flex;
              gap: 10rpx;

              .tag {
                font-size: 20rpx;
                padding: 4rpx 8rpx;
                border-radius: 4rpx;

                &.top-tag {
                  background: #ff6699;
                  color: #fff;
                }

                &.hot-tag {
                  background: #ff7f3e;
                  color: #fff;
                }
              }
            }

            .time {
              font-size: 24rpx;
              color: #999;
              margin-left: auto;
            }
          }

          .comment-text {
            font-size: 28rpx;
            color: #222;
            line-height: 1.6;
            margin-bottom: 15rpx;

            .reply-to {
              color: #00a1d6;
            }
          }

          .comment-actions {
            display: flex;
            gap: 40rpx;

            .action-item {
              display: flex;
              align-items: center;
              gap: 8rpx;
              font-size: 24rpx;
              color: #999;
              cursor: pointer;
              transition: all 0.2s;

              &:active {
                transform: scale(0.95);
              }

              .action-icon {
                font-size: 28rpx;
              }

              .action-text {
                user-select: none;
              }

              &.delete-action {
                color: #ff4d4f;

                .action-text {
                  color: #ff4d4f;
                }
              }
            }
          }
        }
      }

      .replies-list {
        margin: 20rpx 0 10rpx 84rpx;

        .reply-item {
          display: flex;
          gap: 16rpx;
          margin-bottom: 20rpx;

          &:last-child {
            margin-bottom: 0;
          }

          .avatar {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
          }

          .reply-content {
            flex: 1;
            background: #f8f9fa;
            border-radius: 8rpx;
            padding: 16rpx;

            .reply-header {
              display: flex;
              align-items: center;
              gap: 10rpx;
              margin-bottom: 8rpx;

              .nickname {
                font-size: 26rpx;
                font-weight: 500;
                color: #222;
              }

              .time {
                font-size: 22rpx;
                color: #999;
                margin-left: auto;
              }
            }

            .reply-text {
              font-size: 26rpx;
              color: #222;
              line-height: 1.5;
              margin-bottom: 8rpx;

              .reply-to {
                color: #00a1d6;
              }
            }

            .reply-actions {
              display: flex;
              gap: 30rpx;

              .action-item {
                display: flex;
                align-items: center;
                gap: 6rpx;
                font-size: 22rpx;
                color: #999;
                cursor: pointer;
                transition: all 0.2s;

                &:active {
                  transform: scale(0.95);
                }

                .action-icon {
                  font-size: 24rpx;
                }

                .action-text {
                  user-select: none;
                }

                &.delete-action {
                  color: #ff4d4f;

                  .action-text {
                    color: #ff4d4f;
                  }
                }
              }
            }
          }
        }
      }

      .view-all-replies {
        margin-left: 84rpx;
        padding: 16rpx 0;
        font-size: 26rpx;
        color: #00a1d6;
        cursor: pointer;
        user-select: none;
        transition: opacity 0.2s;

        &:active {
          opacity: 0.7;
        }
      }
    }
  }

  .load-more {
    text-align: center;
    padding: 30rpx;
    font-size: 28rpx;
    color: #00a1d6;
  }
}
</style>
