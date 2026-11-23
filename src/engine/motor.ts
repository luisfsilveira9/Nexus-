// Motor da economia do Nexus Idle: implementação literal das RN-001 a RN-014 (regras v0.3.1).
// Origem: tools/sim-economia/motor.ts (NX-007/NX-008), movido na NX-015 sem o bloco "Variantes".
// Funções puras: nada de relógio, Math.random, DOM ou estado global (o lint barra isso aqui).
// Tempo entra por parâmetro e o sorteio vem do estado (`rng`, RN-009). Constantes: `regras.ts` (C4).
//
// Unidades: `maior` e os horários de parede passados às funções de baixo nível estão em SEGUNDOS
// desde 1970 (UTC); `monoMs` e os toques, em milissegundos do relógio monotônico da sessão.
// `passo()` recebe os dois relógios em ms (`Agora`) e converte.
// Só sintaxe TypeScript "apagável" (sem enum, sem namespace): roda com `node` 22.18+ sem build.

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
  LOTE_10,
  MARCO_NEGOCIO,
  NEGOCIOS,
  NIVEL_CRESC,
  NIVEL_CUSTO_BASE,
  NIVEL_INICIAL,
  NOME_PADRAO,
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
  SIGLA_PADRAO,
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

// ---------- Estado ----------

export type ResultadoSplit = 'subiu' | 'manteve' | 'caiu' | 'campeao';

export interface Clube {
  nome: string; // RN-019
  sigla: string;
}

/** Estado do jogo. É JSON puro (C1): só números, booleanos, strings, arrays e objetos simples. */
export interface Estado {
  ouro: number;
  negocios: number[]; // unidades por negócio (RN-003)
  visiveis: boolean[]; // RN-003: não some até a refundação
  /**
   * NX-010 (fluxo UX): negócio visível que o jogador já viu na aba Negócios. Visível e não visto =
   * selo "Novo" e ponto na aba. Zera com a visibilidade na refundação. Não muda nenhuma conta.
   */
  negociosVistos: boolean[];
  ouroRun: number; // RN-003: ouro ganho na run (sem os 10 iniciais e sem descontar gastos)
  niveis: number[]; // nível por jogador (RN-007)
  div: number; // divisão atual (RN-008)
  vitorias: number; // no split atual (RN-010)
  derrotas: number;
  melhorDivRun: number; // RN-013
  legado: number; // RN-001/RN-014
  rng: number; // estado do sorteio, no save (RN-009)
  proxPartida: number; // `r` da RN-009: segundos do relógio de partida até a próxima, 0 < r ≤ 90
  maior: number; // RN-012: maior horário de parede já visto, em s desde 1970 (UTC)
  clube: Clube; // RN-019 (mantido na refundação)
  // Histórico (mantido na refundação)
  capitulos: string[]; // RN-018: ids de capítulos vistos (preenchido a partir da NX-017)
  refundacoes: number;
  refundacoesPorDiv: number[]; // estatística: refundações por melhor divisão da run
  titulos: number; // RN-010: títulos mundiais
  ouroTotal: number;
  melhorDivSempre: number; // capítulos de divisão já vistos = 1..melhorDivSempre (RN-018)
  // Sessão (vai no save, mas zera ao abrir ou voltar ao app)
  toques: number[]; // RN-005: instantes (ms, relógio monotônico) dos toques aceitos no último 1 s
  monoMs: number; // relógio monotônico: até onde a renda online já foi creditada, em ms
}

export type Evento =
  | { tipo: 'toque'; aceito: boolean; ouro: number }
  | { tipo: 'compra'; alvo: 'negocio' | 'nivel'; indice: number; quantidade: number; custo: number }
  | { tipo: 'partida'; vitoria: boolean; premio: number; p: number }
  | {
      tipo: 'fimSplit';
      v: number;
      d: number;
      de: number;
      para: number;
      resultado: ResultadoSplit;
      inedita: boolean;
    }
  | { tipo: 'offline'; resumo: ResumoOffline }
  | { tipo: 'refundacao'; legadoGanho: number };

