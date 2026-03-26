import request from '../request';
import type { LoginResponse, UserInfo } from '@/types';
import type { Gender } from '@/types/enums';

export interface SmsDto {
  mobile: string;
}

export interface RegisterDto {
  mobile: string;
  code: string;
  password: string;
  nickname: string;
  gender?: Gender;
  inviteCode?: string;
}

export interface LoginDto {
  mobile: string;
  password: string;
}

export const authApi = {
  sendSms: (data: SmsDto) =>
    request.post<LoginResponse>('/auth/sms/send', data),

  register: (data: RegisterDto) =>
    request.post<LoginResponse>('/auth/register', data),

  login: (data: LoginDto) => request.post<LoginResponse>('/auth/login', data),

  refreshToken: (refreshToken: string) =>
    request.post<LoginResponse>('/auth/refresh', {
      refreshToken: refreshToken,
    }),

  updateUser: (data: {
    nickname?: string;
    gender?: Gender;
    avatarUrl?: string;
  }) => request.put<UserInfo>('/user/me', data),
};
