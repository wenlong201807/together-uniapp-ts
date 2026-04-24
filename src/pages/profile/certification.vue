<template>
  <view class="certification-container">
    <!-- 顶部统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ approvedCount }}</text>
        <text class="stat-label">已认证</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ pendingCount }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ totalTypes }}</text>
        <text class="stat-label">总数</text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view v-if="requiredNotCompleted" class="tips-card">
      <text class="tips-icon">⚠️</text>
      <view class="tips-content">
        <text class="tips-title">请完成必填认证</text>
        <text class="tips-desc">身份认证和照片认证是必填项</text>
      </view>
    </view>

    <!-- 认证列表 -->
    <view class="certification-grid">
      <view
        v-for="cert in certificationTypes"
        :key="cert.type"
        class="cert-card"
        @tap="handleCardClick(cert)"
      >
        <view class="cert-header">
          <text class="cert-icon">{{ cert.icon }}</text>
          <view
            class="cert-badge"
            :class="getStatusClass(cert.type)"
          >
            {{ getStatusText(cert.type) }}
          </view>
        </view>
        <view class="cert-body">
          <text class="cert-name">{{ cert.name }}</text>
          <text v-if="cert.required" class="cert-required">必填</text>
        </view>
        <text class="cert-desc">{{ cert.description }}</text>
        <view class="cert-footer">
          <button
            class="cert-btn"
            :class="getBtnClass(cert.type)"
            @tap.stop="handleAction(cert)"
          >
            {{ getBtnText(cert.type) }}
          </button>
        </view>
      </view>
    </view>

    <!-- 申请弹窗 -->
    <view v-if="showApplyModal" class="modal-overlay" @tap="closeApplyModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentCert?.name }}</text>
          <text class="modal-close" @tap="closeApplyModal">✕</text>
        </view>

        <view class="modal-body">
          <!-- 图片上传 -->
          <view class="form-item">
            <text class="form-label">
              认证材料（最多{{ currentCert?.maxImages }}张）
            </text>
            <view class="upload-area">
              <view
                v-for="(img, index) in applyForm.images"
                :key="index"
                class="upload-item"
              >
                <image :src="img" class="upload-image" mode="aspectFill" />
                <view class="upload-delete" @tap="removeImage(index)">
                  <text class="delete-icon">✕</text>
                </view>
              </view>
              <view
                v-if="applyForm.images.length < (currentCert?.maxImages || 1)"
                class="upload-btn"
                @tap="chooseImage"
              >
                <text class="upload-icon">+</text>
                <text class="upload-text">上传图片</text>
              </view>
            </view>
          </view>

          <!-- 备注说明 -->
          <view class="form-item">
            <text class="form-label">备注说明（选填）</text>
            <textarea
              v-model="applyForm.remark"
              class="form-textarea"
              placeholder="请输入备注说明"
              maxlength="200"
            />
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @tap="closeApplyModal">取消</button>
          <button
            class="btn-confirm"
            :disabled="!canSubmit"
            @tap="handleSubmit"
          >
            提交申请
          </button>
        </view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <view v-if="showDetailModal" class="modal-overlay" @tap="closeDetailModal">
      <view class="modal-content detail-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">认证详情</text>
          <text class="modal-close" @tap="closeDetailModal">✕</text>
        </view>

        <view class="modal-body">
          <view v-if="currentDetail" class="detail-content">
            <!-- 认证材料 -->
            <view class="detail-section">
              <text class="detail-label">认证材料</text>
              <view class="detail-images">
                <image
                  v-for="(img, index) in currentDetail.images"
                  :key="index"
                  :src="img"
                  class="detail-image"
                  mode="aspectFill"
                  @tap="previewImage(img, currentDetail.images)"
                />
              </view>
            </view>

            <!-- 认证状态 -->
            <view class="detail-section">
              <text class="detail-label">认证状态</text>
              <view class="status-row">
                <view
                  class="status-badge"
                  :class="getStatusClass(currentDetail.type)"
                >
                  {{ getStatusText(currentDetail.type) }}
                </view>
              </view>
            </view>

            <!-- 备注说明 -->
            <view v-if="currentDetail.remark" class="detail-section">
              <text class="detail-label">备注说明</text>
              <text class="detail-text">{{ currentDetail.remark }}</text>
            </view>

            <!-- 拒绝原因 -->
            <view v-if="currentDetail.rejectReason" class="detail-section">
              <text class="detail-label">拒绝原因</text>
              <view class="reject-reason">
                <text class="reject-text">{{ currentDetail.rejectReason }}</text>
              </view>
            </view>

            <!-- 审核时间 -->
            <view v-if="currentDetail.reviewedAt" class="detail-section">
              <text class="detail-label">审核时间</text>
              <text class="detail-text">{{ formatTime(currentDetail.reviewedAt) }}</text>
            </view>

            <!-- 申请时间 -->
            <view class="detail-section">
              <text class="detail-label">申请时间</text>
              <text class="detail-text">{{ formatTime(currentDetail.createdAt) }}</text>
            </view>
          </view>
        </view>

        <view v-if="currentDetail?.status === 'rejected'" class="modal-footer">
          <button class="btn-confirm full" @tap="handleReapply">
            重新申请
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getCertifications,
  applyCertification,
  getCertificationDetail,
} from '@/api/profile'
import type { Certification, CertificationType } from '@/api/profile'

