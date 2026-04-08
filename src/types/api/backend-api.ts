import type {
  User,
  UpdateUserDto,
  UserProfile,
  UpdateProfileDto,
  FileRecord,
  GetUploadTokenDto,
  UploadTokenResponseDto,
  Friendship,
  UserBlacklist,
  PointsConfig,
  UpdatePointsConfigDto,
  SmsDto,
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  SquarePost,
  CreatePostDto,
  CreateCommentDto,
  LikeDto,
  ReportDto,
  PostReport,
  SendMessageDto,
  Certification,
  CreateCertificationDto,
  CertificationTypeConfig,
  CreateCertificationTypeDto,
  UpdateCertificationTypeDto,
  SystemConfig,
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  AdminSmsDto,
  AdminLoginDto,
  PaginationQuery,
  PaginationResponse,
  ApiResponse,
} from './types';

/**
 * 用户模块 API
 */
export namespace UserAPI {
  /**
   * 获取当前用户信息
   */
  export interface GetCurrentUserRequest {}
  export type GetCurrentUserResponse = ApiResponse<User>;

  /**
   * 更新用户信息
   */
  export type UpdateUserRequest = UpdateUserDto;
  export type UpdateUserResponse = ApiResponse<User>;

  /**
   * 更新用户资料
   */
  export type UpdateProfileRequest = UpdateUserDto;
  export type UpdateProfileResponse = ApiResponse<User>;

  /**
   * 查询用户积分
   */
  export interface GetUserPointsRequest {}
  export type GetUserPointsResponse = ApiResponse<{ points: number }>;

  /**
   * 查看用户详情
   */
  export interface GetUserProfileRequest {
    id: number;
  }
  export type GetUserProfileResponse = ApiResponse<object>;

  /**
   * 上传头像
   */
  export interface UploadAvatarRequest {
    file: File;
  }
  export type UploadAvatarResponse = ApiResponse<{ url: string }>;
}

/**
 * 文件管理模块 API
 */
export namespace FileAPI {
  /**
   * 获取七牛云上传凭证
   */
  export type GetUploadTokenRequest = GetUploadTokenDto;
  export type GetUploadTokenResponse = ApiResponse<UploadTokenResponseDto>;

  /**
   * 保存文件记录
   */
  export interface SaveFileRecordRequest {
    fileName: string;
    filePath: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileExt: string;
    bucketName: string;
    width?: number;
    height?: number;
    type: string;
  }
  export type SaveFileRecordResponse = ApiResponse<FileRecord>;

  /**
   * 获取文件配置
   */
  export interface GetConfigRequest {}
  export type GetConfigResponse = ApiResponse<object>;

  /**
   * 获取预签名上传URL
   */
  export interface GetPresignedPutUrlRequest {
    fileName: string;
    contentType: string;
  }
  export type GetPresignedPutUrlResponse = ApiResponse<{ url: string; key: string }>;

  /**
   * 直接上传文件
   */
  export interface UploadRequest {
    file: File;
  }
  export type UploadResponse = ApiResponse<FileRecord>;

  /**
   * 根据ID获取文件
   */
  export interface GetByIdRequest {
    id: number;
  }
  export type GetByIdResponse = ApiResponse<FileRecord>;

  /**
   * 删除文件
   */
  export interface DeleteRequest {
    id: number;
  }
  export type DeleteResponse = ApiResponse<{ success: boolean }>;

  /**
   * 获取文件访问URL
   */
  export interface GetUrlRequest {
    id: number;
  }
  export type GetUrlResponse = ApiResponse<{ url: string }>;

  /**
   * 获取我的文件列表
   */
  export interface GetMyFilesRequest extends PaginationQuery {
    type: string;
  }
  export type GetMyFilesResponse = ApiResponse<PaginationResponse<FileRecord>>;
}

/**
 * 管理员文件管理模块 API
 */
export namespace AdminFileAPI {
  /**
   * 获取文件列表
   */
  export interface GetListRequest extends PaginationQuery {
    status: number;
    keyword: string;
    startDate: string;
    endDate: string;
  }
  export type GetListResponse = ApiResponse<PaginationResponse<FileRecord>>;

  /**
   * 封禁文件
   */
  export interface BlockRequest {
    id: number;
  }
  export type BlockResponse = ApiResponse<{ success: boolean }>;

  /**
   * 解封文件
   */
  export interface UnblockRequest {
    id: number;
  }
  export type UnblockResponse = ApiResponse<{ success: boolean }>;

  /**
   * 批量封禁文件
   */
  export interface BatchBlockRequest {
    ids: Array<number>;
  }
  export type BatchBlockResponse = ApiResponse<{ success: boolean }>;
}

/**
 * 好友模块 API
 */
export namespace FriendAPI {
  /**
   * 获取好友列表
   */
  export interface GetFriendListRequest {}
  export type GetFriendListResponse = ApiResponse<Array<Friendship>>;

  /**
   * 获取关注列表
   */
  export interface GetFollowingListRequest {}
  export type GetFollowingListResponse = ApiResponse<Array<Friendship>>;

