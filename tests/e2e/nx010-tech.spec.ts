// NX-010 (nexus-tech): E2E da T02 "Clube" e da T03 "Negócios" no build do jogador (dist/).
// A suíte de regressão da história é do nexus-qa (tests/e2e/negocios.spec.ts); esta confere o que o
// tech entregou: Gherkin da NX-010, ids dos wireframes, selo "Novo", anúncio, marco e migração v1.
// Estados de partida são gravados no localStorage antes de o jogo abrir, com o mesmo formato do
// save (src/save/envelope.ts), então nenhum atalho de debug é usado.
import type { Page } from '@playwright/test';
import { type Estado, novoEstado } from '../../src/engine/motor.ts';
import { fnv1a } from '../../src/save/checksum.ts';
import { APP_ID, serializar } from '../../src/save/envelope.ts';
import { CHAVES } from '../../src/save/gerenciador.ts';
import { expect, test } from './rede.ts';

const AULAS = 'negocio-aulas-na-lan';
const PATROCINIO = 'negocio-patrocinio-local';

/** Abre o jogo com um save já gravado (`agoraS` = relógio de parede do teste, em s). */
async function abrirCom(page: Page, parcial: Partial<Estado>, agoraS = Date.now() / 1000) {
  const estado: Estado = { ...novoEstado(5, agoraS), ...parcial };
  const texto = serializar(estado, 1, agoraS * 1000);
  await page.addInitScript(
    ([chave, valor]) => {
      if (!sessionStorage.getItem('nx010-semeado')) {
        sessionStorage.setItem('nx010-semeado', '1');
        localStorage.setItem(chave, valor);
      }
    },
    [CHAVES.A, texto] as const,
  );
  await page.goto('./');
  await expect(page.getByTestId('principal-tela')).toBeVisible();
}

test('CT-070 comprar o primeiro negócio: ouro 0, renda +0,5/s e próximo custo 11,5 @smoke', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByTestId('ouro')).toHaveText('10');
  await expect(page.getByTestId('renda')).toHaveText('+0/s');
  await expect(page.getByTestId('por-toque')).toHaveText('1');
  await expect(page.getByTestId('proxima-compra-nome')).toHaveText('Aulas na lan');
  await expect(page.getByTestId('proxima-compra-custo')).toHaveText('10');
  await page.getByTestId('proxima-compra-comprar').tap();
  await expect(page.getByTestId('ouro')).toHaveText('0');
  await expect(page.getByTestId('renda')).toHaveText('+0,5/s');
  await expect(page.getByTestId('proxima-compra-faltam')).toHaveText('11,5');
  await expect(page.getByTestId('proxima-compra-comprar')).toHaveAttribute('aria-disabled', 'true');
});

