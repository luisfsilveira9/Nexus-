// Ações de alto nível usadas pela interface: times, série, transmissão ao vivo e pós-jogo.
import { emit, G, LEAGUE, other, ROLES, SEASON, teamOf } from './core';
import { draft, nextGameSelection, recordSeriesResult, resetDraft, resetSeries, series } from './draft';
import { afterCommit, clearMatch, commitEvent, isMajor, isMinor, M, runToEnd, setupMatch, stepTime, type Res } from './match';
import type { Side, Team } from './types';
import type { WorldPlayer } from './mundo';
import { standings } from './league';

// modos de transmissão: Principais (padrão) pula lances menores e encurta o cartão; Completo mostra tudo no ritmo antigo;
// Só resultado mostra apenas o desfecho dos lances que importam. Nenhum modo muda a simulação: os mesmos sorteios na mesma ordem.
export type Mode = 'principais' | 'completo' | 'resultado';
export const MODES: [Mode, string, string][] = [
  ['principais', 'Principais', 'Lances de visão, placas e disputas sem vencedor vão direto para o log. Cartão de ~5 s.'],
  ['completo', 'Completo', 'Todos os lances, com preparação, habilidades e resultado. Cartão de ~9 s.'],
  ['resultado', 'Só resultado', 'Só o desfecho dos lances que importam, por ~1 s.'],
];
// duração de cada etapa a 1× (ms); 2× e 4× dividem. O tique (30 s de jogo sem lance) depende só da velocidade.
const PACE: Record<Mode, { setup: number; skills: number; result: number }> = {
  principais: { setup: 1500, skills: 2000, result: 1500 },
  completo: { setup: 3000, skills: 3000, result: 3000 },
  resultado: { setup: 0, skills: 0, result: 1200 },
};
const TICK: Record<number, number> = { 1: 1000, 2: 500, 4: 200 };
const pace = (st: 'tick' | 'setup' | 'skills' | 'result') => st === 'tick' ? TICK[live.speed] : Math.round(PACE[live.mode][st] / live.speed);
export const live = { speed: 1, mode: 'principais' as Mode, timer: 0 as ReturnType<typeof setTimeout> | 0, onFinish: null as null | (() => void) };

export function applyTeams(bo?: number, fearless?: boolean) {
  stopTimer(); resetSeries(bo ?? (series ? series.bo : 3), fearless ?? (series ? series.fearless : true)); resetDraft(); clearMatch();
}
export function pickTeam(side: 'user' | 'opp', id: string) {
  if (side === 'user') G.userId = id; else G.oppId = id;
  if (G.userId === G.oppId) { const o = LEAGUE.teams.find(t => t.id !== id)!.id; if (side === 'user') G.oppId = o; else G.userId = o; }
  applyTeams(); emit();
}
export function setFormat(bo: number, fearless: boolean) { applyTeams(bo, fearless); emit(); }
export function playMatch(h: string, a: string, bo: number) { G.userId = h; G.oppId = a; applyTeams(bo); emit(); }

