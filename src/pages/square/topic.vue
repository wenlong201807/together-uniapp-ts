<template>
  <view class="topic-detail-container">
    <TopicDetailSkeleton v-if="loading" />

    <view v-else-if="topicDetail" class="topic-detail">
      <!-- 话题头部 -->
      <view class="topic-header">
        <swiper
          v-if="topicDetail.coverImages && topicDetail.coverImages.length > 0"
          class="cover-swiper"
          :indicator-dots="topicDetail.coverImages.length > 1"
          :autoplay="true"
          :interval="3000"
          :circular="true"
        >
          <swiper-item v-for="(img, index) in topicDetail.coverImages" :key="index">
            <image :src="img" mode="aspectFill" class="cover-image" />
          </swiper-item>
        </swiper>

        <view class="topic-info">
          <text class="topic-title">{{ topicDetail.title }}</text>
          <text class="topic-desc">{{ topicDetail.description }}</text>

          <view class="topic-stats">
            <view class="stat-item">
              <text class="stat-value">{{ formatCount(topicDetail.participantCount) }}</text>
              <text class="stat-label">参与</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ formatCount(topicDetail.postCount) }}</text>
              <text class="stat-label">动态</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ formatCount(topicDetail.viewCount) }}</text>
              <text class="stat-label">浏览</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button
          :class="['action-btn', 'join-btn', { joined: topicDetail.isJoined }]"
          @click="handleJoinToggle"
        >
          <text>{{ topicDetail.isJoined ? '✓ 已参与' : '+ 参与话题' }}</text>
        </button>
        <button class="action-btn publish-btn" @click="handlePublish">
          <text>✏️ 发布动态</text>
        </button>
      </view>

      <!-- Tab 切换 -->
      <view class="tabs">
        <view
          :class="['tab-item', { active: activeTab === 'latest' }]"
          @click="handleTabChange('latest')"
        >
          最新
        </view>
        <view
          :class="['tab-item', { active: activeTab === 'hot' }]"
          @click="handleTabChange('hot')"
        >
          最热
        </view>
      </view>

      <!-- 动态列表 -->
      <scroll-view
        class="posts-scroll"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="handleRefresh"
        @scrolltolower="handleLoadMore"
      >
        <view class="posts-list">
          <view v-if="posts.length > 0">
            <view
              v-for="post in posts"
              :key="post.id"
              class="post-card"
              @click="handlePostClick(post)"
            >
              <!-- 用户信息 -->
              <view class="post-header">
                <image :src="post.user.avatar" mode="aspectFill" class="user-avatar" />
                <view class="user-info">
                  <text class="user-nickname">{{ post.user.nickname }}</text>
                  <text class="post-time">{{ formatTime(post.createTime) }}</text>
                </view>
              </view>

              <!-- 动态内容 -->
              <text class="post-content">{{ post.content }}</text>

              <!-- 图片 -->
              <view v-if="post.images && post.images.length > 0" class="post-images">
                <image
                  v-for="(img, index) in post.images.slice(0, 9)"
                  :key="index"
                  :src="img"
                  mode="aspectFill"
                  class="post-image"
                  @click.stop="previewImage(post.images, index)"
                />
              </view>

              <!-- 互动栏 -->
              <view class="post-actions">
                <view class="action-item" @click.stop="handleLike(post)">
                  <text :class="['action-icon', { liked: post.isLiked }]">
                    {{ post.isLiked ? '❤️' : '🤍' }}
                  </text>
                  <text class="action-text">{{ formatCount(post.likeCount) }}</text>
                </view>
                <view class="action-item" @click.stop="handleComment(post)">
                  <text class="action-icon">💬</text>
                  <text class="action-text">{{ formatCount(post.commentCount) }}</text>
                </view>
                <view class="action-item" @click.stop="handleShare(post)">
                  <text class="action-icon">🔗</text>
                  <text class="action-text">{{ formatCount(post.shareCount) }}</text>
                </view>
              </view>
            </view>
          </view>

          <Empty v-else text="暂无动态" />

          <!-- 加载更多 -->
          <view v-if="loadingMore" class="loading-more">
            <text>加载中...</text>
          </view>
          <view v-else-if="!hasMore && posts.length > 0" class="no-more">
            <text>没有更多了</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <Empty v-else text="话题不存在" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { getTopicDetail, getTopicPosts, joinTopic, leaveTopic, likeTopicPost, unlikeTopicPost } from '@/api/modules/topic';
import type { TopicDetail, TopicPost } from '@/api/modules/topic';
import TopicDetailSkeleton from './components/TopicDetailSkeleton.vue';
import Empty from '@/components/common/Empty.vue';

const topicId = ref<number>(0);
const topicDetail = ref<TopicDetail | null>(null);
const posts = ref<TopicPost[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const activeTab = ref<'latest' | 'hot'>('latest');
const page = ref(1);
const pageSize = 20;

// 请求取消控制器
let loadPostsAbortController: AbortController | null = null;

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPageInstance = pages[pages.length - 1] as any;
  const options = currentPageInstance.options;

  const id = parseInt(options.id);
  if (isNaN(id) || id <= 0) {
    uni.showToast({
      title: '话题ID无效',
      icon: 'none'
    });
    return;
  }

  topicId.value = id;

  await loadTopicDetail();
  await loadPosts();
});

