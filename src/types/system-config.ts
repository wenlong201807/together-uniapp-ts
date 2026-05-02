/**
 * 系统配置类型定义
 */

export interface SystemConfig {
  debug?: {
    vconsole_enabled?: boolean;
  };
  app?: {
    name?: string;
  };
  signup?: {
    enabled?: boolean;
    invite_required?: boolean;
  };
  square?: {
    enabled?: boolean;
    max_images?: number;
  };
  chat?: {
    enabled?: boolean;
  };
  friend?: {
    max_count?: number;
    unlock_points?: number;
  };
  points?: {
    enabled?: boolean;
  };
  certification?: {
    enabled?: boolean;
  };
}

export interface SystemConfigResponse {
  code: number;
  data: SystemConfig;
  message: string;
  timestamp: number;
}
