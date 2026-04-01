import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pwaEnabled = env.VITE_ENABLE_PWA !== 'false'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(pwaEnabled
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg', 'icons/*.png'],
              manifest: {
                name: 'KidsPay',
                short_name: 'KidsPay',
                description: 'Gestao de tarefas e recompensas para educacao financeira infantil',
                theme_color: '#6366f1',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
              },
            }),
          ]
        : []),
    ],
  }
})
