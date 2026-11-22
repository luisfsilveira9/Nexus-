# Casos — Recursos, renda, negócios, toque e compra em lote

> RN-001 a RN-006 · História NX-010 · Faixa CT-001 a CT-099. **v0.2** (NX-009, 20/11/2026), RN v0.2.
> Valores calculados com as fórmulas das RN v0.2 em precisão dupla (IEEE 754), conferidos em Node 22.
> **Comparação de dinheiro (Convenções das RN):** `ouro ≥ custo` quer dizer `ouro ≥ custo × (1 − 10⁻⁹)`;
> depois da compra, `ouro = max(0, ouro − custo)`. "≈" = igual com tolerância relativa de 10⁻⁹.
> Valores **exibidos** seguem a RN-017 v0.2: ouro e renda para baixo; custos e "Faltam" para cima;
> abaixo de 100, 1 casa decimal sem zero final.
> **Auto:** Sim (PR) = roda em todo PR · Sim (main/noturna) = só nessas pipelines · Não = manual.
> Nível: U = unitário, P = propriedade, I = integração, E = E2E, V = visual, A = usabilidade/acessib., S = segurança.

Pré-condição comum (salvo indicação): clube novo (**10 de ouro**, RN-001), Legado 0, divisão Várzea
(×1), relógio e sorteio injetados, sem toques.

## RN-001 — Recursos

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-001 | Só duas moedas | Clube novo | Ler o estado do jogo | O estado tem exatamente `ouro` e `legado` como recursos; nenhum outro campo de moeda | U | Sim (PR) |
| CT-002 | Compra com ouro = custo exato | Ouro 10, Aulas na lan n=0 | Comprar ×1 | Compra aceita; n=1; ouro **0** exato (`max(0, 10 − 10)`) | U | Sim (PR) |
| CT-003 | Compra com ouro abaixo do custo | Ouro 9,99, Aulas n=0 | Comprar ×1 | Recusada; ouro 9,99 e n=0 inalterados; nenhuma mensagem de erro técnico | U | Sim (PR) |
| CT-004 | Nada negativo, `NaN` ou infinito | Estado aleatório válido | Sequência aleatória de 1 a 200 ações (tocar, comprar ×1/×10/Máx, subir nível, passar tempo, partida, sair/voltar, refundar, renomear) | Após cada ação: `ouro ≥ 0`, `legado ≥ 0`, ambos finitos; contagens inteiras ≥ 0 | P | Sim (PR: 1.000 sequências; noturna: 100.000) |
| CT-005 | Sem recurso infinito | Idem | Mesmo gerador do CT-004, medindo ouro ganho por segundo de jogo | Nenhuma sequência gera ouro acima do teto `renda/s × t + 5 toques/s × t + prêmios + offline ≤ 8 h × 0,5` (o offline conta uma vez por avanço real do `maior`, RN-012) | P | Sim (noturna) |
| CT-006 | Tolerância de 10⁻⁹ na fronteira | Aulas n=0 | Comprar ×1 com ouro `10 × (1 − 10⁻¹⁰)` = 9,999999999; depois com ouro `10 × (1 − 2 × 10⁻⁹)` = 9,99999998 | 1º: aceita, ouro final **0** (nunca negativo). 2º: recusada, nada muda | U | Sim (PR) |
| CT-007 | Ouro inicial | Instalação limpa | Criar clube | Ouro **10** (exibido "10"), Legado 0, nenhum negócio | U + E | Sim (PR smoke) |

## RN-002 — Renda por segundo

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-010 | Fórmula composta | Aulas n=10, Patrocínio n=2, Acesso (×2), Legado 10 | Calcular renda/s | (0,5×10 + 6×2) × 2 × (1 + 0,05×10) = 17 × 2 × 1,5 = **51/s** (exibido "51/s") | U | Sim (PR) |
| CT-011 | Todos os negócios com 1 unidade | n=1 em todos, Várzea, Legado 0 | Calcular renda/s | 0,5+6+60+700+9.000+120.000 = **129.766,5/s** (exibido "129 mil/s") | U | Sim (PR) |
| CT-012 | Crédito contínuo | Aulas n=1 (0,5/s), ouro 0 | Avançar o relógio monotônico 1 s, depois mais 9 s | Após 1 s: ouro 0,5; após 10 s: **5**; o intervalo entre créditos nunca passa de 1 s | I | Sim (PR) |
| CT-013 | Renda online usa relógio monotônico | Aulas n=1, app aberto | Avançar o monotônico 1 s e, no mesmo instante, pular o relógio de parede +8 h | Ganho online do intervalo = **0,5**, não 14.400. O salto não credita nada com o app aberto (efeito no `maior`: CT-326, CT-329) | I | Sim (PR) |
| CT-014 | Renda nunca diminui ao comprar | Estado aleatório | Comprar qualquer negócio | renda/s depois ≥ renda/s antes; renda/s ≥ 0 sempre | P | Sim (PR) |

