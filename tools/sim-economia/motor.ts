// Motor da economia do Nexus Idle: implementação literal das RN-001 a RN-014 (regras v0.1).
// NX-007. Funções puras: nada de relógio, Math.random, DOM ou estado global.
// Tempo entra por parâmetro (`agora`, `segundos`) e o sorteio vem do estado (`rng`, RN-009).
// Quando a stack (ADR-002) for aprovada, este arquivo migra para `src/engine/` e o simulador passa
// a importar de lá.
// Só sintaxe TypeScript "apagável" (sem enum, sem namespace): roda com `node` 22 sem dependências.

import { sortear } from './rng.ts';

// ---------- Constantes das RN ----------

/** RN-003. Nomes provisórios ficam com o `nexus-lore`; aqui só o id. */
export const GERADORES = [
  { id: 'live', custoBase: 10, rendaBase: 0.5 },
  { id: 'patrocinio', custoBase: 150, rendaBase: 6 },
  { id: 'loja', custoBase: 2_000, rendaBase: 60 },
  { id: 'canal', custoBase: 30_000, rendaBase: 700 },
  { id: 'fanfest', custoBase: 500_000, rendaBase: 9_000 },
  { id: 'arena', custoBase: 8_000_000, rendaBase: 120_000 },
] as const;
export const CRESC_GERADOR = 1.15; // RN-003
export const MARCO_GERADOR = 50; // RN-004

export const FUNCOES = ['topo', 'selva', 'meio', 'atirador', 'suporte'] as const; // RN-007
export const NIVEL_CUSTO_BASE = 50;
export const NIVEL_CRESC = 1.22;
export const PODER_BASE = 10;
export const PODER_CRESC = 1.05;

/** RN-008 */
export const DIVISOES = [
  { id: 'amadora', rival: 60, mult: 1 },
  { id: 'desafiante', rival: 220, mult: 2 },
  { id: 'academy', rival: 900, mult: 4 },
  { id: 'liga', rival: 20_000, mult: 8 },
  { id: 'internacional', rival: 170_000, mult: 16 },
  { id: 'mundial', rival: 1_500_000, mult: 32 },
] as const;
export const DIV_TOPO = DIVISOES.length - 1;

export const INTERVALO_PARTIDA = 90; // RN-009
export const P_MIN = 0.05;
export const P_MAX = 0.95;
export const PREMIO_VITORIA_S = 60;
export const PARTIDAS_TEMPORADA = 14; // RN-010
export const VITORIAS_SOBE = 10;
export const VITORIAS_CAI = 3;

export const OFFLINE_EFIC = 0.5; // RN-011
export const OFFLINE_LIMITE = 8 * 3600;

export const DIV_MIN_PRESTIGIO = 2; // RN-013 (Academy)
export const LEGADO_POR_DIV: readonly number[] = [0, 0, 10, 25, 45, 80];
export const LEGADO_RENDA = 0.05; // RN-014
export const LEGADO_PODER = 0.01;

export const TOQUE_FRACAO = 0.1; // RN-005
export const TOQUE_MIN = 1;
export const TOQUES_MAX_POR_S = 5;

/** Ouro de um clube novo. Não está nas RN: vem do Gherkin da NX-010. Ver relatório (ambiguidade A1). */
export const OURO_INICIAL = 10;

// ---------- Variantes de regra (propostas da NX-007, fora das RN v0.1) ----------

export interface Regras {
  /**
   * 'rn' = RN-013 v0.1; 'inedita' = só paga a diferença para a melhor divisão já paga;
   * 'decrescente' = tabela / (1 + repetições); 'recorde' = tabela cheia, mas só se a run igualou o
   * recorde de divisão do jogador (abaixo do recorde, 0).
   */
  legado: 'rn' | 'inedita' | 'decrescente' | 'recorde';
  /**
   * 'rn' = RN-011 v0.1 (para no fim da temporada); 'atravessa' = segue temporadas até o limite;
   * 'ate-inedita' = segue, mas para na 1ª subida inédita da run; 'ate-mudanca' = segue enquanto a
   * temporada termina em "manteve", para na 1ª subida ou queda.
   */
  offline: 'rn' | 'atravessa' | 'ate-inedita' | 'ate-mudanca';
}
export const REGRAS_RN: Regras = { legado: 'rn', offline: 'rn' };

