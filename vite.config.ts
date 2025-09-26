import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      reloadSW: true,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Área do Aluno - Alê Grimaldi',
        short_name: 'Alê Grimaldi',
        description: 'Área do Aluno - Alê Grimaldi',
        theme_color: '#8E2DE2',
        background_color: '#1A1A1A',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg}'], // Removido HTML do cache
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: null, // Evita cache de navegação
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        globIgnores: ['**/*.html', '**/*.map', '**/manifest.json', '**/*.webmanifest'], // Excluir arquivos críticos do cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'NetworkFirst', // Prioriza rede para detectar updates
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 3 // 3 dias apenas
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst', // Prioriza rede para JS/CSS
            options: {
              cacheName: 'static-resources',
              networkTimeoutSeconds: 2 // Timeout mais agressivo
            }
          },
          {
            urlPattern: /.*\.html$/,
            handler: 'NetworkOnly', // HTML sempre da rede
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Configurações para o servidor de desenvolvimento
    port: 5175,
    strictPort: false, // Permitir que o Vite tente outras portas se 5175 estiver em uso
  },
  build: {
    // Configurações para a build
    outDir: 'dist',
    assetsInlineLimit: 0, // Não inline nenhum asset
    // Remove console.logs em produção usando Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,     // Remove console.log
        drop_debugger: true,    // Remove debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Extra segurança
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Cache busting ultra-agressivo com timestamp + hash de conteúdo
        entryFileNames: (chunkInfo) => {
          const timestamp = Date.now();
          return `assets/${chunkInfo.name}-${timestamp}-[hash].js`;
        },
        chunkFileNames: (chunkInfo) => {
          const timestamp = Date.now();
          return `assets/${chunkInfo.name}-${timestamp}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const timestamp = Date.now();
          const ext = assetInfo.name?.split('.').pop();
          const name = assetInfo.name?.replace(`.${ext}`, '');
          return `assets/${name}-${timestamp}-[hash].${ext}`;
        },
        // Força rebuild completo
        manualChunks: undefined
      }
    },
    // Força rebuild sempre que houver mudanças
    sourcemap: false,
    target: 'esnext',
    cssCodeSplit: true,
    // Força regeneração de IDs únicos
    chunkSizeWarningLimit: 1000,
  },
});
