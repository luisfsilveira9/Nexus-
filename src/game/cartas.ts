// Modo de cartas: coleção de jogadores reais em elos (Ferro → Desafiante), PdL, pacotes e o time montado a partir das cartas.
// O motor e o draft não mudam: montarTime() entrega um Team comum, com id "meu".
import { clamp, emit, G, LEAGUE, pOvr, ROLES, setTeam, subscribe, tById } from './core';
import { draft, series } from './draft';
import { M } from './match';
import { loadMundo, type Mundo, type WorldPlayer } from './mundo';
import { gravar, ler, pedirPersistencia, SAVE_V, type Owned, type Save } from './save';
import { applyTeams, endHooks } from './session';
import type { Role, Team } from './types';

export const MEU = 'meu';
export const ELOS = ['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Mestre', 'Grão-Mestre', 'Desafiante'];
export const REGRAS = { porElo: 1.2, pdlElo: 100, pdlVit: 15, pdlDer: 6, pdlRep: 50, ptsVit: 120, ptsDer: 50, descansoBanco: 20, descansoSerie: 30 };
// Do OVR real (pesquisa, Chovy 96) para o nível que o motor usa. O ajuste dos 28 times ao Elo real (etapa 2) mostrou que o motor
// separa os times mais do que 22 Elo por ponto quando eles estão longe: reta ajustada aos deslocamentos, erro de ~1,2 ponto.
export const nivel = (ovr: number) => ovr + 1.5 - 0.25 * Math.max(0, ovr - 59);
const delta = (ovr: number, elo: number) => nivel(ovr) - ovr - (9 - elo) * REGRAS.porElo;

export interface Ganho { k: string; nova: boolean; pdl: number; de: number; para: number }   // de/para: elo antes e depois
export interface Recompensa { venceu: boolean; pontos: number; ganhos: Ganho[]; fimSerie: boolean }
export const C = { save: null as Save | null, mundo: null as Mundo | null, ultima: null as Recompensa | null, falhaSave: false };

// ---------- cartas ----------
export const jogador = (k: string) => C.mundo!.porChave[k];
export const cartaDe = (k: string) => C.save?.cartas.find(c => c.k === k);
// jogador no nível da carta (elo 9 = nível cheio)
export const noElo = (k: string, elo: number, id = k): WorldPlayer => C.mundo!.montar(k, id, delta(jogador(k).ovr, elo));
const ovrCache: Record<string, number> = {};
export const cartaOvr = (k: string, elo: number) => ovrCache[k + elo] ??= pOvr(noElo(k, elo));
export const ehTitular = (k: string) => !!C.save && Object.values(C.save.tit).includes(k);
// PdL: a partir do Mestre os ganhos valem a metade; a cada 100 a carta sobe um elo; no Desafiante não há mais o que ganhar
function addPdl(o: Owned, n: number): Ganho {
  const de = o.elo; let ganho = 0;
  if (o.elo < 9) { ganho = o.elo >= 7 ? Math.ceil(n / 2) : n; o.pdl += ganho; while (o.pdl >= REGRAS.pdlElo && o.elo < 9) { o.pdl -= REGRAS.pdlElo; o.elo++; } if (o.elo === 9) o.pdl = 0; }
  return { k: o.k, nova: false, pdl: ganho, de, para: o.elo };
}
// carta nova entra em Ferro; repetida vira PdL na que você já tem
function ganharCarta(k: string): Ganho {
  const o = cartaDe(k); if (o) return addPdl(o, REGRAS.pdlRep);
  C.save!.cartas.push({ k, elo: 0, pdl: 0, en: 95, st: 22, mo: 80 }); return { k, nova: true, pdl: 0, de: 0, para: 0 };
}

