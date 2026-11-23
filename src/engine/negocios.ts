// NX-010: o que as telas T02 e T03 precisam saber dos negócios, em funções puras sobre o `Estado`.
// As contas são as do motor (RN-002 a RN-006, Convenções); aqui só se juntam para a tela não ter
// regra nenhuma. Sem relógio, sorteio ou DOM (o lint barra).

import {
  type Estado,
  type Quantidade,
  custoLote,
  custoNegocio,
  faltam,
  faltamParaMarco,
  maxLote,
  multLegadoRenda,
  podePagar,
  rendaNegocio,
} from './motor.ts';
import { DIVISOES, LOTE_10, MARCO_NEGOCIO, NEGOCIOS } from './regras.ts';

/** Lote escolhido no seletor da T03 (RN-006). */
export type Lote = 'x1' | 'x10' | 'max';

export const QUANTIDADE_DO_LOTE: Readonly<Record<Lote, Quantidade>> = {
  x1: 1,
  x10: LOTE_10,
  max: 'max',
};

/** O botão de compra de um negócio para um lote (RN-006). */
export interface Oferta {
  /** Unidades que o botão compra: 1, 10 ou o k do Máx (0 se o Máx não dá nem 1). */
  quantidade: number;
  /** Custo real do lote (ou de 1 unidade, se o Máx dá 0). A tela arredonda para cima. */
  custo: number;
  /** "ouro ≥ custo" com a tolerância das Convenções. Desabilitado = mostra "Faltam X". */
  pode: boolean;
  /** O que falta (0 se pode). Para o Máx com k = 0, o que falta para 1 unidade (RN-006). */
  faltam: number;
  /** Só no ×10 desabilitado: quantas unidades o Máx compraria agora (apoio "Máx compraria k"). */
  maxCompraria: number;
}

/** RN-006: ×1, ×10 ou Máx para o negócio `i`. */
export function oferta(e: Estado, i: number, lote: Lote): Oferta {
  if (lote === 'max') {
    const k = maxLote(e, i);
    if (k === 0) {
      const c = custoNegocio(e, i);
      return { quantidade: 0, custo: c, pode: false, faltam: faltam(e.ouro, c), maxCompraria: 0 };
    }
    return { quantidade: k, custo: custoLote(e, i, k), pode: true, faltam: 0, maxCompraria: 0 };
  }
  const k = lote === 'x10' ? LOTE_10 : 1;
  const c = custoLote(e, i, k);
  const pode = podePagar(e.ouro, c);
  return {
    quantidade: k,
    custo: c,
    pode,
    faltam: faltam(e.ouro, c),
    maxCompraria: lote === 'x10' && !pode ? maxLote(e, i) : 0,
  };
}

/** Multiplicador global da renda agora: divisão (RN-008) × Legado (RN-014). */
export const multRendaGlobal = (e: Estado) => DIVISOES[e.div].mult * multLegadoRenda(e.legado);

/** Parte da renda/s (RN-002) que vem do negócio `i`, já com divisão e Legado. Soma = `renda(e)`. */
export const rendaDoNegocio = (e: Estado, i: number) =>
  rendaNegocio(i, e.negocios[i]) * multRendaGlobal(e);

/**
 * Renda/s de cada unidade do negócio `i` agora ("+6/s cada"): renda base × marcos já atingidos
 * (RN-004) × divisão × Legado. Com n = 0 é a renda base com os multiplicadores globais.
 */
export const rendaPorUnidade = (e: Estado, i: number) =>
  NEGOCIOS[i].rendaBase * 2 ** Math.floor(e.negocios[i] / MARCO_NEGOCIO) * multRendaGlobal(e);

/** RN-004: progresso até o próximo marco ("37/50 · faltam 13 para ×2"). */
export function progressoMarco(n: number): { feitos: number; faltam: number; fracao: number } {
  const feitos = n % MARCO_NEGOCIO;
  return { feitos, faltam: faltamParaMarco(n), fracao: feitos / MARCO_NEGOCIO };
}

/** RN-004: quantos marcos de 50 uma compra de `antes` para `depois` unidades cruzou (0, 1, 2…). */
export const marcosCruzados = (antes: number, depois: number) =>
  Math.max(0, Math.floor(depois / MARCO_NEGOCIO) - Math.floor(antes / MARCO_NEGOCIO));

/** Índices dos negócios visíveis (RN-003), na ordem da tabela. */
export const negociosVisiveis = (e: Estado) =>
  NEGOCIOS.map((_, i) => i).filter((i) => e.visiveis[i]);

/** NX-010: visível e ainda não visto na aba Negócios (selo "Novo"). */
export const negocioNovo = (e: Estado, i: number) => e.visiveis[i] && !e.negociosVistos[i];

/** NX-010: algum negócio "Novo" (ponto na aba Negócios). */
export const haNegocioNovo = (e: Estado) => NEGOCIOS.some((_, i) => negocioNovo(e, i));

/** Negócios que ficaram visíveis entre dois estados (para o anúncio do Renatão). */
export const negociosQueApareceram = (antes: Estado, depois: Estado) =>
  NEGOCIOS.map((_, i) => i).filter((i) => !antes.visiveis[i] && depois.visiveis[i]);

/**
 * "Próxima compra" da T02 (fluxo NX-010 do UX): entre os negócios visíveis, o de menor custo da
 * próxima unidade; empate fica com o de número menor. "Aulas na lan" é sempre visível (RN-003),
 * então sempre há um.
 */
export function proximaCompra(e: Estado): number {
  let melhor = 0;
  for (const i of negociosVisiveis(e))
    if (!e.visiveis[melhor] || custoNegocio(e, i) < custoNegocio(e, melhor)) melhor = i;
  return melhor;
}
