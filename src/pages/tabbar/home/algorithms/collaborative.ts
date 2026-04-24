/**
 * 协同过滤算法 (Collaborative Filtering)
 * 基于用户行为相似度进行推荐
 */

export interface UserBehavior {
  userId: number;
  targetId: number;
  targetType: 'user' | 'post' | 'topic';
  actionType: 'view' | 'like' | 'comment' | 'favorite' | 'follow';
  timestamp: number;
}

export interface UserVector {
  userId: number;
  vector: number[];
}

/**
 * 行为权重配置
 */
const ACTION_WEIGHTS = {
  view: 1,
  like: 3,
  comment: 5,
  favorite: 4,
  follow: 6,
};

/**
 * 计算用户行为向量
 * @param behaviors 用户行为列表
 * @param targetIds 目标ID列表（用于构建向量维度）
 * @returns 用户行为向量
 */
export function calculateUserVector(
  behaviors: UserBehavior[],
  targetIds: number[]
): number[] {
  const vector = new Array(targetIds.length).fill(0);

  behaviors.forEach((behavior) => {
    const index = targetIds.indexOf(behavior.targetId);
    if (index !== -1) {
      const weight = ACTION_WEIGHTS[behavior.actionType] || 1;
      vector[index] += weight;
    }
  });

  return vector;
}

/**
 * 计算余弦相似度
 * @param vectorA 向量A
 * @param vectorB 向量B
 * @returns 相似度 (0-1)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 查找相似用户
 * @param currentUserId 当前用户ID
 * @param allUserVectors 所有用户向量
 * @param topK 返回前K个相似用户
 * @returns 相似用户列表（按相似度降序）
 */
export function findSimilarUsers(
  currentUserId: number,
  allUserVectors: UserVector[],
  topK: number = 10
): Array<{ userId: number; similarity: number }> {
  const currentUserVector = allUserVectors.find(
    (uv) => uv.userId === currentUserId
  );

  if (!currentUserVector) {
    return [];
  }

  const similarities = allUserVectors
    .filter((uv) => uv.userId !== currentUserId)
    .map((uv) => ({
      userId: uv.userId,
      similarity: cosineSimilarity(currentUserVector.vector, uv.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities;
}

/**
 * 基于协同过滤生成推荐
 * @param currentUserId 当前用户ID
 * @param similarUsers 相似用户列表
 * @param similarUserBehaviors 相似用户的行为数据
 * @param currentUserBehaviors 当前用户的行为数据
 * @returns 推荐的目标ID列表
 */
export function generateCollaborativeRecommendations(
  currentUserId: number,
  similarUsers: Array<{ userId: number; similarity: number }>,
  similarUserBehaviors: UserBehavior[],
  currentUserBehaviors: UserBehavior[]
): Array<{ targetId: number; score: number }> {
  // 获取当前用户已交互的目标ID
  const interactedTargets = new Set(
    currentUserBehaviors.map((b) => b.targetId)
  );

  // 统计相似用户喜欢但当前用户未交互的目标
  const targetScores = new Map<number, number>();

  similarUserBehaviors.forEach((behavior) => {
    // 跳过当前用户已交互的目标
    if (interactedTargets.has(behavior.targetId)) {
      return;
    }

    // 查找该行为所属用户的相似度
    const similarUser = similarUsers.find(
      (su) => su.userId === behavior.userId
    );
    if (!similarUser) {
      return;
    }

    // 计算得分：相似度 × 行为权重
    const actionWeight = ACTION_WEIGHTS[behavior.actionType] || 1;
    const score = similarUser.similarity * actionWeight;

    const currentScore = targetScores.get(behavior.targetId) || 0;
    targetScores.set(behavior.targetId, currentScore + score);
  });

  // 转换为数组并排序
  return Array.from(targetScores.entries())
    .map(([targetId, score]) => ({ targetId, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 协同过滤推荐主函数
 * @param currentUserId 当前用户ID
 * @param allUserBehaviors 所有用户行为数据
 * @param topK 返回前K个推荐
 * @returns 推荐列表
 */
export function collaborativeFiltering(
  currentUserId: number,
  allUserBehaviors: UserBehavior[],
  topK: number = 20
): Array<{ targetId: number; score: number }> {
  // 1. 获取所有唯一的目标ID
  const allTargetIds = Array.from(
    new Set(allUserBehaviors.map((b) => b.targetId))
  );

  // 2. 按用户分组行为数据
  const userBehaviorsMap = new Map<number, UserBehavior[]>();
  allUserBehaviors.forEach((behavior) => {
    const behaviors = userBehaviorsMap.get(behavior.userId) || [];
    behaviors.push(behavior);
    userBehaviorsMap.set(behavior.userId, behaviors);
  });

  // 3. 计算所有用户的行为向量
  const allUserVectors: UserVector[] = Array.from(
    userBehaviorsMap.entries()
  ).map(([userId, behaviors]) => ({
    userId,
    vector: calculateUserVector(behaviors, allTargetIds),
  }));

  // 4. 查找相似用户
  const similarUsers = findSimilarUsers(currentUserId, allUserVectors, 10);

  if (similarUsers.length === 0) {
    return [];
  }

  // 5. 获取相似用户的行为数据
  const similarUserIds = new Set(similarUsers.map((su) => su.userId));
  const similarUserBehaviors = allUserBehaviors.filter((b) =>
    similarUserIds.has(b.userId)
  );

  // 6. 获取当前用户的行为数据
  const currentUserBehaviors = userBehaviorsMap.get(currentUserId) || [];

  // 7. 生成推荐
  const recommendations = generateCollaborativeRecommendations(
    currentUserId,
    similarUsers,
    similarUserBehaviors,
    currentUserBehaviors
  );

  return recommendations.slice(0, topK);
}
