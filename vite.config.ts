
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Reduce file watching to prevent EMFILE errors
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.cache/**',
        '**/coverage/**',
        '**/*.log',
        '**/.DS_Store',
        '**/Thumbs.db'
      ],
      // Use polling as fallback for file watching
      usePolling: true,
      // Reduce the number of file watchers
      interval: 1000,
    },
    // Optimize for better file handling
    fs: {
      strict: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize build for better performance
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
  ssr: {
    noExternal: ['@supabase/supabase-js'],
  },
  // Reduce the number of files being processed
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    sourcemap: false, // Disable source maps in production for security
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        },
      },
    },
  },
}));
