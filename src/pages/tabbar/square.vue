<template>
  <view class="square-container">
    <view class="square-header">
      <view class="tab-list">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-item', activeTab === tab.value ? 'active' : '']"
          @click="switchTab(tab.value)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>
      <view class="publish-btn" @click="goToPublish">
        <text>+</text>
      </view>
    </view>

    <scroll-view
      class="posts-list"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      refresher-background="#f8f8f8"
    >
      <!-- 骨架屏 -->
      <template v-if="squareStore.loading && squareStore.posts.length === 0">
        <Skeleton
          v-for="i in 3"
          :key="i"
          type="card"
          :show-image="true"
          style="margin-bottom: 20rpx"
        />
      </template>

      <!-- 帖子列表 -->
      <template v-else>
        <PostCard
          v-for="post in squareStore.posts"
          :key="post.id"
          :post="post"
          @click="goToPostDetail(post.id)"
          @like="handleLike(post)"
          @comment="handleComment(post)"
          @share="handleShare(post)"
          @delete="handleDelete(post)"
        />

        <!-- 加载更多 -->
        <view v-if="squareStore.loading && squareStore.posts.length > 0" class="loading-more">
          <Loading text="加载中..." />
        </view>

        <!-- 没有更多 -->
        <view v-if="!squareStore.hasMore && squareStore.posts.length > 0" class="no-more">
          <text>没有更多了</text>
        </view>

        <!-- 空状态 -->
        <Empty
          v-if="!squareStore.loading && squareStore?.posts?.length === 0"
          text="暂无动态"
        />
      </template>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSquareStore } from '@/stores';
import PostCard from '@/components/business/PostCard.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import { useAvatarSync } from '@/composables/useAvatarSync';
import { useLikeSync } from '@/composables/useLikeSync';

const squareStore = useSquareStore();

// 头像同步
const posts = computed(() => ({ list: squareStore.posts }));
useAvatarSync(posts, { nestedUserField: 'user' });

// 点赞同步
useLikeSync(posts, { targetType: 1 });

const tabs = [
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'hot' },
];

const activeTab = ref('latest');
const page = ref(1);
const refreshing = ref(false);

onMounted(() => {
  loadPosts();
});

const switchTab = (tab: string) => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  squareStore.posts = [];
  loadPosts();
};

const loadPosts = async () => {
  try {
    await squareStore.fetchPosts({
      page: page.value,
      pageSize: 20,
      sort: activeTab.value,
    });
  } catch (error) {
    console.error('Load posts error:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
};

const onRefresh = async () => {
  refreshing.value = true;
  page.value = 1;
  squareStore.posts = [];

  try {
    await loadPosts();
  } finally {
    // 延迟关闭刷新状态，让用户看到刷新效果
    setTimeout(() => {
      refreshing.value = false;
    }, 500);
  }
};

const loadMore = () => {
  if (!squareStore.hasMore || squareStore.loading) return;
  page.value++;
  loadPosts();
};

const goToPublish = () => {
  uni.navigateTo({
    url: '/pages/square/publish',
  });
};

const goToPostDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${id}`,
  });
};

const handleLike = async (post: any) => {
  const originalIsLiked = post.isLiked;
  const originalLikeCount = post.likeCount || 0;

  // 乐观更新 UI
  post.isLiked = !originalIsLiked;
  post.likeCount = originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1;

  try {
    await squareStore.toggleLike({
      targetId: post.id,
      targetType: 1,
    });
  } catch (error) {
    console.error('Like error:', error);
    // 失败时回滚
    post.isLiked = originalIsLiked;
    post.likeCount = originalLikeCount;
    uni.showToast({
      title: '操作失败',
      icon: 'none',
    });
  }
};

const handleComment = (post: any) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post.id}`,
  });
};

const handleShare = (post: any) => {
  uni.showActionSheet({
    itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 分享到微信
        shareToWeChat(post);
      } else if (res.tapIndex === 1) {
        // 分享到朋友圈
        shareToMoments(post);
      } else if (res.tapIndex === 2) {
        // 复制链接
        copyLink(post);
      }
    }
  });
};

const handleDelete = async (post: any) => {
  try {
    await squareStore.deletePost(post.id);
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    // 刷新列表
    page.value = 1;
    squareStore.posts = [];
    await loadPosts();
  } catch (error: any) {
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none'
    });
  }
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

.square-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;

  .square-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 40rpx;
    background: #fff;
    box-shadow: $shadow-sm;
    z-index: 10;

    .tab-list {
      display: flex;
      gap: 40rpx;

      .tab-item {
        font-size: $font-size-base;
        color: $text-secondary;
        position: relative;
        padding: 8rpx 0;
        @include transition(color);

        &.active {
          font-weight: $font-weight-medium;
          color: $primary-color;

          &::after {
            content: '';
            position: absolute;
            bottom: -8rpx;
            left: 50%;
            transform: translateX(-50%);
            width: 40rpx;
            height: 4rpx;
            background: $primary-color;
            border-radius: 2rpx;
            animation: tab-slide-in $duration-base $ease-out;
          }
        }
      }
    }

    .publish-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary-color;
      color: #fff;
      border-radius: $radius-circle;
      font-size: 36rpx;
      box-shadow: $shadow-base;
      @include transition(transform);

      &:active {
        transform: scale(0.9);
      }
    }
  }

  .posts-list {
    flex: 1;
    padding: 20rpx;
  }

  .loading-more {
    padding: 20rpx 0;
    text-align: center;
  }

  .no-more {
    padding: 40rpx 0;
    text-align: center;

    text {
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }
}

@keyframes tab-slide-in {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 40rpx;
    opacity: 1;
  }
}
</style>
