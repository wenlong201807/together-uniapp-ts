<template>
  <view class="topic-picker">
    <view class="picker-trigger" @click="openPicker">
      <view v-if="selectedTopic" class="selected-topic">
        <text class="topic-icon">#</text>
        <text class="topic-name">{{ selectedTopic.name }}</text>
        <uni-icons type="close" size="16" color="#999" @click.stop="clearTopic" />
      </view>
      <view v-else class="placeholder">
        <uni-icons type="plus" size="16" color="#999" />
        <text class="placeholder-text">添加话题（可选）</text>
      </view>
    </view>

    <!-- 话题选择弹窗 -->
    <uni-popup ref="popup" type="bottom" :safe-area="true">
      <view class="picker-popup">
        <view class="popup-header">
          <text class="header-title">选择话题</text>
          <view class="close-btn" @click="closePicker">
            <uni-icons type="close" size="20" color="#333" />
          </view>
        </view>

        <!-- 搜索框 -->
        <view class="search-box">
          <uni-icons type="search" size="18" color="#999" />
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索话题"
            @input="handleSearch"
          />
          <uni-icons
            v-if="keyword"
            type="clear"
            size="16"
            color="#999"
            @click="clearSearch"
          />
        </view>

        <!-- 话题列表 -->
        <scroll-view class="topic-list" scroll-y @scrolltolower="loadMore">
          <view v-if="loading && topics.length === 0" class="loading-state">
            <uni-load-more status="loading" />
          </view>

          <view v-else-if="topics.length > 0" class="topics">
            <view
              v-for="topic in topics"
              :key="topic.id"
              class="topic-item"
              :class="{ active: modelValue === topic.id }"
              @click="selectTopic(topic)"
            >
              <image :src="topic.coverImage" mode="aspectFill" class="topic-cover" />
              <view class="topic-info">
                <text class="topic-name">{{ topic.name }}</text>
                <text class="topic-stats">{{ formatCount(topic.postCount) }} 帖子</text>
              </view>
              <view v-if="modelValue === topic.id" class="check-icon">
                <uni-icons type="checkmarkempty" size="20" color="#1890ff" />
              </view>
            </view>
          </view>

          <view v-else class="empty-state">
            <uni-icons type="info" size="48" color="#ccc" />
            <text class="empty-text">{{ keyword ? '未找到相关话题' : '暂无话题' }}</text>
          </view>

          <view v-if="loadingMore" class="loading-more">
            <uni-load-more status="loading" />
          </view>

          <view v-if="!hasMore && topics.length > 0" class="no-more">
            <text>没有更多了</text>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getTopics, searchTopics, type TopicDetail } from '@/api';
import { formatCount } from '@/utils/format';

interface Props {
  modelValue?: number;
}

interface Emits {
  (e: 'update:modelValue', value: number | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const popup = ref<any>(null);
const keyword = ref('');
const topics = ref<TopicDetail[]>([]);
const selectedTopic = ref<TopicDetail | null>(null);
const loading = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 打开选择器
const openPicker = () => {
  if (popup.value) {
    popup.value.open();
    loadTopics();
  }
};

// 监听modelValue变化，初始化selectedTopic
watch(() => props.modelValue, async (newVal) => {
  if (newVal && !selectedTopic.value) {
    // 如果有modelValue但没有selectedTopic，需要加载话题详情
    try {
      const res = await getTopics({ page: 1, pageSize: 100 });
      if (res.code === 0) {
        const topic = res.data.list.find(t => t.id === newVal);
        if (topic) {
          selectedTopic.value = topic;
        }
      }
    } catch (error) {
      console.error('加载话题详情失败:', error);
    }
  } else if (!newVal) {
    selectedTopic.value = null;
  }
}, { immediate: true });

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
    const params = {
      page: page.value,
      pageSize,
      keyword: keyword.value || undefined,
    };

    const res = keyword.value ? await searchTopics(params) : await getTopics(params);

    if (res.code === 0) {
      if (isLoadMore) {
        topics.value = [...topics.value, ...res.data.list];
      } else {
        topics.value = res.data.list;
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
    loadingMore.value = false;
  }
};

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
  if (popup.value) {
    popup.value.close();
  }
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
      padding: 16rpx 24rpx;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 40rpx;
      border: 1rpx solid #667eea30;

      .topic-icon {
        font-size: 28rpx;
        font-weight: bold;
        color: #667eea;
      }

      .topic-name {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }
    }

    .placeholder {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 16rpx 24rpx;
      background-color: #f5f5f5;
      border-radius: 40rpx;
      border: 1rpx dashed #d9d9d9;

      .placeholder-text {
        font-size: 28rpx;
        color: #999;
      }
    }
  }
}

.picker-popup {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;

    .header-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      padding: 8rpx;
    }
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin: 20rpx 30rpx;
    padding: 16rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 40rpx;

    .search-input {
      flex: 1;
      font-size: 28rpx;
    }
  }

  .topic-list {
    flex: 1;
    padding: 0 30rpx 30rpx;

    .topics {
      .topic-item {
        display: flex;
        align-items: center;
        gap: 24rpx;
        padding: 24rpx 0;
        border-bottom: 1rpx solid #f5f5f5;

        &.active {
          background-color: #f0f7ff;
          margin: 0 -30rpx;
          padding: 24rpx 30rpx;
        }

        .topic-cover {
          width: 80rpx;
          height: 80rpx;
          border-radius: 12rpx;
          flex-shrink: 0;
        }

        .topic-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8rpx;

          .topic-name {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
          }

          .topic-stats {
            font-size: 24rpx;
            color: #999;
          }
        }

        .check-icon {
          flex-shrink: 0;
        }
      }
    }

    .loading-state,
    .empty-state {
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

    .loading-more,
    .no-more {
      padding: 40rpx 0;
      text-align: center;
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>
