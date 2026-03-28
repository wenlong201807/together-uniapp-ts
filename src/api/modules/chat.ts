import request from '../request';
import type { Message, Conversation } from '@/types';
import type { MsgType } from '@/types/enums';

export interface SendMessageDto {
  receiverId: string;
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
    request.post<Message>('/chat/send', data),

  getHistory: (userId: number, params?: GetHistoryParams) =>
    request.get<{ data: Message[]; total: number }>(
      `/chat/history/${userId}`,
      params,
    ),

  getConversations: () =>
    request.get<{ data: Conversation[]; unreadCount: number }>(
      '/chat/conversations',
    ),

  markAsRead: (userId: number) => request.put(`/chat/read/${userId}`),
};
