// NX-015 (ADR-002): Vite + React 19, PWA com manifest e service worker, `base: './'` para o
// GitHub Pages. `npm run build:teste` gera o build de teste (MODE = 'test', em dist-teste/), o único
// com tempo acelerado e console de debug (C3).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // Registro em <script> inline: sem pacote extra no bundle e sem recarregar a página sozinho.
      injectRegister: 'inline',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nexus Idle',
        short_name: 'Nexus Idle',
        description: 'Jogo idle de fã, gratuito, ambientado no competitivo.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        // docs/arte/tokens-marca.md §8
        theme_color: '#0B1220',
        background_color: '#0B1220',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icon-mono-512.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
        ],
      },
      workbox: {
        // Só o subconjunto latino das fontes entra no cache offline (é o que o pt-BR usa).
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*-latin-*.woff2'],
        globIgnores: ['**/*-latin-ext-*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
  },
});
