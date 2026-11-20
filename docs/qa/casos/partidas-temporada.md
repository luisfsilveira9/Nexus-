# Casos — Partidas e temporada

> RN-009 e RN-010 · História NX-012 · Faixa CT-200 a CT-299.
> P(vitória) = `limitar(1 / (1 + e^(−6x)), 5%, 95%)`, `x = poder_time / poder_rival − 1`.
> A porcentagem exibida depende do pedido QA-3 (arredondar para o mais próximo, como no Gherkin, ou
> para baixo, como na convenção). A tabela mostra os dois quando diferem.

## RN-009 — Partida

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-200 | P(vitória) — tabela | — | Calcular | 72×60: **0,768525** → 77% (para baixo: 76%) · 60×60: **0,5** → 50% · 48×60: **0,231475** → 23% · 50×60 (clube novo): **0,268941** → 27% (para baixo: 26%) · 40×60: **0,119203** → 12% (para baixo: 11%) · 69×60: **0,710950** → 71% · 264×220: **0,768525** · 62,5×60: **0,562177** → 56% | U | Sim (PR) |
| CT-201 | Limites de 5% e 95% | — | Calcular | 100×60 → **95%**; 120×60 → **95%**; 30×60 → **5%**; 1×1.500.000 → **5%**. Fronteira: x = ±ln(19)/6 = ±0,490740; poder 89,4444 × 60 → exatamente **95%** | U | Sim (PR) |
| CT-202 | Gherkin "chance mostrada" | Poder do time 72, rival 60 (Amadora) | Abrir a tela principal | A tela mostra **77%** antes da partida (bloqueado por pedido QA-3 se a regra for "para baixo") | E | Sim (PR smoke) |
| CT-203 | Intervalo de 90 s | App aberto, relógio monotônico injetado | Avançar 89 s; 90 s; 180 s | 0 partidas; **1**; **2** | I | Sim (PR) |
| CT-204 | Prêmio da vitória | renda 100/s, sorteio forçado | Vitória; derrota | +**6.000**; +**0** | U | Sim (PR) |
| CT-205 | Prêmio usa renda no momento do resultado | renda 100/s; compra que leva a 150/s a 10 s do resultado | Vitória | +**9.000** (60 × 150) | I | Sim (PR) |
| CT-206 | Determinismo pelo save | Save S com semente salva | Carregar S, jogar 14 partidas; recarregar S e repetir | As duas sequências de V/D são **idênticas** | I | Sim (PR) |
| CT-207 | Sem "save-scum" | Save S logo antes de uma partida | Jogar, ver derrota, reabrir S (sem salvar) e jogar de novo | Mesmo resultado (derrota) | I | Sim (PR) |
| CT-208 | Frequência bate com P | P = 0,768525, semente fixa | 10.000 partidas (PR) e 100.000 (noturna) | Taxa de vitórias em 0,768525 ± **0,0127** (10 mil) e ± **0,0040** (100 mil), margem de 3σ | P | Sim (PR e noturna) |
| CT-209 | Placar e P da próxima visíveis | E2E, 360×640 | Esperar 1 partida (relógio acelerado) | Antes: P(vitória) e placar 0-0 visíveis; depois: placar 1-0 ou 0-1 e nova P | E | Sim (PR smoke) |

## RN-010 — Temporada

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-210 | Calendário | Temporada nova | Ler a tabela de jogos | **14** partidas; cada um dos 7 rivais aparece **2** vezes | U | Sim (PR) |
| CT-211 | Gherkin "subir de divisão" | 9V-4D na Amadora | 14ª partida = vitória | 10-4 → **Desafiante**; renda passa a ×2; nova temporada **0-0**; P da próxima calculada contra 220 | I + E | Sim (PR smoke) |
| CT-212 | Gherkin "ninguém cai da Amadora" | 0V-14D na Amadora | Fim da temporada | Continua na **Amadora** | U | Sim (PR) |
| CT-213 | Fronteiras de subida e queda | Desafiante | Terminar com 10-4; 9-5; 4-10; 3-11 | **Sobe** (Academy); **mantém**; **mantém**; **cai** (Amadora, renda ×1) | U | Sim (PR) |
| CT-214 | Ninguém sobe do Mundial | Mundial | 14-0 | Continua no **Mundial** | U | Sim (PR) |
| CT-215 | Subida ao Mundial | Internacional | 10-4 | **Mundial**, multiplicador ×32 | U | Sim (PR) |
| CT-216 | Resumo e nova temporada na hora | E2E | Terminar uma temporada | Resumo com V-D e "subiu/manteve/caiu"; a próxima temporada começa **sem** exigir toque (o resumo não pausa o relógio das partidas) | E | Sim (main) |
| CT-217 | Marco de história na 1ª subida da run | Amadora, nunca subiu | Subir para Desafiante; cair; subir de novo | Marco registrado **uma** vez na run | I | Sim (PR) |
| CT-218 | Melhor divisão da run | Subir até Academy, cair para Desafiante | Ler estado | Divisão atual Desafiante; melhor da run **Academy** (base da RN-013) | U | Sim (PR) |
| CT-219 | Prêmio da partida que fecha com subida | renda base 100/s na Amadora, 9V-4D | 14ª = vitória | **6.000** (renda antes de subir) ou **12.000** (depois). **Bloqueado por pedido QA-6** | U | Sim após decisão |
| CT-220 | Sem temporada dupla | E2E | Minimizar e voltar exatamente no instante da 14ª partida | Uma só transição de temporada; contador nunca mostra 15 partidas | E | Sim (main) |
