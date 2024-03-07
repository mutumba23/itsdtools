import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@script': resolve('src/main/src/scripts')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@script': resolve('src/main/src/scripts')
      }
    },
    plugins: [vue()],
    publicDir: 'public'
  },
})
