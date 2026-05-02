<template>
  <view class="home-container">
    <!-- 顶部导航 -->
    <TopNavigation
      ref="topNavRef"
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
        <view class="section-header guide-recommend-header">
          <text class="section-title">为你推荐</text>
        </view>

        <!-- 骨架屏 -->
        <template v-if="showSkeleton">
          <SkeletonCard v-for="i in 3" :key="i" />
        </template>

        <!-- 虚拟列表 -->
        <VirtualList
          v-else
          :items="recommendationItems"
          :estimated-item-height="400"
          :buffer-size="3"
          :scroll-throttle="16"
          :container-height="virtualListHeight"
          @load-more="loadMore"
          @visible-range-change="handleVisibleRangeChange"
        >
          <template #default="{ item, index }">
            <view class="recommendation-item guide-user-card">
          <!-- 个性化推荐卡片 -->
          <RecommendationCard
            v-if="item.type === 'personalized'"
            :user="item.data.user"
            :index="index"
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
            :index="index"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />

          <!-- 附近的人卡片 -->
          <NearbyCard
            v-else-if="item.type === 'nearby'"
            :user="item.data.user"
            :distance="item.data.distance"
            :index="index"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />

          <!-- 话题卡片 -->
          <TopicCard
            v-else-if="item.type === 'topic'"
            :topic="item.data.topic"
            :index="index"
            @card-click="handleTopicClick"
            @view="handleTopicView"
            @join="handleTopicJoin"
          />

          <!-- 新用户卡片 -->
          <NewUserCard
            v-else-if="item.type === 'new'"
            :user="item.data.user"
            :join-days="item.data.joinDays"
            :index="index"
            @card-click="handleUserClick"
            @like="handleUserLike"
            @skip="handleUserSkip"
          />

          <!-- 底部提示 -->
          <view v-else-if="item.type === 'footer'" class="no-more">
            <text class="no-more-text">没有更多了</text>
          </view>
            </view>
          </template>
        </VirtualList>

        <!-- 加载状态 -->
        <view v-if="loading && recommendationItems.length > 0" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
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

    <!-- 新手引导 -->
    <GuideOverlay
      v-if="currentConfig"
      :visible="guideVisible"
      :steps="currentConfig.steps"
      :current-step-index="currentStepIndex"
      @update:visible="(val) => guideVisible = val"
      @update:current-step-index="(val) => currentStepIndex = val"
      @complete="completeGuide"
      @skip="skipGuide"
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
import VirtualList from '@/components/VirtualList.vue';
import NPSModal from '@/components/business/NPSModal.vue';
import CitySelector from '@/components/business/CitySelector.vue';
import GuideOverlay from '@/components/GuideOverlay.vue';
import { useNPS, NPSScene } from '@/composables/useNPS';
import { useGuide } from '@/composables/useGuide';
import { useRecommendation } from './home/composables/useRecommendation';
import { useInfiniteScroll } from './home/composables/useInfiniteScroll';
import { initImageLoader, cleanupImageLoader, getGlobalPerformanceMonitor } from '@/utils/imageLoader/index';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRE_TIME } from '@/utils/cache';
import { getBanners } from '@/api/home';
import type { Banner } from './home/components/BannerCarousel.vue';
import type { QuickAction } from './home/components/QuickActions.vue';
import type { GuideConfig } from '@/types/guide';

const authStore = useAuthStore();
const { npsVisible, npsTriggerType, npsTriggerScene, checkAndTrigger, closeNPS, onNPSSuccess } = useNPS();
const { visible: guideVisible, currentStepIndex, currentConfig, startGuide, completeGuide, skipGuide } = useGuide();

// 首页引导配置
const homeGuideConfig: GuideConfig = {
  id: 'home_guide',
  version: '1.0.0',
  showOnce: true,
  steps: [
    {
      target: '.guide-recommend-header',
      title: '推荐流',
      content: '这里是为你精心推荐的用户，基于MBTI性格匹配算法为你找到最合适的人',
      placement: 'bottom',
      highlightPadding: 10,
    },
    {
      target: '.guide-user-card',
      title: '用户卡片',
      content: '点击卡片查看用户详情，了解更多信息后可以选择关注或发送消息',
      placement: 'top',
      highlightPadding: 15,
    },
    {
      target: '.guide-search-box',
      title: '搜索功能',
      content: '点击这里可以搜索感兴趣的话题',
      placement: 'bottom',
      highlightPadding: 10,
    },
  ],
};

