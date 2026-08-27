import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths work both at /SunnyTime/ and with a custom domain.
  base: './',
  plugins: [react()]
})
