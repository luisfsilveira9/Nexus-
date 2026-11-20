// Uso: npx tsx docs/pesquisa-ligas/curva-ovr.ts furia 600  (time contra a própria cópia com +k em todos os atributos)
import { runCalibration } from '../../src/game/calibrate';
import { LEAGUE, tById, teamOvr } from '../../src/game/core';
const base = process.argv[2] || 'furia', N = +(process.argv[3] || 600);
const KEYS = ['laning','teamfight','map','mental','mechanics','farm'] as const;
for (const k of [1,2,4,6,8,12,16]) {
  const t = structuredClone(tById(base)); t.id = base + 'X'; t.tag = 'X';
  t.roster.forEach(p => { p.id = t.id + '_' + p.role; KEYS.forEach(f => { (p as any)[f] += k; }); Object.keys(p.tac).forEach(f => { p.tac[f] += k; }); });
  LEAGUE.teams.push(t);
  const r = runCalibration(N, [base, t.id]);
  console.log(`+${k} (OVR ${teamOvr(tById(base))}→${teamOvr(t)}): time mais forte vence ${r.values.favWin.toFixed(1)}%  · duração ${r.values.dur.toFixed(1)} · abates ${r.values.kills.toFixed(1)}`);
  LEAGUE.teams.pop();
}