// 初始化图片加载器（副作用初始化，启动内存监控和性能统计）
// 注意：initImageLoader 现在是异步的，需要在 onMounted 中 await
let imageLoaderInitialized = false;

// 获取性能监控器
const performanceMonitor = getGlobalPerformanceMonitor();

// 组件引用
const topNavRef = ref();

// 计算虚拟列表容器高度
const virtualListHeight = computed(() => {
  // TopNavigation 高度约 88rpx，加上 padding 和其他元素
  // Banner 约 300rpx，QuickActions 约 200rpx，section-header 约 80rpx
  // 总共需要减去约 668rpx + 安全区域
  return 'calc(100vh - 700rpx)';
});

// 图片懒加载（已废弃，使用 LazyImage 组件替代）
// const { preloadImages } = useImageLazyLoad({
//   placeholder: 'https://via.placeholder.com/400',
// });

// 图片预加载策略（已废弃）
// const imagePreloadStrategy = new ImagePreloadStrategy();

// 推荐流
const {
  items: recommendationItems,
  loading,
  hasMore,
  fetchRecommendations,
  loadMore,
  refresh,
  trackAction,
  updateCity,
} = useRecommendation({ useMockData: false });

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
    if (response.code === 0 && response.data) {
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
  uni.navigateTo({ url: '/pages/search/topic' });
};

const handleMessageClick = () => {
  console.log('Message clicked');
  uni.navigateTo({ url: '/pages/chat/list' });
};

// 城市选择
const handleCitySelect = async (city: string) => {
  currentCity.value = city;

  // 保存到本地存储
  uni.setStorageSync('selectedCity', city);

  // 更新推荐流的城市筛选并刷新数据
  updateCity(city);
  await refresh(city);
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

// 可视区域变化处理（用于动态优先级调整）
const handleVisibleRangeChange = (startIndex: number, endIndex: number) => {
  console.log('[Home] Visible range changed:', startIndex, '-', endIndex);
  // 可视区域变化时，图片优先级已通过 index prop 自动调整
};

// 初始化
onMounted(async () => {
  // 清理旧的离线缓存数据（确保推荐卡片图片使用原始 URL）
  try {
    const cacheKeys = uni.getStorageInfoSync().keys || [];
    const imageCacheKeys = cacheKeys.filter(key => key.startsWith('img_cache_'));
    imageCacheKeys.forEach(key => {
      uni.removeStorageSync(key);
    });
    if (imageCacheKeys.length > 0) {
      console.log(`[Home] Cleared ${imageCacheKeys.length} offline image cache items`);
    }
  } catch (error) {
    console.warn('[Home] Failed to clear offline cache:', error);
  }

  // 初始化图片加载器（异步）
  if (!imageLoaderInitialized) {
    await initImageLoader({
      maxConcurrent: 3,
      maxCacheSize: 50,
      memoryThreshold: 30 * 1024 * 1024,
      enableMonitoring: true,
      enableOfflineCache: false  // 禁用离线缓存，推荐卡片图片使用原始 URL
    });
    imageLoaderInitialized = true;
  }

  // 获取保存的城市或使用默认值"全国"
  const savedCity = uni.getStorageSync('selectedCity');
  currentCity.value = savedCity || '全国';

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

  // 检查并触发NPS
  checkAndTrigger({
    scene: NPSScene.PERIODIC,
    delay: 3000,
  });

  // 启动首页引导（延迟1秒，确保页面渲染完成）
  setTimeout(() => {
    startGuide(homeGuideConfig);
  }, 1000);

  // 定期清理过期缓存
  cleanupTimer = setInterval(() => {
    CacheManager.clearAllExpired();
  }, 10 * 60 * 1000) as unknown as number;

  // 定期上报性能数据（每5分钟）
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    console.log('[Performance] Metrics:', performanceMonitor.generateReport());
    // TODO: 上报到后端
    // performanceMonitor.report('https://api.example.com/metrics');
  }, 5 * 60 * 1000);
});

// 组件卸载时清理定时器和图片加载器
onUnmounted(() => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  // 清理图片加载器资源
  cleanupImageLoader();
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
