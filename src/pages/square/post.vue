<template>
  <view class="post-detail-container">
    <view v-if="squareStore.currentPost" class="post-detail">
      <PostCard :post="squareStore.currentPost" @like="handleLike" />

      <view class="comments-section">
        <view class="section-header">
          <text class="section-title">评论 ({{ squareStore.comments.length }})</text>
        </view>

        <view class="comment-input">
          <input
            v-model="commentText"
            class="input"
            placeholder="写下你的评论..."
            @confirm="submitComment"
          />
          <button class="submit-btn" :disabled="!commentText.trim()" @click="submitComment">发送</button>
        </view>

        <view class="comments-list">
          <view
            v-for="comment in squareStore.comments"
            :key="comment.id"
            class="comment-item"
          >
            <image class="avatar" :src="comment.user?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
            <view class="comment-content">
              <view class="comment-header">
                <text class="nickname">{{ comment.user?.nickname }}</text>
                <text class="time">{{ formatTime(comment.createdAt) }}</text>
              </view>
              <text class="comment-text">{{ comment.content }}</text>
            </view>
          </view>

          <Empty v-if="squareStore.comments.length === 0" text="暂无评论" />
        </view>
      </view>
    </view>

    <Loading v-else text="加载中..." />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSquareStore } from '@/stores'
import { formatTime } from '@/utils'
import PostCard from '@/components/business/PostCard.vue'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const squareStore = useSquareStore()

const commentText = ref('')
const postId = ref<number>(0)

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  postId.value = parseInt(options.id)

  await loadPostDetail()
})

const loadPostDetail = async () => {
  try {
    await Promise.all([
      squareStore.fetchPost(postId.value),
      squareStore.fetchComments(postId.value)
    ])
  } catch (error) {
    console.error('Load post detail error:', error)
  }
}

const handleLike = async () => {
  if (!squareStore.currentPost) return

  try {
    await squareStore.toggleLike({
      targetId: squareStore.currentPost.id,
      targetType: 1
    })
  } catch (error) {
    console.error('Like error:', error)
  }
}

const submitComment = async () => {
  if (!commentText.value.trim()) return

  try {
    await squareStore.createComment({
      postId: postId.value,
      content: commentText.value
    })
    commentText.value = ''
    uni.showToast({
      title: '评论成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Submit comment error:', error)
  }
}
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
        .comment-item {
          display: flex;
          padding: 24rpx;
          background: #fff;
          border-radius: 12rpx;
          margin-bottom: 20rpx;

          .avatar {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            margin-right: 20rpx;
            background: #f0f0f0;
          }

          .comment-content {
            flex: 1;

            .comment-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12rpx;

              .nickname {
                font-size: 26rpx;
                font-weight: 500;
                color: #333;
              }

              .time {
                font-size: 22rpx;
                color: #999;
              }
            }

            .comment-text {
              font-size: 26rpx;
              color: #666;
              line-height: 1.5;
            }
          }
        }
      }
    }
  }
}
</style>