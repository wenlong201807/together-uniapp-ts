<template>
  <view class="search-topic-container">
    <!-- 搜索框 -->
    <view class="search-header">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索话题"
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleInput"
        />
        <text v-if="keyword" class="clear-icon" @click="handleClear">✕</text>
      </view>
      <text class="cancel-btn" @click="handleCancel">取消</text>
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && searchHistory.length > 0" class="search-history">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <text class="clear-history" @click="handleClearHistory">清空</text>
      </view>
      <view class="history-list">
        <view
          v-for="(item, index) in searchHistory"
          :key="index"
          class="history-item"
          @click="handleHistoryClick(item)"
        >
          <text class="history-icon">🕐</text>
          <text class="history-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 热门话题 -->
    <view v-if="!keyword && hotTopics.length > 0" class="hot-topics">
      <view class="section-header">
        <text class="section-title">热门话题</text>
        <text class="section-badge">🔥</text>
      </view>
      <view class="hot-list">
        <view
          v-for="(topic, index) in hotTopics"
          :key="topic.id"
          class="hot-item"
          @click="handleTopicClick(topic)"
        >
          <view class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</view>
          <view class="hot-content">
            <text class="hot-name"># {{ topic.name }}</text>
            <text class="hot-stats">{{ formatCount(topic.postCount) }}条动态</text>
          </view>
          <text class="hot-score">热度 {{ topic.hotScore.toFixed(1) }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="keyword" class="search-results">
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <view v-for="i in 5" :key="i" class="skeleton-item">
          <view class="skeleton-line skeleton-title" />
          <view class="skeleton-line skeleton-desc" />
        </view>
      </view>

      <!-- 结果列表 -->
      <view v-else-if="searchResults.length > 0" class="results-list">
        <view
          v-for="topic in searchResults"
          :key="topic.id"
          class="result-item"
          @click="handleTopicClick(topic)"
        >
          <view class="result-content">
            <text class="result-name"># {{ topic.name }}</text>
            <text class="result-desc">{{ topic.description || '暂无描述' }}</text>
            <view class="result-stats">
              <text class="stat-text">{{ formatCount(topic.followCount) }}关注</text>
              <text class="stat-divider">·</text>
              <text class="stat-text">{{ formatCount(topic.postCount) }}动态</text>
            </view>
          </view>
          <view class="result-arrow">›</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到相关话题</text>
        <text class="empty-hint">换个关键词试试</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { searchTopics, getHotTopics } from '@/api/modules/topic';
import type { TopicDetail } from '@/api/modules/topic';

const keyword = ref('');
const searchHistory = ref<string[]>([]);
const hotTopics = ref<TopicDetail[]>([]);
const searchResults = ref<TopicDetail[]>([]);
const loading = ref(false);

// 防抖定时器
let searchTimer: number | null = null;

onMounted(async () => {
  // 加载搜索历史
  const history = uni.getStorageSync('topic_search_history') || [];
  searchHistory.value = history;

  // 加载热门话题
  try {
    const res = await getHotTopics(10);
    if (res.code === 0 && res.data) {
      hotTopics.value = res.data.list || [];
    }
  } catch (error) {
    console.error('Load hot topics error:', error);
  }
});

// 输入处理（防抖搜索）
const handleInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  if (!keyword.value.trim()) {
    searchResults.value = [];
    return;
  }

  searchTimer = setTimeout(() => {
    handleSearch();
  }, 500) as unknown as number;
};

// 搜索
const handleSearch = async () => {
  const kw = keyword.value.trim();
  if (!kw) {
    searchResults.value = [];
    return;
  }

  loading.value = true;

  try {
    const res = await searchTopics({
      keyword: kw,
      page: 1,
      pageSize: 20,
    });

    if (res.code === 0 && res.data) {
      searchResults.value = res.data.list || [];

      // 保存搜索历史
      saveSearchHistory(kw);
    }
  } catch (error) {
    console.error('Search topics error:', error);
    uni.showToast({
      title: '搜索失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 清空搜索框
const handleClear = () => {
  keyword.value = '';
  searchResults.value = [];
};

// 取消搜索
const handleCancel = () => {
  uni.navigateBack();
};

// 点击历史记录
const handleHistoryClick = (item: string) => {
  keyword.value = item;
  handleSearch();
};

// 清空搜索历史
const handleClearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = [];
        uni.removeStorageSync('topic_search_history');
      }
    },
  });
};

// 保存搜索历史
const saveSearchHistory = (kw: string) => {
  // 去重并添加到开头
  const history = searchHistory.value.filter((item) => item !== kw);
  history.unshift(kw);

  // 最多保存10条
  if (history.length > 10) {
    history.pop();
  }

  searchHistory.value = history;
  uni.setStorageSync('topic_search_history', history);
};

