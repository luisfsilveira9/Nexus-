# Nexus eSports Manager

Manager de League of Legends ambientado no CBLOL 2026 (Splits 1 e 2, Patch 26.1). Projeto de fã, gratuito e sem fins comerciais, feito para estudar tecnologias novas. O dono escreve em português e joga principalmente pelo celular.

- Site: https://luisfsilveira9.github.io/Nexus-/ (GitHub Pages, publicado a cada push no `main`)
- Interface toda em pt-BR. Termos de LoL ficam em inglês quando é assim que a comunidade fala (gank, split push, Fearless, First Selection); os principais têm definição no glossário.

## Comandos

```bash
pnpm install --frozen-lockfile        # na nuvem o hook de SessionStart já roda isso
pnpm dev                              # Vite em http://localhost:5173
pnpm exec tsc -b                      # checagem de tipos
pnpm e2e [pasta-das-capturas]         # teste de ponta a ponta no Chromium de celular (~12 min nos dois tamanhos; sobe o Vite sozinho)
pnpm exec vite build --base ./        # build igual ao do deploy (~146 kB gzip no carregamento inicial; o aviso de __dirname é antigo)
pnpm lint                             # oxlint; 20 avisos antigos (fast refresh em common/Draft, imutabilidade em Draft/Partida/Liga)
```

Para ver a interface funcionando use a skill `rodar-nexus`; para mudanças no motor, a skill `calibrar-motor`.

## Arquitetura

React 19 + TypeScript + Vite + Tailwind 3.4. Sem roteador. O jogo abre numa **tela inicial com dois modos** (`G.modo`): **Clássico** (o jogo de sempre, sem persistência: recarregar reinicia) e **Cartas** (com save no `localStorage`; veja "Modo de cartas").

- `src/game/` é o jogo, sem React:
  - `core.ts`: estado global (`G.userId`/`G.oppId`), utilitários e uma store mínima (`subscribe`/`emit`). Toda mudança de estado termina em `emit()`. `LEAGUE.teams` são só os 8 do CBLOL; times de fora entram por `registerTeams` e `tById` acha os dois (`allTeams()` lista todos). Ids de jogador são montados na carga: `time_Rota` (ex.: `furia_Top`).
  - `data.ts`: campeões (`champions`, 173), times e jogadores (`LEAGUE`, 8 times × 5 titulares) e resultados dos splits (`SEASON`). Arquivo grande de dados em linha única por registro. Os atributos estão na **escala mundial** (LOS 72, FURIA 67, LOUD 64, RED 62, VKS 62, paiN 60, Fluxo 59, Leviatán 55). Os atributos dos 40 titulares **são gerados** por `docs/pesquisa-ligas/gerar-mundo.ts` (não edite à mão; veja "Dados do mundo"): o OVR exibido é o OVR de `jogadores-2026.json` mais o deslocamento do time em `deslocamentos.json`, ajustado até o motor reproduzir o Elo real (`ajustar-elo.ts`, erro médio ~4 pontos, o ruído da amostra). Por isso a ordem por OVR não é a ordem de força: pool e maestria também pesam. Maestria, personalidade, shotcalling e os ocultos sem estatística (consistência, jogos grandes, pressão) continuam os de antes.
  - `proStats.ts`: estatísticas reais por jogador e campeão (CBLOL 2026, Splits 1 e 2), cópia fixa coletada uma vez do op.gg; a `mastery` de `data.ts` vem daqui (veja "Dados reais").
  - `draft.ts`: série (melhor de N, Fearless, First Selection 2026), sequência oficial do draft, IA de picks e bans, `fitOf`/`masteryOf`/`offPoolPenalty`.
  - `match.ts`: motor da partida em ticks de 30 s. `CFG` tem os parâmetros calibrados e os valores oficiais do 26.1. `isMinor`/`isMajor` classificam lances só para a transmissão; `LogE` tem `big`/`minor`/`obj`/`k` (abates) só como rótulos.
  - `session.ts`: transmissão ao vivo. Modos `principais` (padrão, cartão ~5 s, pula visão/placas/contendas), `completo` (~9 s) e `resultado`; `advanceCard` (toque no cartão), `nextMajor` (próximo lance importante), `skipSim`. Nenhum modo muda os sorteios: a mesma semente dá o mesmo resultado.
  - `tactics.ts`: opções, encaixe (`TACT_FIT`), sugestão automática e `PRESETS` (4 estilos prontos; `presetFit` faz a média só das opções que o preset escolhe). O encaixe é **relativo ao nível do próprio time** (`teamLevel`): 75 = na média do elenco, para a tática funcionar em qualquer ponto da escala mundial.
  - `fmt.ts`: formatação pt-BR única (`num`, `nota`, `brl`, `pct`, `ouroK` = "12,3k", `kda` com "Perfeito" sem mortes). Não use `toFixed` para texto de tela.
  - `resumo.ts`: "Resumo da partida" (até 3 frases + no máximo 1 ação) e `motivoMVP`, por regras sobre dados que a partida já registra.
  - `glossario.ts`: definições curtas dos termos, escritas a partir das regras do próprio jogo.
  - `mundo.ts`: `loadMundo()` baixa `mundo-dados.ts` com `import()` dinâmico (35 kB gzip, fora do carregamento inicial), monta os 363 jogadores (`WorldPlayer`, no OVR real) e os 20 times dos internacionais (`WorldTeam`, com o deslocamento do time aplicado) e registra os times. `mundo-dados.ts` é **gerado**; não edite à mão.
  - `save.ts`, `cartas.ts` e `run.ts`: o modo de cartas e a run (veja as seções próprias). `session.ts` expõe `endHooks`, chamados ao fim de cada partida jogada pela interface (não na calibração).
  - `league.ts`, `calibrate.ts` (`TARGETS` + `runCalibration`), `ddragon.ts` (ícones e `mapImgUrl`).
