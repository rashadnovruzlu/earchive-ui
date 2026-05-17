import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5239';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('/@mui/') || id.includes('/@emotion/')) {
              return 'mui';
            }

            if (id.includes('/react-router') || id.includes('/history')) {
              return 'router';
            }

            if (id.includes('/@fontsource/')) {
              return 'fonts';
            }

            return 'vendor';
          }
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});