// Tab 切换处理
const handleTabChange = (tab: 'latest' | 'hot') => {
  if (activeTab.value === tab) return;

  activeTab.value = tab;
  page.value = 1;
  posts.value = [];
  hasMore.value = true;

  // 取消之前的请求
  if (loadPostsAbortController) {
    loadPostsAbortController.abort();
    loadPostsAbortController = null;
  }

  loadPosts();
};

// 加载话题详情
const loadTopicDetail = async () => {
  try {
    loading.value = true;
    const res = await getTopicDetail(topicId.value);
    topicDetail.value = res.data;
  } catch (error: any) {
    console.error('Load topic detail error:', error);

    // 根据错误类型提供具体提示
    let errorMessage = '加载失败';
    if (error.code === 'NETWORK_ERROR' || error.errMsg?.includes('network')) {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.code === 'TIMEOUT' || error.errMsg?.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.statusCode === 404) {
      errorMessage = '话题不存在';
    } else if (error.statusCode === 403) {
      errorMessage = '无权访问此话题';
    } else if (error.message) {
      errorMessage = error.message;
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载动态列表
const loadPosts = async () => {
  if (loadingMore.value || !hasMore.value) return;

  // 取消之前的请求
  if (loadPostsAbortController) {
    loadPostsAbortController.abort();
  }

  // 创建新的 AbortController
  loadPostsAbortController = new AbortController();
  const currentController = loadPostsAbortController;

  try {
    loadingMore.value = true;
    const res = await getTopicPosts({
      topicId: topicId.value,
      page: page.value,
      pageSize,
      sort: activeTab.value
    });

    // 检查请求是否被取消
    if (currentController.signal.aborted) {
      return;
    }

    if (page.value === 1) {
      posts.value = res.data.list;
    } else {
      posts.value.push(...res.data.list);
    }

    hasMore.value = res.data.hasMore;
    page.value++;
  } catch (error: any) {
    // 忽略取消请求的错误
    if (error.name === 'AbortError' || currentController.signal.aborted) {
      return;
    }

    console.error('Load posts error:', error);

    // 根据错误类型提供具体提示
    let errorMessage = '加载失败';
    if (error.code === 'NETWORK_ERROR' || error.errMsg?.includes('network')) {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.code === 'TIMEOUT' || error.errMsg?.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.statusCode === 404) {
      errorMessage = '话题不存在';
    } else if (error.statusCode === 403) {
      errorMessage = '无权访问此话题';
    } else if (error.message) {
      errorMessage = error.message;
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none'
    });
  } finally {
    if (!currentController.signal.aborted) {
      loadingMore.value = false;
    }

    // 清理 controller
    if (loadPostsAbortController === currentController) {
      loadPostsAbortController = null;
    }
  }
};

// 参与/退出话题
const handleJoinToggle = async () => {
  if (!topicDetail.value) return;

  const originalStatus = topicDetail.value.isJoined;
  const originalCount = topicDetail.value.participantCount;

  // 乐观更新
  topicDetail.value.isJoined = !originalStatus;
  topicDetail.value.participantCount = originalStatus ? originalCount - 1 : originalCount + 1;

  try {
    if (originalStatus) {
      await leaveTopic(topicId.value);
      uni.showToast({
        title: '已退出话题',
        icon: 'success'
      });
    } else {
      await joinTopic(topicId.value);
      uni.showToast({
        title: '参与成功',
        icon: 'success'
      });
    }
  } catch (error: any) {
    console.error('Join/Leave topic error:', error);
    // 回滚
    topicDetail.value.isJoined = originalStatus;
    topicDetail.value.participantCount = originalCount;

    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    });
  }
};

