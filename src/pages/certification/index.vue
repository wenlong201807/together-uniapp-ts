<template>
  <view class="certification-container">
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
            :src="getCertImage(type.code)"
            mode="aspectFill"
            class="cert-thumbnail"
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
    <view class="empty" v-else>
      <text>暂无可用认证类型</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAuthStore } from '@/stores';
import {
  certificationApi,
  type CertificationType,
  type Certification,
} from '@/api/modules/certification';

const authStore = useAuthStore();

const certTypes = ref<CertificationType[]>([]);
const myCerts = ref<Certification[]>([]);

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    uni.navigateBack();
    return;
  }
  loadData();
});

// 监听页面显示，刷新数据
onShow(() => {
  if (authStore.isLoggedIn) {
    loadData();
  }
});

const loadData = async () => {
  await Promise.all([loadCertTypes(), loadMyCerts()]);
};

const loadCertTypes = async () => {
  try {
    const res = await certificationApi.getTypes();
    console.log('Cert types response:', res);
    certTypes.value = res.data.list || [];
  } catch (error) {
    console.error('Failed to load cert types:', error);
    uni.showToast({
      title: '加载认证类型失败',
      icon: 'none',
    });
  }
};

const loadMyCerts = async () => {
  try {
    const res = await certificationApi.getMyList();
    console.log('My certs response:', res);
    myCerts.value = res.data.list || [];
  } catch (error) {
    console.error('Failed to load my certs:', error);
    uni.showToast({
      title: '加载我的认证失败',
      icon: 'none',
    });
  }
};

const getCertTypeName = (code: string) => {
  const type = certTypes.value.find((t) => t.code === code);
  return type?.name || code;
};

const getStatusText = (status: number) => {
  const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' };
  return map[status as keyof typeof map] || '未知';
};

const formatTime = (time: string) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * 获取认证类型对应的图片
 * 优先显示已通过的认证图片，其次是待审核的，最后是最新提交的
 */
const getCertImage = (code: string) => {
  if (!myCerts.value || myCerts.value.length === 0) {
    return '';
  }

  // 查找该类型的所有认证记录
  const typeCerts = myCerts.value.filter((c) => c.type === code);

  if (typeCerts.length === 0) {
    return '';
  }

  // 优先级：已通过 > 待审核 > 已拒绝，同优先级按时间倒序
  const sortedCerts = typeCerts.sort((a, b) => {
    // 状态优先级：1(已通过) > 0(待审核) > 2(已拒绝)
    const statusPriority = { 1: 3, 0: 2, 2: 1 };
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 0;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 0;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // 同优先级按时间倒序
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 返回优先级最高的认证图片
  return sortedCerts[0]?.imageUrl || '';
};

/**
 * 判断认证类型是否有认证记录
 */
const hasCertification = (code: string) => {
  return myCerts.value?.some((c) => c.type === code) || false;
};

/**
 * 获取认证类型的状态标识
 */
const getCertStatus = (code: string) => {
  if (!myCerts.value || myCerts.value.length === 0) {
    return null;
  }

  const typeCerts = myCerts.value.filter((c) => c.type === code);
  if (typeCerts.length === 0) {
    return null;
  }

  // 如果有已通过的，显示已通过
  if (typeCerts.some((c) => c.status === 1)) {
    return { status: 1, text: '已认证', color: '#52c41a' };
  }

  // 如果有待审核的，显示待审核
  if (typeCerts.some((c) => c.status === 0)) {
    return { status: 0, text: '审核中', color: '#faad14' };
  }

  // 如果只有已拒绝的，显示已拒绝
  return { status: 2, text: '已拒绝', color: '#ff4d4f' };
};

const goToApply = (code: string) => {
  uni.navigateTo({
    url: `/pages/certification/apply?type=${code}`,
  });
};
</script>

<style scoped lang="scss">
.certification-container {
  background: #f8f8f8;
  padding: 20rpx;

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
    padding: 60rpx;
    text-align: center;
    color: #999;
    font-size: 28rpx;
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
