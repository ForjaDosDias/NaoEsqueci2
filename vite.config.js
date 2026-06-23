import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // backend leve da NFC-e (npm run server) — segue a mesma PORT do server
      '/api': `http://localhost:${process.env.PORT || 3001}`,
    },
  },
});
