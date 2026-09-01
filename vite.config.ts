import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  envPrefix: ['VITE_', 'API_', 'SOCKET_', 'REACT_APP_'],
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'bypass-api-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            // Bypass Vite's historyApiFallback HTML rewrite for /api endpoints
            req.headers.accept = req.headers.accept?.replace('text/html', 'application/json') || '*/*';
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('konva') || id.includes('react-konva')) {
              return 'vendor-canvas';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('html5-qrcode') || id.includes('qrcode.react')) {
              return 'vendor-qr';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
