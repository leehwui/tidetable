import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/geo': {
        target: 'https://pd78kymwkm.re.qweatherapi.com',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/v7': {
        target: 'https://pd78kymwkm.re.qweatherapi.com',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
