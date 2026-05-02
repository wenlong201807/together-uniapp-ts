<template>
  <view class="topic-list-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <uni-icons type="search" size="20" color="#999" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索话题"
          @confirm="handleSearch"
        />
        <uni-icons
          v-if="keyword"
          type="clear"
          size="18"
          color="#999"
          @click="handleClearSearch"
        />
      </view>
      <view class="create-btn" @click="handleCreateTopic">
        <uni-icons type="plus" size="20" color="#fff" />
      </view>
    </view>

    <!-- 热门话题 -->
    <view v-if="!keyword && hotTopics.length > 0" class="hot-topics-section">
      <view class="section-header">
        <text class="section-title">🔥 热门话题</text>
      </view>
      <scroll-view class="hot-topics-scroll" scroll-x>
        <view class="hot-topics-list">
          <view
            v-for="topic in hotTopics"
            :key="topic.id"
            class="hot-topic-card"
            @click="handleTopicClick(topic.id)"
          >
            <image :src="topic.coverImage" mode="aspectFill" class="hot-topic-cover" />
            <view class="hot-topic-info">
              <text class="hot-topic-name">{{ topic.name }}</text>
              <text class="hot-topic-count">{{ formatCount(topic.postCount) }}帖子</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 话题列表 -->
    <view class="topics-section">
      <view v-if="!keyword" class="section-header">
        <text class="section-title">全部话题</text>
      </view>

      <scroll-view
        class="topics-scroll"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="handleRefresh"
        @scrolltolower="handleLoadMore"
      >
        <view v-if="loading && topics.length === 0" class="loading-container">
          <uni-load-more status="loading" />
        </view>

        <view v-else-if="topics.length > 0" class="topics-list">
          <view
            v-for="topic in topics"
            :key="topic.id"
            class="topic-card"
            @click="handleTopicClick(topic.id)"
          >
            <image :src="topic.coverImage" mode="aspectFill" class="topic-cover" />
            <view class="topic-info">
              <view class="topic-header">
                <text class="topic-name">{{ topic.name }}</text>
                <view v-if="topic.isHot" class="hot-badge">热门</view>
              </view>
              <text v-if="topic.description" class="topic-desc">{{ topic.description }}</text>
              <view class="topic-stats">
                <text class="stat-item">{{ formatCount(topic.postCount) }} 帖子</text>
                <text class="stat-item">{{ formatCount(topic.followCount) }} 关注</text>
                <text class="stat-item">{{ formatCount(topic.viewCount) }} 浏览</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-container">
          <uni-icons type="info" size="60" color="#ccc" />
          <text class="empty-text">{{ keyword ? '未找到相关话题' : '暂无话题' }}</text>
        </view>

        <view v-if="topics.length > 0 && !hasMore" class="no-more">
          <text>没有更多了</text>
        </view>

        <view v-if="loadingMore" class="loading-more">
          <uni-load-more status="loading" />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getTopics, getHotTopics, searchTopics, type TopicDetail } from '@/api';
import { formatCount } from '@/utils/format';

const keyword = ref('');
const topics = ref<TopicDetail[]>([]);
const hotTopics = ref<TopicDetail[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);

onMounted(() => {
  loadHotTopics();
  loadTopics();
});

// 加载热门话题
const loadHotTopics = async () => {
  try {
    const res = await getHotTopics(10);
    if (res.code === 0) {
      hotTopics.value = res.data.list;
    }
  } catch (error: any) {
    console.error('加载热门话题失败:', error);
  }
};

// 加载话题列表
const loadTopics = async (isRefresh = false) => {
  if (loading.value || loadingMore.value) return;

  if (isRefresh) {
    page.value = 1;
    refreshing.value = true;
  } else if (page.value === 1) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const params = {
      page: page.value,
      pageSize,
      keyword: keyword.value || undefined,
    };

    const res = keyword.value
      ? await searchTopics(params)
      : await getTopics(params);

    if (res.code === 0) {
      if (isRefresh || page.value === 1) {
        topics.value = res.data.list;
      } else {
        topics.value = [...topics.value, ...res.data.list];
      }
      hasMore.value = res.data.hasMore;
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
    refreshing.value = false;
    loadingMore.value = false;
  }
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  topics.value = [];
  loadTopics();
};

// 清除搜索
const handleClearSearch = () => {
  keyword.value = '';
  handleSearch();
};

// 下拉刷新
const handleRefresh = () => {
  loadTopics(true);
};

// 加载更多
const handleLoadMore = () => {
  if (!hasMore.value || loading.value || loadingMore.value) return;
  page.value++;
  loadTopics();
};

// 点击话题
const handleTopicClick = (topicId: number) => {
  uni.navigateTo({
    url: `/pages/topic/detail?id=${topicId}`,
  });
};

// 创建话题
const handleCreateTopic = () => {
  uni.navigateTo({
    url: '/pages/topic/create',
  });
};
</script>

<style lang="scss" scoped>
.topic-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 40rpx;

    .search-input {
      flex: 1;
      margin: 0 16rpx;
      font-size: 28rpx;
    }
  }

  .create-btn {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.hot-topics-section {
  margin-bottom: 20rpx;
  background-color: #fff;

  .section-header {
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .hot-topics-scroll {
    white-space: nowrap;
    padding: 20rpx 0;
  }

  .hot-topics-list {
    display: inline-flex;
    padding: 0 20rpx;
    gap: 20rpx;
  }

  .hot-topic-card {
    display: inline-block;
    width: 240rpx;

    .hot-topic-cover {
      width: 240rpx;
      height: 240rpx;
      border-radius: 16rpx;
    }

    .hot-topic-info {
      margin-top: 16rpx;

      .hot-topic-name {
        display: block;
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hot-topic-count {
        display: block;
        margin-top: 8rpx;
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.topics-section {
  .section-header {
    padding: 30rpx;
    background-color: #fff;
    border-bottom: 1rpx solid #eee;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .topics-scroll {
    height: calc(100vh - 200rpx);
  }

  .topics-list {
    padding: 20rpx 0;
  }

  .topic-card {
    display: flex;
    padding: 30rpx;
    margin-bottom: 20rpx;
    background-color: #fff;

    .topic-cover {
      width: 160rpx;
      height: 160rpx;
      border-radius: 16rpx;
      flex-shrink: 0;
    }

    .topic-info {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .topic-header {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .topic-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #333;
        }

        .hot-badge {
          padding: 4rpx 12rpx;
          background: linear-gradient(135deg, #ff6b6b, #ff8e53);
          border-radius: 8rpx;
          font-size: 20rpx;
          color: #fff;
        }
      }

      .topic-desc {
        margin-top: 12rpx;
        font-size: 26rpx;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .topic-stats {
        display: flex;
        gap: 24rpx;
        margin-top: 16rpx;

        .stat-item {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}

.loading-container,
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
