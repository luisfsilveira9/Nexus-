// NX-015: E2E com Playwright (ADR-002, C5 e C9). Os nomes dos projetos são combinados com o QA
// (pedido QA-28): o PR roda `--project=360x640`; a main roda todos.
// - Todos os projetos com `isMobile` e `hasTouch` (C5).
// - `iphone` usa o WebKit (regressão da main). Sem WebKit instalado, rode com
//   E2E_IPHONE_NAVEGADOR=chromium para usar o perfil do iPhone no Chromium.
// - Sem download do Chromium (rede bloqueada), aponte um já instalado com E2E_CHROMIUM=<caminho>.
// - Servidor: `vite preview` do `dist/` já construído (o mesmo build do deploy; a CI baixa o dist/
//   do job de build). Rode `npm run build` antes de `npm run test:e2e`; sem dist/, ele constrói.
// - C9: o fixture de tests/e2e/ bloqueia pedidos fora da própria origem; os serviços externos do
//   navegador ficam desligados aqui (sem rede de fundo do Chromium).
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const URL_BASE = `http://127.0.0.1:${PORTA}/`;
const celular = { isMobile: true, hasTouch: true } as const;
// E2E_CHROMIUM = caminho de um Chromium já instalado (quando `npx playwright install` não puder
// baixar o dele). Na CI fica vazio e o Playwright usa o próprio.
const chromiumSemRede = {
  launchOptions: {
    args: ['--disable-background-networking', '--disable-component-update', '--no-pings'],
    ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {}),
  },
};
const iphoneNavegador = process.env.E2E_IPHONE_NAVEGADOR === 'chromium' ? 'chromium' : 'webkit';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: URL_BASE,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: '360x640',
      use: {
        ...devices['Pixel 7'],
        ...celular,
        ...chromiumSemRede,
        browserName: 'chromium',
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: '360x700',
      use: {
        ...devices['Pixel 7'],
        ...celular,
        ...chromiumSemRede,
        browserName: 'chromium',
        viewport: { width: 360, height: 700 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'pixel',
      use: { ...devices['Pixel 7'], ...celular, ...chromiumSemRede, browserName: 'chromium' },
    },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 13'],
        ...celular,
        ...(iphoneNavegador === 'chromium' ? chromiumSemRede : {}),
        browserName: iphoneNavegador,
      },
    },
  ],
  webServer: {
    command: `sh -c "[ -f dist/index.html ] || npm run build; npx vite preview --host 127.0.0.1 --port ${PORTA} --strictPort"`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
