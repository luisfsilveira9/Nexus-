# Casos — Primeiros 5 minutos, capítulos e usabilidade

> NX-016 (todas as RN) e NX-017 (RN-010, RN-018) · Faixa CT-700 a CT-799. **v0.3** (NX-024), RN v0.3.1.
> RN-018 v0.3: capítulos são **do jogador**, não da run. O **prólogo é a própria tela de boas-vindas**
> (T01) e cumpre o papel da Várzea (sem capítulo próprio). Um capítulo na 1ª subida a cada divisão,
> do Acesso ao Mundial (5), em qualquer run; capítulo da 1ª refundação; epílogo da Temporada 1 no 1º
> título mundial. **Fala de 1 linha** (A03) **só ao subir** de novo a uma divisão já vista e do 2º
> título em diante; até 60 caracteres (depois de trocar `{clube}` por 20 caracteres); some em 4 s ou
> com um toque. Na queda e na volta à Várzea pela refundação **não há** fala (T06 e T11 já falam).
> **Ordem quando vários eventos coincidem:** avisos de save → "Enquanto você esteve fora" → resumo de
> cada split, em ordem → capítulos, em ordem cronológica → falas de 1 linha.
> Pular conta como visto. Nada bloqueia o jogo; o relógio de partida pausa com o capítulo aberto
> (a barra de abas some, RN-009). Capítulo: até 180 palavras e 8 blocos (RN-020 v0.3).
> Roteiro de usabilidade em `docs/qa/usabilidade/` quando o UX fechar a NX-009 dele.

## NX-016 — Primeiros 5 minutos

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-700 | 1ª compra em < 10 s sem ajuda | 1 ou 2 pessoas convidadas pelo dono que nunca viram o jogo (QA-16 decidido); senão, avaliação heurística + o dono | Entregar o celular e cronometrar, sem instrução | 1ª compra em **< 10 s**; registrar hesitações | A | Não (moderado) |
| CT-701 | Caminho mínimo até a 1ª compra | E2E, clube novo, 360×640 | Contar toques até comprar a 1ª "Aulas na lan" depois de fechar as boas-vindas | **1** toque; botão visível sem rolagem e ≥ 44×44 px | E | Sim (PR smoke) |
| CT-702 | Entende o elenco antes da 1ª partida | Participante do CT-700 | Antes da 1ª partida, perguntar "para que serve subir um jogador?" | Resposta com sentido de "deixa o time mais forte / aumenta a chance de vencer" | A | Não (moderado) |
| CT-703 | 2º split em ≤ 5 min acelerados | Tempo acelerado do build de teste (C3) | Jogar do zero | Chega ao 2º split em ≤ 5 min de relógio de teste; 14 × 90 s = 1.260 s de jogo → aceleração ≥ ×4,2 (somando o tempo de leitura do prólogo, que pausa o relógio) | E | Sim (main) |
| CT-704 | Tela principal cabe sem rolagem | 360×640 e 360×700 | Abrir no estado "primeira vez" e "meio de run" | Sem rolagem vertical na principal, sem rolagem lateral, nada para fora, conteúdo acima das barras fixas | E + V | Sim (PR smoke) |
| CT-705 | Acessibilidade automática | Todas as telas | axe-core | 0 violações `serious`/`critical`; contraste ≥ 4,5:1 no texto; alvos ≥ 44 px nas ações | A | Sim (PR) |
| CT-706 | Regressão visual | Principal, elenco, fim de split, offline, refundação (etapas 1 e 2), capítulo, jornada, renomear clube, configurações | Screenshot em 360×640 contra a base aprovada | Diferença ≤ 0,1% de pixels; mudança intencional atualiza a base no mesmo PR | V | Sim (main) |
| CT-707 | Sem placeholder no build | Build da main | Procurar `[LORE:`, `TODO`, `lorem` no bundle e nas telas | Nenhuma ocorrência (bloqueia o aceite, não o PR) | E | Sim (main) |
| CT-708 | Regras claras na tela | Participante | Perguntar de onde vem o ouro e por que a chance é X% | Encontra a explicação em ≤ 2 toques (pilar "honesto") | A | Não (moderado) |

