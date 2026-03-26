import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env vars from desktop/.env (one level up from renderer)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    root: __dirname,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../frontend/src'),
        // Redirect frontend AuthContext → Electron AuthContext so that
        // shared pages like LoginPage use the Electron auth provider
        [path.resolve(__dirname, '../../frontend/src/contexts/AuthContext')]:
          path.resolve(__dirname, 'contexts/ElectronAuthContext.jsx'),
      },
      dedupe: [
        'react', 'react-dom', 'react-router-dom',
        'framer-motion', 'lucide-react', '@supabase/supabase-js',
        'axios', 'date-fns', 'clsx', 'tailwind-merge',
      ],
    },
    server: {
      port: 3005,
      fs: {
        allow: [__dirname, path.resolve(__dirname, '../../frontend/src')],
      },
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3099/api'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
      ),
    },
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-router-dom',
        'framer-motion', 'lucide-react', '@supabase/supabase-js',
        'axios', 'date-fns', 'clsx', 'tailwind-merge',
      ],
    },
  };
});
