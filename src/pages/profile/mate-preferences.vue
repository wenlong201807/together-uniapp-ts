<template>
  <view class="mate-preferences-container">
    <!-- 顶部提示 -->
    <view class="tips-card">
      <text class="tips-icon">💝</text>
      <view class="tips-content">
        <text class="tips-title">设置择偶要求</text>
        <text class="tips-desc">精准的择偶要求可以提高匹配成功率</text>
      </view>
    </view>

    <!-- 表单 -->
    <view class="form-container">
      <!-- 基础要求 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">基础要求</text>
        </view>

        <view class="form-item">
          <text class="form-label">年龄范围</text>
          <view class="range-input">
            <input
              v-model="ageMinStr"
              type="text"
              class="range-value"
              placeholder="最小"
              maxlength="3"
            />
            <text class="range-separator">-</text>
            <input
              v-model="ageMaxStr"
              type="text"
              class="range-value"
              placeholder="最大"
              maxlength="3"
            />
            <text class="range-unit">岁</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">身高范围</text>
          <view class="range-input">
            <input
              v-model="heightMinStr"
              type="number"
              class="range-value"
              placeholder="最小"
              maxlength="3"
            />
            <text class="range-separator">-</text>
            <input
              v-model="heightMaxStr"
              type="number"
              class="range-value"
              placeholder="最大"
              maxlength="3"
            />
            <text class="range-unit">cm</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">学历要求</text>
          <picker
            :value="educationIndex"
            :range="educationOptions"
            @change="handleEducationChange"
          >
            <view class="picker-value">
              {{ formData.educationRequirement || '请选择' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">收入要求</text>
          <picker
            :value="incomeIndex"
            :range="incomeOptions"
            @change="handleIncomeChange"
          >
            <view class="picker-value">
              {{ formData.incomeRequirement || '请选择' }}
            </view>
          </picker>
        </view>
      </view>

      <!-- 地域要求 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">地域要求</text>
        </view>

        <view class="form-item">
          <text class="form-label">期望城市</text>
          <input
            v-model="formData.locationRequirement"
            type="text"
            class="form-input"
            placeholder="例如：北京、上海"
            cursor-spacing="20"
          />
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">接受异地恋</text>
            <switch
              :checked="formData.acceptLongDistance"
              @change="formData.acceptLongDistance = $event.detail.value"
              color="#667eea"
            />
          </view>
        </view>
      </view>

      <!-- 婚恋要求 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">婚恋要求</text>
        </view>

        <view class="form-item">
          <text class="form-label">婚姻状况</text>
          <picker
            :value="maritalIndex"
            :range="maritalOptions"
            @change="handleMaritalChange"
          >
            <view class="picker-value">
              {{ formData.maritalStatusRequirement || '请选择' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">接受对方有孩子</text>
            <switch
              :checked="formData.acceptChildren"
              @change="formData.acceptChildren = $event.detail.value"
              color="#667eea"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">购房要求</text>
          <picker
            :value="housingIndex"
            :range="housingOptions"
            @change="handleHousingChange"
          >
            <view class="picker-value">
              {{ formData.housingRequirement || '请选择' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">购车要求</text>
          <picker
            :value="carIndex"
            :range="carOptions"
            @change="handleCarChange"
          >
            <view class="picker-value">
              {{ formData.carRequirement || '请选择' }}
            </view>
          </picker>
        </view>
      </view>

      <!-- 生活方式要求 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">生活方式</text>
        </view>

        <view class="form-item">
          <text class="form-label">吸烟要求</text>
          <picker
            :value="smokingIndex"
            :range="smokingOptions"
            @change="handleSmokingChange"
          >
            <view class="picker-value">
              {{ formData.smokingRequirement || '请选择' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">饮酒要求</text>
          <picker
            :value="drinkingIndex"
            :range="drinkingOptions"
            @change="handleDrinkingChange"
          >
            <view class="picker-value">
              {{ formData.drinkingRequirement || '请选择' }}
            </view>
          </picker>
        </view>
      </view>

      <!-- 其他要求 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">其他要求</text>
        </view>

        <view class="form-item">
          <text class="form-label">其他要求</text>
          <textarea
            v-model="formData.otherRequirements"
            class="form-textarea"
            placeholder="例如：性格开朗、有责任心..."
            maxlength="200"
          />
          <view class="char-count">
            <text>{{ formData.otherRequirements?.length || 0 }}/200</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">理想型描述</text>
          <textarea
            v-model="formData.idealTypeDescription"
            class="form-textarea"
            placeholder="描述一下你的理想型..."
            maxlength="500"
          />
          <view class="char-count">
            <text>{{ formData.idealTypeDescription?.length || 0 }}/500</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-button">
      <button class="btn-save" :loading="loading" @tap="handleSave">
        {{ loading ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMatePreferences, updateMatePreferences } from '@/api/profile'
import type { UserMatePreference } from '@/api/profile'

// 表单数据
const formData = ref<Partial<UserMatePreference>>({
  ageMin: undefined,
  ageMax: undefined,
  heightMin: undefined,
  heightMax: undefined,
  educationRequirement: '',
  incomeRequirement: '',
  locationRequirement: '',
  acceptLongDistance: false,
  maritalStatusRequirement: '',
  acceptChildren: false,
  housingRequirement: '',
  carRequirement: '',
  smokingRequirement: '',
  drinkingRequirement: '',
  otherRequirements: '',
  idealTypeDescription: '',
})

// 字符串形式的输入值（用于输入框绑定）
const ageMinStr = ref('')
const ageMaxStr = ref('')
const heightMinStr = ref('')
const heightMaxStr = ref('')

// 加载状态
const loading = ref(false)

// 选项数据
const educationOptions = ['不限', '高中及以下', '大专', '本科', '硕士', '博士']
const incomeOptions = ['不限', '5k以下', '5k-10k', '10k-20k', '20k-30k', '30k以上']
const maritalOptions = ['不限', '未婚', '离异', '丧偶']
const housingOptions = ['不限', '已购房', '计划购房', '租房']
const carOptions = ['不限', '已购车', '计划购车', '不需要']
const smokingOptions = ['不限', '不吸烟', '偶尔吸烟', '经常吸烟']
const drinkingOptions = ['不限', '不饮酒', '偶尔饮酒', '经常饮酒']

// 选中索引
const educationIndex = computed(() => educationOptions.indexOf(formData.value.educationRequirement || '不限'))
const incomeIndex = computed(() => incomeOptions.indexOf(formData.value.incomeRequirement || '不限'))
const maritalIndex = computed(() => maritalOptions.indexOf(formData.value.maritalStatusRequirement || '不限'))
const housingIndex = computed(() => housingOptions.indexOf(formData.value.housingRequirement || '不限'))
const carIndex = computed(() => carOptions.indexOf(formData.value.carRequirement || '不限'))
const smokingIndex = computed(() => smokingOptions.indexOf(formData.value.smokingRequirement || '不限'))
const drinkingIndex = computed(() => drinkingOptions.indexOf(formData.value.drinkingRequirement || '不限'))

// 加载数据
onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    const res = await getMatePreferences()
    if (res.data) {
      formData.value = res.data
      // 将数字转换为字符串用于输入框显示
      ageMinStr.value = res.data.ageMin ? String(res.data.ageMin) : ''
      ageMaxStr.value = res.data.ageMax ? String(res.data.ageMax) : ''
      heightMinStr.value = res.data.heightMin ? String(res.data.heightMin) : ''
      heightMaxStr.value = res.data.heightMax ? String(res.data.heightMax) : ''
    }
  } catch (error: any) {
    console.error('[MatePreferences] 加载失败:', error)
  }
}

// 选择器变化处理
const handleEducationChange = (e: any) => {
  formData.value.educationRequirement = educationOptions[e.detail.value]
}

const handleIncomeChange = (e: any) => {
  formData.value.incomeRequirement = incomeOptions[e.detail.value]
}

const handleMaritalChange = (e: any) => {
  formData.value.maritalStatusRequirement = maritalOptions[e.detail.value]
}

const handleHousingChange = (e: any) => {
  formData.value.housingRequirement = housingOptions[e.detail.value]
}

const handleCarChange = (e: any) => {
  formData.value.carRequirement = carOptions[e.detail.value]
}

const handleSmokingChange = (e: any) => {
  formData.value.smokingRequirement = smokingOptions[e.detail.value]
}

const handleDrinkingChange = (e: any) => {
  formData.value.drinkingRequirement = drinkingOptions[e.detail.value]
}

// 保存
const handleSave = async () => {
  // 将字符串转换为数字
  formData.value.ageMin = ageMinStr.value ? parseInt(ageMinStr.value) : undefined
  formData.value.ageMax = ageMaxStr.value ? parseInt(ageMaxStr.value) : undefined
  formData.value.heightMin = heightMinStr.value ? parseInt(heightMinStr.value) : undefined
  formData.value.heightMax = heightMaxStr.value ? parseInt(heightMaxStr.value) : undefined

  // 验证年龄范围
  if (formData.value.ageMin && formData.value.ageMax) {
    if (formData.value.ageMin > formData.value.ageMax) {
      uni.showToast({
        title: '年龄范围不正确',
        icon: 'none',
      })
      return
    }
  }

  // 验证年龄合理性
  if (formData.value.ageMin && formData.value.ageMin < 18) {
    uni.showToast({
      title: '年龄最小值不能小于18岁',
      icon: 'none',
    })
    return
  }

  if (formData.value.ageMax && formData.value.ageMax > 100) {
    uni.showToast({
      title: '年龄最大值不能超过100岁',
      icon: 'none',
    })
    return
  }

  // 验证身高范围
  if (formData.value.heightMin && formData.value.heightMax) {
    if (formData.value.heightMin > formData.value.heightMax) {
      uni.showToast({
        title: '身高范围不正确',
        icon: 'none',
      })
      return
    }
  }

  // 验证身高合理性
  if (formData.value.heightMin && formData.value.heightMin < 140) {
    uni.showToast({
      title: '身高最小值不能小于140cm',
      icon: 'none',
    })
    return
  }

  if (formData.value.heightMax && formData.value.heightMax > 220) {
    uni.showToast({
      title: '身高最大值不能超过220cm',
      icon: 'none',
    })
    return
  }

  loading.value = true

  try {
    // 只提交需要更新的字段，过滤掉 id、userId、createdAt、updatedAt
    const updateData = {
      ageMin: formData.value.ageMin,
      ageMax: formData.value.ageMax,
      heightMin: formData.value.heightMin,
      heightMax: formData.value.heightMax,
      educationRequirement: formData.value.educationRequirement,
      incomeRequirement: formData.value.incomeRequirement,
      locationRequirement: formData.value.locationRequirement,
      acceptLongDistance: formData.value.acceptLongDistance,
      maritalStatusRequirement: formData.value.maritalStatusRequirement,
      acceptChildren: formData.value.acceptChildren,
      housingRequirement: formData.value.housingRequirement,
      carRequirement: formData.value.carRequirement,
      smokingRequirement: formData.value.smokingRequirement,
      drinkingRequirement: formData.value.drinkingRequirement,
      otherRequirements: formData.value.otherRequirements,
      idealTypeDescription: formData.value.idealTypeDescription,
    }

    await updateMatePreferences(updateData)

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    console.error('[MatePreferences] 保存失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.mate-preferences-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

// ========== 提示卡片 ==========
.tips-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #ffe0f0 0%, #ffc0e0 100%);
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
  color: #c2185b;
}

.tips-desc {
  font-size: 24rpx;
  color: #e91e63;
}

// ========== 表单 ==========
.form-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.section-title {
  margin-bottom: 24rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.range-value {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  // padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  text-align: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &:focus {
    background: #fff;
    border-color: #667eea;
  }
}

.range-separator {
  font-size: 28rpx;
  color: #999;
}

.range-unit {
  font-size: 28rpx;
  color: #999;
}

.picker-value {
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.form-input {
  width: 100%;
  height: 68rpx;
  padding-left: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &:focus {
    background: #fff;
    border-color: #667eea;
  }
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

// ========== 保存按钮 ==========
.save-button {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48rpx);
}

.btn-save {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);

  &::after {
    border: none;
  }
}
</style>
