import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // ── Development server ─────────────────────────────────────
    server: {
      port: 3001,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3002',
          changeOrigin: true,
        },
        '/auth': {
          target: env.VITE_API_URL || 'http://localhost:3002',
          changeOrigin: true,
        },
        '/health': {
          target: env.VITE_API_URL || 'http://localhost:3002',
          changeOrigin: true,
        },
      },
    },

    // ── Production build ───────────────────────────────────────
    build: {
      outDir:    'dist',
      sourcemap: mode !== 'production',   // source maps in staging, not prod
      minify:    'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
      // Increase chunk size warning threshold (framer-motion is large)
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate large vendor libs into their own cached chunks
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-framer':   ['framer-motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },

    // ── Env variables exposed to the browser ──────────────────
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || 'local'),
    },
  };
});
