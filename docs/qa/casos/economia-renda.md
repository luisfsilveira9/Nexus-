# Casos — Recursos, renda, geradores, toque e compra em lote

> RN-001 a RN-006 · História NX-010 · Faixa CT-001 a CT-099.
> Valores calculados com as fórmulas da RN v0.1 em precisão dupla (IEEE 754). "≈" indica
> comparação com tolerância relativa de 1e-9 até o PO decidir o pedido QA-4.
> **Auto:** Sim (PR) = roda em todo PR · Sim (main/noturna) = só nessas pipelines · Não = manual.
> Nível: U = unitário, P = propriedade, I = integração, E = E2E, V = visual, A = usabilidade/acessib., S = segurança.

Pré-condição comum (salvo indicação): clube novo, Legado 0, divisão Amadora (×1), relógio e sorteio
injetados, sem toques.

## RN-001 — Recursos

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-001 | Só duas moedas | Clube novo | Ler o estado do jogo | O estado tem exatamente `ouro` e `legado` como recursos; nenhum outro campo de moeda | U | Sim (PR) |
| CT-002 | Compra com ouro = custo exato | Ouro 10, Live n=0 | Comprar ×1 Live | Compra aceita; n=1; ouro ≈ 0 (nunca < 0) | U | Sim (PR) — fronteira depende do pedido QA-4 |
| CT-003 | Compra com ouro abaixo do custo | Ouro 9,99, Live n=0 | Comprar ×1 Live | Compra recusada; ouro 9,99 e n=0 inalterados; nenhuma mensagem de erro técnico | U | Sim (PR) |
| CT-004 | Nada negativo, `NaN` ou infinito | Estado aleatório válido | Sequência aleatória de 1 a 200 ações (tocar, comprar ×1/×10/Máx, subir nível, passar tempo, partida, sair/voltar, prestígio) | Após cada ação: `ouro ≥ 0`, `legado ≥ 0`, ambos finitos; contagens inteiras ≥ 0 | P | Sim (PR: 1.000 sequências; noturna: 100.000) |
| CT-005 | Sem recurso infinito | Idem | Mesmo gerador do CT-004, medindo ouro ganho por segundo de jogo | Nenhuma sequência gera ouro maior que o teto teórico `renda/s × t + 5 toques/s × t + prêmios + offline ≤ 8 h × 0,5` | P | Sim (noturna) |

## RN-002 — Renda por segundo

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-010 | Fórmula composta | Live n=10, Patrocínio n=2, Desafiante (×2), Legado 10 | Calcular renda/s | (0,5×10 + 6×2) × 2 × (1 + 0,05×10) = 17 × 2 × 1,5 = **51,0/s** | U | Sim (PR) |
| CT-011 | Todos os geradores com 1 unidade | n=1 em todos, Amadora, Legado 0 | Calcular renda/s | 0,5+6+60+700+9.000+120.000 = **129.766,5/s** | U | Sim (PR) |
| CT-012 | Crédito contínuo | Live n=1 (0,5/s), ouro 0 | Avançar o relógio injetado 1 s, depois mais 9 s | Após 1 s: ouro 0,5; após 10 s: ouro **5,0**; o intervalo entre créditos nunca passa de 1 s | I | Sim (PR) |
| CT-013 | Renda online usa relógio monotônico | Live n=1, app aberto | Avançar o tempo monotônico 1 s e, no mesmo instante, pular o relógio de parede +8 h | Ganho online do intervalo = **0,5** (1 s), não 14.400. O salto de relógio com o app aberto não credita nada extra (ver pedido QA-11) | I | Sim (PR) |
| CT-014 | Renda nunca diminui ao comprar | Estado aleatório | Comprar qualquer gerador | renda/s depois ≥ renda/s antes; renda/s ≥ 0 sempre | P | Sim (PR) |

