<template>
  <view class="topic-detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>

    <!-- 话题详情 -->
    <view v-else-if="topic" class="topic-detail">
      <!-- 话题头部 -->
      <view class="topic-header">
        <image v-img-proxy="topic.coverImage" mode="aspectFill" class="cover-image" />
        <view class="header-overlay">
          <view class="topic-info">
            <view class="topic-title-row">
              <text class="topic-name">{{ topic.name }}</text>
              <view v-if="topic.isHot" class="hot-badge">🔥 热门</view>
            </view>
            <text v-if="topic.description" class="topic-desc">{{ topic.description }}</text>
            <view class="topic-stats">
              <view class="stat-item">
                <text class="stat-value">{{ formatCount(topic.postCount) }}</text>
                <text class="stat-label">帖子</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ formatCount(topic.followCount) }}</text>
                <text class="stat-label">关注</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ formatCount(topic.viewCount) }}</text>
                <text class="stat-label">浏览</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <button
          :class="['follow-btn', { followed: topic.isFollowing }]"
          @click="handleFollowToggle"
        >
          {{ topic.isFollowing ? '✓ 已关注' : '+ 关注' }}
        </button>
        <button class="publish-btn" @click="handlePublish">
          <uni-icons type="compose" size="18" color="#fff" />
          <text>发布</text>
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

      <!-- 帖子列表 -->
      <scroll-view
        class="posts-scroll"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="handleRefresh"
        @scrolltolower="handleLoadMore"
      >
        <view v-if="posts.length > 0" class="posts-list">
          <view
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="handlePostClick(post.id)"
          >
            <!-- 用户信息 -->
            <view class="post-header">
              <image v-img-proxy="post.user.avatar" mode="aspectFill" class="user-avatar" />
              <view class="user-info">
                <text class="user-nickname">{{ post.user.nickname }}</text>
                <text class="post-time">{{ formatTime(post.createTime) }}</text>
              </view>
            </view>

            <!-- 帖子内容 -->
            <text class="post-content">{{ post.content }}</text>

            <!-- 图片 -->
            <view v-if="post.images && post.images.length > 0" class="post-images">
              <image
                v-for="(img, index) in post.images.slice(0, 9)"
                :key="index"
                v-img-proxy="img"
                mode="aspectFill"
                class="post-image"
                @click.stop="handlePreviewImage(post.images, index)"
              />
            </view>

            <!-- 互动数据 -->
            <view class="post-actions">
              <view class="action-item" @click.stop="handleLike(post)">
                <uni-icons
                  :type="post.isLiked ? 'heart-filled' : 'heart'"
                  :color="post.isLiked ? '#ff6b6b' : '#999'"
                  size="20"
                />
                <text :class="['action-text', { liked: post.isLiked }]">
                  {{ post.likeCount > 0 ? formatCount(post.likeCount) : '点赞' }}
                </text>
              </view>
              <view class="action-item">
                <uni-icons type="chat" color="#999" size="20" />
                <text class="action-text">
                  {{ post.commentCount > 0 ? formatCount(post.commentCount) : '评论' }}
                </text>
              </view>
              <view class="action-item">
                <uni-icons type="redo" color="#999" size="20" />
                <text class="action-text">
                  {{ post.shareCount > 0 ? formatCount(post.shareCount) : '分享' }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-container">
          <uni-icons type="info" size="60" color="#ccc" />
          <text class="empty-text">暂无帖子</text>
        </view>

        <view v-if="posts.length > 0 && !hasMore" class="no-more">
          <text>没有更多了</text>
        </view>

        <view v-if="loadingMore" class="loading-more">
          <uni-load-more status="loading" />
        </view>
      </scroll-view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <uni-icons type="info" size="60" color="#ccc" />
      <text class="error-text">话题不存在</text>
      <button class="back-btn" @click="handleBack">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  getTopicDetail,
  getTopicPosts,
  followTopic,
  unfollowTopic,
  type TopicDetail,
  type TopicPost,
} from '@/api';
import { squareApi } from '@/api/modules/square';

const topicId = ref(0);
const topic = ref<TopicDetail | null>(null);
const posts = ref<TopicPost[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const loadingMore = ref(false);
const activeTab = ref<'latest' | 'hot'>('latest');
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);

onLoad((options: any) => {
  if (options.id) {
    topicId.value = Number(options.id);
  }
});

onMounted(() => {
  if (topicId.value) {
    loadTopicDetail();
    loadPosts();
  }
});

