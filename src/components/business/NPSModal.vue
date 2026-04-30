<template>
  <view v-if="visible" class="nps-modal-overlay" @tap="handleOverlayTap">
    <view class="nps-modal" @tap.stop>
      <!-- 步骤1: 评分 -->
      <view v-if="step === 1" class="nps-step">
        <view class="nps-header">
          <text class="nps-title">您对Together的体验满意吗？</text>
          <text class="nps-subtitle">请为我们打分（0-10分）</text>
        </view>

        <view class="nps-score-container">
          <view class="score-labels">
            <text class="score-label">不满意</text>
            <text class="score-label">非常满意</text>
          </view>
          <view class="score-buttons">
            <view
              v-for="score in 11"
              :key="score - 1"
              class="score-button"
              :class="{ active: selectedScore === score - 1 }"
              @tap="handleScoreSelect(score - 1)"
            >
              <text class="score-text">{{ score - 1 }}</text>
            </view>
          </view>
        </view>

        <view class="nps-actions">
          <button class="btn-cancel" @tap="handleClose">暂不评价</button>
          <button
            class="btn-next"
            :disabled="selectedScore === null"
            @tap="handleNext"
          >
            下一步
          </button>
        </view>
      </view>

      <!-- 步骤2: 反馈 -->
      <view v-if="step === 2" class="nps-step">
        <view class="nps-header">
          <text class="nps-title">{{ feedbackTitle }}</text>
          <text class="nps-subtitle">{{ feedbackSubtitle }}</text>
        </view>

        <view class="nps-form">
          <textarea
            v-model="reason"
            class="feedback-textarea"
            :placeholder="reasonPlaceholder"
            :maxlength="180"
            auto-height
          />
          <view class="char-count">
            <text :class="{ 'text-warning': reason.length < 10 }">
              {{ reason.length }}/180
              <text v-if="reason.length < 10" class="min-tip">（至少10字）</text>
            </text>
          </view>

          <view class="tags-section">
            <text class="tags-label">选择标签（可选，最多3个）</text>
            <view class="tags-container">
              <view
                v-for="tag in availableTags"
                :key="tag"
                class="tag-item"
                :class="{ active: selectedTags.includes(tag) }"
                @tap="handleTagToggle(tag)"
              >
                <text class="tag-text">{{ tag }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="nps-actions">
          <button class="btn-cancel" @tap="handleBack">上一步</button>
          <button
            class="btn-submit"
            :disabled="!canSubmit"
            :loading="submitting"
            @tap="handleSubmit"
          >
            提交反馈
          </button>
        </view>
      </view>

      <!-- 步骤3: 感谢 -->
      <view v-if="step === 3" class="nps-step">
        <view class="nps-success">
          <text class="success-icon">🎉</text>
          <text class="success-title">感谢您的反馈！</text>
          <text class="success-message">{{ successMessage }}</text>
          <text class="success-points">+{{ pointsReward }} 积分已到账</text>
        </view>

        <view class="nps-actions">
          <button class="btn-done" @tap="handleClose">完成</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { submitNPSFeedback } from '@/api/nps'
import type { SubmitNPSDto } from '@/api/nps'

interface Props {
  visible: boolean
  triggerType?: 'auto' | 'manual'
  triggerScene?: string
}

const props = withDefaults(defineProps<Props>(), {
  triggerType: 'auto',
  triggerScene: ''
})

const emit = defineEmits<{
  close: []
  success: [feedback: any]
}>()

const step = ref(1)
const selectedScore = ref<number | null>(null)
const reason = ref('')
const selectedTags = ref<string[]>([])
const submitting = ref(false)
const pointsReward = ref(20)

// 根据评分动态调整标签
const availableTags = computed(() => {
  if (selectedScore.value === null) return []

  if (selectedScore.value >= 9) {
    // 推荐者标签
    return ['功能强大', '界面美观', '操作流畅', '社交体验好', '匹配精准', '其他']
  } else if (selectedScore.value >= 7) {
    // 被动者标签
    return ['功能还行', '有些卡顿', '功能不够', '界面一般', '匹配不准', '其他']
  } else {
    // 贬损者标签
    return ['经常崩溃', '功能缺失', '界面难用', '匹配很差', '隐私担忧', '其他']
  }
})

// 反馈标题
const feedbackTitle = computed(() => {
  if (selectedScore.value === null) return ''

  if (selectedScore.value >= 9) {
    return '太好了！能告诉我们您最喜欢什么吗？'
  } else if (selectedScore.value >= 7) {
    return '感谢评分！我们如何做得更好？'
  } else {
    return '很抱歉让您失望了，请告诉我们问题'
  }
})

// 反馈副标题
const feedbackSubtitle = computed(() => {
  if (selectedScore.value === null) return ''

  if (selectedScore.value >= 9) {
    return '您的好评是我们前进的动力'
  } else if (selectedScore.value >= 7) {
    return '您的建议对我们很重要'
  } else {
    return '我们会尽快改进，请详细描述问题'
  }
})

// 输入框提示
const reasonPlaceholder = computed(() => {
  if (selectedScore.value === null) return ''

  if (selectedScore.value >= 9) {
    return '分享一下您的使用体验吧...'
  } else if (selectedScore.value >= 7) {
    return '告诉我们您希望改进的地方...'
  } else {
    return '请详细描述您遇到的问题，我们会尽快处理...'
  }
})

// 成功消息
const successMessage = computed(() => {
  if (selectedScore.value === null) return ''

  if (selectedScore.value >= 9) {
    return '您的好评是我们最大的鼓励！'
  } else if (selectedScore.value >= 7) {
    return '我们会认真考虑您的建议！'
  } else {
    return '我们会在4小时内联系您解决问题！'
  }
})

// 是否可以提交
const canSubmit = computed(() => {
  return reason.value.trim().length >= 10
})

// 选择评分
const handleScoreSelect = (score: number) => {
  selectedScore.value = score
}

// 下一步
const handleNext = () => {
  if (selectedScore.value === null) return
  step.value = 2
}

// 上一步
const handleBack = () => {
  step.value = 1
}

// 切换标签
const handleTagToggle = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    if (selectedTags.value.length < 3) {
      selectedTags.value.push(tag)
    } else {
      uni.showToast({
        title: '最多选择3个标签',
        icon: 'none'
      })
    }
  }
}

