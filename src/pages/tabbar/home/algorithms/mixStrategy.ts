/**
 * 混合推荐策略 (Hybrid Recommendation Strategy)
 * 整合多种推荐算法，生成最终的推荐流
 */

import { collaborativeFiltering, type UserBehavior } from './collaborative';
import { contentBasedFiltering, type UserInterest, type ContentItem } from './contentBased';
import { hotRanking, type InteractionData } from './hotRanking';
import { lbsRecommendation, type Location, type UserLocation } from './lbs';

/**
 * 推荐类型
 */
export type RecommendationType = 'personalized' | 'hot' | 'nearby' | 'topic' | 'new';

/**
 * 推荐项
 */
export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  contentId: number;
  score: number;
  data: any;
}

/**
 * 推荐配置
 */
export interface RecommendationConfig {
  // 推荐比例
  ratios: {
    personalized: number; // 个性化推荐比例
    hot: number; // 热门内容比例
    nearby: number; // 附近的人比例
    topic: number; // 话题模块比例
    new: number; // 新用户推荐比例
  };
  // 每次加载数量
  pageSize: number;
  // 去重时间窗口（小时）
  deduplicationWindow: number;
}

/**
 * 默认推荐配置
 */
export const DEFAULT_CONFIG: RecommendationConfig = {
  ratios: {
    personalized: 0.4,
    hot: 0.2,
    nearby: 0.15,
    topic: 0.15,
    new: 0.1,
  },
  pageSize: 20,
  deduplicationWindow: 24,
};

/**
 * 推荐上下文（用户相关数据）
 */
export interface RecommendationContext {
  userId: number;
  userInterest?: UserInterest;
  userLocation?: Location;
  userBehaviors?: UserBehavior[];
  viewedContentIds?: Set<number>; // 已查看的内容ID
}

/**
 * 推荐数据源
 */
export interface RecommendationDataSource {
  // 所有用户行为数据
  allUserBehaviors: UserBehavior[];
  // 候选内容列表
  candidateContents: ContentItem[];
  // 互动数据
  interactionData: InteractionData[];
  // 所有用户位置
  allUserLocations: UserLocation[];
  // 热度分数映射
  popularityScores: Map<number, number>;
}

/**
 * 计算每种类型应该推荐的数量
 * @param config 推荐配置
 * @returns 各类型推荐数量
 */
function calculateTypeDistribution(config: RecommendationConfig): Record<RecommendationType, number> {
  const { ratios, pageSize } = config;

  return {
    personalized: Math.round(pageSize * ratios.personalized),
    hot: Math.round(pageSize * ratios.hot),
    nearby: Math.round(pageSize * ratios.nearby),
    topic: Math.round(pageSize * ratios.topic),
    new: Math.round(pageSize * ratios.new),
  };
}

/**
 * 生成个性化推荐
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param count 推荐数量
 * @returns 推荐列表
 */
async function generatePersonalizedRecommendations(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  count: number
): Promise<RecommendationItem[]> {
  const { userId, userInterest, userBehaviors, viewedContentIds } = context;
  const { allUserBehaviors, candidateContents, popularityScores } = dataSource;

  // 1. 协同过滤推荐
  let collaborativeRecs: Array<{ targetId: number; score: number }> = [];
  if (userBehaviors && userBehaviors.length > 0) {
    collaborativeRecs = collaborativeFiltering(userId, allUserBehaviors, count * 2);
  }

  // 2. 基于内容的推荐
  const contentRecs = contentBasedFiltering(userInterest || null, candidateContents, {
    excludeIds: viewedContentIds,
    topK: count * 2,
    popularityScores,
  });

  // 3. 合并两种推荐结果（加权平均）
  const mergedScores = new Map<number, number>();

  // 协同过滤结果（权重0.6）
  collaborativeRecs.forEach((rec) => {
    mergedScores.set(rec.targetId, rec.score * 0.6);
  });

  // 内容推荐结果（权重0.4）
  contentRecs.forEach((rec) => {
    const currentScore = mergedScores.get(rec.contentId) || 0;
    mergedScores.set(rec.contentId, currentScore + rec.score * 0.4);
  });

  // 4. 排序并转换为推荐项
  const recommendations = Array.from(mergedScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([contentId, score]) => {
      const content = candidateContents.find((c) => c.id === contentId);
      return {
        id: `personalized-${contentId}-${Date.now()}`,
        type: 'personalized' as RecommendationType,
        contentId,
        score,
        data: content,
      };
    });

  return recommendations;
}

