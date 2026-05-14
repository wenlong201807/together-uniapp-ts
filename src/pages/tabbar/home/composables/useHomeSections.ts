import { ref, reactive } from 'vue';
import { getRecommendationFeed } from '@/api/home';
import type { RecommendationItem, RecommendationType } from '../types/recommendation';

interface SectionConfig {
  type: RecommendationType;
  title: string;
  icon: string;
}

const SECTION_CONFIGS: SectionConfig[] = [
  { type: 'personalized', title: '为你推荐', icon: '✨' },
  { type: 'hot', title: '热门用户', icon: '🔥' },
  { type: 'nearby', title: '附近的人', icon: '📍' },
  { type: 'topic', title: '热门话题', icon: '💬' },
  { type: 'new', title: '新人推荐', icon: '🌟' },
];

export type { SectionConfig };
export { SECTION_CONFIGS };

export function useHomeSections(options?: { city?: string }) {
  const loading = ref(false);
  const currentCity = ref(options?.city || '全国');
  const initialized = ref(false); // 标记是否已完成首次加载

  // Each section holds up to 5 items
  const sections = reactive<Record<string, RecommendationItem[]>>({
    personalized: [],
    hot: [],
    nearby: [],
    topic: [],
    new: [],
  });

  const sectionLoading = reactive<Record<string, boolean>>({
    personalized: false,
    hot: false,
    nearby: false,
    topic: false,
    new: false,
  });

  /**
   * Fetch items for a single type
   */
  const fetchSection = async (type: RecommendationType) => {
    sectionLoading[type] = true;
    try {
      const response = await getRecommendationFeed({
        page: 1,
        pageSize: 5,
        types: [type],
        city: currentCity.value !== '全国' ? currentCity.value : undefined,
      });

      if (response.code === 0 && response.data) {
        const sectionData = response.data.data;
        if (Array.isArray(sectionData) && sectionData.length > 0) {
          sections[type] = sectionData.slice(0, 5);
        } else {
          throw new Error('Empty section data');
        }
      } else {
        throw new Error(response.message || 'Failed to fetch section data');
      }
    } catch (error) {
      console.error(`[useHomeSections] Fetch section "${type}" failed:`, error);
      // Fallback to mock data
      sections[type] = generateMockSectionData(type, 5);
    } finally {
      sectionLoading[type] = false;
    }
  };

  /**
   * Fetch all sections in parallel
   */
  const fetchAllSections = async (force = false) => {
    // 如果已经初始化且非强制刷新，则不再重复加载
    if (initialized.value && !force) {
      return;
    }
    loading.value = true;
    try {
      await Promise.allSettled(
        SECTION_CONFIGS.map((config) => fetchSection(config.type))
      );
      initialized.value = true;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refresh all sections (e.g., on city change or pull-down refresh)
   */
  const refresh = async (city?: string) => {
    if (city !== undefined) {
      currentCity.value = city;
    }
    // 强制刷新，重置初始化状态
    initialized.value = false;
    await fetchAllSections(true);
  };

  /**
   * Update city filter (kept for external consumers)
   */
  const updateCity = (city: string) => {
    currentCity.value = city;
  };

  return {
    sections,
    sectionLoading,
    loading,
    currentCity,
    fetchAllSections,
    refresh,
    SECTION_CONFIGS,
  };
}

// --- Mock Data Generation ---

function generateMockSectionData(type: RecommendationType, count: number): RecommendationItem[] {
  const result: RecommendationItem[] = [];

  for (let i = 0; i < count; i++) {
    const baseUser = {
      id: Math.floor(Math.random() * 10000),
      nickname: `用户${Math.floor(Math.random() * 1000)}`,
      avatar: `https://picsum.photos/200?random=${Date.now()}-${i}`,
      age: 20 + Math.floor(Math.random() * 15),
      city: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)],
      bio: '这是一段个人简介',
      tags: ['旅行', '美食', '摄影', '音乐', '运动'].slice(0, 2 + Math.floor(Math.random() * 2)),
      photos: [],
    };

    let data: any;
    switch (type) {
      case 'hot':
        data = {
          type: 'hot',
          user: baseUser,
          hotScore: {
            likes: Math.floor(Math.random() * 10000),
            comments: Math.floor(Math.random() * 1000),
            favorites: Math.floor(Math.random() * 5000),
          },
        };
        break;
      case 'nearby':
        data = {
          type: 'nearby',
          user: baseUser,
          distance: `${(Math.random() * 10).toFixed(1)}km`,
        };
        break;
      case 'topic':
        data = {
          type: 'topic',
          topic: {
            id: Math.floor(Math.random() * 1000),
            name: `话题${Math.floor(Math.random() * 100)}`,
            description: '这是一个有趣的话题',
            participantCount: Math.floor(Math.random() * 50000),
            postCount: Math.floor(Math.random() * 100000),
            coverImages: [`https://picsum.photos/400?random=${Date.now()}-${i}`],
          },
        };
        break;
      case 'new':
        data = {
          type: 'new',
          user: baseUser,
          joinDays: Math.floor(Math.random() * 7) + 1,
        };
        break;
      default:
        data = { type: 'personalized', user: baseUser };
    }

    result.push({
      id: `${type}-${Date.now()}-${i}`,
      type,
      data,
    });
  }

  return result;
}
