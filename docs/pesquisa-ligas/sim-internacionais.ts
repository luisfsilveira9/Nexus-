// Uso: npx tsx docs/pesquisa-ligas/sim-internacionais.ts [torneio=W] [vezes=30]
// Simula o First Stand (F), o MSI (M) ou o Mundial (W) só com a IA (LOS e FURIA como brasileiros) e mostra quem ganha: as campanhas devem seguir o Elo.
import { allTeams } from '../../src/game/core';
import { loadMundo } from '../../src/game/mundo';
import { avancar, criarTorneio, TORNEIOS } from '../../src/game/torneio';
const id = (process.argv[2] || 'W') as 'F' | 'M' | 'W', N = +(process.argv[3] || 30);
const mundo = await loadMundo(), vit: Record<string, number> = {}, fin: Record<string, number> = {}; let jogos = 0, ms = 0;
for (let i = 0; i < N; i++) {
  const t0 = Date.now(), t = criarTorneio(id, mundo.times, ['los', 'furia']); avancar(t); ms += Date.now() - t0;
  if (!t.fim) throw new Error('torneio não terminou'); jogos = t.partidas.length; vit[t.campeao] = (vit[t.campeao] || 0) + 1; fin[t.vice] = (fin[t.vice] || 0) + 1;
}
const elo = Object.fromEntries(mundo.times.map(t => [t.id, t.elo]));
console.log(`${TORNEIOS[id]}: ${N} edições, ${jogos} séries por edição, ${(ms / N / 1000).toFixed(1)} s por edição`);
Object.entries(vit).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k.padEnd(6)} campeão ${String(n).padStart(3)}× · vice ${fin[k] || 0}× · Elo ${elo[k] ?? '—'}`));
console.log(`  (times: ${allTeams().length})`);
process.exit(0);