  /**
   * 获取好友状态
   */
  export interface GetFriendshipStatusRequest {
    userId: number;
  }
  export type GetFriendshipStatusResponse = ApiResponse<{
    isFriend: boolean;
    isFollowing: boolean;
    status: number;
  }>;

  /**
   * 添加关注
   */
  export interface FollowRequest {
    friendId: number;
  }
  export type FollowResponse = ApiResponse<Friendship>;

  /**
   * 添加好友请求
   */
  export interface FriendRequestRequest {
    friendId: number;
    message?: string;
  }
  export type FriendRequestResponse = ApiResponse<Friendship>;

  /**
   * 接受好友请求
   */
  export interface AcceptFriendRequest {
    friendId: number;
  }
  export type AcceptFriendResponse = ApiResponse<{ success: boolean }>;

  /**
   * 解锁私聊
   */
  export interface UnlockChatRequest {
    friendId: number;
  }
  export type UnlockChatResponse = ApiResponse<{ success: boolean }>;

  /**
   * 删除好友
   */
  export interface DeleteFriendRequest {
    userId: number;
  }
  export type DeleteFriendResponse = ApiResponse<{ success: boolean }>;

  /**
   * 拉黑用户
   */
  export interface BlockUserRequest {
    blockedUserId: number;
    reason?: string;
  }
  export type BlockUserResponse = ApiResponse<UserBlacklist>;

  /**
   * 获取黑名单
   */
  export interface GetBlocklistRequest {}
  export type GetBlocklistResponse = ApiResponse<Array<UserBlacklist>>;
}

/**
 * 积分模块 API
 */
export namespace PointsAPI {
  /**
   * 获取积分余额
   */
  export interface GetBalanceRequest {}
  export type GetBalanceResponse = ApiResponse<{ balance: number }>;

  /**
   * 签到
   */
  export interface SignRequest {}
  export type SignResponse = ApiResponse<{ points: number; continuousDays: number }>;

  /**
   * 获取积分配置列表
   */
  export interface GetConfigListRequest {}
  export type GetConfigListResponse = ApiResponse<Array<PointsConfig>>;

  /**
   * 更新积分配置
   */
  export interface UpdateConfigRequest extends UpdatePointsConfigDto {
    id: number;
  }
  export type UpdateConfigResponse = ApiResponse<PointsConfig>;
}

/**
 * 认证模块 API
 */
export namespace AuthAPI {
  /**
   * 发送短信验证码
   */
  export type SendSmsRequest = SmsDto;
  export type SendSmsResponse = ApiResponse<{ message: string }>;

  /**
   * 用户注册
   */
  export type RegisterRequest = RegisterDto;
  export type RegisterResponse = ApiResponse<{
    token: string;
    user: User;
  }>;

  /**
   * 用户登录
   */
  export type LoginRequest = LoginDto;
  export type LoginResponse = ApiResponse<{
    token: string;
    user: User;
  }>;

  /**
   * 重置密码
   */
  export type ResetPasswordRequest = ResetPasswordDto;
  export type ResetPasswordResponse = ApiResponse<{ message: string }>;

  /**
   * 刷新令牌
   */
  export interface RefreshTokenRequest {
    refreshToken: string;
  }
  export type RefreshTokenResponse = ApiResponse<{
    token: string;
    refreshToken: string;
  }>;

  /**
   * 退出登录
   */
  export interface LogoutRequest {}
  export type LogoutResponse = ApiResponse<{ message: string }>;
}

/**
 * 用户资料模块 API
 */
export namespace ProfileAPI {
  /**
   * 获取用户资料
   */
  export interface GetProfileRequest {}
  export type GetProfileResponse = ApiResponse<UserProfile>;

  /**
   * 更新用户资料
   */
  export type UpdateProfileRequest = UpdateProfileDto;
  export type UpdateProfileResponse = ApiResponse<UserProfile>;
}

/**
 * 广场模块 API
 */
export namespace SquareAPI {
  /**
   * 获取帖子列表
   */
  export interface GetPostListRequest extends PaginationQuery {
    sort?: 'hot' | 'latest';
  }
  export type GetPostListResponse = ApiResponse<PaginationResponse<SquarePost>>;

  /**
   * 获取帖子详情
   */
  export interface GetPostDetailRequest {
    id: number;
  }
  export type GetPostDetailResponse = ApiResponse<SquarePost>;

  /**
   * 创建帖子
   */
  export type CreatePostRequest = CreatePostDto;
  export type CreatePostResponse = ApiResponse<SquarePost>;

  /**
   * 删除帖子
   */
  export interface DeletePostRequest {
    id: number;
  }
  export type DeletePostResponse = ApiResponse<{ success: boolean }>;

  /**
   * 创建评论
   */
  export type CreateCommentRequest = CreateCommentDto;
  export type CreateCommentResponse = ApiResponse<{ id: number }>;

