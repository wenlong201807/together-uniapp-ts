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
 * 后端 NearbyUsersDto: distance, gender, minAge, maxAge, page, pageSize
 * 注意：需要先通过 POST /location/update 更新位置，才能获取附近的人
 */
export interface NearbyFilterParams {
  distance?: number; // 距离范围（米），默认5000
  gender?: number; // 性别筛选：0-不限，1-男，2-女
  minAge?: number; // 最小年龄
  maxAge?: number; // 最大年龄
  page?: number;
  pageSize?: number;
}

/**
 * 获取附近的人列表
 * 后端路由: GET /nearby/users，参数通过 Query 传递
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
 * 打招呼
 * 后端路由: POST /nearby/users/:id/hello
 */
export function sayHello(userId: number, content?: string): Promise<ApiResponse<void>> {
  return request.post(`/nearby/users/${userId}/hello`, {
    content: content || '你好，很高兴认识你！'
  });
}

/**
 * 记录访问
 * 后端路由: POST /nearby/visit
 */
export function recordVisit(visitedUserId: number, distance: number): Promise<ApiResponse<void>> {
  return request.post('/nearby/visit', { visitedUserId, distance });
}

/**
 * 获取附近统计（访问统计）
 * 后端路由: GET /nearby/stats
 */
export function getNearbyStats(days?: number): Promise<
  ApiResponse<{
    visitedCount: number;
    visitorCount: number;
    days: number;
  }>
> {
  return request.get('/nearby/stats', days ? { days } : undefined);
}
