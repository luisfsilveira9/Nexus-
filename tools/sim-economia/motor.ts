// Motor da economia do Nexus Idle: implementação literal das RN-001 a RN-014 (regras v0.2).
// NX-007, atualizado na NX-008. Funções puras: nada de relógio, Math.random, DOM ou estado global.
// Tempo entra por parâmetro (`agora` = relógio de parede em s; `segundos` = relógio monotônico) e o
// sorteio vem do estado (`rng`, RN-009). Constantes: `regras.ts` (C4 do ADR-002).
// Na NX-015 este arquivo vai para `src/engine/` (sem o bloco "Variantes", que só serve ao simulador).
// Só sintaxe TypeScript "apagável" (sem enum, sem namespace): roda com `node` 22 sem dependências.

import { sortear } from './rng.ts';
import {
  CRESC_NEGOCIO,
  DIVISOES,
  DIV_MIN_REFUNDACAO,
  DIV_TOPO,
  INTERVALO_PARTIDA,
  JOGADORES,
  LEGADO_PODER,
  LEGADO_POR_DIV,
  LEGADO_RENDA,
  MARCO_NEGOCIO,
  NEGOCIOS,
  NIVEL_CRESC,
  NIVEL_CUSTO_BASE,
  NIVEL_INICIAL,
  OFFLINE_EFIC,
  OFFLINE_LIMITE_S,
  OFFLINE_TELA_MIN_S,
  OURO_INICIAL,
  PARTIDAS_SPLIT,
  PODER_BASE,
  PODER_CRESC,
  PREMIO_VITORIA_S,
  P_INCLINACAO,
  P_MAX,
  P_MIN,
  TOLERANCIA_DINHEIRO,
  TOQUES_MAX_JANELA,
  TOQUE_FRACAO,
  TOQUE_JANELA_S,
  TOQUE_MIN,
  VISIVEIS_DE_INICIO,
  VISIVEL_FRACAO,
  VITORIAS_CAI,
  VITORIAS_SOBE,
  VITORIAS_TITULO,
} from './regras.ts';

// ---------- Variantes (só para o simulador comparar com a NX-007; não vão para src/engine/) ----------

export interface Variantes {
  /** 'rn' = RN-011 v0.2 (segue enquanto "manteve"); 'v01' = para no fim do split atual. */
  offline: 'rn' | 'v01';
  /** 'rn' = RN-009/011 v0.2 (resto do relógio no save); 'v01' = relógio volta a 90 s e o offline conta floor(t_ef/90). */
  relogio: 'rn' | 'v01';
}
export const RN: Variantes = { offline: 'rn', relogio: 'rn' };

// ---------- Estado ----------

export type ResultadoSplit = 'subiu' | 'manteve' | 'caiu' | 'campeao';

export interface Estado {
  ouro: number;
  negocios: number[]; // unidades por negócio (RN-003)
  visiveis: boolean[]; // RN-003: não some até a refundação
  ouroRun: number; // RN-003: ouro acumulado na run (tudo o que entrou, sem descontar gastos)
  niveis: number[]; // nível por jogador (RN-007)
  div: number; // divisão atual (RN-008)
  vitorias: number; // no split atual (RN-010)
  derrotas: number;
  melhorDivRun: number; // RN-013
  legado: number; // RN-001/RN-014
  rng: number; // estado do sorteio, no save (RN-009)
  proxPartida: number; // segundos do relógio de partida até a próxima partida, no save (RN-009)
  maior: number; // RN-012: maior horário de parede já visto, em s
  // Histórico (mantido na refundação)
  refundacoes: number;
  refundacoesPorDiv: number[]; // estatística: refundações por melhor divisão da run
  titulos: number; // RN-010: títulos mundiais
  ouroTotal: number;
  melhorDivSempre: number; // capítulos de divisão já vistos = 1..melhorDivSempre (RN-018)
  // Sessão (não precisa ir para o save; zera ao voltar do offline)
  toques: number[]; // RN-005: instantes (ms, relógio monotônico) dos toques aceitos no último 1 s
  monoMs: number; // relógio monotônico da sessão, em ms
}