  /**
   * 获取评论列表
   */
  export interface GetCommentListRequest extends PaginationQuery {
    postId: number;
  }
  export type GetCommentListResponse = ApiResponse<PaginationResponse<object>>;

  /**
   * 点赞/取消点赞
   */
  export type LikeRequest = LikeDto;
  export type LikeResponse = ApiResponse<{ isLiked: boolean }>;

  /**
   * 举报帖子
   */
  export type ReportRequest = ReportDto;
  export type ReportResponse = ApiResponse<PostReport>;
}

/**
 * 消息模块 API
 */
export namespace MessageAPI {
  /**
   * 发送消息
   */
  export type SendMessageRequest = SendMessageDto;
  export type SendMessageResponse = ApiResponse<{ id: number }>;

  /**
   * 获取聊天记录
   */
  export interface GetChatHistoryRequest extends PaginationQuery {
    userId: number;
  }
  export type GetChatHistoryResponse = ApiResponse<PaginationResponse<object>>;

  /**
   * 获取会话列表
   */
  export interface GetConversationListRequest {}
  export type GetConversationListResponse = ApiResponse<Array<object>>;

  /**
   * 标记消息已读
   */
  export interface MarkAsReadRequest {
    userId: number;
  }
  export type MarkAsReadResponse = ApiResponse<{ success: boolean }>;
}

/**
 * 认证管理模块 API
 */
export namespace CertificationAPI {
  /**
   * 提交认证
   */
  export type CreateCertificationRequest = CreateCertificationDto;
  export type CreateCertificationResponse = ApiResponse<Certification>;

  /**
   * 获取我的认证列表
   */
  export interface GetMyCertificationsRequest {}
  export type GetMyCertificationsResponse = ApiResponse<Array<Certification>>;

  /**
   * 获取认证详情
   */
  export interface GetCertificationDetailRequest {
    id: number;
  }
  export type GetCertificationDetailResponse = ApiResponse<Certification>;

  /**
   * 获取认证类型列表
   */
  export interface GetCertificationTypesRequest {}
  export type GetCertificationTypesResponse = ApiResponse<Array<CertificationTypeConfig>>;
}

/**
 * 管理员认证管理模块 API
 */
export namespace AdminCertificationAPI {
  /**
   * 获取认证列表
   */
  export interface GetListRequest extends PaginationQuery {
    status?: number;
    type?: string;
    keyword?: string;
  }
  export type GetListResponse = ApiResponse<PaginationResponse<Certification>>;

  /**
   * 审核认证
   */
  export interface ReviewRequest {
    id: number;
    status: 1 | 2;
    rejectReason?: string;
  }
  export type ReviewResponse = ApiResponse<Certification>;

  /**
   * 创建认证类型
   */
  export type CreateTypeRequest = CreateCertificationTypeDto;
  export type CreateTypeResponse = ApiResponse<CertificationTypeConfig>;

  /**
   * 更新认证类型
   */
  export interface UpdateTypeRequest extends UpdateCertificationTypeDto {
    id: number;
  }
  export type UpdateTypeResponse = ApiResponse<CertificationTypeConfig>;

  /**
   * 删除认证类型
   */
  export interface DeleteTypeRequest {
    id: number;
  }
  export type DeleteTypeResponse = ApiResponse<{ success: boolean }>;
}

/**
 * 系统配置模块 API
 */
export namespace SystemConfigAPI {
  /**
   * 获取公开配置
   */
  export interface GetPublicConfigRequest {}
  export type GetPublicConfigResponse = ApiResponse<Record<string, any>>;

  /**
   * 获取配置列表（管理员）
   */
  export interface GetListRequest {
    group?: string;
  }
  export type GetListResponse = ApiResponse<Array<SystemConfig>>;

  /**
   * 创建配置
   */
  export type CreateConfigRequest = CreateSystemConfigDto;
  export type CreateConfigResponse = ApiResponse<SystemConfig>;

  /**
   * 更新配置
   */
  export interface UpdateConfigRequest extends UpdateSystemConfigDto {
    id: number;
  }
  export type UpdateConfigResponse = ApiResponse<SystemConfig>;

  /**
   * 删除配置
   */
  export interface DeleteConfigRequest {
    id: number;
  }
  export type DeleteConfigResponse = ApiResponse<{ success: boolean }>;
}

/**
 * 管理员认证模块 API
 */
export namespace AdminAuthAPI {
  /**
   * 发送短信验证码
   */
  export type SendSmsRequest = AdminSmsDto;
  export type SendSmsResponse = ApiResponse<{ message: string }>;

  /**
   * 管理员登录
   */
  export type LoginRequest = AdminLoginDto;
  export type LoginResponse = ApiResponse<{
    token: string;
    admin: object;
  }>;

  /**
   * 退出登录
   */
  export interface LogoutRequest {}
  export type LogoutResponse = ApiResponse<{ message: string }>;
}

/**
 * Prometheus 监控模块 API
 */
export namespace PrometheusAPI {
  /**
   * 获取监控指标
   */
  export interface GetMetricsRequest {}
  export type GetMetricsResponse = string;
}
