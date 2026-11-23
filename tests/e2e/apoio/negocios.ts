// Nexus Idle — apoio dos E2E da NX-010 (negócios, toque, lote, visibilidade, marcos). Dono: nexus-qa.
//
// Tudo o que o spec sabe da tela está aqui: se um data-testid mudar, muda só este arquivo.
// - Os nomes de bloco vêm dos wireframes do UX (docs/ux/wireframes/T02-principal.html e
//   T03-negocios.html): `ouro`, `renda`, `botao-toque`, `proxima-compra`, `abas`, `lote`.
// - Os wireframes não dão nome aos botões e números de cada negócio, às abas nem aos botões do lote.
//   Para esses, o spec usa os nomes do pedido QA-31 (formato `area-elemento` do ADR-002, os mesmos
//   que a NX-015 já usa: `negocio-<id>-comprar`, `-custo`, `-faltam`, `-quantidade`), conferidos
//   com o código da NX-010 em andamento (22/11): `aba-<id>`, `lote-x1|x10|max`, `-marco-faltam`.
//
// Estados prontos: em vez do build de teste (`?acelerar=N`, que o playwright.config.ts não serve),
// o spec monta o save. Abre um clube novo, lê o save que o próprio jogo gravou, muda só os campos
// do cenário, refaz o checksum FNV-1a do ADR-002 e grava nas duas cópias antes de o jogo carregar.
// Campos novos que o tech criar vêm junto, porque a base é sempre o save do próprio jogo.
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { NEGOCIOS } from '../../../src/engine/regras.ts';
import { expect } from '../rede.ts';

export const AULAS = NEGOCIOS[0].id; // "Aulas na lan"
export const PATROCINIO = NEGOCIOS[1].id; // "Patrocínio local"
export const IDS = NEGOCIOS.map((n) => n.id);

/** data-testid usados pelo spec. Os marcados com QA-31 não estão nos wireframes. */
export const TID = {
  // T02 (wireframe)
  ouro: 'ouro', // bloco do ouro; o 1º número dele é o ouro
  renda: 'renda', // "+0,5/s"
  botaoToque: 'botao-toque', // "Fazer live"
  proximaCompra: 'proxima-compra',
  abas: 'abas',
  // T03 (wireframe)
  lote: 'lote',
  // QA-31
  abaClube: 'aba-clube',
  abaNegocios: 'aba-negocios',
  lote1: 'lote-x1',
  lote10: 'lote-x10',
  loteMax: 'lote-max',
  negocio: (id: string) => `negocio-${id}`, // cartão do negócio na T03
  comprar: (id: string) => `negocio-${id}-comprar`, // botão do cartão (compra no lote escolhido)
  custo: (id: string) => `negocio-${id}-custo`, // custo do lote, para cima (só com o botão habilitado)
  faltam: (id: string) => `negocio-${id}-faltam`, // "Faltam X", para cima (só com o botão desabilitado)
  quantidade: (id: string) => `negocio-${id}-quantidade`,
  marcoFaltam: (id: string) => `negocio-${id}-marco-faltam`, // "faltam 13 para ×2": só o 13
  anuncio: 'anuncio-negocio', // fala do Renatão quando um negócio aparece (3 s; tocar fecha)
} as const;

const SLOT_A = 'nexus-idle:save:A';
const SLOT_B = 'nexus-idle:save:B';

// ---------- Números da RN-017 ----------

/** Um número como a RN-017 escreve: "0", "11,5", "1,23 mil", "9,40 tri", "1,00e15". */
const NUMERO = /\d+(?:,\d+)?(?:e\d+)?(?:[\s ](?:mil|mi|bi|tri)\b)?/;

/** O 1º número escrito no elemento (sem o "+" e o "/s"), com espaço normal. */
export async function numeroEm(loc: Locator): Promise<string | null> {
  const texto = (await loc.innerText()).replace(/ /g, ' ');
  return NUMERO.exec(texto)?.[0] ?? null;
}

/** "56,5" → 56,5; "1,23 mil" → 1230. Só para comparar faixas (o valor exato vem do texto). */
export function paraNumero(texto: string): number {
  const m = /^(\d+(?:,\d+)?)(?:e(\d+))?(?: (mil|mi|bi|tri))?$/.exec(texto);
  if (!m) throw new Error(`não é um número da RN-017: "${texto}"`);
  const fator = { mil: 1e3, mi: 1e6, bi: 1e9, tri: 1e12 }[m[3] ?? ''] ?? 1;
  return Number(m[1].replace(',', '.')) * 10 ** Number(m[2] ?? 0) * fator;
}

