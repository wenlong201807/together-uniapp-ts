<template>
  <view class="values-container">
    <!-- 顶部统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ answeredCount }}</text>
        <text class="stat-label">已回答</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ totalQuestions - answeredCount }}</text>
        <text class="stat-label">未回答</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ completionRate }}%</text>
        <text class="stat-label">完成度</text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view v-if="answeredCount < 10" class="tips-card">
      <text class="tips-icon">💡</text>
      <view class="tips-content">
        <text class="tips-title">建议至少回答10个问题</text>
        <text class="tips-desc">完善价值观可以提高匹配准确度</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <scroll-view class="category-tabs" scroll-x>
      <view
        v-for="cat in categories"
        :key="cat.key"
        class="category-tab"
        :class="{ active: currentCategory === cat.key }"
        @tap="currentCategory = cat.key"
      >
        <text class="tab-icon">{{ cat.icon }}</text>
        <text class="tab-name">{{ cat.name }}</text>
        <text class="tab-count">{{ getCategoryAnsweredCount(cat.key) }}/{{ questions[cat.key].length }}</text>
      </view>
    </scroll-view>

    <!-- 问题列表 -->
    <view class="questions-list">
      <view
        v-for="(question, index) in currentQuestions"
        :key="index"
        class="question-card"
      >
        <view class="question-header">
          <text class="question-number">Q{{ index + 1 }}</text>
          <text class="question-text">{{ question }}</text>
        </view>

        <textarea
          v-model="answers[currentCategory][index]"
          class="answer-input"
          placeholder="请输入你的想法..."
          maxlength="500"
          auto-height
          @blur="handleAnswerChange(currentCategory, question, index)"
        />

        <view class="question-footer">
          <view class="char-count">
            <text>{{ (answers[currentCategory][index] || '').length }}/500</text>
          </view>
          <view class="privacy-toggle">
            <text class="privacy-label">公开</text>
            <switch
              :checked="privacy[currentCategory][index] || false"
              color="#667eea"
              @change="handlePrivacyChange(currentCategory, question, index, $event)"
            />
          </view>
          <view class="save-status">
            <text v-if="saveStatus[currentCategory][index]" class="status-text">
              {{ saveStatus[currentCategory][index] }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { getValues, saveValue, deleteValue } from '@/api/profile'
import type { UserValue } from '@/api/profile'

// 分类定义
const categories = [
  { key: 'love', name: '恋爱观', icon: '💕' },
  { key: 'marriage', name: '婚姻观', icon: '💍' },
  { key: 'money', name: '金钱观', icon: '💰' },
  { key: 'family', name: '家庭观', icon: '🏠' },
  { key: 'career', name: '事业观', icon: '💼' },
  { key: 'children', name: '生育观', icon: '👶' },
]

// 预设问题
const questions: Record<string, string[]> = {
  love: [
    '你认为恋爱中最重要的是什么？',
    '你能接受异地恋吗？为什么？',
    '你如何看待恋爱中的仪式感？',
    '你认为恋爱多久结婚比较合适？',
  ],
  marriage: [
    '你认为什么时候结婚最合适？',
    '婚后是否愿意和父母同住？',
    '你如何看待婚前协议？',
    '婚后遇到矛盾如何解决？',
    '你对婚姻生活有什么期待？',
  ],
  money: [
    '你如何看待恋爱中的AA制？',
    '婚后财务如何管理？',
    '你认为彩礼重要吗？',
    '如何看待另一半的消费习惯？',
  ],
  family: [
    '你认为家庭和事业哪个更重要？',
    '如何分配家务？',
    '如何处理婆媳关系？',
    '节假日如何安排？',
  ],
  career: [
    '你对另一半的事业有什么期望？',
    '能接受对方经常加班吗？',
    '如何平衡工作和家庭？',
    '是否支持对方创业？',
  ],
  children: [
    '你计划要几个孩子？',
    '如何看待全职带娃？',
    '孩子的教育理念是什么？',
    '如何分配育儿责任？',
  ],
}

// 状态
const loading = ref(false)
const currentCategory = ref('love')
const values = ref<UserValue[]>([])

// 答案和隐私设置（按分类和索引组织）
const answers = reactive<Record<string, Record<number, string>>>({
  love: {},
  marriage: {},
  money: {},
  family: {},
  career: {},
  children: {},
})

const privacy = reactive<Record<string, Record<number, boolean>>>({
  love: {},
  marriage: {},
  money: {},
  family: {},
  career: {},
  children: {},
})

const saveStatus = reactive<Record<string, Record<number, string>>>({
  love: {},
  marriage: {},
  money: {},
  family: {},
  career: {},
  children: {},
})

// 防抖定时器
const saveTimers = reactive<Record<string, Record<number, number>>>({
  love: {},
  marriage: {},
  money: {},
  family: {},
  career: {},
  children: {},
})

// 计算属性
const currentQuestions = computed(() => questions[currentCategory.value] || [])

const totalQuestions = computed(() => {
  return Object.values(questions).reduce((sum, qs) => sum + qs.length, 0)
})

const answeredCount = computed(() => {
  return Object.values(answers).reduce((sum, categoryAnswers) => {
    return sum + Object.values(categoryAnswers).filter(a => a && a.trim().length > 0).length
  }, 0)
})

const completionRate = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((answeredCount.value / totalQuestions.value) * 100)
})

