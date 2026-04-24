/**
 * 热度排序算法 (Hot Ranking)
 * 基于 Wilson Score + 时间衰减计算内容热度
 */

export interface InteractionData {
  contentId: number;
  likes: number;
  comments: number;
  favorites: number;
  shares: number;
  skips: number;
  reports: number;
  views: number;
  publishTime: number; // 时间戳（毫秒）
}

/**
 * 计算 Wilson Score
 * 用于评估内容质量，考虑正负反馈的置信区间
 *
 * @param positive 正向互动数（点赞、评论、收藏、分享）
 * @param total 总互动数（正向 + 负向）
 * @param confidence 置信度（默认0.95，对应z=1.96）
 * @returns Wilson Score (0-1)
 */
export function calculateWilsonScore(
  positive: number,
  total: number,
  confidence: number = 0.95
): number {
  if (total === 0) {
    return 0;
  }

  // z值对应表：0.95 -> 1.96, 0.99 -> 2.576
  const z = confidence === 0.99 ? 2.576 : 1.96;

  const p = positive / total; // 正向比例
  const n = total;

  // Wilson Score 公式
  const numerator =
    p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  const denominator = 1 + (z * z) / n;

  return numerator / denominator;
}

/**
 * 计算时间衰减因子
 * 使用指数衰减模型，内容越新权重越高
 *
 * @param publishTime 发布时间戳（毫秒）
 * @param currentTime 当前时间戳（毫秒）
 * @param decayRate 衰减系数（默认0.1，值越大衰减越快）
 * @returns 衰减因子 (0-1)
 */
export function calculateTimeDecay(
  publishTime: number,
  currentTime: number,
  decayRate: number = 0.1
): number {
  // 计算发布至今的小时数
  const hoursElapsed = (currentTime - publishTime) / (1000 * 60 * 60);

  // 指数衰减：e^(-λt)
  return Math.exp(-decayRate * hoursElapsed);
}

/**
 * 计算内容热度分数
 * 综合考虑互动质量（Wilson Score）和时间因素
 *
 * @param interaction 互动数据
 * @param currentTime 当前时间戳（毫秒）
 * @param options 配置选项
 * @returns 热度分数
 */
export function calculateHotScore(
  interaction: InteractionData,
  currentTime: number = Date.now(),
  options: {
    decayRate?: number;
    wilsonConfidence?: number;
    interactionWeights?: {
      like: number;
      comment: number;
      favorite: number;
      share: number;
    };
  } = {}
): number {
  const {
    decayRate = 0.1,
    wilsonConfidence = 0.95,
    interactionWeights = {
      like: 1,
      comment: 2,
      favorite: 1.5,
      share: 3,
    },
  } = options;

  // 1. 计算加权正向互动数
  const positiveInteractions =
    interaction.likes * interactionWeights.like +
    interaction.comments * interactionWeights.comment +
    interaction.favorites * interactionWeights.favorite +
    interaction.shares * interactionWeights.share;

  // 2. 计算总互动数（正向 + 负向）
  const totalInteractions =
    positiveInteractions + interaction.skips + interaction.reports * 5; // 举报权重更高

  // 3. 计算 Wilson Score
  const wilsonScore = calculateWilsonScore(
    positiveInteractions,
    totalInteractions,
    wilsonConfidence
  );

  // 4. 计算时间衰减
  const timeDecay = calculateTimeDecay(
    interaction.publishTime,
    currentTime,
    decayRate
  );

  // 5. 综合热度分数 = Wilson Score × 时间衰减 × 互动量加成
  // 互动量加成：log(1 + 总互动数)，避免互动量过大导致分数失衡
  const interactionBonus = Math.log(1 + totalInteractions);

  return wilsonScore * timeDecay * interactionBonus;
}

/**
 * 批量计算热度并排序
 * @param interactions 互动数据列表
 * @param currentTime 当前时间戳
 * @param options 配置选项
 * @returns 按热度降序排序的内容列表
 */
export function rankByHotScore(
  interactions: InteractionData[],
  currentTime: number = Date.now(),
  options: {
    decayRate?: number;
    wilsonConfidence?: number;
    interactionWeights?: {
      like: number;
      comment: number;
      favorite: number;
      share: number;
    };
    topK?: number;
  } = {}
): Array<{ contentId: number; hotScore: number; interaction: InteractionData }> {
  const { topK, ...scoreOptions } = options;

  // 计算每个内容的热度分数
  const rankedItems = interactions.map((interaction) => ({
    contentId: interaction.contentId,
    hotScore: calculateHotScore(interaction, currentTime, scoreOptions),
    interaction,
  }));

  // 按热度降序排序
  rankedItems.sort((a, b) => b.hotScore - a.hotScore);

  // 返回前K个
  return topK ? rankedItems.slice(0, topK) : rankedItems;
}

