import request from '../request';
import type { Post, Comment } from '@/types';
import type { TargetType, ReportReason } from '@/types/enums';

export interface CreatePostDto {
  content: string;
  images?: string[];
}

export interface CreateCommentDto {
  postId: number;
  parentId?: number;
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
  sort?: string;
}

export const squareApi = {
  createPost: (data: CreatePostDto) =>
    request.post<Post>('/square/posts', data),

  getPosts: (params?: GetPostsParams) =>
    request.get<{ list: Post[]; total: number }>('/square/posts', params),

  getPost: (id: number) => request.get<Post>(`/square/posts/${id}`),

  deletePost: (id: number) => request.delete(`/square/posts/${id}`),

  createComment: (data: CreateCommentDto) =>
    request.post<Comment>('/square/comment', data),

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

  toggleLike: (data: LikeDto) => request.post('/square/like', data),

  report: (data: ReportDto) => request.post('/square/report', data),
};
