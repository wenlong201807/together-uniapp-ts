import { ref } from 'vue';
import { getRecommendationFeed, trackUserAction } from '@/api/home';
import type { RecommendationItem as ApiRecommendationItem } from '@/api/home';
import type { RecommendationItem, RecommendationType, UserData, TopicData } from '../types/recommendation';

export type { RecommendationType, RecommendationItem };

export interface UseRecommendationOptions {
  pageSize?: number;
  types?: RecommendationType[];
  useMockData?: boolean; // 是否使用模拟数据
}

export function useRecommendation(options: UseRecommendationOptions = {}) {
  const { pageSize = 20, types = ['personalized', 'hot', 'nearby', 'topic', 'new'], useMockData = true } = options;

  const items = ref<RecommendationItem[]>([]);
  const loading = ref(false);
  const currentPage = ref(1);
  const hasMore = ref(true);
  const cursor = ref<string | undefined>(undefined);

  // 推荐比例配置
  const typeRatios = {
    personalized: 0.4,
    hot: 0.2,
    nearby: 0.15,
    topic: 0.15,
    new: 0.1,
  };

  const fetchRecommendations = async (page: number = 1) => {
    loading.value = true;
    try {
      let newItems: RecommendationItem[] = [];

      if (useMockData) {
        // 使用模拟数据
        console.log('[useRecommendation] 使用Mock数据');
        newItems = generateMockData(pageSize);
        hasMore.value = newItems.length === pageSize;
      } else {
        // 调用后端API
        console.log('[useRecommendation] 调用真实API:', {
          page,
          pageSize,
          types,
          cursor: page > 1 ? cursor.value : undefined,
        });

        const response = await getRecommendationFeed({
          page,
          pageSize,
          types,
          cursor: page > 1 ? cursor.value : undefined,
        });

        console.log('[useRecommendation] API响应:', response);

        if (response.code === 0 && response.data) {
          newItems = response.data.data;
          hasMore.value = response.data.hasMore;
          cursor.value = response.data.nextCursor;
          console.log('[useRecommendation] 成功获取数据，数量:', newItems.length);
        } else {
          console.error('[useRecommendation] API返回错误:', response);
          throw new Error(response.message || 'Failed to fetch recommendations');
        }
      }

      if (page === 1) {
        items.value = newItems;
      } else {
        items.value = [...items.value, ...newItems];
      }

      currentPage.value = page;
    } catch (error) {
      console.error('[useRecommendation] 获取推荐数据失败:', error);
      // 降级到模拟数据
      if (!useMockData) {
        console.log('[useRecommendation] 降级到Mock数据');
        const mockData = generateMockData(pageSize);
        if (page === 1) {
          items.value = mockData;
        } else {
          items.value = [...items.value, ...mockData];
        }
        hasMore.value = mockData.length === pageSize;
      }
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (!hasMore.value || loading.value) return;
    await fetchRecommendations(currentPage.value + 1);
  };

  const refresh = async () => {
    currentPage.value = 1;
    hasMore.value = true;
    cursor.value = undefined;
    await fetchRecommendations(1);
  };

  /**
   * 上报用户行为
   */
  const trackAction = async (
    action: 'view' | 'like' | 'skip' | 'share' | 'comment' | 'favorite',
    targetType: 'user' | 'post' | 'topic',
    targetId: number
  ) => {
    if (useMockData) {
      console.log('Mock track action:', { action, targetType, targetId });
      return;
    }

    try {
      await trackUserAction({
        action,
        targetType,
        targetId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Track action error:', error);
    }
  };

  // 生成模拟数据
  const generateMockData = (count: number): RecommendationItem[] => {
    const result: RecommendationItem[] = [];
    const typeList = Object.keys(typeRatios) as RecommendationType[];

    for (let i = 0; i < count; i++) {
      const type = typeList[Math.floor(Math.random() * typeList.length)];
      result.push({
        id: `${type}-${Date.now()}-${i}`,
        type,
        data: generateMockItemData(type),
      });
    }

    // 随机打乱
    return result.sort(() => Math.random() - 0.5);
  };

  const generateMockItemData = (type: RecommendationType): RecommendationItem['data'] => {
    const baseUser: UserData = {
      id: Math.floor(Math.random() * 10000),
      nickname: `用户${Math.floor(Math.random() * 1000)}`,
      avatar: `https://picsum.photos/200?random=${Math.random()}`,
      age: 20 + Math.floor(Math.random() * 15),
      city: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)],
      bio: '这是一段个人简介，介绍自己的兴趣爱好和生活态度。',
      tags: ['旅行', '美食', '摄影', '音乐', '运动'].slice(0, 3),
      photos: Array(3).fill(0).map(() => `https://picsum.photos/400?random=${Math.random()}`),
    };

    switch (type) {
      case 'hot':
        return {
          type: 'hot',
          user: baseUser,
          hotScore: {
            likes: Math.floor(Math.random() * 10000),
            comments: Math.floor(Math.random() * 1000),
            favorites: Math.floor(Math.random() * 5000),
          },
        };
      case 'nearby':
        return {
          type: 'nearby',
          user: baseUser,
          distance: `${(Math.random() * 10).toFixed(1)}km`,
        };
      case 'topic':
        return {
          type: 'topic',
          topic: {
            id: Math.floor(Math.random() * 1000),
            title: `话题${Math.floor(Math.random() * 100)}`,
            description: '这是一个有趣的话题，欢迎大家参与讨论。',
            participantCount: Math.floor(Math.random() * 50000),
            postCount: Math.floor(Math.random() * 100000),
            coverImages: Array(3).fill(0).map(() => `https://picsum.photos/400?random=${Math.random()}`),
          },
        };
      case 'new':
        return {
          type: 'new',
          user: baseUser,
          joinDays: Math.floor(Math.random() * 7) + 1,
        };
      default:
        return { type: 'personalized', user: baseUser };
    }
  };

  return {
    items,
    loading,
    hasMore,
    currentPage,
    fetchRecommendations,
    loadMore,
    refresh,
    trackAction,
  };
}
