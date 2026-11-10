// Ações de alto nível usadas pela interface: times, série, transmissão ao vivo e pós-jogo.
import { emit, G, LEAGUE, other, ROLES, SEASON, teamOf } from './core';
import { draft, nextGameSelection, recordSeriesResult, resetDraft, resetSeries, series } from './draft';
import { afterCommit, clearMatch, commitEvent, M, runToEnd, setupMatch, stepTime } from './match';
import type { Side, Team } from './types';
import { standings } from './league';

export const PACE: Record<number, { tick: number; setup: number; skills: number; result: number }> = {
  1: { tick: 1000, setup: 3000, skills: 3000, result: 3000 }, 2: { tick: 500, setup: 1500, skills: 1500, result: 1500 }, 4: { tick: 200, setup: 650, skills: 650, result: 650 },
};
export const live = { speed: 1, timer: 0 as ReturnType<typeof setTimeout> | 0, onFinish: null as null | (() => void) };

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
function loop() {
  const m = M; if (!m || m.over || !m.running) return;
  const PC = PACE[live.speed];
  if (m.card) {
    if (m.card.stage === 'setup') { m.card.stage = 'skills'; emit(); live.timer = setTimeout(loop, PC.skills); return; }
    if (m.card.stage === 'skills') {
      commitEvent(m.card.R); m.card.stage = 'result'; afterCommit(onEnd); emit();
      if (!m.over) live.timer = setTimeout(loop, PC.result);
      return;
    }
    m.card = null;
  }
  const R = stepTime();
  if (R) { m.card = { R, stage: 'setup' }; emit(); live.timer = setTimeout(loop, PC.setup); }
  else { emit(); live.timer = setTimeout(loop, PC.tick); }
}
export function startSim() {
  if (!draft.done) return false;
  if (!M || M.over) setupMatch();
  M!.running = true; stopTimer();
  if (M!.card) live.timer = setTimeout(loop, PACE[live.speed][M!.card.stage]); else loop();
  emit(); return true;
}
export function pauseSim() { if (!M) return; M.running = false; stopTimer(); emit(); }
export function setSpeed(s: number) { live.speed = s; emit(); }
export function skipSim() {
  if (!draft.done) return;
  if (!M || M.over) setupMatch();
  M!.running = false; stopTimer(); runToEnd(onEnd); emit();
}

// ---------- pós-jogo ----------
const seasonOf = (p: Team['roster'][number]) => p.season || (p.season = { g: 0, w: 0, k: 0, d: 0, a: 0, nt: 0 });
export { seasonOf };
function onEnd() {
  const m = M!; stopTimer();
  const win: Side = m.bar > 0 ? 'blue' : 'red', blueWon = win === 'blue';
  recordSeriesResult(blueWon);
  (['blue', 'red'] as Side[]).forEach(sd => teamOf(sd).roster.forEach(p => {
    const s = m.stats[p.id], ss = seasonOf(p); if (!s) return;
    ss.g++; if (sd === win) ss.w++; ss.k += s.k; ss.d += s.d; ss.a += s.a; ss.nt += s.nota;
    p.energy = Math.max(0, p.energy - 12); p.stress = Math.max(0, Math.min(100, p.stress + (sd === win ? -5 : 8)));
  }));
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
  return r;
}
export const otherSide = other;
export const ROLES_ = ROLES;
