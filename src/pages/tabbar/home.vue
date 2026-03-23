<template>
  <view class="home-container">
    <view class="welcome-section">
      <text class="welcome-text"
        >欢迎，{{ authStore.userInfo?.nickname || '用户' }}</text
      >
    </view>

    <view class="quick-actions">
      <view class="action-item" @click="goToSquare">
        <text class="action-icon">📝</text>
        <text class="action-text">发布动态</text>
      </view>
      <view class="action-item" @click="goToChatList">
        <text class="action-icon">💬</text>
        <text class="action-text">聊天</text>
      </view>
      <view class="action-item" @click="goToFriendList">
        <text class="action-icon">👥</text>
        <text class="action-text">好友</text>
      </view>
      <view class="action-item" @click="goToProfile">
        <text class="action-icon">👤</text>
        <text class="action-text">个人资料</text>
      </view>
    </view>

    <view class="recent-posts">
      <view class="section-header">
        <text class="section-title">最新动态</text>
        <text class="section-more" @click="goToSquare">查看更多</text>
      </view>
      <PostCard
        v-for="post in recentPosts.list"
        :key="post.id"
        :post="post"
        @click="goToPostDetail(post.id)"
        @like="handleLike(post)"
        @comment="handleComment(post)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore, useSquareStore } from '@/stores';
import PostCard from '@/components/business/PostCard.vue';

const authStore = useAuthStore();
const squareStore = useSquareStore();

const recentPosts = ref<any[]>([]);

onMounted(async () => {
  await loadRecentPosts();
});

const loadRecentPosts = async () => {
  try {
    await squareStore.fetchPosts({ page: 1, pageSize: 10 });
    recentPosts.value = squareStore.posts;
    console.log('消息列表', recentPosts.value);
  } catch (error) {
    console.error('Load posts error:', error);
  }
};

const goToSquare = () => {
  uni.switchTab({
    url: '/pages/tabbar/square',
  });
};

const goToChatList = () => {
  uni.navigateTo({
    url: '/pages/chat/list',
  });
};

const goToFriendList = () => {
  uni.navigateTo({
    url: '/pages/friend/list',
  });
};

const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/user/profile',
  });
};

const goToPostDetail = (id: number) => {
  console.log(99, id);
  debugger;
  uni.navigateTo({
    url: `/pages/square/post?id=${id}`,
  });
};

const handleLike = async (post: any) => {
  console.log('like:', post);
  debugger;
  try {
    await squareStore.toggleLike({
      targetId: post?.id,
      targetType: 1,
    });
  } catch (error) {
    console.error('Like error:', error);
  }
};

const handleComment = (post: any) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post?.id}`,
  });
};
</script>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  padding: 40rpx;

  .welcome-section {
    margin-bottom: 40rpx;

    .welcome-text {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    margin-bottom: 40rpx;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30rpx 20rpx;
      background: #fff;
      border-radius: 16rpx;

      .action-icon {
        font-size: 48rpx;
        margin-bottom: 12rpx;
      }

      .action-text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }

  .recent-posts {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .section-more {
        font-size: 24rpx;
        color: #007aff;
      }
    }
  }
}
</style>