## RN-018 / NX-017 — Capítulos da história

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-710 | Prólogo = boas-vindas (QA-25e decidido) | Instalação limpa | Abrir o jogo | A 1ª tela depois de carregar é o prólogo (T01), que **é** a boas-vindas: nenhuma outra tela de boas-vindas antes ou depois; abre uma vez, com a barra de abas escondida e o relógio de partida pausado; "Começar" leva à T02 | I + E | Sim (PR) |
| CT-711 | Prólogo não volta | Prólogo visto (ou pulado) | Reabrir o app; refundar; começar outra run | O prólogo **não** reabre sozinho; fica na jornada para reler | I | Sim (PR) |
| CT-712 | Capítulo na 1ª subida a cada divisão (QA-25a decidido) | Capítulos de divisão nunca vistos | Subir Várzea → Acesso → Ascensão → Elite → Continental → Mundial | Abre o capítulo de cada divisão na 1ª chegada: **5** capítulos (Acesso a Mundial). Nenhum capítulo da Várzea além do prólogo; o conteúdo não tem chave de capítulo para a Várzea | I + E | Sim (PR) |
| CT-713 | Capítulo em qualquer run | 1ª run parou na Ascensão e refundou | Na 2ª run, chegar à Elite pela 1ª vez | Abre o capítulo da Elite (é a 1ª vez do jogador, não da run) | I | Sim (PR) |
| CT-714 | Não reaparece depois de refundar | Capítulo do Acesso visto; refundar | Subir ao Acesso de novo | Nenhum capítulo; aparece a **fala de 1 linha**; a jornada continua com ele | I + E | Sim (PR) |
| CT-715 | Não reaparece na mesma run | Capítulo do Acesso visto; caiu para a Várzea | Subir ao Acesso de novo | Só a fala de 1 linha | I | Sim (PR) |
| CT-716 | Fala de 1 linha: tamanho, tempo e não bloqueia (QA-26a decidido) | Cenário do CT-714, relógio injetado | Observar a fala; repetir e tocar nela | Texto ≤ **60** caracteres (com `{clube}` de 20); visível em 3,9 s e fora da tela em **4 s** (± 1 tique), ou some no toque; não esconde a barra de abas, não pausa o relógio de partida, não bloqueia toques no resto da tela | U + E | Sim (PR) |
| CT-717 | Pular conta como visto | Capítulo do Acesso aberto | Tocar "Pular"; reabrir o app; refundar; subir ao Acesso | Fecha na hora; marcado como visto (QA-17 decidido); na nova chegada, só a fala; o capítulo está na jornada para reler | I + E | Sim (PR) |
| CT-718 | Reler na jornada | Capítulo visto | Abrir pela jornada | Mesmo texto; botão "Fechar"; relógio de partida **pausado** enquanto aberto (é um capítulo aberto, RN-009) | E | Sim (main) |
| CT-719 | Capítulo da 1ª refundação | Nunca refundou | Refundar; depois refundar de novo em outra run | 1ª: capítulo próprio abre (relógio pausado até fechar). 2ª: nenhum capítulo | I + E | Sim (PR) |
| CT-720 | Epílogo da Temporada 1 e títulos seguintes (QA-25c decidido) | Nunca ganhou título | Ganhar o 1º título mundial (CT-230); depois o 2º e o 3º | 1º: resumo do split → epílogo (T07). 2º e 3º: resumo do split → **fala de 1 linha** (≤ 60 caracteres), sem epílogo | I + E | Sim (PR) |
| CT-721 | Epílogo vindo do offline | Cenário do CT-330, 1º título | Reabrir | 1º tela "Enquanto você esteve fora"; depois o epílogo; nada antes | E | Sim (main) |
| CT-722 | Ordem com save recuperado | Save recuperado + offline com subida a divisão nova | Reabrir | Aviso de save recuperado → tela offline → capítulo (= CT-311) | E | Sim (main) |
| CT-723 | Nenhum capítulo bloqueia o jogo | Capítulo aberto, Aulas n=1 | Esperar 60 s; tocar "Pular" | Renda continua (+30); "Pular" funciona a qualquer momento com 1 toque | I + E | Sim (PR) |
| CT-724 | Capítulos vistos sobrevivem | 3 capítulos vistos | Encerrar à força; reabrir; exportar e importar | A lista de vistos é a mesma (CT-515, CT-520) | I | Sim (PR) |
| CT-725 | Leitura em < 1 min (QA-26c decidido) | Conteúdo do lore em `src/content/` | Medir cada bloco e cada capítulo, com `{clube}` trocado por 20 caracteres | Bloco ≤ **280** caracteres; capítulo ≤ **180** palavras e ≤ **8** blocos (RN-020 v0.3). Qualquer capítulo acima falha o PR | I + A | Sim (PR) + manual com o dono |
| CT-726 | Sem fala na queda nem na volta pela refundação (QA-25b decidido) | (a) Elite vista; cair para a Ascensão (já vista). (b) Refundar (não a 1ª) | Observar | (a) Só a T06 (com a fala da Dona Cel); **nenhuma** A03. (b) Só a T11; **nenhuma** A03 de Várzea | I | Sim (PR) |
| CT-727 | Ordem dos eventos que coincidem (RN-018 v0.3) | Relógios e sorteio injetados | (a) Save recuperado + ausência ≥ 60 s com subida a divisão inédita. (b) Ausência < 60 s cuja partida fecha o split com subida a divisão inédita (= CT-335). (c) App aberto: 14ª partida sobe a divisão já vista. (d) App aberto: 1º título mundial; depois o 2º. (e) 1ª refundação | (a) Aviso de save (T12a) → "Enquanto você esteve fora" (T13) → capítulo da divisão (T07). Se a lista de splits da T13 já vale como "resumo de cada split" ou se cada T06 aparece de novo depois dela: **pedido QA-29b**. (b) T06 → T07. (c) T06 → A03. (d) T06 → epílogo; no 2º, T06 → A03. (e) T11 → capítulo da 1ª refundação. Nunca duas telas ao mesmo tempo; nada fora dessa ordem | I + E | Sim (PR) — (b) a (e); (a) após QA-29 |
