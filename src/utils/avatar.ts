/**
 * MBTI 头像配置
 * 16 种 MBTI 类型对应的头像 ID 和信息
 */
export interface MbtiAvatarConfig {
  id: number;
  type: string;
  name: string;
  icon: string;
}

export const MBTI_AVATARS: MbtiAvatarConfig[] = [
  { id: 1, type: 'INTJ', name: '建筑师', icon: '🏛️' },
  { id: 2, type: 'INTP', name: '逻辑学家', icon: '🧠' },
  { id: 3, type: 'ENTJ', name: '指挥官', icon: '⚔️' },
  { id: 4, type: 'ENTP', name: '辩论家', icon: '💡' },
  { id: 5, type: 'INFJ', name: '提倡者', icon: '🌟' },
  { id: 6, type: 'INFP', name: '调停者', icon: '🦋' },
  { id: 7, type: 'ENFJ', name: '主人公', icon: '🎭' },
  { id: 8, type: 'ENFP', name: '竞选者', icon: '🎨' },
  { id: 9, type: 'ISTJ', name: '物流师', icon: '📋' },
  { id: 10, type: 'ISFJ', name: '守卫者', icon: '🛡️' },
  { id: 11, type: 'ESTJ', name: '总经理', icon: '💼' },
  { id: 12, type: 'ESFJ', name: '执政官', icon: '🤝' },
  { id: 13, type: 'ISTP', name: '鉴赏家', icon: '🔧' },
  { id: 14, type: 'ISFP', name: '探险家', icon: '🎪' },
  { id: 15, type: 'ESTP', name: '企业家', icon: '🚀' },
  { id: 16, type: 'ESFP', name: '表演者', icon: '🎤' },
];

/**
 * 根据头像 ID 获取 MBTI 配置
 */
export function getMbtiAvatarById(id: number): MbtiAvatarConfig | undefined {
  return MBTI_AVATARS.find((avatar) => avatar.id === id);
}

/**
 * 根据 MBTI 类型获取头像配置
 */
export function getMbtiAvatarByType(
  type: string,
): MbtiAvatarConfig | undefined {
  return MBTI_AVATARS.find((avatar) => avatar.type === type);
}

/**
 * 获取头像显示 URL
 * @param avatarId 头像 ID (1-16)
 * @param avatarUrl 自定义头像 URL
 * @returns 显示的头像信息
 */
export function getAvatarDisplay(
  avatarId?: number,
  avatarUrl?: string,
): {
  type: 'preset' | 'custom';
  value: string;
  displayUrl: string;
  icon?: string;
  mbtiType?: string;
} {
  // 优先使用自定义头像
  if (avatarUrl) {
    return {
      type: 'custom',
      value: avatarUrl,
      displayUrl: avatarUrl,
    };
  }

  // 使用预设 MBTI 头像
  if (avatarId && avatarId >= 1 && avatarId <= 16) {
    const mbtiAvatar = getMbtiAvatarById(avatarId);
    if (mbtiAvatar) {
      return {
        type: 'preset',
        value: String(avatarId),
        displayUrl: '',
        icon: mbtiAvatar.icon,
        mbtiType: mbtiAvatar.type,
      };
    }
  }

  // 默认头像
  return {
    type: 'custom',
    value: '/static/images/default-avatar.png',
    displayUrl: '/static/images/default-avatar.png',
  };
}
