# Estatísticas no Nexus: como apresentar números de jogador, time, liga e partida

> Nota de método: as buscas web funcionaram, mas a leitura completa das páginas (WebFetch) foi bloqueada pela rede desta sessão para sofascore.com, datawrapper.de, ui.shadcn.com e rft.gg. Os fatos externos abaixo vêm dos trechos e resumos dos resultados de busca. Quando duas fontes não batem, isso está dito. O diagnóstico do código vem da leitura direta dos arquivos do repositório. Os testes de `Intl.NumberFormat` foram rodados localmente (Node v22.23.4).

## 0. O que existe hoje no Nexus e onde estão os problemas

### Takeaway
O Nexus já registra os dados certos: V/D, mapas, forma, K/D/A, nota, ouro, objetivos, probabilidade de vitória e calibração. O problema é a apresentação. As estatísticas da temporada de cada jogador só aparecem no pré-jogo, as cores dependem só de verde e vermelho, o vermelho tem dois significados, a formatação decimal mistura vírgula e ponto, e nenhuma tela explica por que um jogo foi ganho ou perdido.

### Cited Findings
- **Tipos.** `SeasonStats { g, w, k, d, a, nt }` guarda jogos, vitórias, K/D/A e a soma das notas (`nt`). A nota média é `nt / g`. Fonte: [types.ts](nexus/src/game/types.ts).
- **Stats da temporada quase invisíveis.** `seasonOf(p)` só é chamado em `PreMatch` (Partida.tsx, linha 23). A tela do jogador (`PlayerSheet` em Elenco.tsx) mostra OVR, atributos, estilos, energia e maestria, mas nunca jogos, vitórias, KDA ou nota média. Também não existe ranking de jogadores da liga (artilheiros, melhor KDA, maior nota). Fontes: [Partida.tsx](nexus/src/ui/Partida.tsx), [Elenco.tsx](nexus/src/ui/Elenco.tsx), [session.ts](nexus/src/game/session.ts).
- **Tabela da liga (Liga.tsx).** Colunas `# · Time · V-D · Mapas · Saldo · Forma`. A forma são quadrados de 7×7 px, verdes ou vermelhos, sem letra (V/D) e sem ordem explicada, ou seja, só a cor carrega a informação. O saldo é pintado de `var(--good)` ou `var(--red)`. A zona de playoffs é uma linha tracejada (`tr.cut`), e os times fora dela ficam com `opacity:.55`, o que também apaga o texto. Não há coluna de aproveitamento (%). Fontes: [Liga.tsx](nexus/src/ui/Liga.tsx), [index.css](nexus/src/index.css) (linhas 145–151).
- **Conflito de cores.** `--red: #E84057` é ao mesmo tempo a cor do time vermelho (Partida, minimapa, gráficos), a cor de "ruim" (saldo negativo, nota ≤ 5,5, derrota na forma, métrica fora do alvo no Motor) e a do estresse. Já `--blue: #0AC8B9` é um ciano esverdeado, perto de `--good: #3CBF6E` em matiz. Fonte: [index.css](nexus/src/index.css) (linhas 10–30).
- **Nota em três faixas.** No `Lineup` ao vivo, nota ≥ 6,5 fica verde, ≤ 5,5 vermelha e o resto dourado, só pela cor do texto. O valor inicial é 6,0 (`nota: 6.0` em match.ts). O MVP é a maior nota do time vencedor (`mvpOf`). Fontes: [Partida.tsx](nexus/src/ui/Partida.tsx) (linha 199), match.ts (linhas 357 e 627).
- **Decimal inconsistente.** `nota()` usa vírgula (`toFixed(1).replace('.', ',')`), mas o ouro usa `(x/1000).toFixed(1) + 'k'`, o que gera "12.3k" com ponto, em cinco lugares (placar, `LineChart`, `TabSheet`, `ResultSheet`). Em outro ponto o código usa `toLocaleString('pt-BR')` ("2.300"). No mesmo jogo aparecem "6,8", "12.3k" e "2.300". Fonte: [Partida.tsx](nexus/src/ui/Partida.tsx) (linhas 78, 154, 158, 217, 232).
- **Fim de jogo (`ResultSheet`).** Mostra abates, tempo, três tiles ("Ouro 12.3k · 10.1k", "Torres 9 · 3", "Dragões"), chips de "firsts" e um card de MVP. Não há barras comparativas nem um texto que explique o resultado ("por que vencemos ou perdemos"). Fonte: [Partida.tsx](nexus/src/ui/Partida.tsx) (linhas 222–242).
- **Gráficos.** `LineChart` é feito à mão em SVG (320×96): azul acima da linha de equilíbrio e vermelho abaixo, via `clipPath`. Tem leitura fixa no cabeçalho ao arrastar, `touchAction: pan-y` e `aria-label`. Não usa biblioteca de gráficos, e o `package.json` não tem `recharts`. Fontes: [Partida.tsx](nexus/src/ui/Partida.tsx) (linhas 144–189), [package.json](nexus/package.json).
- **Motor.** Cada métrica é uma barra com a faixa-alvo sombreada e um pino para o valor simulado, mais ✓/✗ e a fonte. É um bom padrão (bullet chart) que pode ser reaproveitado. Fonte: [Motor.tsx](nexus/src/ui/Motor.tsx).
- **Componente `Bar`.** É uma barra de 6 px sem rótulo, sem marca de média e sem faixa de referência. Na lista do Elenco, energia e estresse aparecem como duas barras sem número, e a legenda fica no rodapé da página ("Barra azul: energia · barra vermelha: estresse"). Fontes: [common.tsx](nexus/src/ui/common.tsx), [Elenco.tsx](nexus/src/ui/Elenco.tsx).

