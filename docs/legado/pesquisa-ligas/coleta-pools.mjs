// Coleta única (11/11/2026): campeões jogados em 2026 por cada jogador de jogadores-2026.json, pela API pública do op.gg esports.
// Uso: node docs/pesquisa-ligas/coleta-pools.mjs  (grava pools-2026.json ao lado; ~1.500 consultas, alguns minutos)
// Cada jogador: id do op.gg, nome, nascimento e [campeão (nome no Data Dragon), jogos, vitórias, abates, mortes, assistências] somados nas séries da liga dele.
import { readFileSync, writeFileSync } from 'node:fs';
const DIR = new URL('.', import.meta.url).pathname, URL_ = 'https://esports.op.gg/matches/graphql', DD = '16.22.1';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function q(query) { for (let i = 0; i < 5; i++) { try { const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300)); await sleep(80); return j.data; } catch (e) { if (i === 4) throw e; await sleep(1000 * 2 ** i); } } }
const pool = async (items, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); })); };
const LEAGUES = { LCK: 99, LPL: 98, LEC: 89, LCS: 88, LCP: 138, CBLOL: 94 };
const players = JSON.parse(readFileSync(DIR + 'jogadores-2026.json', 'utf8'));
const dd = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${DD}/data/en_US/champion.json`)).json();
const byKey = Object.fromEntries(Object.values(dd.data).map(c => [c.key, c.name]));
const out = { coletadoEm: new Date().toISOString(), fonte: 'esports.op.gg', ddragon: DD, semId: [], campeaoDesconhecido: [], jogadores: {} };
for (const [lg, id] of Object.entries(LEAGUES)) {
  const series = (await q(`query{ series(leagueId:"${id}", year:2026){ id tournaments { id } } }`)).series;
  const found = {}; // nick → { id, nome, nasc, g }
  for (const s of series) for (const t of s.tournaments) {
    const m = await q(`query{ matchesByTournament(tournamentId:"${t.id}"){ homeTeam{ id } awayTeam{ id } } }`);
    const teams = [...new Set((m.matchesByTournament || []).flatMap(x => [x.homeTeam?.id, x.awayTeam?.id]).filter(Boolean))];
    await pool(teams, 4, async tm => {
      const p = await q(`query{ playersByTournamentAndTeam(tournamentId:"${t.id}", teamId:"${tm}"){ player{ id nickName firstName lastName birthday } playerStat{ games } } }`);
      for (const x of p.playersByTournamentAndTeam || []) { if (!x.playerStat?.games) continue; const k = x.player.nickName.toLowerCase(), f = found[k + '#' + x.player.id] || (found[k + '#' + x.player.id] = { nick: k, id: x.player.id, nome: [x.player.firstName, x.player.lastName].filter(Boolean).join(' '), nasc: x.player.birthday, g: 0 }); f.g += x.playerStat.games; }
    });
  }
  const mine = players.filter(p => p.liga === lg);
  await pool(mine, 4, async p => {
    const f = Object.values(found).filter(x => x.nick === p.nick.toLowerCase()).sort((a, b) => b.g - a.g)[0];
    if (!f) { out.semId.push(`${lg} ${p.nick}`); return; }
    const acc = {};
    for (const s of series) for (const c of (await q(`query{ championStatisticsBySerie(serieId:"${s.id}", playerId:"${f.id}"){ championId games wins kills deaths assists } }`)).championStatisticsBySerie || []) {
      const nm = byKey[c.championId]; if (!nm) { out.campeaoDesconhecido.push(`${lg} ${p.nick} ${c.championId} ${c.games}j`); continue; }
      const a = acc[nm] || (acc[nm] = [nm, 0, 0, 0, 0, 0]); a[1] += c.games; a[2] += c.wins; a[3] += c.kills * c.games; a[4] += c.deaths * c.games; a[5] += c.assists * c.games;
    }
    out.jogadores[`${lg}|${p.nick}`] = { id: f.id, nome: f.nome, nasc: f.nasc, jogosLista: f.g, pool: Object.values(acc).map(a => a.map(v => typeof v === 'number' ? Math.round(v) : v)).sort((a, b) => b[1] - a[1]) };
  });
  console.error(lg, mine.length, 'jogadores,', series.length, 'séries');
}
writeFileSync(DIR + 'pools-2026.json', JSON.stringify(out).replace(/("[A-Z]+\|)/g, '\n$1'));
console.error('sem id:', out.semId.length, '· campeões desconhecidos:', out.campeaoDesconhecido.length);
