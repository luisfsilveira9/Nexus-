# Casos — Ganho offline e relógio

> RN-011 e RN-012 · História NX-013 · Faixa CT-300 a CT-399.
> `ouro = renda/s (no save) × min(t_off, 28.800) × 0,5`;
> `partidas = min(faltam na temporada, floor(t_ef / 90))`.
> Pré-condição comum: **renda 100/s** no momento do save, Amadora, relógio de parede e monotônico
> injetados. "Ouro offline" exclui os prêmios das vitórias das partidas offline (60 × 100 = 6.000
> por vitória), que são somados à parte (ver pedido QA-5).

## RN-011 — Ganho offline

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-300 | 0 s offline | Save em T | Reabrir em T | Ouro offline **0**; partidas **0**; nada muda. Se a tela "Enquanto você esteve fora" aparece ou não: **pedido QA-12** | U + I | Sim (PR) |
| CT-301 | 1 min | 14 partidas faltando | Reabrir em T + 60 s | Ouro **3.000**; partidas **0** (floor(60/90) = 0) | U | Sim (PR) |
| CT-302 | Fronteira de 1 partida | 14 faltando | T + 89 s; T + 90 s | 89 s: ouro **4.450**, 0 partidas · 90 s: ouro **4.500**, **1** partida | U | Sim (PR) |
| CT-303 | Limite exato de 8 h | 14 faltando | T + 28.800 s | Ouro **1.440.000**; partidas **14** (min(14, 320)) | U | Sim (PR) |
| CT-304 | 8 h − 1 s | 14 faltando | T + 28.799 s | Ouro **1.439.950** | U | Sim (PR) |
| CT-305 | Acima do limite | 14 faltando | T + 28.801 s; T + 10 h; T + 30 dias | Ouro **1.440.000** nos três; o excedente some sem mensagem de punição | U | Sim (PR) |
| CT-306 | Gherkin "volta depois de 10 h" | 5 partidas restantes | T + 36.000 s | Ouro offline **1.440.000** + 6.000 × vitórias (ex.: 3V-2D → **1.458.000**); **5** partidas jogadas na ordem; temporada terminou; tela "Enquanto você esteve fora" antes de qualquer outra. Texto do Gherkin a corrigir: **pedido QA-5** | I + E | Sim (PR smoke) |
| CT-307 | Fim de temporada durante o offline | 14 faltando, 1 h fora (floor(3.600/90) = 40) | Reabrir | **14** partidas; subir/cair aplicado; a temporada seguinte **não** tem partidas offline (começa 0-0 com o app aberto) | I | Sim (PR) |
| CT-308 | Offline não fecha a temporada | 14 faltando, 20 min fora (floor(1.200/90) = 13) | Reabrir | **13** partidas; falta 1; ouro **60.000** + prêmios | I | Sim (PR) |
| CT-309 | Renda do save, não a nova | 9V-4D na Amadora, 1 h fora, 1 partida faltando, sorteio forçado em vitória | Reabrir | Sobe para Desafiante; ouro offline continua **180.000** (100 × 3.600 × 0,5, renda do save) | I | Sim (PR) |
| CT-310 | Nada creditado antes da tela | 1 h fora | Reabrir; encerrar o app à força com a tela aberta; reabrir | O ganho é mostrado de novo e creditado **uma** vez (ouro final = save + 180.000 + prêmios); nunca zero, nunca dobrado | I + E | Sim (PR) |
| CT-311 | Ordem de telas | Offline com subida de divisão | Reabrir | 1º "Enquanto você esteve fora"; depois capítulo da divisão nova (NX-017); nada antes | E | Sim (main) |
| CT-312 | Tela sem nada pago | Qualquer offline | Ler a tela | Sem botão de "dobrar", anúncio, preço ou contagem regressiva (RN-016) | E | Sim (PR) |
| CT-313 | Propriedade do offline | t_off aleatório em [−1e10, 1e10] s, renda aleatória ≥ 0 | Calcular | 0 ≤ ouro ≤ renda × 14.400; não decresce com t_off; partidas ∈ [0, faltam]; nunca `NaN` | P | Sim (PR) |
| CT-314 | Offline com renda alta | renda 1e12/s | T + 8 h | Ouro **1,44e16**, exibido **1,44e16** | U | Sim (PR) |
| CT-315 | App encerrado pelo sistema em 2º plano | Minimizar (save) e o SO mata o app | Reabrir 2 h depois | Ouro **360.000**; partidas **14** (min(14, 80)) | E | Sim (main) — manual no Android real |
| CT-316 | 2º plano sem encerrar | Minimizar 5 min com o app vivo | Voltar | Ganho de uma só fonte: 5 min a 50% (= **15.000**) se 2º plano = offline, **sem** soma com renda online do mesmo período. **Bloqueado por pedido QA-10** | I + E | Sim após decisão |
| CT-317 | Contador parcial da partida | App aberto 60 s desde a última partida (faltam 30 s), minimizar 60 s | Voltar | Pela fórmula: **0** partidas (floor(60/90)); pelo relógio da partida: **1**. **Bloqueado por pedido QA-9** | I | Sim após decisão |

## RN-012 — Relógio

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-320 | Gherkin "relógio atrasado" | Save em T | Reabrir com relógio em T − 2 h | Ouro offline **0**, partidas **0**, estado igual ao save, momento do save passa a ser T − 2 h ("agora") | U + E | Sim (PR smoke) |
| CT-321 | Depois do atraso | Após CT-320 | Avançar 1 h e reabrir | Ouro **180.000**, contado a partir do novo momento do save | I | Sim (PR) |
| CT-322 | Relógio adiantado | Save em T | Reabrir com relógio em T + 3 dias | Ouro **1.440.000** (igual a 8 h reais) | U | Sim (PR) |
| CT-323 | Ciclo adiantar → atrasar → adiantar | Save em T (real) | Adiantar 8 h e abrir; voltar ao real e abrir; adiantar 8 h e abrir | Pela RN atual: +1.440.000, **0** (save = agora real), **+1.440.000** de novo, ou seja, 8 h extras por ciclo. Contradiz "nenhuma vantagem além de 8 h". **Bloqueado por pedido QA-11** | I | Sim após decisão |
| CT-324 | Mudança de fuso | Save às 12:00 em UTC−3 | Trocar o fuso para UTC+9 (o instante não muda) e reabrir 10 min depois | t_off = **600 s**, ouro **30.000**; nunca 12 h | I + E | Sim (PR) — E2E com `timezoneId` [stack] |
| CT-325 | Horário guardado em UTC | Qualquer save | Ler o save | Momento do save em epoch UTC (ms), sem fuso local | U | Sim (PR) |
| CT-326 | Relógio volta com o app aberto | App aberto, Live n=1 | Pular o relógio de parede −1 h | Renda online segue a 0,5/s (relógio monotônico); nenhum crédito negativo; o próximo save não "trava" o offline | I | Sim (PR) |
| CT-327 | Exploratório de relógio | Charter EX-01 | Sessão de 45 min no Android real | Notas e bugs em `docs/qa/exploratorio/` | — | Não |