export function novoEstado(
  semente: number,
  agora: number,
  clube: Clube = { nome: NOME_PADRAO, sigla: SIGLA_PADRAO },
): Estado {
  return {
    ouro: OURO_INICIAL,
    negocios: NEGOCIOS.map(() => 0),
    visiveis: NEGOCIOS.map((_, i) => VISIVEIS_DE_INICIO.includes(i)),
    negociosVistos: NEGOCIOS.map((_, i) => VISIVEIS_DE_INICIO.includes(i)),
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
    clube: { ...clube },
    capitulos: [],
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
  negociosVistos: [...e.negociosVistos],
  niveis: [...e.niveis],
  clube: { ...e.clube },
  capitulos: [...e.capitulos],
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

/** Toda entrada de ouro passa aqui: conta para o ouro ganho na run e para a visibilidade (RN-003). */
function ganhar(m: Estado, x: number) {
  m.ouro += x;
  m.ouroTotal += x;
  m.ouroRun += x;
  for (let i = 0; i < NEGOCIOS.length; i++)
    if (!m.visiveis[i] && podePagar(m.ouroRun, NEGOCIOS[i].custoBase * VISIVEL_FRACAO))
      m.visiveis[i] = true;
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
export const custoNegocio = (e: Estado, i: number) =>
  NEGOCIOS[i].custoBase * CRESC_NEGOCIO ** e.negocios[i];

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
  let k = Math.max(
    1,
    Math.floor(Math.log((e.ouro * (CRESC_NEGOCIO - 1)) / c + 1) / Math.log(CRESC_NEGOCIO)),
  );
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

/**
 * RN-009 v0.3: o relógio de partida só conta com a barra de abas visível. `emJogo` = barra de abas
 * visível; `pausado` = qualquer tela cheia que a esconde (prólogo, capítulo, offline, avisos de save,
 * refundação, nome do clube, exportar/importar). A renda não pausa.
 */
export type ModoRelogio = 'emJogo' | 'pausado';

export interface OpcoesOnline {
  /** Toques por segundo, espalhados por igual dentro de cada segundo (só o simulador usa). */
  toquesPorSegundo?: number;
  /** RN-009: 'pausado' para o relógio de partida; a renda continua. Padrão: 'emJogo'. */
  modo?: ModoRelogio;
}

/**
 * App aberto e em primeiro plano: avança `segundos` inteiros do relógio monotônico. A cada segundo
 * credita a renda (RN-002) e os toques simulados (RN-005); o relógio de partida anda se estiver
 * "em jogo" e, ao zerar, joga uma partida (RN-009/RN-010).
 */
export function avancarOnline(
  e: Estado,
  segundos: number,
  opcoes: OpcoesOnline = {},
): { estado: Estado; eventos: Evento[] } {
  let m = copia(e);
  const ev: Evento[] = [];
  const n = Math.max(0, Math.floor(opcoes.toquesPorSegundo ?? 0));
  const anda = (opcoes.modo ?? 'emJogo') === 'emJogo';
  for (let s = 0; s < segundos; s++) {
    ganhar(m, renda(m));
    for (let j = 0; j < n; j++) {
      const r = tocar(m, m.monoMs + Math.floor((j * 1000) / n));
      m = r.aceito ? r.estado : m;
    }
    m.monoMs += 1000;
    if (anda) {
      m.proxPartida -= 1;
      while (m.proxPartida <= 0) {
        partida(m, ev);
        m.proxPartida += INTERVALO_PARTIDA;
      }
    }
  }
  return { estado: m, eventos: ev };
}

/** RN-015/RN-012: todo save vê o relógio de parede e atualiza `maior` (agora em s). */
export const salvar = (e: Estado, agora: number): Estado => ({
  ...copia(e),
  maior: Math.max(e.maior, agora),
});

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
 * RN-011/RN-012, ao abrir ou voltar ao primeiro plano. Fórmula fechada para o ouro; as partidas
 * offline são sorteadas uma a uma (no máx. 320). `agora` é o relógio de parede, em s.
 */
export function aplicarOffline(
  e: Estado,
  agora: number,
): { estado: Estado; resumo: ResumoOffline } {
  const tOff = Math.max(0, agora - e.maior);
  const tEf = Math.min(tOff, OFFLINE_LIMITE_S);
  const m = copia(e);
  m.maior = Math.max(e.maior, agora);
  m.toques = []; // RN-005: a janela é da sessão
  const ouro = renda(e) * tEf * OFFLINE_EFIC; // renda no momento do save
  ganhar(m, ouro);

  const r = e.proxPartida;
  const possiveis = tEf < r ? 0 : 1 + Math.floor((tEf - r) / INTERVALO_PARTIDA);

  const ev: Evento[] = [];
  const splits: ResumoOffline['splits'] = [];
  let premios = 0;
  let v = 0;
  let d = 0;
  let jogadas = 0;
  let parouPorMudanca = false;
  for (let k = 0; k < possiveis && !parouPorMudanca; k++) {
    const antes = ev.length;
    partida(m, ev);
    jogadas++;
    for (let x = antes; x < ev.length; x++) {
      const it = ev[x];
      if (it.tipo === 'partida') {
        if (it.vitoria) v++;
        else d++;
        premios += it.premio;
      } else if (it.tipo === 'fimSplit') {
        splits.push({ v: it.v, d: it.d, resultado: it.resultado });
        // RN-011: as partidas param no fim do primeiro split com subida ou queda.
        if (it.resultado === 'subiu' || it.resultado === 'caiu') parouPorMudanca = true;
      }
    }
  }

  // RN-011 v0.3, relógio de partida depois do offline (sempre 0 < r ≤ 90).
  if (tEf < r) m.proxPartida = r - tEf;
  else if (parouPorMudanca) m.proxPartida = INTERVALO_PARTIDA;
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
export const legadoDaRefundacao = (e: Estado) =>
  podeRefundar(e) ? LEGADO_POR_DIV[e.melhorDivRun] : 0;

/**
 * RN-013: zera negócios, visibilidade, níveis, divisão, split e relógio de partida; ouro volta a 10.
 * Mantém Legado, capítulos, histórico, nome do clube, rng e o relógio de parede (`maior`).
 */
export function refundar(e: Estado): Estado | null {
  if (!podeRefundar(e)) return null;
  const novo = novoEstado(0, e.maior, e.clube);
  const rpd = [...e.refundacoesPorDiv];
  rpd[e.melhorDivRun]++;
  return {
    ...novo,
    rng: e.rng,
    legado: e.legado + legadoDaRefundacao(e),
    capitulos: [...e.capitulos],
    refundacoes: e.refundacoes + 1,
    refundacoesPorDiv: rpd,
    titulos: e.titulos,
    ouroTotal: e.ouroTotal,
    melhorDivSempre: e.melhorDivSempre,
    toques: [...e.toques],
    monoMs: e.monoMs,
  };
}

// ---------- passo(estado, acao, agora): a interface do motor para o app (C1, C2) ----------

/** Os dois relógios, em ms, lidos só em src/app/ e injetados aqui (C2). */
export interface Agora {
  /** Relógio de parede: ms desde 1970 (UTC). Usado só para o tempo fora (RN-011, RN-012). */
  paredeMs: number;
  /** Relógio monotônico da sessão, em ms. Usado para a renda online, os toques e as partidas. */
  monoMs: number;
}

export type Quantidade = number | 'max';

export type Acao =
  /** Abrir o app ou voltar ao primeiro plano: aplica o offline (RN-011/012) e começa a sessão. */
  | { tipo: 'abrir' }
  /** Avança o relógio monotônico até `agora.monoMs` (segundos inteiros; o resto fica para depois). */
  | { tipo: 'tique'; modo: ModoRelogio }
  /** "Fazer live" (RN-005). */
  | { tipo: 'toque' }
  /** Compra ×1, ×10 (`LOTE_10`) ou Máx (RN-006). */
  | { tipo: 'comprarNegocio'; indice: number; quantidade: Quantidade }
  /** O jogador abriu a aba Negócios: os negócios visíveis deixam de ser "Novo" (NX-010). */
  | { tipo: 'verNegocios' }
  | { tipo: 'subirNivel'; jogador: number }
  | { tipo: 'refundar' }
  /** Atualiza `maior` (RN-012). O save (src/save/) também faz isso a cada gravação. */
  | { tipo: 'salvar' };

export interface ResultadoPasso {
  estado: Estado;
  eventos: Evento[];
}

const quantidadeDe = (e: Estado, i: number, q: Quantidade) => (q === 'max' ? maxLote(e, i) : q);

/**
 * Função pura: não muta `estado`. Ação recusada (sem ouro, índice inválido) devolve o mesmo objeto.
 * `passo` devolve só o novo estado (C1); `passoDetalhado` devolve também os eventos para a tela.
 */
export function passoDetalhado(estado: Estado, acao: Acao, agora: Agora): ResultadoPasso {
  const paredeS = agora.paredeMs / 1000;
  switch (acao.tipo) {
    case 'abrir': {
      const { estado: e, resumo } = aplicarOffline(estado, paredeS);
      e.monoMs = agora.monoMs;
      return { estado: e, eventos: [{ tipo: 'offline', resumo }, ...resumo.eventos] };
    }
    case 'tique': {
      const s = Math.floor((agora.monoMs - estado.monoMs) / 1000);
      if (s <= 0) return { estado, eventos: [] };
      return avancarOnline(estado, s, { modo: acao.modo });
    }
    case 'toque': {
      const { estado: e, aceito } = tocar(estado, agora.monoMs);
      return { estado: e, eventos: [{ tipo: 'toque', aceito, ouro: e.ouro - estado.ouro }] };
    }
    case 'comprarNegocio': {
      const i = acao.indice;
      if (!Number.isInteger(i) || i < 0 || i >= NEGOCIOS.length || !negocioVisivel(estado, i))
        return { estado, eventos: [] };
      const k = quantidadeDe(estado, i, acao.quantidade);
      if (!Number.isInteger(k) || k <= 0) return { estado, eventos: [] };
      const custo = custoLote(estado, i, k);
      const e = comprarNegocios(estado, i, k);
      if (!e) return { estado, eventos: [] };
      return {
        estado: e,
        eventos: [{ tipo: 'compra', alvo: 'negocio', indice: i, quantidade: k, custo }],
      };
    }
    case 'verNegocios': {
      if (estado.visiveis.every((v, i) => !v || estado.negociosVistos[i]))
        return { estado, eventos: [] };
      return { estado: { ...copia(estado), negociosVistos: [...estado.visiveis] }, eventos: [] };
    }
    case 'subirNivel': {
      const j = acao.jogador;
      if (!Number.isInteger(j) || j < 0 || j >= JOGADORES.length) return { estado, eventos: [] };
      const custo = custoNivel(estado, j);
      const e = subirNivel(estado, j);
      if (!e) return { estado, eventos: [] };
      return {
        estado: e,
        eventos: [{ tipo: 'compra', alvo: 'nivel', indice: j, quantidade: 1, custo }],
      };
    }
    case 'refundar': {
      const ganho = legadoDaRefundacao(estado);
      const e = refundar(estado);
      if (!e) return { estado, eventos: [] };
      return { estado: e, eventos: [{ tipo: 'refundacao', legadoGanho: ganho }] };
    }
    case 'salvar':
      return { estado: salvar(estado, paredeS), eventos: [] };
  }
}

export const passo = (estado: Estado, acao: Acao, agora: Agora): Estado =>
  passoDetalhado(estado, acao, agora).estado;

/** Atalho para o lote ×10 da RN-006. */
export const LOTE = { x1: 1, x10: LOTE_10, max: 'max' } as const;
