import { ref } from 'vue'
import type { GuideConfig } from '@/types/guide'

const GUIDE_STORAGE_KEY = 'app_guide_completed'

interface GuideStorage {
  [guideId: string]: {
    version: string
    completedAt: number
  }
}

export function useGuide() {
  const visible = ref(false)
  const currentStepIndex = ref(0)
  const currentConfig = ref<GuideConfig | null>(null)

  // 获取已完成的引导记录
  const getCompletedGuides = (): GuideStorage => {
    try {
      const data = uni.getStorageSync(GUIDE_STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to get completed guides:', error)
      return {}
    }
  }

  // 保存已完成的引导记录
  const saveCompletedGuide = (guideId: string, version: string) => {
    try {
      const completed = getCompletedGuides()
      completed[guideId] = {
        version,
        completedAt: Date.now(),
      }
      uni.setStorageSync(GUIDE_STORAGE_KEY, JSON.stringify(completed))
    } catch (error) {
      console.error('Failed to save completed guide:', error)
    }
  }

  // 检查引导是否需要显示
  const shouldShowGuide = (config: GuideConfig): boolean => {
    // 如果配置为每次都显示，则返回true
    if (config.showOnce === false) {
      return true
    }

    const completed = getCompletedGuides()
    const record = completed[config.id]

    // 如果没有完成记录，需要显示
    if (!record) {
      return true
    }

    // 如果版本号不同，需要显示
    if (record.version !== config.version) {
      return true
    }

    return false
  }

  // 开始引导
  const startGuide = (config: GuideConfig) => {
    if (!shouldShowGuide(config)) {
      return false
    }

    currentConfig.value = config
    currentStepIndex.value = 0
    visible.value = true
    return true
  }

  // 完成引导
  const completeGuide = () => {
    if (currentConfig.value) {
      saveCompletedGuide(currentConfig.value.id, currentConfig.value.version)
    }
    visible.value = false
    currentConfig.value = null
    currentStepIndex.value = 0
  }

  // 跳过引导
  const skipGuide = () => {
    if (currentConfig.value) {
      saveCompletedGuide(currentConfig.value.id, currentConfig.value.version)
    }
    visible.value = false
    currentConfig.value = null
    currentStepIndex.value = 0
  }

  // 重置引导（用于测试）
  const resetGuide = (guideId?: string) => {
    try {
      if (guideId) {
        const completed = getCompletedGuides()
        delete completed[guideId]
        uni.setStorageSync(GUIDE_STORAGE_KEY, JSON.stringify(completed))
      } else {
        uni.removeStorageSync(GUIDE_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to reset guide:', error)
    }
  }

  return {
    visible,
    currentStepIndex,
    currentConfig,
    startGuide,
    completeGuide,
    skipGuide,
    resetGuide,
    shouldShowGuide,
  }
}
