<template>
  <view class="topic-picker">
    <!-- 触发按钮 -->
    <view class="picker-trigger" @click="openPicker">
      <view v-if="selectedTopic" class="selected-topic">
        <text class="topic-icon">#</text>
        <text class="topic-name">{{ selectedTopic.name }}</text>
        <view class="clear-icon" @click.stop="clearTopic">
          <text>×</text>
        </view>
      </view>
      <view v-else class="placeholder">
        <text class="placeholder-icon">#</text>
        <text class="placeholder-text">添加话题</text>
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 底部弹窗遮罩 -->
    <view
      v-if="pickerVisible"
      class="popup-mask"
      :class="{ 'mask-visible': maskVisible }"
      @click="closePicker"
    >
      <!-- 底部弹窗内容 -->
      <view
        class="picker-popup"
        :class="{ 'popup-visible': popupVisible }"
        @click.stop
      >
        <!-- 顶部拖拽指示器 -->
        <view class="drag-indicator" @click="closePicker">
          <view class="indicator-bar"></view>
        </view>

        <!-- 标题栏 -->
        <view class="popup-header">
          <text class="header-title">选择话题</text>
          <view class="close-btn" @click="closePicker">
            <text class="close-text">×</text>
          </view>
        </view>

        <!-- 搜索框 -->
        <view class="search-container">
          <view class="search-box">
            <text class="search-icon">🔍</text>
            <input
              v-model="keyword"
              class="search-input"
              placeholder="搜索话题名称"
              placeholder-class="search-placeholder"
              @input="handleSearch"
            />
            <view v-if="keyword" class="clear-search" @click="clearSearch">
              <text>×</text>
            </view>
          </view>
        </view>

        <!-- 话题列表 -->
        <scroll-view class="topic-list" scroll-y @scrolltolower="loadMore">
          <!-- 加载状态 -->
          <view v-if="loading && topics.length === 0" class="loading-state">
            <view class="loading-spinner"></view>
            <text class="loading-text">加载中...</text>
          </view>

          <!-- 话题列表 -->
          <view v-else-if="topics.length > 0" class="topics">
            <view
              v-for="topic in topics"
              :key="topic.id"
              class="topic-item"
              :class="{ active: modelValue === topic.id }"
              @click="selectTopic(topic)"
            >
              <view class="topic-left">
                <image
                  v-img-proxy="topic.coverImage"
                  mode="aspectFill"
                  class="topic-cover"
                />
                <view class="topic-info">
                  <view class="topic-name-row">
                    <text class="topic-name"># {{ topic.name }}</text>
                    <view v-if="topic.isHot" class="hot-badge">
                      <text class="hot-text">🔥 热门</text>
                    </view>
                  </view>
                  <text class="topic-stats">{{ formatCount(topic.postCount) }} 条帖子 · {{ formatCount(topic.followCount) }} 人关注</text>
                </view>
              </view>
              <view v-if="modelValue === topic.id" class="check-icon">
                <text class="check-text">✓</text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else class="empty-state">
            <text class="empty-icon">📭</text>
            <text class="empty-text">{{ keyword ? '未找到相关话题' : '暂无话题' }}</text>
            <text v-if="keyword" class="empty-hint">试试其他关键词</text>
          </view>

          <!-- 加载更多 -->
          <view v-if="loadingMore" class="loading-more">
            <view class="loading-spinner small"></view>
            <text class="loading-text">加载中...</text>
          </view>

          <!-- 没有更多 -->
          <view v-if="!hasMore && topics.length > 0 && !keyword" class="no-more">
            <text>已显示全部热门话题</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { getHotTopics, searchTopics, getTopicDetail, type TopicDetail } from '@/api';
import { formatCount } from '@/utils/format';

interface Props {
  modelValue?: number;
}

