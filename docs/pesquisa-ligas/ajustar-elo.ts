// Uso: npx tsx docs/pesquisa-ligas/ajustar-elo.ts 120 3
// Joga todos os pares do CBLOL N vezes, estima a força de cada time no motor (Bradley-Terry, em pontos de Elo)
// e desloca os atributos do time para aproximar do Elo real (1 OVR ≈ 22 Elo). Repete R rodadas e imprime o deslocamento total.
import { runCalibration } from '../../src/game/calibrate';
import { LEAGUE } from '../../src/game/core';
const N = +(process.argv[2] || 120), R = +(process.argv[3] || 3);
const ELO: Record<string, number> = { los: 1706, furia: 1583, loud: 1543, red: 1487, pain: 1378, vks: 1368, fluxo: 1343, leviatan: 1266 };
const ids = Object.keys(ELO), mean = ids.reduce((a, k) => a + ELO[k], 0) / ids.length, total: Record<string, number> = Object.fromEntries(ids.map(k => [k, 0]));
const shift = (id: string, d: number) => LEAGUE.teams.find(t => t.id === id)!.roster.forEach(p => {
  (['laning', 'teamfight', 'map', 'mental', 'mechanics', 'farm'] as const).forEach(f => { p[f] = Math.max(1, Math.min(99, p[f] + d)); });
  Object.keys(p.tac).forEach(f => { p.tac[f] = Math.max(1, Math.min(99, p.tac[f] + d)); }); });
const exp = (a: string, b: string) => 1 / (1 + 10 ** ((ELO[b] - ELO[a]) / 400));
for (let r = 0; r <= R; r++) {
  const obs: [string, string, number][] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) obs.push([ids[i], ids[j], runCalibration(N, [ids[i], ids[j]]).values.aWin / 100]);
  const mae = obs.reduce((a, [x, y, w]) => a + Math.abs(w - exp(x, y)), 0) / obs.length * 100;
  // Bradley-Terry por gradiente, em escala de Elo, com a mesma média dos alvos
  const s: Record<string, number> = Object.fromEntries(ids.map(k => [k, mean]));
  for (let it = 0; it < 3000; it++) { const g: Record<string, number> = Object.fromEntries(ids.map(k => [k, 0]));
    for (const [x, y, w] of obs) { const p = 1 / (1 + 10 ** ((s[y] - s[x]) / 400)), e = Math.min(0.98, Math.max(0.02, w)) - p; g[x] += e; g[y] -= e; }
    ids.forEach(k => { s[k] += 20 * g[k]; }); const m = ids.reduce((a, k) => a + s[k], 0) / ids.length; ids.forEach(k => { s[k] += mean - m; }); }
  console.log(`rodada ${r}: erro médio ${mae.toFixed(1)} pontos · força no motor ${ids.map(k => `${k} ${Math.round(s[k])}`).join(', ')}`);
  if (r === R) break;
  ids.forEach(k => { const d = Math.round(0.8 * (ELO[k] - s[k]) / 22); if (d) { shift(k, d); total[k] += d; } });
  console.log('  deslocamento acumulado:', JSON.stringify(total));
}
