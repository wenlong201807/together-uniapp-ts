<template>
  <view class="virtual-list-container">
    <scroll-view
      ref="scrollViewRef"
      class="virtual-scroll"
      scroll-y
      :scroll-top="programmaticScrollTop"
      :style="{ height: containerHeight }"
      @scroll="handleScroll"
    >
      <!-- 总容器，用于撑开滚动高度 -->
      <view class="virtual-list-phantom" :style="{ height: `${totalHeight}px` }">
        <!-- 顶部占位 -->
        <view class="virtual-list-spacer" :style="{ height: `${topPlaceholderHeight}px` }" />

        <!-- 可视区域内容 -->
        <view class="virtual-list-content">
          <view
            v-for="item in visibleRange.visibleItems"
            :id="`item-${item.id}`"
            :key="item.id"
            class="virtual-list-item"
            :data-id="item.id"
          >
            <slot :item="item" :index="item._index" />
          </view>
        </view>

        <!-- 底部占位 -->
        <view class="virtual-list-spacer" :style="{ height: `${bottomPlaceholderHeight}px` }" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, toRef } from 'vue'
import { useVirtualList } from '@/composables/useVirtualList'
import type { VirtualListOptions } from '@/composables/useVirtualList'

interface Props {
  items: any[]
  estimatedItemHeight: number
  bufferSize?: number
  scrollThrottle?: number
  containerHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 3,
  scrollThrottle: 16,
  containerHeight: '100%'
})

const emit = defineEmits<{
  scroll: [event: any]
  loadMore: []
  visibleRangeChange: [startIndex: number, endIndex: number]
}>()

// 程序化滚动的 scrollTop 值
const programmaticScrollTop = ref(0)
const scrollViewRef = ref()

// 虚拟列表配置
const virtualListOptions: VirtualListOptions = {
  estimatedItemHeight: props.estimatedItemHeight,
  bufferSize: props.bufferSize,
  scrollThrottle: props.scrollThrottle
}

// 使用虚拟列表
const {
  scrollTop,
  viewportHeight,
  totalHeight,
  visibleRange,
  topPlaceholderHeight,
  bottomPlaceholderHeight,
  handleScroll: onScroll,
  setItemHeight,
  measureItem,
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  recalculate
} = useVirtualList(toRef(props, 'items'), virtualListOptions)

// 处理滚动事件
const handleScroll = (event: any) => {
  onScroll(event)
  emit('scroll', event)

  // 检测是否接近底部，触发加载更多
  const { scrollTop: currentScrollTop, scrollHeight } = event.detail || {}
  const threshold = 200 // 距离底部200px时触发

  if (scrollHeight && scrollHeight - currentScrollTop - viewportHeight.value < threshold) {
    emit('loadMore')
  }
}

// 测量所有可见item的高度
const measureVisibleItems = async () => {
  await nextTick()

  visibleRange.value.visibleItems.forEach((item) => {
    measureItem(item.id)
  })
}

// 监听items长度变化，重新计算
watch(() => props.items.length, async () => {
  await recalculate()
  await measureVisibleItems()
})

// 监听可视区域变化，测量新出现的item（防抖避免死循环）
let measureTimer: number | null = null
watch(() => visibleRange.value.visibleItems.map(i => i.id).join(','), async () => {
  if (measureTimer) {
    clearTimeout(measureTimer)
  }
  measureTimer = setTimeout(async () => {
    await measureVisibleItems()
    measureTimer = null

    // 触发可视区域变化事件
    emit('visibleRangeChange', visibleRange.value.startIndex, visibleRange.value.endIndex)
  }, 100) as unknown as number
})

// 初始化时测量
onMounted(async () => {
  await nextTick()
  await measureVisibleItems()
})

// 包装滚动方法，支持程序化滚动
const scrollToIndexWrapped = (index: number, animated = true) => {
  const targetTop = scrollToIndex(index, animated)
  if (targetTop !== undefined) {
    programmaticScrollTop.value = targetTop
  }
}

const scrollToTopWrapped = (animated = true) => {
  scrollToTop(animated)
  programmaticScrollTop.value = 0
}

const scrollToBottomWrapped = (animated = true) => {
  const targetTop = scrollToBottom(animated)
  if (targetTop !== undefined) {
    programmaticScrollTop.value = targetTop
  }
}

// 暴露方法
defineExpose({
  scrollToIndex: scrollToIndexWrapped,
  scrollToTop: scrollToTopWrapped,
  scrollToBottom: scrollToBottomWrapped,
  recalculate
})
</script>

<style scoped lang="scss">
.virtual-list-container {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .virtual-scroll {
    width: 100%;
    height: 100%;
  }

  .virtual-list-phantom {
    position: relative;
    width: 100%;
  }

  .virtual-list-spacer {
    width: 100%;
  }

  .virtual-list-content {
    width: 100%;
  }

  .virtual-list-item {
    width: 100%;
  }
}
</style>
