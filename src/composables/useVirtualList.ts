import { ref, computed, onMounted, onUnmounted, nextTick, watch, type Ref } from 'vue'

export interface VirtualListOptions {
  // 预估的列表项高度
  estimatedItemHeight: number
  // 缓冲区大小（上下各缓冲几个item）
  bufferSize?: number
  // 滚动节流时间（ms）
  scrollThrottle?: number
}

export interface VirtualListItem {
  id: string | number
  height?: number
  top?: number
}

export function useVirtualList<T extends { id: string | number }>(
  items: Ref<T[]>,
  options: VirtualListOptions
) {
  const {
    estimatedItemHeight,
    bufferSize = 3,
    scrollThrottle = 16
  } = options

  // 滚动容器引用
  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  // 高度缓存
  const itemHeights = ref<Map<string | number, number>>(new Map())
  const itemTops = ref<Map<string | number, number>>(new Map())

  // 总高度
  const totalHeight = ref(0)

  // 滚动节流定时器
  let scrollTimer: number | null = null

  // RAF标记
  let rafId: number | null = null

  /**
   * 计算每个item的top位置
   */
  const calculateItemPositions = () => {
    let top = 0
    const newTops = new Map<string | number, number>()

    items.value.forEach((item) => {
      newTops.set(item.id, top)
      const height = itemHeights.value.get(item.id) || estimatedItemHeight
      top += height
    })

    itemTops.value = newTops
    totalHeight.value = top
  }

  /**
   * 获取item的高度
   */
  const getItemHeight = (itemId: string | number): number => {
    return itemHeights.value.get(itemId) || estimatedItemHeight
  }

  /**
   * 设置item的高度
   */
  const setItemHeight = (itemId: string | number, height: number) => {
    const oldHeight = itemHeights.value.get(itemId)
    if (oldHeight !== height) {
      itemHeights.value.set(itemId, height)
      calculateItemPositions()
    }
  }

  /**
   * 二分查找：根据scrollTop找到起始索引
   */
  const findStartIndex = (scrollTop: number): number => {
    let left = 0
    let right = items.value.length - 1
    let result = 0

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midTop = itemTops.value.get(items.value[mid].id) || 0

      if (midTop < scrollTop) {
        result = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    return result
  }

  /**
   * 计算可视区域的起始和结束索引
   */
  const visibleRange = computed(() => {
    const start = scrollTop.value
    const end = start + viewportHeight.value

    // 找到起始索引
    let startIndex = findStartIndex(start)

    // 向前扩展缓冲区
    startIndex = Math.max(0, startIndex - bufferSize)

    // 找到结束索引
    let endIndex = startIndex
    let currentTop = itemTops.value.get(items.value[startIndex]?.id) || 0

    while (endIndex < items.value.length && currentTop < end) {
      currentTop += getItemHeight(items.value[endIndex].id)
      endIndex++
    }

    // 向后扩展缓冲区
    endIndex = Math.min(items.value.length, endIndex + bufferSize)

    return {
      startIndex,
      endIndex,
      visibleItems: items.value.slice(startIndex, endIndex).map((item, idx) => ({
        ...item,
        _index: startIndex + idx
      }))
    }
  })

  /**
   * 顶部占位高度
   */
  const topPlaceholderHeight = computed(() => {
    const { startIndex } = visibleRange.value
    if (startIndex === 0) return 0
    return itemTops.value.get(items.value[startIndex].id) || 0
  })

  /**
   * 底部占位高度
   */
  const bottomPlaceholderHeight = computed(() => {
    const { endIndex } = visibleRange.value
    if (endIndex >= items.value.length) return 0

    const lastVisibleTop = itemTops.value.get(items.value[endIndex - 1]?.id) || 0
    const lastVisibleHeight = getItemHeight(items.value[endIndex - 1]?.id)

    return totalHeight.value - (lastVisibleTop + lastVisibleHeight)
  })

  /**
   * 处理滚动事件
   */
  const handleScroll = (event: any) => {
    // 节流处理
    if (scrollTimer) return

    scrollTimer = setTimeout(() => {
      scrollTimer = null
    }, scrollThrottle) as unknown as number

    // 使用RAF优化
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      const detail = event.detail || event
      scrollTop.value = detail.scrollTop || 0
      rafId = null
    })
  }

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index: number, animated = true) => {
    if (index < 0 || index >= items.value.length) return

    const targetTop = itemTops.value.get(items.value[index].id) || 0
    scrollTop.value = targetTop

    // 触发实际滚动（需要在组件中实现）
    return targetTop
  }

  /**
   * 滚动到顶部
   */
  const scrollToTop = (animated = true) => {
    scrollToIndex(0, animated)
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = (animated = true) => {
    scrollToIndex(items.value.length - 1, animated)
  }

  /**
   * 重新计算所有位置（数据变化时调用）
   */
  const recalculate = async () => {
    await nextTick()
    calculateItemPositions()
  }

  /**
   * 测量item的实际高度
   */
  const measureItem = (itemId: string | number) => {
    // 使用uni.createSelectorQuery测量高度
    const query = uni.createSelectorQuery()
    query.select(`#item-${itemId}`).boundingClientRect((rect: any) => {
      if (rect && rect.height) {
        setItemHeight(itemId, rect.height)
      }
    }).exec()
  }

  /**
   * 初始化视口高度
   */
  const initViewportHeight = () => {
    const systemInfo = uni.getSystemInfoSync()
    viewportHeight.value = systemInfo.windowHeight
  }

  // 监听items变化
  watch(() => items.value.length, () => {
    calculateItemPositions()
  })

  // 初始化
  onMounted(() => {
    initViewportHeight()
    calculateItemPositions()
  })

  // 清理
  onUnmounted(() => {
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
  })

  return {
    // 状态
    scrollTop,
    viewportHeight,
    totalHeight,

    // 计算属性
    visibleRange,
    topPlaceholderHeight,
    bottomPlaceholderHeight,

    // 方法
    handleScroll,
    setItemHeight,
    measureItem,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    recalculate,
  }
}
