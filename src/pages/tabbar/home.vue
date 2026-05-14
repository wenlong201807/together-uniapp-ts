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

    <!-- 顶部导航占位（fixed导航不在文档流中，需要占位避免内容被遮挡） -->
    <view class="nav-placeholder" />

    <!-- 滚动容器 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @refresherrestore="handleRefresherRestore"
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
import { initImageLoader, cleanupImageLoader } from '@/utils/imageLoader/index';
import { CacheManager, CACHE_KEYS, CACHE_EXPIRE_TIME } from '@/utils/cache';
import { getBanners } from '@/api/home';
import type { Banner } from './home/components/BannerCarousel.vue';
import type { QuickAction } from './home/components/QuickActions.vue';
import type { GuideConfig } from '@/types/guide';
import { isTopicItem } from './home/types/recommendation';
import type { RecommendationItem, RecommendationType } from './home/types/recommendation';

const { npsVisible, npsTriggerType, npsTriggerScene, checkAndTrigger, closeNPS, onNPSSuccess } = useNPS();
const { visible: guideVisible, currentStepIndex, currentConfig, startGuide, completeGuide, skipGuide } = useGuide();

// 首页横向分区
const {
  sections: homeSections,
  sectionLoading: homeSectionLoading,
  fetchAllSections,
  refresh: refreshSections,
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

// 初始化图片加载器（模块级标志，组件卸载时重置以便重新挂载时可以重新初始化）
let imageLoaderInitialized = false;

// 组件引用（预留）
// const topNavRef = ref();

// 刷新状态
const refreshing = ref(false);

// 是否正在加载数据（防止重复加载，含初始加载和下拉刷新）
const isLoadingData = ref(false);

// 当前城市（直接从缓存读取，避免 '定位中...' 闪烁）
const currentCity = ref(uni.getStorageSync('selectedCity') || '全国');

// 城市选择弹窗
const showCitySelector = ref(false);

// 未读消息数
// TODO: 接入消息 WebSocket 或轮询更新未读数
const unreadCount = ref(0);

// Banner数据
const banners = ref<Banner[]>([]);

let cleanupTimer: number | null = null;

// 快速入口（静态配置，无需响应式）
const quickActions: QuickAction[] = [
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
];

// 加载 Banner
const loadBanners = async (forceRefresh = false) => {
  try {
    // 先从缓存读取（非强制刷新时）
    if (!forceRefresh) {
      const memoryCache = CacheManager.getMemoryCache();
      const cachedBanners = memoryCache.get<Banner[]>(CACHE_KEYS.BANNERS);
      if (cachedBanners && cachedBanners.length > 0) {
        banners.value = cachedBanners;
        return;
      }
    }

    // 缓存未命中或强制刷新，调用API
    const response = await getBanners();
    if (response.code === 0 && response.data && response.data.length > 0) {
      banners.value = response.data;
      // 缓存数据
      const memoryCache = CacheManager.getMemoryCache();
      memoryCache.set(CACHE_KEYS.BANNERS, response.data, CACHE_EXPIRE_TIME.BANNERS);
    }
  } catch (error) {
    console.error('Load banners error:', error);
  }
};

// 顶部导航事件
const handleLocationClick = () => {
  showCitySelector.value = true;
};

const handleSearchClick = () => {
  uni.navigateTo({ url: '/pages/search/topic' });
};

const handleMessageClick = () => {
  uni.navigateTo({ url: '/pages/chat/list' });
};

// 城市选择
const handleCitySelect = async (city: string) => {
  currentCity.value = city;
  uni.setStorageSync('selectedCity', city);
  // refreshSections(city) 内部已包含 updateCity 逻辑，无需重复调用
  await refreshSections(city);
};

// Banner事件
const handleBannerClick = (_banner: Banner) => {
  // TODO: 根据 banner 配置跳转到对应页面
};

// 快速入口事件
const handleActionClick = (action: QuickAction) => {
  action.handler?.();
};

// 横向分区 "查看更多" 事件
const handleSectionMore = (type: RecommendationType) => {
  uni.navigateTo({
    url: `/pages/recommend/list?type=${type}`,
  });
};

// 横向分区卡片点击事件
const handleSectionItemClick = (item: RecommendationItem) => {
  if (isTopicItem(item)) {
    const topicData = item.data.topic;
    if (topicData) {
      uni.navigateTo({ url: `/pages/square/topic?id=${topicData.id}` });
    }
  } else if ('user' in item.data) {
    const userData = item.data.user;
    if (userData) {
      uni.navigateTo({ url: `/pages/user/detail?id=${userData.id}` });
    }
  }
};

// 滚动复位事件
const handleRefresherRestore = () => {
  refreshing.value = false;
};

// 刷新
const handleRefresh = async () => {
  if (isLoadingData.value) return;
  isLoadingData.value = true;
  try {
    refreshing.value = true;
    await Promise.all([
      loadBanners(true),
      refreshSections(),
    ]);
    CacheManager.clearAllExpired();
  } catch (error) {
    // 静默处理刷新失败，避免控制台输出
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 2000,
    });
  } finally {
    refreshing.value = false;
    isLoadingData.value = false;
  }
};

// 初始化
onMounted(async () => {
  // 防止初始加载与下拉刷新并发竞争
  if (isLoadingData.value) return;
  isLoadingData.value = true;

  try {
    // 清理旧的离线缓存数据
    try {
      const cacheKeys = uni.getStorageInfoSync().keys || [];
      const imageCacheKeys = cacheKeys.filter(key => key.startsWith('img_cache_'));
      imageCacheKeys.forEach(key => {
        uni.removeStorageSync(key);
      });
    } catch {
      // 缓存清理失败不影响主流程
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

    // 并行加载数据
    await Promise.allSettled([
      loadBanners(),
      fetchAllSections(),
    ]);

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
  } finally {
    isLoadingData.value = false;
  }
});

// 组件卸载时清理定时器和图片加载器
onUnmounted(() => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  cleanupImageLoader();
  // 重置模块级标志，确保组件重新挂载时可以重新初始化图片加载器
  imageLoaderInitialized = false;
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.home-container {
  min-height: 100vh;
  background: $bg-secondary;
  display: flex;
  flex-direction: column;

  // 占位：为 fixed 导航留出空间，确保 scroll-container 不被遮挡
  .nav-placeholder {
    height: calc(88rpx + 32rpx); // 导航高度 + 呼吸空间
    flex-shrink: 0;
  }

  .scroll-container {
    flex: 1;
    // scroll-view 需要显式固定高度，这里用 100vh 减去导航占位和底部 tabbar
    // nav-placeholder: 88rpx + 32rpx = 120rpx, tabbar: 120rpx
    height: calc(100vh - 120rpx - 120rpx);
    padding: 0 $padding-lg $padding-lg;
    box-sizing: border-box;

    .recommendation-sections {
      margin-top: $margin-md;
    }
  }
}
</style>
