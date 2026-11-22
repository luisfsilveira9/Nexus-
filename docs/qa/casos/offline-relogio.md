# Casos — Ganho offline e relógio

> RN-011 e RN-012 · História NX-013 · Faixa CT-300 a CT-399. **v0.3** (NX-024), RN v0.3.1.
> Fórmulas da RN v0.3:
> ```
> t_off = max(0, agora − maior)            maior = max(maior, agora)   (RN-012)
> t_ef  = min(t_off, 28.800)
> ouro  = renda/s (no save) × t_ef × 0,5
> r     = segundos que faltavam para a próxima partida (no save)
> partidas possíveis = 0 se t_ef < r; senão 1 + floor((t_ef − r) / 90)
> ```
> As partidas seguem split após split enquanto o resultado for **manteve** ou **título mundial** e
> **param no fim do 1º split com subida ou queda**. Cada vitória offline paga o prêmio cheio
> (60 × renda de antes de qualquer mudança de divisão). Como `0 < r ≤ 90`, o máximo é **320** partidas.
> **Relógio de partida depois do offline (RN-011 v0.3, QA-21 decidido):**
> - `t_ef < r`: nenhuma partida; faltam `r − t_ef`;
> - as partidas pararam no fim de um split com subida ou queda: faltam **90** (cheio);
> - senão: faltam `90 − ((t_ef − r) mod 90)`.
> - `maior` é atualizado em **todo** save e ao voltar (RN-012 v0.3, B2).
> A tela "Enquanto você esteve fora" só aparece com `t_off ≥ 60 s`; abaixo disso o ganho é creditado
> direto. "Faltam" = segundos até a próxima partida depois de voltar.
> Pré-condição comum: **renda 100/s** no momento do save, Várzea, **r = 90 s**, `maior` = T (instante
> do save), relógios de parede e monotônico injetados, sorteio forçado quando indicado.
> "Ouro offline" exclui os prêmios das vitórias, somados à parte (6.000 por vitória com renda 100/s).

