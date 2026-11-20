// Torneios internacionais da run: First Stand, MSI e Mundial com os times reais de 2026. Tudo é uma lista de partidas (`Torneio.partidas`):
// as chaves são fixas e se ligam por referências ("w:A1" = vencedor de A1, "l:A1" = perdedor, número = semente); o Suíço do Mundial cria
// uma rodada por vez. Só o clube do usuário joga de verdade; o resto sai de simSerie (motor, sem transmissão), como nas etapas nacionais.
import { teamOvr, tById } from './core';
import { MEU, simSerie, type Jogo } from './run';
import type { WorldTeam } from './mundo';

export type Ref = number | string;   // número = semente (índice em `times`); "w:ID" ou "l:ID" = vencedor ou perdedor de outra partida
export interface Partida extends Jogo { id: string; fase: string; bo: number; ra?: Ref; rb?: Ref; top?: boolean; rd?: number }   // top = semifinal ou além; rd = rodada do Suíço
export interface Torneio {
  id: 'F' | 'M' | 'W'; nome: string; times: string[]; partidas: Partida[]; fim: boolean; campeao: string; vice: string;
  novas: string[];   // regiões liberadas ao chegar aqui
}
export const TORNEIOS = { F: 'First Stand', M: 'MSI', W: 'Mundial' } as const;
export const PREMIOS_INT = { campeao: 4000, vice: 2500, semi: 1500, fora: 700 };
export const VITORIAS_SUICO = 3, DECISAO = ['FIN', 'GF'];

const P = (id: string, fase: string, bo: number, ra: Ref, rb: Ref, top = false): Partida => ({ id, fase, bo, ra, rb, top, a: '', b: '', sa: -1, sb: -1 });
const W = (id: string) => 'w:' + id, L = (id: string) => 'l:' + id;
const venc = (m: Partida) => m.sa > m.sb ? m.a : m.b, perd = (m: Partida) => m.sa > m.sb ? m.b : m.a, feita = (m: Partida) => m.sa >= 0;
const forca = (id: string) => teamOvr(tById(id));
const porForca = (ids: string[]) => [...ids].sort((x, y) => forca(y) - forca(x) || x.localeCompare(y));

// ---------- formatos ----------
// grupo de 4 em dupla eliminação (GSL): dois jogos de abertura, vencedores, perdedores e decisão; passam o vencedor e o vencedor da decisão
function grupo(p: string, nome: string, s: number[]): Partida[] {
  return [P(p + '1', `${nome} · Abertura`, 5, s[0], s[3]), P(p + '2', `${nome} · Abertura`, 5, s[1], s[2]), P(p + 'W', `${nome} · Vencedores`, 5, W(p + '1'), W(p + '2')),
    P(p + 'L', `${nome} · Perdedores`, 5, L(p + '1'), L(p + '2')), P(p + 'D', `${nome} · Decisão`, 5, L(p + 'W'), W(p + 'L'))];
}
// dupla eliminação de 8 (14 jogos): s = 8 referências na ordem das sementes
function dupla8(s: Ref[]): Partida[] {
  return [P('U1', 'Chave superior · 1ª rodada', 5, s[0], s[7]), P('U2', 'Chave superior · 1ª rodada', 5, s[3], s[4]), P('U3', 'Chave superior · 1ª rodada', 5, s[1], s[6]), P('U4', 'Chave superior · 1ª rodada', 5, s[2], s[5]),
    P('U5', 'Chave superior · Semifinal', 5, W('U1'), W('U2'), true), P('U6', 'Chave superior · Semifinal', 5, W('U3'), W('U4'), true), P('U7', 'Chave superior · Final', 5, W('U5'), W('U6'), true),
    P('L1', 'Chave inferior · 1ª rodada', 5, L('U1'), L('U2')), P('L2', 'Chave inferior · 1ª rodada', 5, L('U3'), L('U4')),
    P('L3', 'Chave inferior · 2ª rodada', 5, W('L1'), L('U6')), P('L4', 'Chave inferior · 2ª rodada', 5, W('L2'), L('U5')),
    P('L5', 'Chave inferior · 3ª rodada', 5, W('L3'), W('L4'), true), P('L6', 'Chave inferior · Final', 5, W('L5'), L('U7'), true), P('GF', 'Grande final', 5, W('U7'), W('L6'), true)];
}
// play-in de 4 (semifinais e final): o vencedor é a saída
const playIn = (s: Ref[], bo: number): Partida[] => [P('PI1', 'Play-in · Semifinal', bo, s[0], s[3]), P('PI2', 'Play-in · Semifinal', bo, s[1], s[2]), P('PIF', 'Play-in · Final', bo, W('PI1'), W('PI2'))];

