# Critérios de usabilidade verificáveis — MVP (para o `nexus-qa`)

> Dono: `nexus-ux`. Cada critério tem ID, como medir e o limite. "Auto" = dá para automatizar no
> teste de ponta a ponta (viewport 360×640, toque emulado); "Moderado" = teste com pessoa (o dono
> ou alguém que nunca jogou), cronometrado, sem ajuda; "Revisão" = checagem manual em captura.
> Telas e IDs em `mapa-de-telas.md`.

## Layout e toque

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-01 | A T02 cabe sem rolagem em 360×640 com fonte em 100% | Auto: `scrollHeight ≤ innerHeight` do documento e de cada contêiner da T02 | 0 px de rolagem |
| UX-02 | A T02 mostra, sem rolar e sem tocar: ouro, renda/s, botão de toque, próxima compra, divisão, placar e P(vitória) | Auto: os 7 elementos (por `data-testid`) visíveis e dentro de 0–640 px | 7 de 7 |
| UX-03 | Ações frequentes na metade de baixo | Auto: topo de botão de toque, "Próxima compra", seletor de lote e barra de abas com `y ≥ 320` | 100% |
| UX-04 | Alvo de toque mínimo | Auto: todo elemento clicável com caixa ≥ 48×48 px | 0 violações |
| UX-05 | Folga entre alvos vizinhos | Auto: distância entre caixas clicáveis vizinhas ≥ 8 px (ou alvos de 48 px sem sobreposição) | 0 violações |
| UX-06 | Sem rolagem horizontal em nenhuma tela | Auto: `scrollWidth ≤ 360` em T00–T14 | 0 telas |
| UX-07 | Funciona com fonte do sistema em 130% | Auto/Revisão: T02 sem texto cortado nem sobreposto; rolagem permitida só acima de 130% | 0 cortes |
| UX-08 | Funciona com fonte em 200% | Revisão: toda informação alcançável rolando; barra de abas e botões principais acessíveis | 0 bloqueios |

## Acessibilidade

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-10 | Contraste de texto | Auto (axe ou similar) + Revisão nos estados desabilitados | ≥ 4,5:1 (texto), ≥ 3:1 (ícones e bordas de controle) |
| UX-11 | Nada depende só de cor | Revisão em escala de cinza das T02, T05, T06, T08: V/D, subiu/caiu, travado/disponível, chance e aba ativa continuam distinguíveis | 100% |
| UX-12 | Texto mínimo | Auto: nenhum texto com `font-size` calculado < 12 px | 0 |
| UX-13 | Reduzir animações | Auto: com `prefers-reduced-motion: reduce`, nenhuma animação com deslocamento > 0 nem duração > 150 ms | 0 |
| UX-14 | Leitor de tela | Revisão (TalkBack): botões com nome; números lidos por extenso ("1,23 mil de ouro"); A01 anunciado sem tirar o foco | 100% dos controles da T02–T04 |
| UX-15 | Sem piscar | Revisão: nenhum elemento pisca > 3×/s | 0 |

## Números (RN-017)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-20 | Formatador único | Unitário: tabela da seção 9 de `tokens.md` | 100% dos casos |
| UX-21 | Mesmo número igual em todas as telas | Auto: ouro da T02 = ouro mostrado na T03/T04 no mesmo instante; custo da "Próxima compra" = custo ×1 da T03 | 0 divergências |
| UX-22 | Nunca mostra mais ouro do que há | Unitário: exibição ≤ valor interno (arredonda para baixo) | 100% |
| UX-23 | Números não "pulam" de largura | Revisão: algarismos tabulares no ouro e na renda | Sim |

## Compreensão (moderado, jogador novo, sem ajuda)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-30 | Faz a 1ª compra | Cronômetro do toque em "Começar" até a 1ª compra | < 10 s (critério NX-016) |
| UX-31 | Encontra onde subir um jogador | Pedir "deixe o time mais forte" depois de 30 s | < 15 s, sem toque errado em mais de 1 aba |
| UX-32 | Entende o elenco antes da 1ª partida | Pergunta logo após a 1ª partida: "para que serve subir um jogador?" Resposta cita chance/vencer | Acerta (critério NX-016) |
| UX-33 | Lê a T02 em 3 s | Mostrar a T02 por 3 s e esconder; perguntar ouro aproximado, se a próxima partida é favorável e o que comprar | 3 de 3 |
| UX-34 | Entende a regra da temporada | Depois da 1ª partida: "quantas vitórias para subir?" | Responde 10 |
| UX-35 | Chega à 2ª temporada | Modo de teste acelerado (P-UX-08) | ≤ 5 min (critério NX-016) |
| UX-36 | Entende o ganho offline | Ao ver a T13: "quanto você ganhou e quantas partidas jogou?" | Acerta os dois |
| UX-37 | Entende o prestígio antes de confirmar | Na T09: "o que você perde e o que ganha?" | Cita ouro/geradores/níveis/divisão e o Legado |

## Sem dark patterns (RN-016)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-40 | Cancelar/Voltar do mesmo tamanho que Confirmar | Auto: em T07, T09, T10, T12b, largura e altura iguais (±2 px) | 100% |
| UX-41 | Nenhuma oferta de compra, anúncio ou doação | Revisão de todas as telas e busca no texto por "comprar com", "R$", "oferta", "anúncio", "grátis por tempo" | 0 |
| UX-42 | Nenhuma contagem regressiva além do relógio da partida | Revisão: só existe o `m:ss` da próxima partida | 1 contagem |
| UX-43 | Notificações desligadas por padrão | Auto: em save novo, ajuste de notificações = desligado e nenhuma permissão pedida | Sim |
| UX-44 | Prestígio exige 2 etapas em telas distintas | Auto: 2 toques em botões diferentes; toque duplo rápido na T09 não refunda | Sim |
| UX-45 | T13 não esconde o ganho | Auto: ouro, tempo e V-D visíveis sem rolar em 360×640; nenhum botão além de "Receber" | Sim |

## Estados obrigatórios (checagem de presença)

| ID | Estado | Onde | Limite |
|---|---|---|---|
| UX-50 | Primeira vez | T01, T02 (D1–D3), T04, T07, T13 | Presente |
| UX-51 | Vazio | T03, T05, T08 | Presente |
| UX-52 | Sem ouro ("Faltam X") | T02, T03 (×1, ×10, Máx), T04 | Presente, com valor certo |
| UX-53 | Fim de temporada subiu/manteve/caiu | T06 (incluindo Amadora e Mundial) | 5 variações |
| UX-54 | Prestígio travado/disponível/etapa 1/etapa 2/resultado | T08–T11 | 5 telas |
| UX-55 | Save recuperado / nenhum save | T12a, T12b | 2 telas |
| UX-56 | Offline > 8 h e relógio atrasado | T13 / sem T13 | 2 variações |
