<template>
  <view class="nearby-container">
    <!-- 顶部筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" @click="showDistanceFilter = true">
        <text class="filter-text">{{ currentDistanceText }}</text>
        <text class="filter-arrow">▼</text>
      </view>
      <view class="filter-item" @click="showGenderFilter = true">
        <text class="filter-text">{{ currentGenderText }}</text>
        <text class="filter-arrow">▼</text>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-bar">
      <text class="stats-text">访问 {{ stats.visitedCount }} 人</text>
      <text class="stats-dot">·</text>
      <text class="stats-text">被访问 {{ stats.visitorCount }} 人</text>
    </view>

    <!-- 用户列表 -->
    <scroll-view
      class="user-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <view v-if="users.length > 0" class="list-content">
        <view
          v-for="user in users"
          :key="user.id"
          class="user-card"
          @click="handleUserClick(user)"
        >
          <!-- 用户头像 -->
          <view class="user-avatar-wrapper">
            <image :src="user.avatar" mode="aspectFill" class="user-avatar" />
            <view v-if="user.isOnline" class="online-badge" />
          </view>

          <!-- 用户信息 -->
          <view class="user-info">
            <view class="user-header">
              <text class="user-nickname">{{ user.nickname }}</text>
              <text v-if="user.age" class="user-age">{{ user.age }}岁</text>
            </view>

            <view v-if="user.bio" class="user-bio">
              <text>{{ user.bio }}</text>
            </view>

            <view v-if="user.tags && user.tags.length > 0" class="user-tags">
              <text v-for="(tag, index) in user.tags.slice(0, 3)" :key="index" class="tag">
                {{ tag }}
              </text>
            </view>

            <view class="user-meta">
              <text class="distance">📍 {{ user.distanceText }}</text>
              <text v-if="user.isOnline" class="online-status">在线</text>
              <text v-else class="offline-status">{{ formatActiveTime(user.lastActiveTime) }}</text>
            </view>
          </view>

          <!-- 打招呼按钮 -->
          <view
            :class="['action-btn', { disabled: user.hasSaidHello }]"
            @click.stop="handleSayHello(user)"
          >
            <text>{{ user.hasSaidHello ? '✓' : '👋' }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">📍</text>
        <text class="empty-text">附近暂无用户</text>
        <text class="empty-hint">试试调整筛选条件</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadingMore" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-else-if="!hasMore && users.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 距离筛选弹窗 -->
    <view v-if="showDistanceFilter" class="filter-modal">
      <view class="modal-overlay" @click="showDistanceFilter = false" />
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择距离</text>
        </view>
        <view class="filter-options">
          <view
            v-for="option in distanceOptions"
            :key="option.value"
            :class="['filter-option', { active: filters.distance === option.value }]"
            @click="selectDistance(option.value)"
          >
            <text>{{ option.label }}</text>
            <text v-if="filters.distance === option.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 性别筛选弹窗 -->
    <view v-if="showGenderFilter" class="filter-modal">
      <view class="modal-overlay" @click="showGenderFilter = false" />
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择性别</text>
        </view>
        <view class="filter-options">
          <view
            v-for="option in genderOptions"
            :key="option.value"
            :class="['filter-option', { active: filters.gender === option.value }]"
            @click="selectGender(option.value)"
          >
            <text>{{ option.label }}</text>
            <text v-if="filters.gender === option.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

<!-- 排序筛选弹窗已移除（后端不支持排序参数） -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getNearbyUsers, getNearbyStats, sayHello } from '@/api/modules/nearby';
import { updateLocation } from '@/api/modules/location';
import type { NearbyUser } from '@/api/modules/nearby';

