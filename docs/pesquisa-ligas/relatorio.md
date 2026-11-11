# O mundo do LoL em 2026, um OVR global e o modo roguelike

Hoje o Nexus mede os jogadores do CBLOL numa escala que só faz sentido dentro do CBLOL: a FURIA tem OVR 86, o mesmo patamar que um time da LCK teria. A proposta desta pesquisa é **uma escala única para o mundo todo, ancorada em resultados internacionais reais**, e um modo em que você começa como o time mais fraco do CBLOL e precisa de várias "runs" (temporadas) para chegar a vencer o Mundial.

Os números principais:

- **Escala:** 1 ponto de OVR no nosso motor vale ~22 pontos de Elo (medido com um time contra a própria cópia). Com isso, a Gen.G (melhor time do mundo em 2026) fica com OVR ~95, a LOS (melhor do Brasil) com ~74 e a Leviatán com ~54. O motor continua calibrado (14 de 14 métricas) mesmo com todos os atributos 35 pontos abaixo ou 10 acima dos atuais.
- **Dados:** coletei do op.gg 363 jogadores com 10+ jogos nas ligas LCK, LPL, LEC, LCS, LCP e CBLOL de 2026 (fase regular e playoffs), mais todos os jogos de First Stand, MSI e Mundial. Estão em [jogadores-2026.json](jogadores-2026.json), cada um com o OVR proposto.
- **Cartas por elo:** cada carta é um jogador real com 10 elos (Ferro → Desafiante). O Desafiante é o nível real do jogador em 2026; cada elo abaixo tira 1,2 de OVR. Um Faker Ferro (71) ainda é melhor que o Tutsz Desafiante (68), mas bem pior que o Faker Desafiante (82).
- **Run:** uma temporada 2026 com o calendário real: Copa CBLOL → First Stand, Etapa 1 → MSI, Etapa 2 (2 vagas) → Mundial. As cartas e os elos ficam entre runs; a tabela, o cansaço e o entrosamento recomeçam.
- **Pegadinha encontrada:** o bônus de tática do motor usa valores absolutos (`(encaixe − 68) / 16`). Com atributos na casa de 50–60, a tática praticamente deixa de existir. A sinergia com a tática, que é o centro do que você pediu, precisa virar uma medida **relativa** ao próprio time antes de baixar os OVRs.

Uma correção à premissa: pelos dados de 2026, **o CBLOL não é a pior liga grande**. A LCP (Ásia-Pacífico) ganhou 23% dos jogos contra outras regiões, e o CBLOL ganhou 31%. No Elo de regiões, o CBLOL está em 5º de 6. Para o jogo isso não muda nada: o seu time começa como o pior do CBLOL, e o CBLOL está muito abaixo de LCK, LPL, LEC e LCS.

Ressalvas: os resultados internacionais e o Elo vieram de Wikipédia, LoL Pro Elo e notícias lidas por resumos; os números de jogadores vieram direto da API do op.gg. O Mundial 2026 ainda não terminou (final Gen.G × BLG em 14/11). O modelo de runs é simples e serve para comparar opções, não para prever horas exatas.

---

## 1. O caminho real de um campeão do CBLOL em 2026

