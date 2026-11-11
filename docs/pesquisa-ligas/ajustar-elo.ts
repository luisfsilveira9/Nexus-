// Uso: npx tsx docs/pesquisa-ligas/ajustar-elo.ts 120 3 [--gravar]
// Joga os pares de times (CBLOL + os 20 dos internacionais) com até 400 pontos de Elo de diferença, N vezes cada; estima a força de cada time
// no motor (Bradley-Terry, em pontos de Elo, ancorado na média do CBLOL) e desloca os atributos do time para aproximar do Elo real (1 OVR ≈ 22 Elo).
// Repete R rodadas. Com --gravar, soma o resultado a deslocamentos.json; depois rode gerar-mundo.ts para levar os números ao jogo.
import { readFileSync, writeFileSync } from 'node:fs';
import { runCalibration } from '../../src/game/calibrate';
import { tById } from '../../src/game/core';
import { loadMundo } from '../../src/game/mundo';
const N = +(process.argv[2] || 120), R = +(process.argv[3] || 3), FILE = new URL('deslocamentos.json', import.meta.url).pathname;
export const ELO_BR: Record<string, number> = { los: 1706, furia: 1583, loud: 1543, red: 1487, pain: 1378, vks: 1368, fluxo: 1343, leviatan: 1266 };
const W = await loadMundo(), ELO: Record<string, number> = { ...ELO_BR, ...Object.fromEntries(W.times.map(t => [t.id, t.elo])) };
const ids = Object.keys(ELO), br = Object.keys(ELO_BR), meanBr = br.reduce((a, k) => a + ELO[k], 0) / br.length, total: Record<string, number> = Object.fromEntries(ids.map(k => [k, 0]));
const shift = (id: string, d: number) => tById(id).roster.forEach(p => {
  (['laning', 'teamfight', 'map', 'mental', 'mechanics', 'farm'] as const).forEach(f => { p[f] = Math.max(1, Math.min(99, p[f] + d)); });
  Object.keys(p.tac).forEach(f => { p.tac[f] = Math.max(1, Math.min(99, p.tac[f] + d)); }); });
const exp = (a: string, b: string) => 1 / (1 + 10 ** ((ELO[b] - ELO[a]) / 400));
const pairs: [string, string][] = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (Math.abs(ELO[ids[i]] - ELO[ids[j]]) <= 400) pairs.push([ids[i], ids[j]]);
console.log(`${ids.length} times, ${pairs.length} pares, ${N} partidas por par`);
for (let r = 0; r <= R; r++) {
  const obs = pairs.map(([x, y]): [string, string, number] => [x, y, runCalibration(N, [x, y]).values.aWin / 100]);
  const mae = (f: (x: string, y: string) => boolean) => { const o = obs.filter(([x, y]) => f(x, y)); return (o.reduce((a, [x, y, w]) => a + Math.abs(w - exp(x, y)), 0) / o.length * 100).toFixed(1); };
  const isBr = (k: string) => k in ELO_BR;
  // Bradley-Terry por gradiente, em escala de Elo
  const s: Record<string, number> = { ...ELO };
  for (let it = 0; it < 4000; it++) { const g: Record<string, number> = Object.fromEntries(ids.map(k => [k, 0]));
    for (const [x, y, w] of obs) { const p = 1 / (1 + 10 ** ((s[y] - s[x]) / 400)), e = Math.min(0.98, Math.max(0.02, w)) - p; g[x] += e; g[y] -= e; }
    ids.forEach(k => { s[k] += 12 * g[k]; }); const m = br.reduce((a, k) => a + s[k], 0) / br.length; ids.forEach(k => { s[k] += meanBr - m; }); }
  console.log(`rodada ${r}: erro médio ${mae(() => true)} (CBLOL ${mae((x, y) => isBr(x) && isBr(y))}, mistos ${mae((x, y) => isBr(x) !== isBr(y))}, de fora ${mae((x, y) => !isBr(x) && !isBr(y))})`);
  console.log('  força no motor − Elo: ' + ids.map(k => `${k} ${Math.round(s[k] - ELO[k])}`).join(', '));
  if (r === R) break;
  ids.forEach(k => { const d = Math.round(0.8 * (ELO[k] - s[k]) / 22); if (d) { shift(k, d); total[k] += d; } });
  console.log('  deslocamento acumulado:', JSON.stringify(total));
}
if (process.argv.includes('--gravar')) { const cur = JSON.parse(readFileSync(FILE, 'utf8')); ids.forEach(k => { cur[k] = (cur[k] || 0) + total[k]; }); writeFileSync(FILE, JSON.stringify(cur)); console.log('gravado:', JSON.stringify(cur)); }
