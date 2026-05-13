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
    >
      <!-- 快速入口 -->
      <QuickActions
        :actions="quickActions"
        @action-click="handleActionClick"
      />

      <!-- Banner轮播 -->
      <BannerCarousel
        :banners="banners"
        @banner-click="handleBannerClick"
      />

      <!-- 横向推荐分区 -->
      <view class="recommendation-sections">
        <HorizontalSection
          v-for="section in SECTION_CONFIGS"
          :key="section.type"
          :title="section.title"
          :icon="section.icon"
          :type="section.type"
          :items="homeSections[section.type]"
          :loading="homeSectionLoading[section.type]"
          @more="handleSectionMore"
          @item-click="handleSectionItemClick"
        />
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
import { ref, onMounted, onUnmounted } from 'vue';
import TopNavigation from './home/components/TopNavigation.vue';
import BannerCarousel from './home/components/BannerCarousel.vue';
import QuickActions from './home/components/QuickActions.vue';
import HorizontalSection from './home/components/HorizontalSection.vue';
import NPSModal from '@/components/business/NPSModal.vue';
import CitySelector from '@/components/business/CitySelector.vue';
import GuideOverlay from '@/components/GuideOverlay.vue';
import { useNPS, NPSScene } from '@/composables/useNPS';
import { useGuide } from '@/composables/useGuide';
import { useHomeSections, SECTION_CONFIGS } from './home/composables/useHomeSections';
import { initImageLoader, cleanupImageLoader, getGlobalPerformanceMonitor } from '@/utils/imageLoader/index';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRE_TIME } from '@/utils/cache';
import { getBanners } from '@/api/home';
import type { Banner } from './home/components/BannerCarousel.vue';
import type { QuickAction } from './home/components/QuickActions.vue';
import type { GuideConfig } from '@/types/guide';
import type { RecommendationItem, RecommendationType } from './home/types/recommendation';

const { npsVisible, npsTriggerType, npsTriggerScene, checkAndTrigger, closeNPS, onNPSSuccess } = useNPS();
const { visible: guideVisible, currentStepIndex, currentConfig, startGuide, completeGuide, skipGuide } = useGuide();

// 首页横向分区
const {
  sections: homeSections,
  sectionLoading: homeSectionLoading,
  fetchAllSections,
  refresh: refreshSections,
  updateCity: updateSectionsCity,
} = useHomeSections();

// 首页引导配置
const homeGuideConfig: GuideConfig = {
  id: 'home_guide',
  version: '1.0.0',
  showOnce: true,
  steps: [
    {
      target: '.recommendation-sections',
      title: '推荐分区',
      content: '左右滑动可以浏览各类推荐用户和话题，点击更多查看完整列表',
      placement: 'bottom',
      highlightPadding: 10,
    },
    {
      target: '.horizontal-section',
      title: '推荐卡片',
      content: '点击卡片查看用户或话题详情，点击更多可以查看完整列表',
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
let imageLoaderInitialized = false;

// 获取性能监控器
const performanceMonitor = getGlobalPerformanceMonitor();

// 组件引用
const topNavRef = ref();

// 刷新状态
const refreshing = ref(false);

// 当前城市
const currentCity = ref('定位中...');

// 城市选择弹窗
const showCitySelector = ref(false);

// 未读消息数
const unreadCount = ref(0);

// Banner数据
const banners = ref<Banner[]>([]);

let cleanupTimer: number | null = null;
let perfTimer: number | null = null;

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

    if (cachedBanners && cachedBanners.length > 0) {
      banners.value = cachedBanners;
      return;
    }

    // 缓存未命中，调用API
    const response = await getBanners();
    if (response.code === 0 && response.data && response.data.length > 0) {
      banners.value = response.data;
      // 缓存数据
      memoryCache.set(CACHE_KEYS.BANNERS, response.data, CACHE_EXPIRE_TIME.BANNERS);
    }
  } catch (error) {
    console.error('Load banners error:', error);
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
  uni.setStorageSync('selectedCity', city);
  updateSectionsCity(city);
  await refreshSections(city);
};

// Banner事件
const handleBannerClick = (banner: Banner) => {
  console.log('Banner clicked:', banner);
};

// 快速入口事件
const handleActionClick = (action: QuickAction) => {
  console.log('Action clicked:', action);
};

// 横向分区 "查看更多" 事件
const handleSectionMore = (type: RecommendationType) => {
  console.log('Section more:', type);
  uni.navigateTo({
    url: `/pages/recommend/list?type=${type}`,
  });
};

// 横向分区卡片点击事件
const handleSectionItemClick = (item: RecommendationItem) => {
  console.log('Section item clicked:', item);
  if (item.type === 'topic') {
    const topicData = (item.data as any).topic;
    if (topicData) {
      uni.navigateTo({ url: `/pages/square/topic?id=${topicData.id}` });
    }
  } else {
    const userData = (item.data as any).user;
    if (userData) {
      uni.navigateTo({ url: `/pages/user/detail?id=${userData.id}` });
    }
  }
};

// 刷新
const handleRefresh = async () => {
  try {
    refreshing.value = true;
    await Promise.all([
      loadBanners(),
      refreshSections(),
    ]);
    CacheManager.clearAllExpired();
  } catch (error) {
    console.error('[Home] Refresh failed:', error);
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 2000,
    });
  } finally {
    setTimeout(() => {
      refreshing.value = false;
    }, 300);
  }
};

// 初始化
onMounted(async () => {
  // 清理旧的离线缓存数据
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
      enableOfflineCache: false,
    });
    imageLoaderInitialized = true;
  }

  // 获取保存的城市或使用默认值"全国"
  const savedCity = uni.getStorageSync('selectedCity');
  currentCity.value = savedCity || '全国';

  // 并行加载数据
  const results = await Promise.allSettled([
    loadBanners(),
    fetchAllSections(),
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

  // 启动首页引导
  setTimeout(() => {
    startGuide(homeGuideConfig);
  }, 1000);

  // 定期清理过期缓存
  cleanupTimer = setInterval(() => {
    CacheManager.clearAllExpired();
  }, 10 * 60 * 1000) as unknown as number;

  // 定期上报性能数据（每5分钟）
  perfTimer = setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    console.log('[Performance] Metrics:', performanceMonitor.generateReport());
  }, 5 * 60 * 1000);
});

// 组件卸载时清理定时器和图片加载器
onUnmounted(() => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  if (perfTimer) {
    clearInterval(perfTimer);
    perfTimer = null;
  }
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
    padding: 0 $padding-lg $padding-lg;
    padding-top: calc(88rpx + 32rpx); // 顶部导航高度 + 32rpx 呼吸空间
    box-sizing: border-box;

    .recommendation-sections {
      margin-top: $margin-md;
    }
  }
}
</style>
