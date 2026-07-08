/// <reference types="vite/client" />

import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    { ...eslintPlugin(), apply: 'serve' }, // dev only to reduce build time
  ],
  define: {
    // Workaround for a known regression, present since react-draggable@4.6.0,
    // where process.env is referenced in the browser bundle served by Vite's
    // development server. It caused `ReferenceError: process is not defined`
    // when clicking on draggable elements (e.g. GridForm in UI dev).
    // https://github.com/react-grid-layout/react-draggable/issues/806
    'process.env': '{}',
  },
  server: {
    open: true, // open default browser on start
    strictPort: true, // fail if port already in use (must be 5173 to match server's CORS config)
    proxy: {
      '/mxcube/api': 'http://127.0.0.1:8081',
      '/socket.io/': { target: 'ws://127.0.0.1:8081', ws: true },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  assetsInclude: ['**/*.ogv'],
});
