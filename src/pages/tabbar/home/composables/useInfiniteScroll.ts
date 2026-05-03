import { ref, onMounted, onUnmounted } from 'vue';

export interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  threshold?: number;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const { onLoadMore, onRefresh, threshold = 100 } = options;

  const loading = ref(false);
  const refreshing = ref(false);
  const hasMore = ref(true);
  const scrollTop = ref(0);

  const handleScroll = async (e: any) => {
    const { scrollTop: top, scrollHeight, clientHeight } = e.detail || e.target;
    scrollTop.value = top;

    if (loading.value || !hasMore.value) return;

    const distanceToBottom = scrollHeight - (top + clientHeight);
    if (distanceToBottom < threshold) {
      await loadMore();
    }
  };

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      loading.value = false;
    }
  };

  const refresh = async () => {
    if (refreshing.value || !onRefresh) return;

    refreshing.value = true;
    hasMore.value = true;
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
      // 确保即使出错也要结束刷新状态
    } finally {
      // 使用 setTimeout 确保刷新动画有足够时间显示
      setTimeout(() => {
        refreshing.value = false;
      }, 300);
    }
  };

  const setHasMore = (value: boolean) => {
    hasMore.value = value;
  };

  return {
    loading,
    refreshing,
    hasMore,
    scrollTop,
    handleScroll,
    loadMore,
    refresh,
    setHasMore,
  };
}
