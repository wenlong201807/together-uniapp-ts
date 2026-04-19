import { onMounted, onUnmounted, Ref } from 'vue';
import { eventBus, EVENTS } from '@/utils/event-bus';

interface FollowEventData {
  userId: number;
  isFollowed: boolean;
}

/**
 * 关注状态同步 Hook
 * 用于在不同页面间同步关注状态
 */
export const useFollowSync = (
  items: Ref<any[] | { list: any[] }>,
  options?: {
    userIdField?: string; // 用户 ID 字段名，默认 'userId'
    nestedUserField?: string; // 嵌套的用户对象字段名，如 'user'
  }
) => {
  const { userIdField = 'userId', nestedUserField } = options || {};

  const handleFollowUpdate = (data: FollowEventData) => {
    const list = Array.isArray(items.value) ? items.value : items.value.list;
    if (!list) return;

    list.forEach((item) => {
      let targetUserId: number | undefined;

      // 获取用户 ID
      if (nestedUserField && item[nestedUserField]) {
        targetUserId = item[nestedUserField].id;
      } else {
        targetUserId = item[userIdField];
      }

      // 更新关注状态
      if (targetUserId === data.userId) {
        if (nestedUserField && item[nestedUserField]) {
          item[nestedUserField].isFollowed = data.isFollowed;
        } else {
          item.isFollowed = data.isFollowed;
        }
      }
    });
  };

  onMounted(() => {
    eventBus.on(EVENTS.USER_FOLLOWED, handleFollowUpdate);
    eventBus.on(EVENTS.USER_UNFOLLOWED, handleFollowUpdate);
  });

  onUnmounted(() => {
    eventBus.off(EVENTS.USER_FOLLOWED, handleFollowUpdate);
    eventBus.off(EVENTS.USER_UNFOLLOWED, handleFollowUpdate);
  });
};
