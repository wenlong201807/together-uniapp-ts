<template>
  <view class="recommend-list-page">
    <!-- Type Filter Tabs -->
    <scroll-view class="tabs-scroll" scroll-x :show-scrollbar="false">
      <view class="tabs">
        <view
          v-for="tab in tabs"
          :key="tab.type"
          class="tab-item"
          :class="{ active: activeType === tab.type }"
          @click="switchTab(tab.type)"
        >
          <text class="tab-icon">{{ tab.icon }}</text>
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- Search Bar -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          :placeholder="searchPlaceholder"
          confirm-type="search"
          @confirm="handleSearch"
        />
        <view v-if="searchKeyword" class="search-clear" @click="clearSearch">
          <text class="clear-icon">✕</text>
        </view>
      </view>
    </view>

    <!-- Content List -->
    <scroll-view
      class="content-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <!-- Empty State -->
      <view v-if="!loading && items.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">{{ searchKeyword ? '未找到相关内容' : '暂无数据' }}</text>
      </view>

      <!-- List Items -->
      <view v-for="item in items" :key="item.id" class="list-item">
        <!-- Topic type -->
        <TopicCard
          v-if="item.type === 'topic'"
          :topic="(item.data as any).topic"
          @card-click="handleTopicClick"
          @view="handleTopicClick"
          @join="handleTopicJoin"
        />

        <!-- Hot type -->
        <HotCard
          v-else-if="item.type === 'hot'"
          :user="(item.data as any).user"
          :hot-score="(item.data as any).hotScore"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- Nearby type -->
        <NearbyCard
          v-else-if="item.type === 'nearby'"
          :user="(item.data as any).user"
          :distance="(item.data as any).distance"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- New user type -->
        <NewUserCard
          v-else-if="item.type === 'new'"
          :user="(item.data as any).user"
          :join-days="(item.data as any).joinDays"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- Personalized / default -->
        <RecommendationCard
          v-else
          :user="(item.data as any).user"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
          @detail="handleUserDetail"
        />
      </view>

      <!-- Load More Indicator -->
      <view v-if="loading && items.length > 0" class="load-more">
        <text class="load-more-text">加载中...</text>
      </view>

      <!-- No More Indicator -->
      <view v-if="!hasMore && items.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>

      <!-- Bottom Spacing -->
      <view class="bottom-spacer" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getRecommendationFeed } from '@/api/home';
import { getTopics, searchTopics } from '@/api/modules/topic';
import { getNearbyUsers } from '@/api/modules/nearby';
import RecommendationCard from '@/pages/tabbar/home/components/RecommendationCard.vue';
import HotCard from '@/pages/tabbar/home/components/HotCard.vue';
import NearbyCard from '@/pages/tabbar/home/components/NearbyCard.vue';
import TopicCard from '@/pages/tabbar/home/components/TopicCard.vue';
import NewUserCard from '@/pages/tabbar/home/components/NewUserCard.vue';
import type { RecommendationItem, RecommendationType } from '@/pages/tabbar/home/types/recommendation';
import type { TopicDetail } from '@/api/modules/topic';
import type { NearbyUser } from '@/api/modules/nearby';

// Tab definitions
interface TabConfig {
  type: string; // '' means all
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { type: '', label: '全部', icon: '📋' },
  { type: 'personalized', label: '推荐', icon: '✨' },
  { type: 'hot', label: '热门', icon: '🔥' },
  { type: 'nearby', label: '附近', icon: '📍' },
  { type: 'topic', label: '话题', icon: '💬' },
  { type: 'new', label: '新人', icon: '🌟' },
];

// State
const activeType = ref<string>('');
const searchKeyword = ref('');
const items = ref<RecommendationItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const cursor = ref<string | undefined>(undefined);
const pageSize = 20;

// Search placeholder based on active type
const searchPlaceholder = computed(() => {
  switch (activeType.value) {
    case 'topic': return '搜索话题';
    case 'nearby': return '搜索附近的人';
    default: return '搜索用户、话题';
  }
});

// Switch tab
const switchTab = (type: string) => {
  if (activeType.value === type) return;
  activeType.value = type;
  searchKeyword.value = '';
  resetAndFetch();
};

// Reset and fetch first page
const resetAndFetch = () => {
  items.value = [];
  currentPage.value = 1;
  hasMore.value = true;
  cursor.value = undefined;
  fetchData(1);
};

