import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail instead of silently switching ports: the API only allows this origin (CORS).
    strictPort: true,
  },
});
