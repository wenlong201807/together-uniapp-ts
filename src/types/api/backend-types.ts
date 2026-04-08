/**
 * 通用响应包装类型
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * 性别枚举
 * 0: 未知, 1: 男, 2: 女
 */
export type Gender = 0 | 1 | 2;

/**
 * 用户状态枚举
 * 0: 正常, 1: 禁用, 2: 删除
 */
export type UserStatus = 0 | 1 | 2;

/**
 * 文件状态枚举
 * 0: 禁用, 1: 正常
 */
export type FileStatus = 0 | 1;

/**
 * 好友关系状态枚举
 * 0: 待确认, 1: 已确认
 */
export type FriendshipStatus = 0 | 1;

/**
 * 帖子状态枚举
 * 0: 待审核, 1: 已发布, 2: 已删除
 */
export type PostStatus = 0 | 1 | 2;

/**
 * 举报状态枚举
 * 0: 待处理, 1: 已处理
 */
export type ReportStatus = 0 | 1;

/**
 * 举报原因枚举
 * 1: 色情低俗, 2: 广告骚扰, 3: 违法违规, 4: 侮辱谩骂, 5: 其他
 */
export type ReportReason = 1 | 2 | 3 | 4 | 5;

/**
 * 消息类型枚举
 * 1: 文本, 2: 图片, 3: 语音
 */
export type MessageType = 1 | 2 | 3;

/**
 * 点赞目标类型枚举
 * 1: 帖子, 2: 评论
 */
export type LikeTargetType = 1 | 2;

/**
 * 认证类型枚举
 */
export type CertificationType = 'house' | 'education' | 'id_card' | 'business' | 'driver' | 'utility';

/**
 * 认证状态枚举
 * 0: 待审核, 1: 已通过, 2: 已拒绝
 */
export type CertificationStatus = 0 | 1 | 2;

/**
 * 文件上传类型枚举
 */
export type FileUploadType = 'square' | 'avatar' | 'certificate' | 'album';

/**
 * 短信类型枚举
 */
export type SmsType = 'register' | 'login' | 'reset_password';

/**
 * 管理员登录类型枚举
 */
export type AdminLoginType = 'username' | 'mobile_sms';

/**
 * 用户信息
 */
export interface User {
  /** 用户ID */
  id: number;
  /** 手机号 */
  mobile: string;
  /** 密码（加密） */
  password: string;
  /** 昵称 */
  nickname: string;
  /** 头像URL */
  avatarUrl: string;
  /** 头像相对路径 */
  avatarPath: string;
  /** 性别 */
  gender: Gender;
  /** 积分 */
  points: number;
  /** 邀请码 */
  inviteCode: string;
  /** 邀请人邀请码 */
  inviterCode: string;
  /** 是否已认证 */
  isVerified: boolean;
  /** 用户状态 */
  status: UserStatus;
  /** 违规次数 */
  violationCount: number;
  /** 最后登录时间 */
  lastLoginAt: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 删除时间 */
  deletedAt: string;
}

/**
 * 更新用户信息DTO
 */
export interface UpdateUserDto {
  /** 昵称 */
  nickname?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 头像相对路径 */
  avatarPath?: string;
  /** 性别 */
  gender?: Gender;
  /** 个人简介 */
  bio?: string;
  /** 城市 */
  city?: string;
  /** 出生日期 */
  birthDate?: string;
}

/**
 * 用户详细资料
 */
export interface UserProfile {
  /** 资料ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 真实姓名 */
  realName: string;
  /** 出生日期 */
  birthDate: string;
  /** 籍贯 */
  hometown: string;
  /** 居住地 */
  residence: string;
  /** 身高（cm） */
  height: number;
  /** 体重（kg） */
  weight: number;
  /** 职业 */
  occupation: string;
  /** 月收入 */
  income: number;
  /** 学历 */
  education: string;
  /** 个人简介 */
  bio: string;
  /** 是否显示位置 */
  showLocation: boolean;
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 关联用户 */
  user: User;
}

/**
 * 更新用户资料DTO
 */
export interface UpdateProfileDto {
  /** 真实姓名 */
  realName?: string;
  /** 出生日期 */
  birthDate?: string;
  /** 籍贯 */
  hometown?: string;
  /** 居住地 */
  residence?: string;
  /** 身高（cm） */
  height?: number;
  /** 体重（kg） */
  weight?: number;
  /** 职业 */
  occupation?: string;
  /** 月收入 */
  income?: number;
  /** 学历 */
  education?: string;
  /** 个人简介 */
  bio?: string;
  /** 是否显示位置 */
  showLocation?: boolean;
  /** 纬度 */
  latitude?: number;
  /** 经度 */
  longitude?: number;
}

