// Uso: node docs/pesquisa-ligas/agrega.mjs <opgg2026.json> <jogadores.json>  (agrega por jogador, médias por liga, recorde inter-regional)
import { readFileSync } from 'node:fs';
const D = JSON.parse(readFileSync(process.argv[2]));
const DOM = ['LCK','LPL','LEC','LCS','LCP','CBLOL'];
// agrega por jogador nas ligas nacionais 2026
const P = {};
for (const lg of DOM) for (const s of D.ligas[lg].series) for (const t of s.torneios) for (const tm of t.times) for (const j of tm.jogadores) {
  const k = j.id; const p = P[k] || (P[k] = { id: j.id, nick: j.nick, nome: j.nome, pais: j.pais, nasc: j.nasc, liga: lg, pos: j.position, g: 0, w: 0, acc: {}, times: {}, ultimo: '' });
  const g = j.games; p.g += g; p.w += j.wins; p.times[tm.sigla] = (p.times[tm.sigla] || 0) + g; p.ultimo = tm.sigla; p.liga = lg;
  for (const f of ['kda','kills','deaths','assists','dpm','dtpm','gpm','cspm','dpgr','wardsPlaced','firstBlood']) p.acc[f] = (p.acc[f] || 0) + (j[f] || 0) * g;
}
const all = Object.values(P).filter(p => p.g >= 10);
all.forEach(p => { for (const f in p.acc) p[f] = p.acc[f] / p.g; p.wr = p.w / p.g; p.kp = null; });
console.log('jogadores com 10+ jogos:', all.length, Object.fromEntries(DOM.map(l => [l, all.filter(p => p.liga === l).length])));
// médias por liga e posição
for (const lg of DOM) { const r = all.filter(p => p.liga === lg); console.log(lg.padEnd(6), 'KDA', (r.reduce((a,p)=>a+p.kda,0)/r.length).toFixed(2), 'DPM', Math.round(r.reduce((a,p)=>a+p.dpm,0)/r.length), 'GPM', Math.round(r.reduce((a,p)=>a+p.gpm,0)/r.length), 'CSPM', (r.reduce((a,p)=>a+p.cspm,0)/r.length).toFixed(2), 'mortes', (r.reduce((a,p)=>a+p.deaths,0)/r.length).toFixed(2)); }
// times internacionais: recorde por região
const recs = {};
const regiao = {}; for (const lg of DOM) for (const s of D.ligas[lg].series) for (const t of s.torneios) for (const tm of t.times) regiao[tm.sigla] = lg;
for (const ev of ['FirstStand','MSI','Worlds']) for (const s of D.ligas[ev].series) for (const t of s.torneios) for (const [h,a,hs,as] of t.partidas) {
  const rh = regiao[h], ra = regiao[a]; if (!rh || !ra || rh === ra) continue;
  for (const [r, w, l] of [[rh, hs, as], [ra, as, hs]]) { const x = recs[r] || (recs[r] = { sw: 0, sl: 0, gw: 0, gl: 0 }); x.gw += w; x.gl += l; if (w > l) x.sw++; else x.sl++; }
}
console.log('\nInter-regional 2026 (séries e jogos):'); for (const r in recs) { const x = recs[r]; console.log(r.padEnd(6), `séries ${x.sw}-${x.sl}`, `jogos ${x.gw}-${x.gl}`, `(${(100*x.gw/(x.gw+x.gl)).toFixed(0)}% dos jogos)`); }
// CBLOL internacional detalhado
console.log('\nSéries dos brasileiros:'); for (const ev of ['FirstStand','MSI','Worlds']) for (const s of D.ligas[ev].series) for (const t of s.torneios) for (const [h,a,hs,as] of t.partidas) if (regiao[h]==='CBLOL'||regiao[a]==='CBLOL') console.log(ev, t.nome, h, hs, 'x', as, a);
import { writeFileSync } from 'node:fs'; writeFileSync(process.argv[3], JSON.stringify(all));
