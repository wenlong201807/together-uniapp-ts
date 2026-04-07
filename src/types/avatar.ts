/**
 * 头像相关类型定义
 */

/**
 * 头像选项接口
 * 用于表示用户选择的头像信息
 */
export interface AvatarOption {
  /** 头像类型：预设或自定义 */
  type: 'preset' | 'custom';
  /** 头像值：预设时为 1-49，自定义时为上传路径 */
  value: string;
  /** 显示用的完整 URL */
  displayUrl: string;
}

/**
 * 用户资料接口
 * 包含用户的头像和基本信息
 */
export interface UserProfile {
  /** 头像类型 */
  avatarType: 'preset' | 'custom';
  /** 头像值：ID 或路径 */
  avatarValue: string;
  /** 完整的头像 URL */
  avatarUrl: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户手机号 */
  mobile: string;
}
