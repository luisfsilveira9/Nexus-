# Casos — Primeiros 5 minutos, capítulos e usabilidade

> NX-016 (todas as RN) e NX-017 (RN-010, RN-018) · Faixa CT-700 a CT-799. **v0.2** (NX-009).
> RN-018: capítulos são **do jogador**, não da run. Prólogo ao criar o clube; um capítulo na 1ª
> chegada a cada divisão, em qualquer run; capítulo da 1ª refundação; epílogo da Temporada 1 no 1º
> título mundial. Chegar de novo a uma divisão já vista mostra só uma fala de 1 linha, que some
> sozinha. Pular conta como visto. Nada bloqueia o jogo; o relógio de partida pausa com o capítulo
> aberto. Capítulos de divisão previstos pelo lore: Acesso, Ascensão, Elite, Continental e Mundial
> (`docs/lore/temporadas/T01.md`).
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
| CT-710 | Prólogo ao criar o clube | Instalação limpa | Abrir o jogo | O prólogo abre uma vez, com o relógio de partida pausado. Ordem em relação às boas-vindas (ou se o prólogo é a própria boas-vindas): **pedido QA-25e** | I + E | Sim (main) — a ordem após decisão |
| CT-711 | Prólogo não volta | Prólogo visto (ou pulado) | Reabrir o app; refundar; começar outra run | O prólogo **não** reabre sozinho; fica na jornada para reler | I | Sim (PR) |
| CT-712 | Capítulo na 1ª chegada a cada divisão | Capítulos de divisão nunca vistos | Subir Várzea → Acesso → Ascensão → Elite → Continental → Mundial | Abre o capítulo de cada divisão na 1ª chegada (5 capítulos). Se a Várzea tem capítulo próprio além do prólogo: **pedido QA-25a** | I + E | Sim (PR) |
| CT-713 | Capítulo em qualquer run | 1ª run parou na Ascensão e refundou | Na 2ª run, chegar à Elite pela 1ª vez | Abre o capítulo da Elite (é a 1ª vez do jogador, não da run) | I | Sim (PR) |
| CT-714 | Não reaparece depois de refundar | Capítulo do Acesso visto; refundar | Subir ao Acesso de novo | Nenhum capítulo; aparece a **fala de 1 linha**; a jornada continua com ele | I + E | Sim (PR) |
| CT-715 | Não reaparece na mesma run | Capítulo do Acesso visto; caiu para a Várzea | Subir ao Acesso de novo | Só a fala de 1 linha | I | Sim (PR) |
| CT-716 | Fala de 1 linha não bloqueia | Cenário do CT-714 | Observar a fala | Some sozinha, sem toque; não pausa o relógio de partida; não bloqueia toques. Duração e limite de caracteres: **pedido QA-26** | E | Sim (PR) — duração após decisão |
| CT-717 | Pular conta como visto | Capítulo do Acesso aberto | Tocar "Pular"; reabrir o app; refundar; subir ao Acesso | Fecha na hora; marcado como visto (QA-17 decidido); na nova chegada, só a fala; o capítulo está na jornada para reler | I + E | Sim (PR) |
| CT-718 | Reler na jornada | Capítulo visto | Abrir pela jornada | Mesmo texto; botão "Fechar"; relógio de partida **pausado** enquanto aberto (é um capítulo aberto, RN-009) | E | Sim (main) |
| CT-719 | Capítulo da 1ª refundação | Nunca refundou | Refundar; depois refundar de novo em outra run | 1ª: capítulo próprio abre (relógio pausado até fechar). 2ª: nenhum capítulo | I + E | Sim (PR) |
| CT-720 | Epílogo da Temporada 1 | Nunca ganhou título | Ganhar o 1º título mundial (CT-230); depois o 2º | 1º: epílogo abre depois do resumo do split. 2º: nenhum epílogo. Se há fala no 2º título em diante: **pedido QA-25c** | I + E | Sim (PR) |
| CT-721 | Epílogo vindo do offline | Cenário do CT-330, 1º título | Reabrir | 1º tela "Enquanto você esteve fora"; depois o epílogo; nada antes | E | Sim (main) |
| CT-722 | Ordem com save recuperado | Save recuperado + offline com subida a divisão nova | Reabrir | Aviso de save recuperado → tela offline → capítulo (= CT-311) | E | Sim (main) |
| CT-723 | Nenhum capítulo bloqueia o jogo | Capítulo aberto, Aulas n=1 | Esperar 60 s; tocar "Pular" | Renda continua (+30); "Pular" funciona a qualquer momento com 1 toque | I + E | Sim (PR) |
| CT-724 | Capítulos vistos sobrevivem | 3 capítulos vistos | Encerrar à força; reabrir; exportar e importar | A lista de vistos é a mesma (CT-515, CT-520) | I | Sim (PR) |
| CT-725 | Leitura em < 1 min | Conteúdo do lore em `src/content/` | Medir cada bloco e cada capítulo | Bloco ≤ **280** caracteres (RN-020, `tokens.md` §10); capítulo ≤ ~150 palavras. A amostra do capítulo 1 tem ~170 palavras: **pedido QA-26** | I + A | Sim (PR) + manual com o dono |
| CT-726 | Chegar a uma divisão por queda | Elite vista; cair para a Ascensão (já vista) | Observar | Se a queda também mostra a fala de 1 linha de "chegada": **pedido QA-25b** | I | Sim após decisão |
