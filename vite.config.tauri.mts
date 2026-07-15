import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const TAURI_DEV_SERVER_PORT = 1420;

function tauriDatabaseBridge(): Plugin {
  return {
    name: 'tauri-database-bridge',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: '/src-tauri/frontend/db.ts',
          },
          injectTo: 'body-prepend',
        },
      ],
    },
  };
}

export default defineConfig({
  plugins: [tauriDatabaseBridge(), react()],
  base: './',
  clearScreen: false,
  server: {
    port: TAURI_DEV_SERVER_PORT,
    strictPort: true,
  },
  build: {
    outDir: 'dist/tauri-renderer',
    emptyOutDir: true,
  },
});