// 获取分类已回答数量
const getCategoryAnsweredCount = (category: string) => {
  return Object.values(answers[category]).filter(a => a && a.trim().length > 0).length
}

// 加载数据
onMounted(async () => {
  await loadValues()
})

// 清理定时器
onUnmounted(() => {
  // 清理所有保存定时器
  Object.keys(saveTimers).forEach(category => {
    Object.keys(saveTimers[category]).forEach(index => {
      if (saveTimers[category][index]) {
        clearTimeout(saveTimers[category][index])
      }
    })
  })
})

const loadValues = async () => {
  loading.value = true
  try {
    const res = await getValues()
    values.value = res.data

    // 填充答案和隐私设置
    res.data.forEach((value) => {
      const categoryQuestions = questions[value.category]
      if (categoryQuestions) {
        const index = categoryQuestions.indexOf(value.question)
        if (index !== -1) {
          answers[value.category][index] = value.answer
          privacy[value.category][index] = value.isPublic
        }
      }
    })
  } catch (error: any) {
    console.error('[Values] 加载失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 处理答案变化（防抖保存）
const handleAnswerChange = (category: string, question: string, index: number) => {
  const answer = answers[category][index]

  // 清除之前的定时器
  if (saveTimers[category][index]) {
    clearTimeout(saveTimers[category][index])
  }

  // 如果答案为空，删除记录
  if (!answer || answer.trim().length === 0) {
    handleDelete(category, question, index)
    return
  }

  // 设置新的定时器（1秒后保存）
  saveStatus[category][index] = '保存中...'
  saveTimers[category][index] = setTimeout(async () => {
    await handleSave(category, question, index)
  }, 1000) as unknown as number
}

// 处理隐私设置变化
const handlePrivacyChange = async (
  category: string,
  question: string,
  index: number,
  event: any
) => {
  privacy[category][index] = event.detail.value

  // 如果已有答案，立即保存
  if (answers[category][index] && answers[category][index].trim().length > 0) {
    await handleSave(category, question, index)
  }
}

// 保存答案
const handleSave = async (category: string, question: string, index: number) => {
  const answer = answers[category][index]
  const isPublic = privacy[category][index] || false

  if (!answer || answer.trim().length === 0) {
    return
  }

  try {
    await saveValue({
      category,
      question,
      answer: answer.trim(),
      isPublic,
    })

    saveStatus[category][index] = '已保存'

    // 2秒后清除状态提示
    setTimeout(() => {
      saveStatus[category][index] = ''
    }, 2000)

    // 重新加载数据
    await loadValues()
  } catch (error: any) {
    console.error('[Values] 保存失败:', error)
    saveStatus[category][index] = '保存失败'

    setTimeout(() => {
      saveStatus[category][index] = ''
    }, 2000)
  }
}

// 删除答案
const handleDelete = async (category: string, question: string, index: number) => {
  const value = values.value.find(
    v => v.category === category && v.question === question
  )

  if (!value) return

  try {
    await deleteValue(value.id)
    answers[category][index] = ''
    saveStatus[category][index] = ''

    // 重新加载数据
    await loadValues()
  } catch (error: any) {
    console.error('[Values] 删除失败:', error)
  }
}
</script>

<style scoped lang="scss">
.values-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 40rpx;
}

// ========== 统计卡片 ==========
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f0f0;
}

// ========== 提示卡片 ==========
.tips-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.tips-icon {
  font-size: 40rpx;
}

.tips-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #e65100;
}

.tips-desc {
  font-size: 24rpx;
  color: #f57c00;
}

// ========== 分类标签 ==========
.category-tabs {
  white-space: nowrap;
  margin-bottom: 24rpx;
  padding: 8rpx 0;
}

.category-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  margin-right: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .tab-icon,
    .tab-name,
    .tab-count {
      color: #fff;
    }
  }
}

.tab-icon {
  font-size: 32rpx;
}

.tab-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.tab-count {
  font-size: 22rpx;
  color: #999;
}

// ========== 问题列表 ==========
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.question-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.question-number {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
  border-radius: 12rpx;
}

.question-text {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.6;
}

.answer-input {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.question-footer {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.char-count {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.privacy-toggle {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.privacy-label {
  font-size: 26rpx;
  color: #666;
}

.save-status {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: 120rpx;
}

.status-text {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 500;
}

// ========== 加载状态 ==========
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #666;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