// 提交反馈
const handleSubmit = async () => {
  console.log('[NPS] handleSubmit 被调用')
  console.log('[NPS] canSubmit:', canSubmit.value)
  console.log('[NPS] selectedScore:', selectedScore.value)
  console.log('[NPS] reason length:', reason.value.trim().length)

  if (!canSubmit.value || selectedScore.value === null) {
    console.log('[NPS] 提交被阻止 - canSubmit:', canSubmit.value, 'selectedScore:', selectedScore.value)
    uni.showToast({
      title: reason.value.trim().length < 10 ? '请至少输入10个字' : '请先评分',
      icon: 'none'
    })
    return
  }

  submitting.value = true
  console.log('[NPS] 开始提交反馈...')

  try {
    const dto: SubmitNPSDto = {
      score: selectedScore.value,
      reason: reason.value.trim(),
      tags: selectedTags.value,
      triggerType: props.triggerType,
      triggerScene: props.triggerScene
    }

    console.log('[NPS] 提交数据:', dto)
    const result = await submitNPSFeedback(dto)
    console.log('[NPS] 提交成功:', result)

    // 根据反馈长度计算积分
    pointsReward.value = reason.value.length >= 50 ? 30 : 20

    step.value = 3
    emit('success', result)

    // 3秒后自动关闭
    setTimeout(() => {
      handleClose()
    }, 3000)
  } catch (error: any) {
    console.error('[NPS] 提交失败:', error)
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
  // 重置状态
  setTimeout(() => {
    step.value = 1
    selectedScore.value = null
    reason.value = ''
    selectedTags.value = []
  }, 300)
}

// 点击遮罩层
const handleOverlayTap = () => {
  if (step.value !== 2 || !reason.value) {
    handleClose()
  }
}
</script>

<style scoped lang="scss">
.nps-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.nps-modal {
  width: 680rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx 32rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.nps-step {
  display: flex;
  flex-direction: column;
}

.nps-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.nps-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}

.nps-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.nps-score-container {
  margin-bottom: 48rpx;
}

.score-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.score-label {
  font-size: 24rpx;
  color: #999;
}

.score-buttons {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16rpx;
}

.score-button {
  width: 96rpx;
  height: 96rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;

    .score-text {
      color: #fff;
      font-weight: 600;
    }
  }
}

.score-text {
  font-size: 32rpx;
  color: #333;
}

.nps-form {
  margin-bottom: 32rpx;
}

.feedback-textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  box-sizing: border-box;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;

  .text-warning {
    color: #ff9800;
  }

  .min-tip {
    font-size: 22rpx;
    color: #ff9800;
  }
}

.tags-section {
  margin-top: 32rpx;
}

.tags-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 16rpx 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 32rpx;
  transition: all 0.3s;

  &.active {
    background: #667eea;
    border-color: #667eea;

    .tag-text {
      color: #fff;
    }
  }
}

.tag-text {
  font-size: 26rpx;
  color: #666;
}

.nps-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.btn-cancel,
.btn-next,
.btn-submit,
.btn-done {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  border: none;

  &::after {
    border: none;
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-next,
.btn-submit,
.btn-done {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  &:disabled {
    opacity: 0.5;
  }
}

.nps-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.success-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.success-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}

.success-message {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 24rpx;
}

.success-points {
  font-size: 32rpx;
  font-weight: 600;
  color: #667eea;
}
</style>
