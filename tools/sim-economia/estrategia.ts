// Comportamento do jogador simulado. NÃO é regra de negócio: é o "bot" que joga.
// Porte fiel da estratégia de `docs/produto/modelo-economia-v0.1.py` (método `compra` e critério de
// prestígio), para que a comparação com a tabela das RN meça as regras e não o jeito de jogar.

import {
  DIVISOES,
  DIV_TOPO,
  GERADORES,
  MARCO_GERADOR,
  type Estado,
  type Regras,
  comprarGeradores,
  custoGerador,
  custoNivel,
  legadoDoPrestigio,
  poderTime,
  pVitoria,
  subirNivel,
} from './motor.ts';

/** Chance-alvo de vitória que o bot persegue antes de investir em renda (modelo do PO). */
const ALVO_P = 0.78;

/** Toques por segundo: o modelo do PO toca 5×/s só nos primeiros 10 min de jogo. */
export const toquesNoInstante = (tJogo: number) => (tJogo < 600 ? 5 : 0);

/** Compra até não dar mais, com a mesma prioridade do modelo do PO. */
export function comprar(e: Estado): Estado {
  let m = e;
  for (;;) {
    const precisa = pVitoria(poderTime(m), DIVISOES[m.div].rival) < ALVO_P && m.div < DIV_TOPO;
    let j = 0;
    for (let k = 1; k < m.niveis.length; k++) if (custoNivel(m, k) < custoNivel(m, j)) j = k;
    let i = 0;
    let melhor = -1;
    for (let k = 0; k < GERADORES.length; k++) {
      const n = m.geradores[k];
      const r = (GERADORES[k].rendaBase * 2 ** Math.floor(n / MARCO_GERADOR)) / custoGerador(m, k);
      if (r > melhor) {
        melhor = r;
        i = k;
      }
    }
    const cj = custoNivel(m, j);
    const cg = custoGerador(m, i);
    if (precisa && m.ouro >= cj) {
      m = subirNivel(m, j) as Estado;
      continue;
    }
    // O modelo compara com a divisão seguinte limitada à Internacional (índice 4).
    const proxima = DIVISOES[Math.min(m.div + 1, 4)].rival;
    if (!precisa && cj < cg && m.ouro >= cj && pVitoria(poderTime(m), proxima) < ALVO_P) {
      m = subirNivel(m, j) as Estado;
      continue;
    }
    if (m.ouro >= cg && !(precisa && cj < cg * 3)) {
      m = comprarGeradores(m, i, 1) as Estado;
      continue;
    }
    return m;
  }
}

/**
 * 'modelo' = critério do modelo do PO: melhor divisão da run ≥ Academy, 3 temporadas seguidas sem
 * divisão inédita na run e fora do Mundial. 'farm' = refunda na primeira chance (testa se "repetir a
 * Academy compensa", risco 1). Em todos os casos só refunda se ganhar Legado > 0.
 */
export type Modo = 'modelo' | 'farm';
export function querPrestigiar(
  e: Estado,
  temporadasSemSubir: number,
  regras: Regras,
  modo: Modo = 'modelo',
): boolean {
  if (modo === 'farm') return e.melhorDivRun >= 2 && legadoDoPrestigio(e, regras) > 0;
  return (
    e.melhorDivRun >= 2 &&
    temporadasSemSubir >= 3 &&
    e.div < DIV_TOPO &&
    legadoDoPrestigio(e, regras) > 0
  );
}
