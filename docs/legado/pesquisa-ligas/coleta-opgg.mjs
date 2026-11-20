// Coleta única (11/11/2026): jogadores e estatísticas 2026 das ligas principais e internacionais pela API pública do op.gg esports.
// Uso: node docs/pesquisa-ligas/coleta-opgg.mjs <saida.json>
import { writeFileSync } from 'node:fs';
const URL='https://esports.op.gg/matches/graphql';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function q(query){for(let i=0;i<4;i++){try{const r=await fetch(URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query})});const j=await r.json();if(j.errors)throw new Error(JSON.stringify(j.errors).slice(0,300));await sleep(120);return j.data}catch(e){if(i===3)throw e;await sleep(1000*2**i)}}}
const LEAGUES={LCK:99,LPL:98,LEC:89,LCS:88,LCP:138,CBLOL:94,FirstStand:141,MSI:100,Worlds:96};
const out={coletadoEm:new Date().toISOString(),ligas:{}};
for(const [lg,id] of Object.entries(LEAGUES)){
  const d=await q(`query{ series(leagueId:"${id}", year:2026){ id name season tournaments { id name } } }`);
  const L=out.ligas[lg]={series:[]};
  for(const s of d.series){const S={id:s.id,season:s.season,torneios:[]};L.series.push(S);
    for(const t of s.tournaments){
      const m=await q(`query{ matchesByTournament(tournamentId:"${t.id}"){ status homeScore awayScore homeTeam{ id acronym name } awayTeam{ id acronym name } } }`);
      const teams={};const partidas=[];(m.matchesByTournament||[]).forEach(x=>{[x.homeTeam,x.awayTeam].forEach(tm=>{if(tm)teams[tm.id]=tm});if(x.homeTeam&&x.awayTeam&&x.status==='finished')partidas.push([x.homeTeam.acronym,x.awayTeam.acronym,x.homeScore,x.awayScore])});
      const T={id:t.id,nome:t.name,partidas,times:[]};S.torneios.push(T);
      for(const tm of Object.values(teams)){
        const p=await q(`query{ playersByTournamentAndTeam(tournamentId:"${t.id}", teamId:"${tm.id}"){ player{ id nickName firstName lastName nationality birthday } playerStat{ position games wins kda kills deaths assists dpm dtpm gpm cspm dpgr wardsPlaced firstBlood } } }`);
        T.times.push({id:tm.id,sigla:tm.acronym,nome:tm.name,jogadores:(p.playersByTournamentAndTeam||[]).filter(x=>x.playerStat&&x.playerStat.games>0).map(x=>({id:x.player.id,nick:x.player.nickName,nome:[x.player.firstName,x.player.lastName].filter(Boolean).join(' '),pais:x.player.nationality,nasc:x.player.birthday,...x.playerStat}))});
      }
      console.error(lg,s.id,t.name,Object.keys(teams).length,'times');
    }
  }
}
writeFileSync(process.argv[2],JSON.stringify(out));
