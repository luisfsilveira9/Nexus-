// Uso: node docs/pesquisa-ligas/runs.cjs <ovr.json> <passo por elo> <runs> <multiplicador de PdL>
// Modelo de runs: CBLOL (Copa, Etapa 1, Etapa 2) → First Stand / MSI / Mundial. Cartas com elos Ferro..Desafiante.
const fs = require('fs'); const PL = JSON.parse(fs.readFileSync(process.argv[2]));
const OPT = { step: +(process.argv[3] || 1.2), runs: +(process.argv[4] || 40), N: 150, pdl: +(process.argv[5] || 1) };
const ROLES = ['top','jun','mid','adc','sup'], ELO_PER = 22;
const T = {}; PL.forEach(p => { (T[p.ultimo] = T[p.ultimo] || { sigla: p.ultimo, liga: p.liga, base: p.base }); });
const CBLOL = ['LOS','FUR','LLL','RED','PNG','VKS','FXW7','LEV'];
const FS = ['GEN','BFX','BLG','JDG','G2','LY','TSW'], MSI = ['HLE','T1','BLG','TES','G2','KC','LY','TL','TSW','DCG'];
const WORLDS = ['GEN','HLE','T1','DK','AL','BLG','TES','IG','TL','LY','C9','G2','MKOI','KC','TSW','CFO','MVK','LOS'];
const pGame = d => 1 / (1 + 10 ** (-d * ELO_PER / 400));
const bo = (d, n) => { const need = (n + 1) / 2; let w = 0, l = 0; const p = pGame(d); while (w < need && l < need) { if (Math.random() < p) w++; else l++; } return w === need; };
function jogador() {
  const col = {}; let pts = 0, games = 0, unlocked = new Set(['CBLOL']);
  const ovrOf = c => c.p.ovr - (9 - c.r) * OPT.step;
  const add = p => { const c = col[p.id]; if (c) { c.pdl += 50 * OPT.pdl; prom(c); } else col[p.id] = { p, r: 0, pdl: 0 }; };
  const prom = c => { while (c.pdl >= 100 && c.r < 9) { c.pdl -= 100; c.r++; } if (c.r === 9) c.pdl = 0; };
  // time inicial: 5 Ferro do CBLOL, metade de baixo, um por rota
  ROLES.forEach(r => { const pool = PL.filter(p => p.liga === 'CBLOL' && p.pos === r).sort((a, b) => a.ovr - b.ovr); add(pool[Math.floor(Math.random() * pool.length / 2)]); });
  const lineup = () => ROLES.map(r => Object.values(col).filter(c => c.p.pos === r).sort((a, b) => ovrOf(b) - ovrOf(a))[0]);
  const meu = () => lineup().reduce((a, c) => a + ovrOf(c), 0) / 5;
  const pack = () => { const pool = PL.filter(p => unlocked.has(p.liga)); const w = pool.map(p => 0.9 ** (p.ovr - 50)); const tot = w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < 3; k++) { let x = Math.random() * tot, i = 0; while ((x -= w[i]) > 0) i++; add(pool[i]); } };
  const jogo = (opp, n) => { const L = lineup(); const won = bo(meu() - T[opp].base, n); games += n === 1 ? 1 : n === 3 ? 2.5 : 3.8;
    L.forEach(c => { c.pdl += (won ? 15 : 6) * OPT.pdl; prom(c); }); pts += won ? 120 * (n > 1 ? 2 : 1) : 50; while (pts >= 500) { pts -= 500; pack(); } return won; };
  const split = () => { // 7 MD1 (todos x todos) + top 4 em MD5
    const tbl = CBLOL.map(t => ({ t, w: 0 })); const me = { t: 'EU', w: 0 }; tbl.push(me);
    for (const o of CBLOL) if (jogo(o, 1)) me.w++; else tbl.find(x => x.t === o).w++;
    for (let i = 0; i < CBLOL.length; i++) for (let j = i + 1; j < CBLOL.length; j++) { const a = tbl[i], b = tbl[j]; if (Math.random() < pGame(T[a.t].base - T[b.t].base)) a.w++; else b.w++; }
    tbl.sort((a, b) => b.w - a.w + Math.random() - 0.5); const pos = tbl.indexOf(me); if (pos > 3) return 0;
    const rivais = tbl.slice(0, 4).filter(x => x !== me).map(x => x.t).sort((a, b) => T[b].base - T[a].base);
    if (!jogo(rivais[2 - Math.min(pos, 2)] || rivais[0], 5)) return 3; return jogo(rivais[0], 5) ? 1 : 2; };
  const inter = (field, wins) => { for (let k = 0; k < wins; k++) { const o = field.sort(() => Math.random() - 0.5)[0]; if (!jogo(o, 5)) return false; } return true; };
  const marks = {}; const mk = (k, run) => { if (!marks[k]) marks[k] = { run, h: +(games * 6 / 60).toFixed(1), ovr: +meu().toFixed(1) }; };
  for (let run = 1; run <= OPT.runs; run++) {
    const cup = split(); if (cup === 1) { mk('1º título do CBLOL', run); FS.forEach(t => unlocked.add(T[t].liga)); mk('Chegou a um internacional', run); if (inter(FS.filter(t => T[t]), 3)) mk('Venceu o First Stand', run); }
    const s1 = split(); if (s1 === 1) { mk('1º título do CBLOL', run); MSI.forEach(t => unlocked.add(T[t].liga)); mk('Chegou a um internacional', run); if (inter(MSI.filter(t => T[t]), 4)) mk('Venceu o MSI', run); }
    const s2 = split(); if (s2 === 1 || s2 === 2) { WORLDS.forEach(t => unlocked.add(T[t].liga)); mk('Chegou ao Mundial', run); if (inter(WORLDS.filter(t => T[t] && t !== 'LOS'), 6)) mk('Campeão mundial', run); }
    if (run === 1) mk('fim da run 1', 1); if (run === 5) mk('fim da run 5', 5); if (run === 15) mk('fim da run 15', 15);
  }
  return marks;
}
const agg = {}; for (let i = 0; i < OPT.N; i++) { const m = jogador(); for (const k in m) (agg[k] = agg[k] || []).push(m[k]); }
const med = a => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
console.log(`PdL x${OPT.pdl} · passo por elo ${OPT.step} (Ferro = real −${(9 * OPT.step).toFixed(1)}), ${OPT.runs} runs por jogador, ${OPT.N} jogadores`);
for (const k of ['fim da run 1','fim da run 5','fim da run 15','1º título do CBLOL','Chegou a um internacional','Venceu o First Stand','Venceu o MSI','Chegou ao Mundial','Campeão mundial']) { const v = agg[k] || []; if (!v.length) { console.log(k.padEnd(26), 'ninguém'); continue; }
  console.log(k.padEnd(26), `${Math.round(100 * v.length / OPT.N)}% chegam · mediana run ${med(v.map(x => x.run))} · ${med(v.map(x => x.h))} h · OVR do time ${med(v.map(x => x.ovr))}`); }
