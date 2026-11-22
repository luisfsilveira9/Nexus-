# Casos — Números na tela e produto honesto

> RN-016 e RN-017 · Histórias NX-010 a NX-018 (transversais) · Faixa CT-600 a CT-699. **v0.2** (NX-009).
> RN-017 v0.2: abaixo de 100, 1 casa decimal sem zero final; 100 a < 1.000, inteiro; 1.000 a < 10¹⁵,
> 3 algarismos significativos **com zeros finais**, espaço e unidade (mil, mi, bi, tri); ≥ 10¹⁵,
> mantissa de 3 algarismos + "e" + expoente. Ouro, renda, poder e ganhos **para baixo**; custos e
> "Faltam" **para cima**; porcentagem inteira ao mais próximo. O botão segue o valor real.
> As entradas abaixo são valores exatos (inteiros ou decimais curtos). O que fazer quando o valor
> interno difere do decimal por erro de ponto flutuante (ex.: `10 − 9,7 = 0,3000000000000007`) está
> no **pedido QA-22** (CT-616).

## RN-017 — Números na tela

| ID | Caso | Entrada | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|
| CT-600 | Abaixo de 100, para baixo | 0; 0,05; 0,5; 0,99; 10,5; 11; 10,999; 99,99 | "0"; "0"; "0,5"; "0,9"; "10,5"; "11"; "10,9"; "99,9" | U | Sim (PR) |
| CT-601 | Sufixos, para baixo | 100; 999,99; 1.234; 1.999; 9.999; 12.500; 99.999; 1.234.567; 45.678.000; 789.400.000.000; 1,234e12; 9,99999e14 | "100"; "999"; "1,23 mil"; "1,99 mil"; "9,99 mil"; "12,5 mil"; "99,9 mil"; "1,23 mi"; "45,6 mi"; "789 bi"; "1,23 tri"; "999 tri" | U | Sim (PR) |
| CT-602 | Sem virar para cima | 999.999 (ouro) | "999 mil", nunca "1,00 mi" nem "1.000 mil" | U | Sim (PR) |
| CT-603 | Exatamente na troca de faixa | 1.000; 1.000.000; 1e15 (ouro e custo) | "1,00 mil"; "1,00 mi"; "1,00e15" nas duas direções (QA-13 decidido) | U | Sim (PR) |
| CT-604 | Armadilha do ponto flutuante (para baixo) | 4.350; 1.150; 2.010; 8.200; 2.300; 4.100 | "4,35 mil"; "1,15 mil"; "2,01 mil"; "8,20 mil"; "2,30 mil"; "4,10 mil". A conta ingênua `floor(4,35 × 100)` dá "4,34 mil" | U | Sim (PR) |
| CT-605 | Científica | 1e15; 1,2345e15; 1,44e16; 9,999e15; 1,5e100 | "1,00e15"; "1,23e15"; "1,44e16"; "9,99e15"; "1,50e100" | U | Sim (PR) |
| CT-606 | Nada quebrado | Valores aleatórios em [0, 1e300], nas duas direções | Nunca "NaN", "Infinity", "undefined", "e+", ponto decimal, nem "1.000 mil" | P | Sim (PR) |
| CT-607 | Direção sempre respeitada | Valores aleatórios | Para baixo: exibido lido de volta ≤ real. Para cima: ≥ real. Ordem preservada (a > b ⇒ exibido(a) ≥ exibido(b)) | P | Sim (PR) |
| CT-608 | Mesmo número em todas as telas | E2E com ouro 1.234.567 | Ouro no topo, na loja, na tela offline e na refundação: todos "1,23 mi" | E | Sim (main) |
| CT-609 | Renda acima de 1 bi/s | 6 negócios com n=300 | Renda **2.491.516.800/s** (marco ×64) → "2,49 bi/s"; custos com 1,15^300 = 1,619e18 finitos | U | Sim (PR) |
| CT-610 | Precisão acima de 2^53 | Ouro 1e16, toque de valor 1 | Não trava nem mostra valor errado; a perda de precisão no 1 é aceita (ADR-002) | U | Sim (PR) |
| CT-611 | Fracionários abaixo de 100 | renda 0,5/s; toque 1,5; poder 10,5; renda 1,125/s | "0,5/s"; "+1,5"; "10,5"; "1,1/s" (QA-13 decidido) | U + E | Sim (PR) |
| CT-612 | Texto não estoura em 360 px | Save com o maior número de cada tela | "999 tri", "1,23e150" e "Faltam 1,00e15" cabem sem reticências nem rolagem lateral em 360×640 | V + E | Sim (main) |
| CT-613 | Para cima (custos e "Faltam") | 10; 11,5; 13,225; 40,455577; 99,01; 99,91; 172,5; 999,2; 1.001; 9.423,108; 10.836,574; 999.001; 9,995e14; 9,991e15; 0,01; 0,06 | "10"; "11,5"; "13,3"; "40,5"; "99,1"; "100"; "173"; "1,00 mil"; "1,01 mil"; "9,43 mil"; "10,9 mil"; "1,00 mi"; "1,00e15"; "1,00e16"; "0,1"; "0,1" | U | Sim (PR) |
| CT-614 | Porcentagem ao mais próximo | 0,768525; 0,5; 0,268941; 0,119203; 0,710950; 0,679179; 0,05; 0,95 | "77%"; "50%"; "27%"; "12%"; "71%"; "68%"; "5%"; "95%" (QA-3 decidido) | U | Sim (PR) |
| CT-615 | Botão segue o valor real | Aulas n=1 (custo 11,5) | Ouro 11,49; ouro `11,5 × (1 − 10⁻¹⁰)` | 1º: mostra "11,4" e botão **desabilitado**. 2º: também mostra "11,4" (para baixo), mas o botão fica **habilitado** e a compra deixa ouro 0 | U + E | Sim (PR) |
| CT-616 | Erro de ponto flutuante na exibição | "Faltam" com ouro 9,7 e custo 10 (falta interna 0,3000000000000007); ouro interno 4.349,999999999999 | Esperado pelo QA: "Faltam 0,3" e "4,35 mil" (mesma tolerância de 10⁻⁹ da comparação). Conta estrita: "0,4" e "4,34 mil". **Bloqueado por pedido QA-22** | U | Sim após decisão |

## RN-016 — Sem dinheiro real e sem pressão

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-620 | Nenhum preço real nas telas | E2E percorre todas as telas e estados | Procurar texto | Nenhuma ocorrência de `R$`, `US$`, `€`, "anúncio", "assistir vídeo", "doação", "premium", "VIP", "oferta" | E | Sim (PR smoke) |
| CT-621 | Nenhum SDK de venda, anúncio ou rastreio | `package-lock.json` e bundle final | Varredura | Nenhum pacote da lista proibida (`seguranca.md`, A6) | S | Sim (PR) |
| CT-622 | Sem contagem regressiva falsa | Todas as telas | Inspecionar timers | Todo timer visível é de um evento real (próxima partida); nenhum "oferta acaba em" | E + A | Sim (main) |
| CT-623 | Notificação só se o jogador ativar | Instalação limpa | Abrir pela 1ª vez e jogar 5 min; ler as configurações | Notificações **desligadas** por padrão; o jogo **não** pede permissão de notificação até o jogador ativar | E | Sim (PR); manual no Android |
| CT-624 | Permissões mínimas | PWA instalado | Ler o manifest e as APIs usadas no bundle | Nenhuma permissão além de notificação (só após ativar); sem geolocalização, câmera, microfone, contatos | S | Sim (PR) |