export type Evento =
  | { tipo: 'toque'; aceito: boolean; ouro: number }
  | { tipo: 'partida'; vitoria: boolean; premio: number; p: number }
  | { tipo: 'fimSplit'; v: number; d: number; de: number; para: number; resultado: ResultadoSplit; inedita: boolean };

export function novoEstado(semente: number, agora: number): Estado {
  return {
    ouro: OURO_INICIAL,
    negocios: NEGOCIOS.map(() => 0),
    visiveis: NEGOCIOS.map((_, i) => VISIVEIS_DE_INICIO.includes(i)),
    ouroRun: 0,
    niveis: JOGADORES.map(() => NIVEL_INICIAL),
    div: 0,
    vitorias: 0,
    derrotas: 0,
    melhorDivRun: 0,
    legado: 0,
    rng: semente >>> 0,
    proxPartida: INTERVALO_PARTIDA,
    maior: agora,
    refundacoes: 0,
    refundacoesPorDiv: DIVISOES.map(() => 0),
    titulos: 0,
    ouroTotal: 0,
    melhorDivSempre: 0,
    toques: [],
    monoMs: 0,
  };
}

const copia = (e: Estado): Estado => ({
  ...e,
  negocios: [...e.negocios],
  visiveis: [...e.visiveis],
  niveis: [...e.niveis],
  refundacoesPorDiv: [...e.refundacoesPorDiv],
  toques: [...e.toques],
});

// ---------- Dinheiro (Convenções) ----------

/** "ouro ≥ custo" das RN: ouro ≥ custo × (1 − 10⁻⁹). */
export const podePagar = (ouro: number, custo: number) => ouro >= custo * (1 - TOLERANCIA_DINHEIRO);

/** Depois da compra: ouro = max(0, ouro − custo). */
const pagar = (m: Estado, custo: number) => {
  m.ouro = Math.max(0, m.ouro - custo);
};

/** "Faltam X": o que falta para pagar `custo` (0 se já dá). A tela arredonda para cima (RN-017). */
export const faltam = (ouro: number, custo: number) => (podePagar(ouro, custo) ? 0 : custo - ouro);

/** Toda entrada de ouro passa aqui: conta para o ouro acumulado da run e para a visibilidade (RN-003). */
function ganhar(m: Estado, x: number) {
  m.ouro += x;
  m.ouroTotal += x;
  m.ouroRun += x;
  for (let i = 0; i < NEGOCIOS.length; i++)
    if (!m.visiveis[i] && podePagar(m.ouroRun, NEGOCIOS[i].custoBase * VISIVEL_FRACAO)) m.visiveis[i] = true;
}

// ---------- Renda e negócios (RN-002 a RN-006) ----------

export const multLegadoRenda = (legado: number) => 1 + LEGADO_RENDA * legado;
export const multLegadoPoder = (legado: number) => 1 + LEGADO_PODER * legado;

/** Renda por segundo de um negócio sem os multiplicadores globais (RN-002 + RN-004). */
export const rendaNegocio = (i: number, n: number) =>
  NEGOCIOS[i].rendaBase * n * 2 ** Math.floor(n / MARCO_NEGOCIO);

/** RN-002 */
export function renda(e: Estado): number {
  let r = 0;
  for (let i = 0; i < NEGOCIOS.length; i++) r += rendaNegocio(i, e.negocios[i]);
  return r * DIVISOES[e.div].mult * multLegadoRenda(e.legado);
}

/** RN-004: unidades que faltam para o próximo marco. */
export const faltamParaMarco = (n: number) => MARCO_NEGOCIO - (n % MARCO_NEGOCIO);

/** RN-003 */
export const custoNegocio = (e: Estado, i: number) => NEGOCIOS[i].custoBase * CRESC_NEGOCIO ** e.negocios[i];

