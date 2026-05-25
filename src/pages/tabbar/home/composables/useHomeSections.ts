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
          // 防御性过滤：API 可能返回混合类型，只保留当前 section 类型的项
          sections[type] = sectionData.filter(item => item.type === type).slice(0, 5) as RecommendationItem[];
        } else {
          // 合法的空数据，不触发 mock 降级
          sections[type] = [];
        }
      } else {
        throw new Error(response.message || 'Failed to fetch section data');
      }
    } catch (error) {
      console.error(`[useHomeSections] Fetch section "${type}" failed:`, error);
      // API 失败时清空数据，显示空状态，不使用 mock 数据欺骗用户
      sections[type] = [];
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
