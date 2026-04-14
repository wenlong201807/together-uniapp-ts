<template>
  <view class="test-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
      <text class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
    </view>

    <view v-if="questions.length > 0" class="question-card">
      <view class="question-number">
        <text>第 {{ currentIndex + 1 }} 题</text>
      </view>
      <view class="question-content">
        <text>{{ currentQuestion.content }}</text>
      </view>

      <view class="options">
        <view
          v-for="option in answerOptions"
          :key="option.value"
          class="option-item"
          :class="{ selected: currentAnswer === option.value }"
          @click="selectAnswer(option.value)"
        >
          <view class="option-radio">
            <view v-if="currentAnswer === option.value" class="option-radio-inner" />
          </view>
          <text class="option-text">{{ option.label }}</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <button
        v-if="currentIndex > 0"
        class="action-btn prev-btn"
        @click="prevQuestion"
      >
        <text>上一题</text>
      </button>
      <button
        class="action-btn next-btn"
        :class="{ disabled: currentAnswer === null }"
        :disabled="currentAnswer === null"
        @click="nextQuestion"
      >
        <text>{{ isLastQuestion ? '提交测试' : '下一题' }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { mbtiApi, type MbtiQuestion, type MbtiAnswer } from '@/api/mbti';

const sessionId = ref('');
const questions = ref<MbtiQuestion[]>([]);
const answers = ref<Map<number, number>>(new Map());
const currentIndex = ref(0);
const currentAnswer = ref<number | null>(null);

const answerOptions = [
  { value: 1, label: '非常符合 A' },
  { value: 2, label: '比较符合 A' },
  { value: 3, label: '中立' },
  { value: 4, label: '比较符合 B' },
  { value: 5, label: '非常符合 B' },
];

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || {};
});

const progressPercent = computed(() => {
  return ((currentIndex.value + 1) / questions.value.length) * 100;
});

const isLastQuestion = computed(() => {
  return currentIndex.value === questions.value.length - 1;
});

onMounted(async () => {
  await loadTest();
});

const loadTest = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const res = await mbtiApi.startTest();
    sessionId.value = res.data.sessionId;
    questions.value = res.data.questions;

    // 加载当前题目的答案
    const savedAnswer = answers.value.get(currentQuestion.value.id);
    currentAnswer.value = savedAnswer !== undefined ? savedAnswer : null;

    uni.hideLoading();
  } catch (error: any) {
    uni.hideLoading();
    uni.showModal({
      title: '错误',
      content: error.message || '加载测试失败',
      showCancel: false,
      success: () => {
        uni.navigateBack();
      },
    });
  }
};

const selectAnswer = (value: number) => {
  currentAnswer.value = value;
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    // 保存当前答案
    if (currentAnswer.value !== null) {
      answers.value.set(currentQuestion.value.id, currentAnswer.value);
    }

    currentIndex.value--;

    // 加载上一题的答案
    const savedAnswer = answers.value.get(currentQuestion.value.id);
    currentAnswer.value = savedAnswer !== undefined ? savedAnswer : null;
  }
};

const nextQuestion = async () => {
  if (currentAnswer.value === null) {
    return;
  }

  // 保存当前答案
  answers.value.set(currentQuestion.value.id, currentAnswer.value);

  // 提交当前答案到服务器
  try {
    await mbtiApi.submitAnswer({
      sessionId: sessionId.value,
      questionId: currentQuestion.value.id,
      answerValue: currentAnswer.value,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
  }

  if (isLastQuestion.value) {
    // 提交测试
    await submitTest();
  } else {
    // 下一题
    currentIndex.value++;

    // 加载下一题的答案
    const savedAnswer = answers.value.get(currentQuestion.value.id);
    currentAnswer.value = savedAnswer !== undefined ? savedAnswer : null;
  }
};

const submitTest = async () => {
  try {
    uni.showLoading({ title: '计算结果中...' });

    const res = await mbtiApi.submitTest({
      sessionId: sessionId.value,
    });

    uni.hideLoading();

    // 跳转到结果页
    uni.redirectTo({
      url: `/pages/mbti/result?mbtiType=${res.data.mbtiType}`,
    });
  } catch (error: any) {
    uni.hideLoading();
    uni.showModal({
      title: '错误',
      content: error.message || '提交测试失败',
      showCancel: false,
    });
  }
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.test-container {
  min-height: 100vh;
  background: $bg-secondary;
  padding: $padding-xl;

  .progress-bar {
    position: relative;
    height: 8rpx;
    background: $bg-tertiary;
    border-radius: 4rpx;
    margin-bottom: $margin-xl;
    overflow: hidden;

    .progress-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4rpx;
      transition: width 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: 20rpx;
      right: 0;
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }

  .question-card {
    background: $bg-primary;
    border-radius: $radius-lg;
    padding: $padding-xl;
    margin-bottom: $margin-xl;
    box-shadow: $shadow-sm;

    .question-number {
      margin-bottom: $margin-md;

      text {
        font-size: $font-size-sm;
        color: $primary-color;
        font-weight: $font-weight-medium;
      }
    }

    .question-content {
      margin-bottom: $margin-xl;

      text {
        font-size: $font-size-lg;
        color: $text-primary;
        line-height: 1.6;
        font-weight: $font-weight-medium;
      }
    }

    .options {
      .option-item {
        display: flex;
        align-items: center;
        padding: $padding-lg;
        background: $bg-secondary;
        border-radius: $radius-base;
        margin-bottom: $margin-md;
        border: 2rpx solid transparent;
        @include transition(all);

        &:last-child {
          margin-bottom: 0;
        }

        &.selected {
          background: rgba(102, 126, 234, 0.1);
          border-color: $primary-color;

          .option-radio {
            border-color: $primary-color;
          }
        }

        &:active {
          transform: scale(0.98);
        }

        .option-radio {
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid $divider-color;
          border-radius: $radius-circle;
          margin-right: $margin-md;
          @include flex-center;
          @include transition(border-color);

          .option-radio-inner {
            width: 24rpx;
            height: 24rpx;
            background: $primary-color;
            border-radius: $radius-circle;
          }
        }

        .option-text {
          flex: 1;
          font-size: $font-size-base;
          color: $text-primary;
        }
      }
    }
  }

  .actions {
    display: flex;
    gap: $spacing-md;

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

      &.prev-btn {
        background: $bg-primary;
        color: $text-primary;
        box-shadow: $shadow-xs;
      }

      &.next-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);

        &.disabled {
          opacity: 0.5;
          box-shadow: none;
        }
      }
    }
  }
}
</style>