test('CT-043 / CT-044 toque limitado: 8 toques no mesmo segundo com renda 100/s dão 50, sem aviso @smoke', async ({
  page,
}) => {
  const agora = 1_900_000_000;
  await page.clock.install({ time: agora * 1000 });
  // Renda exata de 100/s: Aulas 8 (4) + Patrocínio 6 (36) + Camisa 1 (60).
  await abrirCom(
    page,
    {
      ouro: 0,
      negocios: [8, 6, 1, 0, 0, 0],
      visiveis: [true, true, true, false, false, false],
      negociosVistos: [true, true, true, false, false, false],
      ouroRun: 2000,
      ouroTotal: 2000,
    },
    agora,
  );
  await page.clock.pauseAt((agora + 5) * 1000); // relógio parado: a renda não entra no meio
  await expect(page.getByTestId('renda')).toHaveText('+100/s');
  await expect(page.getByTestId('por-toque')).toHaveText('10');
  const antes = Number((await page.getByTestId('ouro').textContent())!.replace(',', '.'));
  for (let k = 0; k < 8; k++) await page.getByTestId('botao-toque').tap();
  await expect(page.getByTestId('ouro')).toHaveText(String(antes + 50));
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('CT-056 / CT-072 Máx sem ouro suficiente: desabilitado e mostra quanto falta @smoke', async ({
  page,
}) => {
  await abrirCom(page, { ouro: 5 });
  await page.getByTestId('aba-negocios').tap();
  await page.getByTestId('lote-max').tap();
  await expect(page.getByTestId('lote-max')).toHaveAttribute('aria-pressed', 'true');
  const botao = page.getByTestId(`${AULAS}-comprar`);
  await expect(botao).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId(`${AULAS}-faltam`)).toHaveText('5');
  await botao.tap({ force: true });
  await expect(page.getByTestId(`${AULAS}-quantidade`)).toHaveText('0');
});

test('CT-058 ×10 sem ouro para 10: "Faltam 53,1" e "Máx compraria 8"; ×1 e Máx habilitados', async ({
  page,
}) => {
  await abrirCom(page, { ouro: 150 });
  await page.getByTestId('aba-negocios').tap();
  await page.getByTestId('lote-x10').tap();
  await expect(page.getByTestId(`${AULAS}-comprar`)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId(`${AULAS}-faltam`)).toHaveText('53,1');
  await expect(page.getByTestId(`${AULAS}-max-compraria`)).toHaveText('8');
  await page.getByTestId('lote-max').tap();
  await expect(page.getByTestId(`${AULAS}-max-k`)).toHaveText('8');
  await expect(page.getByTestId(`${AULAS}-custo`)).toHaveText('138'); // 137,27 para cima
  await page.getByTestId('lote-x1').tap();
  await expect(page.getByTestId(`${AULAS}-custo`)).toHaveText('10');
  await page.getByTestId(`${AULAS}-comprar`).tap();
  await expect(page.getByTestId(`${AULAS}-quantidade`)).toHaveText('1');
  await expect(page.getByTestId('ouro')).toHaveText('140');
});

test('CT-025 clube novo: a aba Negócios só mostra "Aulas na lan"', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId('negocios-tela')).toBeVisible();
  await expect(page.locator('[data-testid^="negocio-"][data-testid$="-comprar"]')).toHaveCount(1);
  await expect(page.getByTestId(`${AULAS}-marco`)).toHaveText('0/50 · faltam 50 para ×2');
  await expect(page.getByTestId('negocios-mais')).toBeVisible();
  await expect(page.getByTestId('lote-x1')).toHaveAttribute('aria-pressed', 'true');
});

test('RN-003 negócio novo: anúncio do Renatão, ponto na aba e selo "Novo" até abrir a aba', async ({
  page,
}) => {
  await abrirCom(page, { ouroRun: 74.5, ouroTotal: 74.5 });
  await expect(page.getByTestId('aba-negocios-novo')).toHaveCount(0);
  await page.getByTestId('botao-toque').tap(); // +1 → ouro ganho na run 75,5
  await expect(page.getByTestId('anuncio-negocio')).toContainText('padaria');
  await expect(page.getByTestId('aba-negocios-novo')).toBeVisible();
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId(`${PATROCINIO}-novo`)).toBeVisible();
  await expect(page.getByTestId(`${PATROCINIO}-faltam`)).toBeVisible();
  await page.getByTestId('aba-clube').tap();
  await expect(page.getByTestId('aba-negocios-novo')).toHaveCount(0);
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId(`${PATROCINIO}-novo`)).toHaveCount(0);
  await expect(page.getByTestId('anuncio-negocio')).toHaveCount(0, { timeout: 5_000 });
});

test('BUG-001 o anúncio não cobre o botão do 1º negócio na T03 e fecha com um toque', async ({
  page,
}) => {
  const agora = 1_900_000_000;
  await page.clock.install({ time: agora * 1000 });
  await abrirCom(page, { ouro: 20, ouroRun: 74.5, ouroTotal: 74.5 }, agora);
  await page.clock.pauseAt((agora + 5) * 1000); // parado: o aviso não some sozinho
  await page.getByTestId('botao-toque').tap();
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId('anuncio-negocio')).toBeVisible();
  await page.getByTestId(`${AULAS}-comprar`).tap();
  await expect(page.getByTestId(`${AULAS}-quantidade`)).toHaveText('1');
  await page.getByTestId('anuncio-negocio').tap();
  await expect(page.getByTestId('anuncio-negocio')).toHaveCount(0);
});