## RN-003 — Geradores (custo e visibilidade)

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-020 | Custo da próxima unidade (tabela) | — | Calcular `custo_base × 1,15^n` | Live n=0: **10**; n=1: **11,5**; n=2: **13,225**; n=10: **40,455577**; n=49: **9.423,108**; n=50: **10.836,574**. Arena n=0: **8.000.000**; n=50: **8.669.259.532,67**; n=100: **9,3945e12** | U | Sim (PR) |
| CT-021 | Custo estritamente crescente | — | Para os 6 geradores e n de 0 a 1.000 | `custo(n+1) > custo(n)` e finito | P | Sim (PR) |
| CT-022 | Gerador visível a 50% do custo base | Clube novo (ouro inicial, pedido QA-1) | Dar ouro até cada limiar | Live visível desde o início (5 ≤ ouro inicial 10). Patrocínio oculto com 74,99 e visível com **75**; Loja **1.000**; Canal **15.000**; Fan fest **250.000**; Arena **4.000.000** | I | Sim (PR) — "ouro atual × acumulado" depende do pedido QA-15 |
| CT-023 | Visível continua visível | Ouro chegou a 75 (Patrocínio visível) | Gastar até ouro 10 | Patrocínio continua visível, mas **não comprável** (150 > 10); fica comprável com ouro ≥ 150 | I | Sim (PR) |
| CT-024 | Visibilidade zera no prestígio | Patrocínio visível, prestígio feito | Voltar ao início da run | Patrocínio oculto de novo até o limiar de 75 ("pela primeira vez na run") | I | Sim (PR) |
| CT-025 | Gerador oculto no E2E | Clube novo, 360×640 | Abrir a tela principal | Só Live aparece; os 5 outros não aparecem nem como silhueta clicável (o modo de "silhueta" é decisão do UX) | E | Sim (PR smoke) |

## RN-004 — Marcos de gerador

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-030 | Renda dobra a cada 50 | Live | Calcular renda com n = 49, 50, 99, 100 | n=49: **24,5/s**; n=50: **50,0/s**; n=99: **99,0/s**; n=100: **200,0/s** | U | Sim (PR) |
| CT-031 | Faltam para o próximo marco | Live | Calcular "faltam" para n = 0, 49, 50, 137 | **50**, **1**, **50**, **13** | U | Sim (PR) |
| CT-032 | Marco aparece na tela | Live n=49, ouro suficiente | Comprar 1 | Texto de "faltam" passa de 1 para 50; renda exibida passa de 24 para 50 | E | Sim (main) |

## RN-005 — Toque

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-040 | Valor do toque | renda 100/s | 1 toque | **+10** | U | Sim (PR) |
| CT-041 | Mínimo de 1 | renda 0; 5; 10; 15 | 1 toque em cada | **+1**; **+1** (0,5 → mín. 1); **+1**; **+1,5** | U | Sim (PR) |
| CT-042 | Toque usa renda com multiplicadores | Estado do CT-010 (51,0/s) | 1 toque | **+5,1** | U | Sim (PR) |
| CT-043 | Gherkin "toque limitado" | renda 100/s, relógio congelado para isolar a renda passiva | 8 toques em 1 s (a cada 125 ms) | Ganho dos toques = **50** (5 × 10). 6º, 7º e 8º ignorados | U + E | Sim (PR) |
| CT-044 | Excesso sem aviso | Idem | 6 toques em 1 s no E2E | Nenhum toast, alerta, vibração de erro ou texto de erro aparece | E | Sim (PR smoke) |
| CT-045 | Virada da janela de 1 s | renda 100/s | 5 toques entre t=0,90 s e 0,99 s e 5 entre t=1,01 s e 1,10 s | Janela deslizante: ganho **50** (só 5 contam em qualquer 1 s). Janela fixa: ganho **100**. **Bloqueado por pedido QA-7** | U | Sim (PR) após decisão |
| CT-046 | Multitoque | E2E, 3 dedos simultâneos, 20 toques em 1 s | Tocar | Ganho ≤ 5 × valor do toque | E | Sim (main) |
| CT-047 | Propriedade do limite | Sequências aleatórias de instantes de toque em 60 s | Contar ganho | Em qualquer janela de 1 s, toques creditados ≤ 5 | P | Sim (PR) |

