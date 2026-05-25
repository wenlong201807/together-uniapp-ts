<template>
  <view class="banner-carousel">
    <swiper
      class="swiper"
      :indicator-dots="true"
      :autoplay="true"
      :interval="3000"
      :duration="500"
      :circular="true"
      indicator-color="rgba(255, 255, 255, 0.3)"
      indicator-active-color="#ffffff"
      @change="handleChange"
    >
      <swiper-item v-for="(banner, index) in banners" :key="index">
        <view class="banner-item" @click="handleBannerClick(banner)">
          <LazyImage
            class="banner-image"
            :src="banner.imageUrl"
            :priority="index === 0 ? 'critical' : 'high'"
            :lazy="false"
            mode="aspectFill"
          />
          <view class="banner-content">
            <text class="banner-title">{{ banner.title }}</text>
            <text v-if="banner.subtitle" class="banner-subtitle">{{ banner.subtitle }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import LazyImage from '@/components/LazyImage.vue';
import type { Banner } from '@/api/home';

export type { Banner };
// Re-export Banner type for backward compatibility with importers

interface Props {
  banners: Banner[];
}

const props = withDefaults(defineProps<Props>(), {
  banners: () => [],
});

const emit = defineEmits<{
  bannerClick: [banner: Banner];
  change: [index: number];
}>();

const handleChange = (e: any) => {
  emit('change', e.detail.current);
};

const handleBannerClick = (banner: Banner) => {
  emit('bannerClick', banner);
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.banner-carousel {
  margin-bottom: $margin-lg;
  min-height: 320rpx;

  .swiper {
    width: 100%;
    height: 320rpx;
    min-height: 320rpx;
    border-radius: $radius-lg;
    overflow: hidden;

    .banner-item {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;

      .banner-image {
        display: block;
        width: 100%;
        height: 320rpx;
      }

      .banner-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: $padding-lg;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);

        .banner-title {
          display: block;
          font-size: $font-size-lg;
          font-weight: $font-weight-bold;
          color: #ffffff;
          margin-bottom: $margin-xs;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
        }

        .banner-subtitle {
          display: block;
          font-size: $font-size-sm;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}
</style>
