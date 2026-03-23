export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2
}

export enum MsgType {
  TEXT = 1,
  IMAGE = 2,
  EMOJI = 3
}

export enum TargetType {
  POST = 1,
  COMMENT = 2
}

export enum ReportReason {
  PORNOGRAPHY = 1,
  VIOLENCE = 2,
  AD = 3,
  FRAUD = 4,
  OTHER = 5
}

export enum UserStatus {
  NORMAL = 0,
  MUTED = 1,
  BANNED = 2
}

export enum PostStatus {
  NORMAL = 0,
  DELETED = 1,
  VIOLATION = 2
}

export enum FriendStatus {
  FOLLOWING = 0,
  FRIEND = 1
}