/** Espera o 1º número do elemento ficar igual a `esperado` (com repetição, como os toHave*). */
export async function esperarNumero(loc: Locator, esperado: string, msg?: string) {
  await expect.poll(() => numeroEm(loc), { message: msg }).toBe(esperado);
}

// ---------- Botões ----------

/** Desabilitado = `disabled` ou `aria-disabled="true"` (a NX-015 usa o segundo). */
export async function desabilitado(loc: Locator): Promise<boolean> {
  return (await loc.isDisabled()) || (await loc.getAttribute('aria-disabled')) === 'true';
}

export async function esperarDesabilitado(loc: Locator, sim: boolean) {
  await expect.poll(() => desabilitado(loc)).toBe(sim);
}

// ---------- Relógio falso ----------

/**
 * Com o relógio do Playwright parado e renda > 0: anda de 25 em 25 ms até o ouro mudar, ou seja,
 * até logo depois de um tique do loop de 1 s (a renda online entra no tique). Depois disso há
 * ~975 ms sem tique, o que isola a renda passiva dos toques.
 */
export async function alinharNoTique(page: Page, ouro: Locator) {
  await page.waitForTimeout(300); // tempo real: a tela redesenha com o relógio parado
  const inicial = await numeroEm(ouro);
  for (let i = 0; i < 60; i++) {
    await page.clock.runFor(25);
    if ((await numeroEm(ouro)) !== inicial) return;
  }
  throw new Error('o ouro não mudou em 1,5 s de relógio: a renda é 0 ou o loop de 1 s mudou');
}

// ---------- Navegação ----------

export async function irParaNegocios(page: Page) {
  await page.getByTestId(TID.abaNegocios).tap();
  await expect(page.getByTestId(TID.lote)).toBeVisible();
}

export async function irParaClube(page: Page) {
  await page.getByTestId(TID.abaClube).tap();
  await expect(page.getByTestId(TID.botaoToque)).toBeVisible();
}

/**
 * Espera a fala do Renatão sumir sozinha (3 s, fluxo NX-010). Só com o relógio andando. Usado
 * antes de tocar no 1º negócio da T03, que a fala cobria no build de 22/11 (BUG-001).
 */
export async function esperarAnuncioSumir(page: Page) {
  await expect(page.getByTestId(TID.anuncio)).toHaveCount(0, { timeout: 10_000 });
}

export async function escolherLote(page: Page, lote: '1' | '10' | 'max') {
  const botao = page.getByTestId(
    lote === '1' ? TID.lote1 : lote === '10' ? TID.lote10 : TID.loteMax,
  );
  await botao.tap();
  await expect(botao).toHaveAttribute('aria-pressed', 'true');
}

// ---------- Save ----------

