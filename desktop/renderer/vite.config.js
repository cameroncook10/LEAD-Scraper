import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../frontend/src'),
    },
    // Force Vite to resolve all packages from the renderer's node_modules
    // (since imported frontend/src files don't have their own node_modules)
    dedupe: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion', 'lucide-react', '@supabase/supabase-js',
      'axios', 'date-fns', 'clsx', 'tailwind-merge',
    ],
  },
  server: {
    port: 3005,
    fs: {
      // Allow serving files from the frontend source directory
      allow: [__dirname, path.resolve(__dirname, '../../frontend/src')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Ensure Rollup resolves modules from the renderer's node_modules
      // when processing files outside the renderer root
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3099/api'),
  },
  // Resolve modules from the renderer's own node_modules even for
  // source files imported from ../../frontend/src/
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion', 'lucide-react', '@supabase/supabase-js',
      'axios', 'date-fns', 'clsx', 'tailwind-merge',
    ],
  },
});
