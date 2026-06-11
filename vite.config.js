import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // backend leve da NFC-e (npm run server)
      '/api': 'http://localhost:3001',
    },
  },
});
