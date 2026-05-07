<template>
  <view class="certification-container">
    <!-- 加载状态 -->
    <view v-if="loading && !hasLoadedOnce" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="loadError && !hasLoadedOnce" class="error-state">
      <text class="error-icon">⚠️</text>
      <text class="error-text">加载失败</text>
      <button class="retry-btn" @click="retryLoad">重试</button>
    </view>

    <!-- 正常内容 -->
    <template v-else>
      <view class="cert-types" v-if="certTypes.length > 0">
        <view
          class="cert-type-item"
          v-for="type in certTypes"
          :key="type.code"
          @click="goToApply(type.code)"
        >
          <view
            class="cert-icon"
            :class="{ 'has-image': getCertImage(type.code) }"
          >
            <image
              v-if="getCertImage(type.code)"
              v-img-proxy="getCertImage(type.code)"
              mode="aspectFill"
              class="cert-thumbnail"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <text v-else>{{ '📋' }}</text>
          </view>
          <view class="cert-info">
            <view class="cert-name-row">
              <text class="cert-name">{{ type.name }}</text>
              <text
                v-if="getCertStatus(type.code)"
                class="cert-badge"
                :style="{ color: getCertStatus(type.code)?.color }"
              >
                {{ getCertStatus(type.code)?.text }}
              </text>
            </view>
            <text class="cert-desc">{{ type.description }}</text>
          </view>
          <text class="cert-arrow">›</text>
        </view>
      </view>
      <view class="empty" v-else-if="!loading">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无可用认证类型</text>
      </view>

      <view class="my-cert" v-if="myCerts?.length > 0">
        <view class="section-title">我的认证</view>
        <view class="cert-item" v-for="cert in myCerts" :key="cert.id">
          <view class="cert-info">
            <text class="cert-name">{{ getCertTypeName(cert.type) }}</text>
            <text class="cert-time"
              >申请时间: {{ formatTime(cert.createdAt) }}</text
            >
          </view>
          <text class="cert-status" :class="['status-' + cert.status]">
            {{ getStatusText(cert.status) }}
          </text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAuthStore } from '@/stores';
import {
  certificationApi,
  type CertificationType,
  type Certification,
} from '@/api/modules/certification';

// 常量定义
const CERT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const;

const STATUS_PRIORITY = {
  [CERT_STATUS.APPROVED]: 3,
  [CERT_STATUS.PENDING]: 2,
  [CERT_STATUS.REJECTED]: 1
} as const;

const STATUS_TEXT = {
  [CERT_STATUS.PENDING]: '待审核',
  [CERT_STATUS.APPROVED]: '已通过',
  [CERT_STATUS.REJECTED]: '已拒绝'
} as const;

const STATUS_COLOR = {
  [CERT_STATUS.PENDING]: '#faad14',
  [CERT_STATUS.APPROVED]: '#52c41a',
  [CERT_STATUS.REJECTED]: '#ff4d4f'
} as const;

const STATUS_BADGE = {
  [CERT_STATUS.APPROVED]: { text: '已认证', color: STATUS_COLOR[CERT_STATUS.APPROVED] },
  [CERT_STATUS.PENDING]: { text: '审核中', color: STATUS_COLOR[CERT_STATUS.PENDING] },
  [CERT_STATUS.REJECTED]: { text: '已拒绝', color: STATUS_COLOR[CERT_STATUS.REJECTED] }
} as const;

const authStore = useAuthStore();

const certTypes = ref<CertificationType[]>([]);
const myCerts = ref<Certification[]>([]);
const loading = ref(false);
const loadError = ref(false);
const hasLoadedOnce = ref(false);

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    uni.navigateBack();
    return;
  }
  loadData();
});

// 监听页面显示，仅在首次加载后才刷新
onShow(() => {
  if (authStore.isLoggedIn && hasLoadedOnce.value) {
    loadData();
  }
});

const loadData = async () => {
  if (loading.value) return;

  loading.value = true;
  loadError.value = false;

  try {
    // 使用 allSettled 允许部分成功，避免一个失败导致全部失败
    const results = await Promise.allSettled([
      loadCertTypes(),
      loadMyCerts()
    ]);

    // 检查是否有失败的请求
    const failedResults = results.filter(r => r.status === 'rejected');

    if (failedResults.length > 0) {
      console.error('部分数据加载失败:', failedResults);

      // 如果全部失败，显示错误状态
      if (failedResults.length === results.length) {
        loadError.value = true;
      } else {
        // 部分失败，显示提示但不阻断页面
        uni.showToast({
          title: '部分数据加载失败',
          icon: 'none',
          duration: 2000
        });
      }
    }

    hasLoadedOnce.value = true;
  } finally {
    loading.value = false;
  }
};

const loadCertTypes = async () => {
  try {
    const res = await certificationApi.getTypes();
    if (import.meta.env.DEV) {
      console.log('Cert types response:', res);
    }
    certTypes.value = res.data.list || [];
  } catch (error) {
    console.error('Failed to load cert types:', error);
    // 不再向上抛出，让 Promise.allSettled 处理
    throw error;
  }
};

const loadMyCerts = async () => {
  try {
    const res = await certificationApi.getMyList();
    if (import.meta.env.DEV) {
      console.log('My certs response:', res);
    }
    myCerts.value = res.data.list || [];
  } catch (error) {
    console.error('Failed to load my certs:', error);
    // 不再向上抛出，让 Promise.allSettled 处理
    throw error;
  }
};