/**
 * 生成热门内容推荐
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param count 推荐数量
 * @returns 推荐列表
 */
async function generateHotRecommendations(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  count: number
): Promise<RecommendationItem[]> {
  const { viewedContentIds } = context;
  const { interactionData, candidateContents } = dataSource;

  // 计算热度排名
  const hotItems = hotRanking(interactionData, {
    topK: count * 2,
    minInteractions: 5,
  });

  // 过滤已查看的内容
  const filteredHotItems = hotItems
    .filter((item) => !viewedContentIds?.has(item.contentId))
    .slice(0, count);

  // 转换为推荐项
  return filteredHotItems.map((item) => {
    const content = candidateContents.find((c) => c.id === item.contentId);
    const interaction = interactionData.find((i) => i.contentId === item.contentId);

    return {
      id: `hot-${item.contentId}-${Date.now()}`,
      type: 'hot' as RecommendationType,
      contentId: item.contentId,
      score: item.hotScore,
      data: {
        content,
        hotScore: {
          likes: interaction?.likes || 0,
          comments: interaction?.comments || 0,
          favorites: interaction?.favorites || 0,
        },
      },
    };
  });
}

/**
 * 生成附近的人推荐
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param count 推荐数量
 * @returns 推荐列表
 */
async function generateNearbyRecommendations(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  count: number
): Promise<RecommendationItem[]> {
  const { userId, userLocation, viewedContentIds } = context;
  const { allUserLocations, candidateContents } = dataSource;

  if (!userLocation) {
    return [];
  }

  // LBS 推荐
  const nearbyUsers = lbsRecommendation(userLocation, allUserLocations, {
    maxDistance: 20,
    topK: count * 2,
    excludeUserIds: new Set([userId]),
  });

  // 过滤已查看的用户
  const filteredNearbyUsers = nearbyUsers
    .filter((user) => !viewedContentIds?.has(user.userId))
    .slice(0, count);

  // 转换为推荐项
  return filteredNearbyUsers.map((user) => {
    const content = candidateContents.find((c) => c.id === user.userId);

    return {
      id: `nearby-${user.userId}-${Date.now()}`,
      type: 'nearby' as RecommendationType,
      contentId: user.userId,
      score: user.weight,
      data: {
        content,
        distance: user.distanceText,
      },
    };
  });
}

/**
 * 生成话题推荐
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param count 推荐数量
 * @returns 推荐列表
 */
async function generateTopicRecommendations(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  count: number
): Promise<RecommendationItem[]> {
  const { userInterest, viewedContentIds } = context;
  const { candidateContents, popularityScores } = dataSource;

  // 筛选话题类型的内容
  const topicContents = candidateContents.filter((c) => c.type === 'topic');

  // 基于内容推荐
  const topicRecs = contentBasedFiltering(userInterest || null, topicContents, {
    excludeIds: viewedContentIds,
    topK: count,
    popularityScores,
  });

  // 转换为推荐项
  return topicRecs.map((rec) => ({
    id: `topic-${rec.contentId}-${Date.now()}`,
    type: 'topic' as RecommendationType,
    contentId: rec.contentId,
    score: rec.score,
    data: rec.content,
  }));
}

/**
 * 生成新用户推荐
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param count 推荐数量
 * @returns 推荐列表
 */
async function generateNewUserRecommendations(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  count: number
): Promise<RecommendationItem[]> {
  const { viewedContentIds } = context;
  const { candidateContents } = dataSource;

  // 筛选新用户（注册时间 < 7天）
  const currentTime = Date.now();
  const sevenDaysAgo = currentTime - 7 * 24 * 60 * 60 * 1000;

  const newUserContents = candidateContents.filter((c) => {
    const metadata = c.metadata as any;
    return metadata?.registerTime && metadata.registerTime > sevenDaysAgo;
  });

  // 过滤已查看的内容
  const filteredNewUsers = newUserContents
    .filter((c) => !viewedContentIds?.has(c.id))
    .slice(0, count);

  // 转换为推荐项
  return filteredNewUsers.map((content) => {
    const metadata = content.metadata as any;
    const joinDays = Math.floor((currentTime - metadata.registerTime) / (24 * 60 * 60 * 1000));

    return {
      id: `new-${content.id}-${Date.now()}`,
      type: 'new' as RecommendationType,
      contentId: content.id,
      score: 1,
      data: {
        content,
        joinDays,
      },
    };
  });
}