// ---------- time ----------
const rosterDe = () => tById(MEU)?.roster ?? [];
// leva energia, estresse, moral e temporada dos titulares em campo para as cartas (a partida mexe nos jogadores do time)
function recolher() { const s = C.save; if (!s) return; rosterDe().forEach(p => { const o = cartaDe((p as WorldPlayer).chave); if (o) { o.en = p.energy; o.st = p.stress; o.mo = p.morale; o.s = p.season; } }); const t = tById(MEU); if (t?.tactics) s.tatica = t.tactics; }
export function montarTime(): Team {
  const s = C.save!, roster = ROLES.map(r => { const o = cartaDe(s.tit[r])!, p = noElo(o.k, o.elo, `${MEU}_${r}`); p.energy = o.en; p.stress = o.st; p.morale = o.mo; p.season = o.s; return p; });
  const t: Team = { id: MEU, name: s.clube.nome, tag: s.clube.tag, status: 'Seu clube', coach: '', budget: 0, chemistry: 80, roster, hue: s.clube.hue };
  if (s.tatica && roster.some(p => p.id === s.tatica!.shotcaller)) t.tactics = s.tatica;
  setTeam(t); return t;
}
export const adversarios = () => LEAGUE.teams.filter(t => t.id !== C.save?.clube.substitui);
// só dá para mexer na escalação antes do draft começar ou depois do fim da partida (os picks já foram feitos para quem está em campo)
export const podeEscalar = () => M ? M.over : draft.step === 0;
// põe a carta como titular da rota dela; devolve a função que desfaz
export function escalar(k: string): (() => void) | null {
  const s = C.save!, r = jogador(k).role, antes = s.tit[r]; if (!cartaDe(k) || antes === k || !podeEscalar()) return null;
  const troca = (x: string) => { recolher(); s.tit[r] = x; montarTime(); salvar(); emit(); };
  troca(k); return () => troca(antes);
}

// ---------- save ----------
export function salvar() { const s = C.save; if (!s) return; C.falhaSave = !gravar(s); }
let pend: ReturnType<typeof setTimeout> | 0 = 0;
subscribe(() => { if (G.modo !== 'cartas' || !C.save || pend) return; pend = setTimeout(() => { pend = 0; if (G.modo === 'cartas' && C.save) { recolher(); salvar(); } }, 800); });
export const temSave = () => ler();
function entrar(s: Save) { C.save = s; C.ultima = null; montarTime(); G.modo = 'cartas'; G.userId = MEU; G.oppId = adversarios().sort((a, b) => a.roster.reduce((x, p) => x + pOvr(p), 0) - b.roster.reduce((x, p) => x + pOvr(p), 0))[0].id; applyTeams(3, true); emit(); }
// continua o save do aparelho (ou um importado); false se não há save válido
export async function continuar(importado?: Save): Promise<boolean> { C.mundo = await loadMundo(); const s = importado ?? ler(); if (!s || !ROLES.every(r => s.cartas.some(c => c.k === s.tit[r]) && C.mundo!.porChave[s.tit[r]])) return false; s.cartas = s.cartas.filter(c => C.mundo!.porChave[c.k]); entrar(s); salvar(); return true; }
export const prepararMundo = async () => { C.mundo = await loadMundo(); };
// pacote inicial: uma carta por rota, sorteada na metade de baixo do CBLOL (por OVR real)
export function fundar(clube: Save['clube']): Ganho[] {
  const tit = {} as Record<Role, string>;
  ROLES.forEach(r => { const v = C.mundo!.jogadores.filter(p => p.liga === 'CBLOL' && p.role === r).sort((a, b) => a.ovr - b.ovr); tit[r] = v[Math.floor(Math.random() * Math.floor(v.length / 2))].chave; });
  const s: Save = { v: SAVE_V, criadoEm: Date.now(), salvoEm: 0, clube, cartas: [], tit, pontos: 0, vit: 0, der: 0, pacotes: 0, regioes: ['CBLOL'] };
  C.save = s; const g = ROLES.map(r => ganharCarta(tit[r])); pedirPersistencia(); salvar(); return g;
}
// depois de revelar o pacote inicial: entra no modo de cartas com o clube recém-fundado
export function abrirClube() { if (C.save) entrar(C.save); }
export function sair() { if (G.modo === 'cartas') { recolher(); salvar(); } G.modo = 'inicio'; G.userId = 'furia'; G.oppId = 'loud'; applyTeams(3, true); emit(); }
export function entrarClassico() { G.modo = 'classico'; G.userId = 'furia'; G.oppId = 'loud'; applyTeams(3, true); emit(); }

