<template>
  <view class="intro-container">
    <view class="header">
      <text class="title">MBTI 性格测试</text>
      <text class="subtitle">探索你的性格类型</text>
    </view>

    <view class="content">
      <view class="info-card">
        <view class="info-item">
          <text class="info-icon">📝</text>
          <view class="info-text">
            <text class="info-title">60道题目</text>
            <text class="info-desc">科学严谨的测试题库</text>
          </view>
        </view>
        <view class="info-item">
          <text class="info-icon">⏱️</text>
          <view class="info-text">
            <text class="info-title">约10分钟</text>
            <text class="info-desc">轻松完成测试</text>
          </view>
        </view>
        <view class="info-item">
          <text class="info-icon">🎁</text>
          <view class="info-text">
            <text class="info-title">获得积分</text>
            <text class="info-desc">首次完成奖励 {{ pointsReward }} 积分</text>
          </view>
        </view>
      </view>

      <view class="description">
        <text class="desc-title">什么是 MBTI？</text>
        <text class="desc-text">
          MBTI（Myers-Briggs Type Indicator）是一种性格分类理论模型，通过四个维度将人的性格分为16种类型：
        </text>
        <view class="dimensions">
          <view class="dimension-item">
            <text class="dimension-label">E/I</text>
            <text class="dimension-name">外向 / 内向</text>
          </view>
          <view class="dimension-item">
            <text class="dimension-label">S/N</text>
            <text class="dimension-name">实感 / 直觉</text>
          </view>
          <view class="dimension-item">
            <text class="dimension-label">T/F</text>
            <text class="dimension-name">思考 / 情感</text>
          </view>
          <view class="dimension-item">
            <text class="dimension-label">J/P</text>
            <text class="dimension-name">判断 / 感知</text>
          </view>
        </view>
      </view>

      <view class="tips">
        <text class="tips-title">💡 测试建议</text>
        <text class="tips-item">• 选择安静的环境，保持放松的心态</text>
        <text class="tips-item">• 根据第一直觉作答，不要过度思考</text>
        <text class="tips-item">• 诚实回答，才能获得准确的结果</text>
      </view>
    </view>

    <view class="footer">
      <button class="start-btn" @click="startTest">
        <text>开始测试</text>
      </button>
      <view v-if="hasResult" class="view-result" @click="viewCurrentResult">
        <text>查看我的测试结果</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores';
import { mbtiApi } from '@/api/mbti';

const authStore = useAuthStore();
const pointsReward = ref(50);
const hasResult = ref(false);

onMounted(async () => {
  // 检查是否已有测试结果
  try {
    const result = await mbtiApi.getCurrentResult();
    hasResult.value = !!result.data;
  } catch (error) {
    console.error('Check result error:', error);
  }
});

const startTest = () => {
  if (!authStore.isLoggedIn) {
    uni.showModal({
      title: '提示',
      content: '请先登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/auth/login',
          });
        }
      },
    });
    return;
  }

  uni.navigateTo({
    url: '/pages/mbti/test',
  });
};

const viewCurrentResult = () => {
  uni.navigateTo({
    url: '/pages/mbti/result',
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.intro-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: $padding-xl;
  display: flex;
  flex-direction: column;

  .header {
    text-align: center;
    padding: 60rpx 0 40rpx;

    .title {
      display: block;
      font-size: 56rpx;
      font-weight: $font-weight-bold;
      color: #fff;
      margin-bottom: $margin-sm;
      text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
    }

    .subtitle {
      display: block;
      font-size: $font-size-lg;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .content {
    flex: 1;

    .info-card {
      background: #fff;
      border-radius: $radius-lg;
      padding: $padding-xl;
      margin-bottom: $margin-lg;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);

      .info-item {
        display: flex;
        align-items: center;
        padding: $padding-md 0;

        &:not(:last-child) {
          border-bottom: 1rpx solid $divider-color;
        }

        .info-icon {
          font-size: 48rpx;
          margin-right: $margin-lg;
        }

        .info-text {
          flex: 1;

          .info-title {
            display: block;
            font-size: $font-size-lg;
            font-weight: $font-weight-medium;
            color: $text-primary;
            margin-bottom: 4rpx;
          }

          .info-desc {
            display: block;
            font-size: $font-size-sm;
            color: $text-secondary;
          }
        }
      }
    }

    .description {
      background: rgba(255, 255, 255, 0.95);
      border-radius: $radius-lg;
      padding: $padding-xl;
      margin-bottom: $margin-lg;

      .desc-title {
        display: block;
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-md;
      }

      .desc-text {
        display: block;
        font-size: $font-size-base;
        color: $text-secondary;
        line-height: 1.6;
        margin-bottom: $margin-lg;
      }

      .dimensions {
        .dimension-item {
          display: flex;
          align-items: center;
          padding: $padding-sm 0;

          .dimension-label {
            width: 80rpx;
            height: 60rpx;
            line-height: 60rpx;
            text-align: center;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            font-size: $font-size-lg;
            font-weight: $font-weight-bold;
            border-radius: $radius-base;
            margin-right: $margin-md;
          }

          .dimension-name {
            font-size: $font-size-base;
            color: $text-primary;
          }
        }
      }
    }

    .tips {
      background: rgba(255, 255, 255, 0.95);
      border-radius: $radius-lg;
      padding: $padding-xl;

      .tips-title {
        display: block;
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-md;
      }

      .tips-item {
        display: block;
        font-size: $font-size-base;
        color: $text-secondary;
        line-height: 1.8;
        margin-bottom: $margin-xs;
      }
    }
  }

  .footer {
    padding: $padding-lg 0;

    .start-btn {
      width: 100%;
      height: 96rpx;
      line-height: 96rpx;
      background: #fff;
      color: #667eea;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      border-radius: 48rpx;
      border: none;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
      @include transition(all);

      &:active {
        transform: scale(0.98);
      }
    }

    .view-result {
      text-align: center;
      padding: $padding-lg 0;
      color: #fff;
      font-size: $font-size-base;
      text-decoration: underline;
      @include transition(opacity);

      &:active {
        opacity: 0.7;
      }
    }
  }
}
</style>
