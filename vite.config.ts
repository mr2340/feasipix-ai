import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const envWithVitePrefix = Object.entries(env)
    .filter(([key]) => key.startsWith('VITE_'))
    .reduce((acc, [key, val]) => {
      acc[`import.meta.env.${key}`] = JSON.stringify(val);
      return acc;
    }, {});

  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: envWithVitePrefix,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
