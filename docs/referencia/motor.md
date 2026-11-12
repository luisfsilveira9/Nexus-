# Motor e calibração

Referência para quem for mexer em `match.ts`, `draft.ts`, `tactics.ts`, `core.ts` ou `data.ts`. A regra (calibrar e não alterar `TARGETS`) está no `CLAUDE.md`; aqui ficam os números e as fontes.

## Motor e calibração

- O motor é calibrado para ficar dentro das 14 faixas de `TARGETS`. Última calibração (escala mundial + tática relativa, 1000 partidas): 14 de 14; Barão (~79%) e 1º dragão (~59%) ficam perto da borda de baixo. O nível absoluto dos atributos quase não muda as métricas (14/14 de −35 a +10); o que muda é a diferença entre os times. Para conferir a força dos times contra o Elo real: `npx tsx docs/pesquisa-ligas/validar-elo.ts 150` (só CBLOL) ou com `--mundo` (pares com os 20 times de fora, ~4 min com 100 partidas). `runCalibration` devolve `aWin`, a vitória do primeiro time do par. Na última medição "ganks que só queimam Flash" (~26%) também ficou perto da borda de baixo.
- Depois de mexer em `match.ts`, `draft.ts`, `tactics.ts`, `core.ts` ou `data.ts`, rode a calibração com pelo menos 500 partidas. Não altere as faixas de `TARGETS` para passar: elas vêm de dados reais de 2026.
- Fonte das regras e números: pesquisa "League of Legends competitivo 2026 (Splits 1 e 2)" (Patch 26.1, gol.gg, Oracle's Elixir, LPL/ChainCC). Os spawns de dragão, Larvas e Arauto não foram confirmados em fonte primária; o do Barão (20:00) foi.
- Moral (`morale`) aparece na interface mas **não afeta a partida**. Energia e estresse afetam (via Condição). O nível dos jogadores vem do Elo real; o perfil (quais atributos são altos) continua estimado.
