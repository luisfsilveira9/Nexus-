// Uso: npx tsx docs/pesquisa-ligas/validar-elo.ts 150  (cada par do CBLOL N vezes; compara a vitória no motor com a esperada pelo Elo)
import { runCalibration } from '../../src/game/calibrate';
import { LEAGUE } from '../../src/game/core';
const N = +(process.argv[2] || 150);
const ELO: Record<string, number> = { los: 1706, furia: 1583, loud: 1543, red: 1487, pain: 1378, vks: 1368, fluxo: 1343, leviatan: 1266 };
const ids = LEAGUE.teams.map(t => t.id).filter(id => id in ELO); let err = 0, n = 0;
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const [a, b] = ELO[ids[i]] >= ELO[ids[j]] ? [ids[i], ids[j]] : [ids[j], ids[i]];
  const exp = 100 / (1 + 10 ** ((ELO[b] - ELO[a]) / 400)), got = runCalibration(N, [a, b]).values.favWin;
  err += Math.abs(got - exp); n++; console.log(`${a} x ${b}: Elo ${exp.toFixed(0)}% · motor ${got.toFixed(0)}%`);
}
console.log(`erro médio absoluto: ${(err / n).toFixed(1)} pontos em ${n} pares`);
