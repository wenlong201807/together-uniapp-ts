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

    <!-- 离线降级提示 -->
    <view v-if="isMockData" class="offline-banner">
      <text class="offline-text">网络不可用，当前为示例数据</text>
    </view>

    <!-- Content List -->
    <scroll-view
      class="content-scroll"
      scroll-y
      :style="{ height: scrollHeight }"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @refresherrestore="handleRefresherRestore"
      @scrolltolower="handleLoadMore"
    >
      <!-- Loading State -->
      <view v-if="loading && items.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- Empty State -->
      <view v-else-if="!loading && items.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无数据</text>
        <view class="retry-btn" @click="handleRetry">
          <text class="retry-text">点击重试</text>
        </view>
      </view>

      <!-- List Items -->
      <view v-for="item in items" :key="item.id" class="list-item">
        <!-- Topic type -->
        <TopicCard
          v-if="item.type === 'topic'"
          :topic="extractTopic(item)!"
          @card-click="handleTopicClick"
          @view="handleTopicClick"
          @join="handleTopicJoin"
        />

        <!-- Hot type -->
        <HotCard
          v-else-if="item.type === 'hot'"
          :user="extractUser(item)!"
          :hot-score="extractHotScore(item)!"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- Nearby type -->
        <NearbyCard
          v-else-if="item.type === 'nearby'"
          :user="extractUser(item)!"
          :distance="extractDistance(item)!"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- New user type -->
        <NewUserCard
          v-else-if="item.type === 'new'"
          :user="extractUser(item)!"
          :join-days="extractJoinDays(item)!"
          @card-click="handleUserClick"
          @like="handleUserLike"
          @skip="handleUserSkip"
        />

        <!-- Personalized / default -->
        <RecommendationCard
          v-else
          :user="extractUser(item)!"
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
import { ref, onMounted } from 'vue';
import { getRecommendationFeed } from '@/api/home';
import { getTopics } from '@/api/modules/topic';
import { getNearbyUsers } from '@/api/modules/nearby';
import RecommendationCard from '@/pages/tabbar/home/components/RecommendationCard.vue';
import HotCard from '@/pages/tabbar/home/components/HotCard.vue';
import NearbyCard from '@/pages/tabbar/home/components/NearbyCard.vue';
import TopicCard from '@/pages/tabbar/home/components/TopicCard.vue';
import NewUserCard from '@/pages/tabbar/home/components/NewUserCard.vue';
import { isTopicItem, isHotItem, isNearbyItem, isNewUserItem } from '@/pages/tabbar/home/types/recommendation';
import type { RecommendationItem, RecommendationType, UserData, TopicData, HotContentData } from '@/pages/tabbar/home/types/recommendation';
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
const items = ref<RecommendationItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const cursor = ref<string | undefined>(undefined);
const isMockData = ref(false); // 标记当前数据是否为 mock 降级数据
const pageSize = 20;

// 请求 ID 机制：防止快速切换标签页时的竞态条件
let fetchId = 0;

// 计算 scroll-view 高度（必须给 scroll-y 一个固定高度才能滚动）
const scrollHeight = ref('calc(100vh - 100rpx)');

// 获取系统状态栏高度，动态计算 scroll-view 高度
const initScrollHeight = () => {
  try {
    const sysInfo = uni.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 0;
    // rpx 转 px 比率：screenWidth / 750
    const rpxToPx = sysInfo.screenWidth / 750;
    // tabs 容器高度 100rpx + 状态栏
    const tabsHeight = 100 * rpxToPx + statusBarHeight;
    scrollHeight.value = `calc(100vh - ${tabsHeight}px)`;
  } catch {
    scrollHeight.value = 'calc(100vh - 100rpx)';
  }
};

// 类型安全的数据提取函数（利用辨别联合类型 + 类型守卫）
const extractTopic = (item: RecommendationItem) => {
  if (isTopicItem(item)) {
    const t = item.data.topic;
    // TopicCard 要求 name: string，而 TopicData.name 是可选的，需要 fallback
    return {
      id: t.id,
      name: t.name || t.title || '',
      description: t.description,
      participantCount: t.participantCount || 0,
      postCount: t.postCount || 0,
      coverImage: t.coverImage,
      coverImages: t.coverImages,
    };
  }
  return null;
};

const extractUser = (item: RecommendationItem): UserData | undefined => {
  if (isHotItem(item)) return item.data.user;
  if (isNearbyItem(item)) return item.data.user;
  if (isNewUserItem(item)) return item.data.user;
  // personalized
  if (item.type === 'personalized') return (item.data as { user: UserData }).user;
  return undefined;
};

