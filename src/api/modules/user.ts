import request from '../request';
import type { UserInfo } from '@/types';

/**
 * 更新用户资料请求参数
 */
export interface UpdateProfileDto {
  nickname?: string;
  mobile?: string;
  avatarId?: string;    // 预设头像 ID (1-49)
  avatarUrl?: string;   // 自定义头像 URL
}

/**
 * 用户 API 接口
 */
export const userApi = {
  /**
   * 更新用户资料
   * @param data 更新数据，支持昵称、手机号、头像ID或头像URL
   * @returns 更新后的用户信息
   */
  updateProfile: (data: UpdateProfileDto) =>
    request.post<UserInfo>('/user/profile', data),

  /**
   * 上传头像
   * @param file 头像文件
   * @returns 上传结果，包含头像URL
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request.post<{ avatarUrl: string }>('/user/upload-avatar', formData);
  },
};
