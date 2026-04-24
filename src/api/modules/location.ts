import request from '../request';
import type { ApiResponse } from '@/types';

/**
 * 位置信息
 */
export interface LocationInfo {
  latitude: number;
  longitude: number;
  city: string;
  province?: string;
  district?: string;
  address?: string;
}

/**
 * 获取当前定位
 */
export function getCurrentLocation(): Promise<ApiResponse<LocationInfo>> {
  return request.get('/location/current');
}

/**
 * 根据坐标获取城市信息
 */
export function getCityByCoordinates(params: {
  latitude: number;
  longitude: number;
}): Promise<ApiResponse<LocationInfo>> {
  return request.post('/location/geocode', params);
}

/**
 * 保存用户选择的城市
 */
export function saveUserCity(city: string): Promise<ApiResponse<void>> {
  return request.post('/location/save-city', { city });
}

/**
 * 获取用户保存的城市
 */
export function getUserCity(): Promise<ApiResponse<{ city: string }>> {
  return request.get('/location/user-city');
}
