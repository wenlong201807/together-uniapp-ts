<template>
  <view class="result-container">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="report" class="result-content">
      <view class="result-header">
        <image
          v-if="report.avatarUrl"
          class="mbti-avatar"
          :src="report.avatarUrl"
          mode="aspectFit"
        />
        <view class="mbti-info">
          <text class="mbti-type">{{ report.mbtiType }}</text>
          <text class="mbti-name">{{ report.typeName }}</text>
        </view>
      </view>

      <view class="description-card">
        <text class="card-title">性格描述</text>
        <text class="description-text">{{ report.description }}</text>
      </view>

      <view class="scores-card">
        <text class="card-title">维度得分</text>
        <view class="score-item">
          <view class="score-label">
            <text class="label-left">内向 (I)</text>
            <text class="label-right">外向 (E)</text>
          </view>
          <view class="score-bar">
            <view
              class="score-fill"
              :style="{
                width: Math.abs(result.eiScore) + '%',
                [result.eiScore >= 0 ? 'right' : 'left']: '50%',
                background: result.eiScore >= 0 ? '#667eea' : '#f093fb',
              }"
            />
            <view class="score-center" />
          </view>
          <text class="score-value">{{ result.eiScore }}</text>
        </view>

        <view class="score-item">
          <view class="score-label">
            <text class="label-left">实感 (S)</text>
            <text class="label-right">直觉 (N)</text>
          </view>
          <view class="score-bar">
            <view
              class="score-fill"
              :style="{
                width: Math.abs(result.snScore) + '%',
                [result.snScore >= 0 ? 'right' : 'left']: '50%',
                background: result.snScore >= 0 ? '#667eea' : '#f093fb',
              }"
            />
            <view class="score-center" />
          </view>
          <text class="score-value">{{ result.snScore }}</text>
        </view>

        <view class="score-item">
          <view class="score-label">
            <text class="label-left">思考 (T)</text>
            <text class="label-right">情感 (F)</text>
          </view>
          <view class="score-bar">
            <view
              class="score-fill"
              :style="{
                width: Math.abs(result.tfScore) + '%',
                [result.tfScore >= 0 ? 'right' : 'left']: '50%',
                background: result.tfScore >= 0 ? '#667eea' : '#f093fb',
              }"
            />
            <view class="score-center" />
          </view>
          <text class="score-value">{{ result.tfScore }}</text>
        </view>

        <view class="score-item">
          <view class="score-label">
            <text class="label-left">判断 (J)</text>
            <text class="label-right">感知 (P)</text>
          </view>
          <view class="score-bar">
            <view
              class="score-fill"
              :style="{
                width: Math.abs(result.jpScore) + '%',
                [result.jpScore >= 0 ? 'right' : 'left']: '50%',
                background: result.jpScore >= 0 ? '#667eea' : '#f093fb',
              }"
            />
            <view class="score-center" />
          </view>
          <text class="score-value">{{ result.jpScore }}</text>
        </view>
      </view>

      <view class="list-card">
        <text class="card-title">性格特征</text>
        <view
          v-for="(item, index) in report.characteristics"
          :key="index"
          class="list-item"
        >
          <text class="list-dot">•</text>
          <text class="list-text">{{ item }}</text>
        </view>
      </view>

      <view class="list-card">
        <text class="card-title">优势</text>
        <view
          v-for="(item, index) in report.strengths"
          :key="index"
          class="list-item"
        >
          <text class="list-dot">✓</text>
          <text class="list-text">{{ item }}</text>
        </view>
      </view>

      <view class="list-card">
        <text class="card-title">劣势</text>
        <view
          v-for="(item, index) in report.weaknesses"
          :key="index"
          class="list-item"
        >
          <text class="list-dot">✗</text>
          <text class="list-text">{{ item }}</text>
        </view>
      </view>

      <view class="list-card">
        <text class="card-title">适合的职业</text>
        <view class="career-tags">
          <view
            v-for="(career, index) in report.careers"
            :key="index"
            class="career-tag"
          >
            <text>{{ career }}</text>
          </view>
        </view>
      </view>

      <view class="description-card">
        <text class="card-title">人际关系建议</text>
        <text class="description-text">{{ report.relationships }}</text>
      </view>

      <view class="compatibility-card">
        <text class="card-title">匹配类型</text>
        <view class="compatibility-section">
          <text class="compatibility-label">最佳匹配</text>
          <view class="compatibility-types">
            <view
              v-for="(type, index) in report.compatibility.best"
              :key="index"
              class="type-tag best"
            >
              <text>{{ type }}</text>
            </view>
          </view>
        </view>
        <view class="compatibility-section">
          <text class="compatibility-label">良好匹配</text>
          <view class="compatibility-types">
            <view
              v-for="(type, index) in report.compatibility.good"
              :key="index"
              class="type-tag good"
            >
              <text>{{ type }}</text>
            </view>
          </view>
        </view>
        <view class="compatibility-section">
          <text class="compatibility-label">需要磨合</text>
          <view class="compatibility-types">
            <view
              v-for="(type, index) in report.compatibility.challenging"
              :key="index"
              class="type-tag challenging"
            >
              <text>{{ type }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="actions">
        <button class="action-btn share-btn" @click="shareResult">
          <text>分享到广场</text>
        </button>
        <button class="action-btn retest-btn" @click="retestConfirm">
          <text>重新测试</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { mbtiApi, type MbtiResult, type MbtiReport } from '@/api/mbti';

const loading = ref(true);
const result = ref<MbtiResult | null>(null);
const report = ref<MbtiReport | null>(null);
const mbtiType = ref('');

onLoad((options: any) => {
  if (options.mbtiType) {
    mbtiType.value = options.mbtiType;
  }
});

onMounted(async () => {
  await loadResult();
});

const loadResult = async () => {
  try {
    loading.value = true;

    // 获取当前测试结果
    const resultRes = await mbtiApi.getCurrentResult();
    result.value = resultRes.data;

    // 如果URL传了mbtiType，使用URL的，否则使用当前结果的
    const typeToLoad = mbtiType.value || result.value.mbtiType;

    // 获取报告
    const reportRes = await mbtiApi.getReport(typeToLoad);
    report.value = reportRes.data;

    // 解析JSON字段
    if (typeof report.value.characteristics === 'string') {
      report.value.characteristics = JSON.parse(report.value.characteristics);
    }
    if (typeof report.value.strengths === 'string') {
      report.value.strengths = JSON.parse(report.value.strengths);
    }
    if (typeof report.value.weaknesses === 'string') {
      report.value.weaknesses = JSON.parse(report.value.weaknesses);
    }
    if (typeof report.value.careers === 'string') {
      report.value.careers = JSON.parse(report.value.careers);
    }
    if (typeof report.value.compatibility === 'string') {
      report.value.compatibility = JSON.parse(report.value.compatibility);
    }

    loading.value = false;
  } catch (error: any) {
    loading.value = false;
    uni.showModal({
      title: '错误',
      content: error.message || '加载结果失败',
      showCancel: false,
      success: () => {
        uni.navigateBack();
      },
    });
  }
};

const shareResult = () => {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none',
  });
};

