/**
 * 话题相关配置常量
 */
export const TOPIC_CONFIG = {
  // 分页配置
  PAGE_SIZE: 10,
  HOT_TOPICS_LIMIT: 10,
  MY_TOPICS_LIMIT: 10,

  // 搜索配置
  SEARCH_DEBOUNCE: 500, // 搜索防抖延迟（毫秒）
  MAX_SEARCH_HISTORY: 10, // 最多保存的搜索历史数量

  // 存储键名
  STORAGE_KEYS: {
    SEARCH_HISTORY: 'topic_search_history',
    SHOULD_REFRESH: 'shouldRefreshTopicList',
  },
} as const;