// ---------- pacotes ----------
export type TipoPacote = 'basico' | 'rota' | 'regiao';
export const PACOTES: Record<TipoPacote, { nome: string; preco: number; n: number; desc: string }> = {
  basico: { nome: 'Pacote básico', preco: 500, n: 3, desc: '3 cartas de qualquer rota, das regiões que você já liberou.' },
  rota: { nome: 'Pacote de rota', preco: 700, n: 3, desc: '3 cartas da rota que você escolher.' },
  regiao: { nome: 'Pacote de região', preco: 700, n: 3, desc: '3 cartas da região que você escolher.' },
};
// chance de cada jogador numa carta do pacote: peso 0,9^(OVR real − 50), entre os que o pacote aceita
export function chances(tipo: TipoPacote, alvo?: string): { p: WorldPlayer; chance: number }[] {
  const s = C.save!, v = C.mundo!.jogadores.filter(p => s.regioes.includes(p.liga) && (tipo !== 'rota' || p.role === alvo) && (tipo !== 'regiao' || p.liga === alvo));
  const w = v.map(p => 0.9 ** (p.ovr - 50)), tot = w.reduce((a, b) => a + b, 0);
  return v.map((p, i) => ({ p, chance: w[i] / tot })).sort((a, b) => b.chance - a.chance);
}
export function abrirPacote(tipo: TipoPacote, alvo?: string): Ganho[] | null {
  const s = C.save!, pk = PACOTES[tipo], ch = chances(tipo, alvo); if (s.pontos < pk.preco || !ch.length) return null;
  s.pontos -= pk.preco; s.pacotes++; recolher();
  const g = Array.from({ length: pk.n }, () => { let x = Math.random(); const c = ch.find(e => (x -= e.chance) <= 0) ?? ch[ch.length - 1]; return ganharCarta(c.p.chave); });
  montarTime(); salvar(); emit(); return g;
}

// ---------- fim de partida: PdL para quem jogou, pontos, descanso do banco e, ao fim da série, de todos ----------
endHooks.push(venceu => {
  const s = C.save; if (G.modo !== 'cartas' || !s || G.userId !== MEU) return;
  recolher();
  const ganhos = ROLES.map(r => addPdl(cartaDe(s.tit[r])!, venceu ? REGRAS.pdlVit : REGRAS.pdlDer)), pontos = venceu ? REGRAS.ptsVit : REGRAS.ptsDer;
  s.pontos += pontos; if (venceu) s.vit++; else s.der++;
  s.cartas.forEach(o => { const d = (ehTitular(o.k) ? 0 : REGRAS.descansoBanco) + (series.over ? REGRAS.descansoSerie : 0); if (d) { o.en = clamp(o.en + d, 0, 100); o.st = clamp(o.st - d / 2, 0, 100); } });
  C.ultima = { venceu, pontos, ganhos, fimSerie: series.over };
  // o time em campo acompanha as cartas (descanso e promoção) sem trocar os objetos que a partida encerrada ainda mostra
  const novo = ROLES.map(r => { const o = cartaDe(s.tit[r])!; return noElo(o.k, o.elo, `${MEU}_${r}`); });
  rosterDe().forEach((p, i) => { const o = cartaDe((p as WorldPlayer).chave)!; Object.assign(p, novo[i], { energy: o.en, stress: o.st, morale: o.mo, season: o.s }); });
  salvar();
});
