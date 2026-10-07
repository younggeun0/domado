import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// renderer 빌드. tauri dev·build가 실행하고 dist를 앱에 넣는다
export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true },
})
