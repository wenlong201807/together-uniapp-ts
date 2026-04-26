import request from '../request';
import type { Message, Conversation } from '@/types';
import type { MsgType } from '@/types/enums';
import type { SendMessageDto as BackendSendMessageDto } from '@/types/api/backend-types';

export interface SendMessageDto {
  receiverId: number;
  content: string;
  msgType?: MsgType;
}

export interface GetMessagesParams {
  friendId: number;
  page?: number;
  limit?: number;
}

export const chatApi = {
  sendMessage: (data: SendMessageDto) =>
    request.post<{ id: number }>('/chat/send', data),

  getHistory: (userId: number, params?: { page?: number; pageSize?: number; beforeId?: number }) =>
    request.get<{ data: Message[]; total: number }>(
      `/chat/history/${userId}`,
      params,
    ),

  getConversations: () =>
    request.get<{ data: Conversation[]; unreadCount: number }>(
      '/chat/conversations',
    ),

  /**
   * 获取消息列表（与某好友的消息）
   * 后端路由: GET /chat/messages?friendId=X&page=X&limit=X
   */
  getMessages: (params: GetMessagesParams) =>
    request.get<{ data: Message[]; total: number }>(
      '/chat/messages',
      params,
    ),

  markAsRead: (userId: number) =>
    request.put<{ success: boolean }>(`/chat/read/${userId}`),
};
