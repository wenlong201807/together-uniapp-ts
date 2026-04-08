import request from '../request';
import type { Message, Conversation } from '@/types';
import type { MsgType } from '@/types/enums';
import type { SendMessageDto as BackendSendMessageDto } from '@/types/api/backend-types';

export interface SendMessageDto {
  receiverId: number;
  content: string;
  msgType?: MsgType;
}

export interface GetHistoryParams {
  page?: number;
  pageSize?: number;
  beforeId?: number;
}

export const chatApi = {
  sendMessage: (data: SendMessageDto) =>
    request.post<{ id: number }>('/chat/send', data),

  getHistory: (userId: number, params?: GetHistoryParams) =>
    request.get<{ data: Message[]; total: number }>(
      `/chat/history/${userId}`,
      params,
    ),

  getConversations: () =>
    request.get<{ data: Conversation[]; unreadCount: number }>(
      '/chat/conversations',
    ),

  getMessages: (params?: { page?: number; pageSize?: number }) =>
    request.get<{ data: Message[]; total: number }>(
      '/chat/messages',
      params,
    ),

  markAsRead: (userId: number) =>
    request.put<{ success: boolean }>(`/chat/read/${userId}`),
};
