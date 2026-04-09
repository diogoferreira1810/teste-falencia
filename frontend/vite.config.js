// vite.config.js
//
// Vite is our build tool and dev server for the React frontend.
// This config sets up two things:
//   1. The React plugin (enables JSX transformation)
//   2. A dev proxy: any request to /api/* is forwarded to our Express backend.
//      This means in development we don't need CORS headers or hardcoded URLs.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All requests starting with /api are proxied to the backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
