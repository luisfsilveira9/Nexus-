# Casos — Partidas, split e título mundial

> RN-009 e RN-010 · História NX-012 · Faixa CT-200 a CT-299. **v0.2** (NX-009).
> P(vitória) = `limitar(1 / (1 + e^(−6x)), 5%, 95%)`, `x = poder_time / poder_rival − 1`. Na tela:
> inteiro arredondado ao **mais próximo** (RN-017, QA-3 decidido).
> **Split** = bloco de 14 partidas (RN-010). "Temporada" só no arco narrativo.
> **Relógio de partida:** 90 s, conta com o app em primeiro plano, pausa nas boas-vindas, capítulo,
> tela "Enquanto você esteve fora" e confirmação da refundação; fica no save (RN-009).

## RN-009 — Partida

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-200 | P(vitória) — tabela | — | Calcular | 72×60: **0,768525** → 77% · 60×60: **0,5** → 50% · 48×60: **0,231475** → 23% · 50×60 (clube novo): **0,268941** → 27% · 40×60: **0,119203** → 12% · 69×60: **0,710950** → 71% · 264×220: **0,768525** → 77% · 62,5×60: **0,562177** → 56% · 55×60: **0,377541** → 38% | U | Sim (PR) |
| CT-201 | Limites de 5% e 95% | — | Calcular | 100×60 → **95%**; 120×60 → **95%**; 30×60 → **5%**; 1×1.500.000 → **5%**. Fronteira: x = ±ln(19)/6 = ±0,490740; poder 89,4444 × 60 → **95%** | U | Sim (PR) |
| CT-202 | Gherkin "chance mostrada" | Poder do time 72, rival 60 (Várzea) | Abrir a tela principal | A tela mostra **77%** antes da partida | E | Sim (PR smoke) |
| CT-203 | Intervalo de 90 s (monotônico) | App aberto, boas-vindas fechadas, relógio monotônico injetado | Avançar 89 s; 90 s; 180 s | 0 partidas; **1**; **2** | I | Sim (PR) |
| CT-204 | Prêmio da vitória | renda 100/s, sorteio forçado | Vitória; derrota | +**6.000**; +**0** | U | Sim (PR) |
| CT-205 | Prêmio usa a renda do momento (sem mudança de divisão) | renda 100/s; compra que leva a 150/s a 10 s do resultado | Vitória que não fecha o split | +**9.000** (60 × 150) | I | Sim (PR) |
| CT-206 | Determinismo pelo save | Save S com semente salva | Carregar S, jogar 14 partidas; recarregar S e repetir | As duas sequências de V/D são **idênticas** | I | Sim (PR) |
| CT-207 | Sem "save-scum" | Save S logo antes de uma partida | Jogar, ver derrota, reabrir S (sem salvar) e jogar de novo | Mesmo resultado (derrota) | I | Sim (PR) |
| CT-208 | Frequência bate com P | P = 0,768525, semente fixa | 10.000 partidas (PR) e 100.000 (noturna) | Taxa de vitórias em 0,768525 ± **0,0127** (10 mil) e ± **0,0040** (100 mil), margem de 3σ | P | Sim (PR e noturna) |
| CT-209 | Placar e P da próxima visíveis | E2E, 360×640 | Esperar 1 partida (tempo acelerado de teste, C3) | Antes: P(vitória) e placar 0-0; depois: 1-0 ou 0-1 e nova P | E | Sim (PR smoke) |
| CT-221 | 1ª partida conta ao fechar as boas-vindas | Clube novo, boas-vindas abertas | Deixar as boas-vindas abertas 5 min; fechar; avançar 89 s; 90 s | Nenhuma partida com as boas-vindas abertas; depois de fechar: 0 em 89 s, **1** em 90 s | I | Sim (PR) |
| CT-222 | Pausa com capítulo aberto, renda não pausa | Faltam 30 s; Aulas n=1 (0,5/s) | Abrir um capítulo por 120 s; fechar; avançar 30 s | Com o capítulo: 0 partidas, ainda faltam **30 s**, ouro +**60** (120 × 0,5). Depois de fechar: partida aos 30 s | I | Sim (PR) |
| CT-223 | Pausa na tela offline e na confirmação de refundação | Faltam 20 s | (a) tela "Enquanto você esteve fora" aberta 60 s; (b) etapa 1 da refundação aberta 60 s e cancelar; (c) etapa 2 aberta 60 s e cancelar | Nos três: nenhuma partida, continuam faltando **20 s**; a contagem volta depois de fechar | I | Sim (PR) |
| CT-224 | Relógio de partida fica no save | Faltam 37 s | Salvar e reabrir com t_off = 0 | Continuam faltando **37 s** (não 90) | I | Sim (PR) |
| CT-225 | Resumo do split e falas não pausam | Fim de split na tela | Deixar o resumo aberto 90 s | **1** partida do novo split acontece (o resumo e a fala de 1 linha não estão na lista de pausa da RN-009) | I | Sim (PR) |