// 状态
const users = ref<NearbyUser[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 20;

// 统计信息
const stats = ref({
  visitedCount: 0,
  visitorCount: 0,
  days: 7
});

// 筛选条件
const filters = ref({
  distance: 5000, // 默认5km
  gender: 0 as number, // 0-不限
  minAge: undefined as number | undefined,
  maxAge: undefined as number | undefined
});

// 筛选弹窗显示状态
const showDistanceFilter = ref(false);
const showGenderFilter = ref(false);

// 距离选项
const distanceOptions = [
  { label: '1公里内', value: 1000 },
  { label: '3公里内', value: 3000 },
  { label: '5公里内', value: 5000 },
  { label: '10公里内', value: 10000 },
  { label: '20公里内', value: 20000 },
  { label: '不限', value: 999999 }
];

// 性别选项
const genderOptions = [
  { label: '不限', value: 0 },
  { label: '男生', value: 1 },
  { label: '女生', value: 2 }
];

// 当前筛选文本
const currentDistanceText = computed(() => {
  const option = distanceOptions.find(o => o.value === filters.value.distance);
  return option?.label || '5公里内';
});

const currentGenderText = computed(() => {
  const option = genderOptions.find(o => o.value === filters.value.gender);
  return option?.label || '不限';
});

onMounted(async () => {
  // 初始化定位
  await initLocation();

  // 定位成功后加载数据
  await Promise.all([
    loadStats(),
    loadUsers()
  ]);
});

// 初始化位置
const initLocation = async () => {
  try {
    const res = await uni.getLocation({
      type: 'gcj02'
    });

    // 更新用户位置到服务器（使用 location 模块）
    await updateLocation({
      latitude: res.latitude,
      longitude: res.longitude
    });
  } catch (error: any) {
    console.error('Get location error:', error);

    let errorMessage = '定位失败';
    if (error.errMsg?.includes('auth deny')) {
      errorMessage = '请授权位置权限';
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none'
    });

    // 定位失败，使用默认坐标（北京）
    await updateLocation({
      latitude: 39.9042,
      longitude: 116.4074
    });
  }
};

// 加载统计信息
const loadStats = async () => {
  try {
    const res = await getNearbyStats();
    stats.value = res.data;
  } catch (error) {
    console.error('Load stats error:', error);
  }
};

// 加载用户列表
const loadUsers = async () => {
  if (loadingMore.value || !hasMore.value) return;

  try {
    // 立即设置加载状态，防止重复请求
    if (page.value === 1) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }

    const res = await getNearbyUsers({
      ...filters.value,
      page: page.value,
      pageSize
    });

    if (page.value === 1) {
      users.value = res.data.list;
    } else {
      users.value.push(...res.data.list);
    }

    hasMore.value = res.data.hasMore;
    page.value++;
  } catch (error: any) {
    console.error('Load users error:', error);

    let errorMessage = '加载失败';
    if (error.code === 'NETWORK_ERROR' || error.errMsg?.includes('network')) {
      errorMessage = '网络连接失败';
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none'
    });
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 下拉刷新
const handleRefresh = async () => {
  refreshing.value = true;
  page.value = 1;
  users.value = [];
  hasMore.value = true;

  await Promise.all([
    loadStats(),
    loadUsers()
  ]);

  refreshing.value = false;
};

// 触底加载更多
const handleLoadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    loadUsers();
  }
};

// 选择距离
const selectDistance = (value: number) => {
  filters.value.distance = value;
  showDistanceFilter.value = false;

  // 重新加载
  page.value = 1;
  users.value = [];
  hasMore.value = true;

  Promise.all([
    loadStats(),
    loadUsers()
  ]);
};

// 选择性别
const selectGender = (value: number) => {
  filters.value.gender = value;
  showGenderFilter.value = false;

  // 重新加载
  page.value = 1;
  users.value = [];
  hasMore.value = true;

  loadUsers();
};

// 选择排序 (保留函数但不再发送到后端)
const selectSort = (_value: 'distance' | 'active') => {
  // 后端暂不支持排序参数，保留函数以避免模板报错
};

// 点击用户
const handleUserClick = (user: NearbyUser) => {
  uni.navigateTo({
    url: `/pages/user/detail?id=${user.id}`
  });
};

// 打招呼
const handleSayHello = async (user: NearbyUser) => {
  // 防止重复打招呼
  if (user.hasSaidHello) {
    uni.showToast({
      title: '已经打过招呼了',
      icon: 'none'
    });
    return;
  }

  try {
    await sayHello(user.id);

    // 更新本地状态
    user.hasSaidHello = true;

    uni.showToast({
      title: '已发送打招呼',
      icon: 'success'
    });
  } catch (error: any) {
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    });
  }
};

