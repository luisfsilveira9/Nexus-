# Nexus eSports Manager

Manager de League of Legends ambientado no CBLOL 2026 (Patch 26.1). Projeto de fã, gratuito e sem fins comerciais. O dono escreve em português e joga principalmente pelo celular.

- Site: https://luisfsilveira9.github.io/Nexus-/ (GitHub Pages, publicado a cada push no `main`).
- Interface toda em pt-BR. Termos de LoL ficam em inglês quando a comunidade fala assim (gank, Fearless, First Selection); os principais estão no glossário.

Este arquivo é curto de propósito. O detalhe de cada assunto está em `docs/` (veja "Leia antes de mexer").

## Comandos

```bash
pnpm install --frozen-lockfile        # na nuvem o hook de SessionStart já roda isso
pnpm dev                              # Vite em http://localhost:5173
pnpm exec tsc -b                      # checagem de tipos
pnpm lint                             # oxlint; 20 avisos antigos, nenhum novo é aceito
pnpm exec vite build --base ./        # build igual ao do deploy (~146 kB gzip no carregamento inicial)
pnpm e2e [pasta] [--so 360x640]       # teste de ponta a ponta no Chromium de celular (~6 min por tamanho; sobe o Vite sozinho)
```

Skills: `rodar-nexus` (ver a interface funcionando) e `calibrar-motor` (medir o motor).

## Mapa do código

React 19 + TypeScript + Vite + Tailwind 3.4, sem roteador. O jogo abre numa tela inicial com dois modos (`G.modo`): **Clássico** (sem save) e **Cartas** (save no `localStorage`, com a run).

- `src/game/` (o jogo, sem React):
  - `core.ts` estado global, store (`subscribe`/`emit`), registro de times · `data.ts` campeões, CBLOL e resultados reais · `proStats.ts` estatísticas reais por campeão
  - `draft.ts` série, Fearless, First Selection, IA do draft · `match.ts` motor da partida · `session.ts` transmissão ao vivo e `endHooks` · `tactics.ts` táticas e presets
  - `mundo.ts` + `mundo-dados.ts` os 363 jogadores e 20 times de fora, carregados sob demanda
  - `save.ts` save versionado · `cartas.ts` cartas, elos, PdL, pacotes, time `meu` · `run.ts` a temporada do modo de cartas
  - `calibrate.ts`, `league.ts`, `fmt.ts` (formatação pt-BR), `resumo.ts`, `glossario.ts`, `ddragon.ts`
- `src/ui/` (telas): `App.tsx` (modos e abas por hash), `Inicio.tsx`, `Liga.tsx`, `Elenco.tsx`, `Draft.tsx`, `Partida.tsx`, `Motor.tsx`, `Cartas.tsx` (modo de cartas, carregado com `lazy`), `common.tsx` (`Ct`, `Crest`, `Retrato`, `Sheet`, `Seg`, `ActionBar`, `NotaBadge`), `Termo.tsx`, `cond.ts`.
- `e2e/e2e.cjs` teste de ponta a ponta · `docs/pesquisa-ligas/` scripts de dados, Elo e ritmo.

## Regras do código

- `blue` é sempre o time do usuário e `red` o adversário, qualquer que seja o lado do mapa (`series.mapSide`).
- Toda mudança de estado termina em `emit()`. Não mude estado do jogo dentro de componente (o lint acusa): use uma função de módulo que aplica e devolve o "desfazer".
- Estilo: funções curtas e densas, muitas em uma linha. Siga o estilo do arquivo que estiver editando.
- **Gerados, não edite à mão:** atributos dos jogadores em `data.ts` e todo o `mundo-dados.ts` (saem de `docs/pesquisa-ligas/gerar-mundo.ts`); `src/components/ui/` (shadcn, sem uso).
- Texto de tela usa `fmt.ts` (`num`, `nota`, `brl`, `pct`); nada de `toFixed`.
- **Motor:** depois de mexer em `match.ts`, `draft.ts`, `tactics.ts`, `core.ts` ou `data.ts`, rode a calibração com 500+ partidas e exija 14 de 14. Não altere as faixas de `TARGETS` (vêm de dados reais). Para provar que algo não muda a simulação, use semente fixa e compare placar e tempo.
- **Modo de cartas:** o motor não sabe que o time é de cartas (`montarTime` entrega um `Team` comum). Mudou o formato do save? Suba `SAVE_V` e ponha a migração em `MIGR`. Na run, o próximo jogo vem sempre de `aposSerie()`, nunca de `newSeries()`.

