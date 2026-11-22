// Nexus Idle — NX-006 / NX-015 — smoke E2E: o jogo abre sem erro e sem rede externa.
// Dono: nexus-qa. Roda no PR em 360×640 (`npm run test:e2e -- --grep @smoke`).
// Casos: abertura sem erro de página (pré-requisito de CT-504/CT-800) e parte de CT-538 (C9: nenhum
// pedido fora da própria origem). Quando as telas existirem, os smoke de cada história entram aqui
// ou em arquivos próprios com a tag @smoke no nome do teste.
import { expect, test } from '@playwright/test';

test.describe('abertura', () => {
  test('CT-538 abre sem erro e sem pedido de rede externo @smoke', async ({ page, baseURL }) => {
    const origem = new URL(baseURL ?? page.url()).origin;
    const errosDePagina: string[] = [];
    const errosDeConsole: string[] = [];
    const externos: string[] = [];

    page.on('pageerror', (e) => errosDePagina.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errosDeConsole.push(m.text());
    });
    // C9: bloqueia e registra qualquer pedido para outra origem.
    await page.route('**/*', (rota) => {
      const url = rota.request().url();
      if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origem) {
        return rota.continue();
      }
      externos.push(url);
      return rota.abort();
    });

    const resposta = await page.goto('./');
    expect(resposta?.ok(), 'a página inicial responde 2xx').toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    // Dá tempo ao React montar e ao service worker registrar.
    await page.waitForLoadState('networkidle');

    expect(errosDePagina, 'nenhum erro de JavaScript na página').toEqual([]);
    expect(errosDeConsole, 'nenhum erro no console').toEqual([]);
    expect(externos, 'nenhum pedido para fora da própria origem (C9)').toEqual([]);
  });

  test('CT-704 sem rolagem lateral na abertura @smoke', async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    const { largura, larguraJanela } = await page.evaluate(() => ({
      largura: document.documentElement.scrollWidth,
      larguraJanela: window.innerWidth,
    }));
    expect(largura, 'o conteúdo cabe na largura da tela').toBeLessThanOrEqual(larguraJanela);
  });
});
