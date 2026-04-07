import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AvatarOption } from '@/types/avatar';

/**
 * 头像状态管理 Store
 * 管理用户选择的头像信息
 */
export const useAvatarStore = defineStore(
  'avatar',
  () => {
    /**
     * 当前选择的头像
     * 默认为预设头像 1
     */
    const selectedAvatar = ref<AvatarOption>({
      type: 'preset',
      value: '1',
      displayUrl: '',
    });

    /**
     * 设置选择的头像
     * @param avatar - 头像选项
     */
    const setSelectedAvatar = (avatar: AvatarOption) => {
      selectedAvatar.value = avatar;
    };

    /**
     * 获取头像显示 URL 或 CSS 类名
     * 预设头像返回 CSS 类名，自定义头像返回完整 URL
     * @returns 头像显示标识
     */
    const getAvatarUrl = () => {
      if (selectedAvatar.value.type === 'preset') {
        return `sprite-avatar avatar-${selectedAvatar.value.value}`;
      }
      return selectedAvatar.value.displayUrl;
    };

    return {
      selectedAvatar,
      setSelectedAvatar,
      getAvatarUrl,
    };
  },
  {
    persist: true,
  },
);
