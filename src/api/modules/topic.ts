import request from '../request';
import type { ApiResponse } from '@/types';

/**
 * 话题详情
 */
export interface TopicDetail {
  id: number;
  title: string;
  description: string;
  coverImages: string[];
  participantCount: number;
  postCount: number;
  viewCount: number;
  isJoined: boolean;
  createTime: number;
  updateTime: number;
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
 * 话题统计
 */
export interface TopicStats {
  participantCount: number;
  postCount: number;
  viewCount: number;
  todayPostCount: number;
}

/**
 * 话题参与者
 */
export interface TopicParticipant {
  id: number;
  nickname: string;
  avatar: string;
  joinTime: number;
  postCount: number;
}

/**
 * 获取话题详情
 */
export function getTopicDetail(topicId: number): Promise<ApiResponse<TopicDetail>> {
  return request.get(`/api/topics/${topicId}`);
}

/**
 * 获取话题动态列表
 */
export function getTopicPosts(params: {
  topicId: number;
  page: number;
  pageSize: number;
  sort?: 'hot' | 'latest';
}): Promise<ApiResponse<{ list: TopicPost[]; total: number; hasMore: boolean }>> {
  return request.get(`/api/topics/${params.topicId}/posts`, {
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort || 'latest',
  });
}

/**
 * 参与话题（关注）
 */
export function joinTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.post(`/api/topics/${topicId}/join`);
}

/**
 * 退出话题（取消关注）
 */
export function leaveTopic(topicId: number): Promise<ApiResponse<{ success: boolean }>> {
  return request.post(`/api/topics/${topicId}/leave`);
}

/**
 * 发布话题动态
 */
export function publishTopicPost(data: {
  topicId: number;
  content: string;
  images?: string[];
}): Promise<ApiResponse<{ id: number }>> {
  return request.post(`/api/topics/${data.topicId}/posts`, {
    content: data.content,
    images: data.images,
  });
}

/**
 * 获取话题统计
 */
export function getTopicStats(topicId: number): Promise<ApiResponse<TopicStats>> {
  return request.get(`/api/topics/${topicId}/stats`);
}

/**
 * 获取话题参与者列表
 */
export function getTopicParticipants(params: {
  topicId: number;
  page: number;
  pageSize: number;
}): Promise<ApiResponse<{ list: TopicParticipant[]; total: number }>> {
  return request.get(`/api/topics/${params.topicId}/participants`, {
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 点赞话题动态
 */
export function likeTopicPost(postId: number): Promise<ApiResponse<{ isLiked: boolean }>> {
  return request.post(`/api/topics/posts/${postId}/like`);
}

/**
 * 取消点赞话题动态
 */
export function unlikeTopicPost(postId: number): Promise<ApiResponse<{ isLiked: boolean }>> {
  return request.delete(`/api/topics/posts/${postId}/like`);
}

/**
 * 搜索话题
 */
export function searchTopics(params: {
  keyword: string;
  page: number;
  pageSize: number;
}): Promise<ApiResponse<{ list: TopicDetail[]; total: number }>> {
  return request.get('/api/topics/search', params);
}

/**
 * 获取热门话题
 */
export function getHotTopics(params: {
  page: number;
  pageSize: number;
}): Promise<ApiResponse<{ list: TopicDetail[]; total: number }>> {
  return request.get('/api/topics/hot', params);
}
