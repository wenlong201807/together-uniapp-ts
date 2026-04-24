import { ref } from 'vue'
import { canTriggerNPS } from '@/api/nps'

export interface NPSTriggerConfig {
  scene: string
  delay?: number // 延迟显示（毫秒）
}

const npsVisible = ref(false)
const npsTriggerType = ref<'auto' | 'manual'>('auto')
const npsTriggerScene = ref('')

export const useNPS = () => {
  /**
   * 检查并触发NPS
   * @param config 触发配置
   */
  const checkAndTrigger = async (config: NPSTriggerConfig) => {
    try {
      const result = await canTriggerNPS()
      const { canTrigger, reason } = result.data

      if (canTrigger) {
        npsTriggerType.value = 'auto'
        npsTriggerScene.value = config.scene

        // 延迟显示
        const delay = config.delay || 1000
        setTimeout(() => {
          npsVisible.value = true
        }, delay)
      } else {
        console.log('[NPS] 不触发:', reason)
      }
    } catch (error) {
      console.error('[NPS] 检查失败:', error)
    }
  }

  /**
   * 手动触发NPS（用户主动点击）
   */
  const manualTrigger = () => {
    npsTriggerType.value = 'manual'
    npsTriggerScene.value = 'manual_trigger'
    npsVisible.value = true
  }

  /**
   * 关闭NPS弹窗
   */
  const closeNPS = () => {
    npsVisible.value = false
  }

  /**
   * NPS提交成功回调
   */
  const onNPSSuccess = (feedback: any) => {
    console.log('[NPS] 提交成功:', feedback)
    // 可以在这里触发其他逻辑，比如刷新用户积分
    uni.showToast({
      title: '感谢您的反馈！',
      icon: 'success'
    })
  }

  return {
    npsVisible,
    npsTriggerType,
    npsTriggerScene,
    checkAndTrigger,
    manualTrigger,
    closeNPS,
    onNPSSuccess
  }
}

/**
 * NPS触发场景枚举
 */
export const NPSScene = {
  AFTER_REGISTER: 'after_register', // 注册后第7天
  AFTER_FIRST_POST: 'after_first_post', // 首次发帖后24小时
  AFTER_ADD_FRIEND: 'after_add_friend', // 添加好友后48小时
  AFTER_ACTIVE_WEEK: 'after_active_week', // 连续活跃7天
  PERIODIC: 'periodic', // 定期触发（45天）
  MANUAL: 'manual_trigger' // 手动触发
} as const

/**
 * 在首页自动检查是否需要触发NPS（定期触发场景）
 */
export const checkPeriodicNPS = () => {
  const { checkAndTrigger } = useNPS()
  checkAndTrigger({
    scene: NPSScene.PERIODIC,
    delay: 3000 // 3秒后检查
  })
}

/**
 * 注册成功后触发（延迟7天后自动触发）
 */
export const triggerAfterRegister = () => {
  const { checkAndTrigger } = useNPS()
  checkAndTrigger({
    scene: NPSScene.AFTER_REGISTER,
    delay: 2000
  })
}

/**
 * 首次发帖后触发（延迟24小时后自动触发）
 */
export const triggerAfterFirstPost = () => {
  const { checkAndTrigger } = useNPS()
  checkAndTrigger({
    scene: NPSScene.AFTER_FIRST_POST,
    delay: 2000
  })
}

/**
 * 添加好友后触发（延迟48小时后自动触发）
 */
export const triggerAfterAddFriend = () => {
  const { checkAndTrigger } = useNPS()
  checkAndTrigger({
    scene: NPSScene.AFTER_ADD_FRIEND,
    delay: 2000
  })
}

/**
 * 连续活跃7天后触发
 */
export const triggerAfterActiveWeek = () => {
  const { checkAndTrigger } = useNPS()
  checkAndTrigger({
    scene: NPSScene.AFTER_ACTIVE_WEEK,
    delay: 2000
  })
}