O CBLOL voltou a ser liga própria em 2026, com três etapas e vagas diretas ([esports.net](https://www.esports.net/wiki/tournaments/cblol/); [Mais Esports](https://maisesports.com.br/cblol-2026-brasil-voltara-a-ter-vagas-exclusivas-em-torneios-internacionais)). A Riot depois deu uma segunda vaga no Mundial ao Brasil ([Mais Esports](https://maisesports.com.br/cblol-2026-brasil-tera-2-vagas-no-worlds-mundial-de-lol); [GeekPop](https://geekpopnews.com.br/riot-games-confirma-vaga-adicional-para-o-cblol-no-worlds-2026/)).

| Etapa nacional | Vaga | Torneio internacional | Formato | O que o Brasil fez |
|---|---|---|---|---|
| **Copa CBLOL** | campeão | **First Stand** (São Paulo, 16–22/03) | 8 times, 2 grupos em dupla eliminação, MD5 | LOUD 0–2 (perdeu 2–3 para LYON e 0–3 para JDG), 7º–8º |
| **Etapa 1** | campeão | **MSI** (Daejeon, 28/06–12/07) | 11 times; CBLOL entra direto na chave principal (dupla eliminação, MD5) | FURIA 0–2 (0–3 LYON, 0–3 T1), 7º–8º |
| **Etapa 2** | 1º e 2º | **Mundial** (EUA, 15/10–14/11) | 19 times: Play-In (4) → Suíço (16) → mata-mata (8), MD5 no mata-mata | LOS 2–3 no Suíço (venceu TSW e TL), 9º–11º; FURIA 1–2 no Play-In (venceu C9), 18º |

Fontes: [First Stand 2026](https://en.wikipedia.org/wiki/2026_First_Stand_Tournament), [MSI 2026](https://en.wikipedia.org/wiki/2026_Mid-Season_Invitational), [Mundial 2026](https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship), [GosuGamers](https://www.gosugamers.net/entertainment/news/79452-los-pull-off-another-worlds-2026-upset-to-eliminate-team-liquid-alienware), [Strafe](https://www.strafe.com/news/read/worlds-2026-swiss-stage-day-4-lpls-top-seed-exits-winless-as-los-survives/).

Vagas por região no Mundial 2026: LCK 4, LPL 4, LCS 3, LEC 3, LCP 3, CBLOL 2. O campeão do Etapa 2 entra direto no Suíço; o vice começa no Play-In. Campeões: First Stand = BLG (3–1 G2); MSI = Hanwha Life (3–2 BLG); Mundial = final Gen.G × BLG em 14/11.

**Conclusão para o jogo:** a "próxima etapa" depois de vencer o CBLOL não é uma só. Ela depende de qual etapa você venceu. É uma estrutura ótima para runs: a mesma temporada dá três chances de sair do Brasil, cada uma com um "chefe" diferente.

---

## 2. Quão forte é cada liga

### Estatísticas nacionais não servem para comparar ligas

As médias por jogador são quase iguais em todas as ligas (KDA 3,2–3,5, ouro por minuto 382–394), porque cada jogador é medido contra adversários da própria liga. Elas servem para comparar jogadores **dentro** de uma liga, não ligas entre si.

| Liga | KDA médio | Dano/min | Ouro/min | Mortes/jogo |
|---|---|---|---|---|
| LCK | 3,42 | 554 | 394 | 3,01 |
| LPL | 3,47 | 532 | 389 | 2,90 |
| LEC | 3,20 | 538 | 392 | 2,96 |
| LCS | 3,50 | 529 | 385 | 2,73 |
| LCP | 3,46 | 548 | 389 | 2,97 |
| CBLOL | 3,40 | 521 | 382 | 2,83 |

### O que mede a força é o confronto entre regiões

Todos os jogos entre regiões diferentes em 2026 (First Stand, MSI e Mundial, dados do op.gg):

| Região | Séries | Jogos | % dos jogos |
|---|---|---|---|
| LCK | 23–10 | 62–33 | **65%** |
| LPL | 17–10 | 44–30 | **59%** |
| LEC | 14–14 | 35–36 | 49% |
| LCS | 10–14 | 33–38 | 46% |
| CBLOL | 3–9 | 11–24 | 31% |
| LCP | 4–14 | 10–34 | 23% |

O [LoL Pro Elo](https://lolproelo.com/regions) faz isso com rigor: um Elo por time, com um ajuste por região que só muda com jogos internacionais (fórmula Elo clássica, divisor 400, K = 32, testado em ~35 mil jogos; [metodologia](https://lolproelo.com/methodology)). Ajuste de região: LCK +333, LPL +271, LEC +106, LCS +59, **CBLOL −67**, Ásia-Pacífico −130. No [ranking de times](https://lolproelo.com/rankings) (atualizado em novembro de 2026):

| # | Time | Liga | Elo | | # | Time | Liga | Elo |
|---|---|---|---|---|---|---|---|---|
| 1 | Gen.G | LCK | 2157 | | 21 | **LOS** | CBLOL | 1706 |
| 2 | Bilibili | LPL | 2067 | | 28 | Secret Whales | LCP | 1646 |
| 3 | Hanwha Life | LCK | 1957 | | 34 | Cloud9 | LCS | 1599 |
| 4 | T1 | LCK | 1933 | | 36 | **FURIA** | CBLOL | 1583 |
| 5 | Invictus | LPL | 1930 | | 41 | **LOUD** | CBLOL | 1543 |
| 6 | Dplus KIA | LCK | 1919 | | 50 | **RED** | CBLOL | 1487 |
| 11 | G2 | LEC | 1823 | | 62 | **paiN** | CBLOL | 1378 |
| 14 | LYON | LCS | 1809 | | 63 | **Vivo Keyd** | CBLOL | 1368 |
| 15 | Karmine Corp | LEC | 1808 | | 70 | **Fluxo W7M** | CBLOL | 1343 |
| 18 | Team Liquid | LCS | 1786 | | 87 | **Leviatán** | CBLOL | 1266 |

Os Global Power Rankings oficiais da Riot põem a mesma ordem no topo (BLG, Gen.G, T1, G2), mas a página do Liquipedia bloqueou a leitura ([Liquipedia](https://liquipedia.net/leagueoflegends/Global_Power_Rankings/2026/Split_2)).

**Na escala de Elo, o CBLOL é largo.** A LOS está acima de metade da LEC e de quase toda a LCS; a Leviatán está abaixo de qualquer time da LCK. Isso dá ao jogo uma escada natural: sair do fundo do CBLOL para o topo do CBLOL já é uma longa jornada.

---

## 3. Convertendo Elo em OVR do nosso motor

### Quanto vale um ponto de OVR

Medi no motor um time contra a cópia exata dele com +k em todos os atributos (rotas, luta, mapa, mental, mecânica, farm e táticos), 600 partidas por valor ([curva-ovr.ts](curva-ovr.ts)):

| Vantagem | +1 | +2 | +4 | +6 | +8 | +12 | +16 |
|---|---|---|---|---|---|---|---|
| Time mais forte vence | 52% | 45%* | 55% | 63% | 72% | 82% | 91% |

\* ruído de amostra (±2 pontos com 600 partidas).

Na fórmula do Elo, isso dá **1 OVR ≈ 22 Elo** (+8 ≈ 72% ≈ 170 Elo; +12 ≈ 82% ≈ 265 Elo). No relatório anterior, a FURIA perdia 67% para a LOUD com 2 pontos a mais: aquilo era efeito de pool e maestria, não de atributo. Em confronto espelhado, o atributo pesa bem menos do que parecia.

### Fórmula proposta

`OVR do jogador = 74 + (Elo do time − 1706) / 22 + desvio individual (±4)`

- **Âncora:** LOS = 74, para que o melhor time brasileiro fique no meio da escala e sobre espaço até ~96 sem passar de 99.
- **Desvio individual:** compara o jogador com os **próprios colegas de time** (KDA, participação no dano ou assistências para suportes, ouro ou visão, poucas mortes; pesos 35/25/20/20). A força do time já está no Elo; sem essa correção, todos os titulares da Gen.G passariam de 98 só por jogarem na Gen.G.
- **Times sem Elo publicado** (DIG, DFM, SHG, GZ, KCB): 1380 provisório.

### O motor aguenta a escala nova

Rodei a calibração completa (1000 partidas) somando um mesmo valor a todos os atributos de todos os times ([deslocamento.ts](deslocamento.ts)):

| Deslocamento | Duração | Abates | Vitória c/ 1º Barão | Vitória à frente aos 15 | Resultado |
|---|---|---|---|---|---|
| +10 | 34,1 | 28,3 | 81,1% | 75,1% | 14/14 |
| 0 (hoje) | 34,0 | 28,5 | 80,9% | 73,3% | 14/14 |
| −11 | 34,1 | 29,1 | 80,4% | 73,9% | 14/14 |
| −25 | 34,4 | 29,6 | 78,3% | 71,8% | 14/14 |
| −35 | 34,0 | 29,1 | 78,4% | 73,0% | 14/14 |

O nível absoluto quase não muda o jogo; o que importa é a diferença entre os times. O Barão fica perto da borda de baixo (78%) nos níveis mais baixos, como já acontecia.

### Resultado: OVR dos times

| Time | OVR | | Time | OVR |
|---|---|---|---|---|
| Gen.G | 94,5 | | **LOS** | **74,0** |
| Bilibili | 90,4 | | MKOI | 72,9 |
| Hanwha Life | 85,4 | | Secret Whales | 71,3 |
| T1 | 84,3 | | Cloud9 | 69,1 |
| Invictus | 84,2 | | **FURIA** | **68,4** |
| Dplus KIA | 83,7 | | **LOUD** | **66,6** |
| KT, Top Esports | 81,0 | | CTBC Flying Oyster | 65,7 |
| G2 | 79,3 | | MVK | 64,2 |
| LYON | 78,7 | | **RED** | **64,0** |
| Karmine Corp | 78,6 | | **paiN** | **59,1** |
| JD Gaming | 77,9 | | **Vivo Keyd** | **58,6** |
| Team Liquid | 77,6 | | **Fluxo W7M** | **57,5** |
| BNK FearX | 77,5 | | **Leviatán** | **54,0** |

Para sentir o tamanho: a LOS (74) contra a Gen.G (94,5) vence ~7% dos jogos e ~0,3% das séries MD5. Um time inicial de OVR ~50 contra a LOS vence ~4% dos jogos.

### Melhores jogadores por rota (OVR proposto)

| Rota | 1º | 2º | 3º | 4º | 5º |
|---|---|---|---|---|---|
| Topo | Kiin (GEN) 95 | Bin (BLG) 89 | Breathe (IG) 85 | Zeus (HLE) 85 | Hoya (NIP) 84 |
| Selva | Canyon (GEN) 94 | XUN (BLG) 90 | Wei (IG) 86 | Tarzan (AL) 84 | Kanavi (HLE) 84 |
| Meio | Chovy (GEN) 96 | knight (BLG) 93 | Zeka (HLE) 87 | Rookie (IG) 85 | ShowMaker (DK) 84 |
| Atirador | Ruler (GEN) 94 | Viper (BLG) 90 | Peyz (T1) 86 | Gumayusi (HLE) 85 | Smash (DK) 85 |
| Suporte | Duro (GEN) 94 | ON (BLG) 90 | Keria (T1) 86 | Delight (HLE) 86 | Zhuo (NIP) 85 |

Faixa por liga (mín–mediana–máx): LCK 69–78–96 · LPL 65–79–93 · LEC 58–69–81 · LCS 57–66–80 · LCP 56–62–72 · **CBLOL 52–61–75**.

No CBLOL, os primeiros são Ackerman, ZEST e Feisty (75, LOS); Tatu, Jojo, Ayu e Tutsz (FURIA) ficam entre 68 e 70; os últimos são os titulares da Leviatán (52–55). A lista completa está em [jogadores-2026.json](jogadores-2026.json).

**Sobre o Faker:** pelos números de 2026 ele fica com 82, abaixo dos colegas Keria e Peyz (86), porque teve KDA e participação no dano menores que eles. O método só enxerga o que a estatística mostra. Se você quiser que a carta reflita reputação (shotcalling, jogos grandes, títulos), o caminho honesto é um traço separado e explícito, como "Lenda: +2 em séries MD5", e não inflar o OVR.

### Dos números ao jogador do Nexus

O OVR vira os atributos que o motor já usa, distribuídos pelo perfil estatístico de cada jogador (dentro da rota): mecânica ← KDA e dano; farm e rotas ← CS e ouro por minuto; luta ← abates + assistências; mapa ← visão e first blood (caçadores); mental ← poucas mortes. A média fica igual ao OVR, com espalhamento de ±6. O pool e a maestria vêm do op.gg, como hoje no CBLOL (a consulta `championStatisticsBySerie` funciona para todas as ligas; são ~360 jogadores × 2–3 etapas de consultas, a fazer na implementação).

---

## 4. Cartas com os elos do LoL

### Os 10 elos

O elo da carta é o quanto ela já "subiu". O Desafiante é o jogador no nível real de 2026; cada elo abaixo tira 1,2 de OVR.

| Elo | Ferro | Bronze | Prata | Ouro | Platina | Esmeralda | Diamante | Mestre | Grão-Mestre | Desafiante |
|---|---|---|---|---|---|---|---|---|---|---|
| OVR vs. real | −10,8 | −9,6 | −8,4 | −7,2 | −6,0 | −4,8 | −3,6 | −2,4 | −1,2 | 0 |
| Chovy (96) | 85 | 86 | 88 | 89 | 90 | 91 | 92 | 94 | 95 | 96 |
| Faker (82) | 71 | 72 | 74 | 75 | 76 | 77 | 78 | 80 | 81 | 82 |
| Ackerman (75) | 64 | 65 | 67 | 68 | 69 | 70 | 71 | 73 | 74 | 75 |
| Tutsz (68) | 57 | 58 | 60 | 61 | 62 | 63 | 64 | 66 | 67 | 68 |
| Devost (55) | 44 | 45 | 47 | 48 | 49 | 50 | 51 | 53 | 54 | 55 |

Isso atende ao "um Faker de uma estrela não é um Faker de maior qualidade". Também cria as decisões que você descreveu: evoluir um brasileiro até o Desafiante ou usar um estrangeiro mais forte ainda em elo baixo.

### Como sobe: PdL (Pontos de Liga)

Cada carta tem 0–100 PdL no elo atual; com 100 ela é promovida, como no ranqueado.

- Jogar uma partida: +15 PdL na vitória, +6 na derrota, só para quem jogou. Usar a carta faz ela subir.
- Carta repetida do pacote: +50 PdL na carta que você já tem.
- A partir do Mestre, os ganhos caem pela metade, para o Desafiante ser raro (no LoL real, Mestre+ é ~0,7% dos jogadores e o Desafiante ~0,02%, segundo [Nerfplz](https://www.nerfplz.com/2026/08/league-of-legends-rank-distribution.html) e [lolnow](https://lolnow.gg/lol-rank-distribution/)).
- Isso substitui as "estrelas" e os "fragmentos" do relatório anterior: um recurso só (PdL), com nome que todo jogador de LoL entende.

Visual: o nome do elo sempre escrito. A escala `--q-1` a `--q-5` cobre 5 faixas, então os 10 elos se agrupam em pares (Ferro/Bronze, Prata/Ouro, Platina/Esmeralda, Diamante/Mestre, Grão-Mestre/Desafiante), mais um ícone próprio por elo. Os emblemas oficiais de elo são arte da Riot e não estão no Data Dragon; melhor desenhar ícones simples próprios.

### Pacotes e regiões liberadas

O CBLOL de 2026 tem **60 jogadores com 10+ jogos** (titulares e reservas). Isso resolve o problema do relatório anterior: **não precisamos de jogadores fictícios**. A raridade passa a vir do próprio nível do jogador.

| Liberado ao... | Entram nos pacotes | Jogadores |
|---|---|---|
| Começar | CBLOL | 60 |
| Chegar ao First Stand ou ao MSI | LCS, LEC, LCP (as regiões que você enfrenta lá) | +164 |
| Chegar ao Mundial | LCK e LPL | +139 |
| Vencer o Mundial | Edições especiais (ex.: "Campeão Mundial 2026", "MVP do MSI") | — |

- **Toda carta sai do pacote em Ferro.** Pacotes melhores mudam **quem** vem, não o elo.
- **Peso por nível:** a chance de um jogador sair cai ~10% a cada ponto de OVR real acima de 50 (`0,9^(OVR−50)`). Um Chovy (96) é ~70 vezes mais raro que um reserva da LCP (56).
- **Pacote de Rota** e **Pacote de Região** dão controle para montar sinergia (ex.: "um suporte da LEC").
- Chances sempre visíveis. Os pacotes só custam pontos ganhos jogando; nunca dinheiro (seção 9 do relatório anterior).

---

## 5. A run: uma temporada de 2026

Em roguelites, o progresso permanente funciona quando ajuda sem apagar o desafio de cada tentativa. Hades dá poder permanente (o Espelho); Slay the Spire dá variedade (cartas novas) e dificuldades extras (Ascensão), não poder ([análise](https://saschb2b.github.io/game-mechanics/concepts/meta-as-variety-not-power); [guia](https://bugnet.io/blog/how-to-design-a-roguelite-meta-progression)). Também ajuda que uma run curta ou fracassada ainda renda alguma coisa, para evitar o ciclo de frustração em que o jogador fraco nunca melhora. O Nexus combina os dois: as cartas sobem (poder), as regiões liberam jogadores novos (variedade) e, depois do Mundial, vem a Ascensão.

### Estrutura

1. **Pré-temporada:** escolha 5 titulares e até 3 reservas da sua coleção, a tática base e um "foco" da temporada (escolha 1 de 3, sorteado: ex. "Bootcamp na Coreia: +entrosamento mais rápido", "Analista de dados: +1 no draft", "Psicólogo: estresse sobe mais devagar").
2. **Copa CBLOL:** 8 times, todos contra todos em MD1 (7 jogos), 4 melhores para o mata-mata em MD5. O campeão vai ao **First Stand**.
3. **Etapa 1:** igual; o campeão vai ao **MSI** (chave principal, dupla eliminação, MD5).
4. **Etapa 2:** igual; 1º vai ao **Suíço do Mundial**, 2º ao **Play-In**.
5. **Fim da run:** depois do Mundial ou da Etapa 2. Prêmio por desempenho (pontos e um pacote), resumo da temporada.

Entre uma etapa e outra: mais uma escolha de 1 de 3, janela de troca de titulares e o cansaço e o estresse acumulados (o banco importa).

### O que fica e o que recomeça

| Fica entre runs | Recomeça a cada run |
|---|---|
| Coleção de cartas, elos e PdL | Tabela e resultados |
| Regiões liberadas | Energia, estresse, moral |
| Pontos não gastos | Entrosamento do time e domínio da tática (seção 6) |
| Recordes (melhor campanha, títulos) | Escolhas de pré-temporada |

### Depois do primeiro título mundial: Ascensão

Como no Slay the Spire: níveis opcionais que deixam a run seguinte mais difícil (ex.: adversários com +2 de OVR; MD1 nos internacionais; cansaço mais rápido), com recompensa maior.

### Os adversários

Os 7 rivais do CBLOL são sempre os times reais, no nível real (LOS 74 → Leviatán 54). O seu time inicial (5 cartas Ferro do CBLOL, da metade de baixo, uma por rota) fica com OVR ~47–50, **abaixo da Leviatán**, como você pediu. Nos internacionais entram os times reais daquele torneio de 2026, cada um com os jogadores dele (ex.: no First Stand: Gen.G, BNK FearX, BLG, JDG, G2, LYON, Secret Whales).

Um detalhe para decidir: o seu time joga **no lugar de quem** no CBLOL? Sugestão: no lugar do time que o jogador escolher ao fundar o clube (ele herda o nome e as cores, mas não os jogadores), e esse time sai da liga naquela run. Assim o campeonato continua com 8 times.

---

## 6. Sinergia com a tática e entrosamento

Hoje existem três peças, e duas não funcionam para o que você quer:

1. **Encaixe da tática** (`TACT_FIT`): média de atributos do elenco para cada opção (ex.: "Teamfight" = luta + iniciação + proteção). A força do bônus é `(encaixe − 68) / 16`, limitada de 0,2 a 1,5 ([tactics.ts:54](../../src/game/tactics.ts)). É **absoluta**: um time do CBLOL na escala nova (atributos ~60) teria bônus mínimo em toda tática, e a sugestão automática escolheria sempre "Equilibrado" (os limiares são 80 e 82).
2. **Entrosamento** (`chemistry`): existe nos times, mas **o motor não lê**.
3. **Pool e maestria:** já pesam muito (é o efeito que fez a FURIA perder para a LOUD no relatório anterior).

Proposta:

- **Encaixe relativo:** a força da tática passa a ser o quanto os atributos que ela usa estão **acima da média do próprio time** (`encaixe − OVR do time`). Um time fraco, mas montado para lutar, joga bem a tática de luta. Isso exige recalibrar o motor.
- **Perfil de estilo das cartas a partir do pool real:** os campeões que o jogador mais jogou em 2026 dão as aptidões de estilo (os campeões já têm tags: tanque, proteção, lutador, assassino, mago, poke, hipercarry, catcher). Um suporte que jogou muito Rell e Nautilus encaixa em "Iniciação"; um que jogou Karma e Lulu, em "Proteção do carry". Cada carta passa a ter "sinergias diferentes", como você pediu, vindas de dados reais.
- **Entrosamento por run:** começa baixo e sobe a cada partida que **os mesmos cinco** jogam juntos; cartas da mesma organização real começam com bônus. Entra como um bônus pequeno nas rolagens de luta e gank.
- **Domínio da tática:** cada partida com a mesma tática aumenta um pouco o bônus dela naquela run (treino). Isso premia a consistência e é uma decisão de roguelike: trocar de tática perde o que já foi treinado.

Os três entram no motor e precisam da calibração de 500+ partidas.

---

## 7. Ritmo: o modelo de runs

[runs.cjs](runs.cjs) simula jogadores fazendo runs com as regras acima, só com a sorte dos jogos pelo Elo. Não modela draft nem tática, que no jogo real ajudam quem joga bem. Hipóteses: ~6 min por partida, CBLOL em MD1 + mata-mata MD5, 120 pontos por vitória e 50 por derrota, pacote de 3 cartas.

| Marco | Pacote 500, PdL normal | Pacote 250, PdL ×2 |
|---|---|---|
| OVR do time ao fim da 1ª run | ~51 | ~55 |
| OVR ao fim da 5ª run | ~65 | ~69 |
| Chegou ao Mundial pela 1ª vez (2º lugar no Etapa 2) | run 8 (~23 h) | run 6 (~19 h) |
| 1º título do CBLOL | run 10 (~31 h), OVR ~71 | run 7 (~22 h), OVR ~71 |
| Venceu o First Stand / MSI | run 24–25 (~115 h) | run 17 (~80 h) |
| Campeão mundial | run 28 (~138 h; 60% chegam em 40 runs) | run 19 (~94 h; 48% em 25 runs) |

Leituras:

- **A estrutura funciona:** o primeiro título do CBLOL chega quando o time alcança a LOS (~71–74), e o internacional quando chega perto do top 10 mundial (~81–83). É exatamente a curva que você descreveu.
- **Está longo demais.** Cada run leva ~2,5–3 h (três etapas mais internacionais), e o primeiro título só vem perto da 7ª–10ª run. Para um jogo de celular, eu miraria **o primeiro título do CBLOL em 3 a 5 runs** e o primeiro Mundial em ~40–60 h. Ajustes possíveis, do mais simples ao mais radical: mais pontos por jogo; pacote de boas-vindas maior; run com duas etapas nacionais em vez de três; elo inicial Bronze em vez de Ferro.
- **O título mundial vem antes de alcançar a Gen.G:** no modelo, ele chega com o time em OVR 82–83, porque a chave sorteia adversários médios do torneio (~78–85) e nem sempre cruza com a Gen.G (94,5). Contra ela, um time 12 pontos pior vence só ~4% das séries MD5. Ou seja, a sorte do chaveamento pesa; no jogo real, draft e tática dão ao jogador habilidoso a chance de zebra que o modelo não tem.

---

## 8. O que muda em relação ao relatório anterior

| Antes ([pesquisa-progressao](../pesquisa-progressao/relatorio.md)) | Agora |
|---|---|
| Raridade Comum/Rara/Épica/Lendária + estrelas ★1–★5 | 10 elos do LoL; a raridade vem do nível real do jogador |
| Cópias, fragmentos e PN para subir | PdL: jogar e cartas repetidas |
| ~30 jogadores fictícios para a base | 60 jogadores reais do CBLOL (titulares e reservas) |
| Circuito inventado de 5 divisões | Calendário real de 2026: Copa, Etapa 1, Etapa 2, First Stand, MSI, Mundial |
| OVR do CBLOL em 68–89 | Escala mundial: CBLOL 52–75, mundo até 96 |
| Progressão contínua | Runs (temporadas) com progresso permanente das cartas |

Continuam valendo: o save versionado com exportar/importar, os pontos por partida, as chances visíveis, nada à venda, e o modo Clássico ao lado do novo.

---

## 9. Plano em etapas

1. **Escala mundial no modo atual** (sem cartas ainda): tática com encaixe relativo; novos OVRs do CBLOL a partir do Elo; calibração. O modo Clássico já fica realista, e é uma mudança testável sozinha.
2. **Dados do mundo:** pools e maestria dos ~360 jogadores (op.gg), atributos derivados das estatísticas, times internacionais de 2026 em `data.ts` (ou num arquivo próprio, carregado só quando a região for liberada, para não pesar no download).
3. **Save + cartas + elos/PdL + pacotes** (base do modo novo).
4. **Run:** calendário, escolhas de 1 de 3, entrosamento e domínio de tática, fim de run.
5. **Internacionais** (First Stand, MSI, Mundial com Suíço e Play-In) e liberação de regiões.
6. **Ascensão e edições especiais.**

## 10. Decisões para você

1. **Âncora:** LOS = 74 (proposta) deixa o CBLOL entre 52 e 75 e o mundo até 96. Prefere outra âncora?
2. **Faker e lendas:** OVR só por estatística (Faker 82) ou um traço explícito de "Lenda"?
3. **Run:** três etapas nacionais por run (calendário real, ~2,5–3 h) ou duas (mais curta)?
4. **Seu time no CBLOL:** substitui um time real escolhido por você ou entra como 9º time?
5. **Ritmo:** o primeiro título do CBLOL em 3–5 runs está bom como meta?
6. **Ordem:** começar pela etapa 1 (escala mundial no modo atual, já jogável) antes do modo de cartas?

---

### Arquivos desta pesquisa

| Arquivo | O que é |
|---|---|
| [jogadores-2026.json](jogadores-2026.json) | 363 jogadores (10+ jogos em 2026): liga, time, rota, jogos, vitórias, KDA, dano, ouro, CS, visão, Elo do time, OVR proposto |
| [coleta-opgg.mjs](coleta-opgg.mjs) | Coleta única pela API pública do op.gg esports (11/11/2026) |
| [agrega.mjs](agrega.mjs) | Agrega por jogador, médias por liga, recorde entre regiões |
| [ovr-mundial.mjs](ovr-mundial.mjs) | Elo → OVR com o desvio individual |
| [curva-ovr.ts](curva-ovr.ts) | Mede quanto 1 OVR vale no motor (time contra a própria cópia) |
| [deslocamento.ts](deslocamento.ts) | Calibração com todos os atributos deslocados |
| [runs.cjs](runs.cjs) | Modelo de ritmo das runs |

Fontes de regras e resultados: [esports.net (CBLOL 2026)](https://www.esports.net/wiki/tournaments/cblol/), [Mais Esports (vagas)](https://maisesports.com.br/cblol-2026-brasil-tera-2-vagas-no-worlds-mundial-de-lol), [Wikipédia: First Stand 2026](https://en.wikipedia.org/wiki/2026_First_Stand_Tournament), [MSI 2026](https://en.wikipedia.org/wiki/2026_Mid-Season_Invitational), [Mundial 2026](https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship), [LoL Pro Elo (regiões, times, metodologia)](https://lolproelo.com/regions), [Sheep Esports (MVP da LEC)](https://www.sheepesports.com/en/articles/kc-caliste-wins-the-2026-lec-summer-split-mvp/en), [Dot Esports (Suíço)](https://dotesports.com/league-of-legends/news/worlds-2026-swiss-day-8-results), dados de jogadores do [op.gg esports](https://esports.op.gg).