// ---------- ao vivo ----------
function stopTimer() { if (live.timer) clearTimeout(live.timer); live.timer = 0; }
// mostra um lance: cartão completo, ou (Só resultado) aplica na hora e mostra só o desfecho
function present(R: Res) {
  const m = M!;
  if (live.mode === 'resultado') { commitEvent(R); m.card = { R, stage: 'result' }; afterCommit(onEnd); return pace('result'); }
  m.card = { R, stage: 'setup' }; return pace('setup');
}
// aplica um lance sem cartão (vai direto para o log)
function silent(R: Res | null) { if (R) commitEvent(R); afterCommit(onEnd); }
function loop() {
  const m = M; if (!m || m.over || !m.running) return;
  if (m.card) {
    if (m.card.stage === 'setup') { m.card.stage = 'skills'; emit(); live.timer = setTimeout(loop, pace('skills')); return; }
    if (m.card.stage === 'skills') {
      commitEvent(m.card.R); m.card.stage = 'result'; afterCommit(onEnd); emit();
      if (!m.over) live.timer = setTimeout(loop, pace('result'));
      return;
    }
    m.card = null;
  }
  const R = stepTime();
  if (R && (live.mode === 'completo' || !isMinor(R))) { const ms = present(R); emit(); if (!m.over) live.timer = setTimeout(loop, ms); return; }
  silent(R); emit();
  if (!m.over) live.timer = setTimeout(loop, pace('tick'));
}
export function startSim() {
  if (!draft.done) return false;
  if (!M || M.over) setupMatch();
  M!.running = true; stopTimer();
  if (M!.card) live.timer = setTimeout(loop, pace(M!.card.stage)); else loop();
  emit(); return true;
}
export function pauseSim() { if (!M) return; M.running = false; stopTimer(); emit(); }
export function setSpeed(s: number) { live.speed = s; emit(); }
export function setMode(md: Mode) { live.mode = md; emit(); }
// toque no cartão: passa para a próxima etapa sem esperar o tempo
export function advanceCard() { const m = M; if (!m || m.over || !m.running || !m.card) return; stopTimer(); loop(); }
// avança a partida (aplicando tudo no caminho) até o próximo lance importante e o mostra; continua rodando
export function nextMajor() {
  const m = M; if (!m || m.over || !draft.done) return;
  stopTimer();
  if (m.card) { if (!m.card.R.done) silent(m.card.R); m.card = null; }
  let g = 0, ms = 0;
  while (!m.over && g++ < 400) { const R = stepTime(); if (R && isMajor(R)) { ms = present(R); break; } silent(R); }
  if (!m.over) { m.running = true; live.timer = setTimeout(loop, ms || pace('tick')); }
  emit();
}
export function skipSim() {
  if (!draft.done) return;
  if (!M || M.over) setupMatch();
  M!.running = false; stopTimer(); runToEnd(onEnd); emit();
}

// ---------- pós-jogo ----------
const seasonOf = (p: Team['roster'][number]) => p.season || (p.season = { g: 0, w: 0, k: 0, d: 0, a: 0, nt: 0 });
export { seasonOf };
// chamados ao fim de cada partida jogada pela interface (não na calibração), depois de estatísticas e cansaço
export const endHooks: ((blueWon: boolean) => void)[] = [];
function onEnd() {
  const m = M!; stopTimer();
  const win: Side = m.bar > 0 ? 'blue' : 'red', blueWon = win === 'blue';
  recordSeriesResult(blueWon);
  (['blue', 'red'] as Side[]).forEach(sd => teamOf(sd).roster.forEach(p => {
    const s = m.stats[p.id], ss = seasonOf(p); if (!s) return;
    ss.g++; if (sd === win) ss.w++; ss.k += s.k; ss.d += s.d; ss.a += s.a; ss.nt += s.nota;
    p.energy = Math.max(0, p.energy - 12); p.stress = Math.max(0, Math.min(100, p.stress + (sd === win ? -5 : 8)));
  }));
  endHooks.forEach(f => f(blueWon));
  if (live.onFinish) setTimeout(live.onFinish, 900);
}
export function nextSeriesGame() {
  const lastWin: Side = M && M.bar > 0 ? 'blue' : 'red';
  nextGameSelection(lastWin); resetDraft(); clearMatch(); emit();
}
export function newSeries() { applyTeams(); emit(); }

export function teamSeason(t: Team) {
  const r = { w: 0, l: 0, gw: 0, gl: 0 };
  SEASON.splits.forEach(sp => { const x = standings(sp).find(y => y.id === t.id); if (x) { r.w += x.w; r.l += x.l; r.gw += x.gw; r.gl += x.gl; } });
  // time de fora (mundo.ts): não há séries no jogo; os mapas são os do titular que mais jogou em 2026
  if (!r.w && !r.l) { const p = (t.roster as Partial<WorldPlayer>[]).reduce((a, b) => (b.jogos || 0) > (a.jogos || 0) ? b : a); if (p.jogos) { r.gw = p.vit || 0; r.gl = p.jogos - r.gw; } }
  return r;
}
export const otherSide = other;
export const ROLES_ = ROLES;