/**
 * 文件记录
 */
export interface FileRecord {
  /** 文件ID */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 文件路径 */
  filePath: string;
  /** 原始文件名 */
  originalName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** MIME类型 */
  mimeType: string;
  /** 文件扩展名 */
  fileExt: string;
  /** 存储桶名称 */
  bucketName: string;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** 文件状态 */
  status: FileStatus;
  /** 上传用户ID */
  uploadUserId: number;
  /** 上传用户昵称 */
  uploadNickname: string;
  /** 文件类型 */
  type: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 删除时间 */
  deletedAt: string;
}

/**
 * 获取上传凭证DTO
 */
export interface GetUploadTokenDto {
  /** 上传类型 */
  type: FileUploadType;
  /** 文件名 */
  fileName?: string;
}

/**
 * 上传凭证响应DTO
 */
export interface UploadTokenResponseDto {
  /** 上传凭证 */
  token: string;
  /** 文件key */
  key: string;
  /** 访问域名 */
  domain: string;
  /** 过期时间（秒） */
  expire: number;
}

/**
 * 好友关系
 */
export interface Friendship {
  /** 关系ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 好友ID */
  friendId: number;
  /** 关系状态 */
  status: FriendshipStatus;
  /** 解锁私聊消耗积分 */
  unlockPoints: number;
  /** 聊天次数 */
  chatCount: number;
  /** 是否互相关注 */
  isMutual: boolean;
  /** 最后聊天时间 */
  lastChatAt: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户信息 */
  user: User;
  /** 好友信息 */
  friend: User;
}

/**
 * 用户黑名单
 */
export interface UserBlacklist {
  /** 黑名单ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 被拉黑用户ID */
  blockedUserId: number;
  /** 拉黑原因 */
  reason: string;
  /** 创建时间 */
  createdAt: string;
  /** 用户信息 */
  user: User;
  /** 被拉黑用户信息 */
  blockedUser: User;
}

/**
 * 积分配置
 */
