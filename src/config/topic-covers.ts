/**
 * 话题默认封面图配置
 */
export interface TopicCover {
  id: string;
  name: string;
  url: string;
  color: string; // 主题色
}

export const DEFAULT_TOPIC_COVERS: TopicCover[] = [
  {
    id: 'tech',
    name: '科技',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
    color: '#4A90E2',
  },
  {
    id: 'travel',
    name: '旅行',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop',
    color: '#F5A623',
  },
  {
    id: 'food',
    name: '美食',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    color: '#E74C3C',
  },
  {
    id: 'fitness',
    name: '健身',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    color: '#27AE60',
  },
  {
    id: 'reading',
    name: '阅读',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop',
    color: '#8E44AD',
  },
  {
    id: 'music',
    name: '音乐',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
    color: '#E67E22',
  },
  {
    id: 'art',
    name: '艺术',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop',
    color: '#16A085',
  },
  {
    id: 'pet',
    name: '宠物',
    url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop',
    color: '#F39C12',
  },
];
