# Casos — Prestígio e Legado

> RN-013 e RN-014 · História NX-014 · Faixa CT-400 a CT-499.
> Renda × `(1 + 0,05 × Legado)`; poder × `(1 + 0,01 × Legado)`.

## RN-013 — Prestígio

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-400 | Gherkin "prestígio indisponível" | Melhor divisão da run = Desafiante | Abrir a tela de prestígio | Travado, com o texto "Chegue à Academy" (nome final do lore) | U + E | Sim (PR smoke) |
| CT-401 | Travado na Amadora | Clube novo | Idem | Travado | U | Sim (PR) |
| CT-402 | Libera ao chegar à Academy | Desafiante, 10-4 | Subir para Academy | Prestígio disponível, mostrando **+10** de Legado | I | Sim (PR) |
| CT-403 | Tabela de Legado | Melhor da run = Academy; Liga; Internacional; Mundial | Ler o ganho previsto | **10**; **25**; **45**; **80** | U | Sim (PR) |
| CT-404 | Usa a melhor divisão, não a atual | Chegou à Liga e caiu para Academy | Ler o ganho | **25** (Liga) | U | Sim (PR) |
| CT-405 | Continua liberado após queda | Chegou à Academy e caiu para Desafiante | Ler o estado | Disponível, **+10** | U | Sim (PR) |
| CT-406 | Gherkin "refundar depois da Liga" | Melhor da run Liga, Legado 0 | Confirmar nas 2 etapas | Legado **25**; renda × **2,25**; poder × **1,25**. Ex.: Live n=1 → **1,125/s**; 5 jogadores nível 1 → poder **62,5**; P contra 60 → **0,5622** (56%) | I + E | Sim (PR smoke) |
| CT-407 | Legado acumula | Legado 25, melhor da run Academy | Prestigiar | Legado **35**; renda × **2,75**; poder × **1,35** (time nível 1 = **67,5**, P contra 60 = **0,6792**) | U | Sim (PR) |
| CT-408 | Mundial | Legado 0, melhor da run Mundial | Prestigiar | Legado **80**; renda × **5**; poder × **1,8** (time nível 1 = **90**) | U | Sim (PR) |
| CT-409 | O que zera | Run com ouro, geradores, níveis, Liga e temporada 5-3 | Prestigiar | Ouro = valor inicial (**pedido QA-1**); 6 geradores n=0; 5 jogadores nível 1; Amadora; temporada 0-0 com 14 partidas; melhor divisão da run = Amadora; visibilidade dos geradores zerada (CT-024) | I | Sim (PR) |
| CT-410 | O que mantém | Idem, com 3 capítulos vistos e configurações alteradas | Prestigiar | Legado, capítulos vistos, estatísticas totais e configurações **iguais** a antes | I | Sim (PR) |
| CT-411 | Duas etapas | Disponível | 1ª tela: conferir Legado a ganhar e a lista do que zera; cancelar. Repetir e cancelar na 2ª | Nada muda nos dois cancelamentos | E | Sim (PR) |
| CT-412 | Toque duplo na confirmação | 2ª etapa | 2 toques em 50 ms em "Confirmar" | Legado **+25** uma vez (não +50) | E | Sim (PR smoke) |
| CT-413 | Prestígio atômico | 2ª etapa | Confirmar e encerrar o app à força em seguida (repetir 50× com atrasos aleatórios) | Ao reabrir, estado **todo antigo** ou **todo novo**; nunca Legado novo com ouro antigo | I | Sim (noturna) |
| CT-414 | Travado de novo após prestigiar | Logo após o prestígio | Abrir a tela | Travado ("Chegue à Academy") | I | Sim (PR) |

## RN-014 — Bônus do Legado

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-420 | Bônus aditivo | Legado 10 | Calcular multiplicadores | Renda × **1,5**; poder × **1,1** | U | Sim (PR) |
| CT-421 | Automático | Legado > 0 | Verificar a tela | Não existe botão para "gastar" Legado; o bônus aparece já aplicado | E | Sim (main) |
| CT-422 | Legado nunca diminui | Sequências aleatórias do CT-004 | Observar Legado | Não decrescente; só aumenta no prestígio | P | Sim (PR) |
