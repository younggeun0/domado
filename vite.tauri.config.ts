import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tauri 시험 구현용 renderer 빌드 (electron-vite의 renderer 설정과 같다)
export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: { outDir: '../../dist-tauri', emptyOutDir: true },
})
