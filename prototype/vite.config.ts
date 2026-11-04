import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The prototype reads ../data/plan-output.json (the planner is the single source of numbers).
export default defineConfig({
  base: './', // relative asset paths, so the build works from any host (phone test page)
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
})
