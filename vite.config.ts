import { defineConfig } from 'vite'

export default defineConfig({
  base: '/vector-game/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
  },
})
