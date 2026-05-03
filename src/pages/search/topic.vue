<template>
  <view class="search-topic-container">
    <!-- 固定搜索框 -->
    <view class="search-header">
      <view class="back-btn" @click="handleBack">
        <svg width="26" height="26" viewBox="0 0 32 32">
          <path d="M21.781 7.844l-9.063 8.594 9.063 8.594q0.25 0.25 0.25 0.609t-0.25 0.578q-0.25 0.25-0.578 0.25t-0.578-0.25l-9.625-9.125q-0.156-0.125-0.203-0.297t-0.047-0.359q0-0.156 0.047-0.328t0.203-0.297l9.625-9.125q0.25-0.25 0.578-0.25t0.578 0.25q0.25 0.219 0.25 0.578t-0.25 0.578z" fill="#000000"></path>
        </svg>
      </view>
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
    </view>

    <!-- 可滚动内容区域 -->
    <scroll-view
      class="scroll-content"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @refresherrestore="onRefreshRestore"
    >
      <!-- 搜索历史 -->
      <view v-if="!keyword && searchHistory.length > 0" class="search-history">
        <view class="history-header">
          <text class="history-title">搜索历史</text>
          <view class="history-actions">
            <text v-if="!isEditingHistory" class="edit-btn" @click="toggleEditMode">编辑</text>
            <text v-else class="done-btn" @click="toggleEditMode">完成</text>
            <text class="clear-history" @click="handleClearHistory">清空</text>
          </view>
        </view>
        <view class="history-list">
          <view
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            :class="{ editing: isEditingHistory }"
            @click="handleHistoryClick(item)"
          >
            <text class="history-icon">🕐</text>
            <text class="history-text">{{ item }}</text>
            <transition name="delete-fade">
              <view v-show="isEditingHistory" class="delete-icon" @click.stop="handleDeleteHistory(index)">
                <text>✕</text>
              </view>
            </transition>
          </view>
        </view>
      </view>

      <!-- 我参与的话题 -->
      <view v-if="!keyword && myTopics.length > 0" class="my-topics">
        <view class="section-header">
          <text class="section-title">我参与的话题</text>
          <text class="section-badge">👤</text>
        </view>
        <view class="my-topics-list">
          <view
            v-for="topic in myTopics"
            :key="topic.id"
            class="topic-item"
            @click="handleTopicClick(topic)"
          >
            <image :src="topic.coverImage" mode="aspectFill" class="topic-cover" />
            <view class="topic-content">
              <text class="topic-name"># {{ topic.name }}</text>
              <text class="topic-stats">{{ formatCount(topic.postCount) }}条动态</text>
            </view>
            <view class="topic-arrow">›</view>
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
          <button class="create-topic-btn" @click="handleCreateTopic">
            <text class="btn-icon">+</text>
            <text class="btn-text">创建新话题</text>
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- 浮动创建按钮 -->
    <view class="floating-create-btn" @click="handleCreateTopic">
      <text class="floating-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { searchTopics, getHotTopics, getMyTopics } from '@/api/modules/topic';
import type { TopicDetail } from '@/api/modules/topic';
import { TOPIC_CONFIG } from '@/config/topic';

const keyword = ref('');
const searchHistory = ref<string[]>([]);
const myTopics = ref<TopicDetail[]>([]);
const hotTopics = ref<TopicDetail[]>([]);
const searchResults = ref<TopicDetail[]>([]);
const loading = ref(false);
const isEditingHistory = ref(false);
const refreshing = ref(false);

// 防抖定时器
let searchTimer: number | null = null;

// 加载话题数据
const loadTopicsData = async () => {
  let hasError = false;

  // 加载我参与的话题
  try {
    const res = await getMyTopics({ page: 1, pageSize: TOPIC_CONFIG.MY_TOPICS_LIMIT });
    if (res.code === 0 && res.data) {
      myTopics.value = res.data.list || [];
    }
  } catch (error: any) {
    console.error('Load my topics error:', error);
    hasError = true;
  }

  // 加载热门话题
  try {
    const res = await getHotTopics(TOPIC_CONFIG.HOT_TOPICS_LIMIT);
    if (res.code === 0 && res.data) {
      hotTopics.value = res.data.list || [];
    }
  } catch (error: any) {
    console.error('Load hot topics error:', error);
    hasError = true;
  }

  // 统一错误提示（避免刷新时重复提示）
  if (hasError && !refreshing.value) {
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none',
      duration: 2000,
    });
  }
};