// 认证类型配置
const certificationTypes = [
  {
    type: 'id_card' as CertificationType,
    name: '身份认证',
    icon: '🪪',
    description: '上传身份证正反面，提升账号可信度',
    required: true,
    maxImages: 2,
  },
  {
    type: 'education' as CertificationType,
    name: '学历认证',
    icon: '🎓',
    description: '上传学历证书，展示教育背景',
    required: false,
    maxImages: 1,
  },
  {
    type: 'occupation' as CertificationType,
    name: '职业认证',
    icon: '💼',
    description: '上传工作证明，展示职业信息',
    required: false,
    maxImages: 1,
  },
  {
    type: 'income' as CertificationType,
    name: '收入认证',
    icon: '💰',
    description: '上传收入证明，提升匹配质量',
    required: false,
    maxImages: 1,
  },
  {
    type: 'housing' as CertificationType,
    name: '房产认证',
    icon: '🏠',
    description: '上传房产证，展示资产状况',
    required: false,
    maxImages: 1,
  },
  {
    type: 'car' as CertificationType,
    name: '车辆认证',
    icon: '🚗',
    description: '上传行驶证，展示资产状况',
    required: false,
    maxImages: 1,
  },
  {
    type: 'photo' as CertificationType,
    name: '照片认证',
    icon: '📸',
    description: '上传真人照片，提升真实性',
    required: true,
    maxImages: 1,
  },
]

// 认证列表
const certifications = ref<Certification[]>([])

// 弹窗状态
const showApplyModal = ref(false)
const showDetailModal = ref(false)

// 当前操作的认证类型
const currentCert = ref<typeof certificationTypes[0] | null>(null)
const currentDetail = ref<Certification | null>(null)

// 申请表单
const applyForm = ref({
  images: [] as string[],
  remark: '',
})

// 统计数据
const approvedCount = computed(() => {
  return certifications.value.filter((c) => c.status === 'approved').length
})

const pendingCount = computed(() => {
  return certifications.value.filter((c) => c.status === 'pending').length
})

const totalTypes = computed(() => certificationTypes.length)

// 必填认证未完成
const requiredNotCompleted = computed(() => {
  const requiredTypes = certificationTypes.filter((c) => c.required).map((c) => c.type)
  return requiredTypes.some((type) => {
    const cert = certifications.value.find((c) => c.type === type)
    return !cert || cert.status !== 'approved'
  })
})

// 是否可以提交
const canSubmit = computed(() => {
  return applyForm.value.images.length > 0
})

// 加载认证列表
onMounted(async () => {
  await loadCertifications()
})