/** RN-006. Para k = 1 usa a fórmula da RN-003 (Convenções / QA-4). */
export function custoLote(e: Estado, i: number, k: number): number {
  if (k <= 0) return 0;
  if (k === 1) return custoNegocio(e, i);
  return (custoNegocio(e, i) * (CRESC_NEGOCIO ** k - 1)) / (CRESC_NEGOCIO - 1);
}

/** RN-003: visível (fica visível até a refundação). */
export const negocioVisivel = (e: Estado, i: number) => e.visiveis[i];

/** RN-006 "Máx": maior k com "ouro ≥ custo de k" (Convenções). 0 se não dá nem 1. */
export function maxLote(e: Estado, i: number): number {
  const c = custoNegocio(e, i);
  if (!podePagar(e.ouro, c)) return 0;
  let k = Math.max(1, Math.floor(Math.log((e.ouro * (CRESC_NEGOCIO - 1)) / c + 1) / Math.log(CRESC_NEGOCIO)));
  while (k > 1 && !podePagar(e.ouro, custoLote(e, i, k))) k--; // correção de arredondamento
  while (podePagar(e.ouro, custoLote(e, i, k + 1))) k++;
  return k;
}

/** RN-001/RN-006: compra k unidades ou devolve null se não dá. */
export function comprarNegocios(e: Estado, i: number, k = 1): Estado | null {
  const c = custoLote(e, i, k);
  if (k <= 0 || !podePagar(e.ouro, c)) return null;
  const m = copia(e);
  pagar(m, c);
  m.negocios[i] += k;
  return m;
}

// ---------- Toque (RN-005) ----------

/** RN-005: ouro por toque. */
export const ouroPorToque = (e: Estado) => Math.max(TOQUE_MIN, TOQUE_FRACAO * renda(e));

/**
 * RN-005: um toque no instante `tMs` (relógio monotônico, ms). Conta se houver menos de 5 toques
 * aceitos na janela (tMs − 1000, tMs]. Toques a mais são ignorados e não entram na janela.
 */
export function tocar(e: Estado, tMs: number): { estado: Estado; aceito: boolean } {
  const recentes = e.toques.filter((x) => x > tMs - TOQUE_JANELA_S * 1000);
  if (recentes.length >= TOQUES_MAX_JANELA) return { estado: e, aceito: false };
  const m = copia(e);
  m.toques = [...recentes, tMs];
  ganhar(m, ouroPorToque(m));
  return { estado: m, aceito: true };
}

// ---------- Elenco e poder (RN-007, RN-008) ----------

export const custoNivelDe = (nivel: number) => NIVEL_CUSTO_BASE * NIVEL_CRESC ** (nivel - 1);
export const custoNivel = (e: Estado, j: number) => custoNivelDe(e.niveis[j]);
export const poderJogador = (nivel: number) => PODER_BASE * PODER_CRESC ** (nivel - 1);

export function poderTime(e: Estado): number {
  let p = 0;
  for (const nv of e.niveis) p += poderJogador(nv);
  return p * multLegadoPoder(e.legado);
}

export function subirNivel(e: Estado, j: number): Estado | null {
  const c = custoNivel(e, j);
  if (!podePagar(e.ouro, c)) return null;
  const m = copia(e);
  pagar(m, c);
  m.niveis[j] += 1;
  return m;
}

// ---------- Partida e split (RN-009, RN-010) ----------

/** RN-009 */
export function pVitoria(poderDoTime: number, poderRival: number): number {
  const x = poderDoTime / poderRival - 1;
  return Math.min(P_MAX, Math.max(P_MIN, 1 / (1 + Math.exp(-P_INCLINACAO * x))));
}

export const pVitoriaAtual = (e: Estado) => pVitoria(poderTime(e), DIVISOES[e.div].rival);

