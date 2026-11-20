# Casos — Números na tela e produto honesto

> RN-016 e RN-017 · Histórias NX-010 a NX-016 (transversais) · Faixa CT-600 a CT-699.
> RN-017: < 1.000 inteiro; depois 3 algarismos significativos, sufixos mil/mi/bi/tri; acima de
> 999 tri, científica. A convenção manda **arredondar para baixo**.

## RN-017 — Números na tela

| ID | Caso | Entrada | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|
| CT-600 | Abaixo de 1.000 | 0; 0,99; 10,999; 999,99 | "0"; "0"; "10"; "999" | U | Sim (PR) |
| CT-601 | Sufixos | 1.234; 1.999; 9.999; 99.999; 999.999; 45.678.000; 789.400.000.000; 1,234e12; 9,99999e14 | "1,23 mil"; "1,99 mil"; "9,99 mil"; "99,9 mil"; "999 mil"; "45,6 mi"; "789 bi"; "1,23 tri"; "999 tri" | U | Sim (PR) |
| CT-602 | Sem virar para cima | 999,999 mil (999.999) | "999 mil", nunca "1,00 mi" | U | Sim (PR) |
| CT-603 | Exatamente 1.000 | 1.000; 1.000.000 | "1,00 mil" e "1,00 mi" (3 algarismos) ou "1 mil" e "1 mi". **Bloqueado por pedido QA-13** | U | Sim após decisão |
| CT-604 | Armadilha do ponto flutuante | 4.350; 1.150; 2.010; 8.200; 2.300; 4.100 | "4,35 mil"; "1,15 mil"; "2,01 mil"; "8,20 mil"; "2,30 mil"; "4,10 mil". Uma implementação ingênua (`floor(4,35 × 100)`) dá "4,34 mil", "1,14 mil", "2,00 mil", "8,19 mil", "2,29 mil", "4,09 mil" | U | Sim (PR) |
| CT-605 | Científica | 1e15; 1,2345e15; 1,44e16; 1,5e100 | "1,00e15" (ou conforme pedido QA-13); "1,23e15"; "1,44e16"; "1,50e100" | U | Sim (PR) |
| CT-606 | Nada quebrado | Valores aleatórios em [0, 1e300] | Nunca "NaN", "Infinity", "undefined", "e+", ponto decimal em vez de vírgula | P | Sim (PR) |
| CT-607 | Nunca mostra mais do que tem | Valores aleatórios | O número exibido, lido de volta, é ≤ valor real; e a ordem é preservada (a > b ⇒ exibido(a) ≥ exibido(b)) | P | Sim (PR) |
| CT-608 | Mesmo número em todas as telas | E2E com ouro 1.234.567 | Ler o ouro no topo, na loja, na tela offline e no prestígio | Todas mostram "1,23 mi" | E | Sim (main) |
| CT-609 | Renda acima de 1 bi/s (risco 2 das RN) | 6 geradores com n=300 | Renda **2.491.516.800/s** (com ×64 de marco) → "2,49 bi"; custos com 1,15^300 = 1,619e18 finitos | U | Sim (PR) |
| CT-610 | Precisão acima de 2^53 | Ouro 1e16, toque de valor 1 | Sem travar nem mostrar valor errado; a perda de precisão no 1 é aceita e documentada | U | Sim (PR) |
| CT-611 | Valores fracionários < 1 | renda 0,5/s | O Gherkin da NX-010 espera "0,5/s", mas a RN-017 manda inteiro ("0"). **Bloqueado por pedido QA-13** | U + E | Sim após decisão |
| CT-612 | Texto não estoura em 360 px | Save com números máximos de cada tela | "999 tri" e "1,23e150" cabem sem reticências nem rolagem lateral em 360×640 | V + E | Sim (main) |

## RN-016 — Sem dinheiro real e sem pressão

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-620 | Nenhum preço real nas telas | E2E percorre todas as telas e estados | Procurar texto | Nenhuma ocorrência de `R$`, `US$`, `€`, "anúncio", "assistir vídeo", "doação", "premium", "VIP", "oferta" | E | Sim (PR smoke) |
| CT-621 | Nenhum SDK de venda, anúncio ou rastreio | Lista de dependências e bundle final | Varredura | Nenhum pacote de pagamento, anúncio ou analytics (lista proibida em `seguranca.md`, A6) | S | Sim (PR) |
| CT-622 | Sem contagem regressiva falsa | Todas as telas | Inspecionar timers | Todo timer visível corresponde a um evento real (próxima partida em 90 s); nenhum "oferta acaba em" | E + A | Sim (main) |
| CT-623 | Notificação só se o jogador ativar | Instalação limpa | Abrir pela 1ª vez e jogar 5 min | O jogo **não** pede permissão de notificação; só após ativar em Configurações | E | Sim (PR) [stack]; manual no Android |
| CT-624 | Permissões mínimas | App instalado **[stack]** | Ler manifest / permissões | Nenhuma permissão além das estritamente necessárias (ver `seguranca.md`) | S | Sim (PR) |
