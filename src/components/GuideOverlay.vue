<template>
  <view v-if="visible" class="guide-overlay">
    <!-- 遮罩层 -->
    <view class="guide-mask" @click="handleSkip"></view>

    <!-- 高亮区域 -->
    <view
      v-if="highlightRect"
      class="guide-highlight"
      :style="highlightStyle"
    ></view>

    <!-- 提示气泡 -->
    <view
      v-if="currentStep && tipRect"
      class="guide-tip"
      :class="[`guide-tip-${currentStep.placement}`]"
      :style="tipStyle"
    >
      <view class="tip-header">
        <text class="tip-title">{{ currentStep.title }}</text>
        <text class="tip-close" @click="handleSkip">✕</text>
      </view>
      <view class="tip-content">
        <text class="tip-text">{{ currentStep.content }}</text>
      </view>
      <view class="tip-footer">
        <text class="tip-skip" @click="handleSkip">
          {{ currentStep.skipText || '跳过' }}
        </text>
        <view class="tip-progress">
          <text class="tip-step">{{ currentStepIndex + 1 }}/{{ steps.length }}</text>
        </view>
        <text class="tip-next" @click="handleNext">
          {{ isLastStep ? '完成' : (currentStep.nextText || '下一步') }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { GuideStep, ElementRect } from '@/types/guide'

interface Props {
  visible: boolean
  steps: GuideStep[]
  currentStepIndex: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:currentStepIndex', value: number): void
  (e: 'complete'): void
  (e: 'skip'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const highlightRect = ref<ElementRect | null>(null)
const tipRect = ref<{ top: number; left: number } | null>(null)

const currentStep = computed(() => {
  return props.steps[props.currentStepIndex]
})

const isLastStep = computed(() => {
  return props.currentStepIndex === props.steps.length - 1
})

const highlightStyle = computed(() => {
  if (!highlightRect.value) return {}

  const padding = currentStep.value?.highlightPadding || 10

  return {
    top: `${highlightRect.value.top - padding}px`,
    left: `${highlightRect.value.left - padding}px`,
    width: `${highlightRect.value.width + padding * 2}px`,
    height: `${highlightRect.value.height + padding * 2}px`,
  }
})

const tipStyle = computed(() => {
  if (!tipRect.value) return {}

  return {
    top: `${tipRect.value.top}px`,
    left: `${tipRect.value.left}px`,
  }
})

// 获取元素位置
const getElementRect = (selector: string): Promise<ElementRect | null> => {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    query.select(selector).boundingClientRect()
    query.exec((res) => {
      if (res && res[0]) {
        // 获取系统信息，计算状态栏和导航栏高度
        const systemInfo = uni.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        // 导航栏高度通常是44px（iOS）或48px（Android），这里使用固定值
        const navBarHeight = 44
        const headerHeight = statusBarHeight + navBarHeight

        resolve({
          top: res[0].top + headerHeight,
          left: res[0].left,
          width: res[0].width,
          height: res[0].height,
        })
      } else {
        resolve(null)
      }
    })
  })
}

// 计算提示框位置
const calculateTipPosition = (
  elementRect: ElementRect,
  placement: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } => {
  const tipWidth = 300 // 提示框宽度
  const tipHeight = 200 // 提示框预估高度
  const gap = 20 // 间距

  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = elementRect.top - tipHeight - gap
      left = elementRect.left + elementRect.width / 2 - tipWidth / 2
      break
    case 'bottom':
      top = elementRect.top + elementRect.height + gap
      left = elementRect.left + elementRect.width / 2 - tipWidth / 2
      break
    case 'left':
      top = elementRect.top + elementRect.height / 2 - tipHeight / 2
      left = elementRect.left - tipWidth - gap
      break
    case 'right':
      top = elementRect.top + elementRect.height / 2 - tipHeight / 2
      left = elementRect.left + elementRect.width + gap
      break
  }

  // 边界检查
  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth
  const screenHeight = systemInfo.windowHeight

  if (left < 10) left = 10
  if (left + tipWidth > screenWidth - 10) left = screenWidth - tipWidth - 10
  if (top < 10) top = 10
  if (top + tipHeight > screenHeight - 10) top = screenHeight - tipHeight - 10

  return { top, left }
}

// 更新引导位置
const updateGuidePosition = async () => {
  if (!currentStep.value) return

  await nextTick()

  // 获取目标元素位置
  const rect = await getElementRect(currentStep.value.target)
  if (!rect) {
    console.warn(`Guide target not found: ${currentStep.value.target}`)
    return
  }

  highlightRect.value = rect
  tipRect.value = calculateTipPosition(rect, currentStep.value.placement)
}

// 下一步
const handleNext = () => {
  if (isLastStep.value) {
    emit('complete')
    emit('update:visible', false)
  } else {
    emit('update:currentStepIndex', props.currentStepIndex + 1)
  }
}

// 跳过
const handleSkip = () => {
  emit('skip')
  emit('update:visible', false)
}

// 监听步骤变化
watch(
  () => props.currentStepIndex,
  () => {
    updateGuidePosition()
  },
  { immediate: true }
)

// 监听显示状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      updateGuidePosition()
    }
  }
)
</script>

<style scoped lang="scss">
.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.guide-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
}

.guide-highlight {
  position: absolute;
  border: 2rpx solid #ff6b6b;
  border-radius: 8rpx;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  z-index: 2;
  animation: highlight-pulse 2s infinite;
}

@keyframes highlight-pulse {
  0%, 100% {
    border-color: #ff6b6b;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20rpx rgba(255, 107, 107, 0.5);
  }
  50% {
    border-color: #ff8787;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30rpx rgba(255, 107, 107, 0.8);
  }
}

.guide-tip {
  position: absolute;
  width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  z-index: 3;
  animation: tip-fade-in 0.3s ease-out;

  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 16rpx solid transparent;
  }

  &.guide-tip-top::before {
    bottom: -32rpx;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: #fff;
  }

  &.guide-tip-bottom::before {
    top: -32rpx;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: #fff;
  }

  &.guide-tip-left::before {
    right: -32rpx;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: #fff;
  }

  &.guide-tip-right::before {
    left: -32rpx;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: #fff;
  }
}

@keyframes tip-fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tip-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.tip-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.tip-content {
  padding: 32rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.tip-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.tip-skip {
  font-size: 28rpx;
  color: #999;
}

.tip-progress {
  flex: 1;
  text-align: center;
}

.tip-step {
  font-size: 24rpx;
  color: #999;
}

.tip-next {
  font-size: 28rpx;
  color: #ff6b6b;
  font-weight: 600;
}
</style>