/** Joga uma partida sobre a cópia de trabalho `m` (muta `m`; só chamada em cópias). */
function partida(m: Estado, ev: Evento[]) {
  const p = pVitoriaAtual(m);
  const [u, prox] = sortear(m.rng);
  m.rng = prox;
  const vitoria = u < p;
  let premio = 0;
  if (vitoria) {
    premio = PREMIO_VITORIA_S * renda(m); // RN-009: renda de antes de qualquer subida ou queda
    ganhar(m, premio);
    m.vitorias++;
  } else m.derrotas++;
  ev.push({ tipo: 'partida', vitoria, premio, p });
  if (m.vitorias + m.derrotas < PARTIDAS_SPLIT) return;
  const de = m.div;
  const v = m.vitorias;
  let resultado: ResultadoSplit = 'manteve';
  if (v >= VITORIAS_SOBE && m.div < DIV_TOPO) {
    m.div++;
    resultado = 'subiu';
  } else if (v <= VITORIAS_CAI && m.div > 0) {
    m.div--;
    resultado = 'caiu';
  } else if (m.div === DIV_TOPO && v >= VITORIAS_TITULO) {
    m.titulos++;
    resultado = 'campeao';
  }
  const inedita = m.div > m.melhorDivRun;
  m.melhorDivRun = Math.max(m.melhorDivRun, m.div);
  m.melhorDivSempre = Math.max(m.melhorDivSempre, m.div);
  ev.push({ tipo: 'fimSplit', v, d: m.derrotas, de, para: m.div, resultado, inedita });
  m.vitorias = 0;
  m.derrotas = 0;
}

/** Partidas que faltam no split atual. */
export const partidasRestantes = (e: Estado) => PARTIDAS_SPLIT - (e.vitorias + e.derrotas);

export interface OpcoesOnline {
  /** Toques por segundo, espalhados por igual dentro de cada segundo (RN-005 limita a 5 na janela). */
  toquesPorSegundo?: number;
  /** RN-009: boas-vindas, capítulo, tela offline ou confirmação da refundação abertos. A renda não pausa. */
  pausado?: boolean;
}

/**
 * App aberto e em primeiro plano: avança `segundos` inteiros do relógio monotônico. A cada segundo
 * credita a renda (RN-002) e os toques (RN-005); o relógio de partida anda se não estiver pausado e,
 * ao zerar, joga uma partida (RN-009/RN-010).
 */
export function avancarOnline(
  e: Estado,
  segundos: number,
  opcoes: OpcoesOnline = {},
): { estado: Estado; eventos: Evento[] } {
  let m = copia(e);
  const ev: Evento[] = [];
  const n = Math.max(0, Math.floor(opcoes.toquesPorSegundo ?? 0));
  for (let s = 0; s < segundos; s++) {
    ganhar(m, renda(m));
    for (let j = 0; j < n; j++) {
      const r = tocar(m, m.monoMs + Math.floor((j * 1000) / n));
      m = r.aceito ? r.estado : m;
    }
    m.monoMs += 1000;
    if (!opcoes.pausado) {
      m.proxPartida -= 1;
      while (m.proxPartida <= 0) {
        partida(m, ev);
        m.proxPartida += INTERVALO_PARTIDA;
      }
    }
  }
  return { estado: m, eventos: ev };
}

/** RN-015/RN-012: ao salvar, o jogo vê o relógio de parede e atualiza `maior`. */
export const salvar = (e: Estado, agora: number): Estado => ({ ...e, maior: Math.max(e.maior, agora) });

// ---------- Offline (RN-011, RN-012) ----------

export interface ResumoOffline {
  tOff: number;
  tEf: number;
  ouro: number; // só o ganho offline (RN-011), sem prêmios
  premios: number; // prêmios das vitórias offline (RN-009, sem o fator 0,5)
  partidas: number; // jogadas
  partidasPossiveis: number; // da fórmula da RN-011
  vitorias: number;
  derrotas: number;
  splits: { v: number; d: number; resultado: ResultadoSplit }[];
  mostrarTela: boolean; // RN-011: t_off ≥ 60 s
  eventos: Evento[];
}

