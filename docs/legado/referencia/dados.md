# Dados: op.gg, o mundo de 2026 e as imagens da Riot

Referência para quem for coletar dados de novo, regenerar atributos (`gerar-mundo.ts`), ajustar times ao Elo ou mexer em `ddragon.ts`.

## Dados reais (op.gg)

- Pools e maestria vêm do CBLOL 2026 Splits 1 e 2 (fase regular + playoffs), coletados uma única vez em 10/11/2026 e fixados em `proStats.ts` (jogos, vitórias, totais de K/D/A por campeão). O jogo nunca consulta a rede.
- Maestria = `0,60 + 0,37 × jogos/(jogos+3) × (0,5 + 0,5 × (vitórias+1)/(jogos+2))` (`masteryFromGames`): 1 jogo ≈ 0,66; muitos jogos com boa taxa ≈ 0,90; sempre acima de campeão fora do pool (≤ 0,60). Pools de 7 a 26 campeões.
- Nicks diferentes no op.gg: Curse (LOS) = "doom" (mesmo nome real); Strensh (Leviatán) = "Strange" (inferido por jogos e campeões).
- Como coletar de novo, se preciso: API GraphQL pública `https://esports.op.gg/matches/graphql` (introspecção desligada; as consultas estão nos bundles JS do site). CBLOL = liga 94; séries 2026: Cup 705, Split 1 715 (torneios 1389, 1388), Split 2 734 (1420, 1441). Consultas úteis: `championStatisticsBySerie(serieId, playerId)`, `playersByTournamentAndTeam(tournamentId, teamId)`, `series(leagueId, year)`. K/D/A vêm como média por jogo. Leaguepedia bloqueou por limite de uso; gol.gg não abriu; Oracle's Elixir tem Cloudflare.
- O rodapé da Liga credita Riot/Data Dragon e op.gg. Mantenha as duas menções.

## Dados do mundo (etapa 2 do roguelike)

Tudo em `docs/pesquisa-ligas/`; a ordem para refazer é coleta → gerar → ajustar → gerar.

- `jogadores-2026.json` (363 jogadores, estatísticas e OVR) e `pools-2026.json` (campeões por jogador, de `coleta-pools.mjs`; os 156 campeões vistos têm par no jogo). A contagem de jogos de `championStatisticsBySerie` difere da de `playersByTournamentAndTeam` para ~120 jogadores (ex.: Chovy 112 contra 100); o pool usa a primeira.
- `npx tsx docs/pesquisa-ligas/gerar-mundo.ts` escreve `src/game/mundo-dados.ts` e os atributos do CBLOL em `data.ts`. Método: o OVR dá o nível e a estatística dá o formato (z dentro da mesma liga e rota, ±6): rotas ← ouro e CS por minuto; luta ← abates + assistências; mapa ← sentinelas (e first blood no caçador); mental ← poucas mortes; mecânica ← KDA e dano; farm ← CS. A média de rotas, luta, mapa e mental é sempre o OVR. Táticos e estilos (`apt`) vêm das marcas e estilos dos campeões do pool, ponderados por jogos; agressividade ← abates + mortes; versatilidade ← variedade do pool. O molde por rota (quanto cada atributo fica acima ou abaixo do OVR) é lido dos titulares do CBLOL em `data.ts`.
- `npx tsx docs/pesquisa-ligas/ajustar-elo.ts 80 3 --gravar` joga os pares com até 400 de Elo de diferença entre os 28 times (~12 min) e soma o resultado a `deslocamentos.json`; rode `gerar-mundo.ts` de novo depois. Ajuste atual: Gen.G −8, BLG −7, HLE/IG/G2 −5, a maioria −4 a −2, MVK +3. Erro médio contra o Elo: CBLOL 4,4 · mistos 3,8 · de fora 4,3.
- **O OVR do time no jogo não é o OVR real dos jogadores:** a Gen.G aparece com 87 no amistoso (jogadores reais 94 a 96). No motor, a diferença de força cresce mais rápido que 22 Elo por OVR quando os times estão longe. Nas cartas isso foi resolvido mostrando o OVR da escala do jogo (`nivel()`, veja modo-cartas.md).
- No op.gg falta a data de nascimento de 237 jogadores, então não há idade. Shotcalling e os ocultos sem estatística ficam neutros (molde da rota) nos jogadores de fora.
- "Amistoso internacional" (Liga → Times, no fim da lista) troca só o adversário; o time do usuário continua sendo do CBLOL.

## Imagens da Riot (Data Dragon)

- `src/game/ddragon.ts` monta as URLs com a versão fixa `DDRAGON_VERSION` (ícones de campeão e `map11.png`, o minimapa oficial). Para atualizar as artes, troque a versão.
- O ID do Data Dragon vem do nome sem pontuação; as exceções estão em `DD_ID`. Campeão novo com nome irregular precisa entrar nesse mapa.
- Se a imagem falhar, `Ct` volta às iniciais e o minimapa volta ao desenho.
- Banner de vitória/derrota e placar são arte própria (o banner do cliente não está no Data Dragon, é em inglês e usa fonte da Riot; o placar das transmissões é da produção do CBLOL).
