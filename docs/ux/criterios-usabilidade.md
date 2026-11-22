# Critérios de usabilidade verificáveis — MVP (para o `nexus-qa`)

> Dono: `nexus-ux`. v0.2 (NX-009): RN v0.2, telas T00–T17. Cada critério tem ID, como medir e o
> limite. "Auto" = dá para automatizar no teste de ponta a ponta (viewport 360×640, toque emulado);
> "Moderado" = teste com pessoa (convidado do dono ou o dono, plano do QA-16), cronometrado, sem
> ajuda; "Revisão" = checagem manual em captura. Telas e IDs em `mapa-de-telas.md`.
> Mudanças da v0.1: UX-06, 20–22, 35, 36, 40, 45, 50–56 ajustados; novos UX-24, 38, 39, 46, 47,
> 57, 58.

## Layout e toque

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-01 | A T02 cabe sem rolagem em 360×640 com fonte em 100% | Auto: `scrollHeight ≤ innerHeight` do documento e de cada contêiner da T02 | 0 px de rolagem |
| UX-02 | A T02 mostra, sem rolar e sem tocar: ouro, renda/s, "Fazer live", próxima compra, divisão, placar do split e chance | Auto: os 7 elementos (`data-testid`) visíveis entre 0 e 640 px | 7 de 7 |
| UX-03 | Ações frequentes na metade de baixo | Auto: topo de "Fazer live", "Próxima compra", seletor de lote e barra de abas com `y ≥ 320` | 100% |
| UX-04 | Alvo de toque mínimo | Auto: todo elemento clicável com caixa ≥ 48×48 px | 0 violações |
| UX-05 | Folga entre alvos vizinhos | Auto: caixas clicáveis vizinhas sem sobreposição e ≥ 8 px de distância (ou alvos de 48 px colados sem sobrepor) | 0 violações |
| UX-06 | Sem rolagem horizontal | Auto: `scrollWidth ≤ 360` em T00–T17 | 0 telas |
| UX-07 | Funciona com fonte do sistema em 130% | Auto/Revisão: T02 sem texto cortado nem sobreposto; rolagem permitida só acima de 130% | 0 cortes |
| UX-08 | Funciona com fonte em 200% | Revisão: toda informação alcançável rolando; barra de abas e botões principais acessíveis | 0 bloqueios |
| UX-09 | Teclado não esconde a ação na T15 | Auto (teclado emulado pelo `visualViewport`): "Salvar" visível e tocável com o teclado aberto | Sim |

## Acessibilidade

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-10 | Contraste de texto | Auto (axe ou similar) + Revisão nos estados desabilitados | ≥ 4,5:1 (texto), ≥ 3:1 (ícones e bordas de controle) |
| UX-11 | Nada depende só de cor | Revisão em escala de cinza das T02, T05, T06, T08, T13, T15: V/D, subiu/caiu/título, travado/disponível, chance, erro de campo, pausa e aba ativa continuam distinguíveis | 100% |
| UX-12 | Texto mínimo | Auto: nenhum texto com `font-size` calculado < 12 px | 0 |
| UX-13 | Reduzir animações | Auto: com `prefers-reduced-motion: reduce`, nenhuma animação com deslocamento > 0 nem duração > 150 ms | 0 |
| UX-14 | Leitor de tela | Revisão (TalkBack): botões com nome; números lidos por extenso ("1,23 mil de ouro"); A01/A03 anunciados sem tirar o foco; erros da T15 anunciados | 100% dos controles da T02–T04 e T15 |
| UX-15 | Sem piscar | Revisão: nenhum elemento pisca > 3×/s | 0 |

## Números (RN-017 v0.2)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-20 | Formatador único | Unitário: tabela de `tokens.md` §9 (inclui 0,5 · 10,5 · 11 · 99,9 · 1,00 mil · 999 mil · 1,00e15) | 100% dos casos |
| UX-21 | Mesmo número igual em todas as telas | Auto: ouro da T02 = ouro na T03/T04 no mesmo instante; custo da "Próxima compra" = custo ×1 da T03 | 0 divergências |
| UX-22 | Direção do arredondamento | Unitário: ouro, renda, poder e ganhos exibidos ≤ valor real; custos e "Faltam" exibidos ≥ valor real | 100% |
| UX-23 | Números não "pulam" de largura | Revisão: algarismos tabulares no ouro e na renda | Sim |
| UX-24 | Exemplos das histórias | Auto: clube novo `10`; após 1ª compra `0`, `+0,5/s`, custo `11,5`; Vulto Nv 2 poder `10,5`, custo `61`; poder 72 × 60 → `77%` | 4 de 4 |