// 加载话题详情
const loadTopicDetail = async () => {
  loading.value = true;
  try {
    const res = await getTopicDetail(topicId.value);
    if (res.code === 0) {
      topic.value = res.data;
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 加载帖子列表
const loadPosts = async (isRefresh = false) => {
  if (loadingMore.value) return;

  if (isRefresh) {
    page.value = 1;
    refreshing.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const res = await getTopicPosts({
      topicId: topicId.value,
      page: page.value,
      pageSize,
      sort: activeTab.value,
    });

    if (res.code === 0) {
      if (isRefresh || page.value === 1) {
        posts.value = res.data.list;
      } else {
        posts.value = [...posts.value, ...res.data.list];
      }
      hasMore.value = res.data.hasMore;
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    refreshing.value = false;
    loadingMore.value = false;
  }
};

// 切换关注
const handleFollowToggle = async () => {
  if (!topic.value) return;

  const originalFollowing = topic.value.isFollowing;
  const originalCount = topic.value.followCount;

  try {
    if (topic.value.isFollowing) {
      await unfollowTopic(topicId.value);
      topic.value.isFollowing = false;
      topic.value.followCount--;
      uni.showToast({
        title: '已取消关注',
        icon: 'success',
      });
    } else {
      await followTopic(topicId.value);
      topic.value.isFollowing = true;
      topic.value.followCount++;
      uni.showToast({
        title: '关注成功',
        icon: 'success',
      });
    }
  } catch (error: any) {
    // 回滚状态
    topic.value.isFollowing = originalFollowing;
    topic.value.followCount = originalCount;
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none',
    });
  }
};

// 发布帖子
const handlePublish = () => {
  uni.navigateTo({
    url: `/pages/square/publish?topicId=${topicId.value}`,
  });
};

// 切换Tab
const handleTabChange = (tab: 'latest' | 'hot') => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  posts.value = [];
  loadPosts();
};

// 下拉刷新
const handleRefresh = () => {
  loadPosts(true);
};

// 加载更多
const handleLoadMore = () => {
  if (!hasMore.value || loadingMore.value) return;
  page.value++;
  loadPosts();
};

// 点击帖子
const handlePostClick = (postId: number) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${postId}`,
  });
};

// 点赞
const handleLike = async (post: TopicPost) => {
  const originalLiked = post.isLiked;
  const originalCount = post.likeCount;

  // 乐观更新UI
  post.isLiked = !post.isLiked;
  post.likeCount += post.isLiked ? 1 : -1;

  try {
    if (post.isLiked) {
      await squareApi.likePost(post.id);
    } else {
      await squareApi.unlikePost(post.id);
    }
  } catch (error: any) {
    // 失败时回滚
    post.isLiked = originalLiked;
    post.likeCount = originalCount;
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none',
    });
  }
};

// 预览图片
const handlePreviewImage = (images: string[], current: number) => {
  uni.previewImage({
    urls: images,
    current,
  });
};

// 返回
const handleBack = () => {
  uni.navigateBack();
};

// 格式化数量
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
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
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前';
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()}`;
  }
};
</script>

<style lang="scss" scoped>
.topic-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  .error-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #999;
  }

  .back-btn {
    margin-top: 40rpx;
    padding: 16rpx 48rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
  }
}

.topic-header {
  position: relative;
  height: 400rpx;

  .cover-image {
    width: 100%;
    height: 100%;
  }

  .header-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40rpx 30rpx 30rpx;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);

    .topic-info {
      .topic-title-row {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 16rpx;

        .topic-name {
          font-size: 40rpx;
          font-weight: 600;
          color: #fff;
        }

        .hot-badge {
          padding: 6rpx 16rpx;
          background: linear-gradient(135deg, #ff6b6b, #ff8e53);
          border-radius: 24rpx;
          font-size: 22rpx;
          color: #fff;
        }
      }

      .topic-desc {
        display: block;
        margin-bottom: 24rpx;
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.5;
      }

      .topic-stats {
        display: flex;
        gap: 48rpx;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 32rpx;
            font-weight: 600;
            color: #fff;
          }

          .stat-label {
            margin-top: 8rpx;
            font-size: 24rpx;
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }
  }
}

.action-bar {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .follow-btn,
  .publish-btn {
    flex: 1;
    height: 72rpx;
    border-radius: 36rpx;
    font-size: 28rpx;
    border: none;

    &.follow-btn {
      background-color: #007aff;
      color: #fff;

      &.followed {
        background-color: #f5f5f5;
        color: #666;
      }
    }

    &.publish-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
    }
  }
}

.tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .tab-item {
    flex: 1;
    padding: 28rpx 0;
    text-align: center;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #007aff;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: #007aff;
        border-radius: 2rpx;
      }
    }
  }
}

.posts-scroll {
  height: calc(100vh - 600rpx);
}

.posts-list {
  padding: 20rpx 0;
}

.post-card {
  padding: 30rpx;
  margin-bottom: 20rpx;
  background-color: #fff;

  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;

    .user-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
    }

    .user-info {
      flex: 1;
      margin-left: 20rpx;

      .user-nickname {
        display: block;
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
      }

      .post-time {
        display: block;
        margin-top: 8rpx;
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .post-content {
    display: block;
    margin-bottom: 20rpx;
    font-size: 28rpx;
    line-height: 1.6;
    color: #333;
  }

  .post-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
    margin-bottom: 24rpx;

    .post-image {
      width: 100%;
      height: 200rpx;
      border-radius: 8rpx;
    }
  }

  .post-actions {
    display: flex;
    gap: 48rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #f5f5f5;

    .action-item {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .action-text {
        font-size: 24rpx;
        color: #999;

        &.liked {
          color: #ff6b6b;
        }
      }
    }
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.no-more,
.loading-more {
  padding: 40rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}
</style>