## RN-011 — Ganho offline

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-300 | 0 s offline | Save em T | Reabrir em T | Ouro offline **0**; partidas **0**; faltam 90; **sem** tela (0 < 60) | U + I | Sim (PR) |
| CT-301 | 1 min, menos que r | 14 partidas no split | Reabrir em T + 60 s | Ouro **3.000**; partidas **0** (60 < 90); faltam **30** (`r − t_ef`, QA-21a); tela aparece (60 ≥ 60) | U | Sim (PR) |
| CT-302 | Fronteira de 1 partida | 14 no split | T + 89 s; T + 90 s | 89 s: ouro **4.450**, 0 partidas, faltam **1** · 90 s: ouro **4.500**, **1** partida, faltam **90** | U | Sim (PR) |
| CT-303 | Limite exato de 8 h | Split 0-0 na Várzea; sorteio: todas derrotas | T + 28.800 s | Ouro **1.440.000**; possíveis **320**; jogadas **320** = 22 splits de 0-14 ("manteve", ninguém cai da Várzea) + 12 partidas do 23º (0-12); faltam **90**; prêmios 0 | U + I | Sim (PR) |
| CT-304 | 8 h − 1 s | Idem | T + 28.799 s | Ouro **1.439.950**; possíveis **319**; faltam **1** | U | Sim (PR) |
| CT-305 | Acima do limite | Idem | T + 28.801 s; T + 10 h; T + 30 dias | Nos três: ouro **1.440.000**, possíveis **320**; o excedente some sem mensagem de punição | U | Sim (PR) |
| CT-306 | Gherkin "volta depois de 10 horas" | Várzea, 5 partidas restantes no split, r = 90 | T + 36.000 s, duas variantes de sorteio | **(A)** placar 4V-5D; restantes V,V,V,D,D → split 7-7 (manteve); depois só derrotas: **320** partidas (5 + 22 × 14 + 7), ouro **1.440.000 + 18.000 = 1.458.000** ("1,45 mi"). **(B)** placar 6V-3D; restantes V,V,V,V,D → 10-4, sobe para o **Acesso** e **para** em 5 partidas: ouro **1.440.000 + 24.000 = 1.464.000** ("1,46 mi"). Nas duas: tela "Enquanto você esteve fora" antes de qualquer outra | I + E | Sim (PR smoke) |
| CT-307 | Fim de split com subida durante o offline | Split 0-0, 1 h fora (possíveis **40**) | Reabrir com (A) 1º split 10-4; (B) só derrotas | (A) **14** partidas, sobe para o Acesso, o split seguinte começa só com o app aberto (0-0); faltam **90** (parou por subida). (B) **40** partidas = 14 + 14 + 12, dois resumos "manteve", 3º split em 0-12, faltam **90** (`90 − (3.510 mod 90)`) | I | Sim (PR) |
| CT-308 | Offline não fecha o split | Split 0-0, 20 min fora | Reabrir | **13** partidas (1 + floor(1.110/90)); falta 1 no split; ouro **60.000** + prêmios; faltam **60** | I | Sim (PR) |
| CT-309 | Renda do save e prêmio de antes da subida | 9V-4D na Várzea, 1 h fora, vitória forçada | Reabrir | Sobe para o Acesso e para em 1 partida; ouro offline **180.000** (renda do save) + prêmio **6.000** (renda de antes) = **186.000**; faltam **90** | I | Sim (PR) |
| CT-310 | Nada creditado antes da tela | 1 h fora | Reabrir; encerrar à força com a tela aberta; reabrir | O ganho é mostrado de novo e creditado **uma** vez (ouro final = save + 180.000 + prêmios); nunca zero, nunca dobrado | I + E | Sim (PR) |
| CT-311 | Ordem de telas | Save recuperado (RN-015) + offline com subida | Reabrir | 1º aviso de save recuperado; 2º "Enquanto você esteve fora"; 3º capítulo da divisão nova, se não visto | E | Sim (main) |
| CT-312 | Tela sem nada pago | Qualquer offline ≥ 60 s | Ler a tela | Sem "dobrar", anúncio, preço ou contagem regressiva (RN-016) | E | Sim (PR) |
| CT-313 | Propriedade do offline | t_off aleatório em [−1e10, 1e10] s, renda ≥ 0, r ∈ (0, 90] | Calcular | 0 ≤ ouro ≤ renda × 14.400; ouro não decresce com t_off; partidas ∈ [0, 320]; faltam ∈ (0, 90]; nunca `NaN` | P | Sim (PR) |
| CT-314 | Offline com renda alta | renda 1e12/s | T + 8 h | Ouro **1,44e16**, exibido "**1,44e16**" | U | Sim (PR) |
| CT-315 | App encerrado pelo sistema em 2º plano | Minimizar (save) e o navegador descarta a aba/PWA | Reabrir 2 h depois | Ouro **360.000**; possíveis **80**, até o fim do 1º split com subida ou queda | E | Sim (main); manual no Android real |
| CT-316 | 2º plano sem encerrar = offline | App vivo minimizado 5 min | Voltar | Só o offline: ouro **15.000** (50%), **3** partidas (1 + floor(210/90)), faltam **60**; **nenhuma** renda online somada no período; tela aparece (QA-10 decidido) | I + E | Sim (PR) |
| CT-317 | Resto do relógio é consumido primeiro | App aberto, faltam **30 s**; minimizar 60 s | Voltar | **1** partida (60 ≥ 30); ouro **3.000**; faltam **60** ((60 − 30) mod 90 = 30 → 90 − 30). QA-9 decidido | I | Sim (PR) |
| CT-318 | Gherkin "ausência curta" | r = 90 | Voltar depois de 40 s | **2.000** creditados direto, **sem** a tela; 0 partidas; faltam **50** | I + E | Sim (PR smoke) |
| CT-319 | Fronteira da tela | r = 90 | Voltar com 59 s; com 60 s | 59 s: **2.950** creditados direto, sem tela. 60 s: tela aparece e o ouro só entra depois de vista | I + E | Sim (PR) |
| CT-330 | Offline segue depois de título mundial | Mundial, renda 3.200/s no save, split 0-0, 1 h fora (possíveis 40) | Sorteio: 1º split 13-1; 2º split 0-14 | 1º split = **título** (histórico +1) e o 2º começa ainda offline; o 2º termina em queda → **para** em **28** partidas, divisão Continental. Ouro offline **5.760.000** + 13 × 192.000 = **8.256.000** ("8,25 mi"). Tela lista os 2 splits; depois, epílogo se for o 1º título (CT-721) | I | Sim (PR) |
| CT-331 | Queda offline para as partidas | Acesso, renda 200/s, split 0-0, 1 h fora | Sorteio: só derrotas | **14** partidas, cai para a Várzea e para; ouro offline **360.000**; o split seguinte só com o app aberto | I | Sim (PR) |
| CT-332 | Relógio de partida pausado na tela offline | Volta de 1 h com faltam X | Deixar a tela aberta 120 s; receber | Nenhuma partida enquanto a tela está aberta; depois de receber, continuam faltando **X** | I | Sim (PR) |
| CT-333 | Relógio depois que as partidas param (QA-21b decidido) | Split 0-0, r = 90, **3.630 s** fora (possíveis 40) | (A) 1º split 10-4 (sobe); (B) só derrotas | (A) para na 14ª; faltam **90** (cheio), não 60. (B) 40 partidas; faltam **60** (`90 − (3.540 mod 90)`). Mesmo t_ef, valores diferentes: prova que o ramo "parou" é usado | U | Sim (PR) |
| CT-334 | `r` sempre em (0, 90] e no máximo 320 partidas (QA-21c decidido) | (a) r = 90; (b) r = 1; (c) r = 0,001; (d) save com r = 0, r = −1 ou r = 90,5 | (a)–(c): voltar depois de 8 h. (d): carregar | (a) **320** partidas, faltam 90. (b) **320**, faltam 1. (c) **320**, faltam 0,001 (> 0). (d) valor impossível: a cópia é tratada como **corrompida** (RN-015, CT-509), nunca 321 partidas | U | Sim (PR) |
| CT-335 | Ausência curta que fecha o split (QA-23 decidido) | 9V-4D na Várzea, faltam 10 s, capítulo do Acesso nunca visto | Voltar depois de 40 s, vitória forçada | **Sem** a tela offline; ouro **2.000** + prêmio **6.000** creditados direto; sobe para o Acesso; aparecem o **resumo do split** (T06) e depois o **capítulo do Acesso** (T07), como se o app estivesse aberto; faltam **90** | I + E | Sim (PR) |
| CT-336 | Relógio depois do offline: os três ramos | Relógios injetados | Calcular | `t_ef < r`: r = 50, t = 20 → 0 partidas, faltam **30**; r = 0,5, t = 0,4 → faltam **0,1** (> 0). Parou por subida/queda → **90**. Senão: r = 30, t = 30 → 1 partida, faltam **90** (nunca 0); r = 30, t = 119 → 1, faltam **1**; r = 30, t = 120 → 2, faltam **90** | U | Sim (PR) |
| CT-337 | O jogo nunca grava `r` fora de (0, 90] | Sequências aleatórias de ações, partidas, offline (incluindo t_ef = r exato e múltiplos de 90) e refundação | Ler `r` em cada save | Sempre `0 < r ≤ 90`; nunca `NaN` | P | Sim (PR: 1.000; noturna: 100.000) |

