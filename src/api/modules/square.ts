import request from '../request'
import type { Post, Comment } from '@/types'
import type { TargetType, ReportReason } from '@/types/enums'

export interface CreatePostDto {
  content: string
  images?: string[]
}

export interface CreateCommentDto {
  postId: number
  parentId?: number
  content: string
}

export interface LikeDto {
  targetId: number
  targetType: TargetType
}

export interface ReportDto {
  postId: number
  reason: ReportReason
  description?: string
}

export interface GetPostsParams {
  page?: number
  pageSize?: number
  sort?: string
}

export const squareApi = {
  createPost: (data: CreatePostDto) => request.post<Post>('/square/post', data),

  getPosts: (params?: GetPostsParams) =>
    request.get<{ data: Post[]; total: number }>('/square/posts', params),

  getPost: (id: number) => request.get<Post>(`/square/post/${id}`),

  deletePost: (id: number) => request.delete(`/square/post/${id}`),

  createComment: (data: CreateCommentDto) => request.post<Comment>('/square/comment', data),

  getComments: (postId: number, params?: { page?: number; pageSize?: number }) =>
    request.get<{ data: Comment[]; total: number }>(`/square/post/${postId}/comments`, params),

  toggleLike: (data: LikeDto) => request.post('/square/like', data),

  report: (data: ReportDto) => request.post('/square/report', data)
}