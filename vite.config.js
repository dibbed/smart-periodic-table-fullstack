import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables (.env, .env.local) based on current mode
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.PORT || process.env.PORT || 3000;
  const backendHost = env.HOST || process.env.HOST || '127.0.0.1';
  const backendUrl = env.BACKEND_URL || process.env.BACKEND_URL || `http://${backendHost}:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '127.0.0.1',
      proxy: {
        // Reverse-proxy all /api requests to Express backend (zero hardcoded URLs, zero CORS issues)
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn(`[Vite Proxy] Warning: Unable to reach backend server at ${backendUrl} (${err.message})`);
            });
          }
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'three-vendor': ['three'],
            'react-vendor': ['react', 'react-dom'],
            'icons-vendor': ['lucide-react'],
          },
        },
      },
    },
  };
});
