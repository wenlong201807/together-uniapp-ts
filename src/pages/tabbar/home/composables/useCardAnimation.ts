/**
 * 卡片动画 Composable
 * 提供卡片进入、点赞、滑动等动画效果
 */

import { ref } from 'vue';

export interface CardAnimationOptions {
  duration?: number; // 动画持续时间（毫秒）
  delay?: number; // 动画延迟（毫秒）
  easing?: string; // 缓动函数
}

/**
 * 卡片进入动画
 */
export function useCardEnterAnimation(options: CardAnimationOptions = {}) {
  const { duration = 300, delay = 0, easing = 'ease-out' } = options;

  const animationStyle = ref({
    opacity: 0,
    transform: 'translateY(20px)',
    transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`,
  });

  const isAnimating = ref(false);

  /**
   * 触发进入动画
   */
  const triggerEnter = () => {
    isAnimating.value = true;

    // 使用 setTimeout 确保初始状态已应用
    setTimeout(() => {
      animationStyle.value = {
        opacity: 1,
        transform: 'translateY(0)',
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`,
      };

      // 动画结束后重置状态
      setTimeout(() => {
        isAnimating.value = false;
      }, duration + delay);
    }, 50);
  };

  return {
    animationStyle,
    isAnimating,
    triggerEnter,
  };
}

/**
 * 点赞动画
 */
export function useLikeAnimation() {
  const isLiking = ref(false);
  const likeCount = ref(0);
  const showParticles = ref(false);

  /**
   * 触发点赞动画
   */
  const triggerLike = (currentCount: number) => {
    if (isLiking.value) return;

    isLiking.value = true;
    likeCount.value = currentCount + 1;
    showParticles.value = true;

    // 心形放大动画
    setTimeout(() => {
      isLiking.value = false;
    }, 300);

    // 粒子效果
    setTimeout(() => {
      showParticles.value = false;
    }, 800);
  };

  /**
   * 取消点赞
   */
  const cancelLike = (currentCount: number) => {
    likeCount.value = currentCount - 1;
  };

  return {
    isLiking,
    likeCount,
    showParticles,
    triggerLike,
    cancelLike,
  };
}

/**
 * 滑动切换动画
 */
export function useSwipeAnimation() {
  const swipeDirection = ref<'left' | 'right' | null>(null);
  const swipeProgress = ref(0); // 0-1
  const isSwping = ref(false);

  let startX = 0;
  let currentX = 0;
  const threshold = 100; // 滑动阈值（像素）

  /**
   * 开始滑动
   */
  const onSwipeStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    currentX = startX;
    isSwping.value = true;
  };

  /**
   * 滑动中
   */
  const onSwipeMove = (e: TouchEvent) => {
    if (!isSwping.value) return;

    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;

    // 计算滑动进度
    swipeProgress.value = Math.min(Math.abs(deltaX) / threshold, 1);

    // 判断滑动方向
    if (deltaX > 0) {
      swipeDirection.value = 'right';
    } else if (deltaX < 0) {
      swipeDirection.value = 'left';
    }
  };

  /**
   * 结束滑动
   */
  const onSwipeEnd = (): { direction: 'left' | 'right' | null; completed: boolean } => {
    const deltaX = currentX - startX;
    const completed = Math.abs(deltaX) >= threshold;

    const result = {
      direction: swipeDirection.value,
      completed,
    };

    // 重置状态
    isSwping.value = false;
    swipeProgress.value = 0;
    swipeDirection.value = null;
    startX = 0;
    currentX = 0;

    return result;
  };

  /**
   * 获取滑动变换样式
   */
  const getSwipeTransform = () => {
    if (!isSwping.value) return '';

    const deltaX = currentX - startX;
    const rotate = (deltaX / threshold) * 15; // 最大旋转15度
    const scale = 1 - swipeProgress.value * 0.1; // 最小缩放到0.9

    return `translateX(${deltaX}px) rotate(${rotate}deg) scale(${scale})`;
  };

  return {
    swipeDirection,
    swipeProgress,
    isSwping,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    getSwipeTransform,
  };
}

/**
 * 加载动画
 */
export function useLoadingAnimation() {
  const isLoading = ref(false);
  const loadingText = ref('加载中');
  const dots = ref('');

  let dotInterval: number | null = null;

  /**
   * 开始加载动画
   */
  const startLoading = (text: string = '加载中') => {
    isLoading.value = true;
    loadingText.value = text;
    dots.value = '';

    // 点点点动画
    dotInterval = setInterval(() => {
      dots.value = dots.value.length >= 3 ? '' : dots.value + '.';
    }, 500) as unknown as number;
  };

  /**
   * 停止加载动画
   */
  const stopLoading = () => {
    isLoading.value = false;
    if (dotInterval) {
      clearInterval(dotInterval);
      dotInterval = null;
    }
    dots.value = '';
  };

  return {
    isLoading,
    loadingText,
    dots,
    startLoading,
    stopLoading,
  };
}

/**
 * 弹跳动画
 */
export function useBounceAnimation() {
  const isBouncing = ref(false);

  /**
   * 触发弹跳动画
   */
  const triggerBounce = () => {
    if (isBouncing.value) return;

    isBouncing.value = true;

    setTimeout(() => {
      isBouncing.value = false;
    }, 600);
  };

  return {
    isBouncing,
    triggerBounce,
  };
}

/**
 * 淡入淡出动画
 */
export function useFadeAnimation(options: CardAnimationOptions = {}) {
  const { duration = 300, delay = 0 } = options;

  const opacity = ref(0);
  const isVisible = ref(false);

  /**
   * 淡入
   */
  const fadeIn = () => {
    isVisible.value = true;
    setTimeout(() => {
      opacity.value = 1;
    }, delay);
  };

  /**
   * 淡出
   */
  const fadeOut = () => {
    opacity.value = 0;
    setTimeout(() => {
      isVisible.value = false;
    }, duration);
  };

  /**
   * 切换
   */
  const toggle = () => {
    if (isVisible.value) {
      fadeOut();
    } else {
      fadeIn();
    }
  };

  return {
    opacity,
    isVisible,
    fadeIn,
    fadeOut,
    toggle,
  };
}

/**
 * 脉冲动画
 */
export function usePulseAnimation() {
  const isPulsing = ref(false);

  /**
   * 触发脉冲动画
   */
  const triggerPulse = () => {
    isPulsing.value = true;

    setTimeout(() => {
      isPulsing.value = false;
    }, 1000);
  };

  return {
    isPulsing,
    triggerPulse,
  };
}

/**
 * 数字滚动动画
 */
export function useCountAnimation(options: { duration?: number } = {}) {
  const { duration = 1000 } = options;

  const currentValue = ref(0);
  const isAnimating = ref(false);

  /**
   * 动画到目标值
   */
  const animateTo = (targetValue: number) => {
    if (isAnimating.value) return;

    isAnimating.value = true;
    const startValue = currentValue.value;
    const delta = targetValue - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 缓动函数：easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      currentValue.value = Math.round(startValue + delta * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimating.value = false;
      }
    };

    animate();
  };

  return {
    currentValue,
    isAnimating,
    animateTo,
  };
}