// 下拉刷新
const handleRefresh = async () => {
  refreshing.value = true;

  try {
    await loadTopicsData();
  } catch (error) {
    console.error('Refresh error:', error);
  } finally {
    refreshing.value = false;
  }
};

// 刷新完成回调
const onRefreshRestore = () => {
  refreshing.value = false;
};

onMounted(async () => {
  // 加载搜索历史
  const history = uni.getStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SEARCH_HISTORY) || [];
  searchHistory.value = history;

  // 检查是否有新创建的话题
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options || {};

  if (options.newTopic) {
    try {
      const newTopic = JSON.parse(decodeURIComponent(options.newTopic));
      // 将新话题添加到热门话题列表顶部
      hotTopics.value.unshift(newTopic);
    } catch (error) {
      console.error('Parse new topic error:', error);
    }
  }

  // 统一加载话题数据
  await loadTopicsData();

  // 设置定时检查刷新标记（用于从详情页返回时刷新）
  const checkRefreshInterval = setInterval(() => {
    const shouldRefresh = uni.getStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SHOULD_REFRESH);
    if (shouldRefresh) {
      loadTopicsData();
      uni.removeStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SHOULD_REFRESH);
    }
  }, 500);

  // 保存定时器ID以便清理
  (window as any).__topicRefreshInterval = checkRefreshInterval;
});

// 页面卸载时清理
onUnmounted(() => {
  // 清理定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  // 清理刷新检查定时器
  const checkRefreshInterval = (window as any).__topicRefreshInterval;
  if (checkRefreshInterval) {
    clearInterval(checkRefreshInterval);
    (window as any).__topicRefreshInterval = null;
  }

  // 清理可能的标记
  uni.removeStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SHOULD_REFRESH);
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
  }, TOPIC_CONFIG.SEARCH_DEBOUNCE) as unknown as number;
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

// 返回首页
const handleBack = () => {
  uni.switchTab({
    url: '/pages/tabbar/home'
  });
};

// 点击历史记录
const handleHistoryClick = (item: string) => {
  if (isEditingHistory.value) return;
  keyword.value = item;
  handleSearch();
};

// 切换编辑模式
const toggleEditMode = () => {
  isEditingHistory.value = !isEditingHistory.value;
};

// 删除单个历史记录
const handleDeleteHistory = (index: number) => {
  searchHistory.value.splice(index, 1);
  uni.setStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SEARCH_HISTORY, searchHistory.value);

  // 如果删完了，自动退出编辑模式
  if (searchHistory.value.length === 0) {
    isEditingHistory.value = false;
  }
};

// 清空搜索历史
const handleClearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = [];
        uni.removeStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SEARCH_HISTORY);
        isEditingHistory.value = false;
      }
    },
  });
};

// 保存搜索历史
const saveSearchHistory = (kw: string) => {
  // 去重并添加到开头
  const history = searchHistory.value.filter((item) => item !== kw);
  history.unshift(kw);

  // 最多保存配置的数量
  if (history.length > TOPIC_CONFIG.MAX_SEARCH_HISTORY) {
    history.pop();
  }

  searchHistory.value = history;
  uni.setStorageSync(TOPIC_CONFIG.STORAGE_KEYS.SEARCH_HISTORY, history);
};

// 点击话题
const handleTopicClick = (topic: TopicDetail) => {
  uni.navigateTo({
    url: `/pages/square/topic?id=${topic.id}`,
  });
};

