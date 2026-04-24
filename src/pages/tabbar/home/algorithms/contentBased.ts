/**
 * 基于内容的推荐算法 (Content-Based Filtering)
 * 基于用户兴趣标签和内容标签进行匹配推荐
 */

export interface UserInterest {
  userId: number;
  tags: Array<{
    tag: string;
    weight: number; // 1-5星，表示兴趣强度
  }>;
}

export interface ContentItem {
  id: number;
  type: 'user' | 'post' | 'topic';
  tags: Array<{
    tag: string;
    weight: number; // 1-5，表示该标签在内容中的强度
  }>;
  metadata?: {
    title?: string;
    description?: string;
    category?: string;
  };
}

/**
 * 计算用户兴趣与内容的匹配度
 * @param userInterest 用户兴趣
 * @param content 内容项
 * @returns 匹配度分数 (0-1)
 */
export function calculateContentMatch(
  userInterest: UserInterest,
  content: ContentItem
): number {
  if (userInterest.tags.length === 0 || content.tags.length === 0) {
    return 0;
  }

  // 创建用户兴趣标签映射
  const userTagMap = new Map<string, number>();
  userInterest.tags.forEach((tag) => {
    userTagMap.set(tag.tag.toLowerCase(), tag.weight);
  });

  // 计算匹配分数
  let totalScore = 0;
  let matchedTags = 0;

  content.tags.forEach((contentTag) => {
    const tagName = contentTag.tag.toLowerCase();
    const userWeight = userTagMap.get(tagName);

    if (userWeight !== undefined) {
      // 匹配度 = 用户兴趣权重 × 内容标签权重
      totalScore += userWeight * contentTag.weight;
      matchedTags++;
    }
  });

  if (matchedTags === 0) {
    return 0;
  }

  // 归一化：除以最大可能分数 (5 * 5 * 匹配标签数)
  const maxPossibleScore = 25 * matchedTags;
  return totalScore / maxPossibleScore;
}

/**
 * TF-IDF 计算（用于文本内容分析）
 * @param term 词项
 * @param document 文档（词项列表）
 * @param allDocuments 所有文档
 * @returns TF-IDF 分数
 */
export function calculateTFIDF(
  term: string,
  document: string[],
  allDocuments: string[][]
): number {
  // 计算 TF (Term Frequency)
  const termCount = document.filter((t) => t === term).length;
  const tf = termCount / document.length;

  // 计算 IDF (Inverse Document Frequency)
  const documentsWithTerm = allDocuments.filter((doc) =>
    doc.includes(term)
  ).length;
  const idf = Math.log(allDocuments.length / (documentsWithTerm + 1));

  return tf * idf;
}

/**
 * 提取内容关键词（基于 TF-IDF）
 * @param content 内容文本
 * @param allContents 所有内容文本列表
 * @param topK 返回前K个关键词
 * @returns 关键词列表
 */
export function extractKeywords(
  content: string,
  allContents: string[],
  topK: number = 5
): Array<{ keyword: string; score: number }> {
  // 简单分词（实际应用中应使用专业分词库）
  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s一-龥]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1);
  };

  const currentDoc = tokenize(content);
  const allDocs = allContents.map((c) => tokenize(c));

  // 计算每个词的 TF-IDF
  const uniqueTerms = Array.from(new Set(currentDoc));
  const tfidfScores = uniqueTerms.map((term) => ({
    keyword: term,
    score: calculateTFIDF(term, currentDoc, allDocs),
  }));

  // 排序并返回前K个
  return tfidfScores.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * 基于内容相似度的推荐
 * @param userInterest 用户兴趣
 * @param contents 候选内容列表
 * @param excludeIds 需要排除的内容ID
 * @param topK 返回前K个推荐
 * @returns 推荐列表
 */
export function contentBasedRecommendation(
  userInterest: UserInterest,
  contents: ContentItem[],
  excludeIds: Set<number> = new Set(),
  topK: number = 20
): Array<{ contentId: number; score: number; content: ContentItem }> {
  // 过滤掉已排除的内容
  const candidateContents = contents.filter(
    (content) => !excludeIds.has(content.id)
  );

  // 计算每个内容的匹配度
  const recommendations = candidateContents.map((content) => ({
    contentId: content.id,
    score: calculateContentMatch(userInterest, content),
    content,
  }));

  // 按分数降序排序
  return recommendations
    .filter((rec) => rec.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 多样性调整：避免推荐内容过于单一
 * @param recommendations 原始推荐列表
 * @param diversityFactor 多样性因子 (0-1)，越大越多样
 * @returns 调整后的推荐列表
 */
export function applyDiversityAdjustment(
  recommendations: Array<{
    contentId: number;
    score: number;
    content: ContentItem;
  }>,
  diversityFactor: number = 0.3
): Array<{ contentId: number; score: number; content: ContentItem }> {
  if (recommendations.length === 0) {
    return [];
  }

  const result: Array<{
    contentId: number;
    score: number;
    content: ContentItem;
  }> = [];
  const selectedTags = new Set<string>();

  // 贪心算法：每次选择分数最高且标签多样性最好的内容
  const remaining = [...recommendations];

  while (remaining.length > 0 && result.length < recommendations.length) {
    let bestIndex = 0;
    let bestScore = -1;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];

      // 计算标签多样性奖励
      const newTags = item.content.tags.filter(
        (tag) => !selectedTags.has(tag.tag)
      ).length;
      const diversityBonus = newTags * diversityFactor;

      // 综合分数 = 原始分数 + 多样性奖励
      const adjustedScore = item.score + diversityBonus;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestIndex = i;
      }
    }

    // 选择最佳项
    const selected = remaining.splice(bestIndex, 1)[0];
    result.push(selected);

    // 更新已选择的标签
    selected.content.tags.forEach((tag) => {
      selectedTags.add(tag.tag);
    });
  }

  return result;
}

/**
 * 冷启动处理：为新用户生成推荐
 * @param contents 候选内容列表
 * @param popularityScores 内容热度分数
 * @param topK 返回前K个推荐
 * @returns 推荐列表
 */
export function coldStartRecommendation(
  contents: ContentItem[],
  popularityScores: Map<number, number>,
  topK: number = 20
): Array<{ contentId: number; score: number; content: ContentItem }> {
  // 基于热度推荐
  const recommendations = contents.map((content) => ({
    contentId: content.id,
    score: popularityScores.get(content.id) || 0,
    content,
  }));

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 内容推荐主函数
 * @param userInterest 用户兴趣
 * @param contents 候选内容列表
 * @param options 配置选项
 * @returns 推荐列表
 */
export function contentBasedFiltering(
  userInterest: UserInterest | null,
  contents: ContentItem[],
  options: {
    excludeIds?: Set<number>;
    topK?: number;
    diversityFactor?: number;
    popularityScores?: Map<number, number>;
  } = {}
): Array<{ contentId: number; score: number; content: ContentItem }> {
  const {
    excludeIds = new Set(),
    topK = 20,
    diversityFactor = 0.3,
    popularityScores = new Map(),
  } = options;

  // 冷启动：用户无兴趣标签时，基于热度推荐
  if (!userInterest || userInterest.tags.length === 0) {
    return coldStartRecommendation(contents, popularityScores, topK);
  }

  // 基于内容的推荐
  let recommendations = contentBasedRecommendation(
    userInterest,
    contents,
    excludeIds,
    topK * 2 // 先获取2倍数量，用于多样性调整
  );

  // 应用多样性调整
  recommendations = applyDiversityAdjustment(
    recommendations,
    diversityFactor
  );

  return recommendations.slice(0, topK);
}
