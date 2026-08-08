import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages сервірує репозиторій із підпапки /Substitution/, а не з кореня —
  // потрібно тільки для білду, дев-сервер лишається на localhost:5173/.
  base: command === 'build' ? '/Substitution/' : '/',
  server: {
    host: true,
  },
}))