// monta o torneio: `ext` são os times de fora que jogam esta edição; `br` os times do Brasil (o do usuário primeiro)
export function criarTorneio(id: Torneio['id'], ext: WorldTeam[], br: string[]): Torneio {
  const fora = porForca(ext.filter(t => t.torneios.includes(id)).map(t => t.id));
  let times: string[], partidas: Partida[];
  if (id === 'F') {   // 8 times, 2 grupos (sementes 1-4-5-8 e 2-3-6-7), semifinais cruzadas e final
    times = porForca([...fora, br[0]]);
    partidas = [...grupo('A', 'Grupo A', [0, 3, 4, 7]), ...grupo('B', 'Grupo B', [1, 2, 5, 6]),
      P('S1', 'Semifinal', 5, W('AW'), W('BD'), true), P('S2', 'Semifinal', 5, W('BW'), W('AD'), true), P('FIN', 'Final', 5, W('S1'), W('S2'), true)];
  } else if (id === 'M') {   // o campeão do Brasil entra direto na chave de 8; os 4 mais fracos disputam a vaga que sobra no play-in
    const diretos = porForca([...fora.slice(0, 6), br[0]]), pin = fora.slice(6);
    times = [...diretos, ...pin]; partidas = [...playIn([7, 8, 9, 10], 5), ...dupla8([0, 1, 2, 3, 4, 5, 6, W('PIF')])];
  } else {   // Mundial: 19 times; o 1º do Brasil e os 14 melhores de fora vão ao Suíço, o 2º do Brasil e os 3 mais fracos jogam o play-in (sobe 1)
    const diretos = porForca([...fora.slice(0, fora.length - 3), br[0]]), pin = porForca([...fora.slice(-3), br[1]]);
    times = [...diretos, ...pin]; partidas = playIn([diretos.length, diretos.length + 1, diretos.length + 2, diretos.length + 3], 3);
  }
  const t: Torneio = { id, nome: TORNEIOS[id], times, partidas, fim: false, campeao: '', vice: '', novas: [] };
  avancar(t); return t;
}

// ---------- andamento ----------
const achar = (t: Torneio, id: string) => t.partidas.find(m => m.id === id);
function resolve(t: Torneio, r: Ref | undefined): string {
  if (typeof r === 'number') return t.times[r] ?? '';
  if (!r) return '';
  const m = achar(t, r.slice(2)); return m && feita(m) ? (r[0] === 'w' ? venc(m) : perd(m)) : '';
}
function resolver(t: Torneio) { t.partidas.forEach(m => { if (feita(m)) return; if (!m.a && m.ra !== undefined) m.a = resolve(t, m.ra); if (!m.b && m.rb !== undefined) m.b = resolve(t, m.rb); }); }

