import { FriendStatus } from './enums';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

export interface UserInfo {
  id: number;
  mobile: string;
  nickname: string;
  avatarUrl?: string;
  avatarId?: number;
  gender?: Gender;
  status?: UserStatus;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  msgType: MsgType;
  createdAt: string;
  sender?: UserInfo;
}

export interface Conversation {
  userId: number;
  nickname: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface Post {
  id: number;
  userId: number;
  content: string;
  images?: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  user?: UserInfo;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  parentId?: number;
  replyToId?: number;
  replyToUserId?: number;
  content: string;
  createdAt: string;
  user?: UserInfo;
  replyToUser?: {
    id: number;
    nickname: string;
  };
  replyCount?: number;
  replies?: Comment[];
}

export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: FriendStatus;
  createdAt: string;
  user?: UserInfo;
}
