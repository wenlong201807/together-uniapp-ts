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
 * 更新位置参数（匹配后端 UpdateLocationDto）
 */
export interface UpdateLocationParams {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  district?: string;
  address?: string;
}

/**
 * 更新用户位置
 * 后端路由: POST /location/update
 */
export function updateLocation(params: UpdateLocationParams): Promise<ApiResponse<LocationInfo>> {
  return request.post('/location/update', params);
}

/**
 * 获取当前定位
 * 后端路由: GET /location/current
 */
export function getCurrentLocation(): Promise<ApiResponse<LocationInfo>> {
  return request.get('/location/current');
}

/**
 * 根据坐标获取城市信息
 * 后端路由: POST /location/geocode
 */
export function getCityByCoordinates(params: {
  latitude: number;
  longitude: number;
}): Promise<ApiResponse<LocationInfo>> {
  return request.post('/location/geocode', params);
}

/**
 * 保存用户选择的城市
 * 后端路由: POST /location/save-city
 * 后端 DTO: { cityId: number }
 */
export function saveUserCity(cityId: number): Promise<ApiResponse<void>> {
  return request.post('/location/save-city', { cityId });
}

/**
 * 获取用户保存的城市
 * 后端路由: GET /location/user-city
 */
export function getUserCity(): Promise<ApiResponse<{ city: string }>> {
  return request.get('/location/user-city');
}

/**
 * 设置位置可见性
 * 后端路由: PUT /location/visibility
 */
export function setLocationVisibility(isVisible: number): Promise<ApiResponse<void>> {
  return request.put('/location/visibility', { isVisible });
}