- `src/ui/` são as telas:
  - `App.tsx`: com `G.modo === 'inicio'` mostra `Inicio.tsx`; no Clássico, aba ativa via hash (`#liga`, `#elenco`, `#partida`, `#motor`); no modo de cartas as abas são `#clube`, `#cartas`, `#loja`, `#partida` e `go('elenco')`/`openPlayer` caem no Clube. Página do jogador (só no Clássico) e página do jogador em `#elenco/<id>` (entra no histórico, o "voltar" do celular volta à lista). Na partida o cabeçalho global some e o placar faz o papel dele.
  - `Partida.tsx`: placar de 2 linhas fixo, abas Ao vivo (timers + minimapa com arte oficial + cartão; o mapa se ajusta à altura com `100dvh`) / Lances (Momentos, log com pesos e grupos de lances menores) / Gráficos (Vitória % ou Ouro, marcadores D/B/A) / Times; barra de controles discreta; folha de resultado com banner, resumo, barras de duas pontas, MVP com motivo e notas dos dez.
  - `Elenco.tsx`: lista com Condição e Moral rotuladas; página do jogador com faixa dos 5 titulares (toque ou deslize) e abas Resumo / Atributos (4 famílias, faixas Fraco/Regular/Bom/Elite, atributos-chave da rota com ★) / Campeões (5 principais + "ver todos", histórico real) / Temporada; ações com prévia e "Desfazer"; Táticas com presets e ajuste fino recolhido.
  - `Cartas.tsx` (carregado com `lazy`, ~9 kB gzip): `Fundacao`, `Revelar`, `Clube` (visões Temporada / Time / Táticas), `Colecao`, `Loja`, `Recompensas` (na folha de resultado), exportar/importar. `cond.ts`: `condicao`/`faixaCond`, usados no Elenco e no Clube.
  - `common.tsx`: `Ct`, `Crest`, `Sheet`, `Bar`, `ActionBar` (`compact`), `NotaBadge`, `Seg`; o aviso (`ui.toast`) aceita uma função de desfazer. `Termo.tsx`: `<Termo>` e `<ComTermos>` (glossário ao toque).