test('CT-032 marco de 50: "dobrou!", barra recomeça e a renda dobra', async ({ page }) => {
  await abrirCom(page, { ouro: 1e6, negocios: [49, 0, 0, 0, 0, 0] });
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId(`${AULAS}-marco-faltam`)).toHaveText('1');
  await expect(page.getByTestId(`${AULAS}-renda`)).toHaveText('24,5');
  await page.getByTestId(`${AULAS}-comprar`).tap();
  await expect(page.getByTestId(`${AULAS}-marco`)).toHaveText('0/50 · faltam 50 para ×2');
  await expect(page.getByTestId(`${AULAS}-renda`)).toHaveText('50');
  await expect(page.getByTestId(`${AULAS}-dobrou`)).toBeVisible();
  await expect(page.getByTestId(`${AULAS}-dobrou`)).toHaveCount(0, { timeout: 5_000 });
});

test('UX-02 / ADR-003 T02 sem rolar: os 7 elementos na tela e o chibi fora do alvo de toque', async ({
  page,
}) => {
  await page.goto('./');
  const alto = page.viewportSize()!.height;
  for (const id of [
    'ouro',
    'renda',
    'botao-toque',
    'proxima-compra',
    'divisao',
    'placar',
    'chance',
  ]) {
    const caixa = (await page.getByTestId(id).boundingBox())!;
    expect(caixa.y, id).toBeGreaterThanOrEqual(0);
    expect(caixa.y + caixa.height, id).toBeLessThanOrEqual(alto);
  }
  await expect(page.getByTestId('abas')).toBeInViewport({ ratio: 1 });
  const chibi = (await page.getByTestId('chibi-destaque').boundingBox())!;
  const botao = (await page.getByTestId('botao-toque').boundingBox())!;
  expect(chibi.x + chibi.width).toBeLessThanOrEqual(botao.x);
  await expect(page.getByTestId('chibi-destaque')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByTestId('botao-toque')).toHaveAccessibleName('Fazer live, ganha 1 de ouro');
});

test('Reduzir animações: o toque credita, mas sem "+X" subindo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByTestId('botao-toque').tap();
  await expect(page.getByTestId('ouro')).toHaveText('11');
  await expect(page.getByTestId('toque-ganho')).toHaveCount(0);
});

test('Elenco e Jornada ainda não abrem (NX-011/NX-014): a T02 continua', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('aba-elenco')).toHaveAttribute('aria-disabled', 'true');
  await page.getByTestId('aba-elenco').tap({ force: true });
  await expect(page.getByTestId('principal-tela')).toBeVisible();
});

test('CT-510 save v1 (NX-015) abre na v2 sem selo "Novo" nos negócios já visíveis', async ({
  page,
}) => {
  const agoraS = Date.now() / 1000;
  const { negociosVistos: _, ...v1 } = {
    ...novoEstado(5, agoraS),
    ouro: 40,
    ouroRun: 100,
    ouroTotal: 100,
    negocios: [4, 0, 0, 0, 0, 0],
    visiveis: [true, true, false, false, false, false],
  };
  const corpo = { app: APP_ID, saveVersion: 1, seq: 3, salvoEm: agoraS * 1000, estado: v1 };
  const texto = JSON.stringify({ ...corpo, checksum: fnv1a(JSON.stringify(corpo)) });
  await page.addInitScript(
    ([chave, valor]) => {
      if (!sessionStorage.getItem('nx010-v1')) {
        sessionStorage.setItem('nx010-v1', '1');
        localStorage.setItem(chave, valor);
      }
    },
    [CHAVES.A, texto] as const,
  );
  await page.goto('./');
  await expect(page.getByTestId('principal-tela')).toBeVisible();
  await expect(page.getByTestId('aba-negocios-novo')).toHaveCount(0);
  await page.getByTestId('aba-negocios').tap();
  await expect(page.getByTestId(`${PATROCINIO}-comprar`)).toBeVisible();
  await expect(page.getByTestId(`${PATROCINIO}-novo`)).toHaveCount(0);
  await expect(page.getByTestId(`${AULAS}-quantidade`)).toHaveText('4');
});
