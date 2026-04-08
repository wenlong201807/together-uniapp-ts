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
    request.post<SquarePost>('/square/posts', data),

  getPosts: (params?: GetPostsParams) =>
    request.get<{ list: Post[]; total: number }>('/square/posts', params),

  getPost: (id: number) =>
    request.get<SquarePost>(`/square/posts/${id}`),

  deletePost: (id: number) =>
    request.delete<{ success: boolean }>(`/square/posts/${id}`),

  createComment: (data: CreateCommentDto) =>
    request.post<{ id: number }>('/square/comment', data),

  getComments: (
    postId: number,
    params?: {
      page?: number;
      pageSize?: number;
      sort?: 'time' | 'hot';
    },
  ) => {
    return request.get<{ list: Comment[]; total: number }>(
      `/square/posts/${postId}/comments`,
      params,
    );
  },

  getReplies: (
    commentId: number,
    params?: { page?: number; pageSize?: number },
  ) => {
    return request.get<{ list: Comment[]; total: number }>(
      `/square/comments/${commentId}/replies`,
      params,
    );
  },

  toggleLike: (data: LikeDto) =>
    request.post<{ isLiked: boolean }>('/square/like', data),

  likePost: (postId: number) =>
    request.post<{ isLiked: boolean }>(`/square/posts/${postId}/like`),

  unlikePost: (postId: number) =>
    request.delete<{ isLiked: boolean }>(`/square/posts/${postId}/like`),

  report: (data: ReportDto) =>
    request.post<PostReport>('/square/report', data),
};
