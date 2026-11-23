// NX-015 (nexus-tech): E2E mínimo do save. As suítes completas de regressão são do nexus-qa.
// - @smoke: toca "Fazer live", recarrega e confere que o ouro persistiu (save ao sair, RN-015).
// - Compra salva na hora (CT-501/CT-504), cópia corrompida (CT-506) e nenhuma válida (CT-507).
// - C3: o build do jogador ignora ?acelerar e não tem console de debug.
import type { BrowserContext } from '@playwright/test';
import { expect, test } from './rede.ts';

// NX-010: ids da T02 iguais aos do wireframe (docs/ux/wireframes/T02-principal.html).
const ouro = '[data-testid="ouro"]';

// Cada teste tem um contexto novo (localStorage vazio): o jogo abre um clube novo.
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('principal-tela')).toBeVisible();
});

/**
 * Abre o jogo numa página nova, rodando `antes` antes de qualquer script do jogo (para estragar o
 * save sem que a página antiga grave por cima no pagehide).
 */
async function abrirCom(context: BrowserContext, antes: () => void) {
  for (const p of context.pages()) await p.close();
  const nova = await context.newPage();
  await nova.addInitScript(antes);
  await nova.goto('./');
  return nova;
}

test('NX-015 toca "Fazer live", recarrega e o ouro continua @smoke', async ({ page }) => {
  await expect(page.locator(ouro)).toHaveText('10');
  await page.getByTestId('botao-toque').tap();
  await expect(page.locator(ouro)).toHaveText('11'); // toque = max(1, 0,1 × 0) = 1 (RN-005)
  await page.reload();
  await expect(page.getByTestId('principal-tela')).toBeVisible();
  await expect(page.locator(ouro)).toHaveText('11');
});

test('CT-504 compra salva na hora e continua depois de reabrir', async ({ page, context }) => {
  await page.getByTestId('proxima-compra-comprar').tap();
  await expect(page.getByTestId('proxima-compra-quantidade')).toHaveText('1');
  await expect(page.locator(ouro)).toHaveText('0');
  await expect(page.getByTestId('renda')).toHaveText('+0,5/s');
  // O save já está gravado antes de qualquer evento de saída (CT-501).
  const saves = await page.evaluate(() => [
    localStorage.getItem('nexus-idle:save:A') ?? '',
    localStorage.getItem('nexus-idle:save:B') ?? '',
  ]);
  expect(saves.some((s) => s.includes('"negocios":[1,'))).toBe(true);
  // "Encerrado à força": abre uma página nova no mesmo contexto, sem depender do pagehide.
  const nova = await context.newPage();
  await nova.goto('./');
  await expect(nova.getByTestId('proxima-compra-quantidade')).toHaveText('1');
});

test('CT-506 cópia mais nova corrompida: carrega a outra e avisa antes de tudo', async ({
  page,
  context,
}) => {
  await page.getByTestId('proxima-compra-comprar').tap();
  const nova = await abrirCom(context, () => {
    // Trunca a cópia de maior seq (a mais nova), como numa gravação interrompida.
    const seq = (k: string) => Number(/"seq":(\d+)/.exec(localStorage.getItem(k) ?? '')?.[1] ?? -1);
    const k = seq('nexus-idle:save:A') > seq('nexus-idle:save:B') ? 'A' : 'B';
    const v = localStorage.getItem(`nexus-idle:save:${k}`)!;
    localStorage.setItem(`nexus-idle:save:${k}`, v.slice(0, v.length / 2));
  });
  await expect(nova.getByTestId('save-recuperado')).toBeVisible();
  await expect(nova.getByTestId('principal-tela')).toHaveCount(0);
  await nova.getByTestId('save-recuperado-continuar').tap();
  await expect(nova.getByTestId('proxima-compra-quantidade')).toHaveText('1');
});

test('CT-507 nenhuma cópia válida: tentar de novo ou começar clube novo com confirmação', async ({
  context,
}) => {
  const page = await abrirCom(context, () => {
    if (sessionStorage.getItem('estragado')) return;
    sessionStorage.setItem('estragado', '1');
    localStorage.setItem('nexus-idle:save:A', '{"app":"nexus-idle"');
    localStorage.setItem('nexus-idle:save:B', 'lixo');
  });
  await expect(page.getByTestId('save-ilegivel')).toBeVisible();
  await page.getByTestId('save-ilegivel-tentar').tap();
  await expect(page.getByTestId('save-ilegivel-tentativa')).toHaveText('2');
  await page.getByTestId('save-ilegivel-exportar').tap();
  await expect(page.getByTestId('save-ilegivel-texto')).toHaveValue(/lixo/);
  await page.getByTestId('save-ilegivel-novo').tap();
  await page.getByTestId('save-novo-cancelar').tap();
  await expect(page.getByTestId('save-ilegivel')).toBeVisible();
  await page.getByTestId('save-ilegivel-novo').tap();
  await page.getByTestId('save-novo-confirmar').tap();
  await expect(page.locator(ouro)).toHaveText('10');
  const guardado = await page.evaluate(() => localStorage.getItem('nexus-idle:save:ilegivel'));
  expect(guardado).toContain('lixo');
});

test('C3 o build do jogador não tem debug nem tempo acelerado', async ({ page }) => {
  await page.goto('./?acelerar=100');
  await expect(page.getByTestId('principal-tela')).toBeVisible();
  expect(await page.evaluate(() => '__nexusDebug' in window)).toBe(false);
  await page.waitForTimeout(2_500);
  await page.reload(); // salva no pagehide
  await expect(page.getByTestId('principal-tela')).toBeVisible();
  // Com ×100, 2,5 s seriam 250 s de jogo: 2 partidas. No build do jogador, nenhuma.
  const estado = await page.evaluate(() => {
    const ler = (k: string) => JSON.parse(localStorage.getItem(k) ?? '{"seq":-1}');
    const [a, b] = [ler('nexus-idle:save:A'), ler('nexus-idle:save:B')];
    return (a.seq > b.seq ? a : b).estado;
  });
  expect(estado.vitorias + estado.derrotas).toBe(0);
  expect(estado.proxPartida).toBeGreaterThan(80);
});
