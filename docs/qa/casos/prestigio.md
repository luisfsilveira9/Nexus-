# Casos — Refundar o clube (prestígio) e Legado

> RN-013 e RN-014 · História NX-014 · Faixa CT-400 a CT-499. **v0.2** (NX-009).
> Na tela: botão **"Refundar o clube"**; travado mostra **"Chegue à Ascensão"**.
> Renda × `(1 + 0,05 × Legado)`; poder × `(1 + 0,01 × Legado)`.

## RN-013 — Refundar o clube

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-400 | Gherkin "refundação indisponível" | Melhor divisão da run = Acesso | Abrir a jornada | "Refundar o clube" travado, com "**Chegue à Ascensão**" | U + E | Sim (PR smoke) |
| CT-401 | Travado na Várzea | Clube novo | Idem | Travado | U | Sim (PR) |
| CT-402 | Libera ao chegar à Ascensão | Acesso, 10-4 | Subir para a Ascensão | Disponível, mostrando **+10** de Legado | I | Sim (PR) |
| CT-403 | Tabela de Legado | Melhor da run = Ascensão; Elite; Continental; Mundial | Ler o ganho previsto | **10**; **25**; **45**; **80** | U | Sim (PR) |
| CT-404 | Usa a melhor divisão, não a atual | Chegou à Elite e caiu para a Ascensão | Ler o ganho | **25** (Elite) | U | Sim (PR) |
| CT-405 | Continua liberado após queda | Chegou à Ascensão e caiu para o Acesso | Ler o estado | Disponível, **+10** | U | Sim (PR) |
| CT-406 | Gherkin "refundar depois da Elite" | Melhor da run Elite, Legado 0 | Confirmar nas 2 etapas | Legado **25**; renda × **2,25**; poder × **1,25**. Ex.: Aulas n=1 → **1,125/s** ("1,1/s"); 5 jogadores nível 1 → poder **62,5** ("62,5"); P contra 60 → **0,5622** ("56%") | I + E | Sim (PR smoke) |
| CT-407 | Legado acumula | Legado 25, melhor da run Ascensão | Refundar | Legado **35**; renda × **2,75**; poder × **1,35** (time nível 1 = **67,5**; P contra 60 = **0,6792** → "68%") | U | Sim (PR) |
| CT-408 | Mundial | Legado 0, melhor da run Mundial | Refundar | Legado **80**; renda × **5**; poder × **1,8** (time nível 1 = **90**; P contra 60 = **95%**, teto) | U | Sim (PR) |
| CT-409 | O que zera | Run com ouro 5.000, negócios, níveis, Elite, split 5-3, faltam 40 s | Refundar | Ouro **10**; 6 negócios n=0; 5 jogadores nível 1; Várzea; split 0-0 com 14 partidas; relógio de partida reiniciado (**90 s**); melhor divisão da run = Várzea; visibilidade dos negócios e acumulado da run zerados (CT-024) | I | Sim (PR) |
| CT-410 | O que mantém | Idem, com 3 capítulos vistos, 1 título mundial, clube renomeado "Unidos do Farol" / "UDF", configurações alteradas | Refundar | Legado (somado), capítulos vistos, histórico (títulos e estatísticas totais), **nome e sigla** e configurações **iguais** a antes | I | Sim (PR) |
| CT-411 | Duas etapas | Disponível | 1ª etapa: conferir o Legado a ganhar e a lista do que zera; cancelar. Repetir e cancelar na 2ª | Nada muda nos dois cancelamentos | E | Sim (PR) |
| CT-412 | Toque duplo na confirmação | 2ª etapa | 2 toques em 50 ms em "Refundar" | Legado **+25** uma vez (não +50) | E | Sim (PR smoke) |
| CT-413 | Refundação atômica | 2ª etapa | Confirmar e encerrar o app à força em seguida (50× com atrasos aleatórios) | Ao reabrir, estado **todo antigo** ou **todo novo**; nunca Legado novo com ouro antigo | I | Sim (noturna) |
| CT-414 | Travado de novo depois de refundar | Logo após a refundação | Abrir a jornada | Travado ("Chegue à Ascensão") | I | Sim (PR) |
| CT-415 | Nenhuma partida durante a confirmação | Faltam 5 s, melhor da run Ascensão, placar que subiria à Elite na próxima vitória | Abrir a etapa 1, esperar 60 s, ir à etapa 2, esperar 60 s, confirmar | Nenhuma partida acontece com a confirmação aberta; o Legado ganho é o mostrado (**10**), não 25 | I | Sim (PR) |
| CT-416 | Ouro 10 qualquer que fosse o ouro antes | Ouro 3; ouro 1e15 | Refundar | Ouro **10** nos dois casos | U | Sim (PR) |
| CT-417 | `maior` do relógio não volta | `maior` = T + 2 h (relógio adiantado antes) | Refundar e reabrir em T + 1 h | Offline **0**: a refundação não zera o `maior` (RN-012) | I | Sim (PR) |

## RN-014 — Bônus do Legado

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-420 | Bônus aditivo | Legado 10 | Calcular multiplicadores | Renda × **1,5**; poder × **1,1** | U | Sim (PR) |
| CT-421 | Automático | Legado > 0 | Verificar a tela | Não existe botão para "gastar" Legado; o bônus aparece já aplicado | E | Sim (main) |
| CT-422 | Legado nunca diminui | Sequências aleatórias do CT-004 | Observar o Legado | Não decrescente; só aumenta na refundação | P | Sim (PR) |
