import request from '../request';
import type { Post, Comment } from '@/types';
import type { TargetType, ReportReason } from '@/types/enums';
import type {
  CreatePostDto as BackendCreatePostDto,
  CreateCommentDto as BackendCreateCommentDto,
  LikeDto as BackendLikeDto,
  ReportDto as BackendReportDto,
  SquarePost,
  PostReport
} from '@/types/api/backend-types';

export interface CreatePostDto {
  content: string;
  images?: string[];
}

export interface CreateCommentDto {
  postId: number;
  parentId?: number;
  replyToId?: number;
  replyToUserId?: number;
  content: string;
}

export interface LikeDto {
  targetId: number;
  targetType: TargetType;
}

export interface ReportDto {
  postId: number;
  reason: ReportReason;
  description?: string;
}

export interface GetPostsParams {
  page?: number;
  pageSize?: number;
  sort?: 'hot' | 'latest';
}

export const squareApi = {
  createPost: (data: CreatePostDto) =>
    request.post<SquarePost>('/api/v1/square/posts', data),

  getPosts: (params?: GetPostsParams) =>
    request.get<{ list: Post[]; total: number }>('/api/v1/square/posts', params),

  getPost: (id: number) =>
    request.get<SquarePost>(`/api/v1/square/posts/${id}`),

  deletePost: (id: number) =>
    request.delete<{ success: boolean }>(`/api/v1/square/posts/${id}`),

  createComment: (data: CreateCommentDto) =>
    request.post<{ id: number }>('/api/v1/square/comment', data),

  getComments: (
    postId: number,
    params?: {
      page?: number;
      pageSize?: number;
      sort?: 'time' | 'hot';
    },
  ) => {
    return request.get<{ list: Comment[]; total: number }>(
      `/api/v1/square/posts/${postId}/comments`,
      params,
    );
  },

  getReplies: (
    commentId: number,
    params?: { page?: number; pageSize?: number },
  ) => {
    return request.get<{ list: Comment[]; total: number }>(
      `/api/v1/square/comments/${commentId}/replies`,
      params,
    );
  },

  toggleLike: (data: LikeDto) =>
    request.post<{ isLiked: boolean }>('/api/v1/square/like', data),

  likePost: (postId: number) =>
    request.post<{ isLiked: boolean }>(`/api/v1/square/posts/${postId}/like`),

  unlikePost: (postId: number) =>
    request.delete<{ isLiked: boolean }>(`/api/v1/square/posts/${postId}/like`),

  report: (data: ReportDto) =>
    request.post<PostReport>('/api/v1/square/report', data),
};