### Inferences
- O maior ganho com menos esforço é **mostrar dados que já existem** (stats de temporada no Elenco e um ranking de jogadores na Liga) e **padronizar a formatação e as cores**. Não é preciso criar métricas novas.
- O conflito do vermelho é o problema conceitual mais sério. No Nexus, "vermelho" quase sempre quer dizer "lado vermelho". Usá-lo também para "ruim" faz um bom jogador do lado vermelho parecer mal.

### Gaps
- Não verifiquei se existe histórico de partidas passadas (timeline e stats por jogo) depois que a série termina. `M` parece guardar só a partida atual.

## 1. Como os melhores produtos de estatística esportiva e de esports apresentam dados compactos no celular

### Takeaway
O padrão dominante é: uma **nota de 0 a 10 com cor por faixa** em cada jogador, **pílulas de forma com letra**, **tabela de classificação com zonas coloridas na borda** e **percentis** quando se compara jogadores. Os sites de LoL (gol.gg, Oracle's Elixir) usam tabelas densas de métricas por minuto e de diferença aos 15 minutos, boas para analistas e ruins para leigos.

### Cited Findings
- **Sofascore, escala oficial (guia de marca).** A nota vai de 3,0 a 10. As faixas são cinza `#A4A9B3` (3,0–5,9, "Poor"), vermelho `#DC0C00` (6,0–6,4, "Below average"), laranja `#ED7E07` (6,5–6,9, "Average"), amarelo `#D9AF00` (7,0–7,9, "Good"), depois verde `#00C424` e azul, até uma faixa de topo de 9,0 a 10,0. A nota de uma partida tem uma casa decimal e a média da temporada tem duas. O guia proíbe alterar essas cores — [Sofascore Rating Guidelines](https://www.sofascore.com/rating-guidelines).
- **Sofascore.** Todo jogador começa a partida com 6,5 e a nota sobe ou desce a partir daí. O algoritmo é o mesmo para todos, com pequenas exceções por posição — [Sofascore Statistical Ratings](https://www.sofascore.com/news/sofascore-player-ratings).
- **Conflito.** O artigo de basquete do Sofascore descreve outras faixas: vermelho de 3 a 5, laranja e amarelo por volta de 6 a 6,5, verde em 7 e azul-claro em 8 ou mais. As fronteiras e o uso de cinza ou azul diferem do guia de futebol — [How the Sofascore Rating Works in Basketball](https://www.sofascore.com/cs/news/how-the-sofascore-rating-works-in-basketball).
- **Flashscore** lançou notas de jogador em que todos partem de 6 e o máximo é 10, calculadas a partir de estatísticas ao vivo — [Flashscore: Ten for exceptional](https://www.flashscore.com/news/ten-for-exceptional-flashscore-introduces-football-player-ratings-into-our-stats-universe/0jG6lQhn).
- **gol.gg.** As tabelas de jogadores têm KDA, médias de abates, mortes e assistências, CSM, GPM, KP%, DMG%, Gold%, VS%, DPM, VSPM, GD@15, CSD@15 e XPD@15 — [gol.gg player list](https://gol.gg/players/list/season-S16/split-Winter/tournament-ALL/).
- **Leitura de métricas de LoL para iniciantes (RFT.GG).** KDA = (K+A)/D. 4,0 é sólido e 6,0 é excelente, mas um jogador que nunca morre e não cria nada tem KDA inflado. KP% é a porcentagem dos abates do time em que o jogador participou. GD@15 acima de +500 é vantagem clara e acima de +1.000 é rota ganha, mas depende do confronto. XPD@15 acima de +400 costuma significar um nível de vantagem — [RFT.GG: How to Read LoL Pro Stats](https://rft.gg/news/league-of-legends-esports-stats-guide).
- **StatsBomb.** Popularizou os radares. A borda externa marca o top 5% e a interna o bottom 5%. Uma versão antiga, que plotava valores brutos em vez de percentis, foi criticada — [StatsBomb: New Radars, Better Rigor](https://blogarchive.statsbomb.com/articles/soccer/new-radars-better-rigor-plus-the-average-player/).
- **Opta / The Analyst.** No radar ("pizza"), a distância de cada fatia ao centro é o percentil do jogador — [Introducing Opta Radars](https://theanalyst.com/articles/introducing-opta-radars-compare-players).
- **Pizza de percentis com valor bruto.** Ferramentas como o mplsoccer dimensionam as fatias pelo percentil, mas o rótulo mostra o valor bruto, e aceitam um segundo jogador por cima para comparar — [mplsoccer Comparison Pizza](https://mplsoccer.readthedocs.io/en/latest/gallery/pizza_plots/plot_pizza_comparison.html). O DataMB mostra o valor bruto ao passar o cursor — [DataMB guide](https://datamb.football/guide).

### Inferences
- **Nota com cor de fundo, não só de texto.** Sofascore e FotMob mostram a nota como um selo retangular com fundo colorido e texto escuro ou branco. Isso é bem mais legível que texto colorido sobre fundo escuro, como no `.nt` atual. Proposta para o Nexus: um `<NotaBadge v={6.8} />` com 5 faixas próprias. Não copiar as cores do Sofascore, porque o guia proíbe e porque o vermelho delas colide com o lado vermelho. Usar uma escala sequencial que **não use vermelho nem ciano**, por exemplo cinza → âmbar → dourado → verde-amarelado → branco/dourado brilhante para ≥ 8,5. Ver a seção 3.
- **Ponto de partida da nota.** O Nexus começa em 6,0 e o Sofascore em 6,5. Vale fixar uma âncora ("6,0 = jogo neutro") e explicá-la num tooltip ou "?" junto da primeira nota exibida.
- **Pílulas de forma.** O padrão de FotMob, Sofascore e ESPN é uma letra dentro de um quadrado colorido (no Nexus, V/D), da mais antiga para a mais recente, com a ordem explícita ou a mais recente destacada. Isso resolve o daltonismo, porque a letra carrega a informação. *(Padrão observado nesses apps; não achei uma fonte escrita que o documente.)*
- **Zonas da tabela.** O padrão Liquipedia/ESPN é uma faixa vertical de 3 a 4 px à esquerda da posição (playoffs, eliminado), com legenda abaixo da tabela, em vez de opacidade reduzida. *(Padrão observado; sem fonte escrita encontrada.)*
- **Percentis, não radares, no celular.** Um radar de 8 a 12 eixos não cabe bem em 360 px. Um "percentile bar list" (rótulo · valor bruto · barra de 0 a 100 com o percentil · número do percentil) lê melhor e reaproveita o `Bar`. Para o Nexus: "KDA 4,2 · melhor que 80% dos atiradores do CBLOL".
- **Métricas de LoL para leigos.** Mostrar KDA, KP% e nota por padrão. Deixar GD@15, DPM e CSM para um "Detalhes avançados" recolhível, cada uma com uma frase de explicação em português. O próprio RFT.GG avisa que KDA e GD@15 enganam sem contexto.

### Gaps
- FotMob (escala e cores das notas), ESPN, The Athletic, app LoL Esports, op.gg esports e Liquipedia: não achei fontes escritas de 2024 a 2026 com especificações de design. As afirmações sobre esses produtos em "Inferences" vêm de padrões de interface amplamente vistos e precisam ser checadas com capturas (Mobbin, por exemplo), que não consegui abrir.
- Glossário oficial do Oracle's Elixir (EGPM, gold share): não encontrado, e o site não pôde ser aberto.

## 2. Como jogos de gerenciamento explicam estatísticas e as tornam acionáveis

### Takeaway
Os jogos de gerenciamento de referência põem um **resumo em texto ("Key Findings") por cima dos números** e separam "último jogo" de "tendência recente". No Nexus, a peça que falta é um bloco "Por que vencemos ou perdemos" no `ResultSheet`, gerado a partir dos dados da partida, no mesmo estilo do `DraftEval`, que já faz isso para o draft.

### Cited Findings
- **Football Manager 2024 (touch e console).** A seção Matches do Data Hub tem duas abas: "Last Match" e "Recent Matches Analysis" — [SI Manual FM24: Data Hub](https://community.sports-interactive.com/sigames-manual/football-manager-2024-touch-and-console/data-hub-r4978).
- **FM23.** O Overview do Data Hub tem três partes: Team Report, Team Performance (ataque e defesa) e **Key Findings**, que resume os dados mais recentes num relatório curto — [SI Manual FM23: Squad and Team Report](https://community.sports-interactive.com/sigames-manual/football-manager-2023-touch-and-console-edition/your-squad-and-team-report-r4747). Não confirmei se o FM24 mantém essa seção igual.
- O site oficial do FM publica guias de leitura do Data Hub por fase do jogo ("Taking Attacking Insights", "Taking Defensive Insights"), ou seja, o próprio estúdio ensina a interpretar os gráficos — [footballmanager.com: Defensive Insights](https://footballmanager.com/node/576), [Attacking Insights](https://footballmanager.com/node/569).
- **Teamfight Manager 2.** Um guia de fãs recomenda usar a tela pós-partida para diagnosticar (faltou dano? o CC virou abate?) junto com o replay e a linha do tempo de mortes — [TFM2 match review guide](https://dq7-reimagined.pages.dev/teamfight-manager-2/match-review-guide/). Um resumo agregado de reviews do Steam aponta que os stats dos jogadores "não são claros e não têm impacto perceptível" — [Vaporlens: TFM2](https://vaporlens.app/app/3009300/teamfight_manager_2/stats/analysis). As reviews no Steam estão como "Mixed" — [Steam: Teamfight Manager 2](https://store.steampowered.com/app/3009300/Teamfight_Manager_2/).

### Inferences
- **Bloco "Resumo da partida" no `ResultSheet`, com 3 frases no máximo, de regras simples sobre dados que já existem.**
  - Gerador de ouro: "Vantagem de ouro passou de +3 mil aos 18′ e nunca voltou", a partir de `timeline.gd`.
  - Virada: o momento em que `wp` cruzou 50% e por qual evento ("virada no Barão aos 26′"), a partir de `timeline.wp` mais `log`.
  - Objetivos: "Vocês pegaram 4 de 5 dragões", a partir de `drakes` e `first`.
  - Jogador: "Ranger (Mid) carregou: 8/1/6, nota 8,4", a partir de `stats` e `mvpOf`. "Tutsz teve a pior nota (4,9): morreu 6 vezes", a partir da menor nota.
  - Tática ou draft: ligar ao veredito do `DraftEval` ("O plano era fechar cedo; o jogo passou de 35′").
  O `DraftEval` já usa esse modelo de frases com setas ◀ ▶ por lado, então dá para reaproveitar o estilo.
- **Tornar acionável.** Cada insight negativo deve apontar para uma ação na interface. Por exemplo, "Estresse alto em X → Dia de folga" leva ao `PlayerSheet`, e "Plano não combina com o elenco → Táticas" faz `ui.setElencoView('taticas')`. Isso responde à crítica feita ao TFM2 (stats sem impacto claro).
- **"Último jogo" e "Tendência".** Na Liga ou no Elenco, uma visão "Últimos 5 jogos" com a forma, uma sparkline da nota média do time e o KDA por jogador espelha o "Recent Matches Analysis" do FM.

### Gaps
- Não achei documentação oficial de EA FC Career, NBA 2K MyGM ou Teamfight Manager 2 sobre resumos automáticos pós-jogo. A descrição de TFM2 vem de guia de fã e de agregador de reviews.

## 3. Boas práticas de visualização em tela pequena: tabela, card ou gráfico, números em pt-BR, cores acessíveis e tooltips no toque

### Takeaway
No celular: **tabelas estreitas** (no máximo 5 ou 6 colunas numéricas, primeira coluna fixa) ou **linhas-card** para listas, **gráficos simples** (linha ou barra) com **valores escritos direto** e uma **área de leitura fixa** no lugar de tooltip de hover. Formatar com `Intl.NumberFormat('pt-BR')`. Usar azul como matiz seguro, separar "time vermelho" de "ruim" e nunca codificar só pela cor.

### Cited Findings
- **Daltonismo.** O azul é a cor que muda menos para pessoas com daltonismo vermelho-verde. Evite verde junto de laranja, vermelho ou azul com a mesma luminosidade — [Datawrapper: colorblindness part 2](https://www.datawrapper.de/blog/colorblindness-part2). Se usar verde, deixe-o um pouco amarelado ou azulado — [Datawrapper: colorblindness part 3](https://blog.datawrapper.de/colorblindness-part3). Varie a luminosidade e use padrões, símbolos ou rótulos diretos — [Datawrapper: colorblindness part 1](https://blog.datawrapper.de/colorblindness-part1). O Datawrapper tem um checador automático de daltonismo no painel de preview — [Datawrapper Academy: colorblind check](https://www.datawrapper.de/academy/automatic-colorblind-check).
- Rosa-avermelhado contra verde-limão é uma alternativa comum ao vermelho/verde, e o melhor é somar uma segunda codificação — [Visualising Data: Five ways to design for red-green colour-blindness](https://visualisingdata.com/2019/08/five-ways-to-design-for-red-green-colour-blindness/).
- **Toque.** Um gráfico que só revela valores no hover fica "meio quebrado" no celular. Mostre os valores direto no gráfico (rótulos, callouts) ou reserve uma área fixa que se atualiza ao tocar num ponto. Em gráficos densos, use zonas de toque em vez de pontos individuais. Alvos de toque devem ter pelo menos 44 px — [HogoNext: Data Visualization for Mobile](https://hogonext.com/?p=359406), [North Highland: Mobile-Friendly Data Visualizations](https://www.northhighland.com/insights/blogs/making-the-most-of-mobile-friendly-data-visualizations).
- **Tabelas.** Tabela larga com rolagem horizontal é o erro mais comum em dashboards no celular. O melhor é reestruturar, empilhando células na linha, e rolar num só sentido. Donuts com muitas fatias ficam ilegíveis. Reduza o número de visuais por tela — [North Highland](https://www.northhighland.com/insights/blogs/making-the-most-of-mobile-friendly-data-visualizations), [iccube: desktop vs mobile dashboards](https://iccube.com/blog/7-things-to-think-about-desktop-vs-mobile-dashboards). Esses dois são blogs de fornecedores ou consultorias, então valem como orientação, não como norma.
- **Pesquisa.** Num estudo com tablets, a maioria dos participantes entendeu e usou bem visualizações simples, sobretudo tabelas e gráficos de linha — [Games & Joshi, SPIE 9397 (core.ac.uk)](https://core.ac.uk/download/216982484.pdf).
- **Números pt-BR (CLDR).** O formato compacto português usa "mil": 1.500 vira "1,5 mil" e 10.000 vira "10 mil". A abreviação de milhão varia entre versões do CLDR ("mi") e entre pt e pt-PT ("M") — [CLDR pt number charts](https://unicode.org/cldr/charts/43/verify/numbers/pt.html).
- **Teste local (Node 22.23.4, ICU embutido).** `new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1})` gera `1,5 mil`, `12,3 mil`, `-2,3 mil` e `1,3 mi`. Com `signDisplay:'exceptZero'`, 2,35 vira `+2,4`. Com `style:'percent'`, 0,634 vira `63%`. `(12345).toLocaleString('pt-BR')` gera `12.345`. (Execução direta neste ambiente.)
- **Documentação.** O MDN em português documenta `Intl.NumberFormat` (opções `notation`, `signDisplay`, `maximumFractionDigits`) — [MDN pt-BR: Intl.NumberFormat](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).

### Inferences
**Quando usar o quê no Nexus:**
- **Tabela.** Para a classificação (8 times × 5 ou 6 colunas cabe) e para ranking de jogadores, com 3 a 4 colunas e ordenação por toque no cabeçalho. Primeira coluna (posição + escudo + tag) com `position: sticky`. Números alinhados à direita com `tabular-nums`, o que já existe em `.num`.
- **Linha-card.** Para elenco e escalação (como hoje): nome à esquerda, 1 ou 2 métricas-chave à direita (OVR e nota da temporada) e detalhes no sheet.
- **Gráfico.** Só quando a forma da série importa (ouro e probabilidade ao longo do tempo, evolução da nota na temporada). Nada de pizza ou donut.
- **Barra comparativa de duas pontas** (padrão FotMob/Sofascore "match stats"): `12 Abates 8`, com uma barra dividida proporcionalmente (azul à esquerda e vermelho à direita) e o lado que vence em negrito. Substitui os tiles "9 · 3" do `ResultSheet` e do `TabSheet`.

**Formatação pt-BR, um único módulo `fmt.ts`:**
```ts
const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat('pt-BR', o);
export const fmtOuro   = nf({ notation: 'compact', maximumFractionDigits: 1 });          // 12,3 mil
export const fmtDelta  = nf({ notation: 'compact', maximumFractionDigits: 1, signDisplay: 'exceptZero' }); // +2,3 mil
export const fmtNota   = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 });     // 6,8
export const fmtMedia  = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });     // 6,83 (média da temporada, como o Sofascore)
export const fmtPct    = nf({ style: 'percent', maximumFractionDigits: 0 });             // 63%
export const fmtKda    = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 });     // 4,2
```
- "12,3 mil" é longo para o placar ao vivo. Aceitável: "12,3k" **com vírgula** em espaços muito apertados, ou só o delta ("+2,3 mil"). O importante é não misturar ponto e vírgula. Usar o sinal de menos tipográfico (U+2212), como o `LineChart` já faz no eixo, ou o hífen do Intl, mas de forma consistente.
- Tempo de jogo: manter `mm:ss` (`fmtT`), e nos eixos usar `10′`, `20′` (já existe).

**Cores, proposta de tokens semânticos separados dos tokens de lado:**
- Lado: `--side-blue: #0AC8B9`, `--side-red: #E84057` (atuais).
- Qualidade (nota, saldo, forma): uma escala que **não reutiliza** vermelho nem ciano, por exemplo `--q-1` cinza `#5B5A56` (ruim), `--q-2` âmbar escuro `#A86B1F`, `--q-3` dourado `#C8AA6E` (médio), `--q-4` verde-amarelado `#9CC34A` (bom), `--q-5` dourado claro `#F0E6D2` com contorno (excepcional). A escala é sequencial em luminosidade, então continua legível em escala de cinza e para daltônicos, como recomenda o Datawrapper.
- Vitória e derrota na forma: letra **V** ou **D** dentro da pílula. Fundo verde-amarelado para V e cinza-escuro com contorno para D, e não vermelho, que no Nexus é "time adversário".
- Validar com o checador do Datawrapper ou com a skill `dataviz` (que tem validador de paleta) antes de fechar.

**Tooltips no toque:** manter o padrão do `LineChart` (área de leitura fixa no cabeçalho, arrastar para atualizar, `touch-action: pan-y`), que bate com a recomendação de "área fixa que atualiza". Em ícones e siglas (KP%, KDA, Nv, CS, OVR), usar um Popover do shadcn/Radix aberto por toque, não um Tooltip de hover, já que o `@radix-ui/react-tooltip` não abre com toque por padrão. Alvos de pelo menos 44 px.

**Sem enfeites desnecessários:** tirar a opacidade `.55` das linhas eliminadas (usar só a faixa lateral). Não colorir números neutros. Dar uma única cor de destaque por bloco.

### Gaps
- Não consegui abrir os artigos do Datawrapper. Os conselhos vêm dos resumos da busca.
- Não confirmei por fonte se `@radix-ui/react-tooltip` ignora toque em todas as versões. É um comportamento conhecido e documentado em issues, mas não verificado nesta sessão.

## 4. Padrões para notas de partida, destaque de MVP, KDA e gráficos de ouro e linha do tempo

### Takeaway
Nota: um selo com fundo colorido, uma casa decimal na partida e duas na média, faixas fixas e legenda acessível. MVP: card com selo "MVP", a nota em destaque e **o motivo** em uma linha. KDA: mostrar `K/D/A` mais a razão, com o caso de zero mortes tratado. Ouro e WP: o gráfico de área com duas cores do Nexus já está no padrão certo. Faltam marcadores de eventos e um rótulo final.

### Cited Findings
- Sofascore: uma casa decimal na nota da partida e duas na média da temporada. Cores por faixa fixas. Todos começam em 6,5 — [Sofascore Rating Guidelines](https://www.sofascore.com/rating-guidelines), [Sofascore Statistical Ratings](https://www.sofascore.com/news/sofascore-player-ratings).
- Flashscore: base 6 e máximo 10, a partir de estatísticas ao vivo — [Flashscore](https://www.flashscore.com/news/ten-for-exceptional-flashscore-introduces-football-player-ratings-into-our-stats-universe/0jG6lQhn).
- KDA = (K+A)/D. 4,0 é sólido e 6,0 é excelente. Um KDA alto pode esconder um jogador passivo, então é melhor ler junto com KP% — [RFT.GG](https://rft.gg/news/league-of-legends-esports-stats-guide).
- O DataMB e o mplsoccer mostram percentil na forma visual e o valor bruto no rótulo, um padrão que reduz a confusão do leitor — [mplsoccer](https://mplsoccer.readthedocs.io/en/latest/gallery/pizza_plots/plot_pizza_comparison.html), [DataMB guide](https://datamb.football/guide).

### Inferences
- **`NotaBadge`.** Retângulo de 30×20 px, `font: 700 13px var(--f-num)`, fundo pela escala `--q-*`, texto escuro, `aria-label="nota 7,4 (boa)"`. Na média da temporada, duas casas ("7,12"). Usar no `Lineup`, no `TabSheet` (que hoje não mostra nota), no `PlayerSheet` e no ranking da Liga.
- **Faixas sugeridas** (o Nexus começa em 6,0): < 5,5 ruim · 5,5–6,4 abaixo · 6,5–6,9 ok · 7,0–7,9 bom · ≥ 8,0 excelente. Calibrar com a distribuição real das notas no `runCalibration`. O ideal é que cerca de 10% das atuações caiam em "excelente", e a mesma tela do Motor pode mostrar isso.
- **MVP.** Selo "MVP" dourado (o `panel-gold` já serve), retrato do campeão, `NotaBadge` grande e uma linha de motivo: "8/1/6 · participou de 78% dos abates · roubou o Barão". O KP% sai de `stats` mais `kills`. Opcionalmente, mostrar também o "melhor do perdedor" (padrão comum em transmissões de LoL) para dar contexto à derrota do usuário.
- **KDA.** Formato `8/1/6` em `tabular-nums` com os separadores "/" esmaecidos e as mortes em outra cor suave. A razão vem depois ("KDA 14,0"). Se D = 0, mostrar "Perfeito" em vez de dividir por `max(1, d)` sem avisar, que é o que o código atual faz.
- **Gráfico de ouro e WP (melhorias sobre o atual).**
  1. Marcadores de eventos no eixo X (ícones pequenos de dragão, Barão e torre a partir de `log`), de modo que tocar num marcador mostre o evento na área de leitura. Isso explica *por que* a curva mudou.
  2. Um rótulo direto no último ponto ("+4,2 mil") em vez de depender da leitura no cabeçalho.
  3. Juntar ouro e WP num controle segmentado (Ouro | Chance de vitória) para economizar altura no celular.
  4. Para não depender só da cor, deixar as linhas de grade "▲ PAIN / ▼ LOUD" (já existem) e usar padrão ou opacidade diferente nas áreas.
- **Sparkline de forma do jogador.** Uma linha de 60×16 px com as notas dos últimos N jogos e um ponto no último, no `PlayerSheet` e no ranking. Exige guardar um histórico `nt[]` por jogador, já que hoje `SeasonStats` só tem a soma.

### Gaps
- Não achei as cores e faixas oficiais do FotMob nem as convenções de MVP do app LoL Esports / CBLOL 2026 em fonte verificável.

## 5. Opções leves de gráficos em React que combinam com Tailwind/shadcn

### Takeaway
Para o Nexus, **SVG feito à mão continua sendo a melhor escolha**: o `LineChart` atual já resolve o caso mais difícil, as sparklines têm cerca de 20 linhas e o projeto não tem Recharts. Só valeria adotar shadcn Charts (Recharts) se surgirem muitos tipos de gráfico interativo, e o custo seria de dezenas a mais de 100 kB gzip.

### Cited Findings
- Os componentes de gráfico do shadcn são construídos sobre o Recharts e, segundo a documentação, não o encapsulam numa abstração própria — [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/base/chart), [shadcn v3 chart docs](https://v3.shadcn.com/docs/components/chart).
- O peso do Recharts é incerto entre as fontes: cerca de 149,6 kB gzip numa comparação, 97 kB min+gzip num levantamento do TanStack Charts (agosto de 2026) e cerca de 45 kB em outros textos, que medem coisas diferentes — [chartts: compare Recharts](https://chartts.pages.dev/compare/recharts), [TanStack Charts](https://tanstack.com/charts), [pkgpulse: Recharts v3 vs Tremor vs Nivo 2026](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026). **Os números se contradizem. Meça no build real.**
- Pelo mesmo levantamento do TanStack, uPlot fica em cerca de 22 kB e TanStack Charts em cerca de 29 kB (linha básica, min+gzip). O shadcn.io oferece cerca de 70 gráficos no estilo shadcn refeitos sobre TanStack Charts — [TanStack Charts](https://tanstack.com/charts), [shadcn.io charts](https://www.shadcn.io/charts).
- Muitas "sparklines shadcn" são só gráficos Recharts sem eixos, então carregam o custo inteiro do Recharts — [designrevision: Shadcn Sparkline](https://designrevision.com/components/sparkline.md), [21st.dev sparkline](https://21st.dev/@mohammadshehadeh/components/sparkline.md).
- Comparativos gerais de 2026 (Recharts, Chart.js, Nivo, visx) — [pkgpulse: recharts vs chartjs vs nivo vs visx 2026](https://www.pkgpulse.com/guides/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026), [LogRocket: top React chart libraries](https://blog.logrocket.com/top-5-react-chart-libraries/).
- `package.json` do Nexus: React 19, Tailwind 3.4.1, Radix (incluindo popover e tooltip), sem biblioteca de gráficos. O `LineChart` é SVG próprio — [package.json](nexus/package.json), [Partida.tsx](nexus/src/ui/Partida.tsx).

### Inferences
- **Recomendação.** Criar `ui/charts.tsx` com componentes SVG mínimos que leem os tokens CSS:
  - `Sparkline({ values, w=60, h=16 })`: um `<path>` com o ponto final destacado (cerca de 20 linhas).
  - `DuoBar({ l, r, label })`: barra de duas pontas para "Abates 12 | 8" (div com flex, sem SVG).
  - `PctBar({ pct, value, label })`: barra de percentil com marca em 50 (estende o `Bar`).
  - `TargetBar`: extrair o `calbar` do Motor para reaproveitar em "alvo vs atual" (por exemplo, a energia ideal).
  - `LineChart`: manter e adicionar os marcadores de eventos.
  Custo de bundle perto de zero, visual coerente com a identidade hextech dourada e nenhuma dependência nova.
- **visx** (primitivas D3 modulares) seria o meio-termo se algum dia forem precisos eixos ou escalas mais complexos, porque se importa só o que se usa. Não verifiquei o peso dele nesta sessão.
- Se o projeto adotar shadcn Charts, aproveitar o `ChartConfig` com variáveis CSS (`--chart-1`…) mapeadas para `--side-blue`, `--side-red` e a escala `--q-*`, e carregar as telas com gráficos via `React.lazy` para não pesar a primeira tela.

### Gaps
- Não consegui abrir a documentação do shadcn Charts para confirmar a versão do Recharts (v2 ou v3) usada hoje nem detalhes como `accessibilityLayer`.
- O peso do Recharts não está resolvido. As fontes divergem por um fator de cerca de 3.