## RN-012 — Relógio

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-320 | Gherkin "relógio atrasado" | Save em T (`maior` = T) | Reabrir com o relógio em T − 2 h | t_off **0**: ouro offline 0, partidas 0, estado igual ao save, faltam iguais; `maior` **continua T** (não desce) | U + E | Sim (PR smoke) |
| CT-321 | Depois do atraso | Após CT-320, relógio do aparelho ainda atrasado | Reabrir em T − 1 h (horário do aparelho); depois em T + 1 h | T − 1 h: **0** (ainda abaixo de `maior`). T + 1 h: **180.000**, contado a partir de `maior` = T | I | Sim (PR) |
| CT-322 | Relógio adiantado | Save em T | Reabrir com o relógio em T + 3 dias | Ouro **1.440.000** (só 8 h); `maior` = T + 3 dias | U | Sim (PR) |
| CT-323 | Gherkin "ciclo de adiantar e atrasar" | Save em T (real) | Em T+60 s reais: relógio em T + 8 h, abrir, fechar. Em T+120 s reais: relógio certo, abrir, fechar. Em T+180 s reais: relógio em T + 8 h + 180 s, abrir | 1ª abertura: **1.440.000**. 2ª: **0**. 3ª: t_off = **180 s** → **9.000** (só o tempo real), não mais 1.440.000. QA-11 **mitigado** pela RN-012 v0.2 | I | Sim (PR) |
| CT-324 | Mudança de fuso | Save às 12:00 em UTC−3 | Trocar o fuso para UTC+9 (o instante não muda) e reabrir 10 min depois | t_off = **600 s**, ouro **30.000**, **6** partidas, faltam **30**; nunca 12 h | I + E | Sim (PR); E2E com `timezoneId` do Playwright |
| CT-325 | Horário guardado em UTC | Qualquer save | Ler o save | `salvoEm` e `maior` em epoch UTC (ms), sem fuso local | U | Sim (PR) |
| CT-326 | Relógio volta com o app aberto | App aberto, Aulas n=1, `maior` = T | Pular o relógio de parede para T − 1 h e esperar 10 s monotônicos | Renda online segue 0,5/s (+5); nenhum crédito negativo; `maior` continua **T** depois do próximo save | I | Sim (PR) |
| CT-327 | Exploratório de relógio | Charter EX-01 | Sessão de 45 min no Android real | Notas e bugs em `docs/qa/exploratorio/` | — | Não |
| CT-328 | Voltar ao horário certo depois de adiantar | Após CT-322 (`maior` = T + 3 dias), relógio corrigido | Reabrir em T + 1 h real; depois em T + 3 dias + 1 h | T + 1 h: **0** (nada ganho, nada perdido do que já tinha). T + 3 d + 1 h: **180.000** | I | Sim (PR) |
| CT-329 | `maior` acompanha o jogo aberto | App aberto de T até T + 1 h (saves a cada 10 s) | Minimizar em T + 1 h; voltar em T + 1 h + 10 min | t_off = **600 s** (não 70 min): o `maior` foi atualizado nos saves com o app aberto | I | Sim (PR) |
| CT-338 | `maior` atualizado em todo save (RN-012 v0.3, B2) | App aberto, relógio de parede injetado, `maior` = T | Disparar cada gatilho de save em T + 5 s: 10 s automáticos, compra, fim de partida, `visibilitychange`→`hidden`, `pagehide`; e voltar ao app | Em cada save gravado, `maior` = max(maior anterior, agora) = **T + 5 s**; com o relógio de parede atrasado para T − 1 h, o save seguinte mantém `maior` = T + 5 s (nunca desce) | I | Sim (PR) |
| CT-339 | Propriedade do relógio | Sequências aleatórias de aberturas com o relógio avançando, atrasando e adiantando | Somar os t_off | Σ t_off ≤ `maior` final − `maior` inicial; `maior` nunca decresce; nenhum t_off negativo | P | Sim (PR: 1.000; noturna: 100.000) |