## RN-003 — Negócios (custo e visibilidade)

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-020 | Custo da próxima unidade (tabela) | — | Calcular `custo_base × 1,15^n` | Aulas n=0: **10** ("10"); n=1: **11,5** ("11,5"); n=2: **13,225** ("13,3"); n=10: **40,455577** ("40,5"); n=49: **9.423,108** ("9,43 mil"); n=50: **10.836,574** ("10,9 mil"). Arena n=0: **8.000.000** ("8,00 mi"); n=50: **8.669.259.532,67** ("8,67 bi"); n=100: **9,3945e12** ("9,40 tri"). Exibição arredondada para cima | U | Sim (PR) |
| CT-021 | Custo estritamente crescente | — | Para os 6 negócios e n de 0 a 1.000 | `custo(n+1) > custo(n)` e finito | P | Sim (PR) |
| CT-022 | Negócio visível a 50% do custo base, pelo **ouro acumulado na run** | Clube novo | Fazer entrar ouro (sem gastar) até cada limiar | "Aulas na lan" visível desde o início. Limiares do acumulado: Patrocínio local **75**, Camisa oficial **1.000**, Canal do clube **15.000**, Festa da torcida **250.000**, Arena do clube **4.000.000**: oculto com o limiar − 0,01 e visível no limiar. Se os **10 iniciais** contam no acumulado: **pedido QA-20** (com eles, o Patrocínio aparece depois de ganhar 65; sem eles, depois de ganhar 75) | I | Sim (PR) — o limiar fechado; a origem do acumulado após QA-20 |
| CT-023 | Visível continua visível | Acumulado chegou a 75 (Patrocínio visível) | Gastar até ouro 10 | Patrocínio continua visível, mas **não comprável** (150 > 10); fica comprável com ouro ≥ 150 | I | Sim (PR) |
| CT-024 | Visibilidade zera na refundação | Patrocínio visível, refundação feita | Voltar ao início da run | Patrocínio oculto de novo até o acumulado da nova run chegar ao limiar; acumulado da run volta a 0 (ou 10, QA-20) | I | Sim (PR) |
| CT-025 | Negócio oculto no E2E | Clube novo, 360×640 | Abrir a tela principal | Só "Aulas na lan" aparece; os 5 outros não aparecem como item comprável (o modo "silhueta" é do UX) | E | Sim (PR smoke) |
| CT-026 | Acumulado conta todas as entradas | Clube novo, 4 cenários separados | Fazer entrar 75 de ouro só por (a) renda, (b) toques, (c) prêmio de partida, (d) ganho offline | Patrocínio visível nos 4 cenários (descontado o efeito do QA-20) | I | Sim (PR) |
| CT-027 | Gastar não reduz o acumulado | Clube novo | Ganhar 70, gastar 60, ganhar mais 5 | Ouro atual baixo, mas acumulado 75 → Patrocínio **visível** (decisão do QA-15) | I | Sim (PR) |

## RN-004 — Marcos de negócio

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-030 | Renda dobra a cada 50 | Aulas na lan | Calcular renda com n = 49, 50, 99, 100 | n=49: **24,5/s** ("24,5/s"); n=50: **50/s**; n=99: **99/s**; n=100: **200/s** | U | Sim (PR) |
| CT-031 | Faltam para o próximo marco | Aulas | Calcular "faltam" para n = 0, 49, 50, 137 | **50**, **1**, **50**, **13** | U | Sim (PR) |
| CT-032 | Marco aparece na tela | Aulas n=49, ouro suficiente | Comprar 1 | "Faltam" passa de 1 para 50; renda exibida passa de "24,5/s" para "50/s" | E | Sim (main) |

## RN-005 — Toque ("Fazer live")

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-040 | Valor do toque | renda 100/s | 1 toque | **+10** | U | Sim (PR) |
| CT-041 | Mínimo de 1 | renda 0; 5; 10; 15 | 1 toque em cada | **+1**; **+1** (0,5 → mín. 1); **+1**; **+1,5** (exibido "+1,5") | U | Sim (PR) |
| CT-042 | Toque usa renda com multiplicadores | Estado do CT-010 (51/s) | 1 toque | **+5,1** | U | Sim (PR) |
| CT-043 | Gherkin "toque limitado" | renda 100/s, renda passiva isolada (relógio congelado) | 8 toques em 1 s (a cada 125 ms) | Ganho dos toques = **50** (5 × 10); 6º, 7º e 8º ignorados | U + E | Sim (PR) |
| CT-044 | Excesso sem aviso | Idem | 6 toques em 1 s no E2E | Nenhum toast, alerta, vibração de erro ou texto de erro | E | Sim (PR smoke) |
| CT-045 | Janela **móvel** na virada do segundo | renda 100/s | 5 toques entre t=0,90 s e 0,99 s e 5 entre t=1,01 s e 1,10 s | Ganho **50**: só 5 contam em qualquer janela de 1 s (QA-7 decidido: janela móvel) | U | Sim (PR) |
| CT-046 | Multitoque | E2E, 3 dedos simultâneos, 20 toques em 1 s | Tocar | Ganho ≤ 5 × valor do toque | E | Sim (main) |
| CT-047 | Propriedade do limite | Sequências aleatórias de instantes em 60 s | Contar ganho | Em qualquer janela de 1 s, toques creditados ≤ 5 | P | Sim (PR) |
| CT-048 | Toque ignorado não ocupa a janela | renda 100/s | Toques em t = 0; 0,1; 0,2; 0,3; 0,4; 0,99; 1,05 s | Contam 0–0,4 (5) e 1,05 (na janela (0,05; 1,05] só há 4 creditados); 0,99 é ignorado. Ganho **60** | U | Sim (PR) |