// 格式化活跃时间
const formatActiveTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚活跃';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前活跃`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前活跃`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前活跃`;
  }

  return '很久未活跃';
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.nearby-container {
  min-height: 100vh;
  background: $bg-secondary;
  display: flex;
  flex-direction: column;

  .filter-bar {
    display: flex;
    background: $bg-primary;
    padding: $padding-md $padding-lg;
    border-bottom: 1rpx solid $divider-color;

    .filter-item {
      flex: 1;
      @include flex-center;
      gap: $spacing-xs;
      @include transition(opacity);

      &:active {
        opacity: 0.6;
      }

      .filter-text {
        font-size: $font-size-base;
        color: $text-primary;
      }

      .filter-arrow {
        font-size: $font-size-xs;
        color: $text-tertiary;
      }
    }
  }

  .stats-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $padding-sm;
    background: $bg-primary;
    border-bottom: 1rpx solid $divider-color;

    .stats-text {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .stats-dot {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  }

  .user-list {
    flex: 1;

    .list-content {
      padding: $padding-md;

      .user-card {
        display: flex;
        background: $bg-primary;
        border-radius: $radius-md;
        padding: $padding-lg;
        margin-bottom: $margin-md;
        @include transition(all);

        &:active {
          opacity: 0.8;
        }

        .user-avatar-wrapper {
          position: relative;
          margin-right: $margin-md;
          flex-shrink: 0;

          .user-avatar {
            width: $avatar-size-lg;
            height: $avatar-size-lg;
            border-radius: $radius-circle;
          }

          .online-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 24rpx;
            height: 24rpx;
            background: #52c41a;
            border: 4rpx solid $bg-primary;
            border-radius: $radius-circle;
          }
        }

        .user-info {
          flex: 1;
          min-width: 0;

          .user-header {
            display: flex;
            align-items: center;
            gap: $spacing-sm;
            margin-bottom: $margin-xs;

            .user-nickname {
              font-size: $font-size-lg;
              font-weight: $font-weight-medium;
              color: $text-primary;
            }

            .user-age {
              font-size: $font-size-sm;
              color: $text-secondary;
            }
          }

          .user-bio {
            font-size: $font-size-sm;
            color: $text-secondary;
            line-height: $line-height-relaxed;
            margin-bottom: $margin-sm;
            @include text-ellipsis(2);
          }

          .user-tags {
            display: flex;
            flex-wrap: wrap;
            gap: $spacing-xs;
            margin-bottom: $margin-sm;

            .tag {
              padding: $padding-xs $padding-sm;
              background: $bg-secondary;
              border-radius: $radius-sm;
              font-size: $font-size-xs;
              color: $text-secondary;
            }
          }

          .user-meta {
            display: flex;
            align-items: center;
            gap: $spacing-md;
            font-size: $font-size-sm;

            .distance {
              color: $primary-color;
            }

            .online-status {
              color: #52c41a;
            }

            .offline-status {
              color: $text-tertiary;
            }
          }
        }

        .action-btn {
          width: 80rpx;
          height: 80rpx;
          @include flex-center;
          background: $gradient-primary;
          border-radius: $radius-circle;
          font-size: $font-size-xxl;
          @include transition(all);
          @include active-scale;
          flex-shrink: 0;

          &.disabled {
            background: $bg-tertiary;
            opacity: 0.6;
            pointer-events: none;
          }
        }
      }
    }

    .empty-state {
      @include flex-center;
      flex-direction: column;
      padding: $padding-xxl * 2;

      .empty-icon {
        font-size: 120rpx;
        margin-bottom: $margin-lg;
      }

      .empty-text {
        font-size: $font-size-lg;
        color: $text-secondary;
        margin-bottom: $margin-sm;
      }

      .empty-hint {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }

    .loading-more,
    .no-more {
      padding: $padding-lg;
      text-align: center;
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }

  .filter-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-index-modal;
    display: flex;
    align-items: flex-end;

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      width: 100%;
      background: $bg-primary;
      border-radius: $radius-xl $radius-xl 0 0;
      z-index: $z-index-modal + 1;
      animation: slideUp $duration-base $ease-out;

      .modal-header {
        padding: $padding-lg $padding-xl;
        border-bottom: 1rpx solid $divider-color;

        .modal-title {
          font-size: $font-size-lg;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }
      }

      .filter-options {
        max-height: 60vh;
        overflow-y: auto;

        .filter-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: $padding-lg $padding-xl;
          border-bottom: 1rpx solid $divider-color;
          font-size: $font-size-base;
          color: $text-primary;
          @include transition(background);

          &:active {
            background: $bg-secondary;
          }

          &.active {
            color: $primary-color;
          }

          .check-icon {
            font-size: $font-size-lg;
            color: $primary-color;
          }
        }
      }
    }
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
