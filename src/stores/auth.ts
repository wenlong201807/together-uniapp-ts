import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api';
import type { LoginResponse, UserInfo } from '@/types';
import type { LoginDto, RegisterDto } from '@/api/modules/auth';

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
    };
  },
  {
    persist: true,
  },
);
