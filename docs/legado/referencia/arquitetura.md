# Arquitetura em detalhe

O `CLAUDE.md` tem o mapa curto; aqui está a descrição completa de cada arquivo de `src/game/` e `src/ui/`.

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