export interface PointsConfig {
  /** 配置ID */
  id: number;
  /** 配置键 */
  key: string;
  /** 配置值 */
  value: number;
  /** 配置描述 */
  description: string;
  /** 是否启用 */
  isEnabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 更新积分配置DTO
 */
export interface UpdatePointsConfigDto {
  /** 配置值 */
  value?: number;
  /** 是否启用 */
  isEnabled?: boolean;
}

/**
 * 短信验证码DTO
 */
export interface SmsDto {
  /** 手机号 */
  mobile: string;
  /** 短信类型 */
  type: SmsType;
}

/**
 * 用户注册DTO
 */
export interface RegisterDto {
  /** 手机号 */
  mobile: string;
  /** 验证码 */
  code: string;
  /** 密码 */
  password: string;
  /** 昵称 */
  nickname: string;
  /** 性别 */
  gender?: Gender;
  /** 邀请码 */
  inviteCode?: string;
}

/**
 * 用户登录DTO
 */
export interface LoginDto {
  /** 手机号 */
  mobile: string;
  /** 密码 */
  password: string;
}

/**
 * 重置密码DTO
 */
export interface ResetPasswordDto {
  /** 手机号 */
  mobile: string;
  /** 验证码 */
  code: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 广场帖子
 */
export interface SquarePost {
  /** 帖子ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 内容预览 */
  contentPreview: string;
  /** 帖子内容 */
  content: string;
  /** 图片列表 */
  images: Array<string>;
  /** 点赞数 */
  likeCount: number;
  /** 评论数 */
  commentCount: number;
  /** 浏览数 */
  viewCount: number;
  /** 分享数 */
  shareCount: number;
  /** 热度分数 */
  hotScore: number;
  /** 帖子状态 */
  status: PostStatus;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 发帖用户 */
  user: User;
}

/**
 * 创建帖子DTO
 */
export interface CreatePostDto {
  /** 帖子内容 */
  content: string;
  /** 图片列表 */
  images?: Array<string>;
}

/**
 * 创建评论DTO
 */
export interface CreateCommentDto {
  /** 帖子ID */
  postId: number;
  /** 父评论ID */
  parentId?: number;
  /** 被回复的评论ID */
  replyToId?: number;
  /** 被回复的用户ID */
  replyToUserId?: number;
  /** 评论内容 */
  content: string;
}

/**
 * 点赞DTO
 */
export interface LikeDto {
  /** 目标ID */
  targetId: number;
  /** 目标类型 */
  targetType: LikeTargetType;
}

/**
 * 举报DTO
 */
export interface ReportDto {
  /** 帖子ID */
  postId: number;
  /** 举报原因 */
  reason: ReportReason;
  /** 举报描述 */
  description?: string;
}

/**
 * 帖子举报记录
 */
export interface PostReport {
  /** 举报ID */
  id: number;
  /** 帖子ID */
  postId: number;
  /** 举报人ID */
  reporterId: number;
  /** 举报原因 */
  reason: ReportReason;
  /** 举报描述 */
  description: string;
  /** 处理状态 */
  status: ReportStatus;
  /** 处理时间 */
  handledAt: string;
  /** 处理人ID */
  handledBy: number;
  /** 创建时间 */
  createdAt: string;
  /** 被举报帖子 */
  post: SquarePost;
  /** 举报人 */
  reporter: User;
}

/**
 * 发送消息DTO
 */
export interface SendMessageDto {
  /** 接收者ID */
  receiverId: number;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  msgType?: MessageType;
}

/**
 * 创建认证DTO
 */
export interface CreateCertificationDto {
  /** 认证类型 */
  type: CertificationType;
  /** 证明图片URL */
  imageUrl: string;
  /** 描述信息 */
  description?: string;
}

/**
 * 认证记录
 */
export interface Certification {
  /** 认证ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 认证类型 */
  type: CertificationType;
  /** 证明图片URL */
  imageUrl: string;
  /** 描述信息 */
  description: string;
  /** 认证状态 */
  status: CertificationStatus;
  /** 拒绝原因 */
  rejectReason: string;
  /** 审核时间 */
  reviewedAt: string;
  /** 审核人ID */
  reviewedBy: number;
  /** 创建时间 */
  createdAt: string;
  /** 用户信息 */
  user: User;
}

/**
 * 认证类型配置
 */
export interface CertificationTypeConfig {
  /** 配置ID */
  id: number;
  /** 类型代码 */
  code: string;
  /** 类型名称 */
  name: string;
  /** 图标 */
  icon: string;
  /** 描述 */
  description: string;
  /** 必填字段 */
  requiredFields: Array<string>;
  /** 是否启用 */
  isEnabled: boolean;
  /** 排序 */
  sortOrder: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建认证类型DTO
 */
export interface CreateCertificationTypeDto {
  /** 类型代码 */
  code: string;
  /** 类型名称 */
  name: string;
  /** 图标 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 必填字段 */
  requiredFields?: Array<string>;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 排序 */
  sortOrder?: number;
}

/**
 * 更新认证类型DTO
 */
export interface UpdateCertificationTypeDto {
  /** 类型名称 */
  name?: string;
  /** 图标 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 必填字段 */
  requiredFields?: Array<string>;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 排序 */
  sortOrder?: number;
}

/**
 * 系统配置
 */
export interface SystemConfig {
  /** 配置ID */
  id: number;
  /** 配置键 */
  configKey: string;
  /** 配置值 */
  configValue: string;
  /** 值类型 */
  valueType: string;
  /** 配置分组 */
  group: string;
  /** 配置描述 */
  description: string;
  /** 是否公开 */
  isPublic: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建系统配置DTO
 */
export interface CreateSystemConfigDto {
  /** 配置键 */
  configKey: string;
  /** 配置值 */
  configValue: string;
  /** 值类型 */
  valueType?: string;
  /** 配置分组 */
  group?: string;
  /** 配置描述 */
  description?: string;
  /** 是否公开 */
  isPublic?: boolean;
  /** 是否启用 */
  isEnabled?: boolean;
}

/**
 * 更新系统配置DTO
 */
export interface UpdateSystemConfigDto {
  /** 配置值 */
  configValue?: string;
  /** 值类型 */
  valueType?: string;
  /** 配置分组 */
  group?: string;
  /** 配置描述 */
  description?: string;
  /** 是否公开 */
  isPublic?: boolean;
  /** 是否启用 */
  isEnabled?: boolean;
}

/**
 * 管理员短信DTO
 */
export interface AdminSmsDto {
  /** 手机号 */
  mobile: string;
}

/**
 * 管理员登录DTO
 */
export interface AdminLoginDto {
  /** 登录类型 */
  loginType?: AdminLoginType;
  /** 用户名/手机号 */
  account: string;
  /** 密码 */
  password?: string;
  /** 短信验证码 */
  code?: string;
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  /** 数据列表 */
  items: Array<T>;
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}