// ---------- Estado ----------

export interface Estado {
  ouro: number;
  geradores: number[]; // unidades por gerador (RN-003)
  niveis: number[]; // nível por função (RN-007)
  div: number; // divisão atual (RN-008)
  vitorias: number; // na temporada atual (RN-010)
  derrotas: number;
  melhorDivRun: number; // RN-013
  legado: number; // RN-001/RN-014
  prestigios: number;
  rng: number; // estado do sorteio, salvo no save (RN-009)
  proxPartida: number; // segundos até a próxima partida com o app aberto
  salvoEm: number; // momento do último save, em s (RN-012)
  ouroTotal: number; // estatística (mantida no prestígio)
  melhorDivSempre: number; // estatística; marcos de história vistos = divisões 1..melhorDivSempre
  legadoPagoAte: number; // variante 'inedita'
  prestigiosPorDiv: number[]; // variante 'decrescente'
}

export type Evento =
  | { tipo: 'partida'; vitoria: boolean; premio: number; p: number }
  | {
      tipo: 'fimTemporada';
      v: number;
      d: number;
      de: number;
      para: number;
      resultado: 'subiu' | 'manteve' | 'caiu';
      inedita: boolean; // subiu a uma divisão nunca alcançada nesta run (marco de história, RN-010)
    };

export function novoEstado(semente: number, agora: number): Estado {
  return {
    ouro: OURO_INICIAL,
    geradores: GERADORES.map(() => 0),
    niveis: FUNCOES.map(() => 1),
    div: 0,
    vitorias: 0,
    derrotas: 0,
    melhorDivRun: 0,
    legado: 0,
    prestigios: 0,
    rng: semente >>> 0,
    proxPartida: INTERVALO_PARTIDA,
    salvoEm: agora,
    ouroTotal: 0,
    melhorDivSempre: 0,
    legadoPagoAte: 0,
    prestigiosPorDiv: DIVISOES.map(() => 0),
  };
}

const copia = (e: Estado): Estado => ({
  ...e,
  geradores: [...e.geradores],
  niveis: [...e.niveis],
  prestigiosPorDiv: [...e.prestigiosPorDiv],
});

// ---------- Renda (RN-002 a RN-006) ----------

export const multLegadoRenda = (legado: number) => 1 + LEGADO_RENDA * legado;
export const multLegadoPoder = (legado: number) => 1 + LEGADO_PODER * legado;

/** Renda por segundo de um gerador sem os multiplicadores globais (RN-002 + RN-004). */
export const rendaGerador = (i: number, n: number) =>
  GERADORES[i].rendaBase * n * 2 ** Math.floor(n / MARCO_GERADOR);

/** RN-002 */
export function renda(e: Estado): number {
  let r = 0;
  for (let i = 0; i < GERADORES.length; i++) r += rendaGerador(i, e.geradores[i]);
  return r * DIVISOES[e.div].mult * multLegadoRenda(e.legado);
}

/** RN-004: unidades que faltam para o próximo marco. */
export const faltamParaMarco = (n: number) => MARCO_GERADOR - (n % MARCO_GERADOR);

/** RN-003 */
export const custoGerador = (e: Estado, i: number) =>
  GERADORES[i].custoBase * CRESC_GERADOR ** e.geradores[i];

/** RN-006. Para k = 1 usa a RN-003 direto (evita resíduo de ponto flutuante). */
export function custoLote(e: Estado, i: number, k: number): number {
  if (k <= 0) return 0;
  if (k === 1) return custoGerador(e, i);
  return (custoGerador(e, i) * (CRESC_GERADOR ** k - 1)) / (CRESC_GERADOR - 1);
}

/** RN-006 "Máx": maior k com custo ≤ ouro (0 se não dá nem 1). */
export function maxLote(e: Estado, i: number): number {
  const c = custoGerador(e, i);
  if (e.ouro < c) return 0;
  let k = Math.floor(Math.log((e.ouro * (CRESC_GERADOR - 1)) / c + 1) / Math.log(CRESC_GERADOR));
  while (k > 0 && custoLote(e, i, k) > e.ouro) k--; // correção de arredondamento
  while (custoLote(e, i, k + 1) <= e.ouro) k++;
  return k;
}

