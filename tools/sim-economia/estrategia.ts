// Comportamento do jogador simulado. NÃO é regra de negócio: é o "bot" que joga.
// Porte fiel da estratégia de `docs/produto/modelo-economia-v0.1.py` (método `compra` e critério de
// refundação), para que a comparação com a tabela das RN meça as regras e não o jeito de jogar.
// NX-008: o bot só considera negócios visíveis (RN-003 v0.2) e compara dinheiro com a tolerância
// das Convenções (via `podePagar`). NX-015: importa o motor de src/engine/ (o mesmo do jogo).

import { DIVISOES, DIV_TOPO, MARCO_NEGOCIO, NEGOCIOS } from '../../src/engine/regras.ts';
import {
  type Estado,
  comprarNegocios,
  custoNegocio,
  custoNivel,
  legadoDaRefundacao,
  negocioVisivel,
  podePagar,
  poderTime,
  pVitoria,
  subirNivel,
} from '../../src/engine/motor.ts';

/** Chance-alvo de vitória que o bot persegue antes de investir em renda (modelo do PO). */
const ALVO_P = 0.78;

/** Toques por segundo: o modelo do PO toca 5×/s só nos primeiros 10 min de jogo. */
export const toquesNoInstante = (tJogo: number) => (tJogo < 600 ? 5 : 0);

/**
 * 'modelo' = critério do modelo do PO: melhor divisão da run ≥ Ascensão, 3 splits seguidos sem
 * divisão inédita na run e fora do Mundial. 'farm' = refunda na primeira chance.
 * 'titulo' = igual ao 'modelo', mas também persegue poder no Mundial (o modelo do PO para de subir
 * níveis na Continental e, no Mundial, joga com p = 5%: nunca ganha o título). NX-008.
 */
export type Modo = 'modelo' | 'farm' | 'titulo';

/**
 * Compra até não dar mais, com a mesma prioridade do modelo do PO. `veTudo` = o bot também
 * considera negócios ainda invisíveis (como na NX-007); serve só para medir o efeito da RN-003.
 */
export function comprar(e: Estado, veTudo = false, modo: Modo = 'modelo'): Estado {
  let m = e;
  const topoAlvo = modo === 'titulo' ? DIV_TOPO : 4;
  for (;;) {
    const precisa =
      pVitoria(poderTime(m), DIVISOES[m.div].rival) < ALVO_P &&
      (m.div < DIV_TOPO || modo === 'titulo');
    let j = 0;
    for (let k = 1; k < m.niveis.length; k++) if (custoNivel(m, k) < custoNivel(m, j)) j = k;
    let i = 0;
    let melhor = -1;
    for (let k = 0; k < NEGOCIOS.length; k++) {
      if (!veTudo && !negocioVisivel(m, k)) continue;
      const n = m.negocios[k];
      const r = (NEGOCIOS[k].rendaBase * 2 ** Math.floor(n / MARCO_NEGOCIO)) / custoNegocio(m, k);
      if (r > melhor) {
        melhor = r;
        i = k;
      }
    }
    const cj = custoNivel(m, j);
    const cg = custoNegocio(m, i);
    if (precisa && podePagar(m.ouro, cj)) {
      m = subirNivel(m, j) as Estado;
      continue;
    }
    // O modelo compara com a divisão seguinte limitada à Continental (índice 4).
    const proxima = DIVISOES[Math.min(m.div + 1, topoAlvo)].rival;
    if (!precisa && cj < cg && podePagar(m.ouro, cj) && pVitoria(poderTime(m), proxima) < ALVO_P) {
      m = subirNivel(m, j) as Estado;
      continue;
    }
    if (podePagar(m.ouro, cg) && !(precisa && cj < cg * 3)) {
      m = comprarNegocios(m, i, 1) as Estado;
      continue;
    }
    return m;
  }
}

export function querRefundar(e: Estado, splitsSemSubir: number, modo: Modo = 'modelo'): boolean {
  if (legadoDaRefundacao(e) <= 0) return false;
  if (modo === 'farm') return true;
  return splitsSemSubir >= 3 && e.div < DIV_TOPO;
}