interface Emits {
  (e: 'update:modelValue', value: number | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const keyword = ref('');
const pickerVisible = ref(false);
const maskVisible = ref(false);
const popupVisible = ref(false);
const topics = ref<TopicDetail[]>([]);
const selectedTopic = ref<TopicDetail | null>(null);
const loading = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 加载话题列表
const loadTopics = async (isLoadMore = false) => {
  if (loading.value || loadingMore.value) return;

  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    page.value = 1;
    loading.value = true;
  }

  try {
    // 如果有搜索关键词，使用搜索接口
    if (keyword.value) {
      const params = {
        keyword: keyword.value,
        page: page.value,
        pageSize,
      };
      const res = await searchTopics(params);

      if (res.code === 0) {
        if (isLoadMore) {
          topics.value = [...topics.value, ...res.data.list];
        } else {
          topics.value = res.data.list;
        }
        hasMore.value = res.data.hasMore;
      }
    } else {
      // 没有搜索关键词，加载热门话题前30条
      const res = await getHotTopics(30);

      if (res.code === 0) {
        topics.value = res.data.list;
        hasMore.value = false; // 热门话题不支持分页，一次性加载完
      }
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 组件挂载时加载话题列表
onMounted(() => {
  loadTopics();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});

// 打开选择器
const openPicker = () => {
  pickerVisible.value = true;
  // 下一帧触发动画（先显示遮罩，再弹起内容）
  setTimeout(() => {
    maskVisible.value = true;
    popupVisible.value = true;
  }, 50);
  // 如果话题列表为空，重新加载
  if (topics.value.length === 0 && !loading.value) {
    loadTopics();
  }
};

// 监听modelValue变化，初始化selectedTopic
watch(() => props.modelValue, async (newVal) => {
  if (newVal && !selectedTopic.value) {
    // 先从已加载的话题列表中查找
    const topic = topics.value.find(t => t.id === newVal);
    if (topic) {
      selectedTopic.value = topic;
      return;
    }

    // 如果找不到，从热门话题中查找
    try {
      const res = await getHotTopics(100);
      if (res.code === 0) {
        const foundTopic = res.data.list.find(t => t.id === newVal);
        if (foundTopic) {
          selectedTopic.value = foundTopic;
        }
      }
    } catch (error) {
      console.error('加载话题详情失败:', error);
    }
  } else if (!newVal) {
    selectedTopic.value = null;
  }
}, { immediate: true });

// 搜索（带防抖）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    page.value = 1;
    topics.value = [];
    loadTopics();
  }, 300);
};

// 清除搜索
const clearSearch = () => {
  keyword.value = '';
  handleSearch();
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value || loadingMore.value) return;
  page.value++;
  loadTopics(true);
};

// 选择话题
const selectTopic = (topic: TopicDetail) => {
  selectedTopic.value = topic;
  emit('update:modelValue', topic.id);
  closePicker();
};

// 清除话题
const clearTopic = () => {
  selectedTopic.value = null;
  emit('update:modelValue', undefined);
};

// 关闭选择器
const closePicker = () => {
  // 先触发收起动画
  maskVisible.value = false;
  popupVisible.value = false;
  // 动画结束后移除 DOM
  setTimeout(() => {
    pickerVisible.value = false;
  }, 300);
};
</script>

<style lang="scss" scoped>
.topic-picker {
  .picker-trigger {
    padding: 20rpx 0;

    .selected-topic {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 20rpx 28rpx;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 16rpx;
      border: 2rpx solid #667eea40;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
        opacity: 0.8;
      }

      .topic-icon {
        font-size: 32rpx;
        font-weight: bold;
        color: #667eea;
      }

      .topic-name {
        flex: 1;
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
      }

      .clear-icon {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
        font-size: 32rpx;
        color: #999;
        line-height: 1;
        transition: all 0.3s ease;

        &:active {
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }

    .placeholder {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 20rpx 28rpx;
      background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
      border-radius: 16rpx;
      border: 2rpx dashed #d0d7de;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
        border-color: #667eea;
        background: linear-gradient(135deg, #f0f2ff 0%, #f8f6ff 100%);
      }

      .placeholder-icon {
        font-size: 32rpx;
        font-weight: bold;
        color: #999;
      }

      .placeholder-text {
        flex: 1;
        font-size: 28rpx;
        color: #666;
      }

      .arrow-icon {
        font-size: 36rpx;
        color: #999;
        font-weight: 300;
      }
    }
  }
}

// 底部弹窗遮罩
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0);
  transition: background 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  &.mask-visible {
    background: rgba(0, 0, 0, 0.5);
  }
}

