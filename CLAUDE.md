# Nexus eSports Manager

Manager de League of Legends ambientado no CBLOL 2026 (Splits 1 e 2, Patch 26.1). Projeto de fã, gratuito e sem fins comerciais, feito para estudar tecnologias novas. O dono escreve em português e joga principalmente pelo celular.

- Site: https://luisfsilveira9.github.io/Nexus-/ (GitHub Pages, publicado a cada push no `main`)
- Interface toda em pt-BR. Termos de LoL ficam em inglês quando é assim que a comunidade fala (gank, split push, Fearless, First Selection).

## Comandos

```bash
pnpm install --frozen-lockfile        # na nuvem o hook de SessionStart já roda isso
pnpm dev                              # Vite em http://localhost:5173
pnpm exec tsc -b                      # checagem de tipos (não há suíte de testes)
pnpm exec vite build --base ./        # build igual ao do deploy
pnpm lint                             # oxlint; 2 avisos antigos em src/ui/Partida.tsx
```

Para ver a interface funcionando use a skill `rodar-nexus`; para mudanças no motor, a skill `calibrar-motor`.

## Arquitetura

React 19 + TypeScript + Vite + Tailwind 3.4. Sem roteador e sem persistência: o estado vive em memória e recarregar a página reinicia o jogo.

- `src/game/` é o jogo, sem React:
  - `core.ts`: estado global (`G.userId`/`G.oppId`), utilitários e uma store mínima (`subscribe`/`emit`). Toda mudança de estado termina em `emit()`.
  - `data.ts`: campeões (`champions`), times e jogadores (`LEAGUE`) e resultados dos splits (`SEASON`). Arquivo grande de dados em linha única por registro.
  - `draft.ts`: série (melhor de N, Fearless, First Selection 2026), sequência oficial do draft e IA de picks e bans.
  - `match.ts`: motor da partida em ticks de 30 s. `CFG` tem os parâmetros calibrados e os valores oficiais do 26.1 (ouro, spawns, Barão aos 20:00).
  - `tactics.ts`, `league.ts`, `session.ts` (ao vivo, velocidade, pós-jogo), `calibrate.ts` (`TARGETS` + `runCalibration`), `ddragon.ts`.
- `src/ui/` são as telas, uma por aba (`Liga`, `Elenco`, `Partida`, `Motor`), mais `Draft` e componentes comuns em `common.tsx` (`Ct`, `Crest`, `Sheet`, `Bar`, `ActionBar`). As telas leem o estado com `useGame()`.
- `src/App.tsx` monta o cabeçalho, a aba ativa (via hash: `#liga`, `#elenco`, `#partida`, `#motor`) e a barra de abas.
- `src/components/ui/` tem 45 componentes shadcn gerados, ainda não usados por nenhuma tela. Não edite à mão; o tema deles vem dos tokens abaixo.
- No código, `blue` é sempre o time do usuário e `red` o adversário, independente do lado do mapa (que fica em `series.mapSide`).
- Estilo do código existente: funções curtas e densas, muitas em uma linha. Siga o estilo do arquivo que estiver editando.

## Regras visuais (tokens)

Os tokens ficam no `:root` de `src/index.css`. O hook `check-tokens` avisa quando uma edição foge destas regras.

- **Cor de lado não é cor de significado.** `--side-blue`/`--side-red` só identificam os times (placar, draft, escalações, gráficos da partida). Para "bom/ruim" use `--positive`/`--negative` (classes `.pos`/`.neg`), e para notas e atributos a escala `--q-1` a `--q-5`. `--you` marca o time do usuário; `--warning` é alerta.
- **Dourado é o único acento** da marca (ação principal, aba ativa, seleção). Não use dourado para destacar todo número ou nome.
- **Nada de hex solto** fora do `:root`: crie ou reutilize um token. As variáveis do shadcn (`--background`, `--primary`, `--muted`, `--radius`…) são trios HSL para `hsl(var(--x))`. O cinza de texto secundário é `--text-muted`, não `--muted`.
- **Fontes:** seis tamanhos, `--fs-xs` 12 · `--fs-sm` 14 · `--fs-md` 16 · `--fs-lg` 18 · `--fs-xl` 22 · `--fs-2xl` 30. Nada abaixo de 12 px. Cinzel (`--f-display`) só em títulos grandes; números em `--f-num` com `tabular-nums`; o resto em Barlow (`--f-body`).
- **Acessibilidade:** texto com contraste de pelo menos 4,5:1 sobre o fundo, alvos de toque de 44 px, e nenhuma informação só por cor (junto com a cor vem sinal, letra ou ícone).

O plano de melhorias de UI/UX, com a ordem de execução, está em `docs/pesquisa-uiux/relatorio.md`. A etapa 1 (tokens de cor e fonte) já foi feita; a próxima é a etapa 2 (rótulos nas barras do elenco, moral visível, selo de nota, pílulas V/D, estatísticas da temporada no perfil, módulo único de formatação pt-BR).

## Motor e calibração

- O motor é calibrado para ficar dentro das 14 faixas de `TARGETS` (duração 31,5–34,5 min, 26–31 abates, ganks, % de vitória de quem pega FB/1º dragão/1ª torre/1º Barão, etc.). Hoje todas passam; a duração média fica perto do teto (~34 min).
- Depois de mexer em `match.ts`, `draft.ts`, `tactics.ts`, `core.ts` ou `data.ts`, rode a calibração com pelo menos 500 partidas. Não altere as faixas de `TARGETS` para passar: elas vêm de dados reais de 2026.
- Fonte das regras e números: pesquisa "League of Legends competitivo 2026 (Splits 1 e 2)" (Patch 26.1, gol.gg, Oracle's Elixir, LPL/ChainCC). Os spawns de dragão, Larvas e Arauto não foram confirmados em fonte primária; o do Barão (20:00) foi.

## Imagens da Riot (Data Dragon)

- `src/game/ddragon.ts` monta a URL do ícone de cada campeão com a versão fixa `DDRAGON_VERSION`. Para atualizar as artes, troque a versão.
- O ID do Data Dragon vem do nome sem pontuação; as exceções (Wukong → `MonkeyKing`, Kai'Sa → `Kaisa`, Nunu & Willump → `Nunu`, etc.) estão em `DD_ID`. Campeão novo com nome irregular precisa entrar nesse mapa.
- Se a imagem falhar, o `Ct` volta sozinho para as iniciais coloridas.
- O aviso legal fica no rodapé da Liga (`src/ui/Liga.tsx`). Mantenha a menção à Riot Games e ao Data Dragon se mexer nele.

## Deploy

`.github/workflows/deploy.yml` gera o build com `--base ./` (o site vive em `/Nexus-/`) e publica no GitHub Pages a cada push no `main` ou manualmente pela aba Actions. É gratuito porque o repositório é público e usa o executor padrão `ubuntu-latest`; não troque por executores maiores, que são cobrados.

## Sessões na nuvem

- `ddragon.leagueoflegends.com`, `github.io` e `docs.github.com` costumam estar bloqueados pela rede da sessão. As imagens dos campeões só aparecem no navegador do usuário; nos testes, simule-as (a skill `rodar-nexus` já faz isso).
- O usuário está no celular: links `localhost` ou de IP interno não abrem para ele. Para ele ver uma mudança, ela precisa chegar ao `main` (deploy) ou à pré-visualização do app.
- Até aqui, as descrições de PR foram escritas em português e as mensagens de commit em inglês (verbo no imperativo + resumo, corpo explicando o porquê).