- `src/components/ui/` tem 45 componentes shadcn gerados, ainda não usados. Não edite à mão. O Popover foi testado para o glossário e descartado: somava ~33 kB gzip para uma caixa de uma frase.
- No código, `blue` é sempre o time do usuário e `red` o adversário, independente do lado do mapa (que fica em `series.mapSide`).
- Estilo do código existente: funções curtas e densas, muitas em uma linha. Siga o estilo do arquivo que estiver editando. Não mude o estado do jogo dentro de componente (o lint acusa); use uma função de módulo que aplica e devolve o "desfazer".

## Regras visuais (tokens)

Os tokens ficam no `:root` de `src/index.css`. O hook `check-tokens` avisa quando uma edição foge destas regras (ele lê "#aba" num comentário como cor hex; reescreva o comentário).

- **Cor de lado não é cor de significado.** `--side-blue`/`--side-red` só identificam os times. Para "bom/ruim" use `--positive`/`--negative`, e para notas e atributos a escala `--q-1` a `--q-5`. `--you` marca o time do usuário; `--warning` é alerta. Derrota usa tom de aço, não vermelho.
- **Dourado é o único acento** da marca (ação principal, aba ativa, seleção). Controles secundários (ex.: transmissão) ficam contornados, sem dourado.
- **Nada de hex solto** fora do `:root`: crie ou reutilize um token (`--map-red`, `--map-blue`, `--map-dead` são do minimapa desenhado).
- **Fontes:** seis tamanhos, `--fs-xs` 12 · `--fs-sm` 14 · `--fs-md` 16 · `--fs-lg` 18 · `--fs-xl` 22 · `--fs-2xl` 30. Nada abaixo de 12 px (em SVG, use viewBox ~300 de largura e fonte 12). Cinzel só em títulos grandes; números em `--f-num` com `tabular-nums`; o resto em Barlow. Barlow não tem "′": escreva "min".
- **Acessibilidade:** contraste de pelo menos 4,5:1 (nada de `opacity` em texto), alvos de toque de 44 px, nenhuma informação só por cor, animações desligadas com `prefers-reduced-motion`.
- Nomes de classe: confira se já existem antes de criar (`.mini` da ficha já quebrou um seletor novo; `.plan` do painel do plano espremia os campeões `.pc.plan` na grade do draft).
- **Jogador não é campeão:** nunca use o ícone de um campeão para representar um jogador; use `Retrato` (monograma com as iniciais do nick, em `common.tsx`).
- **Listas de escolha:** o que já foi escolhido em outra vaga some da lista (`Chooser` da estratégia) ou fica marcado e desabilitado (grade do draft). `Sheet` abre sempre no topo quando o conteúdo troca e devolve a rolagem ao voltar para a folha anterior. Trocar de aba encerra o aviso (`toast`) da tela anterior.

## Motor e calibração