const retestConfirm = () => {
  uni.showModal({
    title: '重新测试',
    content: '重新测试将消耗30积分，确定要继续吗？',
    success: (res) => {
      if (res.confirm) {
        uni.redirectTo({
          url: '/pages/mbti/test',
        });
      }
    },
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.result-container {
  min-height: 100vh;
  background: $bg-secondary;

  .loading {
    @include flex-center;
    min-height: 100vh;

    text {
      font-size: $font-size-lg;
      color: $text-secondary;
    }
  }

  .result-content {
    padding: $padding-xl;

    .result-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: $radius-lg;
      padding: $padding-xl;
      margin-bottom: $margin-lg;
      @include flex-center;
      flex-direction: column;
      box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);

      .mbti-avatar {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: $margin-lg;
      }

      .mbti-info {
        text-align: center;

        .mbti-type {
          display: block;
          font-size: 64rpx;
          font-weight: $font-weight-bold;
          color: #fff;
          margin-bottom: $margin-sm;
          letter-spacing: 8rpx;
        }

        .mbti-name {
          display: block;
          font-size: $font-size-xl;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .description-card,
    .list-card,
    .scores-card,
    .compatibility-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $padding-xl;
      margin-bottom: $margin-lg;
      box-shadow: $shadow-sm;

      .card-title {
        display: block;
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-md;
      }
    }

    .description-card {
      .description-text {
        display: block;
        font-size: $font-size-base;
        color: $text-secondary;
        line-height: 1.8;
      }
    }

    .scores-card {
      .score-item {
        margin-bottom: $margin-lg;

        &:last-child {
          margin-bottom: 0;
        }

        .score-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: $margin-sm;

          .label-left,
          .label-right {
            font-size: $font-size-sm;
            color: $text-secondary;
          }
        }

        .score-bar {
          position: relative;
          height: 16rpx;
          background: $bg-tertiary;
          border-radius: 8rpx;
          margin-bottom: $margin-xs;

          .score-fill {
            position: absolute;
            top: 0;
            height: 100%;
            border-radius: 8rpx;
            transition: width 0.6s ease;
          }

          .score-center {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 4rpx;
            height: 24rpx;
            background: $text-tertiary;
            border-radius: 2rpx;
          }
        }

        .score-value {
          display: block;
          text-align: center;
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }

    .list-card {
      .list-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: $margin-sm;

        &:last-child {
          margin-bottom: 0;
        }

        .list-dot {
          font-size: $font-size-lg;
          color: $primary-color;
          margin-right: $margin-sm;
          line-height: 1.6;
        }

        .list-text {
          flex: 1;
          font-size: $font-size-base;
          color: $text-secondary;
          line-height: 1.6;
        }
      }

      .career-tags {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;

        .career-tag {
          padding: 12rpx 24rpx;
          background: rgba(102, 126, 234, 0.1);
          color: $primary-color;
          border-radius: 24rpx;
          font-size: $font-size-sm;
        }
      }
    }

    .compatibility-card {
      .compatibility-section {
        margin-bottom: $margin-lg;

        &:last-child {
          margin-bottom: 0;
        }

        .compatibility-label {
          display: block;
          font-size: $font-size-base;
          color: $text-secondary;
          margin-bottom: $margin-sm;
        }

        .compatibility-types {
          display: flex;
          flex-wrap: wrap;
          gap: $spacing-sm;

          .type-tag {
            padding: 12rpx 24rpx;
            border-radius: 24rpx;
            font-size: $font-size-sm;
            font-weight: $font-weight-medium;

            &.best {
              background: rgba(76, 175, 80, 0.1);
              color: #4caf50;
            }

            &.good {
              background: rgba(33, 150, 243, 0.1);
              color: #2196f3;
            }

            &.challenging {
              background: rgba(255, 152, 0, 0.1);
              color: #ff9800;
            }
          }
        }
      }
    }

    .actions {
      display: flex;
      gap: $spacing-md;
      margin-top: $margin-xl;

      .action-btn {
        flex: 1;
        height: 88rpx;
        line-height: 88rpx;
        font-size: $font-size-lg;
        font-weight: $font-weight-medium;
        border-radius: $radius-base;
        border: none;
        @include transition(all);

        &:active {
          transform: scale(0.98);
        }

        &.share-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
          box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
        }

        &.retest-btn {
          background: $bg-primary;
          color: $text-primary;
          box-shadow: $shadow-xs;
        }
      }
    }
  }
}
</style>
