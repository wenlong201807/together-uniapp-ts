/**
 * 首页推荐相关 API
 *
 * 后端 Home 模块已实现，以下接口可用
 */
import request from './request';
import type { ApiResponse } from '@/types';

/**
 * 推荐流响应数据
 */
export interface RecommendationFeedResponse {
  data: RecommendationItem[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * 推荐项
 */
export interface RecommendationItem {
  id: string;
  type: 'personalized' | 'hot' | 'nearby' | 'topic' | 'new';
  contentId: number;
  score: number;
  data: any;
}

/**
 * Banner 数据
 */
export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkType: 'activity' | 'topic' | 'user' | 'external';
  linkId?: number;
  linkUrl?: string;
}

/**
 * 话题数据
 */
export interface Topic {
  id: number;
  title: string;
  description?: string;
  participantCount: number;
  postCount: number;
  coverImages?: string[];
}

/**
 * 用户行为上报数据
 */
export interface UserActionTrack {
  action: 'view' | 'like' | 'skip' | 'share' | 'comment' | 'favorite';
  targetType: 'user' | 'post' | 'topic';
  targetId: number;
  timestamp: number;
  extra?: Record<string, any>;
}

/**
 * 获取推荐流
 * @param params 请求参数
 * @returns 推荐流数据
 */
export function getRecommendationFeed(params: {
  page: number;
  pageSize: number;
  types?: string[];
  cursor?: string;
  city?: string;  // 添加城市筛选参数
}): Promise<ApiResponse<RecommendationFeedResponse>> {
  return request.get('/home/feed', params);
}

/**
 * 获取 Banner 列表
 * @returns Banner 列表
 */
export function getBanners(): Promise<ApiResponse<Banner[]>> {
  return request.get('/home/banners');
}

/**
 * 获取话题列表
 * @param params 请求参数
 * @returns 话题列表
 */
export function getTopics(params: {
  page: number;
  pageSize: number;
}): Promise<ApiResponse<{ data: Topic[]; hasMore: boolean }>> {
  return request.get('/home/topics', params);
}

/**
 * 用户行为上报
 * @param data 行为数据
 * @returns 上报结果
 */
export function trackUserAction(data: UserActionTrack): Promise<ApiResponse<void>> {
  return request.post('/home/track', data);
}

/**
 * 批量用户行为上报
 * @param actions 行为数据列表
 * @returns 上报结果
 */
export function batchTrackUserActions(actions: UserActionTrack[]): Promise<ApiResponse<void>> {
  return request.post('/home/track/batch', { actions });
}

/**
 * 获取用户兴趣标签
 * @returns 用户兴趣标签
 */
export function getUserInterests(): Promise<
  ApiResponse<{
    tags: Array<{ tag: string; weight: number }>;
  }>
> {
  return request.get('/home/user/interests');
}

/**
 * 更新用户兴趣标签
 * @param tags 兴趣标签
 * @returns 更新结果
 */
export function updateUserInterests(tags: Array<{ tag: string; weight: number }>): Promise<ApiResponse<void>> {
  return request.post('/home/user/interests', { tags });
}

/**
 * 获取用户位置信息
 * @returns 用户位置
 */
export function getUserLocation(): Promise<
  ApiResponse<{
    latitude: number;
    longitude: number;
    city: string;
    updateTime: number;
  }>
> {
  return request.get('/home/user/location');
}

/**
 * 更新用户位置信息
 * @param location 位置数据
 * @returns 更新结果
 */
export function updateUserLocation(location: {
  latitude: number;
  longitude: number;
  city?: string;
}): Promise<ApiResponse<void>> {
  return request.post('/home/user/location', location);
}

/**
 * 获取推荐配置
 * @returns 推荐配置
 */
export function getRecommendationConfig(): Promise<
  ApiResponse<{
    ratios: {
      personalized: number;
      hot: number;
      nearby: number;
      topic: number;
      new: number;
    };
    pageSize: number;
  }>
> {
  return request.get('/home/config');
}

/**
 * 反馈推荐质量
 * @param feedback 反馈数据
 * @returns 反馈结果
 */
export function feedbackRecommendation(feedback: {
  recommendationId: string;
  rating: number; // 1-5星
  reason?: string;
}): Promise<ApiResponse<void>> {
  return request.post('/home/feedback', feedback);
}
