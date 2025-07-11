import { defineConfig as defineViteConfig, loadEnv, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

const viteConfig = defineViteConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      electron([
        {
          entry: './electron/main.ts',
          vite: {
            build: {
              outDir: 'dist/main',
              rollupOptions: {
                output: {
                  format: 'cjs',
                },
              },
            },
          },
        },
        {
          entry: './electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist/preload',
              rollupOptions: {
                output: {
                  format: 'cjs',
                },
              },
            },
          },
          onstart(options) {
            options.reload();
          },
        },
      ]),
      renderer(),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
          changeOrigin: true,
          ws: true,
        },
      },
    },
    base: './',
    build: {
      outDir: 'dist/renderer',
    },
  };
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

export default defineViteConfig((configEnv) => {
  return mergeConfig(viteConfig(configEnv), vitestConfig);
});
