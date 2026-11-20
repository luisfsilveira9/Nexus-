// Uso: node docs/pesquisa-ligas/ovr-mundial.mjs <jogadores.json> <saida.json>  (OVR = âncora LOS 74 + (Elo do time − 1706)/22 + desvio individual ±4)
import { readFileSync, writeFileSync } from 'node:fs';
const all = JSON.parse(readFileSync(process.argv[2]));
const ELO = {GEN:2157,BLG:2067,HLE:1957,T1:1933,IG:1930,DK:1919,NIP:1903,AL:1876,KT:1860,TES:1860,G2:1823,WE:1820,LGD:1809,LY:1809,KC:1808,JDG:1792,WB:1788,TL:1786,BFX:1783,BRO:1716,LOS:1706,DNS:1690,MKOI:1681,NS:1679,LNG:1666,EDG:1661,TT:1656,TSW:1646,VIT:1638,GX:1638,UP:1635,KRX:1630,Navi:1620,C9:1599,OMG:1584,FUR:1583,FNC:1582,LR:1568,FLY:1543,LLL:1543,CFO:1524,SR:1519,SK:1493,MVK:1490,RED:1487,SEN:1471,SHFT:1468,GAM:1449,DCG:1400,TH:1391,DSG:1387,PNG:1378,VKS:1368,FXW7:1343,LEV:1266};
const ANCHOR = { elo: 1706, ovr: 74 }, PER = 22; // 1 OVR ≈ 22 Elo (curva espelhada do motor)
const z = (arr, f) => { const m = arr.reduce((a, p) => a + f(p), 0) / arr.length, sd = Math.sqrt(arr.reduce((a, p) => a + (f(p) - m) ** 2, 0) / arr.length) || 1; return p => (f(p) - m) / sd; };
const out = [];
for (const lg of [...new Set(all.map(p => p.liga))]) for (const pos of ['top','jun','mid','adc','sup']) {
  const g = all.filter(p => p.liga === lg && p.pos === pos); if (!g.length) continue;
  const zk = z(g, p => p.kda), zd = z(g, p => -p.deaths), zc = pos === 'sup' ? z(g, p => p.assists) : z(g, p => p.dpgr), zg = pos === 'sup' ? z(g, p => p.wardsPlaced) : z(g, p => p.gpm);
  g.forEach(p => { p.comp = 0.35 * zk(p) + 0.25 * zc(p) + 0.2 * zg(p) + 0.2 * zd(p); });
}
// desvio individual relativo aos colegas de time (a força do time já está no Elo)
for (const p of all) { const mates = all.filter(q => q.ultimo === p.ultimo && q.liga === p.liga); const m = mates.reduce((a, q) => a + q.comp, 0) / mates.length;
  const elo = ELO[p.ultimo] ?? 1380, base = ANCHOR.ovr + (elo - ANCHOR.elo) / PER, ind = Math.max(-4, Math.min(4, 3 * (p.comp - m)));
  out.push({ ...p, elo, base: +base.toFixed(1), ind: +ind.toFixed(1), ovr: Math.round(base + ind), semElo: !(p.ultimo in ELO) }); }
out.sort((a, b) => b.ovr - a.ovr);
const fmt = p => `${String(p.ovr).padStart(3)} ${p.nick.padEnd(12)} ${p.pos} ${p.ultimo.padEnd(5)} ${p.liga.padEnd(5)} (time ${p.base}, indiv ${p.ind >= 0 ? '+' : ''}${p.ind}) ${p.g}j KDA ${p.kda.toFixed(1)}`;
console.log('TOP 30 MUNDO'); out.slice(0, 30).forEach(p => console.log(fmt(p)));
console.log('\nMELHOR POR ROTA'); for (const pos of ['top','jun','mid','adc','sup']) console.log(out.filter(p => p.pos === pos).slice(0, 5).map(p => `${p.nick}(${p.ultimo} ${p.ovr})`).join(', '));
console.log('\nCBLOL'); out.filter(p => p.liga === 'CBLOL').forEach(p => console.log(fmt(p)));
console.log('\nFaixas por liga (min–mediana–máx):'); for (const lg of ['LCK','LPL','LEC','LCS','LCP','CBLOL']) { const v = out.filter(p => p.liga === lg).map(p => p.ovr).sort((a, b) => a - b); console.log(lg, v[0], v[v.length >> 1], v.at(-1), `(${v.length})`); }
console.log('\nSem Elo:', [...new Set(out.filter(p => p.semElo).map(p => p.ultimo))].join(' '));
writeFileSync(process.argv[3], JSON.stringify(out.map(p => { const q = { ...p }; delete q.acc; return q; })));