// 创建话题
const handleCreateTopic = () => {
  uni.navigateTo({
    url: '/pages/topic/create',
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-secondary;

  .search-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    padding: $padding-md $padding-lg;
    background: $bg-primary;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $margin-md;
      padding: $padding-xs;
      cursor: pointer;

      svg {
        display: block;
      }
    }

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
  }

  .scroll-content {
    flex: 1;
    margin-top: 96rpx; // 搜索框高度
  }

  .search-history {
    padding: $padding-lg;
    background: $bg-primary;
    margin-bottom: $margin-md;

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $margin-md;

      .history-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }

      .history-actions {
        display: flex;
        align-items: center;
        gap: $margin-md;

        .edit-btn,
        .done-btn,
        .clear-history {
          font-size: $font-size-sm;
          color: $primary-color;
          padding: $padding-xs $padding-sm;
          cursor: pointer;
          @include transition(opacity);

          &:active {
            opacity: 0.6;
          }
        }

        .done-btn {
          color: $success-color;
          font-weight: $font-weight-medium;
        }

        .clear-history {
          color: $error-color;
        }
      }
    }

    .history-list {
      display: flex;
      flex-wrap: wrap;
      gap: $margin-sm;

      .history-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: $padding-xs $padding-md;
        background: $bg-secondary;
        border-radius: $radius-full;
        border: 2rpx solid transparent;
        transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: padding;

        &:active:not(.editing) {
          transform: scale(0.95);
          opacity: 0.8;
        }

        &.editing {
          padding-right: 56rpx;
        }

        .history-icon {
          font-size: $font-size-sm;
          margin-right: $margin-xs;
          flex-shrink: 0;
        }

        .history-text {
          font-size: $font-size-sm;
          color: $text-secondary;
          white-space: nowrap;
        }

        .delete-icon {
          position: absolute;
          right: 8rpx;
          top: 50%;
          width: 40rpx;
          height: 40rpx;
          @include flex-center;
          background: $error-color;
          border-radius: $radius-circle;
          color: #ffffff;
          font-size: $font-size-sm;
          font-weight: bold;
          transform: translateY(-50%) scale(0);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

          &:active {
            transform: translateY(-50%) scale(0.85);
          }
        }

        &.editing .delete-icon {
          transform: translateY(-50%) scale(1);
          opacity: 1;
        }
      }
    }
  }

  .my-topics {
    padding: $padding-lg;
    background: $bg-primary;
    margin-bottom: $margin-md;

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

    .my-topics-list {
      .topic-item {
        display: flex;
        align-items: center;
        padding: $padding-md;
        background: $bg-secondary;
        border-radius: $radius-lg;
        margin-bottom: $margin-sm;
        @include transition(all);

        &:last-child {
          margin-bottom: 0;
        }

        &:active {
          transform: scale(0.98);
          opacity: 0.8;
        }

        .topic-cover {
          width: 96rpx;
          height: 96rpx;
          border-radius: $radius-md;
          margin-right: $margin-md;
          flex-shrink: 0;
        }

        .topic-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;

          .topic-name {
            font-size: $font-size-base;
            font-weight: $font-weight-medium;
            color: $primary-color;
            margin-bottom: $margin-xs;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .topic-stats {
            font-size: $font-size-sm;
            color: $text-tertiary;
          }
        }

        .topic-arrow {
          font-size: 48rpx;
          color: $text-tertiary;
          margin-left: $margin-sm;
          flex-shrink: 0;
        }
      }
    }
  }

  .hot-topics {
    padding: $padding-lg;
    background: $bg-primary;

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
        background: $bg-secondary;
        border-radius: $radius-lg;
        margin-bottom: $margin-sm;
        @include transition(all);

        &:last-child {
          margin-bottom: 0;
        }

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
        margin-bottom: $margin-xl;
      }

      .create-topic-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8rpx 96rpx;
        background: $bg-primary;
        border-radius: $radius-full;
        border: 2rpx solid $primary-color;
        margin-top: $margin-lg;
        box-shadow: $shadow-sm;
        @include transition(all);

        &:active {
          transform: scale(0.95);
          box-shadow: $shadow-xs;
        }

        .btn-icon {
          font-size: $font-size-xl;
          color: $primary-color;
          font-weight: bold;
          margin-right: $margin-xs;
        }

        .btn-text {
          font-size: $font-size-base;
          color: $primary-color;
          font-weight: $font-weight-medium;
        }
      }
    }
  }

  // 浮动创建按钮
  .floating-create-btn {
    position: fixed;
    right: 32rpx;
    bottom: 120rpx;
    width: 112rpx;
    height: 112rpx;
    background: $primary-color;
    border-radius: $radius-circle;
    box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    @include transition(all);

    &:active {
      transform: scale(0.9);
      box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.4);
    }

    .floating-icon {
      font-size: 64rpx;
      color: #ffffff;
      font-weight: 300;
      line-height: 1;
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
