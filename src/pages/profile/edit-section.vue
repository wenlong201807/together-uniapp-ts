<template>
  <view class="edit-section-container">
    <!-- 顶部标题 -->
    <view class="header-card">
      <text class="section-title">{{ sectionConfig.title }}</text>
      <text class="section-desc">{{ sectionConfig.description }}</text>
    </view>

    <!-- 表单内容 -->
    <view class="form-card">
      <!-- 基础信息 -->
      <template v-if="section === 'basic'">
        <view class="form-item required">
          <text class="form-label">真实姓名</text>
          <input v-model="formData.realName" class="form-input" placeholder="请输入真实姓名" maxlength="20" />
        </view>

        <view class="form-item required">
          <text class="form-label">出生日期</text>
          <picker mode="date" :value="formData.birthDate" :end="maxDate" @change="onDateChange">
            <view class="form-picker" :class="{ placeholder: !formData.birthDate }">
              {{ formData.birthDate || '请选择出生日期' }}
            </view>
          </picker>
        </view>

        <view class="form-item required">
          <text class="form-label">居住地</text>
          <input v-model="formData.residence" class="form-input" placeholder="请输入居住地" maxlength="50" />
        </view>

        <view class="form-item required">
          <text class="form-label">身高 (cm)</text>
          <input v-model.number="formData.height" type="number" class="form-input" placeholder="请输入身高" />
        </view>

        <view class="form-item">
          <text class="form-label">体重 (kg)</text>
          <input v-model.number="formData.weight" type="number" class="form-input" placeholder="请输入体重" />
        </view>

        <view class="form-item required">
          <text class="form-label">职业</text>
          <input v-model="formData.occupation" class="form-input" placeholder="请输入职业" maxlength="30" />
        </view>

        <view class="form-item required">
          <text class="form-label">学历</text>
          <picker :value="educationIndex" :range="educationOptions" @change="onEducationChange">
            <view class="form-picker" :class="{ placeholder: !formData.education }">
              {{ formData.education || '请选择学历' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">个人简介</text>
          <textarea v-model="formData.bio" class="form-textarea" placeholder="介绍一下自己吧" maxlength="200" />
        </view>
      </template>

      <!-- 外貌体征 -->
      <template v-if="section === 'appearance'">
        <view class="form-item">
          <text class="form-label">体型</text>
          <view class="option-group">
            <view
              v-for="item in bodyTypeOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.bodyType === item }"
              @tap="formData.bodyType = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">星座</text>
          <picker :value="zodiacIndex" :range="zodiacOptions" @change="onZodiacChange">
            <view class="form-picker" :class="{ placeholder: !formData.zodiacSign }">
              {{ formData.zodiacSign || '请选择星座' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">生肖</text>
          <picker :value="chineseZodirange="chineseZodiacOptions" @change="onChineseZodiacChange">
            <view class="form-picker" :class="{ placeholder: !formData.chineseZodiac }">
              {{ formData.chineseZodiac || '请选择生肖' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">脸型</text>
          <view class="option-group">
            <view
              v-for="item in faceShapeOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.faceShape === item }"
              @tap="formData.faceShape = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">是否戴眼镜</text>
          <switch :checked="formData.hasGlasses" @change="formData.hasGlasses = $event.detail.value" color="#667eea" />
        </view>

        <view class="form-item">
          <text class="form-label">是否有纹身</text>
          <switch :checked="formData.hasTattoo" @change="formData.hasTattoo = $event.detail.value" color="#667eea" />
        </view>
      </template>

      <!-- 教育职业 -->
      <template v-if="section === 'education'">
        <view class="form-item">
          <text class="form-label">毕业院校</text>
          <input v-model="formData.graduateSchool" class="form-input" placeholder="请输入毕业院校" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">专业</text>
          <input v-model="formData.major" class="form-input" placeholder="请输入专业" maxlength="30" />
        </view>

        <view class="form-item">
          <text class="form-label">行业</text>
          <input v-model="formData.industry" class="form-input" placeholder="请输入所在行业" maxlength="30" />
        </view>

        <view class="form-item">
          <text class="form-label">公司</text>
          <input v-model="formData.company" class="form-input" placeholder="请输入公司名称" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">工作年限</text>
          <input v-model.number="formData.workYears" type="number" class="form-input" placeholder="请输入工作年限" />
        </view>

        <view class="form-item">
          <text class="form-label">收入 (万/年)</text>
          <input v-model.number="formData.income" type="number" class="form-input" placeholder="请输入年收入" />
        </view>
      </template>

      <!-- 生活方式 -->
      <template v-if="section === 'lifestyle'">
        <view class="form-item">
          <text class="form-label">吸烟</text>
          <view class="option-group">
            <view
              v-for="item in smokingOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.smokingStatus === item }"
              @tap="formData.smokingStatus = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">饮酒</text>
          <view class="option-group">
            <view
              v-for="item in drinkingOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.drinkingStatus === item }"
              @tap="formData.drinkingStatus = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">作息</text>
          <view class="option-group">
            <view
              v-for="item in sleepOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.sleepSchedule === item }"
              @tap="formData.sleepSchedule = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">运动频率</text>
          <view class="option-group">
            <view
              v-for="item in exerciseOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.exerciseFrequency === item }"
              @tap="formData.exerciseFrequency = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">饮食偏好</text>
          <view class="option-group">
            <view
              v-for="item in dietOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.dietPreference === item }"
              @tap="formData.dietPreference = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">是否养宠物</text>
          <switch :checked="formData.hasPets" @change="onPetsChange" color="#667eea" />
        </view>

        <view v-if="formData.hasPets" class="form-item">
          <text class="form-label">宠物类型</text>
          <input v-model="formData.petType" class="form-input" placeholder="请输入宠物类型" maxlength="20" />
        </view>

        <view class="form-item">
          <text class="form-label">厨艺</text>
          <view class="option-group">
            <view
              v-for="item in cookingOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.cookingSkill === item }"
              @tap="formData.cookingSkill = item"
            >
              {{ item }}
            </view>
          </view>
        </view>
      </template>

      <!-- 性格兴趣 -->
      <template v-if="section === 'personality'">
        <view class="form-item">
          <text class="form-label">性格标签（最多5个）</text>
          <view class="tag-group">
            <view
              v-for="tag in personalityTagOptions"
              :key="tag"
              class="tag-item"
              :class="{ active: formData.personalityTags?.includes(tag) }"
              @tap="toggleTag(tag)"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">自我介绍</text>
          <textarea v-model="formData.selfIntroduction" class="form-textarea" placeholder="介绍一下自己的性格和特点" maxlength="500" />
        </view>

        <view class="form-item">
          <text class="form-label">内心独白</text>
          <textarea v-model="formData.innerMonologue" class="form-textarea" placeholder="分享你的内心想法" maxlength="500" />
        </view>
      </template>

      <!-- 家庭背景 -->
      <template v-if="section === 'family'">
        <view class="form-item">
          <text class="form-label">籍贯</text>
          <input v-model="formData.nativePlace" class="form-input" placeholder="请输入籍贯" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">家庭成员数</text>
          <input v-model.number="formData.familyMembers" type="number" class="form-input" placeholder="请输入家庭成员数" />
        </view>

        <view class="form-item">
          <text class="form-label">排行</text>
          <input v-model="formData.familyRanking" class="form-input" placeholder="例如：老大、老二" maxlength="10" />
        </view>

        <view class="form-item">
          <text class="form-label">父母职业</text>
          <input v-model="formData.parentsOccupation" class="form-input" placeholder="请输入父母职业" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">是否独生子女</text>
          <switch :checked="formData.isOnlyChild" @change="formData.isOnlyChild = $event.detail.value" color="#667eea" />
        </view>

        <view class="form-item">
          <text class="form-label">家庭经济</text>
          <view class="option-group">
            <view
              v-for="item in familyEconomicOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.familyEconomic === item }"
              @tap="formData.familyEconomic = item"
            >
              {{ item }}
            </view>
          </view>
        </view>
      </template>

      <!-- 婚恋状况 -->
      <template v-if="section === 'marital'">
        <view class="form-item">
          <text class="form-label">婚姻状况</text>
          <view class="option-group">
            <view
              v-for="item in maritalStatusOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.maritalStatus === item }"
              @tap="onMaritalStatusChange(item)"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">是否有孩子</text>
          <switch :checked="formData.hasChildren" @change="onChildrenChange" color="#667eea" />
        </view>

        <view v-if="formData.hasChildren" class="form-item">
          <text class="form-label">孩子数量</text>
          <input v-model.number="formData.childrenCount" type="number" class="form-input" placeholder="请输入孩子数量" />
        </view>

        <view v-if="formData.hasChildren" class="form-item">
          <text class="form-label">孩子情况</text>
          <input v-model="formData.childrenInfo" class="form-input" placeholder="例如：男孩5岁" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">结婚计划</text>
          <view class="option-group">
            <view
              v-for="item in marriagePlanOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.marriagePlan === item }"
              @tap="formData.marriagePlan = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">房产</text>
          <view class="option-group">
            <view
              v-for="item in housingOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.housingStatus === item }"
              @tap="formData.housingStatus = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">车辆</text>
          <view class="option-group">
            <view
              v-for="item in carOptions"
              :key="item"
              class="option-item"
              :class="{ active: formData.carStatus === item }"
              @tap="formData.carStatus = item"
            >
              {{ item }}
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 保存按钮 -->
    <view class="save-button" @tap="handleSave">
      <text class="save-text">保存</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updateProfile } from '@/api/profile'
import type { UserProfile } from '@/api/profile'

// 获取URL参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1] as any
const section = ref(currentPage.options?.section || 'basic')

// 表单数据
const formData = ref<Partial<UserProfile>>({
  personalityTags: [],
})

// 步骤配置
const sectionConfigs: Record<string, { title: string; description: string }> = {
  basic: { title: '基础信息', description: '完善基本资料，让别人更了解你' },
  appearance: { title: '外貌体征', description: '描述你的外貌特征' },
  education: { title: '教育职业', description: '分享你的教育和职业背景' },
  lifestyle: { title: '生活方式', description: '展示你的生活习惯和方式' },
  personality: { title: '性格兴趣', description: '展现你的性格和兴趣爱好' },
  family: { title: '家庭背景', description: '介绍你的家庭情况' },
  marital: { title: '婚恋状况', description: '说明你的婚恋和资产状况' },
}

const sectionConfig = computed(() => sectionConfigs[section.value] || sectionConfigs.basic)

// 选项数据
const educationOptions = ['高中', '大专', '本科', '硕士', '博士']
const bodyTypeOptions = ['偏瘦', '标准', '健壮', '偏胖']
const zodiacOptions = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
const chineseZodiacOptions = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const faceShapeOptions = ['圆脸', '方脸', '瓜子脸', '鹅蛋脸', '长脸']
const smokingOptions = ['不吸烟', '偶尔吸', '经常吸']
const drinkingOptions = ['不喝酒', '社交饮酒', '经常喝']
const sleepOptions = ['早睡早起', '正常作息', '夜猫子']
const exerciseOptions = ['不运动', '偶尔运动', '经常运动', '每天运动']
const dietOptions = ['清淡', '正常', '重口味', '素食']
const cookingOptions = ['不会做饭', '会做简单的', '厨艺不错', '大厨级别']
const personalityTagOptions = ['开朗', '内向', '幽默', '温柔', '成熟', '活泼', '稳重', '浪漫', '理性', '感性', '独立', '体贴', '乐观', '细心', '真诚']
const familyEconomicOptions = ['一般', '小康', '富裕', '优越']
const maritalStatusOptions = ['未婚', '离异', '丧偶']
const marriagePlanOptions = ['一年内', '两年内', '三年内', '顺其自然', '暂无计划']
const housingOptions = ['无房', '租房', '有房无贷', '有房有贷']
const carOptions = ['无车', '有车']

// 计算选中的索引
const educationIndex = computed(() => educationOptions.indexOf(formData.value.education || ''))
const zodiacIndex = computed(() => zodiacOptions.indexOf(formData.value.zodiacSign || ''))
const chineseZodiacIndex = computed(() => chineseZodiacOptions.indexOf(formData.value.chineseZodiac || ''))

// 最大日期（18岁）
const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().split('T')[0]
})

// 事件处理
const onDateChange = (e: any) => {
  formData.value.birthDate = e.detail.value
}

const onEducationChange = (e: any) => {
  formData.value.education = educationOptions[e.detail.value]
}

const onZodiacChange = (e: any) => {
  formData.value.zodiacSign = zodiacOptions[e.detail.value]
}

const onChineseZodiacChange = (e: any) => {
  formData.value.chineseZodiac = chineseZodiacOptions[e.detail.value]
}

const onPetsChange = (e: any) => {
  formData.value.hasPets = e.detail.value
  if (!e.detail.value) {
    formData.value.petType = undefined
  }
}

const onChildrenChange = (e: any) => {
  formData.value.hasChildren = e.detail.value
  if (!e.detail.value) {
    formData.value.childrenCount = undefined
    formData.value.childrenInfo = undefined
  }
}

const onMaritalStatusChange = (status: string) => {
  formData.value.maritalStatus = status
}

const toggleTag = (tag: string) => {
  if (!formData.value.personalityTags) {
    formData.value.personalityTags = []
  }

  const index = formData.value.personalityTags.indexOf(tag)
  if (index > -1) {
    formData.value.personalityTags.splice(index, 1)
  } else {
    if (formData.value.personalityTags.length >= 5) {
      uni.showToast({
        title: '最多选择5个标签',
        icon: 'none',
      })
      return
    }
    formData.value.personalityTags.push(tag)
  }
}

// 表单验证
const validateForm = (): boolean => {
  if (section.value === 'basic') {
    if (!formData.value.realName?.trim()) {
      uni.showToast({ title: '请输入真实姓名', icon: 'none' })
      return false
    }
    if (!formData.value.birthDate) {
      uni.showToast({ title: '请选择出生日期', icon: 'none' })
      return false
    }
    if (!formData.value.residence?.trim()) {
      uni.showToast({ title: '请输入居住地', icon: 'none' })
      return false
    }
    if (!formData.value.height || formData.value.height < 100 || formData.value.height > 250) {
      uni.showToast({ title: '请输入有效的身高', icon: 'none' })
      return false
    }
    if (!formData.value.occupation?.trim()) {
      uni.showToast({ title: '请输入职业', icon: 'none' })
      return false
    }
    if (!formData.value.education) {
      uni.showToast({ title: '请选择学历', icon: 'none' })
      return false
    }
  }

  return true
}

// 保存
const handleSave = async () => {
  if (!validateForm()) return

  try {
    uni.showLoading({ title: '保存中...' })

    await updateProfile(formData.value)

    uni.hideLoading()

    uni.showToast({
      title: '保存成功，+20积分',
      icon: 'success',
      duration: 2000,
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.hideLoading()
    console.error('[EditSection] 保存失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
    })
  }
}

onMounted(() => {
  console.log('[EditSection] 当前步骤:', section.value)
})
</script>

<style scoped lang="scss">
.edit-section-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 140rpx;
}

// ========== 顶部卡片 ==========
.header-card {
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12rpx;
}

.section-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

// ========== 表单卡片 ==========
.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }

  &.required .form-label::before {
    content: '*';
    color: #ff4d4f;
    margin-right: 4rpx;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.form-picker {
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;

  &.placeholder {
    color: #999;
  }
}

// ========== 选项组 ==========
.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.option-item {
  padding: 16rpx 32rpx;
  background: #f5f5f5;
  border: 2rpx solid transparent;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;

  &.active {
    background: #667eea;
    border-color: #667eea;
    color: #fff;
  }
}

// ========== 标签组 ==========
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border: 2rpx solid transparent;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: #fff;
  }
}

// ========== 保存按钮 ==========
.save-button {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 680rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.save-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 500;
}
</style>