// 点击话题
const handleTopicClick = (topic: TopicDetail) => {
  uni.navigateTo({
    url: `/pages/square/topic?id=${topic.id}`,
  });
};

// 格式化数字
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.search-topic-container {
  min-height: 100vh;
  background: $bg-secondary;

  .search-header {
    display: flex;
    align-items: center;
    padding: $padding-md $padding-lg;
    background: $bg-primary;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      padding: $padding-sm $padding-md;
      background: $bg-secondary;
      border-radius: $radius-full;

      .search-icon {
        font-size: $font-size-base;
        margin-right: $margin-xs;
      }

      .search-input {
        flex: 1;
        font-size: $font-size-base;
        color: $text-primary;
      }

      .clear-icon {
        font-size: $font-size-base;
        color: $text-tertiary;
        padding: $padding-xs;
      }
    }

    .cancel-btn {
      margin-left: $margin-md;
      font-size: $font-size-base;
      color: $primary-color;
    }
  }

  .search-history {
    padding: $padding-lg;

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $margin-md;

      .history-title {
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        color: $text-primary;
      }

      .clear-history {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }

    .history-list {
      display: flex;
      flex-wrap: wrap;
      gap: $margin-sm;

      .history-item {
        display: flex;
        align-items: center;
        padding: $padding-xs $padding-md;
        background: $bg-primary;
        border-radius: $radius-full;

        .history-icon {
          font-size: $font-size-sm;
          margin-right: $margin-xs;
        }

        .history-text {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }

  .hot-topics {
    padding: $padding-lg;

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: $margin-md;

      .section-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-right: $margin-xs;
      }

      .section-badge {
        font-size: $font-size-base;
      }
    }

    .hot-list {
      .hot-item {
        display: flex;
        align-items: center;
        padding: $padding-md;
        background: $bg-primary;
        border-radius: $radius-lg;
        margin-bottom: $margin-sm;
        @include transition(all);

        &:active {
          transform: scale(0.98);
          opacity: 0.8;
        }

        .hot-rank {
          width: 48rpx;
          height: 48rpx;
          @include flex-center;
          background: $bg-secondary;
          border-radius: $radius-sm;
          font-size: $font-size-base;
          font-weight: $font-weight-bold;
          color: $text-tertiary;
          margin-right: $margin-md;

          &.top {
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
            color: #ffffff;
          }
        }

        .hot-content {
          flex: 1;
          display: flex;
          flex-direction: column;

          .hot-name {
            font-size: $font-size-base;
            font-weight: $font-weight-medium;
            color: $text-primary;
            margin-bottom: $margin-xs;
          }

          .hot-stats {
            font-size: $font-size-sm;
            color: $text-tertiary;
          }
        }

        .hot-score {
          font-size: $font-size-sm;
          color: $primary-color;
          font-weight: $font-weight-medium;
        }
      }
    }
  }

  .search-results {
    padding: $padding-lg;

    .loading-state {
      .skeleton-item {
        padding: $padding-md;
        background: $bg-primary;
        border-radius: $radius-lg;
        margin-bottom: $margin-sm;

        .skeleton-line {
          height: 32rpx;
          background: $bg-secondary;
          border-radius: $radius-sm;
          animation: skeleton-loading 1.5s ease-in-out infinite;

          &.skeleton-title {
            width: 60%;
            margin-bottom: $margin-sm;
          }

          &.skeleton-desc {
            width: 100%;
          }
        }
      }
    }

    .results-list {
      .result-item {
        display: flex;
        align-items: center;
        padding: $padding-md;
        background: $bg-primary;
        border-radius: $radius-lg;
        margin-bottom: $margin-sm;
        @include transition(all);

        &:active {
          transform: scale(0.98);
          opacity: 0.8;
        }

        .result-content {
          flex: 1;
          display: flex;
          flex-direction: column;

          .result-name {
            font-size: $font-size-lg;
            font-weight: $font-weight-medium;
            color: $primary-color;
            margin-bottom: $margin-xs;
          }

          .result-desc {
            font-size: $font-size-sm;
            color: $text-secondary;
            margin-bottom: $margin-xs;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .result-stats {
            display: flex;
            align-items: center;

            .stat-text {
              font-size: $font-size-xs;
              color: $text-tertiary;
            }

            .stat-divider {
              margin: 0 $margin-xs;
              color: $text-tertiary;
            }
          }
        }

        .result-arrow {
          font-size: $font-size-xl;
          color: $text-tertiary;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 120rpx $padding-lg;

      .empty-icon {
        font-size: 120rpx;
        margin-bottom: $margin-lg;
      }

      .empty-text {
        font-size: $font-size-lg;
        color: $text-secondary;
        margin-bottom: $margin-sm;
      }

      .empty-hint {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }
  }
}

@keyframes skeleton-loading {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