const extractHotScore = (item: RecommendationItem): HotContentData['hotScore'] | undefined => {
  if (isHotItem(item)) return item.data.hotScore;
  return undefined;
};

const extractDistance = (item: RecommendationItem): string | undefined => {
  if (isNearbyItem(item)) return item.data.distance;
  return undefined;
};

const extractJoinDays = (item: RecommendationItem): number | undefined => {
  if (isNewUserItem(item)) return item.data.joinDays;
  return undefined;
};

// Switch tab
const switchTab = (type: string) => {
  if (activeType.value === type) return;
  activeType.value = type;
  resetAndFetch();
};

// Reset and fetch first page
const resetAndFetch = () => {
  currentPage.value = 1;
  hasMore.value = true;
  cursor.value = undefined;
  isMockData.value = false;
  // 不立即清空 items，避免闪烁；fetchData 成功后会原子替换
  fetchData(1);
};

// Fetch data based on active type
const fetchData = async (page: number) => {
  const currentFetchId = ++fetchId;
  loading.value = true;

  try {
    let newItems: RecommendationItem[] = [];
    const type = activeType.value as RecommendationType;

    if (type === 'topic') {
      const res = await getTopics({ page, pageSize });
      // 竞态检查：如果 fetchId 已变，说明有更新的请求，丢弃当前结果
      if (currentFetchId !== fetchId) return;
      if (res.code === 0 && res.data) {
        const list = res.data.list || [];
        newItems = (Array.isArray(list) ? list : []).map((t: TopicDetail) => ({
          id: `topic-${t.id}`,
          type: 'topic' as const,
          data: {
            type: 'topic' as const,
            topic: {
              id: t.id,
              title: t.name,
              name: t.name,
              description: t.description,
              participantCount: t.participantCount || 0,
              postCount: t.postCount || 0,
              coverImage: t.coverImage,
              coverImages: t.coverImages,
            },
          },
        }));
        hasMore.value = res.data.hasMore ?? (list.length >= pageSize);
      }
    } else if (type === 'nearby') {
      const res = await getNearbyUsers({ page, pageSize });
      if (currentFetchId !== fetchId) return;
      if (res.code === 0 && res.data) {
        const list = res.data.list || [];
        newItems = list.map((u: NearbyUser) => ({
          id: `nearby-${u.id}`,
          type: 'nearby' as const,
          data: {
            type: 'nearby' as const,
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
        hasMore.value = res.data.hasMore ?? (list.length >= pageSize);
      }
    } else {
      const types = type ? [type as RecommendationType] : ['personalized', 'hot', 'nearby', 'topic', 'new'] as RecommendationType[];
      const res = await getRecommendationFeed({
        page,
        pageSize,
        types,
        cursor: page > 1 ? cursor.value : undefined,
      });
      if (currentFetchId !== fetchId) return;
      if (res.code === 0 && res.data) {
        newItems = res.data.data || [];
        hasMore.value = res.data.hasMore ?? false;
        cursor.value = res.data.nextCursor;
      }
    }

    // 二次竞态检查后再更新状态
    if (currentFetchId !== fetchId) return;

    if (page === 1) {
      items.value = newItems;
    } else {
      items.value = [...items.value, ...newItems];
    }
    currentPage.value = page;
    isMockData.value = false;
  } catch (error) {
    if (currentFetchId !== fetchId) return;
    // API 失败时使用 mock 数据作为降级
    if (page === 1 && items.value.length === 0) {
      items.value = generateMockFallback(activeType.value, pageSize);
      hasMore.value = false;
      isMockData.value = true;
    }
  } finally {
    // 只有当前请求是最新的，才重置 loading 状态
    if (currentFetchId === fetchId) {
      loading.value = false;
    }
  }
};

// Pull-down refresh
const handleRefresh = async () => {
  refreshing.value = true;
  currentPage.value = 1;
  hasMore.value = true;
  cursor.value = undefined;
  isMockData.value = false;
  // 不清空 items，保留旧数据直到新数据到达，避免闪烁

  try {
    await fetchData(1);
  } catch {
    // fetchData 内部已处理错误
  } finally {
    refreshing.value = false;
  }
};

// Refresh restore event
const handleRefresherRestore = () => {
  refreshing.value = false;
};

// Pull-up load more
const handleLoadMore = () => {
  if (!hasMore.value || loading.value) return;
  fetchData(currentPage.value + 1);
};

// Retry on empty state
const handleRetry = () => {
  resetAndFetch();
};

// Card click handlers
const handleUserClick = (user: any) => {
  uni.navigateTo({ url: `/pages/user/detail?id=${user.id}` });
};

const handleUserLike = (user: any) => {
  uni.showToast({ title: '已喜欢', icon: 'success' });
  // TODO: 调用实际点赞 API
};

const handleUserSkip = (user: any) => {
  const index = items.value.findIndex(item => {
    const userData = extractUser(item);
    return userData?.id === user.id;
  });
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
  // TODO: 调用实际加入话题 API
  uni.navigateTo({ url: `/pages/square/topic?id=${topic.id}` });
};

// Mock data fallback for when API fails
const generateMockFallback = (type: string, count: number): RecommendationItem[] => {
  const result: RecommendationItem[] = [];
  const effectiveType = (type || 'personalized') as RecommendationType;

  for (let i = 0; i < count; i++) {
    const baseUser: UserData = {
      id: Math.floor(Math.random() * 10000),
      nickname: `用户${Math.floor(Math.random() * 1000)}`,
      avatar: `https://picsum.photos/200?random=${Date.now()}-${i}`,
      age: 20 + Math.floor(Math.random() * 15),
      city: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)],
      bio: '这是一段个人简介',
      tags: ['旅行', '美食', '摄影', '音乐', '运动'].slice(0, 2 + Math.floor(Math.random() * 3)),
      photos: [],
    };

    let item: RecommendationItem;
    switch (effectiveType) {
      case 'hot':
        item = {
          id: `hot-${Date.now()}-${i}`,
          type: 'hot',
          data: { type: 'hot' as const, user: baseUser, hotScore: { likes: Math.floor(Math.random() * 10000), comments: Math.floor(Math.random() * 1000), favorites: Math.floor(Math.random() * 5000) } },
        };
        break;
      case 'nearby':
        item = {
          id: `nearby-${Date.now()}-${i}`,
          type: 'nearby',
          data: { type: 'nearby' as const, user: baseUser, distance: `${(Math.random() * 10).toFixed(1)}km` },
        };
        break;
      case 'topic': {
        const mockTopic: TopicData = {
          id: Math.floor(Math.random() * 1000),
          title: `话题${Math.floor(Math.random() * 100)}`,
          name: `话题${Math.floor(Math.random() * 100)}`,
          description: '这是一个有趣的话题',
          participantCount: Math.floor(Math.random() * 50000),
          postCount: Math.floor(Math.random() * 100000),
          coverImages: [`https://picsum.photos/400?random=${Date.now()}-${i}`],
        };
        item = {
          id: `topic-${Date.now()}-${i}`,
          type: 'topic',
          data: { type: 'topic' as const, topic: mockTopic },
        };
        break;
      }
      case 'new':
        item = {
          id: `new-${Date.now()}-${i}`,
          type: 'new',
          data: { type: 'new' as const, user: baseUser, joinDays: Math.floor(Math.random() * 7) + 1 },
        };
        break;
      default:
        item = {
          id: `personalized-${Date.now()}-${i}`,
          type: 'personalized',
          data: { type: 'personalized' as const, user: baseUser },
        };
    }

    result.push(item);
  }

  return result;
};

// Initialize: read type from route params
onMounted(() => {
  initScrollHeight();
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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    white-space: nowrap;
    background: $bg-primary;
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
    z-index: 100;
    // 状态栏安全区，避免刘海屏遮挡
    padding-top: var(--status-bar-height, 0px);

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

  // 离线降级提示横幅
  .offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 101;
    padding: 12rpx 24rpx;
    background: rgba(255, 152, 0, 0.9);
    text-align: center;

    .offline-text {
      font-size: $font-size-sm;
      color: #ffffff;
    }
  }

  .content-scroll {
    // margin-top 需要动态计算，用 CSS 变量 + 状态栏高度
    margin-top: calc(100rpx + var(--status-bar-height, 0px));
    padding: 0 $padding-md;

    .list-item {
      margin-bottom: $margin-md;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 120rpx 0;

      .loading-text {
        font-size: $font-size-base;
        color: $text-tertiary;
      }
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
        margin-bottom: $margin-md;
      }

      .retry-btn {
        padding: 16rpx 48rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: $radius-full;

        .retry-text {
          font-size: $font-size-sm;
          color: #ffffff;
        }

        &:active {
          opacity: 0.7;
        }
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
