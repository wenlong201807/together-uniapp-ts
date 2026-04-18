import request from '../request';
import type { UserInfo } from '@/types';
import type { User, UpdateUserDto } from '@/types/api/backend-types';

/**
 * 更新用户资料请求参数
 */
export interface UpdateProfileDto {
  nickname?: string;
  mobile?: string;
  avatarId?: string;    // 预设头像 ID (1-49)
  avatarUrl?: string;   // 自定义头像 URL
  avatarPath?: string;  // 头像相对路径
  gender?: number;      // 性别
  bio?: string;         // 个人简介
  city?: string;        // 城市
  birthDate?: string;   // 出生日期
}

/**
 * 用户 API 接口
 */
export const userApi = {
  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  getCurrentUser: () =>
    request.get<User>('/user/me'),

  /**
   * 更新用户信息
   * @param data 更新数据
   * @returns 更新后的用户信息
   */
  updateUser: (data: UpdateUserDto) =>
    request.put<User>('/user/me', data),

  /**
   * 更新用户资料
   * @param data 更新数据，支持昵称、手机号、头像ID或头像URL
   * @returns 更新后的用户信息
   */
  updateProfile: (data: UpdateProfileDto) =>
    request.put<User>('/user/profile', data),

  /**
   * 查询用户积分
   * @returns 用户积分信息
   */
  getUserPoints: () =>
    request.get<{ points: number }>('/user/points'),

  /**
   * 查看用户详情
   * @param id 用户ID
   * @returns 用户详情
   */
  getUserProfile: (id: number) =>
    request.get<object>(`/user/${id}`),

  /**
   * 上传头像
   * @param file 头像文件
   * @returns 上传结果，包含头像URL
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request.post<{ url: string }>('/user/avatar', formData);
  },

  /**
   * 更换手机号
   * @param data 新手机号和验证码
   * @returns 更换结果
   */
  changeMobile: (data: { newMobile: string; code: string }) =>
    request.put<{ message: string; mobile: string }>('/user/mobile', data),

  /**
   * 举报用户
   * @param data 举报信息
   * @returns 举报结果
   */
  reportUser: (data: { userId: number; reason: number; description: string }) =>
    request.post<{ message: string }>('/user/report', data),

  /**
   * 拉黑用户
   * @param userId 用户ID
   * @returns 拉黑结果
   */
  blockUser: (userId: number) =>
    request.post<{ message: string }>(`/user/block/${userId}`),
};