## RN-010 — Split

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-210 | Calendário | Split novo | Ler a tabela de jogos | **14** partidas; cada um dos 7 rivais **2** vezes | U | Sim (PR) |
| CT-211 | Gherkin "subir de divisão" | 9V-4D na Várzea, renda 100/s | 14ª partida = vitória | Prêmio **6.000**; 10-4 → **Acesso**; renda ×2 (**200/s**); novo split **0-0**; P da próxima contra 220 | I + E | Sim (PR smoke) |
| CT-212 | Gherkin "ninguém cai da Várzea" | 0V-14D na Várzea | Fim do split | Continua na **Várzea**; resumo "manteve" | U | Sim (PR) |
| CT-213 | Fronteiras de subida e queda | Acesso | Terminar com 10-4; 9-5; 4-10; 3-11 | **Sobe** (Ascensão); **mantém**; **mantém**; **cai** (Várzea, renda ×1) | U | Sim (PR) |
| CT-214 | Ninguém sobe do Mundial | Mundial | 14-0 | Continua no **Mundial**; conta como título (CT-230) | U | Sim (PR) |
| CT-215 | Subida ao Mundial | Continental | 10-4 | **Mundial**, multiplicador ×32 | U | Sim (PR) |
| CT-216 | Resumo e novo split na hora | E2E | Terminar um split | Resumo com V-D e "subiu/manteve/caiu/campeão"; o próximo split começa **sem** exigir toque | E | Sim (main) |
| CT-217 | Chegada repetida a uma divisão | Várzea, capítulo do Acesso nunca visto | Subir ao Acesso; cair; subir de novo | 1ª chegada: capítulo (RN-018); 2ª: só a fala de 1 linha. Detalhes em CT-712 a CT-716 | I | Sim (PR) |
| CT-218 | Melhor divisão da run | Subir até a Ascensão, cair para o Acesso | Ler o estado | Divisão atual Acesso; melhor da run **Ascensão** (base da RN-013) | U | Sim (PR) |
| CT-219 | Prêmio da partida que fecha com subida | Renda base 100/s na Várzea (100/s), 9V-4D | 14ª = vitória | **6.000** (renda de antes da subida; QA-6 decidido), não 12.000 | U | Sim (PR) |
| CT-220 | Sem split duplo | E2E | Minimizar e voltar exatamente no instante da 14ª partida | Uma só transição de split; o contador nunca mostra 15 partidas | E | Sim (main) |
| CT-226 | Prêmio da partida que fecha com queda | Acesso, renda base 100 (200/s), 2V-11D | 14ª = vitória (3-11) | Prêmio **12.000** (renda ×2 de antes da queda); depois cai para a Várzea (100/s) | U | Sim (PR) |

## RN-010 — Título mundial

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-230 | Título mundial | Mundial, renda base 100 (3.200/s), 9V-4D, 0 títulos | 14ª = vitória | 10-4 → **título**; prêmio **192.000** (60 × 3.200); continua no Mundial (×32); histórico com **1** título; novo split 0-0 | I | Sim (PR) |
| CT-231 | Fronteiras no Mundial | Mundial | Terminar com 10-4; 14-0; 9-5; 4-10; 3-11 | **Título**; **título**; manteve sem título; manteve; **cai** (Continental, ×16) | U | Sim (PR) |
| CT-232 | Títulos acumulam no histórico | 1 título | Ganhar outro split no Mundial com 12-2 | Histórico com **2** títulos; nenhuma mudança de divisão | U | Sim (PR) |
| CT-233 | Resumo mostra "campeão" | E2E, Mundial 9V-4D, sorteio forçado | 14ª = vitória | Resumo com 10-4 e o resultado "campeão" (texto do lore); depois, epílogo se for o 1º título (CT-720) | E | Sim (main) |
