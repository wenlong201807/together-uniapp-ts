<template>
  <view class="home-container">
    <view class="welcome-section">
      <text class="welcome-text"
        >欢迎，{{ authStore.userInfo?.nickname || '用户' }}</text
      >
    </view>

    <view class="quick-actions">
      <view
        v-for="(action, index) in actions"
        :key="index"
        class="action-item"
        :style="{ animationDelay: `${index * 0.1}s` }"
        @click="action.handler"
      >
        <view class="action-icon-wrapper">
          <text class="action-icon">{{ action.icon }}</text>
        </view>
        <text class="action-text">{{ action.text }}</text>
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
        @share="handleShare(post)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore, useSquareStore } from '@/stores';
import PostCard from '@/components/business/PostCard.vue';
import { useAvatarSync } from '@/composables/useAvatarSync';

const authStore = useAuthStore();
const squareStore = useSquareStore();

const recentPosts = ref<any[]>([]);

// 头像同步
useAvatarSync(recentPosts, { nestedUserField: 'user' });

const actions = [
  { icon: '📝', text: '发布动态', handler: goToSquare },
  { icon: '🧠', text: 'MBTI测试', handler: goToMbti },
  { icon: '💬', text: '聊天', handler: goToChatList },
  { icon: '👥', text: '好友', handler: goToFriendList },
];

function goToSquare() {
  uni.switchTab({
    url: '/pages/tabbar/square',
  });
}

function goToChatList() {
  uni.navigateTo({
    url: '/pages/chat/list',
  });
}

function goToFriendList() {
  uni.navigateTo({
    url: '/pages/friend/list',
  });
}

function goToMbti() {
  uni.navigateTo({
    url: '/pages/mbti/intro',
  });
}

function goToProfile() {
  uni.navigateTo({
    url: '/pages/user/profile',
  });
}

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

const goToPostDetail = (id: number) => {
  if (!id) {
    return uni.showToast({
      title: '先选择评论',
      icon: 'none',
    });
  }
  uni.navigateTo({
    url: `/pages/square/post?id=${id}`,
  });
};

const handleLike = async (post: any) => {
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
  if (!post?.id) {
    return uni.showToast({
      title: '先选择评论',
      icon: 'none',
    });
  }
  uni.navigateTo({
    url: `/pages/square/post?id=${post?.id}`,
  });
};

const handleShare = (post: any) => {
  uni.showActionSheet({
    itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
    success: (res) => {
      if (res.tapIndex === 0) {
        shareToWeChat(post);
      } else if (res.tapIndex === 1) {
        shareToMoments(post);
      } else if (res.tapIndex === 2) {
        copyLink(post);
      }
    }
  });
};

const shareToWeChat = (post: any) => {
  // #ifdef MP-WEIXIN
  uni.shareAppMessage({
    title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
    path: `/pages/square/post?id=${post.id}`,
    imageUrl: post.images?.[0] || '',
  });
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅支持微信小程序',
    icon: 'none'
  });
  // #endif
};

const shareToMoments = (post: any) => {
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

const copyLink = (post: any) => {
  const link = `${window.location.origin}/pages/square/post?id=${post.id}`;
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
@use '@/assets/styles/design-tokens.scss' as *;

.home-container {
  
  padding: $padding-xl;
  background: $bg-secondary;

  .welcome-section {
    margin-bottom: $margin-xl;

    .welcome-text {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-md;
    margin-bottom: $margin-xl;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $padding-lg $padding-md;
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      animation: action-fade-in $duration-base $ease-out both;
      @include transition(all);

      &:active {
        transform: scale(0.95);
        box-shadow: $shadow-xs;
      }

      .action-icon-wrapper {
        width: 80rpx;
        height: 80rpx;
        @include flex-center;
        background: linear-gradient(135deg, $primary-color, $primary-hover);
        border-radius: $radius-circle;
        margin-bottom: $margin-sm;
        box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
        @include transition(transform);

        .action-icon {
          font-size: 40rpx;
        }
      }

      &:active .action-icon-wrapper {
        transform: scale(0.9);
      }

      .action-text {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
  }

  .recent-posts {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $margin-md;

      .section-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }

      .section-more {
        font-size: $font-size-sm;
        color: $primary-color;
        @include transition(opacity);

        &:active {
          opacity: 0.6;
        }
      }
    }
  }
}

@keyframes action-fade-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>
