import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'alias-lesson01-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/assets/lesson01/')) {
            const redirectedUrl = req.url.replace('/assets/lesson01/', '/assets/lesson_01/');
            const filePath = path.join(process.cwd(), 'public', redirectedUrl);
            if (fs.existsSync(filePath)) {
              req.url = redirectedUrl;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
