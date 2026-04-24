<template>
  <view class="home-container">
    <!-- 顶部导航 -->
    <TopNavigation
      :city="currentCity"
      :unread-count="unreadCount"
      @location-click="handleLocationClick"
      @search-click="handleSearchClick"
      @message-click="handleMessageClick"
    />

    <!-- 滚动容器 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scroll="handleScroll"
    >
      <!-- Banner轮播 -->
      <BannerCarousel
        :banners="banners"
        @banner-click="handleBannerClick"
      />

      <!-- 快速入口 -->
      <QuickActions
        :actions="quickActions"
        @action-click="handleActionClick"
      />

      <!-- 推荐流 -->
      <view class="recommendation-feed">
        <view class="section-header">
          <text class="section-title">为你推荐</text>
        </view>

        <!-- 骨架屏 -->
        <template v-if="showSkeleton">
          <SkeletonCard v-for="i in 3" :key="i" />
        </template>

        <!-- 推荐内容 -->
        <template v-else>
          <template v-for="item in recommendationItems" :key="item.id">
          <!-- 个性化推荐卡片 -->
          <RecommendationCard
            v-if="item.type === 'personalized'"
            :user="item.data.user"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
            @detail="handleUserDetail"
          />

          <!-- 热门卡片 -->
          <HotCard
            v-else-if="item.type === 'hot'"
            :user="item.data.user"
            :hot-score="item.data.hotScore"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />

          <!-- 附近的人卡片 -->
          <NearbyCard
            v-else-if="item.type === 'nearby'"
            :user="item.data.user"
            :distance="item.data.distance"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />

          <!-- 话题卡片 -->
          <TopicCard
            v-else-if="item.type === 'topic'"
            :topic="item.data"
            @card-click="handleTopicClick"
            @view="handleTopicView"
            @join="handleTopicJoin"
          />

          <!-- 新用户卡片 -->
          <NewUserCard
            v-else-if="item.type === 'new'"
            :user="item.data.user"
            :join-days="item.data.joinDays"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />
        </template>

        <!-- 加载状态 -->
        <view v-if="loading && recommendationItems.length > 0" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 无更多数据 -->
        <view v-if="!hasMore && recommendationItems.length > 0" class="no-more">
          <text class="no-more-text">没有更多内容了</text>
        </view>
        </template>
      </view>
    </scroll-view>

    <!-- NPS反馈弹窗 -->
    <NPSModal
      :visible="npsVisible"
      :trigger-type="npsTriggerType"
      :trigger-scene="npsTriggerScene"
      @close="closeNPS"
      @success="onNPSSuccess"
    />

    <!-- 城市选择弹窗 -->
    <CitySelector
      :visible="showCitySelector"
      :current-city="currentCity"
      @close="showCitySelector = false"
      @select="handleCitySelect"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores';
import TopNavigation from './home/components/TopNavigation.vue';
import BannerCarousel from './home/components/BannerCarousel.vue';
import QuickActions from './home/components/QuickActions.vue';
import RecommendationCard from './home/components/RecommendationCard.vue';
import HotCard from './home/components/HotCard.vue';
import NearbyCard from './home/components/NearbyCard.vue';
import TopicCard from './home/components/TopicCard.vue';
import NewUserCard from './home/components/NewUserCard.vue';
import SkeletonCard from './home/components/SkeletonCard.vue';
import NPSModal from '@/components/business/NPSModal.vue';
import CitySelector from '@/components/business/CitySelector.vue';
import { useNPS, NPSScene } from '@/composables/useNPS';
import { useRecommendation } from './home/composables/useRecommendation';
import { useInfiniteScroll } from './home/composables/useInfiniteScroll';
import { useImageLazyLoad, ImagePreloadStrategy } from '@/utils/imageLoader';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRE_TIME } from '@/utils/cache';
import { getBanners } from '@/api/home';
import type { Banner } from './home/components/BannerCarousel.vue';
import type { QuickAction } from './home/components/QuickActions.vue';