const getCertTypeName = (code: string) => {
  if (!code) return '未知类型';
  const type = certTypes.value.find((t) => t.code === code);
  return type?.name || code;
};

const getStatusText = (status: number) => {
  return STATUS_TEXT[status as keyof typeof STATUS_TEXT] || '未知';
};

const formatTime = (time: string | undefined) => {
  if (!time) return '-';

  const date = new Date(time);
  if (isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 提取公共函数：按类型分组认证记录
const groupCertsByType = (certs: Certification[]): Record<string, Certification[]> => {
  const groups: Record<string, Certification[]> = {};
  certs.forEach((cert) => {
    if (!groups[cert.type]) {
      groups[cert.type] = [];
    }
    groups[cert.type].push(cert);
  });
  return groups;
};

// 使用 computed 缓存图片计算结果，提升性能
const certImageMap = computed(() => {
  const map: Record<string, string> = {};

  if (!myCerts.value || myCerts.value.length === 0) {
    return map;
  }

  // 按类型分组
  const typeGroups = groupCertsByType(myCerts.value);

  // 为每个类型找出优先级最高的图片
  Object.keys(typeGroups).forEach((type) => {
    const typeCerts = typeGroups[type];

    // 优先级：已通过 > 待审核 > 已拒绝，同优先级按时间倒序
    const sortedCerts = [...typeCerts].sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] || 0;
      const priorityB = STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const imageUrl = sortedCerts[0]?.imageUrl || '';
    map[type] = imageUrl;
  });

  return map;
});

const getCertImage = (code: string) => {
  return certImageMap.value[code] || '';
};

// 使用 computed 缓存状态计算结果
const certStatusMap = computed(() => {
  const map: Record<string, { status: number; text: string; color: string } | null> = {};

  if (!myCerts.value || myCerts.value.length === 0) {
    return map;
  }

  // 按类型分组
  const typeGroups = groupCertsByType(myCerts.value);

  // 为每个类型计算状态
  Object.keys(typeGroups).forEach((type) => {
    const typeCerts = typeGroups[type];

    if (typeCerts.some((c) => c.status === CERT_STATUS.APPROVED)) {
      map[type] = STATUS_BADGE[CERT_STATUS.APPROVED];
    } else if (typeCerts.some((c) => c.status === CERT_STATUS.PENDING)) {
      map[type] = STATUS_BADGE[CERT_STATUS.PENDING];
    } else {
      map[type] = STATUS_BADGE[CERT_STATUS.REJECTED];
    }
  });

  return map;
});

const getCertStatus = (code: string) => {
  return certStatusMap.value[code] || null;
};

const retryLoad = () => {
  loadData();
};

const goToApply = (code: string) => {
  uni.navigateTo({
    url: `/pages/certification/apply?type=${code}`,
  });
};

const handleImageError = (e: any) => {
  console.error('[Image Error] 图片加载失败:', e);
  console.error('[Image Error] 事件详情:', JSON.stringify(e));
};

const handleImageLoad = (e: any) => {
  console.log('[Image Load] 图片加载成功:', e);
};
</script>

<style scoped lang="scss">
.certification-container {
  background: #f8f8f8;
  padding: 20rpx;
  min-height: 100vh;

  // 加载状态
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 40rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-top: 40rpx;
  }

  .loading-icon,
  .error-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .loading-text,
  .error-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 20rpx;
  }

  .retry-btn {
    margin-top: 20rpx;
    padding: 16rpx 48rpx;
    background: #007aff;
    color: #fff;
    border-radius: 8rpx;
    font-size: 28rpx;
    border: none;

    &::after {
      border: none;
    }
  }

  .cert-types {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;

    .cert-type-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .cert-icon {
        width: 80rpx;
        height: 80rpx;
        background: #f0f0f0;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        margin-right: 20rpx;
        overflow: hidden;
        flex-shrink: 0;
        position: relative;

        &.has-image {
          background: transparent;
          padding: 0;
          border: 2rpx solid #e8e8e8;
        }

        .cert-thumbnail {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
      }

      .cert-info {
        flex: 1;

        .cert-name-row {
          display: flex;
          align-items: center;
          gap: 12rpx;
          margin-bottom: 8rpx;
        }

        .cert-name {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
        }

        .cert-badge {
          font-size: 22rpx;
          padding: 4rpx 12rpx;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 12rpx;
          font-weight: 500;
        }

        .cert-desc {
          display: block;
          font-size: 24rpx;
          color: #999;
        }
      }

      .cert-arrow {
        font-size: 36rpx;
        color: #999;
      }
    }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 40rpx;
    background: #fff;
    border-radius: 16rpx;
    margin-top: 40rpx;

    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }

    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .my-cert {
    margin-top: 30rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      padding: 20rpx 0;
    }

    .cert-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;

      .cert-info {
        .cert-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }

        .cert-time {
          font-size: 24rpx;
          color: #999;
        }
      }

      .cert-status {
        font-size: 26rpx;

        &.status-0 {
          color: #faad14;
        }

        &.status-1 {
          color: #52c41a;
        }

        &.status-2 {
          color: #ff4d4f;
        }
      }
    }
  }
}
</style>
