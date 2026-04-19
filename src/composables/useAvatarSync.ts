import { onMounted, onUnmounted } from 'vue';
import { eventBus, EVENTS } from '@/utils/event-bus';
import { useAuthStore } from '@/stores';

/**
 * 头像同步 Hook
 * 监听全局头像更新事件，自动更新列表中的用户头像
 */
export function useAvatarSync(
  dataList: any,
  options: {
    userIdField?: string;
    avatarIdField?: string;
    avatarUrlField?: string;
    nestedUserField?: string;
  } = {}
) {
  const {
    userIdField = 'userId',
    avatarIdField = 'avatarId',
    avatarUrlField = 'avatarUrl',
    nestedUserField = 'user',
  } = options;

  const authStore = useAuthStore();

  const handleAvatarUpdate = (payload: {
    userId: number;
    avatarId?: number;
    avatarUrl?: string;
  }) => {
    if (!dataList.value) return;

    // 更新列表中的头像
    const list = Array.isArray(dataList.value) ? dataList.value : dataList.value.list;
    if (!list) return;

    list.forEach((item: any) => {
      // 支持两种数据结构：
      // 1. 直接在 item 上有 userId
      // 2. 在 item.user 上有 id
      const itemUserId = nestedUserField
        ? item[nestedUserField]?.id
        : item[userIdField];

      if (itemUserId === payload.userId) {
        if (nestedUserField && item[nestedUserField]) {
          // 更新嵌套的 user 对象
          item[nestedUserField][avatarIdField] = payload.avatarId ?? null;
          item[nestedUserField][avatarUrlField] = payload.avatarUrl ?? null;
        } else {
          // 直接更新 item
          item[avatarIdField] = payload.avatarId ?? null;
          item[avatarUrlField] = payload.avatarUrl ?? null;
        }
      }
    });
  };

  onMounted(() => {
    eventBus.on(EVENTS.AVATAR_UPDATED, handleAvatarUpdate);
  });

  onUnmounted(() => {
    eventBus.off(EVENTS.AVATAR_UPDATED, handleAvatarUpdate);
  });

  return {
    handleAvatarUpdate,
  };
}
