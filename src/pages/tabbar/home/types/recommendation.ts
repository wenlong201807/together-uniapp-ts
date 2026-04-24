/**
 * 推荐数据类型定义
 */

/**
 * 用户数据
 */
export interface UserData {
  id: number;
  nickname: string;
  avatar: string;
  age?: number;
  city?: string;
  bio?: string;
  tags?: string[];
  photos?: string[];
}

/**
 * 话题数据
 */
export interface TopicData {
  id: number;
  title: string;
  description?: string;
  participantCount: number;
  postCount: number;
  coverImages?: string[];
}

/**
 * 帖子数据
 */
export interface PostData {
  id: number;
  content: string;
  images?: string[];
  user: UserData;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createTime: number;
}

/**
 * 热门内容数据
 */
export interface HotContentData {
  user: UserData;
  hotScore: {
    likes: number;
    comments: number;
    favorites: number;
  };
}

/**
 * 附近的人数据
 */
export interface NearbyUserData {
  user: UserData;
  distance: string;
}

/**
 * 新用户数据
 */
export interface NewUserData {
  user: UserData;
  joinDays: number;
}

/**
 * 推荐项数据联合类型
 */
export type RecommendationData =
  | { type: 'personalized'; user: UserData }
  | { type: 'hot'; user: UserData; hotScore: HotContentData['hotScore'] }
  | { type: 'nearby'; user: UserData; distance: string }
  | { type: 'topic'; topic: TopicData }
  | { type: 'new'; user: UserData; joinDays: number };

/**
 * 推荐项类型
 */
export type RecommendationType = RecommendationData['type'];

/**
 * 推荐项接口
 */
export interface RecommendationItem<T extends RecommendationType = RecommendationType> {
  id: string;
  type: T;
  data: Extract<RecommendationData, { type: T }>;
}

/**
 * 类型守卫函数
 */
export function isPersonalizedItem(item: RecommendationItem): item is RecommendationItem<'personalized'> {
  return item.type === 'personalized';
}

export function isHotItem(item: RecommendationItem): item is RecommendationItem<'hot'> {
  return item.type === 'hot';
}

export function isNearbyItem(item: RecommendationItem): item is RecommendationItem<'nearby'> {
  return item.type === 'nearby';
}

export function isTopicItem(item: RecommendationItem): item is RecommendationItem<'topic'> {
  return item.type === 'topic';
}

export function isNewUserItem(item: RecommendationItem): item is RecommendationItem<'new'> {
  return item.type === 'new';
}
