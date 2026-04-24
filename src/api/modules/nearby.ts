import request from '../request';
import type { ApiResponse } from '@/types';

/**
 * 附近的人用户信息
 */
export interface NearbyUser {
  id: number;
  nickname: string;
  avatar: string;
  age?: number;
  gender?: number;
  city?: string;
  bio?: string;
  tags?: string[];
  distance: number; // 距离（米）
  distanceText: string; // 距离文本（如：1.2km）
  lastActiveTime: number; // 最后活跃时间
  isOnline: boolean; // 是否在线
  hasSaidHello?: boolean; // 是否已打招呼
}

/**
 * 附近的人筛选参数
 */
export interface NearbyFilterParams {
  latitude: number;
  longitude: number;
  maxDistance?: number; // 最大距离（米），默认5000
  gender?: number; // 性别筛选：0-不限，1-男，2-女
  minAge?: number; // 最小年龄
  maxAge?: number; // 最大年龄
  page: number;
  pageSize: number;
  sortBy?: 'distance' | 'active'; // 排序方式：距离或活跃度
}

/**
 * 获取附近的人列表
 */
export function getNearbyUsers(params: NearbyFilterParams): Promise<
  ApiResponse<{
    list: NearbyUser[];
    total: number;
    hasMore: boolean;
  }>
> {
  return request.get('/nearby/users', params);
}

/**
 * 更新用户位置
 */
export function updateUserLocation(params: {
  latitude: number;
  longitude: number;
}): Promise<ApiResponse<void>> {
  return request.post('/nearby/location', params);
}

/**
 * 获取用户当前位置
 */
export function getUserCurrentLocation(): Promise<
  ApiResponse<{
    latitude: number;
    longitude: number;
    city: string;
    updateTime: number;
  }>
> {
  return request.get('/nearby/location');
}

/**
 * 打招呼
 */
export function sayHello(userId: number, content?: string): Promise<ApiResponse<void>> {
  return request.post(`/nearby/users/${userId}/hello`, {
    content: content || '你好，很高兴认识你！'
  });
}

/**
 * 获取附近统计
 */
export function getNearbyStats(): Promise<
  ApiResponse<{
    totalCount: number; // 附近总人数
    onlineCount: number; // 在线人数
    newCount: number; // 新用户数
  }>
> {
  return request.get('/nearby/stats');
}
