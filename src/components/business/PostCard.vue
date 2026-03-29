<template>
  <view class="post-card" @click="handleClick">
    <view class="post-header">
      <image
        class="avatar"
        :src="post.user?.avatarUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="nickname">{{ post.user?.nickname }}</text>
        <text class="time">{{ formatTime(post.createdAt) }}</text>
      </view>
    </view>

    <view class="post-content">
      <text class="content">{{ post.content }}</text>
    </view>

    <view v-if="post.images?.length" class="post-images">
      <image
        v-for="(img, index) in post.images"
        :key="index"
        class="post-image"
        :src="img"
        mode="aspectFill"
        @click.stop="previewImage(index)"
      />
    </view>

    <view class="post-footer">
      <view class="action-item" @click.stop="handleLike">
        <text :class="['icon', post.isLiked ? 'liked' : '']">{{
          post.isLiked ? '❤️' : '🤍'
        }}</text>
        <text>{{ post.likeCount || 0 }}</text>
      </view>
      <view class="action-item" @click.stop="handleComment">
        <text class="icon">💬</text>
        <text>{{ post.commentCount || 0 }}</text>
      </view>
      <view class="action-item" @click.stop="handleShare">
        <text class="icon">📤</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatTime } from '@/utils';

const props = defineProps<{
  post: any;
}>();

const emit = defineEmits<{
  click: [];
  like: [];
  comment: [];
  share: [];
}>();

const handleClick = () => {
  emit('click');
};

const handleLike = () => {
  emit('like');
};

const handleComment = () => {
  emit('comment');
};

const handleShare = () => {
  emit('share');
};

const previewImage = (index: number) => {
  uni.previewImage({
    urls: props.post.images || [],
    current: index,
  });
};
</script>

<style scoped lang="scss">
.post-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      background: #f0f0f0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .nickname {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
      }

      .time {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }
  }

  .post-content {
    margin-bottom: 20rpx;

    .content {
      font-size: 28rpx;
      color: #333;
      line-height: 1.6;
    }
  }

  .post-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10rpx;
    margin-bottom: 20rpx;

    .post-image {
      width: 100%;
      height: 200rpx;
      border-radius: 8rpx;
      background: #f0f0f0;
    }
  }

  .post-footer {
    display: flex;
    align-items: center;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-item {
      display: flex;
      align-items: center;
      margin-right: 40rpx;

      .icon {
        font-size: 36rpx;
        margin-right: 8rpx;

        &.liked {
          color: #ff4d4f;
        }
      }

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}
</style>
