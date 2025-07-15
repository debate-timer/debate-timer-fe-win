import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

const viteConfig = defineViteConfig(() => {
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
    ],
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
    setupFiles: './src/setup.ts',
  },
});

export default defineViteConfig((configEnv) => {
  return mergeConfig(viteConfig(configEnv), vitestConfig);
});