const authStore = useAuthStore();
const { npsVisible, npsTriggerType, npsTriggerScene, checkAndTrigger, closeNPS, onNPSSuccess } = useNPS();

// 图片懒加载
const { preloadImages } = useImageLazyLoad({
  placeholder: 'https://via.placeholder.com/400',
});

// 图片预加载策略
const imagePreloadStrategy = new ImagePreloadStrategy();

// 推荐流
const {
  items: recommendationItems,
  loading,
  hasMore,
  fetchRecommendations,
  loadMore,
  refresh,
  trackAction,
} = useRecommendation({ useMockData: true });

// 无限滚动
const { refreshing, handleScroll } = useInfiniteScroll({
  onLoadMore: loadMore,
  onRefresh: refresh,
});

// 当前城市
const currentCity = ref('定位中...');

// 城市选择弹窗
const showCitySelector = ref(false);

// 未读消息数
const unreadCount = ref(0);

// Banner数据
const banners = ref<Banner[]>([]);

// 是否显示骨架屏
const showSkeleton = computed(() => loading.value && recommendationItems.value.length === 0);

// 定时器引用
let cleanupTimer: number | null = null;

// 快速入口
const quickActions = ref<QuickAction[]>([
  {
    id: 'publish',
    icon: '📝',
    text: '发布动态',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    handler: () => {
      uni.switchTab({ url: '/pages/tabbar/square' });
    },
  },
  {
    id: 'mbti',
    icon: '🧠',
    text: 'MBTI测试',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    handler: () => {
      uni.navigateTo({ url: '/pages/mbti/intro' });
    },
  },
  {
    id: 'friends',
    icon: '👥',
    text: '好友',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    handler: () => {
      uni.navigateTo({ url: '/pages/friend/list' });
    },
  },
  {
    id: 'nearby',
    icon: '📍',
    text: '附近的人',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    handler: () => {
      uni.navigateTo({ url: '/pages/nearby/index' });
    },
  },
]);

// 加载 Banner
const loadBanners = async () => {
  try {
    // 先从缓存读取
    const memoryCache = CacheManager.getMemoryCache();
    const cachedBanners = memoryCache.get<Banner[]>(CACHE_KEYS.BANNERS);

    if (cachedBanners) {
      banners.value = cachedBanners;
      return;
    }

    // 缓存未命中，调用API
    const response = await getBanners();
    if (response.code === 200 && response.data) {
      banners.value = response.data;
      // 缓存数据
      memoryCache.set(CACHE_KEYS.BANNERS, response.data, CACHE_EXPIRE_TIME.BANNERS);
    }
  } catch (error) {
    console.error('Load banners error:', error);
    // 使用默认数据
    banners.value = [
      {
        id: 1,
        title: '欢迎来到社交平台',
        subtitle: '发现更多有趣的人和事',
        imageUrl: 'https://picsum.photos/800/400?random=1',
        linkType: 'activity',
      },
      {
        id: 2,
        title: '热门话题',
        subtitle: '参与讨论，分享你的观点',
        imageUrl: 'https://picsum.photos/800/400?random=2',
        linkType: 'topic',
      },
      {
        id: 3,
        title: '附近的人',
        subtitle: '发现身边的朋友',
        imageUrl: 'https://picsum.photos/800/400?random=3',
        linkType: 'user',
      },
    ];
  }
};

// 顶部导航事件
const handleLocationClick = () => {
  console.log('Location clicked');
  showCitySelector.value = true;
};

const handleSearchClick = () => {
  console.log('Search clicked');
  uni.showToast({ title: '搜索功能开发中', icon: 'none' });
};

const handleMessageClick = () => {
  console.log('Message clicked');
  uni.navigateTo({ url: '/pages/chat/list' });
};

