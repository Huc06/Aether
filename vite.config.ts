import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const nansenKey = env.NANSEN_API_KEY || env.VITE_NANSEN_API_KEY || '';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/nansen': {
          target: 'https://api.nansen.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nansen/, '/api/v1'),
          headers: {
            apikey: nansenKey,
          },
        },
      },
    },
  };
});