## RN-006 — Compra em lote (×1, ×10, Máx)

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-050 | Custo de ×10 | Aulas n=0; n=1 | Calcular lote k=10 | n=0: **203,0371823805** (exibido "204"); n=1: **233,4927597376** ("234") | U | Sim (PR) |
| CT-051 | ×1 usa a fórmula da unidade | Aulas n=0, ouro 10 | Comprar ×1 | Custo cobrado **10** exato (fórmula da RN-003, não a de lote, que daria 9,999999999999995); aceita; ouro 0 | U | Sim (PR) |
| CT-052 | Lote = soma das unidades | n ∈ [0, 500], k ∈ [1, 100], 6 negócios | Comparar fórmula fechada com a soma de k compras ×1 | Iguais com tolerância relativa 10⁻⁹ (ex.: n=0, k=10: soma 203,03718238052727 × fórmula 203,0371823805271) | P | Sim (PR) |
| CT-053 | Máx — exemplos | Aulas | Máx com: ouro 100 (n=0); ouro 1.000 (n=0); ouro 1.000 (n=10); ouro 150 (n=0) | k=**6**, custo 87,5374, sobra 12,4626; k=**19**, custo 882,1181, sobra 117,8819; k=**11**, custo 985,0640, sobra 14,9360; k=**8**, custo 137,2682, sobra 12,7318 | U | Sim (PR) |
| CT-054 | Máx no limite exato | Aulas n=0, ouro = 203,0371823805271 | Máx | k=**10**, ouro final **0** ou resíduo ≥ 0 de ordem 10⁻¹³ | U | Sim (PR) |
| CT-055 | Máx é o maior k | Estado aleatório | Máx | `lote(k) ≤ ouro` (com a tolerância) e `lote(k+1) > ouro` (com a tolerância) | P | Sim (PR) |
| CT-056 | Máx com k=0 | Aulas n=0, ouro 5 | Abrir a loja | Máx **desabilitado**, "Faltam **5**" | U + E | Sim (PR) |
| CT-057 | "Faltam" fracionário, para cima | Aulas n=0 | Abrir a loja com ouro 9,4; 9,94; 9,99 | "Faltam **0,6**"; "Faltam **0,1**" (0,06 para cima); "Faltam **0,1**" (0,01 para cima). Nunca "Faltam 0" com botão desabilitado (QA-2 decidido) | U + E | Sim (PR) |
| CT-058 | ×10 sem ouro para 10 | Aulas n=0, ouro 150 | Abrir a loja e tocar ×10 | ×10 **desabilitado**, "Faltam **53,1**" (falta real 53,0372, para cima); o toque não compra nada. ×1 e Máx (k=8) habilitados (QA-8 decidido) | U + E | Sim (PR) |
| CT-059 | Máx com número grande | Aulas n=0, ouro 1e15 | Máx | k=**217**, custo ≈ 9,8933e14; termina em < 5 ms (fórmula fechada, sem laço de 1 em 1) | U | Sim (PR) |
| CT-060 | Toque duplo no botão de compra | Aulas n=0, ouro 10 | 2 toques em 50 ms em ×1 | Só 1 unidade; ouro 0; nunca negativo | E | Sim (PR smoke) |
| CT-061 | ×10 na fronteira | Aulas n=0 | Ouro 203,0371823805271: tocar ×10. Depois, noutro estado, ouro 203 | 1º: compra 10, ouro 0. 2º: ×10 desabilitado, "Faltam **0,1**" (0,0372 para cima) | U + E | Sim (PR) |

## Gherkin NX-010

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-070 | Comprar o primeiro negócio | Clube novo com 10 de ouro, nenhum negócio | Comprar 1 "Aulas na lan" | Ouro exibido "**0**"; renda "**0,5/s**"; próximo custo interno **11,5**, exibido "**11,5**" | E | Sim (PR smoke) |
| CT-071 | Toque limitado | = CT-043 | | | E | Sim (PR smoke) |
| CT-072 | Compra Máx sem ouro suficiente | = CT-056 e CT-057 | | Máx desabilitado e mostra quanto falta, para cima | E | Sim (PR smoke) |