/**
 * RN-011/RN-012, ao voltar ao primeiro plano. Fórmula fechada para o ouro; as partidas offline são
 * sorteadas uma a uma (no máx. 320). `agora` é o relógio de parede, em s.
 */
export function aplicarOffline(e: Estado, agora: number, va: Variantes = RN): { estado: Estado; resumo: ResumoOffline } {
  const tOff = Math.max(0, agora - e.maior);
  const tEf = Math.min(tOff, OFFLINE_LIMITE_S);
  const m = copia(e);
  m.maior = Math.max(e.maior, agora);
  m.toques = []; // RN-005: a janela é da sessão
  const ouro = renda(e) * tEf * OFFLINE_EFIC; // renda no momento do save
  ganhar(m, ouro);

  const r = va.relogio === 'rn' ? e.proxPartida : INTERVALO_PARTIDA;
  let possiveis: number;
  if (va.relogio === 'rn') possiveis = tEf < r ? 0 : 1 + Math.floor((tEf - r) / INTERVALO_PARTIDA);
  else possiveis = Math.floor(tEf / INTERVALO_PARTIDA);
  let n = possiveis;
  if (va.offline === 'v01') n = Math.min(n, partidasRestantes(m));

  const ev: Evento[] = [];
  const splits: ResumoOffline['splits'] = [];
  let premios = 0;
  let v = 0;
  let d = 0;
  let jogadas = 0;
  for (let k = 0; k < n; k++) {
    const antes = ev.length;
    partida(m, ev);
    jogadas++;
    let para = false;
    for (let x = antes; x < ev.length; x++) {
      const it = ev[x];
      if (it.tipo === 'partida') {
        if (it.vitoria) v++;
        else d++;
        premios += it.premio;
      } else if (it.tipo === 'fimSplit') {
        splits.push({ v: it.v, d: it.d, resultado: it.resultado });
        if (it.resultado === 'subiu' || it.resultado === 'caiu') para = true;
      }
    }
    if (para) break;
  }

  // RN-011: o relógio volta com o resto (t_ef − r) mod 90, contado a partir de 90.
  if (va.relogio === 'v01') m.proxPartida = INTERVALO_PARTIDA;
  else if (tEf < r) m.proxPartida = r - tEf;
  else m.proxPartida = INTERVALO_PARTIDA - ((tEf - r) % INTERVALO_PARTIDA);

  return {
    estado: m,
    resumo: {
      tOff,
      tEf,
      ouro,
      premios,
      partidas: jogadas,
      partidasPossiveis: possiveis,
      vitorias: v,
      derrotas: d,
      splits,
      mostrarTela: tOff >= OFFLINE_TELA_MIN_S,
      eventos: ev,
    },
  };
}

// ---------- Refundação (RN-013, RN-014) ----------

export const podeRefundar = (e: Estado) => e.melhorDivRun >= DIV_MIN_REFUNDACAO;

/** RN-013: Legado que a refundação daria agora. */
export const legadoDaRefundacao = (e: Estado) => (podeRefundar(e) ? LEGADO_POR_DIV[e.melhorDivRun] : 0);

/**
 * RN-013: zera negócios, visibilidade, níveis, divisão, split e relógio de partida; ouro volta a 10.
 * Mantém Legado, capítulos (melhorDivSempre), histórico, rng e o relógio de parede (`maior`).
 */
export function refundar(e: Estado): Estado | null {
  if (!podeRefundar(e)) return null;
  const novo = novoEstado(0, e.maior);
  const rpd = [...e.refundacoesPorDiv];
  rpd[e.melhorDivRun]++;
  return {
    ...novo,
    rng: e.rng,
    maior: e.maior,
    legado: e.legado + legadoDaRefundacao(e),
    refundacoes: e.refundacoes + 1,
    refundacoesPorDiv: rpd,
    titulos: e.titulos,
    ouroTotal: e.ouroTotal,
    melhorDivSempre: e.melhorDivSempre,
    toques: e.toques,
    monoMs: e.monoMs,
  };
}
