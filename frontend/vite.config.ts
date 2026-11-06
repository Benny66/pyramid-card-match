import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 纯前端工程：没有后端、没有接口代理。
// 先构建到 frontend/dist，再由 sync.mjs 把产物复制到项目根目录，
// 使已发布的静态链接（入口为根 index.html）保持不变，同时避免 Vite 直接写项目根。
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
