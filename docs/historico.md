# Histórico do projeto

O que já foi feito, por etapa e PR. Saiu do `CLAUDE.md` em 12/11/2026.

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
  - Etapa 4 feita (#19): a run (Copa, Etapa 1, Etapa 2 com mata-mata), 1 entre 3, entrosamento, domínio da tática, reservas, fim de run, PdL pelo rendimento, 500 pontos iniciais e ritmo medido.
- **Teste de ponta a ponta e correções de fluxo** (pedido do dono depois da etapa 3): ban já escolhido some da lista, folhas abrem no topo, retrato do jogador no lugar do campeão, assumir o adversário troca os dois times, escalação travada do draft ao fim da partida, nomes de campeão inteiros, alvos de toque de 44 px.
- Fora do plano e ainda não feito: coluna de aproveitamento na tabela da Liga, minimapa desenhado nas táticas, aba "Início" com o Motor indo para uma engrenagem.