- O motor é calibrado para ficar dentro das 14 faixas de `TARGETS`. Última calibração (escala mundial + tática relativa, 1000 partidas): 14 de 14; Barão (~79%) e 1º dragão (~59%) ficam perto da borda de baixo. O nível absoluto dos atributos quase não muda as métricas (14/14 de −35 a +10); o que muda é a diferença entre os times. Para conferir a força dos times contra o Elo real: `npx tsx docs/pesquisa-ligas/validar-elo.ts 150` (só CBLOL) ou com `--mundo` (pares com os 20 times de fora, ~4 min com 100 partidas). `runCalibration` devolve `aWin`, a vitória do primeiro time do par. Na última medição "ganks que só queimam Flash" (~26%) também ficou perto da borda de baixo.
- Depois de mexer em `match.ts`, `draft.ts`, `tactics.ts`, `core.ts` ou `data.ts`, rode a calibração com pelo menos 500 partidas. Não altere as faixas de `TARGETS` para passar: elas vêm de dados reais de 2026.
- Fonte das regras e números: pesquisa "League of Legends competitivo 2026 (Splits 1 e 2)" (Patch 26.1, gol.gg, Oracle's Elixir, LPL/ChainCC). Os spawns de dragão, Larvas e Arauto não foram confirmados em fonte primária; o do Barão (20:00) foi.
- Moral (`morale`) aparece na interface mas **não afeta a partida**. Energia e estresse afetam (via Condição). O nível dos jogadores vem do Elo real; o perfil (quais atributos são altos) continua estimado.

## Dados reais (op.gg)

- Pools e maestria vêm do CBLOL 2026 Splits 1 e 2 (fase regular + playoffs), coletados uma única vez em 10/11/2026 e fixados em `proStats.ts` (jogos, vitórias, totais de K/D/A por campeão). O jogo nunca consulta a rede.
- Maestria = `0,60 + 0,37 × jogos/(jogos+3) × (0,5 + 0,5 × (vitórias+1)/(jogos+2))` (`masteryFromGames`): 1 jogo ≈ 0,66; muitos jogos com boa taxa ≈ 0,90; sempre acima de campeão fora do pool (≤ 0,60). Pools de 7 a 26 campeões.
- Nicks diferentes no op.gg: Curse (LOS) = "doom" (mesmo nome real); Strensh (Leviatán) = "Strange" (inferido por jogos e campeões).
- Como coletar de novo, se preciso: API GraphQL pública `https://esports.op.gg/matches/graphql` (introspecção desligada; as consultas estão nos bundles JS do site). CBLOL = liga 94; séries 2026: Cup 705, Split 1 715 (torneios 1389, 1388), Split 2 734 (1420, 1441). Consultas úteis: `championStatisticsBySerie(serieId, playerId)`, `playersByTournamentAndTeam(tournamentId, teamId)`, `series(leagueId, year)`. K/D/A vêm como média por jogo. Leaguepedia bloqueou por limite de uso; gol.gg não abriu; Oracle's Elixir tem Cloudflare.
- O rodapé da Liga credita Riot/Data Dragon e op.gg. Mantenha as duas menções.

## Modo de cartas (etapa 3 do roguelike)

- **Save** (`save.ts`): JSON versionado em `localStorage['nexus.save']` (`SAVE_V`; para mudar o formato, suba a versão e ponha a função em `MIGR`). Guarda clube (nome, sigla, cor, time substituído), cartas (`Owned`: chave `liga|nick`, elo 0–9, PdL, energia, estresse, moral, temporada), os 5 titulares, pontos, V-D, regiões e tática. `cartas.ts` grava 0,8 s depois de qualquer `emit()` e ao fim de cada partida. Exportar/importar usa o código `NEXUS1.` + base64.
- **Escala das cartas (decisão do dono, 11/11/2026):** a carta mostra o OVR que vale na partida. `nivel(ovr) = ovr + 1,5 − 0,25 × max(0, ovr − 59)` leva o OVR da pesquisa ao nível do motor (reta ajustada aos deslocamentos dos 28 times, erro ~1,2): Chovy 96 → 88 em Desafiante e 77 em Ferro; o CBLOL quase não muda. Cada elo abaixo do Desafiante tira 1,2. As chances dos pacotes continuam usando o OVR da pesquisa.
- **Time:** `montarTime()` monta o `Team` de id `meu` com `Mundo.montar` e registra com `setTeam`; motor e draft não sabem que é um time de cartas. Com a mesma semente, o time de cartas em Desafiante dá o mesmo placar que o mesmo elenco montado direto. A escalação só muda fora de uma partida (`podeEscalar`).
- **Regras (`REGRAS` e `PACOTES`), pedidas pelo dono em 12/11/2026:** clube novo nasce com 500 pontos; vitória 250 pontos, derrota 150 (um pacote básico a cada 2 ou 3 partidas). PdL por titular = base (15 na vitória, 6 na derrota) + 3 por ponto de nota acima ou abaixo da **média dos cinco titulares**, mínimo 1; na vitória, o melhor do time leva +5. Comparar com a nota absoluta não funcionou: numa derrota feia todos caíam no mínimo. Repetida +50 PdL; 100 PdL por elo; metade dos ganhos a partir do Mestre. Pacotes de 3 cartas: básico 500, de rota 700, de região 700 (travado enquanto só há CBLOL). Quem está fora do time recupera 20 de energia por partida; ao fim da série todos recuperam 30.
- **Os times da liga voltam à condição de fábrica antes de cada jogo** (`descansarLiga`). A partida cansa os dois times, e sem isso os adversários iam ficando exaustos ao longo da run (o clube ganhava muito mais do que o OVR justificava).
- Não há amistosos no modo de cartas: pontos e PdL só vêm dos jogos da run. Treino, psicólogo e stream do Clássico não existem nele.
- Para testar a lógica sem navegador: `prepararMundo()`, `fundar(...)`, `abrirClube()`, `aplicarEscolha()`, `skipSim()`, `aposSerie()` e `seguirRun()` funcionam em Node (sem `localStorage`, o save só não grava). `docs/pesquisa-ligas/ritmo-runs.ts` é um exemplo completo.

## A run (etapa 4 do roguelike)

- **Estado** (`RunState` em `run.ts`, guardado em `save.run`; save na versão 2, com migração da 1): run `n`, `etapa` (0 Copa, 1 Etapa 1, 2 Etapa 2), `fase` (`escolha` → `regular` → `playoffs` → `fimEtapa` → … → `fim`), calendário (`jogos`, 7 rodadas de 4), `semi`, `final`, reforços, entrosamento, domínio e histórico. `run.ts` só mexe no save; `cartas.ts` liga a run às cartas e à partida.
- **Formato:** todos contra todos em MD1 e mata-mata dos 4 primeiros em MD5 (1º × 4º, 2º × 3º). Os jogos entre os outros times saem de `simJogo` (draft automático + motor até o fim, preservando `G`, draft, série e partida como a calibração faz). Desempate: confronto direto.
- **Ligação com a partida:** `jogoAtual` diz adversário e formato; `prepararJogo` aponta a aba Partida para ele. O gancho de fim de partida chama `registrarSerie` quando a série acaba (simula o resto da rodada ou da chave). "Continuar a temporada" (`aposSerie`) prepara o próximo jogo. Sem jogo marcado, a aba Partida mostra um aviso. Nas opções do draft o formato fica travado.
- **1 entre 3** (`ESCOLHAS`, aplicadas em `aplicarEscolha`): antes de cada etapa. Bootcamp, Scrims, Analista, Psicólogo, Preparador físico, Patrocínio, Treinador de SoloQ, Olheiro (pacote de rota grátis).
- **Entrosamento e domínio da tática** entram no motor por `Team.bonus` (somado às rolagens em `rollSide`; ausente = 0, então os times do CBLOL e a calibração não mudam). Entrosamento: começa em 30, +4 por jogo com os mesmos cinco, −8 por titular trocado, +5 por carta do mesmo time real; 50 é neutro e o efeito vai de −1 a +1. Domínio: +1 por jogo com a mesma tática (plano, selva, rotas, meio), até 10 = +0,8.
- **Reservas:** até 3 (`save.reservas`, marcadas na folha da carta). Entre os jogos de uma série só elas podem entrar (`emSerie`, `podeEntrar`); quem sai herda a vaga de reserva.
- **Fim de etapa e de run:** prêmios 1.500 / 900 / 500 / 200 (campeão, vice, semifinal, fora). Campeão da Copa ou da Etapa 1, e campeão ou vice da Etapa 2, ganham a vaga no First Stand, MSI ou Mundial (registrada em `recordes.vagas`; os torneios são a etapa 5) e as regiões já são liberadas na Loja. Entre runs ficam cartas, elos, PdL, pontos e regiões; recomeçam tabela, condição, entrosamento, domínio e reforços. Dá para abandonar a run.
- **Ritmo medido** (`npx tsx docs/pesquisa-ligas/ritmo-runs.ts 24 7`, ~5 min; joga runs inteiras com um jogador automático): primeira vaga internacional com mediana na 4ª run; 15 de 24 contas entre a 3ª e a 5ª, 3 antes, 4 depois, 2 sem vaga em 7 runs. OVR do time ao fim de cada run: 55, 60, 64, 67, 70. O script aceita `REGRAS='{...}' PREMIOS='{...}' PRECO=...` para testar outros valores.
- **Limite conhecido:** a série em andamento não é salva. Recarregar no meio de uma partida ou de uma MD5 recomeça a série do zero, o que permite refazer um jogo que ia mal.

## Dados do mundo (etapa 2 do roguelike)

Tudo em `docs/pesquisa-ligas/`; a ordem para refazer é coleta → gerar → ajustar → gerar.

- `jogadores-2026.json` (363 jogadores, estatísticas e OVR) e `pools-2026.json` (campeões por jogador, de `coleta-pools.mjs`; os 156 campeões vistos têm par no jogo). A contagem de jogos de `championStatisticsBySerie` difere da de `playersByTournamentAndTeam` para ~120 jogadores (ex.: Chovy 112 contra 100); o pool usa a primeira.
- `npx tsx docs/pesquisa-ligas/gerar-mundo.ts` escreve `src/game/mundo-dados.ts` e os atributos do CBLOL em `data.ts`. Método: o OVR dá o nível e a estatística dá o formato (z dentro da mesma liga e rota, ±6): rotas ← ouro e CS por minuto; luta ← abates + assistências; mapa ← sentinelas (e first blood no caçador); mental ← poucas mortes; mecânica ← KDA e dano; farm ← CS. A média de rotas, luta, mapa e mental é sempre o OVR. Táticos e estilos (`apt`) vêm das marcas e estilos dos campeões do pool, ponderados por jogos; agressividade ← abates + mortes; versatilidade ← variedade do pool. O molde por rota (quanto cada atributo fica acima ou abaixo do OVR) é lido dos titulares do CBLOL em `data.ts`.
- `npx tsx docs/pesquisa-ligas/ajustar-elo.ts 80 3 --gravar` joga os pares com até 400 de Elo de diferença entre os 28 times (~12 min) e soma o resultado a `deslocamentos.json`; rode `gerar-mundo.ts` de novo depois. Ajuste atual: Gen.G −8, BLG −7, HLE/IG/G2 −5, a maioria −4 a −2, MVK +3. Erro médio contra o Elo: CBLOL 4,4 · mistos 3,8 · de fora 4,3.
- **O OVR do time no jogo não é o OVR real dos jogadores:** a Gen.G aparece com 87 no amistoso (jogadores reais 94 a 96). No motor, a diferença de força cresce mais rápido que 22 Elo por OVR quando os times estão longe. As cartas da etapa 3 usam o OVR real; é preciso decidir como conciliar.
- No op.gg falta a data de nascimento de 237 jogadores, então não há idade. Shotcalling e os ocultos sem estatística ficam neutros (molde da rota) nos jogadores de fora.
- "Amistoso internacional" (Liga → Times, no fim da lista) troca só o adversário; o time do usuário continua sendo do CBLOL.

## Imagens da Riot (Data Dragon)

- `src/game/ddragon.ts` monta as URLs com a versão fixa `DDRAGON_VERSION` (ícones de campeão e `map11.png`, o minimapa oficial). Para atualizar as artes, troque a versão.
- O ID do Data Dragon vem do nome sem pontuação; as exceções estão em `DD_ID`. Campeão novo com nome irregular precisa entrar nesse mapa.
- Se a imagem falhar, `Ct` volta às iniciais e o minimapa volta ao desenho.
- Banner de vitória/derrota e placar são arte própria (o banner do cliente não está no Data Dragon, é em inglês e usa fonte da Riot; o placar das transmissões é da produção do CBLOL).

## Deploy

`.github/workflows/deploy.yml` gera o build com `--base ./` (o site vive em `/Nexus-/`) e publica no GitHub Pages a cada push no `main` ou manualmente pela aba Actions. É gratuito porque o repositório é público e usa o executor padrão `ubuntu-latest`; não troque por executores maiores, que são cobrados.

## Sessões na nuvem e testes

- **Teste de ponta a ponta (`e2e/e2e.cjs`, `pnpm e2e`):** joga como um usuário em 360×640 e 360×700, nos dois modos (Liga, Elenco, estratégia de picks e bans, draft manual, partida, série com Fearless, Motor, fundar clube, a run com reforço, rodadas, mata-mata MD5, reservas, fim de run e migração de save antigo, loja, coleção, save). São ~870 verificações de fluxo e seleção (um só item marcado, escolhido some da lista, folha abre no topo, "voltar" funciona, desfazer devolve o estado) e uma auditoria de layout por tela (rolagem lateral, elemento para fora, fim do conteúdo atrás das barras fixas). "FALHA" derruba o teste; "aviso" lista texto com reticências, botão coberto e alvo de toque menor que 44 px. Rode antes do merge de qualquer mudança de interface e acrescente verificações quando criar tela ou corrigir defeito de fluxo. `--so 360x640` roda um tamanho só; `--url` usa um servidor já no ar.
- Armadilhas ao escrever verificações: `innerText` devolve o texto já em maiúsculas quando o CSS usa `text-transform` (use `textContent`); logo depois de recarregar, o Chromium pode ignorar a primeira rolagem por script; o primeiro `span` de um botão de campeão é o ícone (`.ct`), não o nome.

- `ddragon.leagueoflegends.com` às vezes abre e às vezes não; a skill `rodar-nexus` simula as imagens (ou use `--imagens-reais`). `github.io` e `docs.github.com` costumam estar bloqueados.
- O usuário está no celular (~360×650–700 visíveis, navegador interno com barra que aparece e some): links `localhost` não abrem para ele. Teste layouts em 360×640 e 360×700 e meça com Playwright (posições, conteúdo cortado, sobreposição com a barra de controles) usando só amostras com a partida rodando; uma amostra do fim do jogo engana.
- Para provar que algo não muda a simulação: semente fixa (`Math.random` semeado) e compare placar/tempo final entre caminhos.
- Scripts temporários de Playwright precisam ficar em `.claude/skills/rodar-nexus/` para achar o `playwright`; apague-os depois.

## Jeito de trabalhar com o dono

- Cadência: um commit por bloco, um PR por etapa. Ele testa no celular depois do merge e responde com o que achou (às vezes com vídeo: extraia quadros com `ffmpeg`).
- **Merge automático (autorizado pelo dono em 11/11/2026):** ao fim de cada etapa, abra o PR e faça o merge no `main` você mesmo, sem esperar por ele. Antes do merge: `tsc -b`, `pnpm lint` sem avisos novos, build igual ao do deploy e, se mexeu no motor, calibração com 500+ partidas em 14/14. Se algo falhar, não faça o merge; avise. Lembre que o merge publica o site.
- Depois do merge, recomece o branch designado a partir do `main`. Branch novo (ex.: PR separado) só com permissão dele.
- Descrições de PR em português; mensagens de commit em inglês (imperativo + corpo explicando o porquê).
- Respostas curtas, em português simples, dizendo o que mudou para quem joga; ressalvas e erros meus ditos com clareza.

## Histórico

- **UI/UX (concluído, 6 etapas do plano em `docs/pesquisa-uiux/relatorio.md`):**
  1. Tokens de cor e fonte (PR #1; o #2 configurou o Claude Code no repositório: hooks, skills e agentes).
  2. Condição e moral rotuladas, `NotaBadge`, pílulas V/D, temporada no perfil, `fmt.ts` (#3).
  3. Partida: placar de 2 linhas, controles na barra, mapa descoberto com arte oficial, abas, banner de fim de jogo, aba Ao vivo que cabe na tela, cartão curto (#4/#5).
  4. Modos de transmissão, próximo lance importante, log com pesos, Momentos, marcadores no gráfico (#6).
  5. Página do jogador, atributos por família, ações com prévia e desfazer, presets de tática (#7).
  6. Resumo da partida, MVP com motivo, barras de duas pontas, glossário ao toque (#10).
- **Dados reais:** pools e maestria do op.gg (#8) e aba Campeões adaptada a pools grandes (#9).
- **Modo roguelike com cartas (em andamento, plano em `docs/plano-roguelike.md`):**
  - Pesquisas: cartas e economia (#12) e ligas do mundo, OVR global e runs (#13).
  - Etapa 1 feita (#14): tática relativa ao time e CBLOL na escala mundial ajustado ao Elo real.
  - Etapa 2 feita (#16): pools dos 363 jogadores, atributos pelo perfil estatístico (CBLOL incluído), 20 times dos internacionais ajustados ao Elo e "Amistoso internacional".
  - Etapa 3 feita (#17): tela inicial com dois modos, save versionado com exportar/importar, cartas em 10 elos, PdL, pacotes, Clube, Cartas e Loja.
  - Etapa 4 feita: a run (Copa, Etapa 1, Etapa 2 com mata-mata), 1 entre 3, entrosamento, domínio da tática, reservas, fim de run, PdL pelo rendimento, 500 pontos iniciais e ritmo medido.
- **Teste de ponta a ponta e correções de fluxo** (pedido do dono depois da etapa 3): ban já escolhido some da lista, folhas abrem no topo, retrato do jogador no lugar do campeão, assumir o adversário troca os dois times, escalação travada do draft ao fim da partida, nomes de campeão inteiros, alvos de toque de 44 px.
- Fora do plano e ainda não feito: coluna de aproveitamento na tabela da Liga, minimapa desenhado nas táticas, aba "Início" com o Motor indo para uma engrenagem.

## Próxima etapa: modo roguelike com cartas

**Leia `docs/plano-roguelike.md` antes de começar.** Ele registra tudo o que foi combinado e o passo a passo das etapas 2 a 6. A próxima é a **etapa 5 (internacionais)**: First Stand, MSI e Mundial com os times reais, para quem tem a vaga registrada em `recordes.vagas`, e a tela da chave e do Suíço.

Resumo do combinado (detalhes e números no plano):

- **Visão:** começar com o time mais fraco do CBLOL (cartas de jogadores reais em elo baixo) e, run após run, vencer o CBLOL, chegar aos internacionais entre os piores e, no fim, ao Mundial. O objetivo da coleção são os jogadores de maior OVR (Gen.G, BLG...).
- **Decisões do dono:** o melhor jogador é quem tem o maior OVR calculado (o Faker era só um exemplo; nada de traço de "Lenda"); só jogadores reais de 2026; cartas com os 10 elos do LoL; sair do CBLOL para os internacionais em **3 a 5 runs**; seguir as etapas em ordem; nada à venda.
- **Escala:** 1 OVR ≈ 22 Elo. O CBLOL do jogo ficou em LOS 71 … Leviatán 55 (a pesquisa propunha LOS 74; o ajuste ao Elo pelo motor baixou um pouco). Melhores do mundo: 93 a 96.
- **Cartas:** Desafiante = OVR real, −1,2 por elo (Ferro = −10,8); sobem com PdL (100 por elo; vitória +15, derrota +6, repetida +50, metade a partir do Mestre); saem do pacote em Ferro, com chance ∝ `0,9^(OVR−50)`.
- **Run:** temporada 2026 com Copa → First Stand, Etapa 1 → MSI, Etapa 2 (1º e 2º) → Mundial. Seu time substitui um time real escolhido. Entre runs ficam cartas, elos e regiões liberadas (CBLOL no começo; LCS, LEC e LCP ao chegar ao First Stand ou ao MSI; LCK e LPL ao chegar ao Mundial).
- **Padrões adotados, revisáveis:** modo Clássico mantido ao lado do novo; perder rende pontos; treino no modo de cartas não sobe atributo permanente.

O que já existe e importa:

- Só o modo de cartas tem persistência; no Clássico tudo se perde ao recarregar.
- No Clássico o usuário só escolhe um time existente (`pickTeam`); no modo de cartas ele funda um clube no lugar de um time. Ainda não há calendário. `SEASON` tem os resultados reais fixos dos splits e a tabela vem deles.
- Já existem: orçamento (`budget`, só o Stream mexe), entrosamento (`chemistry`, fixo e **não lido pelo motor**), energia/estresse (afetam a partida), moral (só visual), estatísticas de temporada por jogador, ações de treino que sobem atributos.
- Jogadores no jogo: os 40 titulares do CBLOL em `data.ts` e os 363 do mundo (CBLOL incluído, no OVR real) em `mundo.ts`, carregados sob demanda.