const loadCertifications = async () => {
  try {
    const res = await getCertifications()
    certifications.value = res.data
  } catch (error: any) {
    console.error('[Certification] 加载失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  }
}

// 获取认证状态
const getCertStatus = (type: CertificationType) => {
  return certifications.value.find((c) => c.type === type)
}

// 获取状态样式类
const getStatusClass = (type: CertificationType) => {
  const cert = getCertStatus(type)
  if (!cert) return 'status-none'
  return `status-${cert.status}`
}

// 获取状态文本
const getStatusText = (type: CertificationType) => {
  const cert = getCertStatus(type)
  if (!cert) return '未申请'
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return statusMap[cert.status]
}

// 获取按钮样式类
const getBtnClass = (type: CertificationType) => {
  const cert = getCertStatus(type)
  if (!cert) return 'btn-apply'
  if (cert.status === 'rejected') return 'btn-reapply'
  return 'btn-view'
}

// 获取按钮文本
const getBtnText = (type: CertificationType) => {
  const cert = getCertStatus(type)
  if (!cert) return '申请认证'
  if (cert.status === 'rejected') return '重新申请'
  return '查看详情'
}

// 卡片点击
const handleCardClick = (cert: typeof certificationTypes[0]) => {
  const status = getCertStatus(cert.type)
  if (status) {
    handleViewDetail(cert.type)
  } else {
    handleApply(cert)
  }
}

// 操作按钮点击
const handleAction = (cert: typeof certificationTypes[0]) => {
  const status = getCertStatus(cert.type)
  if (!status) {
    handleApply(cert)
  } else if (status.status === 'rejected') {
    handleApply(cert)
  } else {
    handleViewDetail(cert.type)
  }
}

// 申请认证
const handleApply = (cert: typeof certificationTypes[0]) => {
  currentCert.value = cert
  applyForm.value = {
    images: [],
    remark: '',
  }
  showApplyModal.value = true
}

// 查看详情
const handleViewDetail = async (type: CertificationType) => {
  const cert = getCertStatus(type)
  if (!cert) return

  try {
    const res = await getCertificationDetail(cert.id)
    currentDetail.value = res.data
    showDetailModal.value = true
  } catch (error: any) {
    console.error('[Certification] 获取详情失败:', error)
    uni.showToast({
      title: error.message || '获取详情失败',
      icon: 'none',
    })
  }
}

// 选择图片
const chooseImage = () => {
  const maxImages = currentCert.value?.maxImages || 1
  const remaining = maxImages - applyForm.value.images.length

  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 这里应该调用文件上传接口，暂时使用本地路径
      applyForm.value.images.push(...res.tempFilePaths)
    },
  })
}

// 删除图片
const removeImage = (index: number) => {
  applyForm.value.images.splice(index, 1)
}

// 提交申请
const handleSubmit = async () => {
  if (!canSubmit.value || !currentCert.value) return

  try {
    uni.showLoading({ title: '提交中...' })

    await applyCertification({
      type: currentCert.value.type,
      images: applyForm.value.images,
      remark: applyForm.value.remark || undefined,
    })

    uni.hideLoading()
    uni.showToast({
      title: '提交成功',
      icon: 'success',
    })

    closeApplyModal()
    await loadCertifications()
  } catch (error: any) {
    uni.hideLoading()
    console.error('[Certification] 提交失败:', error)
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    })
  }
}

// 重新申请
const handleReapply = () => {
  if (!currentDetail.value) return

  const certType = certificationTypes.find((c) => c.type === currentDetail.value?.type)
  if (certType) {
    closeDetailModal()
    handleApply(certType)
  }
}

// 关闭申请弹窗
const closeApplyModal = () => {
  showApplyModal.value = false
  currentCert.value = null
  applyForm.value = {
    images: [],
    remark: '',
  }
}

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false
  currentDetail.value = null
}

// 预览图片
const previewImage = (current: string, urls: string[]) => {
  uni.previewImage({
    current,
    urls,
  })
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped lang="scss">
.certification-container {
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

// ========== 认证网格 ==========
.certification-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.cert-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.cert-icon {
  font-size: 48rpx;
}

.cert-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;

  &.status-none {
    background: #f5f5f5;
    color: #999;
  }

  &.status-pending {
    background: #fff3e0;
    color: #f57c00;
  }

  &.status-approved {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.status-rejected {
    background: #ffebee;
    color: #c62828;
  }
}

.cert-body {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.cert-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.cert-required {
  padding: 2rpx 8rpx;
  background: #ff5252;
  color: #fff;
  font-size: 20rpx;
  border-radius: 4rpx;
}

.cert-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  flex: 1;
}

.cert-footer {
  margin-top: auto;
}

.cert-btn {
  width: 100%;
  height: 64rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    border: none;
  }

  &.btn-apply {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.btn-reapply {
    background: #fff3e0;
    color: #f57c00;
  }

  &.btn-view {
    background: #f5f5f5;
    color: #666;
  }
}

// ========== 弹窗 ==========
.modal-overlay {
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

.modal-content {
  width: 680rpx;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.detail-modal {
    max-height: 85vh;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
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

// 图片上传
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 180rpx;
  height: 180rpx;
}

.upload-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.upload-delete {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff5252;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #fff;
  font-size: 24rpx;
}

.upload-btn {
  width: 180rpx;
  height: 180rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}

// 详情内容
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-label {
  font-size: 26rpx;
  color: #999;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.detail-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 12rpx;
}

.status-row {
  display: flex;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.detail-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.reject-reason {
  padding: 24rpx;
  background: #ffebee;
  border-radius: 12rpx;
}

.reject-text {
  font-size: 28rpx;
  color: #c62828;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  border: none;

  &::after {
    border: none;
  }

  &.full {
    flex: none;
    width: 100%;
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  &:disabled {
    opacity: 0.5;
  }
}
</style>