## Regras visuais

Tokens no `:root` de `src/index.css`; o hook `check-tokens` avisa quando uma edição foge deles.

- **Cor de lado não é cor de significado.** `--side-blue`/`--side-red` só identificam times. Bom/ruim: `--positive`/`--negative`; notas e atributos: `--q-1` a `--q-5`; `--you` é o time do usuário; `--warning` é alerta. Derrota usa tom de aço, não vermelho.
- **Dourado é o único acento** (ação principal, aba ativa, seleção). Nada de hex solto fora do `:root`.
- **Fontes:** só `--fs-xs` 12 · `--fs-sm` 14 · `--fs-md` 16 · `--fs-lg` 18 · `--fs-xl` 22 · `--fs-2xl` 30. Cinzel só em títulos grandes; números em `--f-num`; o resto em Barlow (não tem "′": escreva "min").
- **Acessibilidade:** contraste 4,5:1 (sem `opacity` em texto), alvos de toque de 44 px, nenhuma informação só por cor, animações desligadas com `prefers-reduced-motion`.
- **Jogador não é campeão:** use `Retrato` para jogador, nunca o ícone de um campeão.
- **Listas de escolha:** o que já foi escolhido some da lista ou fica desabilitado. `Sheet` abre no topo. Trocar de aba encerra o aviso da tela anterior.
- Confira se o nome de classe já existe antes de criar (`.mini` e `.plan` já causaram defeito por colisão).

## Testes

- Não há testes unitários. O que existe: `tsc -b`, `pnpm lint`, calibração do motor e `pnpm e2e`.
- `pnpm e2e` joga como um usuário em 360×640 e 360×700 nos dois modos e confere fluxo, seleção e layout. Rode antes do merge de qualquer mudança de interface e acrescente verificações quando criar tela ou corrigir defeito de fluxo. Para chegar rápido a um ponto distante (mata-mata, fim de run), monte o estado no save em vez de jogar até lá.
- O dono está no celular (~360×650–700): `localhost` não abre para ele; teste nesses tamanhos.

## Jeito de trabalhar com o dono

- Um commit por bloco, um PR por etapa. Ele testa no celular depois do merge e responde com o que achou.
- **Merge automático (autorizado em 11/11/2026):** ao fim de cada etapa, abra o PR e faça o merge no `main`. Antes: `tsc -b`, lint sem avisos novos, build do deploy, `pnpm e2e` se mexeu em tela e calibração 14/14 se mexeu no motor. Se algo falhar, não faça o merge; avise. O merge publica o site.
- Depois do merge, recomece o branch designado a partir do `main`. Branch novo só com permissão dele.
- PR em português; commit em inglês (imperativo + corpo explicando o porquê).
- Respostas curtas, em português simples, dizendo o que mudou para quem joga; ressalvas e erros ditos com clareza.
- Nada no jogo custa dinheiro de verdade. O rodapé da Liga credita Riot/Data Dragon e op.gg: mantenha as duas menções.

## Leia antes de mexer

| Vai mexer em | Leia |
|---|---|
| cartas, save, loja, a run | `docs/referencia/modo-cartas.md` |
| motor, draft, táticas, calibração | `docs/referencia/motor.md` |
| dados de jogadores, op.gg, Elo, imagens da Riot | `docs/referencia/dados.md` |
| qualquer arquivo que você ainda não conhece | `docs/referencia/arquitetura.md` |
| teste de ponta a ponta, capturas, deploy | `docs/referencia/sessoes-na-nuvem.md` |
| o que já foi feito e em qual PR | `docs/historico.md` |

## Próxima etapa

Modo roguelike com cartas: etapas 1 a 4 feitas (a run foi o PR #19). A próxima é a **etapa 5 (internacionais)**: First Stand, MSI e Mundial com os times reais para quem tem a vaga em `recordes.vagas`. Leia `docs/plano-roguelike.md` antes de começar; ele tem o combinado com o dono, os números e o passo a passo.
