import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import compression from "vite-plugin-compression";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger(),
    // Compressão para produção
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Análise de bundle em produção
    mode === 'production' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de performance
    target: "esnext",
    minify: "esbuild",
    // Otimizações de assets
    assetsInlineLimit: 4096, // Inline assets menores que 4KB
    cssCodeSplit: true, // Split CSS para melhor cache
    rollupOptions: {
      output: {
        // Code splitting avançado para melhor cache
        manualChunks: (id) => {
          // React core
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // UI Components (Radix UI)
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          
          // Charts and visualization
          if (id.includes('recharts') || id.includes('chart')) {
            return 'charts-vendor';
          }
          
          // Form handling
          if (id.includes('@hookform') || id.includes('zod')) {
            return 'forms-vendor';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // QR Code and scanning
          if (id.includes('html5-qrcode') || id.includes('qr')) {
            return 'scanner-vendor';
          }
          
          // Excel/XLSX utilities
          if (id.includes('xlsx')) {
            return 'excel-vendor';
          }
          
          // Admin pages
          if (id.includes('/pages/admin/')) {
            return 'admin-pages';
          }
          
          // Assets pages
          if (id.includes('/pages/assets/')) {
            return 'assets-pages';
          }
          
          // Reports pages
          if (id.includes('/pages/reports/')) {
            return 'reports-pages';
          }
          
          // Inventory pages
          if (id.includes('/pages/inventory/')) {
            return 'inventory-pages';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Nomes de arquivo com hash para cache de longa duração
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Source maps apenas em desenvolvimento
    sourcemap: mode === "development",
  },
}));