// 城市选择
const handleCitySelect = (city: string) => {
  currentCity.value = city;

  // 刷新推荐内容
  page.value = 1;
  recommendationItems.value = [];
  hasMore.value = true;
  loadRecommendations();
};

// Banner事件
const handleBannerClick = (banner: Banner) => {
  console.log('Banner clicked:', banner);
  trackAction('view', 'post', banner.id);
};

// 快速入口事件
const handleActionClick = (action: QuickAction) => {
  console.log('Action clicked:', action);
};

// 用户卡片事件
const handleUserClick = (user: any) => {
  console.log('User clicked:', user);
  trackAction('view', 'user', user.id);
  uni.navigateTo({
    url: `/pages/user/detail?id=${user.id}`
  });
};

const handleUserLike = (user: any) => {
  console.log('User liked:', user);
  trackAction('like', 'user', user.id);
  uni.showToast({ title: '已喜欢', icon: 'success' });
};

const handleUserSkip = (user: any) => {
  console.log('User skipped:', user);
  trackAction('skip', 'user', user.id);
  // 从列表中移除
  const index = recommendationItems.value.findIndex(item => item.data.user?.id === user.id);
  if (index > -1) {
    recommendationItems.value.splice(index, 1);
  }
};

const handleUserDetail = (user: any) => {
  console.log('User detail:', user);
  trackAction('view', 'user', user.id);
  uni.navigateTo({
    url: `/pages/user/detail?id=${user.id}`
  });
};

// 话题卡片事件
const handleTopicClick = (topic: any) => {
  console.log('Topic clicked:', topic);
  trackAction('view', 'topic', topic.id);
  uni.navigateTo({
    url: `/pages/square/topic?id=${topic.id}`
  });
};

const handleTopicView = (topic: any) => {
  console.log('Topic view:', topic);
  trackAction('view', 'topic', topic.id);
  uni.navigateTo({
    url: `/pages/square/topic?id=${topic.id}`
  });
};

const handleTopicJoin = async (topic: any) => {
  console.log('Topic join:', topic);
  trackAction('favorite', 'topic', topic.id);

  // 跳转到话题详情页进行参与
  uni.navigateTo({
    url: `/pages/square/topic?id=${topic.id}`
  });
};

// 刷新
const handleRefresh = async () => {
  await refresh();
  // 清理过期缓存
  CacheManager.clearAllExpired();
};

// 预加载下一页图片
const preloadNextPageImages = async () => {
  if (recommendationItems.value.length > 0) {
    const lastVisibleIndex = Math.min(5, recommendationItems.value.length - 1);
    await imagePreloadStrategy.preloadNextPage(recommendationItems.value, lastVisibleIndex, 3);
  }
};

// 初始化
onMounted(async () => {
  // 获取定位
  currentCity.value = '北京';

  // 并行加载数据
  const results = await Promise.allSettled([
    loadBanners(),
    fetchRecommendations(),
  ]);

  // 检查加载结果
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`数据加载失败 [${index}]:`, result.reason);
    }
  });

  // 预加载图片
  await preloadNextPageImages();

  // 检查并触发NPS
  checkAndTrigger({
    scene: NPSScene.PERIODIC,
    delay: 3000,
  });

  // 定期清理过期缓存
  cleanupTimer = setInterval(() => {
    CacheManager.clearAllExpired();
  }, 10 * 60 * 1000) as unknown as number;
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.home-container {
  min-height: 100vh;
  background: $bg-secondary;
  display: flex;
  flex-direction: column;

  .scroll-container {
    flex: 1;
    height: calc(100vh - 120rpx);
    padding: $padding-lg;

    .recommendation-feed {
      .section-header {
        margin-bottom: $margin-lg;

        .section-title {
          font-size: $font-size-xl;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }
      }

      .loading-state {
        padding: $padding-xl;
        text-align: center;

        .loading-text {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }

      .no-more {
        padding: $padding-xl;
        text-align: center;

        .no-more-text {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }
    }
  }
}
</style>