## Compreensão (moderado, jogador novo, sem ajuda)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-30 | Faz a 1ª compra | Cronômetro do toque em "Começar"/"Pular" no prólogo até a 1ª compra | < 10 s (critério NX-016) |
| UX-31 | Encontra onde subir um jogador | Pedir "deixe o time mais forte" depois de 30 s | < 15 s, no máximo 1 aba errada |
| UX-32 | Entende o elenco antes da 1ª partida | Pergunta logo após a 1ª partida: "para que serve subir um jogador?" Resposta cita chance/vencer | Acerta (critério NX-016) |
| UX-33 | Lê a T02 em 3 s | Mostrar a T02 por 3 s e esconder; perguntar ouro aproximado, se a próxima partida é favorável e o que comprar | 3 de 3 |
| UX-34 | Entende a regra do split | Depois da 1ª partida: "quantas vitórias para subir?" | Responde 10 |
| UX-35 | Chega ao 2º split | Modo de teste acelerado (P-UX-08), contando de "Começar"/"Pular" | ≤ 5 min (critério NX-016) |
| UX-36 | Entende o ganho offline | Na T13 com vários splits: "quanto ganhou, quantas partidas jogou e o clube subiu ou caiu?" | Acerta os três |
| UX-37 | Entende a refundação antes de confirmar | Na T09: "o que você perde e o que ganha?" | Cita ouro/negócios/níveis/divisão e o Legado |
| UX-38 | Renomeia o clube | Pedir "dê outro nome e sigla ao clube" a partir da T02 | < 30 s, sem toque errado em mais de 1 tela |
| UX-39 | Exporta o save | Pedir "guarde uma cópia do seu clube" a partir da T02 | < 30 s |

## Sem dark patterns (RN-016)

| ID | Critério | Como medir | Limite |
|---|---|---|---|
| UX-40 | Cancelar/Voltar/Agora não do mesmo tamanho que Confirmar | Auto: em T01, T07, T09, T10, T12b, T12c, T15, T17 (prévia e confirmação), largura e altura iguais (±2 px) | 100% |
| UX-41 | Nenhuma oferta, anúncio ou doação | Revisão de todas as telas e busca por "comprar com", "R$", "oferta", "anúncio", "grátis por tempo" | 0 |
| UX-42 | Nenhuma contagem regressiva além do relógio da partida | Revisão: só existe o `m:ss` da próxima partida | 1 contagem |
| UX-43 | Notificações desligadas por padrão | Auto: em save novo, notificações = desligado e nenhuma permissão pedida | Sim |
| UX-44 | Refundação exige 2 etapas em telas distintas | Auto: 2 toques em botões diferentes; toque duplo rápido na T09 não refunda | Sim |
| UX-45 | T13 não esconde o ganho | Auto: tempo, ouro total, divisão renda/prêmios e V-D visíveis sem rolar em 360×640; só a lista de splits rola; nenhum botão além de "Receber" | Sim |
| UX-46 | Relógio pausado nas telas cheias | Auto: com T01, T07, T13, T09 ou T10 aberta por 120 s (relógio acelerado: 30 s), nenhuma partida acontece, o chip "Partidas em pausa" está visível e, ao fechar, o relógio retoma do mesmo valor | 5 de 5 telas |
| UX-47 | Importar inválido não muda nada | Auto: colar texto alterado na T17 → mensagem de erro, "Usar este save" desabilitado, save atual idêntico | Sim |

## Estados obrigatórios (checagem de presença)

| ID | Estado | Onde | Limite |
|---|---|---|---|
| UX-50 | Primeira vez | T01, T02 (D1–D3), T04, T07, T13 | Presente |
| UX-51 | Início/vazio | T03 (só "Aulas na lan"), T05 (antes da 1ª partida), T08 (só o prólogo) | Presente |
| UX-52 | Sem ouro ("Faltam X", para cima) | T02, T03 (×1, ×10 parcial, Máx), T04 | Presente, com valor certo |
| UX-53 | Fim do split | T06: subiu, manteve (Várzea), manteve (meio), caiu, manteve (Mundial), campeão mundial | 6 variações |
| UX-54 | Refundação travada/disponível/etapa 1/etapa 2/resultado | T08–T11 | 5 telas |
| UX-55 | Save | T12a, T12b, T12c, A05, T16, T17 (válido, inválido, confirmação) | 8 estados |
| UX-56 | Offline | T13: sem partidas, > 8 h com subida, vários splits, título + queda no Mundial; relógio atrasado sem T13; < 60 s sem T13 | 6 variações |
| UX-57 | Capítulos | Prólogo, capítulo de divisão, último bloco, releitura, 1ª refundação, epílogo, A03 | 7 estados |
| UX-58 | Nome do clube | T15: padrão, teclado aberto, nome vazio, nome 20/20, sigla curta, sigla com número, sigla de rival, `<script>` literal, A04 | 9 estados |