/**
 * 随机打乱数组
 * @param array 数组
 * @returns 打乱后的数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 混合推荐策略主函数
 * @param context 推荐上下文
 * @param dataSource 数据源
 * @param config 推荐配置
 * @returns 推荐列表
 */
export async function hybridRecommendation(
  context: RecommendationContext,
  dataSource: RecommendationDataSource,
  config: RecommendationConfig = DEFAULT_CONFIG
): Promise<RecommendationItem[]> {
  // 1. 计算各类型推荐数量
  const distribution = calculateTypeDistribution(config);

  // 2. 并行生成各类型推荐
  const [personalizedRecs, hotRecs, nearbyRecs, topicRecs, newUserRecs] = await Promise.all([
    generatePersonalizedRecommendations(context, dataSource, distribution.personalized),
    generateHotRecommendations(context, dataSource, distribution.hot),
    generateNearbyRecommendations(context, dataSource, distribution.nearby),
    generateTopicRecommendations(context, dataSource, distribution.topic),
    generateNewUserRecommendations(context, dataSource, distribution.new),
  ]);

  // 3. 合并所有推荐
  const allRecommendations = [
    ...personalizedRecs,
    ...hotRecs,
    ...nearbyRecs,
    ...topicRecs,
    ...newUserRecs,
  ];

  // 4. 兜底策略：如果某类推荐不足，用其他类型补充
  const targetCount = config.pageSize;
  if (allRecommendations.length < targetCount) {
    // 用热门内容补充
    const additionalHotRecs = await generateHotRecommendations(
      context,
      dataSource,
      targetCount - allRecommendations.length
    );
    allRecommendations.push(...additionalHotRecs);
  }

  // 5. 随机打乱顺序，避免模式化
  const shuffledRecommendations = shuffleArray(allRecommendations);

  // 6. 去重（基于 contentId）
  const seenContentIds = new Set<number>();
  const deduplicatedRecommendations = shuffledRecommendations.filter((rec) => {
    if (seenContentIds.has(rec.contentId)) {
      return false;
    }
    seenContentIds.add(rec.contentId);
    return true;
  });

  // 7. 返回指定数量的推荐
  return deduplicatedRecommendations.slice(0, targetCount);
}

/**
 * 推荐流生成器（支持分页）
 */
export class RecommendationStreamGenerator {
  private context: RecommendationContext;
  private dataSource: RecommendationDataSource;
  private config: RecommendationConfig;
  private viewedContentIds: Set<number>;
  private currentPage: number;

  constructor(
    context: RecommendationContext,
    dataSource: RecommendationDataSource,
    config: RecommendationConfig = DEFAULT_CONFIG
  ) {
    this.context = context;
    this.dataSource = dataSource;
    this.config = config;
    this.viewedContentIds = new Set(context.viewedContentIds || []);
    this.currentPage = 0;
  }

  /**
   * 获取下一页推荐
   */
  async getNextPage(): Promise<RecommendationItem[]> {
    this.currentPage++;

    // 更新上下文中的已查看内容
    const updatedContext = {
      ...this.context,
      viewedContentIds: this.viewedContentIds,
    };

    // 生成推荐
    const recommendations = await hybridRecommendation(
      updatedContext,
      this.dataSource,
      this.config
    );

    // 更新已查看内容ID
    recommendations.forEach((rec) => {
      this.viewedContentIds.add(rec.contentId);
    });

    return recommendations;
  }

  /**
   * 重置生成器
   */
  reset(): void {
    this.currentPage = 0;
    this.viewedContentIds = new Set(this.context.viewedContentIds || []);
  }

  /**
   * 获取当前页码
   */
  getCurrentPage(): number {
    return this.currentPage;
  }
}