// Fetch data based on active type
const fetchData = async (page: number) => {
  if (loading.value) return;
  loading.value = true;

  try {
    let newItems: RecommendationItem[] = [];
    const type = activeType.value as RecommendationType;

    if (type === 'topic' && searchKeyword.value) {
      // Search topics
      const res = await searchTopics({
        keyword: searchKeyword.value,
        page,
        pageSize,
      });
      if (res.code === 0 && res.data) {
        newItems = (res.data.list || []).map((t: TopicDetail) => ({
          id: `topic-${t.id}`,
          type: 'topic' as RecommendationType,
          data: {
            type: 'topic',
            topic: {
              id: t.id,
              title: t.name,
              name: t.name,
              description: t.description,
              participantCount: t.participantCount,
              postCount: t.postCount,
              coverImage: t.coverImage,
              coverImages: t.coverImages,
            },
          },
        }));
        hasMore.value = res.data.hasMore;
      }
    } else if (type === 'topic') {
      // List topics
      const res = await getTopics({ page, pageSize });
      if (res.code === 0 && res.data) {
        const list = res.data.list || (res.data as any).data || [];
        newItems = (Array.isArray(list) ? list : []).map((t: TopicDetail) => ({
          id: `topic-${t.id}`,
          type: 'topic' as RecommendationType,
          data: {
            type: 'topic',
            topic: {
              id: t.id,
              title: t.name,
              name: t.name,
              description: t.description,
              participantCount: t.participantCount,
              postCount: t.postCount,
              coverImage: t.coverImage,
              coverImages: t.coverImages,
            },
          },
        }));
        hasMore.value = res.data.hasMore;
      }
    } else if (type === 'nearby') {
      // Nearby users
      const res = await getNearbyUsers({ page, pageSize });
      if (res.code === 0 && res.data) {
        newItems = (res.data.list || []).map((u: NearbyUser) => ({
          id: `nearby-${u.id}`,
          type: 'nearby' as RecommendationType,
          data: {
            type: 'nearby',
            user: {
              id: u.id,
              nickname: u.nickname,
              avatar: u.avatar,
              age: u.age,
              city: u.city,
              bio: u.bio,
              tags: u.tags,
              photos: [],
            },
            distance: u.distanceText,
          },
        }));
        hasMore.value = res.data.hasMore;
      }
    } else {
      // Use recommendation feed API (for 'all', 'personalized', 'hot', 'new')
      const types = type ? [type] : ['personalized', 'hot', 'nearby', 'topic', 'new'];
      const res = await getRecommendationFeed({
        page,
        pageSize,
        types,
        cursor: page > 1 ? cursor.value : undefined,
      });

      if (res.code === 0 && res.data) {
        newItems = res.data.data;
        hasMore.value = res.data.hasMore;
        cursor.value = res.data.nextCursor;
      }
    }

    if (page === 1) {
      items.value = newItems;
    } else {
      items.value = [...items.value, ...newItems];
    }
    currentPage.value = page;
  } catch (error) {
    console.error('[RecommendList] Fetch error:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// Pull-down refresh
const handleRefresh = async () => {
  refreshing.value = true;
  currentPage.value = 1;
  hasMore.value = true;
  cursor.value = undefined;
  try {
    await fetchData(1);
  } finally {
    setTimeout(() => {
      refreshing.value = false;
    }, 300);
  }
};

// Pull-up load more
const handleLoadMore = () => {
  if (!hasMore.value || loading.value) return;
  fetchData(currentPage.value + 1);
};

// Search
const handleSearch = () => {
  resetAndFetch();
};

// Clear search
const clearSearch = () => {
  searchKeyword.value = '';
  resetAndFetch();
};

// Card click handlers
const handleUserClick = (user: any) => {
  uni.navigateTo({ url: `/pages/user/detail?id=${user.id}` });
};

const handleUserLike = (user: any) => {
  uni.showToast({ title: '已喜欢', icon: 'success' });
};

const handleUserSkip = (user: any) => {
  const index = items.value.findIndex(item => (item.data as any).user?.id === user.id);
  if (index > -1) {
    items.value.splice(index, 1);
  }
};

const handleUserDetail = (user: any) => {
  uni.navigateTo({ url: `/pages/user/detail?id=${user.id}` });
};

const handleTopicClick = (topic: any) => {
  uni.navigateTo({ url: `/pages/square/topic?id=${topic.id}` });
};

const handleTopicJoin = (topic: any) => {
  uni.navigateTo({ url: `/pages/square/topic?id=${topic.id}` });
};

// Initialize: read type from route params
onMounted(() => {
  const pages = getCurrentPages();
  const pageInstance = pages[pages.length - 1];
  const query = (pageInstance as any).options || {};
  if (query.type && query.type !== 'all') {
    activeType.value = query.type;
  }
  fetchData(1);
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.recommend-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-secondary;

  .tabs-scroll {
    width: 100%;
    white-space: nowrap;
    background: $bg-primary;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);

    .tabs {
      display: flex;
      padding: $padding-sm $padding-md;

      .tab-item {
        display: flex;
        align-items: center;
        padding: 12rpx 24rpx;
        margin-right: $margin-sm;
        border-radius: $radius-full;
        background: $bg-secondary;
        flex-shrink: 0;
        transition: all 0.2s;

        .tab-icon {
          font-size: 28rpx;
          margin-right: 6rpx;
        }

        .tab-text {
          font-size: $font-size-sm;
          color: $text-secondary;
          font-weight: $font-weight-medium;
        }

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

          .tab-text {
            color: #ffffff;
          }
        }

        &:active {
          opacity: 0.7;
        }
      }
    }
  }

  .search-bar {
    padding: $padding-sm $padding-md;
    background: $bg-primary;

    .search-input-wrapper {
      display: flex;
      align-items: center;
      background: $bg-secondary;
      border-radius: $radius-full;
      padding: 12rpx 24rpx;

      .search-icon {
        font-size: 28rpx;
        margin-right: $margin-xs;
      }

      .search-input {
        flex: 1;
        font-size: $font-size-base;
        color: $text-primary;
        background: transparent;
      }

      .search-clear {
        padding: 4rpx 12rpx;

        .clear-icon {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }
    }
  }

  .content-scroll {
    flex: 1;
    padding: 0 $padding-md;

    .list-item {
      margin-bottom: $margin-md;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 120rpx 0;

      .empty-icon {
        font-size: 80rpx;
        margin-bottom: $margin-md;
      }

      .empty-text {
        font-size: $font-size-base;
        color: $text-tertiary;
      }
    }

    .load-more {
      padding: $padding-lg;
      text-align: center;

      .load-more-text {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }

    .no-more {
      padding: $padding-lg;
      text-align: center;

      .no-more-text {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }

    .bottom-spacer {
      height: 40rpx;
    }
  }
}
</style>
