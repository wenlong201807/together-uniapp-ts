<template>
  <view class="bilibili-comment">
    <!-- 评论输入框 -->
    <view class="comment-input-area">
      <view class="input-wrapper">
        <textarea
          v-model="content"
          class="comment-textarea"
          :placeholder="placeholder"
          :maxlength="500"
          :focus="isFocused"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <view class="input-actions">
          <text class="char-count">{{ content.length }}/500</text>
          <button
            class="send-btn"
            :class="{ disabled: !canSend }"
            :disabled="!canSend || sending"
            @click="submitComment"
          >
            {{ sending ? '发送中...' : '发送' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 评论列表 -->
    <view class="comments-list">
      <view v-for="comment in comments" :key="comment.id" class="comment-item">
        <!-- 评论主体 -->
        <view class="comment-main">
          <image
            :src="comment.user.avatarUrl || '/static/images/default-avatar.png'"
            class="avatar"
            mode="aspectFill"
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
            </view>
          </view>
        </view>

        <!-- 回复列表（最多显示5条） -->
        <view
          v-if="comment.replies && comment.replies.length > 0"
          class="replies-list"
        >
          <view
            v-for="reply in comment.replies"
            :key="reply.id"
            class="reply-item"
          >
            <image
              :src="reply.user.avatarUrl || '/static/images/default-avatar.png'"
              class="avatar"
              mode="aspectFill"
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
              </view>
            </view>
          </view>
        </view>

        <!-- 查看全部回复 -->
        <view
          v-if="comment.replyCount > (comment.replies?.length || 0)"
          class="view-all-replies"
          @click="viewAllReplies(comment)"
        >
          <text>共{{ comment.replyCount }}条回复 ></text>
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
import type { Comment } from '@/types';

interface Props {
  postId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
}>();

// 响应式数据
const content = ref('');
const comments = ref<Comment[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const isFocused = ref(false);
const sending = ref(false);
const replyingComment = ref<Comment | null>(null);
const replyingRoot = ref<Comment | null>(null);

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

// 获取评论列表
const loadComments = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    hasMore.value = true;
  }

  try {
    const { squareApi } = await import('@/api');
    const res = await squareApi.getComments(props.postId, {
      page: currentPage.value,
      pageSize: 20,
      sort: 'time',
    });

    if (reset) {
      comments.value = res.data.list;
    } else {
      comments.value = [...comments.value, ...res.data.list];
    }

    hasMore.value = res.data.list.length === 20;
  } catch (error) {
    console.error('Load comments error:', error);
  }
};

// 提交评论
const submitComment = async () => {
  if (!canSend.value || sending.value) return;

  sending.value = true;

  try {
    const { squareApi } = await import('@/api');
    await squareApi.createComment({
      postId: props.postId,
      content: content.value,
      replyToId: replyingComment.value?.id,
      replyToUserId: replyingComment.value?.userId,
      parentId: replyingRoot.value?.id || replyingComment.value?.id,
    });

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
  } catch (error) {
    console.error('Submit comment error:', error);
    uni.showToast({
      title: '评论失败',
      icon: 'none',
    });
  } finally {
    sending.value = false;
  }
};

// 开始回复
const startReply = (comment: Comment, root?: Comment) => {
  replyingComment.value = comment;
  replyingRoot.value = root || comment;
  isFocused.value = true;
};

// 查看全部回复
const viewAllReplies = async (comment: Comment) => {
  // 跳转到专门的回复页面
  uni.navigateTo({
    url: `/pages/square/comment-replies?commentId=${comment.id}&postId=${props.postId}`,
  });
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
  // 实现点赞逻辑
  // 这里可以调用点赞API并更新本地状态
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
  await loadComments();
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
          padding: 10rpx 30rpx;
          background: #00a1d6;
          color: #fff;
          font-size: 26rpx;
          border-radius: 6rpx;
          border: none;

          &.disabled {
            background: #ccc;
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

              .action-icon {
                font-size: 28rpx;
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

                .action-icon {
                  font-size: 24rpx;
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
