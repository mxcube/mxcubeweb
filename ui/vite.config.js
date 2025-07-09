import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    { ...eslintPlugin(), apply: 'serve' }, // dev only to reduce build time
  ],
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
