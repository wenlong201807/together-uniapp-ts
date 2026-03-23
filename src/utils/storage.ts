export const storage = {
  get<T = any>(key: string): T | null {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      return null
    }
  },

  set(key: string, value: any): void {
    try {
      uni.setStorageSync(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  remove(key: string): void {
    uni.removeStorageSync(key)
  },

  clear(): void {
    uni.clearStorageSync()
  }
}