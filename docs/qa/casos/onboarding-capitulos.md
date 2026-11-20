# Casos — Primeiros 5 minutos, capítulos e usabilidade

> NX-016 (todas as RN) e NX-017 (RN-010) · Faixa CT-700 a CT-799.
> Roteiro de usabilidade detalhado vai para `docs/qa/usabilidade/` quando o UX entregar a NX-004.

## NX-016 — Primeiros 5 minutos

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-700 | 1ª compra em < 10 s sem ajuda | Participante que nunca viu o jogo (**pedido QA-16**), instalação limpa, celular | Entregar o celular e cronometrar, sem instrução | 1ª compra em **< 10 s**; registrar hesitações | A | Não (moderado) |
| CT-701 | Caminho mínimo até a 1ª compra | E2E, clube novo, 360×640 | Contar toques até comprar a 1ª Live | **1** toque; o botão está visível sem rolagem e tem ≥ 44×44 px | E | Sim (PR smoke) |
| CT-702 | Entende o elenco antes da 1ª partida | Participante do CT-700 | Antes da 1ª partida (90 s), perguntar "para que serve subir um jogador?" | Resposta com sentido de "deixa o time mais forte / aumenta a chance de vencer" | A | Não (moderado) |
| CT-703 | 2ª temporada em ≤ 5 min acelerados | Modo de tempo acelerado de teste (**requisito R-05**) | Jogar do zero | Chega à 2ª temporada em ≤ 5 min de relógio de teste; 14 partidas × 90 s = 1.260 s de jogo → precisa de aceleração ≥ ×4,2 | E | Sim (main) |
| CT-704 | Tela principal cabe sem rolagem | 360×640 e 360×700 | Abrir no estado "primeira vez" e "meio de run" | Sem rolagem vertical na principal (critério NX-004), sem rolagem lateral, nada para fora da tela, fim do conteúdo acima das barras fixas | E + V | Sim (PR smoke) |
| CT-705 | Acessibilidade automática | Todas as telas | axe-core | 0 violações `serious`/`critical`; contraste ≥ 4,5:1 no texto; alvos ≥ 44 px nas ações | A | Sim (PR) |
| CT-706 | Regressão visual | Telas: principal, elenco, fim de temporada, offline, prestígio (etapas 1 e 2), capítulo, configurações | Screenshot em 360×640 contra a base aprovada | Diferença ≤ 0,1% de pixels; mudança intencional exige atualizar a base no mesmo PR | V | Sim (main) |
| CT-707 | Sem placeholder no build | Build da main | Procurar `[LORE:`, `TODO`, `lorem` no bundle e nas telas | Nenhuma ocorrência (bloqueia só o aceite, não o PR) | E | Sim (main) |
| CT-708 | Regras claras na tela | Participante | Perguntar de onde vem o ouro e por que a chance é X% | Encontra a explicação em ≤ 2 toques (pilar "honesto") | A | Não (moderado) |

## NX-017 — Capítulos de história

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-710 | Capítulo na 1ª subida | Nunca subiu na run | Subir Amadora → Desafiante | Capítulo da Desafiante abre | I + E | Sim (main) |
| CT-711 | Pular e reler | Capítulo aberto | Pular com 1 toque; depois abrir pela lista de capítulos | Fecha na hora; aparece na lista e reabre igual. Se "pular" conta como visto: **pedido QA-17** | E | Sim (main) |
| CT-712 | Leitura em < 1 min | Conteúdo do lore | Contar palavras de cada capítulo | ≤ **200** palavras (leitura a ~200 palavras/min em tela pequena); confirmação manual com o dono | I + A | Sim (PR) + manual |
| CT-713 | Não reaparece após prestígio | Capítulo da Desafiante visto; prestigiar | Subir para a Desafiante de novo | Nenhum capítulo abre; a lista continua com ele | I | Sim (PR) |
| CT-714 | Subir de novo na mesma run | Visto, caiu, subiu de novo | Subir | Não reabre | I | Sim (PR) |
| CT-715 | Subida durante o offline | = CT-311 | | Tela offline primeiro, capítulo depois | E | Sim (main) |
