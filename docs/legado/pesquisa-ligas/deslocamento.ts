// Uso: npx tsx docs/pesquisa-ligas/deslocamento.ts -11  (soma d a todos os atributos de todos os times e roda a calibração com 1000 partidas)
import { runCalibration, TARGETS } from '../../src/game/calibrate';
import { LEAGUE } from '../../src/game/core';
const d = +process.argv[2];
LEAGUE.teams.forEach(t => t.roster.forEach(p => { (['laning','teamfight','map','mental','mechanics','farm'] as const).forEach(f => { (p as any)[f] += d; }); Object.keys(p.tac).forEach(f => { p.tac[f] += d; }); }));
const r = runCalibration(1000);
console.log('deslocamento', d, TARGETS.map(t => { const v = r.values[t.key]; return `${t.key} ${v.toFixed(1)}${v >= t.lo && v <= t.hi ? '✓' : '✗'}`; }).join(' · '), '· favWin', r.values.favWin.toFixed(1));
