import request from '../request';
import type { LoginResponse, UserInfo } from '@/types';
import type { Gender } from '@/types/enums';
import type {
  SmsDto as BackendSmsDto,
  RegisterDto as BackendRegisterDto,
  LoginDto as BackendLoginDto,
  ResetPasswordDto,
  User
} from '@/types/api/backend-types';

export interface SmsDto {
  mobile: string;
  email: string;
  type: 'register' | 'login' | 'reset_password';
}

export interface RegisterDto {
  mobile: string;
  email: string;
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
    request.post<{ message: string }>('/auth/sms/send', data),

  register: (data: RegisterDto) =>
    request.post<{ token: string; user: User }>('/auth/register', data),

  login: (data: LoginDto) =>
    request.post<{ token: string; user: User }>('/auth/login', data),

  resetPassword: (data: ResetPasswordDto) =>
    request.post<{ message: string }>('/auth/reset-password', data),

  refreshToken: (refreshToken: string) =>
    request.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken: refreshToken,
    }),

  updateUser: (data: {
    nickname?: string;
    gender?: Gender;
    avatarUrl?: string;
  }) => request.put<User>('/user/me', data),
};
