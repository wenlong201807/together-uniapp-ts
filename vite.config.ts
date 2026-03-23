import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 3008,
    proxy: {
      '/api': {
        target: 'http://localhost:3018',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
      '/ws': {
        target: 'ws://localhost:3018',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