.picker-popup {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 24rpx 24rpx 0 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  // 安全区域底部留白（兼容 iPhone X+）
  padding-bottom: env(safe-area-inset-bottom);

  &.popup-visible {
    transform: translateY(0);
  }

  .drag-indicator {
    display: flex;
    justify-content: center;
    padding: 16rpx 0 8rpx;
    cursor: pointer;

    .indicator-bar {
      width: 80rpx;
      height: 8rpx;
      background: #e0e0e0;
      border-radius: 4rpx;
    }
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 32rpx 24rpx;

    .header-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #1a1a1a;
      letter-spacing: 0.5rpx;
    }

    .close-btn {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 50%;
      transition: all 0.3s ease;

      &:active {
        background: #e8e8e8;
        transform: scale(0.9);
      }

      .close-text {
        font-size: 48rpx;
        color: #666;
        line-height: 1;
        font-weight: 300;
      }
    }
  }

  .search-container {
    padding: 0 32rpx 24rpx;

    .search-box {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 20rpx 28rpx;
      background: #f5f7fa;
      border-radius: 20rpx;
      border: 2rpx solid transparent;
      transition: all 0.3s ease;

      &:focus-within {
        background: #fff;
        border-color: #667eea;
        box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.1);
      }

      .search-icon {
        font-size: 32rpx;
        line-height: 1;
      }

      .search-input {
        flex: 1;
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
      }

      .search-placeholder {
        color: #999;
      }

      .clear-search {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
        font-size: 32rpx;
        color: #999;
        line-height: 1;
        transition: all 0.3s ease;

        &:active {
          background: rgba(0, 0, 0, 0.1);
          transform: scale(0.9);
        }
      }
    }
  }

  .topic-list {
    flex: 1;
    padding: 0 32rpx 32rpx;

    .topics {
      .topic-item {
        display: flex;
        align-items: center;
        gap: 24rpx;
        padding: 24rpx 20rpx;
        margin-bottom: 12rpx;
        background: #fff;
        border-radius: 16rpx;
        border: 2rpx solid transparent;
        transition: all 0.3s ease;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

        &:active {
          transform: scale(0.98);
        }

        &.active {
          background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
          border-color: #667eea;
          box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.15);
        }

        .topic-left {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 24rpx;
        }

        .topic-cover {
          width: 96rpx;
          height: 96rpx;
          border-radius: 16rpx;
          flex-shrink: 0;
          background: #f5f5f5;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
        }

        .topic-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12rpx;

          .topic-name-row {
            display: flex;
            align-items: center;
            gap: 12rpx;
          }

          .topic-name {
            font-size: 30rpx;
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.4;
          }

          .hot-badge {
            padding: 4rpx 12rpx;
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
            border-radius: 8rpx;
            box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);

            .hot-text {
              font-size: 20rpx;
              color: #fff;
              font-weight: 500;
            }
          }

          .topic-stats {
            font-size: 24rpx;
            color: #999;
            line-height: 1.4;
          }
        }

        .check-icon {
          width: 48rpx;
          height: 48rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);

          .check-text {
            font-size: 28rpx;
            color: #fff;
            font-weight: bold;
            line-height: 1;
          }
        }
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120rpx 40rpx;

      .empty-icon {
        font-size: 120rpx;
        line-height: 1;
        margin-bottom: 24rpx;
      }

      .empty-text {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 12rpx;
      }

      .empty-hint {
        font-size: 24rpx;
        color: #bbb;
      }

      .loading-spinner {
        width: 80rpx;
        height: 80rpx;
        border: 6rpx solid #f0f0f0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 24rpx;

        &.small {
          width: 40rpx;
          height: 40rpx;
          border-width: 4rpx;
          margin-bottom: 0;
          margin-right: 12rpx;
        }
      }

      .loading-text {
        font-size: 26rpx;
        color: #999;
      }
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40rpx 0;
    }

    .no-more {
      padding: 40rpx 0;
      text-align: center;
      font-size: 24rpx;
      color: #bbb;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