/**
 * Reddit 热度算法（参考）
 * 考虑点赞/点踩比例和发布时间
 *
 * @param ups 点赞数
 * @param downs 点踩数
 * @param publishTime 发布时间戳（秒）
 * @returns Reddit热度分数
 */
export function calculateRedditHotScore(
  ups: number,
  downs: number,
  publishTime: number
): number {
  const score = ups - downs;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;

  // Reddit 的基准时间：2005-12-08 07:46:43 UTC
  const epoch = 1134028003;
  const seconds = publishTime - epoch;

  return sign * order + seconds / 45000;
}

/**
 * Hacker News 热度算法（参考）
 * 强调时间衰减，新内容更容易上榜
 *
 * @param points 得分（点赞数）
 * @param publishTime 发布时间戳（毫秒）
 * @param currentTime 当前时间戳（毫秒）
 * @param gravity 重力系数（默认1.8，越大衰减越快）
 * @returns HN热度分数
 */
export function calculateHackerNewsScore(
  points: number,
  publishTime: number,
  currentTime: number = Date.now(),
  gravity: number = 1.8
): number {
  const hoursElapsed = (currentTime - publishTime) / (1000 * 60 * 60);
  return (points - 1) / Math.pow(hoursElapsed + 2, gravity);
}

/**
 * 热度趋势分析
 * 分析内容热度的变化趋势（上升/下降）
 *
 * @param historicalScores 历史热度分数（按时间升序）
 * @returns 趋势系数（正数表示上升，负数表示下降）
 */
export function analyzeTrend(historicalScores: number[]): number {
  if (historicalScores.length < 2) {
    return 0;
  }

  // 简单线性回归计算趋势
  const n = historicalScores.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historicalScores[i];
    sumXY += i * historicalScores[i];
    sumX2 += i * i;
  }

  // 斜率 = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return slope;
}

/**
 * 热度分层
 * 将内容按热度分为不同层级
 *
 * @param rankedItems 已排序的内容列表
 * @returns 分层结果
 */
export function stratifyByHotScore(
  rankedItems: Array<{ contentId: number; hotScore: number }>
): {
  hot: number[]; // 热门（前10%）
  trending: number[]; // 上升中（10%-30%）
  normal: number[]; // 普通（30%-70%）
  cold: number[]; // 冷门（70%-100%）
} {
  const total = rankedItems.length;
  const hotThreshold = Math.floor(total * 0.1);
  const trendingThreshold = Math.floor(total * 0.3);
  const normalThreshold = Math.floor(total * 0.7);

  return {
    hot: rankedItems.slice(0, hotThreshold).map((item) => item.contentId),
    trending: rankedItems
      .slice(hotThreshold, trendingThreshold)
      .map((item) => item.contentId),
    normal: rankedItems
      .slice(trendingThreshold, normalThreshold)
      .map((item) => item.contentId),
    cold: rankedItems.slice(normalThreshold).map((item) => item.contentId),
  };
}

/**
 * 热度推荐主函数
 * @param interactions 互动数据列表
 * @param options 配置选项
 * @returns 热门内容推荐列表
 */
export function hotRanking(
  interactions: InteractionData[],
  options: {
    currentTime?: number;
    decayRate?: number;
    topK?: number;
    minInteractions?: number; // 最小互动数阈值
  } = {}
): Array<{ contentId: number; hotScore: number }> {
  const {
    currentTime = Date.now(),
    decayRate = 0.1,
    topK = 20,
    minInteractions = 5,
  } = options;

  // 过滤掉互动数过少的内容
  const validInteractions = interactions.filter((interaction) => {
    const totalInteractions =
      interaction.likes +
      interaction.comments +
      interaction.favorites +
      interaction.shares +
      interaction.skips +
      interaction.reports;
    return totalInteractions >= minInteractions;
  });

  // 计算热度并排序
  const ranked = rankByHotScore(validInteractions, currentTime, {
    decayRate,
    topK,
  });

  return ranked.map((item) => ({
    contentId: item.contentId,
    hotScore: item.hotScore,
  }));
}