/** FNV-1a de 32 bits sobre os bytes UTF-8 (ADR-002). Implementação do QA, pela especificação. */
export function fnv1a(texto: string): string {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(texto)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

type Envelope = {
  app: string;
  saveVersion: number;
  seq: number;
  salvoEm: number;
  estado: Record<string, unknown>;
  checksum: string;
};

/** Envelope `{ app, saveVersion, seq, salvoEm, estado, checksum }` do ADR-002. */
function envelope(base: Envelope, estado: Record<string, unknown>, seq: number): string {
  const { app, saveVersion } = base;
  const salvoEm = Date.now();
  const checksum = fnv1a(JSON.stringify({ app, saveVersion, seq, salvoEm, estado }));
  return JSON.stringify({ app, saveVersion, seq, salvoEm, estado, checksum });
}

/** Lê a cópia válida mais nova do save desta página. */
export async function lerSave(page: Page): Promise<Envelope> {
  const textos = await page.evaluate(
    ([a, b]) => [localStorage.getItem(a), localStorage.getItem(b)],
    [SLOT_A, SLOT_B],
  );
  const copias = textos
    .filter((t): t is string => !!t)
    .map((t) => {
      try {
        return JSON.parse(t) as Envelope;
      } catch {
        return null;
      }
    })
    .filter((e): e is Envelope => !!e && typeof e.seq === 'number');
  expect(copias.length, 'o jogo gravou pelo menos uma cópia do save').toBeGreaterThan(0);
  return copias.reduce((m, e) => (e.seq > m.seq ? e : m));
}

/**
 * Clube novo de verdade (sem montar save), com o relógio do Playwright parado desde antes de o
 * jogo carregar: nenhuma renda entra entre um passo e outro, por mais lento que seja o aparelho.
 */
export async function abrirClubeNovoParado(page: Page) {
  const agoraMs = Date.now();
  await page.clock.install({ time: agoraMs });
  await page.clock.pauseAt(agoraMs);
  await page.goto('./');
  await expect(page.getByTestId(TID.botaoToque)).toBeVisible();
}

/** Campos do estado que os cenários mudam (o resto vem do clube novo do próprio jogo). */
export type Cenario = {
  ouro?: number;
  negocios?: number[];
  /** Ouro ganho na run (RN-003, sem os 10 iniciais). `ouroTotal` sobe junto se precisar. */
  ouroRun?: number;
  /** Se omitido: cada negócio fica visível se o `ouroRun` já passou de 50% do custo base. */
  visiveis?: boolean[];
};

export type OpcoesAbrir = {
  /**
   * Relógio falso do Playwright, instalado antes de o jogo carregar. `true`: anda sozinho até o
   * teste parar (toques). `'parado'`: parado desde a abertura, no mesmo instante do `maior` do save
   * (sem renda online nem offline: o ouro fica exatamente o do cenário).
   */
  relogio?: boolean | 'parado';
  /** Registra chamadas a navigator.vibrate em window.__qaVibrou (CT-044). */
  espiarVibracao?: boolean;
};

/**
 * Abre o jogo numa página nova com o estado do cenário. Fecha as outras páginas do contexto
 * antes, para nenhuma gravar por cima no pagehide. Recarregar a página devolvida NÃO monta de
 * novo: o jogo lê o próprio save (é o que os testes de persistência precisam).
 */
export async function abrirCom(
  context: BrowserContext,
  cenario: Cenario,
  opcoes: OpcoesAbrir = {},
): Promise<Page> {
  // 1. Clube novo: o próprio jogo grava o save de base.
  const base = await context.newPage();
  await base.goto('./');
  await base.waitForFunction(
    ([a, b]) => !!(localStorage.getItem(a) || localStorage.getItem(b)),
    [SLOT_A, SLOT_B],
  );
  const env = await lerSave(base);
  for (const p of context.pages()) await p.close();

  // 2. Só os campos do cenário mudam.
  const e = structuredClone(env.estado);
  if (cenario.ouro !== undefined) e.ouro = cenario.ouro;
  if (cenario.negocios) e.negocios = cenario.negocios;
  if (cenario.ouroRun !== undefined) {
    e.ouroRun = cenario.ouroRun;
    e.ouroTotal = Math.max(Number(e.ouroTotal), cenario.ouroRun);
  }
  e.visiveis =
    cenario.visiveis ??
    NEGOCIOS.map(
      (n, i) =>
        i === 0 || (e.negocios as number[])[i] > 0 || Number(e.ouroRun) >= n.custoBase * 0.5,
    );
  const agoraMs = Date.now();
  e.maior = agoraMs / 1000; // RN-012: sem "tempo fora" entre a montagem e a abertura
  e.toques = [];

  // 3. Grava as duas cópias antes de qualquer script do jogo, só na 1ª carga da aba.
  const seq = env.seq + 1000;
  const a = envelope(env, e, seq);
  const b = envelope(env, e, seq - 1);
  const page = await context.newPage();
  if (opcoes.relogio === 'parado') {
    await page.clock.install({ time: agoraMs });
    await page.clock.pauseAt(agoraMs);
  } else if (opcoes.relogio) {
    await page.clock.install();
  }
  await page.addInitScript(
    ({ slotA, slotB, a, b, espiar }) => {
      if (espiar) {
        const w = window as unknown as { __qaVibrou: unknown[] };
        w.__qaVibrou = [];
        Object.defineProperty(navigator, 'vibrate', {
          configurable: true,
          value: (...args: unknown[]) => (w.__qaVibrou.push(args), true),
        });
      }
      if (sessionStorage.getItem('qa-save-montado')) return;
      sessionStorage.setItem('qa-save-montado', '1');
      localStorage.setItem(slotA, a);
      localStorage.setItem(slotB, b);
    },
    { slotA: SLOT_A, slotB: SLOT_B, a, b, espiar: !!opcoes.espiarVibracao },
  );
  await page.goto('./');
  await expect(page.getByTestId(TID.botaoToque), 'o save montado abriu no jogo').toBeVisible();
  return page;
}