## RN-006 — Compra em lote (×1, ×10, Máx)

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-050 | Custo de ×10 | Live n=0; Live n=1 | Calcular lote k=10 | n=0: **203,0371823805** ; n=1: **233,4927597376** | U | Sim (PR) |
| CT-051 | Lote k=1 = custo unitário | Live n=0, ouro 10 | Comprar ×1 | Fórmula de lote com k=1 dá 9,999999999999995 em ponto flutuante; o custo cobrado tem de ser **10** (≈) e a compra é aceita com ouro 10. Ver pedido QA-4 | U | Sim (PR) |
| CT-052 | Lote = soma das unidades | n ∈ [0, 500], k ∈ [1, 100], 6 geradores | Comparar fórmula com a soma de k compras ×1 | Iguais com tolerância relativa 1e-9 (ex.: n=0, k=10: soma 203,03718238052727 × fórmula 203,0371823805271) | P | Sim (PR) |
| CT-053 | Máx — exemplos | Live | Máx com: ouro 100 (n=0); ouro 1.000 (n=0); ouro 1.000 (n=10) | k=**6**, custo 87,5374, sobra 12,4626; k=**19**, custo 882,1181, sobra 117,8819; k=**11**, custo 985,0640, sobra 14,9360 | U | Sim (PR) |
| CT-054 | Máx no limite exato | Live n=0, ouro = 203,0371823805271 | Máx | k=**10**, ouro final ≈ 0 e ≥ 0 | U | Sim (PR) |
| CT-055 | Máx é o maior k | Estado aleatório | Máx | `lote(k) ≤ ouro < lote(k+1)` | P | Sim (PR) |
| CT-056 | Máx com k=0 | Live n=0, ouro 5 | Abrir a loja | Botão Máx **desabilitado**, mostra "faltam **5**" (10 − 5) | U + E | Sim (PR) |
| CT-057 | Máx k=0 com falta fracionária | Live n=0, ouro 9,4 | Abrir a loja | Falta real 0,6. Exibido "faltam **1**" se o arredondamento de custo/falta for para cima; "faltam **0**" com o botão desabilitado se for para baixo (incoerente). **Bloqueado por pedido QA-2** | U + E | Sim (PR) após decisão |
| CT-058 | ×10 sem ouro para 10 | Live n=0, ouro 150 (×10 custa 203,04) | Tocar ×10 | Comportamento não definido na RN. **Bloqueado por pedido QA-8** | E | Sim após decisão |
| CT-059 | Máx com número grande | Live n=0, ouro 1e15 | Máx | k=**217**, custo ≈ 9,8933e14; termina em < 5 ms (fórmula fechada, sem laço de 1 em 1) | U | Sim (PR) |
| CT-060 | Toque duplo no botão de compra | Live n=0, ouro 10 | 2 toques em 50 ms em ×1 | Só 1 unidade comprada; ouro ≈ 0; nunca negativo | E | Sim (PR smoke) |

## Gherkin NX-010

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-070 | Comprar o primeiro gerador | Clube novo com 10 de ouro, nenhum gerador | Comprar 1 "Live do time" | Ouro exibido **0**; renda **0,5/s** (exibida "0" pela RN-017; ver pedido QA-13 sobre renda < 1); próximo custo interno **11,5** e exibido **11** conforme o Gherkin (ver pedido QA-2) | E | Sim (PR smoke) |
| CT-071 | Toque limitado | = CT-043 | | | E | Sim (PR smoke) |
| CT-072 | Máx sem ouro suficiente | = CT-056 | | | E | Sim (PR smoke) |
