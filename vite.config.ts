import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5199,
      host: true,
      proxy: {
        '/api/agent': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/api/nansen': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
