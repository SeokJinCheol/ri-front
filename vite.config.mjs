import { defineConfig, loadEnv } from 'vite';
import backendConfig from './electron/backend-config.cjs';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'electron') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    backendConfig.validateBackendUrl(env.VITE_API_BASE_URL);
  }
  return ({
  base: mode === 'electron' ? './' : '/',
  plugins: [
    react(),
    ...(['nginx', 'local-test'].includes(mode) ? [] : [electron([
      {
        entry: 'electron/main.js',
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer()]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
});
