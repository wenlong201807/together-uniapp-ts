import { ref, computed } from 'vue';

/**
 * 防抖 Hook - 防止重复提交
 *
 * @example
 * ```typescript
 * const { loading, execute } = useDebounce();
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     await api.submit(data);
 *     uni.showToast({ title: '提交成功', icon: 'success' });
 *   });
 * };
 * ```
 */
export function useDebounce() {
  const loading = ref(false);

  /**
   * 执行异步操作，自动处理 loading 状态
   * @param fn 要执行的异步函数
   * @returns Promise<T> 返回异步函数的结果
   */
  const execute = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    // 如果正在执行，直接返回
    if (loading.value) {
      return undefined;
    }

    loading.value = true;
    try {
      const result = await fn();
      return result;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    execute,
  };
}

/**
 * 带按钮文字切换的防抖 Hook
 *
 * @param defaultText 默认按钮文字
 * @param loadingText 加载中的按钮文字
 *
 * @example
 * ```typescript
 * const { loading, buttonText, execute } = useDebounceButton('发送', '发送中...');
 *
 * // 模板中
 * <button :disabled="loading" @click="handleSubmit">
 *   {{ buttonText }}
 * </button>
 * ```
 */
export function useDebounceButton(defaultText = '提交', loadingText = '提交中...') {
  const { loading, execute } = useDebounce();

  const buttonText = computed(() => loading.value ? loadingText : defaultText);

  return {
    loading,
    buttonText,
    execute,
  };
}

/**
 * 带倒计时的防抖 Hook（用于发送验证码等场景）
 *
 * @param countdown 倒计时秒数，默认 60 秒
 * @param defaultText 默认按钮文字
 *
 * @example
 * ```typescript
 * const { loading, buttonText, canExecute, execute } = useDebounceCountdown(60, '发送验证码');
 *
 * const sendCode = async () => {
 *   await execute(async () => {
 *     await api.sendCode(mobile);
 *     uni.showToast({ title: '验证码已发送', icon: 'success' });
 *   });
 * };
 *
 * // 模板中
 * <button :disabled="!canExecute" @click="sendCode">
 *   {{ buttonText }}
 * </button>
 * ```
 */
export function useDebounceCountdown(countdown = 60, defaultText = '发送验证码') {
  const loading = ref(false);
  const counting = ref(false);
  const remainingTime = ref(0);

  const buttonText = computed(() => {
    if (loading.value) return '发送中...';
    if (counting.value) return `${remainingTime.value}秒后重试`;
    return defaultText;
  });

  const canExecute = computed(() => !loading.value && !counting.value);

  const startCountdown = () => {
    counting.value = true;
    remainingTime.value = countdown;

    const timer = setInterval(() => {
      remainingTime.value--;
      if (remainingTime.value <= 0) {
        clearInterval(timer);
        counting.value = false;
      }
    }, 1000);
  };

  const execute = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (!canExecute.value) {
      return undefined;
    }

    loading.value = true;
    try {
      const result = await fn();
      // 执行成功后开始倒计时
      startCountdown();
      return result;
    } catch (error) {
      // 执行失败不开始倒计时
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    counting,
    remainingTime,
    buttonText,
    canExecute,
    execute,
  };
}

