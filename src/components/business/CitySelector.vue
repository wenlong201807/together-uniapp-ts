<template>
  <view v-if="visible" class="city-selector-modal">
    <view class="modal-overlay" @click="handleClose" />

    <view class="modal-content">
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">选择城市</text>
        <text class="modal-close" @click="handleClose">✕</text>
      </view>

      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索城市"
          @input="handleSearch"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
      </view>

      <!-- 定位城市 -->
      <view v-if="!searchKeyword" class="location-section">
        <view class="section-title">
          <text>当前定位</text>
        </view>
        <view class="location-city">
          <view v-if="locating" class="locating">
            <text>定位中...</text>
          </view>
          <view v-else-if="currentLocation" class="city-item" @click="selectCity(currentLocation)">
            <text class="city-name">{{ currentLocation }}</text>
            <text class="location-icon">📍</text>
          </view>
          <view v-else class="locate-btn" @click="handleLocate">
            <text>重新定位</text>
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <scroll-view v-if="searchKeyword" class="search-results" scroll-y>
        <view v-if="searchResults.length > 0" class="results-list">
          <view
            v-for="city in searchResults"
            :key="city.code"
            class="city-item"
            @click="selectCity(city.name)"
          >
            <text class="city-name">{{ city.name }}</text>
          </view>
        </view>
        <view v-else class="empty-result">
          <text>未找到相关城市</text>
        </view>
      </scroll-view>

      <!-- 城市列表 -->
      <scroll-view v-else class="city-list" scroll-y :scroll-into-view="scrollIntoView">
        <!-- 热门城市 -->
        <view class="hot-cities-section">
          <view class="section-title">
            <text>热门城市</text>
          </view>
          <view class="hot-cities">
            <view
              v-for="city in hotCities"
              :key="city.code"
              class="hot-city-item"
              @click="selectCity(city.name)"
            >
              <text>{{ city.name }}</text>
            </view>
          </view>
        </view>

        <!-- 所有城市（按字母分组） -->
        <view
          v-for="initial in cityInitials"
          :id="`initial-${initial}`"
          :key="initial"
          class="city-group"
        >
          <view class="group-title">
            <text>{{ initial }}</text>
          </view>
          <view class="group-cities">
            <view
              v-for="city in allCities[initial]"
              :key="city.code"
              class="city-item"
              @click="selectCity(city.name)"
            >
              <text class="city-name">{{ city.name }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 字母索引 -->
      <view v-if="!searchKeyword" class="index-bar">
        <view
          v-for="initial in cityInitials"
          :key="initial"
          class="index-item"
          @click="scrollToInitial(initial)"
        >
          <text>{{ initial }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { HOT_CITIES, ALL_CITIES, CITY_INITIALS, searchCities } from '@/constants/cities';
import type { City } from '@/constants/cities';
import { getCurrentLocation, saveUserCity } from '@/api/modules/location';

interface Props {
  visible: boolean;
  currentCity?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  currentCity: '定位中...'
});

const emit = defineEmits<{
  close: [];
  select: [city: string];
}>();

const searchKeyword = ref('');
const searchResults = ref<City[]>([]);
const currentLocation = ref('');
const locating = ref(false);
const scrollIntoView = ref('');

const hotCities = HOT_CITIES;
const allCities = ALL_CITIES;
const cityInitials = CITY_INITIALS;

// 搜索城市
const handleSearch = () => {
  if (searchKeyword.value) {
    searchResults.value = searchCities(searchKeyword.value);
  } else {
    searchResults.value = [];
  }
};

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = '';
  searchResults.value = [];
};

// 定位
const handleLocate = async () => {
  locating.value = true;

  try {
    // 使用 UniApp 的定位 API
    const res = await uni.getLocation({
      type: 'gcj02'
    });

    // 调用后端接口获取城市信息
    const locationRes = await getCurrentLocation();
    currentLocation.value = locationRes.data.city;

    uni.showToast({
      title: '定位成功',
      icon: 'success'
    });
  } catch (error: any) {
    console.error('Location error:', error);

    let errorMessage = '定位失败';
    if (error.errMsg?.includes('auth deny')) {
      errorMessage = '请授权位置权限';
    } else if (error.errMsg?.includes('timeout')) {
      errorMessage = '定位超时，请重试';
    }

    uni.showToast({
      title: errorMessage,
      icon: 'none'
    });

    currentLocation.value = '';
  } finally {
    locating.value = false;
  }
};

// 选择城市
const selectCity = async (cityName: string) => {
  try {
    // 保存用户选择的城市
    await saveUserCity(cityName);

    emit('select', cityName);
    handleClose();

    uni.showToast({
      title: `已切换到${cityName}`,
      icon: 'success'
    });
  } catch (error) {
    console.error('Save city error:', error);
    uni.showToast({
      title: '切换失败',
      icon: 'none'
    });
  }
};