/** RN-001/RN-006: compra k unidades ou devolve null se ouro < custo. */
export function comprarGeradores(e: Estado, i: number, k = 1): Estado | null {
  const c = custoLote(e, i, k);
  if (k <= 0 || e.ouro < c) return null;
  const m = copia(e);
  m.ouro -= c;
  m.geradores[i] += k;
  return m;
}

/** RN-003: visível quando o jogador alcança 50% do custo base pela primeira vez na run (UI). */
export const geradorVisivel = (maiorOuroDaRun: number, i: number) =>
  maiorOuroDaRun >= GERADORES[i].custoBase * 0.5;

/** RN-005: ouro por toque. */
export const ouroPorToque = (e: Estado) => Math.max(TOQUE_MIN, TOQUE_FRACAO * renda(e));

/** RN-005: aplica os toques de 1 segundo (excesso acima de 5 é ignorado). */
export function tocar(e: Estado, toquesNoSegundo: number): Estado {
  const n = Math.min(Math.max(0, Math.floor(toquesNoSegundo)), TOQUES_MAX_POR_S);
  if (n === 0) return e;
  const m = copia(e);
  ganhar(m, n * ouroPorToque(m));
  return m;
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
  if (e.ouro < c) return null;
  const m = copia(e);
  m.ouro -= c;
  m.niveis[j] += 1;
  return m;
}

// ---------- Partida e temporada (RN-009, RN-010) ----------

/** RN-009 */
export function pVitoria(poderDoTime: number, poderRival: number): number {
  const x = poderDoTime / poderRival - 1;
  return Math.min(P_MAX, Math.max(P_MIN, 1 / (1 + Math.exp(-6 * x))));
}

export const pVitoriaAtual = (e: Estado) => pVitoria(poderTime(e), DIVISOES[e.div].rival);

function ganhar(m: Estado, x: number) {
  m.ouro += x;
  m.ouroTotal += x;
}

/** Joga uma partida sobre a cópia de trabalho `m` (muta `m`; só chamada em cópias). */
function partida(m: Estado, ev: Evento[]) {
  const p = pVitoriaAtual(m);
  const [u, prox] = sortear(m.rng);
  m.rng = prox;
  const vitoria = u < p;
  let premio = 0;
  if (vitoria) {
    premio = PREMIO_VITORIA_S * renda(m); // renda no momento do resultado
    ganhar(m, premio);
    m.vitorias++;
  } else m.derrotas++;
  ev.push({ tipo: 'partida', vitoria, premio, p });
  if (m.vitorias + m.derrotas === PARTIDAS_TEMPORADA) {
    const de = m.div;
    const v = m.vitorias;
    if (v >= VITORIAS_SOBE && m.div < DIV_TOPO) m.div++;
    else if (v <= VITORIAS_CAI && m.div > 0) m.div--;
    const inedita = m.div > m.melhorDivRun;
    m.melhorDivRun = Math.max(m.melhorDivRun, m.div);
    m.melhorDivSempre = Math.max(m.melhorDivSempre, m.div);
    ev.push({
      tipo: 'fimTemporada',
      v,
      d: m.derrotas,
      de,
      para: m.div,
      resultado: m.div > de ? 'subiu' : m.div < de ? 'caiu' : 'manteve',
      inedita,
    });
    m.vitorias = 0;
    m.derrotas = 0;
  }
}

/** Partidas que faltam na temporada atual. */
export const partidasRestantes = (e: Estado) => PARTIDAS_TEMPORADA - (e.vitorias + e.derrotas);

/**
 * App aberto: avança `segundos` inteiros. A cada segundo credita a renda (RN-002) e os toques
 * daquele segundo (RN-005); a cada 90 s joga uma partida (RN-009/RN-010).
 */
export function avancarOnline(
  e: Estado,
  segundos: number,
  toquesPorSegundo = 0,
): { estado: Estado; eventos: Evento[] } {
  const m = copia(e);
  const ev: Evento[] = [];
  const toques = Math.min(Math.max(0, Math.floor(toquesPorSegundo)), TOQUES_MAX_POR_S);
  for (let s = 0; s < segundos; s++) {
    const r = renda(m);
    ganhar(m, r + toques * Math.max(TOQUE_MIN, TOQUE_FRACAO * r));
    m.proxPartida -= 1;
    if (m.proxPartida <= 0) {
      partida(m, ev);
      m.proxPartida = INTERVALO_PARTIDA;
    }
  }
  return { estado: m, eventos: ev };
}

