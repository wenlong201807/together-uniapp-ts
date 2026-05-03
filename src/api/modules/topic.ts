import request from '../request';
import type { ApiResponse } from '@/types';

/**
 * 话题详情
 */
export interface TopicDetail {
  id: number;
  name: string;
  description?: string;
  coverImage: string;
  coverImages?: string[];
  postCount: number;
  followCount: number;
  participantCount: number;
  viewCount: number;
  hotScore: number;
  isHot: boolean;
  status: number;
  sortOrder: number;
  seoKeywords?: string;
  creatorId?: number;
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
  isJoined?: boolean;
}

/**
 * 话题动态
 */
export interface TopicPost {
  id: number;
  content: string;
  images?: string[];
  user: {
    id: number;
    nickname: string;
    avatar: string;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  createTime: number;
}

/**
 * 获取话题列表
 */
export function getTopics(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<ApiResponse<{ list: TopicDetail[]; total: number; hasMore: boolean }>> {
  return request.get('/topics', params);
}

/**
 * 获取热门话题
 */
export function getHotTopics(limit?: number): Promise<ApiResponse<{ list: TopicDetail[] }>> {
  return request.get('/topics/hot', { limit });
}

/**
 * 获取我参与的话题
 */
export function getMyTopics(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<{ list: TopicDetail[]; total: number; hasMore: boolean }>> {
  return request.get('/topics/my-follows', params);
}

/**
 * 搜索话题
 */
export function searchTopics(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<{ list: TopicDetail[]; total: number; hasMore: boolean }>> {
  return request.get('/topics/search', params);
}

/**
 * 获取话题详情
 */
export function getTopicDetail(topicId: number): Promise<ApiResponse<TopicDetail>> {
  return request.get(`/topics/${topicId}`);
}

/**
 * 获取话题下的帖子
 */
export function getTopicPosts(params: {
  topicId: number;
  page?: number;
  pageSize?: number;
  sort?: 'hot' | 'latest';
}): Promise<ApiResponse<{ list: TopicPost[]; total: number; hasMore: boolean }>> {
  return request.get(`/topics/${params.topicId}/posts`, {
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort || 'latest',
  });
}

/**
 * 关注话题
 */
export function followTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.post(`/topics/${topicId}/follow`);
}

/**
 * 取消关注话题
 */
export function unfollowTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.delete(`/topics/${topicId}/follow`);
}

/**
 * 参与话题（别名：关注话题）
 */
export function joinTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return followTopic(topicId);
}

/**
 * 退出话题（别名：取消关注话题）
 */
export function leaveTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return unfollowTopic(topicId);
}

/**
 * 点赞话题动态
 */
export function likeTopicPost(postId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.post(`/square/posts/${postId}/like`);
}

/**
 * 取消点赞话题动态
 */
export function unlikeTopicPost(postId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.delete(`/square/posts/${postId}/like`);
}

/**
 * 创建话题
 */
export interface CreateTopicParams {
  name: string;
  description?: string;
  coverImage: string;
}

export function createTopic(params: CreateTopicParams): Promise<ApiResponse<TopicDetail>> {
  return request.post('/topics', params);
}

