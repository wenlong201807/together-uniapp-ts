import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, userApi } from '@/api';
import type { LoginResponse, UserInfo } from '@/types';
import type { LoginDto, RegisterDto } from '@/api/modules/auth';
import type { UpdateProfileDto } from '@/api/modules/user';
import { eventBus, EVENTS } from '@/utils/event-bus';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string>('');
    const refreshToken = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);

    const isLoggedIn = computed(() => !!token.value);

    const login = async (data: LoginDto) => {
      const res = await authApi.login(data);
      token.value = res.data.token;
      refreshToken.value = res.data.refreshToken || res.data.token;
      userInfo.value = res.data.user;

      uni.setStorageSync('token', res.data.token);
      uni.setStorageSync('refreshToken', res.data.refreshToken || res.data.token);
      uni.setStorageSync('userInfo', res.data.user);

      return res.data;
    };

    const register = async (data: RegisterDto) => {
      const res = await authApi.register(data);
      token.value = res.data.token;
      refreshToken.value = res.data.refreshToken || res.data.token;
      userInfo.value = res.data.user;

      uni.setStorageSync('token', res.data.token);
      uni.setStorageSync('refreshToken', res.data.refreshToken || res.data.token);
      uni.setStorageSync('userInfo', res.data.user);

      return res.data;
    };

    const logout = () => {
      token.value = '';
      refreshToken.value = '';
      userInfo.value = null;

      uni.removeStorageSync('token');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('userInfo');
    };

    const refreshAccessToken = async () => {
      try {
        const res = await authApi.refreshToken(refreshToken.value);
        token.value = res.data.token;

        if (res.data.refreshToken) {
          refreshToken.value = res.data.refreshToken;
          uni.setStorageSync('refreshToken', res.data.refreshToken);
        }

        uni.setStorageSync('token', res.data.token);

        return res.data;
      } catch (error) {
        logout();
        throw error;
      }
    };

    const init = () => {
      token.value = uni.getStorageSync('token') || '';
      refreshToken.value = uni.getStorageSync('refreshToken') || '';
      userInfo.value = uni.getStorageSync('userInfo') || null;
    };

    const updateUserInfo = (info: UserInfo) => {
      userInfo.value = info;
      uni.setStorageSync('userInfo', info);
      // 触发全局头像更新事件
      eventBus.emit(EVENTS.AVATAR_UPDATED, {
        userId: info.id,
        avatarId: info.avatarId,
        avatarUrl: info.avatarUrl,
      });
    };

    /**
     * 更新用户资料
     * @param data 更新数据，支持昵称、手机号、头像ID或头像URL
     * @returns 更新后的用户信息
     */
    const updateProfile = async (data: UpdateProfileDto) => {
      try {
        const res = await userApi.updateProfile(data);
        // 更新本地状态
        if (userInfo.value) {
          userInfo.value = {
            ...userInfo.value,
            ...res.data,
          };
          uni.setStorageSync('userInfo', userInfo.value);
          // 触发全局头像更新事件
          eventBus.emit(EVENTS.AVATAR_UPDATED, {
            userId: res.data.id,
            avatarId: res.data.avatarId,
            avatarUrl: res.data.avatarUrl,
          });
        }
        return res.data;
      } catch (error) {
        console.error('更新用户资料失败:', error);
        throw error;
      }
    };

    return {
      token,
      refreshToken,
      userInfo,
      isLoggedIn,
      login,
      register,
      logout,
      refreshAccessToken,
      init,
      updateUserInfo,
      updateProfile,
    };
  },
  {
    persist: true,
  },
);
