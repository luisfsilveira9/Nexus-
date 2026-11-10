// Roda N partidas sem interface e mede as distribuições contra os alvos do pro de 2026.
import { G, LEAGUE, teamOvr } from './core';
import { autoFinish, ensureFirstSelection, resetDraft, resetSeries, restoreDraftState, snapshotDraftState } from './draft';
import { M, restoreMatch, runToEnd, setupMatch, snapshotMatch } from './match';
import type { Side } from './types';

export interface Target { key: string; label: string; lo: number; hi: number; unit: string; src: string }
export const TARGETS: Target[] = [
  { key: 'dur', label: 'Duração média', lo: 31.5, hi: 34.5, unit: 'min', src: 'gol.gg 2026: 31:29 a 34:29' },
  { key: 'durSd', label: 'Desvio da duração', lo: 4, hi: 6.5, unit: 'min', src: 'faixa típica 22–50 min' },
  { key: 'kills', label: 'Abates por jogo', lo: 26, hi: 31, unit: '', src: 'gol.gg 2026: 26 a 31' },
  { key: 'ganks', label: 'Ganks por caçador até 15:00', lo: 3, hi: 5, unit: '', src: 'relatório: 3–5 (base LPL 3,5)' },
  { key: 'gKill', label: 'Ganks que viram abate', lo: 38, hi: 50, unit: '%', src: 'LPL: 43,6%' },
  { key: 'gFlash', label: 'Ganks que só queimam Flash', lo: 25, hi: 38, unit: '%', src: 'LPL: 32,7%' },
  { key: 'gCounter', label: 'Ganks com counter-gank', lo: 12, hi: 25, unit: '%', src: 'relatório: 15–25%' },
  { key: 'fb', label: 'Vitória com First Blood', lo: 55, hi: 65, unit: '%', src: 'LPL 2026: 60,3%' },
  { key: 'fd', label: 'Vitória com 1º dragão', lo: 54, hi: 64, unit: '%', src: 'LPL 2026: 58,9%' },
  { key: 'ft', label: 'Vitória com 1ª torre', lo: 60, hi: 71, unit: '%', src: 'LPL 2026: 65,6%' },
  { key: 'fbar', label: 'Vitória com 1º Barão', lo: 78, hi: 90, unit: '%', src: 'LPL 2026: 83,7%' },
  { key: 'gd15', label: 'Vitória à frente aos 15 min', lo: 66, hi: 80, unit: '%', src: 'arXiv: 72,8%' },
  { key: 'drakes', label: 'Dragões por jogo (total)', lo: 3.5, hi: 5.5, unit: '', src: 'CBLOL 2026: ~2,5 por time' },
  { key: 'barons', label: 'Barões por jogo (total)', lo: 0.8, hi: 1.5, unit: '', src: 'CBLOL 2026: ~1,0' },
];

export interface CalibResult { n: number; values: Record<string, number> }

export function runCalibration(n = 500, pairFixed?: [string, string]): CalibResult {
  const keepU = G.userId, keepO = G.oppId, keepD = snapshotDraftState(), keepM = snapshotMatch();
  const ids = LEAGUE.teams.map(t => t.id);
  let ftT = 0, ftN = 0, fav = 0, favN = 0;
  const durs: number[] = []; let kills = 0, drakes = 0, barons = 0;
  let gAtt = 0, gKill = 0, gFlash = 0, gCounter = 0;
  const firsts: Record<string, [number, number]> = { blood: [0, 0], dragon: [0, 0], tower: [0, 0], baron: [0, 0], gd15: [0, 0] };
  // energia/estresse não devem mudar durante a calibração
  const snap = LEAGUE.teams.map(t => t.roster.map(p => [p.energy, p.stress]));
  for (let i = 0; i < n; i++) {
    let a: string, b: string;
    if (pairFixed) [a, b] = pairFixed; else { a = ids[Math.floor(Math.random() * ids.length)]; do { b = ids[Math.floor(Math.random() * ids.length)]; } while (b === a); }
    G.userId = a; G.oppId = b;
    resetSeries(1, false); ensureFirstSelection(); resetDraft(); autoFinish(false);
    setupMatch(); runToEnd(() => {});
    const m = M!, win: Side = m.bar > 0 ? 'blue' : 'red';
    const ft = m.log.find(e => e.kind === 'tower' && e.html.includes('primeira torre'));
    if (ft) { ftT += ft.t / 60; ftN++; }
    const oa = teamOvr(G.user), ob = teamOvr(G.opp);
    if (oa !== ob) { favN++; if ((oa > ob) === (win === 'blue')) fav++; }
    durs.push(m.t / 60); kills += m.kills.blue + m.kills.red; drakes += m.drakes.blue + m.drakes.red; barons += m.barons.blue + m.barons.red;
    (['blue', 'red'] as Side[]).forEach(sd => { const g = m.gk[sd]; gAtt += g.att; gKill += g.kill; gFlash += g.flash; gCounter += g.counter; });
    (['blood', 'dragon', 'tower', 'baron'] as const).forEach(k => { const s = m.first[k]; if (s) { firsts[k][1]++; if (s === win) firsts[k][0]++; } });
    if (m.gd15 !== null && m.gd15 !== 0) { firsts.gd15[1]++; if ((m.gd15 > 0) === (win === 'blue')) firsts.gd15[0]++; }
  }
  restoreMatch(keepM); restoreDraftState(keepD);
  LEAGUE.teams.forEach((t, i) => t.roster.forEach((p, j) => { [p.energy, p.stress] = snap[i][j]; }));
  G.userId = keepU; G.oppId = keepO;
  const mean = durs.reduce((x, y) => x + y, 0) / n;
  const sd = Math.sqrt(durs.reduce((x, y) => x + (y - mean) ** 2, 0) / n);
  const nonCounter = gAtt - gCounter || 1;
  const pct = (k: string) => firsts[k][1] ? 100 * firsts[k][0] / firsts[k][1] : 0;
  return { n, values: {
    dur: mean, durSd: sd, kills: kills / n, ganks: gAtt / n / 2,
    gKill: 100 * gKill / nonCounter, gFlash: 100 * gFlash / nonCounter, gCounter: 100 * gCounter / (gAtt || 1),
    fb: pct('blood'), fd: pct('dragon'), ft: pct('tower'), fbar: pct('baron'), gd15: pct('gd15'),
    drakes: drakes / n, barons: barons / n, ftTime: ftN ? ftT / ftN : 0, favWin: favN ? 100 * fav / favN : 0,
  } };
}