// 发布动态
const handlePublish = () => {
  if (!topicDetail.value?.isJoined) {
    uni.showToast({
      title: '请先参与话题',
      icon: 'none'
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/square/publish?topicId=${topicId.value}&topicTitle=${encodeURIComponent(topicDetail.value.title)}`
  });
};

// 点击动态
const handlePostClick = (post: TopicPost) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post.id}`
  });
};

// 点赞
const handleLike = async (post: TopicPost) => {
  const originalIsLiked = post.isLiked;
  const originalLikeCount = post.likeCount;

  // 乐观更新
  post.isLiked = !originalIsLiked;
  post.likeCount = originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1;

  try {
    if (originalIsLiked) {
      await unlikeTopicPost(post.id);
    } else {
      await likeTopicPost(post.id);
    }
  } catch (error) {
    // 回滚
    post.isLiked = originalIsLiked;
    post.likeCount = originalLikeCount;
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 评论
const handleComment = (post: TopicPost) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post.id}`
  });
};

// 分享
const handleShare = (post: TopicPost) => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      console.log('Share success');
    }
  });
};

// 预览图片
const previewImage = (images: string[], currentIndex: number) => {
  uni.previewImage({
    urls: images,
    current: images[currentIndex]
  });
};

// 格式化数字
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  }

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

// 下拉刷新
const handleRefresh = async () => {
  refreshing.value = true;

  // 取消正在进行的请求
  if (loadPostsAbortController) {
    loadPostsAbortController.abort();
    loadPostsAbortController = null;
  }

  // 重置分页
  page.value = 1;
  posts.value = [];
  hasMore.value = true;

  try {
    // 同时刷新话题详情和动态列表
    await Promise.all([
      loadTopicDetail(),
      loadPosts()
    ]);

    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000
    });
  } catch (error) {
    console.error('Refresh error:', error);
  } finally {
    refreshing.value = false;
  }
};

// 触底加载更多
const handleLoadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    loadPosts();
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.topic-detail-container {
  min-height: 100vh;
  background: $bg-secondary;
  display: flex;
  flex-direction: column;

  .topic-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    .topic-header {
      background: $bg-primary;
      margin-bottom: $margin-md;

      .cover-swiper {
        width: 100%;
        height: 400rpx;

        .cover-image {
          width: 100%;
          height: 100%;
        }
      }

      .topic-info {
        padding: $padding-xl;

        .topic-title {
          display: block;
          font-size: $font-size-xxl;
          font-weight: $font-weight-bold;
          color: $text-primary;
          margin-bottom: $margin-md;
        }

        .topic-desc {
          display: block;
          font-size: $font-size-base;
          color: $text-secondary;
          line-height: $line-height-relaxed;
          margin-bottom: $margin-lg;
        }

        .topic-stats {
          display: flex;
          gap: $spacing-xxl;

          .stat-item {
            @include flex-center;
            flex-direction: column;

            .stat-value {
              font-size: $font-size-xl;
              font-weight: $font-weight-bold;
              color: $text-primary;
              margin-bottom: $margin-xs;
            }

            .stat-label {
              font-size: $font-size-sm;
              color: $text-tertiary;
            }
          }
        }
      }
    }

    .action-buttons {
      padding: 0 $padding-xl $padding-md;
      display: flex;
      gap: $spacing-md;

      .action-btn {
        flex: 1;
        height: $button-height-lg;
        line-height: $button-height-lg;
        border-radius: $radius-full;
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        border: none;
        @include transition(all);
        @include active-scale;

        &::after {
          border: none;
        }

        &.join-btn {
          background: $primary-color;
          color: $bg-primary;

          &.joined {
            background: $bg-tertiary;
            color: $text-secondary;
          }
        }

        &.publish-btn {
          background: $gradient-primary;
          color: $bg-primary;
        }
      }
    }

    .tabs {
      display: flex;
      background: $bg-primary;
      margin-bottom: $margin-md;

      .tab-item {
        flex: 1;
        padding: $padding-md;
        text-align: center;
        font-size: $font-size-base;
        color: $text-tertiary;
        border-bottom: 4rpx solid transparent;
        @include transition(all);

        &.active {
          color: $primary-color;
          border-bottom-color: $primary-color;
          font-weight: $font-weight-medium;
        }
      }
    }

    .posts-scroll {
      flex: 1;
      height: 100%;
    }

    .posts-list {
      padding: 0 $padding-md $padding-md;

      .post-card {
        background: $bg-primary;
        border-radius: $radius-md;
        padding: $padding-lg;
        margin-bottom: $margin-md;
        @include transition(all);

        &:active {
          opacity: 0.8;
        }

        .post-header {
          display: flex;
          align-items: center;
          margin-bottom: $margin-md;

          .user-avatar {
            width: $avatar-size-sm;
            height: $avatar-size-sm;
            border-radius: $radius-circle;
            margin-right: $margin-md;
            flex-shrink: 0;
          }

          .user-info {
            flex: 1;

            .user-nickname {
              display: block;
              font-size: $font-size-base;
              font-weight: $font-weight-medium;
              color: $text-primary;
              margin-bottom: $margin-xs;
            }

            .post-time {
              display: block;
              font-size: $font-size-sm;
              color: $text-tertiary;
            }
          }
        }

        .post-content {
          display: block;
          font-size: $font-size-base;
          color: $text-primary;
          line-height: $line-height-relaxed;
          margin-bottom: $margin-md;
        }

        .post-images {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: $spacing-sm;
          margin-bottom: $margin-md;

          .post-image {
            width: 100%;
            aspect-ratio: 1;
            border-radius: $radius-sm;
          }
        }

        .post-actions {
          display: flex;
          gap: $spacing-xl;
          padding-top: $padding-md;
          border-top: 1rpx solid $divider-color;

          .action-item {
            @include flex-align-center;
            gap: $spacing-xs;
            @include transition(transform);

            &:active {
              transform: scale(0.95);
            }

            .action-icon {
              font-size: $font-size-lg;

              &.liked {
                animation: heartBeat 0.3s ease;
              }
            }

            .action-text {
              font-size: $font-size-sm;
              color: $text-tertiary;
            }
          }
        }
      }

      .loading-more,
      .no-more {
        padding: $padding-lg;
        text-align: center;
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }
  }
}

@keyframes heartBeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>
