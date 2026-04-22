export const API_CONFIG = {
  baseURL: import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:3018/api/v1',
  timeout: 30000,
  wsURL: import.meta.env.VITE_APP_WS_BASE_URL || 'ws://localhost:3018/ws'
}

export const APP_CONFIG = {
  appName: 'WeTogether',
  version: '1.0.0'
}