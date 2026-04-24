/**
 * 虚拟滚动 Composable
 * 只渲染可视区域的内容，提升大列表性能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export interface VirtualScrollOptions {
  itemHeight: number; // 每项高度（固定高度）
  bufferSize?: number; // 缓冲区大小（上下额外渲染的项数）
  containerHeight?: number; // 容器高度
}

export function useVirtualScroll<T>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
) {
  const { itemHeight, bufferSize = 3, containerHeight = 0 } = options;

  const scrollTop = ref(0);
  const actualContainerHeight = ref(containerHeight);

  // 计算可视区域的起始和结束索引
  const visibleRange = computed(() => {
    const height = actualContainerHeight.value || 800; // 默认高度
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize);
    const endIndex = Math.min(
      items.value.length,
      Math.ceil((scrollTop.value + height) / itemHeight) + bufferSize
    );

    return { startIndex, endIndex };
  });

  // 可视区域的数据
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value;
    return items.value.slice(startIndex, endIndex).map((item, index) => ({
      data: item,
      index: startIndex + index,
    }));
  });

  // 总高度
  const totalHeight = computed(() => items.value.length * itemHeight);

  // 偏移量
  const offsetY = computed(() => visibleRange.value.startIndex * itemHeight);

  // 滚动事件处理
  const handleScroll = (e: any) => {
    const detail = e.detail || e.target;
    if (!detail) return;
    scrollTop.value = detail.scrollTop || 0;
  };

  // 获取容器高度
  onMounted(() => {
    // 延迟查询，确保 DOM 已渲染
    setTimeout(() => {
      const query = uni.createSelectorQuery();
      query.select('.virtual-scroll-container').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          actualContainerHeight.value = res[0].height;
        }
      });
    }, 100);
  });

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
}

/**
 * 动态高度虚拟滚动
 * 支持不同高度的列表项
 */
export interface DynamicVirtualScrollOptions {
  estimatedItemHeight: number; // 预估项高度
  bufferSize?: number;
  containerHeight?: number;
}

export function useDynamicVirtualScroll<T>(
  items: Ref<T[]>,
  options: DynamicVirtualScrollOptions
) {
  const { estimatedItemHeight, bufferSize = 3, containerHeight = 0 } = options;

  const scrollTop = ref(0);
  const actualContainerHeight = ref(containerHeight);
  const itemHeights = ref<Map<number, number>>(new Map());
  const itemOffsets = ref<Map<number, number>>(new Map());

  // 更新项高度
  const updateItemHeight = (index: number, height: number) => {
    itemHeights.value.set(index, height);
    recalculateOffsets();
  };

  // 重新计算偏移量
  const recalculateOffsets = () => {
    let offset = 0;
    const newOffsets = new Map<number, number>();

    for (let i = 0; i < items.value.length; i++) {
      newOffsets.set(i, offset);
      const height = itemHeights.value.get(i) || estimatedItemHeight;
      offset += height;
    }

    itemOffsets.value = newOffsets;
  };

  // 根据滚动位置查找起始索引
  const findStartIndex = (scrollTop: number): number => {
    let left = 0;
    let right = items.value.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const offset = itemOffsets.value.get(mid) || mid * estimatedItemHeight;

      if (offset < scrollTop) {
        left = mid + 1;
      } else if (offset > scrollTop) {
        right = mid - 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, right);
  };

  // 可视区域范围
  const visibleRange = computed(() => {
    const height = actualContainerHeight.value || 800;
    const startIndex = Math.max(0, findStartIndex(scrollTop.value) - bufferSize);

    let endIndex = startIndex;
    let accumulatedHeight = 0;

    while (endIndex < items.value.length && accumulatedHeight < height + bufferSize * estimatedItemHeight) {
      const itemHeight = itemHeights.value.get(endIndex) || estimatedItemHeight;
      accumulatedHeight += itemHeight;
      endIndex++;
    }

    return { startIndex, endIndex: Math.min(endIndex, items.value.length) };
  });

  // 可视区域数据
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value;
    return items.value.slice(startIndex, endIndex).map((item, index) => ({
      data: item,
      index: startIndex + index,
    }));
  });

  // 总高度
  const totalHeight = computed(() => {
    const lastIndex = items.value.length - 1;
    const lastOffset = itemOffsets.value.get(lastIndex) || lastIndex * estimatedItemHeight;
    const lastHeight = itemHeights.value.get(lastIndex) || estimatedItemHeight;
    return lastOffset + lastHeight;
  });

  // 偏移量
  const offsetY = computed(() => {
    return itemOffsets.value.get(visibleRange.value.startIndex) || 0;
  });

  // 滚动事件处理
  const handleScroll = (e: any) => {
    const detail = e.detail || e.target;
    if (!detail) return;
    scrollTop.value = detail.scrollTop || 0;
  };

  // 获取容器高度
  onMounted(() => {
    // 延迟查询，确保 DOM 已渲染
    setTimeout(() => {
      const query = uni.createSelectorQuery();
      query.select('.virtual-scroll-container').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          actualContainerHeight.value = res[0].height;
        }
      });
    }, 100);
  });

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
    updateItemHeight,
  };
}

/**
 * 虚拟滚动组件辅助函数
 */
export function createVirtualScrollHelpers() {
  /**
   * 测量元素高度
   */
  const measureItemHeight = (selector: string, callback: (height: number) => void) => {
    const query = uni.createSelectorQuery();
    query.select(selector).boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        callback(res[0].height);
      }
    });
  };

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index: number, itemHeight: number, animated: boolean = true) => {
    const scrollTop = index * itemHeight;
    uni.pageScrollTo({
      scrollTop,
      duration: animated ? 300 : 0,
    });
  };

  return {
    measureItemHeight,
    scrollToIndex,
  };
}
