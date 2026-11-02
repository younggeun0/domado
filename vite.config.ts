import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// renderer 빌드. tauri dev·build가 실행해 dist를 앱에 넣고, 웹앱(domado.younggeun0.dev)은 같은 dist를 그대로 배포한다
export default defineConfig({
  root: 'src/renderer',
  // 웹앱 manifest·아이콘
  publicDir: '../../public',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true },
})
