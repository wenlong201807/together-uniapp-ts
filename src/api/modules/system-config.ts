/**
 * 系统配置 API
 */

import request from '@/api/request';
import type { SystemConfig } from '@/types/system-config';

/**
 * 获取公开系统配置
 */
export function getPublicConfig() {
  return request.get<SystemConfig>('/public/config');
}

/**
 * 获取系统配置（带缓存）
 * @param forceRefresh 是否强制刷新
 */
export async function getPublicConfigWithCache(forceRefresh = false) {
  const CACHE_KEY = 'system_config_cache';
  const CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟

  // 如果不强制刷新，先读缓存
  if (!forceRefresh) {
    try {
      const cached = uni.getStorageSync(CACHE_KEY);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRE) {
        return cached.data;
      }
    } catch (error) {
      console.warn('[SystemConfig] 读取缓存失败:', error);
    }
  }

  // 缓存失效或强制刷新，请求接口
  try {
    const response = await getPublicConfig();

    // 缓存数据
    try {
      uni.setStorageSync(CACHE_KEY, {
        data: response.data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[SystemConfig] 缓存数据失败:', error);
    }

    return response.data;
  } catch (error) {
    console.error('[SystemConfig] 获取配置失败:', error);
    throw error;
  }
}

/**
 * 清除系统配置缓存
 */
export function clearSystemConfigCache() {
  try {
    uni.removeStorageSync('system_config_cache');
  } catch (error) {
    console.warn('[SystemConfig] 清除缓存失败:', error);
  }
}
