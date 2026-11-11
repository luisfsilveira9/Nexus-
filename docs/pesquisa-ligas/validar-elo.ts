// Uso: npx tsx docs/pesquisa-ligas/validar-elo.ts 150 [--mundo]
// Compara a vitória no motor com a esperada pelo Elo real. Sem --mundo: os 28 pares do CBLOL. Com --mundo: também os pares com os 20 times
// dos internacionais (até 400 pontos de Elo de diferença; acima disso o esperado passa de 91% e a amostra pouco informa).
import { runCalibration } from '../../src/game/calibrate';
import { loadMundo } from '../../src/game/mundo';
const N = +(process.argv[2] || 150), MUNDO = process.argv.includes('--mundo');
const ELO: Record<string, number> = { los: 1706, furia: 1583, loud: 1543, red: 1487, pain: 1378, vks: 1368, fluxo: 1343, leviatan: 1266 }, br = new Set(Object.keys(ELO));
if (MUNDO) (await loadMundo()).times.forEach(t => { ELO[t.id] = t.elo; });
const ids = Object.keys(ELO), grupos: Record<string, [number, number]> = {};
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const [a, b] = ELO[ids[i]] >= ELO[ids[j]] ? [ids[i], ids[j]] : [ids[j], ids[i]]; if (ELO[a] - ELO[b] > 400) continue;
  const exp = 100 / (1 + 10 ** ((ELO[b] - ELO[a]) / 400)), got = runCalibration(N, [a, b]).values.aWin;
  const g = br.has(a) && br.has(b) ? 'CBLOL' : br.has(a) || br.has(b) ? 'mistos' : 'de fora', x = grupos[g] || (grupos[g] = [0, 0]); x[0] += Math.abs(got - exp); x[1]++;
  if (!MUNDO || g === 'mistos') console.log(`${a} x ${b}: Elo ${exp.toFixed(0)}% · motor ${got.toFixed(0)}%`);
}
for (const g in grupos) console.log(`${g}: erro médio absoluto ${(grupos[g][0] / grupos[g][1]).toFixed(1)} pontos em ${grupos[g][1]} pares`);
