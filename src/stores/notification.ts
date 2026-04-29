import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useFriendStore } from './friend';
import type { Message } from '@/types';
import { MAX_NOTIFICATIONS, ROUTES } from '@/constants/notification';

export interface ChatNotification {
  id: string;
  senderId: number;
  senderNickname: string;
  senderAvatar: string;
  relationshipType: 'friend' | 'stranger';
  messages: Array<{
    id: number;
    content: string;
    createdAt: string;
  }>;
  unreadCount: number;
  createdAt: number;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<ChatNotification[]>([]);
  const isExpanded = ref(false);

  // 防止竞态条件：记录正在进行的关系查询
  const pendingChecks = new Map<number, Promise<boolean>>();

  const totalUnreadCount = computed(() => {
    return notifications.value.reduce((sum, n) => sum + n.unreadCount, 0);
  });

  /**
   * 添加通知
   */
  const addNotification = async (message: Message) => {
    const friendStore = useFriendStore();

    // 查询关系类型（防止重复查询）
    let isFriendPromise = pendingChecks.get(message.senderId);
    if (!isFriendPromise) {
      isFriendPromise = friendStore.checkIsFriend(message.senderId);
      pendingChecks.set(message.senderId, isFriendPromise);

      // 查询完成后清理
      isFriendPromise.finally(() => {
        pendingChecks.delete(message.senderId);
      });
    }

    const isFriend = await isFriendPromise;
    const relationshipType: 'friend' | 'stranger' = isFriend ? 'friend' : 'stranger';

    // 检查是否已存在该用户的通知
    const existingIndex = notifications.value.findIndex(n => n.senderId === message.senderId);

    if (existingIndex !== -1) {
      // 合并同一用户的消息
      const existing = notifications.value[existingIndex];
      existing.messages.push({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
      });
      existing.unreadCount++;
    } else {
      // 新增通知
      const notification: ChatNotification = {
        id: `${message.senderId}-${Date.now()}`,
        senderId: message.senderId,
        senderNickname: message.sender?.nickname || '用户',
        senderAvatar: message.sender?.avatarUrl || '',
        relationshipType,
        messages: [{
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
        }],
        unreadCount: 1,
        createdAt: Date.now(),
      };

      // 限制最大数量
      if (notifications.value.length >= MAX_NOTIFICATIONS) {
        notifications.value.shift(); // 移除最旧的
      }

      notifications.value.push(notification);
    }
  };

  /**
   * 清除指定用户的通知
   */
  const clearNotification = (userId: number) => {
    const index = notifications.value.findIndex(n => n.senderId === userId);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  /**
   * 清除所有通知
   */
  const clearAllNotifications = () => {
    notifications.value = [];
  };

  /**
   * 获取指定用户的通知
   */
  const getNotification = (userId: number): ChatNotification | undefined => {
    return notifications.value.find(n => n.senderId === userId);
  };

  /**
   * 检查是否有指定用户的通知
   */
  const hasNotification = (userId: number): boolean => {
    return notifications.value.some(n => n.senderId === userId);
  };

  /**
   * 获取指定用户的未读数
   */
  const getNotificationCount = (userId: number): number => {
    const notification = getNotification(userId);
    return notification?.unreadCount || 0;
  };

  /**
   * 获取指定用户的关系类型
   */
  const getNotificationRelationType = (userId: number): 'friend' | 'stranger' | null => {
    const notification = getNotification(userId);
    return notification?.relationshipType || null;
  };

  /**
   * 更新展开状态
   */
  const updateExpandState = (expanded: boolean) => {
    isExpanded.value = expanded;
  };

  /**
   * 点击角标（折叠状态）
   */
  const handleBadgeClick = () => {
    uni.switchTab({
      url: ROUTES.CHAT_LIST,
    });
  };

  return {
    notifications,
    isExpanded,
    totalUnreadCount,
    addNotification,
    clearNotification,
    clearAllNotifications,
    getNotification,
    hasNotification,
    getNotificationCount,
    getNotificationRelationType,
    updateExpandState,
    handleBadgeClick,
  };
}, {
  persist: {
    key: 'chat-notifications',
    storage: localStorage,
    paths: ['notifications', 'isExpanded'],
  },
});