// 滚动到指定字母
const scrollToInitial = (initial: string) => {
  scrollIntoView.value = `initial-${initial}`;
};

// 关闭弹窗
const handleClose = () => {
  emit('close');
  // 重置状态
  searchKeyword.value = '';
  searchResults.value = [];
};

// 初始化定位
const initLocation = () => {
  if (props.currentCity && props.currentCity !== '定位中...') {
    currentLocation.value = props.currentCity;
  } else {
    handleLocate();
  }
};

// 监听弹窗打开
const onModalOpen = () => {
  if (props.visible) {
    initLocation();
  }
};

// 暴露方法
defineExpose({
  onModalOpen
});
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.city-selector-modal {
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
    height: 80vh;
    background: $bg-primary;
    border-radius: $radius-xl $radius-xl 0 0;
    display: flex;
    flex-direction: column;
    z-index: $z-index-modal + 1;
    animation: slideUp $duration-base $ease-out;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $padding-lg $padding-xl;
      border-bottom: 1rpx solid $divider-color;

      .modal-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }

      .modal-close {
        font-size: $font-size-xl;
        color: $text-tertiary;
        @include transition(opacity);

        &:active {
          opacity: 0.6;
        }
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      padding: $padding-md $padding-xl;
      background: $bg-secondary;
      margin: $margin-md $margin-xl;
      border-radius: $radius-full;

      .search-icon {
        font-size: $font-size-lg;
        margin-right: $margin-sm;
      }

      .search-input {
        flex: 1;
        font-size: $font-size-base;
        color: $text-primary;
      }

      .clear-icon {
        font-size: $font-size-lg;
        color: $text-tertiary;
        padding: 0 $padding-xs;
        @include transition(opacity);

        &:active {
          opacity: 0.6;
        }
      }
    }

    .location-section {
      padding: 0 $padding-xl $padding-md;

      .section-title {
        font-size: $font-size-sm;
        color: $text-tertiary;
        margin-bottom: $margin-sm;
      }

      .location-city {
        .locating {
          padding: $padding-md;
          text-align: center;
          color: $text-tertiary;
          font-size: $font-size-sm;
        }

        .city-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: $padding-md;
          background: $bg-secondary;
          border-radius: $radius-base;
          @include transition(all);

          &:active {
            opacity: 0.7;
          }

          .city-name {
            font-size: $font-size-base;
            color: $text-primary;
          }

          .location-icon {
            font-size: $font-size-lg;
          }
        }

        .locate-btn {
          padding: $padding-md;
          text-align: center;
          background: $bg-secondary;
          border-radius: $radius-base;
          color: $primary-color;
          font-size: $font-size-base;
          @include transition(all);

          &:active {
            opacity: 0.7;
          }
        }
      }
    }

    .search-results,
    .city-list {
      flex: 1;
      overflow-y: auto;

      .results-list,
      .group-cities {
        .city-item {
          display: flex;
          align-items: center;
          padding: $padding-md $padding-xl;
          border-bottom: 1rpx solid $divider-color;
          @include transition(background);

          &:active {
            background: $bg-secondary;
          }

          .city-name {
            font-size: $font-size-base;
            color: $text-primary;
          }
        }
      }

      .empty-result {
        padding: $padding-xl;
        text-align: center;
        color: $text-tertiary;
        font-size: $font-size-sm;
      }
    }

    .hot-cities-section {
      padding: $padding-md $padding-xl;

      .section-title {
        font-size: $font-size-sm;
        color: $text-tertiary;
        margin-bottom: $margin-md;
      }

      .hot-cities {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: $spacing-md;

        .hot-city-item {
          padding: $padding-md;
          text-align: center;
          background: $bg-secondary;
          border-radius: $radius-base;
          font-size: $font-size-base;
          color: $text-primary;
          @include transition(all);

          &:active {
            background: $bg-tertiary;
          }
        }
      }
    }

    .city-group {
      .group-title {
        padding: $padding-sm $padding-xl;
        background: $bg-secondary;
        font-size: $font-size-sm;
        color: $text-tertiary;
        font-weight: $font-weight-medium;
      }
    }

    .index-bar {
      position: absolute;
      right: $spacing-xs;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-xs;

      .index-item {
        width: 40rpx;
        height: 40rpx;
        @include flex-center;
        font-size: $font-size-xs;
        color: $primary-color;
        font-weight: $font-weight-medium;
        @include transition(all);

        &:active {
          background: $primary-color;
          color: $bg-primary;
          border-radius: $radius-circle;
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
