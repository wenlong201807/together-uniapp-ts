<template>
  <view class="profile-edit-container">
    <!-- 信息完整度展示 -->
    <view class="completeness-card">
      <view class="completeness-header">
        <text class="completeness-title">个人资料完整度</text>
        <text class="completeness-level">{{ completenessData.level }}</text>
      </view>
      <view class="completeness-progress">
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: completenessData.score + '%' }"
          />
        </view>
        <text class="progress-text">{{ completenessData.score }}%</text>
      </view>
      <view class="completeness-tips">
        <text class="tips-title">还差一点就完美了！</text>
        <text class="tips-desc">完善资料可提高匹配度，获得更多关注</text>
      </view>
      <view v-if="completenessData.missingFields.length > 0" class="missing-fields">
        <text class="missing-title">待完善项：</text>
        <view class="missing-tags">
          <text
            v-for="(field, index) in completenessData.missingFields.slice(0, 5)"
            :key="index"
            class="missing-tag"
          >
            {{ field }}
          </text>
          <text v-if="completenessData.missingFields.length > 5" class="missing-more">
            +{{ completenessData.missingFields.length - 5 }}
          </text>
        </view>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="quick-actions">
      <view class="action-item" @tap="goToInterests">
        <view class="action-icon">🎯</view>
        <view class="action-content">
          <text class="action-title">兴趣爱好</text>
          <text class="action-desc">{{ interestCount }}个兴趣</text>
        </view>
        <text class="action-arrow">›</text>
      </view>
      <view class="action-item" @tap="goToPhotos">
        <view class="action-icon">📷</view>
        <view class="action-content">
          <text class="action-title">我的照片</text>
          <text class="action-desc">{{ photoCount }}/20张</text>
        </view>
        <text class="action-arrow">›</text>
      </view>
      <view class="action-item" @tap="goToMatePreferences">
        <view class="action-icon">💝</view>
        <view class="action-content">
          <text class="action-title">择偶要求</text>
          <text class="action-desc">{{ hasMatePreference ? '已设置' : '未设置' }}</text>
        </view>
        <text class="action-arrow">›</text>
      </view>
    </view>

    <!-- 分步填写表单 -->
    <view class="form-sections">
      <view class="section-title">
        <text class="title-text">完善个人资料</text>
        <text class="title-desc">分步填写，每步完成奖励积分</text>
      </view>

      <!-- 步骤1: 基础信息 -->
      <view class="form-section" @tap="editSection('basic')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">👤</view>
            <view class="section-info">
              <text class="section-name">基础信息</text>
              <text class="section-status">{{ getSectionStatus('basic') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('basic')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">真实姓名、出生日期、居住地、身高、职业、学历</text>
        </view>
      </view>

      <!-- 步骤2: 外貌体征 -->
      <view class="form-section" @tap="editSection('appearance')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">✨</view>
            <view class="section-info">
              <text class="section-name">外貌体征</text>
              <text class="section-status">{{ getSectionStatus('appearance') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('appearance')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">体型、星座、生肖、脸型</text>
        </view>
      </view>

      <!-- 步骤3: 教育职业 -->
      <view class="form-section" @tap="editSection('education')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">🎓</view>
            <view class="section-info">
              <text class="section-name">教育职业</text>
              <text class="section-status">{{ getSectionStatus('education') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('education')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">毕业院校、专业、行业、公司、工作年限、收入</text>
        </view>
      </view>

      <!-- 步骤4: 生活方式 -->
      <view class="form-section" @tap="editSection('lifestyle')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">🏃</view>
            <view class="section-info">
              <text class="section-name">生活方式</text>
              <text class="section-status">{{ getSectionStatus('lifestyle') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('lifestyle')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">吸烟、饮酒、作息、运动、饮食、宠物</text>
        </view>
      </view>

      <!-- 步骤5: 性格兴趣 -->
      <view class="form-section" @tap="editSection('personality')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">🎨</view>
            <view class="section-info">
              <text class="section-name">性格兴趣</text>
              <text class="section-status">{{ getSectionStatus('personality') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('personality')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">性格标签、自我介绍、内心独白</text>
        </view>
      </view>

      <!-- 步骤6: 家庭背景 -->
      <view class="form-section" @tap="editSection('family')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">🏠</view>
            <view class="section-info">
              <text class="section-name">家庭背景</text>
              <text class="section-status">{{ getSectionStatus('family') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('family')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">籍贯、家庭成员、排行、父母职业、家庭经济</text>
        </view>
      </view>

      <!-- 步骤7: 婚恋状况 -->
      <view class="form-section" @tap="editSection('marital')">
        <view class="section-header">
          <view class="section-left">
            <view class="section-icon">💑</view>
            <view class="section-info">
              <text class="section-name">婚恋状况</text>
              <text class="section-status">{{ getSectionStatus('marital') }}</text>
            </view>
          </view>
          <view class="section-right">
            <text v-if="!isSectionComplete('marital')" class="section-reward">+20积分</text>
            <text class="section-arrow">›</text>
          </view>
        </view>
        <view class="section-fields">
          <text class="field-item">婚姻状况、孩子情况、结婚计划、房产、车辆</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCompletenessDetails, getInterests, getPhotos, getMatePreferences } from '@/api/profile'

// 信息完整度数据
const completenessData = ref({
  score: 0,
  level: '基础级',
  missingFields: [] as string[],
})

// 统计数据
const interestCount = ref(0)
const photoCount = ref(0)
const hasMatePreference = ref(false)

// 使用 onShow 替代 onMounted，确保每次显示页面时都刷新数据
onShow(async () => {
  await loadCompletenessData()
  await loadStatistics()
})

const loadCompletenessData = async () => {
  try {
    const res = await getCompletenessDetails()
    completenessData.value = res.data
  } catch (error: any) {
    console.error('[ProfileEdit] 加载完整度失败:', error)
  }
}

const loadStatistics = async () => {
  // 加载兴趣数量
  try {
    const interestsRes = await getInterests()
    interestCount.value = interestsRes.data.length
  } catch (error: any) {
    console.error('[ProfileEdit] 加载兴趣数量失败:', error)
    interestCount.value = 0
  }

  // 加载照片数量
  try {
    const photosRes = await getPhotos()
    photoCount.value = photosRes.data.length
  } catch (error: any) {
    console.error('[ProfileEdit] 加载照片数量失败:', error)
    photoCount.value = 0
  }

  // 检查是否设置择偶要求
  try {
    const mateRes = await getMatePreferences()
    hasMatePreference.value = !!mateRes.data
  } catch (error: any) {
    console.error('[ProfileEdit] 加载择偶要求失败:', error)
    hasMatePreference.value = false
  }
}

// 获取章节状态
const getSectionStatus = (section: string) => {
  // TODO: 根据实际数据判断章节完成状态
  return '未完成'
}

// 判断章节是否完成
const isSectionComplete = (section: string) => {
  // TODO: 根据实际数据判断
  return false
}

// 编辑章节
const editSection = (section: string) => {
  uni.navigateTo({
    url: `/pages/profile/edit-section?section=${section}`,
  })
}

// 跳转到兴趣管理
const goToInterests = () => {
  uni.navigateTo({
    url: '/pages/profile/interests',
  })
}

// 跳转到照片管理
const goToPhotos = () => {
  uni.navigateTo({
    url: '/pages/profile/photos',
  })
}

// 跳转到择偶要求
const goToMatePreferences = () => {
  uni.navigateTo({
    url: '/pages/profile/mate-preferences',
  })
}
</script>

<style scoped lang="scss">
.profile-edit-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

// ========== 信息完整度卡片 ==========
.completeness-card {
  margin: 24rpx;
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  color: #fff;
}

.completeness-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.completeness-title {
  font-size: 32rpx;
  font-weight: 600;
}

.completeness-level {
  font-size: 28rpx;
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
}

.completeness-progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 8rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 32rpx;
  font-weight: 600;
}

.completeness-tips {
  margin-bottom: 24rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.tips-desc {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}

.missing-fields {
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.missing-title {
  display: block;
  font-size: 24rpx;
  margin-bottom: 16rpx;
  opacity: 0.9;
}

.missing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.missing-tag {
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  font-size: 24rpx;
}

.missing-more {
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  font-size: 24rpx;
}

// ========== 快速入口 ==========
.quick-actions {
  margin: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.action-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.action-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.action-desc {
  font-size: 24rpx;
  color: #999;
}

.action-arrow {
  font-size: 40rpx;
  color: #ccc;
}

// ========== 表单章节 ==========
.form-sections {
  margin: 24rpx;
}

.section-title {
  margin-bottom: 24rpx;
}

.title-text {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.title-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.form-section {
  margin-bottom: 16rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.section-icon {
  font-size: 40rpx;
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.section-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.section-status {
  font-size: 24rpx;
  color: #999;
}

.section-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.section-reward {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 500;
}

.section-arrow {
  font-size: 40rpx;
  color: #ccc;
}

.section-fields {
  padding-left: 56rpx;
}

.field-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
</style>
