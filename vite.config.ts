import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

// 加载环境变量
const env = loadEnv('', process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'], // 静默 legacy-js-api 警告
      },
    },
  },
  optimizeDeps: {
    include: ['socket.io-client', 'ms', 'debug'],
  },
  build: {
    commonjsOptions: {
      include: [/socket\.io-client/, /debug/, /ms/, /node_modules/],
    },
  },
  server: {
    port: Number(env.VITE_APP_PORT) || 8106,
    proxy: {
      '/api': {
        target:
          env.VITE_APP_API_BASE_URL?.replace('/api/v1', '') ||
          'http://localhost:9201',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
      '/ws': {
        target:
          env.VITE_APP_WS_BASE_URL?.replace('ws://', 'http://')?.replace(
            '/ws',
            '',
          ) || 'http://localhost:9201',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