/** RN-015: grava o momento do save (a persistência em si é da camada de save). */
export const salvar = (e: Estado, agora: number): Estado => ({ ...e, salvoEm: agora });

// ---------- Offline (RN-011, RN-012) ----------

export interface ResumoOffline {
  tOff: number;
  tEf: number;
  ouro: number; // só o ganho offline (RN-011), sem prêmios
  premios: number; // prêmios das vitórias offline (RN-009)
  vitorias: number;
  derrotas: number;
  eventos: Evento[];
}

/**
 * RN-011/RN-012. Fórmula fechada para o ouro; as partidas offline são sorteadas uma a uma (no máx.
 * 14 na regra v0.1). O cronômetro da partida online recomeça em 90 s ao voltar (ambiguidade A2).
 */
export function aplicarOffline(
  e: Estado,
  agora: number,
  regras: Regras = REGRAS_RN,
): { estado: Estado; resumo: ResumoOffline } {
  let tOff = agora - e.salvoEm;
  if (tOff < 0) tOff = 0; // relógio voltou: nada ganho, save passa a "agora"
  const tEf = Math.min(tOff, OFFLINE_LIMITE);
  const m = copia(e);
  const ouro = renda(m) * tEf * OFFLINE_EFIC; // renda no momento do save
  ganhar(m, ouro);
  const ev: Evento[] = [];
  let n = Math.floor(tEf / INTERVALO_PARTIDA);
  if (regras.offline === 'rn') n = Math.min(n, partidasRestantes(m));
  let premios = 0;
  let v = 0;
  let d = 0;
  for (let k = 0; k < n; k++) {
    const antes = ev.length;
    partida(m, ev);
    let para = false;
    for (let x = antes; x < ev.length; x++) {
      const it = ev[x];
      if (it.tipo === 'partida') {
        if (it.vitoria) v++;
        else d++;
        premios += it.premio;
      } else if (regras.offline === 'ate-inedita' && it.inedita) para = true;
      else if (regras.offline === 'ate-mudanca' && it.resultado !== 'manteve') para = true;
    }
    if (para) break;
  }
  m.proxPartida = INTERVALO_PARTIDA;
  m.salvoEm = agora;
  return { estado: m, resumo: { tOff, tEf, ouro, premios, vitorias: v, derrotas: d, eventos: ev } };
}

// ---------- Prestígio (RN-013, RN-014) ----------

export const podePrestigiar = (e: Estado) => e.melhorDivRun >= DIV_MIN_PRESTIGIO;

/** Legado que o prestígio daria agora. */
export function legadoDoPrestigio(e: Estado, regras: Regras = REGRAS_RN): number {
  if (!podePrestigiar(e)) return 0;
  const base = LEGADO_POR_DIV[e.melhorDivRun];
  if (regras.legado === 'inedita') return Math.max(0, base - LEGADO_POR_DIV[e.legadoPagoAte]);
  if (regras.legado === 'decrescente')
    return Math.floor(base / (1 + e.prestigiosPorDiv[e.melhorDivRun]));
  if (regras.legado === 'recorde') return e.melhorDivRun >= e.melhorDivSempre ? base : 0;
  return base;
}

/** RN-013: zera ouro, geradores, níveis, divisão e temporada; mantém Legado, marcos e estatísticas. */
export function prestigiar(e: Estado, regras: Regras = REGRAS_RN): Estado | null {
  if (!podePrestigiar(e)) return null;
  const ganho = legadoDoPrestigio(e, regras);
  const novo = novoEstado(0, e.salvoEm);
  const ppd = [...e.prestigiosPorDiv];
  ppd[e.melhorDivRun]++;
  return {
    ...novo,
    rng: e.rng,
    salvoEm: e.salvoEm,
    legado: e.legado + ganho,
    prestigios: e.prestigios + 1,
    ouroTotal: e.ouroTotal,
    melhorDivSempre: e.melhorDivSempre,
    legadoPagoAte: Math.max(e.legadoPagoAte, e.melhorDivRun),
    prestigiosPorDiv: ppd,
  };
}
