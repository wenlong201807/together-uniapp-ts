import { onMounted, onUnmounted } from 'vue';
import type { Ref } from '@vue/reactivity';
import { eventBus, EVENTS } from '@/utils/event-bus';

interface LikeEventData {
  targetId: number;
  targetType: 1 | 2; // 1: 帖子, 2: 评论
  isLiked: boolean;
  likeCount: number;
}

/**
 * 点赞状态同步 Hook
 * 用于在不同页面间同步点赞状态
 */
export const useLikeSync = (
  items: Ref<any[] | { list: any[] }>,
  options: {
    targetType: 1 | 2; // 1: 帖子, 2: 评论
    idField?: string; // ID 字段名，默认 'id'
  }
) => {
  const { targetType, idField = 'id' } = options;

  const handleLikeUpdate = (data: LikeEventData) => {
    // 只处理相同类型的点赞事件
    if (data.targetType !== targetType) return;

    const list = Array.isArray(items.value) ? items.value : items.value.list;
    if (!list) return;

    const item = list.find((item) => item[idField] === data.targetId);
    if (item) {
      item.isLiked = data.isLiked;
      item.likeCount = data.likeCount;
    }
  };

  onMounted(() => {
    const eventName = targetType === 1 ? EVENTS.POST_LIKED : EVENTS.COMMENT_LIKED;
    eventBus.on(eventName, handleLikeUpdate);
  });

  onUnmounted(() => {
    const eventName = targetType === 1 ? EVENTS.POST_LIKED : EVENTS.COMMENT_LIKED;
    eventBus.off(eventName, handleLikeUpdate);
  });
};
