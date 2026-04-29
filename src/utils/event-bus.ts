/**
 * 全局事件总线
 */
type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  clear() {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

// 事件常量
export const EVENTS = {
  AVATAR_UPDATED: 'avatar:updated',
  USER_INFO_UPDATED: 'user:info:updated',
  POST_LIKED: 'post:liked',
  COMMENT_LIKED: 'comment:liked',
  USER_FOLLOWED: 'user:followed',
  USER_UNFOLLOWED: 'user:unfollowed',
  CHAT_NOTIFICATION: 'chat:notification',
};