// Suíço: vitórias e derrotas de cada time e quem já jogou contra quem
export function suico(t: Torneio) {
  const v: Record<string, number> = {}, d: Record<string, number> = {}, jogou = new Set<string>(); t.partidas.filter(m => m.rd && feita(m)).forEach(m => { v[venc(m)] = (v[venc(m)] || 0) + 1; d[perd(m)] = (d[perd(m)] || 0) + 1; jogou.add(m.a + '|' + m.b); jogou.add(m.b + '|' + m.a); });
  return { v, d, jogou, vit: (id: string) => v[id] || 0, der: (id: string) => d[id] || 0 };
}
export const entradasSuico = (t: Torneio) => [...t.times.slice(0, t.times.length - 4), resolve(t, W('PIF'))];
// pareia quem tem o mesmo retrospecto: melhor semente contra a pior que ainda não enfrentou (com saída de emergência se não houver outro jeito)
function parear(ids: string[], jogou: Set<string>): [string, string][] {
  const tenta = (v: string[]): [string, string][] | null => { if (!v.length) return []; const a = v[0];
    for (let i = v.length - 1; i > 0; i--) { if (jogou.has(a + '|' + v[i])) continue; const sub = tenta(v.filter((_, j) => j && j !== i)); if (sub) return [[a, v[i]], ...sub]; } return null; };
  return tenta(ids) ?? ids.reduce<[string, string][]>((o, id, i) => i % 2 ? o : [...o, [id, ids[i + 1]]], []);
}
// quando tudo o que existe já foi jogado, cria o que vem depois (rodada do Suíço, mata-mata do Mundial); false = acabou
function expandir(t: Torneio): boolean {
  if (t.id !== 'W') return false;
  const ent = entradasSuico(t), sw = suico(t), ord = (ids: string[]) => ids.sort((x, y) => ent.indexOf(x) - ent.indexOf(y)), rodada = Math.max(0, ...t.partidas.map(m => m.rd || 0));
  const vivos = ent.filter(id => sw.vit(id) < VITORIAS_SUICO && sw.der(id) < VITORIAS_SUICO);
  if (!rodada) { const s = porForca(ent); t.partidas.push(...s.slice(0, 8).map((a, i) => ({ ...P('R1' + i, 'Suíço · Rodada 1', 1, '', ''), a, b: s[i + 8], rd: 1 }))); return true; }
  if (vivos.length) {   // grupos por retrospecto, dos melhores para os piores
    const g: Record<string, string[]> = {}; vivos.forEach(id => (g[`${sw.vit(id)}-${sw.der(id)}`] ||= []).push(id));
    Object.keys(g).sort((x, y) => +y[0] - +x[0] || +x[2] - +y[2]).forEach(k => parear(ord(g[k]), sw.jogou).forEach(([a, b], i) => t.partidas.push({ ...P(`R${rodada + 1}${k}${i}`, `Suíço · Rodada ${rodada + 1}`, rodada + 1 < 3 ? 1 : 3, '', ''), a, b, rd: rodada + 1 })));
    return true;
  }
  if (!achar(t, 'Q1')) {   // 8 classificados: menos derrotas primeiro, depois a ordem de entrada
    const q = ord(ent.filter(id => sw.vit(id) >= VITORIAS_SUICO)).sort((x, y) => sw.der(x) - sw.der(y)), Q = (i: string, f: string, a: string, b: string) => ({ ...P(i, f, 5, '', '', true), a, b });
    t.partidas.push(Q('Q1', 'Quartas de final', q[0], q[7]), Q('Q2', 'Quartas de final', q[3], q[4]), Q('Q3', 'Quartas de final', q[1], q[6]), Q('Q4', 'Quartas de final', q[2], q[5]),
      P('S1', 'Semifinal', 5, W('Q1'), W('Q2'), true), P('S2', 'Semifinal', 5, W('Q3'), W('Q4'), true), P('FIN', 'Final', 5, W('S1'), W('S2'), true)); return true;
  }
  return false;
}
// joga tudo o que não é do usuário e para na primeira partida dele (ou no fim do torneio)
export function avancar(t: Torneio) {
  for (let guarda = 0; guarda < 400 && !t.fim; guarda++) {
    resolver(t); const m = t.partidas.find(x => !feita(x) && x.a && x.b && x.a !== MEU && x.b !== MEU);
    if (m) { simSerie(m, m.bo); continue; }
    if (t.partidas.some(x => !feita(x))) return;
    if (!expandir(t)) { const f = DECISAO.map(i => achar(t, i)).find(Boolean); if (f) { t.campeao = venc(f); t.vice = perd(f); } t.fim = true; }
  }
}
export const partidaDoClube = (t: Torneio | null) => t?.partidas.find(m => !feita(m) && m.a && m.b && (m.a === MEU || m.b === MEU)) ?? null;
export function jogoTorneio(t: Torneio | null): { adv: string; bo: number; rotulo: string } | null { const m = partidaDoClube(t); return m ? { adv: m.a === MEU ? m.b : m.a, bo: m.bo, rotulo: `${t!.nome} · ${m.fase}` } : null; }
// registra a série do clube (eu × ele em jogos) e joga o que vem antes da próxima partida dele
export function registrarTorneio(t: Torneio, eu: number, ele: number) { const m = partidaDoClube(t); if (!m) return; [m.sa, m.sb] = m.a === MEU ? [eu, ele] : [ele, eu]; avancar(t); }

// ---------- resultado do clube ----------
export type ResultadoInt = 'campeao' | 'vice' | 'semi' | 'fora';
export function resultadoClube(t: Torneio): { res: ResultadoInt; lugar: string } {
  const meus = t.partidas.filter(m => feita(m) && (m.a === MEU || m.b === MEU));
  if (t.campeao === MEU) return { res: 'campeao', lugar: `Campeão do ${t.nome}` };
  if (t.vice === MEU) return { res: 'vice', lugar: 'Vice-campeão' };
  const ult = meus[meus.length - 1]; if (!ult) return { res: 'fora', lugar: 'Não jogou' };
  const f = ult.fase.split(' · ')[0], onde = f === 'Chave inferior' ? 'Chave inferior' : f.startsWith('Grupo') ? 'Fase de grupos' : f === 'Suíço' ? 'Suíço' : f;
  return { res: ult.top ? 'semi' : 'fora', lugar: `Eliminado: ${onde}` };
}
