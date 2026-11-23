// RN-017 v0.3: números na tela. Origem: tools/sim-economia/formato.ts (NX-007), movido na NX-015.
// < 100: 1 casa decimal, sem zero final (0,5 · 10,5 · 11 · 99,9).
// 100 a < 1.000: inteiro.
// 1.000 a < 10¹⁵: 3 algarismos significativos com zeros finais, espaço e unidade (1,00 mil · 999 tri).
// ≥ 10¹⁵: mantissa com 3 algarismos, "e" e expoente (1,00e15).
// Direção: 'baixo' para ouro, renda/s, poder e ganhos; 'cima' para custos e "Faltam X".
// Se o arredondamento para cima passar do limite da faixa, o número vai para a faixa seguinte
// (99,95 → "100"; 999,2 → "1,00 mil"): nenhuma faixa mostra "1.000 mil".
// Tolerância (Convenções v0.3): um valor a menos de 10⁻⁹ (relativo) de um ponto de arredondamento é
// tratado como se estivesse nele (11,4999999… aparece 11,5 como ouro e como custo).
// O espaço entre o número e a unidade é o não quebrável U+00A0 (docs/ux/tokens.md §9.1).

import { TOLERANCIA_DINHEIRO } from './regras.ts';

export type Direcao = 'baixo' | 'cima';

const NBSP = ' ';

const UNIDADES: readonly [number, string][] = [
  [1e12, 'tri'],
  [1e9, 'bi'],
  [1e6, 'mi'],
  [1e3, 'mil'],
];

/** Arredonda x × escala para inteiro na direção pedida, com a tolerância das Convenções. */
function arred(x: number, escala: number, dir: Direcao): number {
  const y = x * escala;
  return dir === 'baixo'
    ? Math.floor(y * (1 + TOLERANCIA_DINHEIRO))
    : Math.ceil(y * (1 - TOLERANCIA_DINHEIRO));
}

const virgula = (s: string) => s.replace('.', ',');

export function formatar(v: number, dir: Direcao = 'baixo'): string {
  if (Number.isNaN(v)) return '?';
  if (v === Infinity) return '∞';
  if (v < 0) return '-' + formatar(-v, dir); // não deveria ocorrer (RN-001)

  if (v < 100) {
    const d = arred(v, 10, dir); // décimos
    if (d >= 1000) return formatar(100, dir);
    return d % 10 === 0 ? String(d / 10) : virgula((d / 10).toFixed(1));
  }
  if (v < 1000) {
    const i = arred(v, 1, dir);
    if (i >= 1000) return formatar(1000, dir);
    return String(i);
  }
  if (v < 1e15) {
    for (const [base, nome] of UNIDADES) {
      if (v < base) continue;
      const x = v / base; // 1 ≤ x < 1000
      const casas = x < 10 ? 2 : x < 100 ? 1 : 0;
      const k = arred(x, 10 ** casas, dir);
      // Passou para a próxima casa (9,995 → 10,0) ou para a próxima unidade (999,5 → 1,00): formata
      // o valor já arredondado, que é exato.
      if (k >= 10 ** 3) return formatar(10 ** (3 - casas) * base, dir);
      return `${virgula((k / 10 ** casas).toFixed(casas))}${NBSP}${nome}`;
    }
  }
  let exp = Math.floor(Math.log10(v));
  let m = v / 10 ** exp;
  if (m >= 10) {
    m /= 10;
    exp++;
  } else if (m < 1) {
    m *= 10;
    exp--;
  }
  const k = arred(m, 100, dir);
  if (k >= 1000) return `1,00e${exp + 1}`;
  return `${virgula((k / 100).toFixed(2))}e${exp}`;
}

/**
 * Multiplicador (docs/ux/tokens.md §9.2): "×" + até 2 casas, sem zeros finais (×2 · ×2,25 · ×11,25).
 * Arredonda para baixo, com a tolerância das Convenções, como os outros números de ganho.
 */
export function formatarMultiplicador(x: number): string {
  const c = Math.floor(x * 100 * (1 + TOLERANCIA_DINHEIRO));
  const s = (c / 100).toFixed(2).replace(/\.?0+$/, '');
  return `×${virgula(s)}`;
}

/**
 * Tempo até a próxima partida (docs/ux/tokens.md §9.2, tipo `tempo`): "m:ss". O que falta é
 * arredondado para cima (1:29,2 → "1:30"), como todo "faltam".
 */
export function formatarRelogio(segundos: number): string {
  const s = Math.max(0, Math.ceil(segundos * (1 - TOLERANCIA_DINHEIRO)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * RN-017: porcentagem inteira, arredondada ao mais próximo (0,7685 → "77%"); empate exato em ,5 vai
 * para cima. A tolerância das Convenções evita que 0,285 (28,4999… em float) caia para 28%.
 */
export const pctInteiro = (p: number) => Math.floor(p * 100 * (1 + TOLERANCIA_DINHEIRO) + 0.5);

export const formatarPct = (p: number) => `${pctInteiro(p)}%`;
