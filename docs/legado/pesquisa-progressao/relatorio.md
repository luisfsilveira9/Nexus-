# Meu Time: criação de time e progressão por cartas

O Nexus pode ganhar um modo de progressão no estilo Ultimate Team sem mexer no motor da partida: **a carta é um jogador real (ou fictício) com raridade fixa e estrelas que sobem com cópias repetidas; o time do usuário vira mais um time na liga, montado a partir das cartas; cada partida rende pontos que compram pacotes**. O motor continua recebendo um `Team` com cinco `Player`, como hoje. O que muda é de onde vêm esses cinco.

Três achados mudam o desenho em relação à ideia "pegue o FUT e troque futebol por LoL":

1. **O motor é muito sensível a atributos.** Medi 400 partidas por confronto: um time com 6 a 8 pontos de OVR a mais vence de 78% a 94% das vezes. Um time inicial de cartas comuns (OVR ~64) perderia quase sempre para qualquer time do CBLOL (72 a 86). Por isso **a progressão precisa de adversários mais fracos no começo** (times fictícios de acesso) e o bônus por estrela tem de ser pequeno (+1 por estrela).
2. **OVR sozinho prevê mal o resultado.** FURIA (86) perdeu 67% para a LOUD (84), e entre pares com 2 pontos de diferença o favorito venceu de 33% a 67%. Pool de campeões, maestria e encaixe pesam tanto quanto o OVR. Isso é bom para o modo de cartas: **montar o time bem (pools que se completam, táticas) importa, não só juntar a maior soma**. Também significa que a "força" de uma carta para o pareamento de adversários deve ser medida por simulação, não por OVR.
3. **Só existem 40 jogadores, e só 8 deles são de elite (≥ 85).** Uma coleção com 40 cartas acaba rápido e não tem base comum. É preciso **uma camada de jogadores fictícios** para a raridade Comum e para os times de acesso.

Ressalvas de método: as fontes externas foram lidas por resumos de busca; várias trazem números conflitantes (marcados no texto). Os números de economia são uma proposta inicial testada num modelo simples ([ritmo.cjs](ritmo.cjs)), não no jogo.

---

## 1. O que existe hoje e o que precisa mudar

| Peça | Hoje | No modo Meu Time |
|---|---|---|
| Time do usuário | Escolhe um dos 8 (`pickTeam`), `G.userId` | Um time próprio (`id: 'meu'`) com nome, sigla e escudo escolhidos, inserido em `LEAGUE.teams` |
| Jogadores | 40 fixos em `data.ts`, id `time_Rota` | Catálogo imutável (40 reais + ~30 fictícios) + cartas possuídas com estado próprio |
| Atributos | Estimados; Treino SoloQ sobe +1 sem teto | Base da carta + estrelas; treino vira forma temporária (senão inflaciona sem fim) |
| Orçamento | `budget` em R$, só o Stream mexe | Substituído por **Pontos Nexus (PN)** no modo de cartas; R$ fica no modo clássico |
| Entrosamento | `chemistry` fixo, **não é lido pelo motor** | Fase 2: química por organização em comum (exige calibrar) |
| Energia/estresse | Afetam a partida via Condição | Mantidos: são o que faz o banco importar (rodar titulares cansados) |
| Moral | Só visual | Pode virar reação a vitórias/derrotas, ainda sem efeito na partida |
| Temporada | `SEASON` com resultados reais fixos | Modo clássico continua assim; Meu Time tem sua própria tabela |
| Persistência | Nenhuma | Obrigatória: save versionado em `localStorage` + exportar/importar |

Recomendação: **dois modos na tela inicial**, "Clássico" (o jogo de hoje, sem save) e "Meu Time" (cartas, com save). Isso protege tudo o que já foi calibrado e testado e deixa o modo novo crescer em paralelo.

---

## 2. O que os jogos de referência fazem

### EA FC Ultimate Team (o modelo pedido)

- **Começo:** o jogador escolhe uma liga inicial e recebe um pacote; elencos iniciais típicos custam no máximo ~20 mil moedas, porque no início quase não há moedas ([Sportskeeda](https://www.sportskeeda.com/esports/how-get-started-ea-fc-26-web-app); [Red Bull](https://www.redbull.com/us-en/fc-26-ultimate-team-guide)).
- **Objetivos guiados:** a "Foundations Mode Mastery" paga por experimentar cada modo (7 partidas de Squad Battles, 5 grupos de SBC, 7 vitórias) e termina num pacote de jogador 84+ ([FutMind](https://futmind.com/articles/3775/manifest.json)). É o tutorial disfarçado de recompensa.
- **SBC (Desafios de Montagem):** trocar cartas por recompensas com requisitos (ex.: rating mínimo 65 e química 25 → pacote de 12 ouros raros) ([FutMind](https://futmind.com/articles/38/fc-26-early-access-challenge-1-sbc-full-guide-best-solutions)). É o principal **ralo** de cartas repetidas.
- **Química:** de 0 a 3 por jogador, máximo 33 no time, por clube, liga e nação em comum; o técnico soma 1 ponto ([fifauteam](https://fifauteam.com/fc-26-chemistry/); [Total Apex](https://totalapexgaming.com/?p=75505)). Os limiares exatos divergem entre fontes. Jogador sem química joga com os atributos base, sem penalidade.
- **Evolutions:** caminhos de objetivos que melhoram uma carta específica que você já tem ([EA](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-fut-deep-dive)). É progressão **determinística** ao lado da sorte dos pacotes.
- **Ritmo:** a EA desacelerou de propósito as recompensas no FC 26 ([EA, notas de lançamento](https://forums.ea.com/blog/ea-sports-fc-game-info-hub-en/ea-sports-fc%E2%84%A2-26--fc-26-launch-update/12570890)). O problema crônico do FUT é inflação: em semanas todo mundo tem cartas altas.
- **Draft:** modo à parte com jogadores emprestados que não entram no clube, só as recompensas ([fifauteam](https://fifauteam.com/draft-football-club-26/)). Encaixa bem no Nexus, que já tem draft de campeões.

### Clash Royale (cartas iguais sobem de nível)

Cópias repetidas enchem uma barra; com a barra cheia, paga-se ouro para subir o nível. A partir do nível máximo comum, as cópias excedentes viravam uma moeda "curinga" (Elite Wild Cards) para o nível final ([Supercell](https://clashroyale.com/blog/news/how-to-get-elite-levels-level-15.html); [RoyaleAPI](https://royaleapi.com/blog/elite-levels-2023-q2-update)). Em dezembro de 2025 a Supercell **removeu essa moeda extra** e voltou a "só cartas e ouro", para simplificar ([Supercell](https://supercell.com/en/games/clashroyale/blog/release-notes/december-update-2025)). Lição: duas moedas de progressão já confundem; três é demais.

### Marvel Snap (subir carta = progresso da conta)

Cada melhoria de carta custa créditos e "boosters" daquela carta, e soma pontos de Nível de Coleção, que é o que libera cartas novas; raridades maiores dão mais nível ([MarvelSnapZone](https://marvelsnapzone.com/marvel-snap-progression-guide/)). O recurso escasso é o crédito, limitado pelo tempo de jogo ([Friedman](https://danielfriedman.substack.com/p/a-comprehensive-guide-to-the-marvel)). Lição: **cada melhoria deve também contar para um progresso geral**, para nunca parecer desperdício.

### Hearthstone (proteção contra azar)

Garantia de carta épica a cada 10 pacotes e lendária a cada ~40 (contadores por coleção), lendária garantida nos 10 primeiros pacotes e, desde 2020, **proteção contra duplicatas**: não vem repetida de uma raridade até você ter todas dela. Cartas podem ser desfeitas em "pó" e o pó fabrica a carta que você quiser ([cardgamer](https://cardgamer.com/digital-card-games/hearthstone/how-card-rarities-work-in-hearthstone-explained/); [Blizzard Watch](https://blizzardwatch.com/2020/03/23/hearthstones-duplicate-protection-new-player-experience-completely-change-game/)). Os limiares vêm de guias de fãs.

Guias de design de gacha dizem o mesmo por outro ângulo: a garantia ("pity") custa pouco ao designer e elimina as piores experiências; repetidas devem sempre virar progresso; uma moeda que acumula nos azares e compra o item desejado transforma sorte em caminho certo ([Mobile Free to Play](https://mobilefreetoplay.com/?p=8720); [PulseGeek](https://pulsegeek.com/articles/what-is-a-pity-counter-in-gacha-how-it-works/)).

### LoL Esports Manager (Tencent, só China)

O manager oficial de LoL usa cartas de jogadores reais com nota, estrelas e níveis, raridades SR/SSR de gacha, estratégias de time e partidas de ~5 min ([RiftFeed](https://riftfeed.gg/lol-news/lol-esports-manager-trailer-details); [ONE Esports](https://www.oneesports.gg/lol/mobile-game-lol-esports-manager-lpl-team/)). A crítica recorrente foi "pague para vencer": a melhor carta decide, não a gestão ([MGG](https://www.millenium.gg/noticias/40842.html)). O Nexus não vende nada, mas a lição vale: **a sorte do pacote não pode decidir sozinha**; o encaixe de pool e a tática precisam pesar (e no nosso motor já pesam, achado 2).

---

## 3. A carta

### Catálogo e carta possuída

Separar o que é fixo do que é do usuário:

```ts
// catálogo (imutável, gerado de LEAGUE + fictícios)
interface CardDef { id: string; playerId: string; rar: 'C'|'R'|'E'|'L'; org: string; edicao: 'S2'|'S1'|'MVP' }
// carta do usuário (salva)
interface Owned { uid: string; def: string; star: 1|2|3|4|5; copias: number; energy: number; stress: number; morale: number; season: SeasonStats }
```

Na hora da partida, `buildMeuTime()` clona o `Player` base, aplica o bônus das estrelas e a condição da carta e devolve um `Team` comum. O motor, o draft e a maestria real (pools do op.gg) funcionam sem mudança. Os ids ficam `meu_Top` etc., então o Tutsz da sua equipe e o Tutsz da FURIA adversária não colidem (o FUT convive com isso; aqui só vale um aviso discreto no confronto).

### Raridades

Cortes pelo OVR atual (dados de `data.ts`):

| Raridade | OVR | Jogadores | Por rota |
|---|---|---|---|
| **Lendária** | ≥ 85 | 8: Tutsz, JoJo, Ackerman, xyno, Feisty, Tatu, Kaze, Curse | MID 3 · SUP 2 · JG 2 · TOP 1 · **ADC 0** |
| **Épica** | 80–84 | 11 (Ayu, Duduhh, Guigo, Sinatra, STEPZ, Zest…) | ADC 5 · JG 3 · TOP 2 · SUP 1 · MID 0 |
| **Rara** | 72–79 | 20 | todas as rotas |
| **Comum** | < 72 | Devost + ~30 fictícios (6 por rota, OVR 58–68) | todas |

Pontos a decidir: nenhum atirador é Lendário e nenhum mid é Épico. Dá para aceitar (é o retrato real do CBLOL) ou criar **edições especiais** ("MVP do Split", "Destaque da Final") que dão a jogadores específicos uma versão +3 com outra raridade, como as cartas especiais do FUT. As edições também são a forma natural de crescer a coleção sem inventar atributos: Split 1 e Split 2 já têm dados reais separados no op.gg.

Visual: as quatro raridades usam a escala `--q-2` a `--q-5` mais um nome escrito (nunca só cor). O dourado continua reservado à ação principal; a Lendária usa `--q-5`, não o acento.

### Estrelas (cartas iguais sobem a carta)

| Estrela | Cópias para subir | Bônus | PN para subir (× raridade*) |
|---|---|---|---|
| ★1 | — | +0 | — |
| ★2 | 1 | +1 em rotas, lutas, mapa e mental (OVR +1) | 1 × base |
| ★3 | 2 | +2 | 2 × base |
| ★4 | 3 | +3 | 3 × base |
| ★5 | 4 | +4 | 4 × base |

\* base: Comum 50, Rara 100, Épica 200, Lendária 400 PN. Total para ★5: 10 cópias.

Por que +1 por estrela: no motor, 6 a 8 pontos de OVR já decidem 80–90% das partidas. Com +4 no máximo, uma Rara 76 em ★5 (80) alcança uma Épica recém-tirada, mas não uma Lendária. É a sobreposição que dá valor às cartas baixas sem tornar as altas inúteis.

O modelo mostrou um problema: **com 8 Lendárias e 1,5% de chance, ninguém chega a uma Lendária ★5 em 60 horas**. Por isso as cópias precisam de uma saída determinística:

- **Fragmentos** (uma moeda só, como o pó do Hearthstone): cópias além do necessário para ★5, e cópias que o jogador decidir desfazer, viram fragmentos (Comum 5, Rara 20, Épica 80, Lendária 400). Com fragmentos se **fabrica a carta que quiser** (Comum 40, Rara 160, Épica 640, Lendária 3200) ou se compra uma cópia para subir estrela.
- Nada de terceira moeda: PN para pacotes e melhorias, fragmentos para escolher. A Supercell acabou de cortar a moeda extra do Clash Royale por excesso de complexidade.

### Treino com cartas

Hoje o Treino SoloQ sobe +1 permanente sem teto. Num modo de cartas isso faz qualquer Comum virar Lendária com toques. Proposta: no Meu Time o treino dá **Forma** (+1 a +2 por 3 partidas) ou XP que sobe estrela só até ★3. Folga, psicólogo e o efeito em energia/estresse ficam iguais.

---

## 4. Começo do jogo

Fluxo sugerido (cinco telas curtas, pensadas para o celular):

1. **Fundar o time:** nome, sigla de 3 letras e escudo (o `Crest` já gera escudo por cor/iniciais; escolher entre 6 cores basta).
2. **Pacote inicial:** abertura animada com 5 Comuns, **uma por rota** (o time sempre fica jogável).
3. **Escolha o seu craque:** 1 entre 3 Raras de rotas diferentes. Dá ao jogador a primeira decisão e a primeira carta "dele" (FUT faz o mesmo com o pacote de escolha). Animação curta e desligada com `prefers-reduced-motion`.
4. **Escalação:** cinco vagas por rota já preenchidas, com explicação de condição e pool em uma frase cada.
5. **1.000 PN** e um objetivo ativo: "Vença 1 partida → pacote Básico grátis".

Em vez do "pacote de cartas aleatório puro" para o começo, garantir uma carta por rota evita o pior caso (sem suporte, por exemplo). Hearthstone fez o mesmo ao garantir lendária nos primeiros pacotes.

### Objetivos iniciais (o tutorial)

Como a Foundations do FUT: uma lista curta que ensina cada sistema e paga por ele.

| Objetivo | Ensina | Recompensa |
|---|---|---|
| Vença sua primeira partida | partida | Pacote Básico |
| Abra um pacote | loja | 300 PN |
| Suba uma carta para ★2 | estrelas | 200 PN |
| Use uma tática pronta numa vitória | táticas | Pacote Básico |
| Dê folga a um jogador cansado | condição | 150 PN |
| Vença uma série MD3 | séries/Fearless | Pacote de Rota |
| Fabrique uma carta com fragmentos | fragmentos | 100 fragmentos |
| Suba de divisão | progressão | Pacote Premium |

---

## 5. Pontos, pacotes e ritmo

### Fontes de PN (por partida)

| Evento | PN |
|---|---|
| Vitória | 120 |
| Derrota | 50 (perder também rende; o celular é jogo casual) |
| Série vencida | +150 |
| MVP no seu time | +25 |
| Promoção de divisão | 1.000 + pacote |

Nada de bônus por login diário ou contagem de dias seguidos: o dono joga quando quer, e o próprio armazenamento pode sumir (seção 7). Recompensa por **jogar**, não por voltar.

### Pacotes

| Pacote | Preço | Cartas | Chances por carta |
|---|---|---|---|
| Básico | 500 PN | 3 | Comum 60% · Rara 30% · Épica 8,5% · Lendária 1,5% |
| De Rota | 800 PN | 3 da rota escolhida | Comum 45% · Rara 40% · Épica 12% · Lendária 3% |
| Premium | 1.500 PN | 3, ao menos uma Rara | Rara 55% · Épica 35% · Lendária 10% |

- **Chances sempre visíveis** na loja e no próprio pacote.
- **Garantia:** Lendária garantida se 20 pacotes seguidos vierem sem nenhuma (contador visível: "Lendária garantida em 7 pacotes").
- **Proteção de repetidas suave:** dentro de uma raridade, sortear primeiro entre as que o jogador ainda não tem, com peso 3×. Não zero, porque aqui repetidas são úteis (estrelas).

### Ritmo medido no modelo

[ritmo.cjs](ritmo.cjs) simula 400 jogadores com as regras acima (taxa de vitória de 50%, ~6 min por partida incluindo draft, comprando só Básicos ou só Premium):

| Marco | Só Básicos | Só Premium |
|---|---|---|
| 1ª Épica | ~0,5 h | ~0,5 h |
| Time com OVR médio 75 | ~1,1 h | ~1,7 h |
| 1ª Lendária | ~7 h | ~2,5 h |
| 1ª carta ★3 | ~6 h | ~15 h |
| Time com OVR médio 80 | ~4,5 h | ~4 h |
| Time com OVR médio 85 | ~22 h | ~15 h |
| Cartas distintas após 20 h | 55 de 70 | 31 de 70 |

Leitura: os dois caminhos chegam ao mesmo lugar por rotas diferentes (muitas cartas e estrelas × poucas cartas fortes), o que é uma escolha interessante. O topo (OVR 85) leva ~15–22 h, e completar tudo com ★5 fica como cauda longa via fragmentos. Se no teste real parecer rápido demais, o primeiro ajuste é reduzir a recompensa por vitória, não mexer nas chances.

---

## 6. Contra quem se joga: o Circuito

O motor mostrou que um time inicial (OVR ~64) não tem chance contra o CBLOL. Proposta, com nomes de competição (não de elo, para não confundir com raridade):

| Divisão | Adversários | OVR dos rivais |
|---|---|---|
| 5 · Copa Amadora | 7 times fictícios | 60–66 |
| 4 · Circuito Desafiante | 7 times fictícios | 66–72 |
| 3 · Academy | 4 fictícios + LEV, FXW, PNG (com reservas) | 70–77 |
| 2 · CBLOL | os 7 times reais restantes | 72–86 |
| 1 · Mundial | seleção de elite (edições MVP) | 85+ |

- **Temporada** = uma volta contra os outros 7 da divisão (MD1 ou MD3, à escolha), igual à fase regular do CBLOL de 8 times. Os 2 primeiros sobem, os 2 últimos descem (na 5 ninguém desce). A tabela reaproveita `standings`.
- Os times fictícios são gerados uma vez por semente (nomes inventados, OVR na faixa da divisão, pools tirados dos campeões mais jogados por rota no CBLOL).
- O ritmo do modelo (OVR 75 em ~1 h, 80 em ~5 h, 85 em ~20 h) casa com essa escada: ~1 h na Copa Amadora, algumas horas até o CBLOL e uma longa estadia lá.
- Opcional, fase 3: **Draft de cartas** (como o Draft do FUT): monta-se um time com cartas sorteadas emprestadas para um torneio de 4 partidas; as recompensas vão para o seu clube. Aproveita a tela de draft que já existe.

---

## 7. Salvar o jogo

Progressão sem save não existe. O que pesa:

- **Tamanho:** catálogo fica no código; o save guarda só ~100 cartas possuídas, PN, fragmentos, objetivos e a tabela da temporada. Algo como 10–20 kB em JSON. **`localStorage` basta**; IndexedDB só se um dia salvar histórico de partidas.
- **Formato:** `{ v: 1, criadoEm, time, cartas, pn, fragmentos, objetivos, circuito, semente }`, gravado após cada partida e cada ação (com `try/catch`; em aba anônima pode falhar). Cada versão nova do save ganha uma função `migrar[v]` que leva do formato anterior ao atual, e o catálogo usa ids estáveis (o jogador some de `data.ts`? a carta vira fragmentos na migração).
- **O risco real é perder o save sem aviso.** O Safari apaga armazenamento de sites sem interação por 7 dias; `navigator.storage.persist()` só é concedido por heurística (ex.: site adicionado à tela inicial) ([WebKit](https://webkit.org/?p=14403); [MDN](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). E navegadores internos de apps (o dono joga por um) costumam ter armazenamento separado do navegador principal e às vezes descartável. Por isso:
  - pedir `persist()` na criação do time;
  - **exportar/importar save** como código copiável (JSON comprimido em base64) e como arquivo, com lembrete após cada promoção de divisão;
  - mostrar "Último salvamento: há 2 min" no menu.

---

## 8. Química (fase 2)

O entrosamento atual (`chemistry`) não entra na partida. Com cartas de times diferentes, uma química **por organização em comum** cria a mesma decisão do FUT (melhor carta isolada × conjunto que se conhece) e é coerente com o LoL, em que duplas de rota entrosadas (bot lane, mid-jungle) fazem diferença:

- +1 para dois jogadores da mesma organização; +1 extra se forem dupla de rota (ADC+SUP, MID+JG); máximo 3 por jogador.
- Efeito pequeno nas rolagens de luta e gank, como bônus (sem penalidade abaixo de zero, igual ao FUT).

Mexe no motor, então exige calibração com 500+ partidas e não deve entrar na primeira etapa.

---

## 9. Cuidados legais e de produto

- **Lei brasileira de caixas de recompensa:** o ECA Digital (Lei 15.211/2025, em vigor desde 17/03/2026) proíbe loot boxes em jogos para crianças ou de provável acesso por elas, e define loot box como recurso **pago** de itens aleatórios ([TecMundo](https://www.tecmundo.com.br/voxel/502437-loot-boxes-serao-proibidas-no-brasil-apos-sancao-de-lula-entenda-impacto-da-lei-felca-nos-games.htm); [Mattos Filho](https://www.mattosfilho.com.br/unico/eca-digital-na-pratica/); [nota técnica do MJ](https://www.gov.br/mj/pt-br/assuntos/noticias-1/mjsp-pede-a-anpd-que-monitore-jogos-eletronicos-com-caixas-de-recompensa-que-nao-implementaram-verificacao-de-idade/NotaTcnican55.pdf)). Como os pacotes do Nexus só custam PN ganhos jogando e o jogo não vende nada, ficam fora da definição. **Regra para o futuro: nunca vender PN, pacotes ou cartas por dinheiro**, nem doações em troca de pacotes. Não li o texto do art. 20 no Planalto.
- **Política de projetos de fã da Riot:** permite projetos gratuitos, proíbe conteúdo atrás de pagamento, financiamento coletivo e publicação em lojas de apps sem licença, e pede o aviso de que a Riot não endossa o projeto ([Riot, Legal Jibber Jabber](https://riotgames.com/legal-jibber-jabber)). O rodapé já credita a Riot; vale acrescentar a frase de não endosso. Isso também descarta virar app de loja.
- **Jogadores reais como cartas:** os nomes já aparecem no jogo; cartas com "raridade" e notas tornam a comparação mais explícita. Para um projeto gratuito de fã o risco é baixo, mas fica a recomendação de não usar fotos dos jogadores (só nick, rota e escudo), como hoje.

---

## 10. Telas (celular, 360 px)

- **Início (nova aba):** time, divisão, próximo jogo, objetivo ativo, botão dourado "Jogar". Resolve também a aba "Início" que já estava na lista de pendências.
- **Clube:** grade de cartas 3 por linha (~110 px), filtros por rota/raridade, selo de estrelas e "pode subir" quando há cópias. Toque abre a página do jogador que já existe (com aba nova "Carta": estrelas, cópias, fragmentar).
- **Escalação:** as cinco vagas no formato da faixa de titulares atual + banco; trocar por toque, não por arrastar.
- **Loja:** três pacotes com preço, chances e contador de garantia; abertura com revelação carta a carta (toque para virar; "Revelar tudo").
- **Circuito:** tabela da divisão (reaproveita a Liga) com faixas de promoção/rebaixamento escritas, não só coloridas.
- **Pós-jogo:** a folha de resultado ganha uma linha "+170 PN" e o progresso do objetivo.

---

## 11. Plano em etapas

Seguindo a cadência de um PR por etapa:

1. **Fundação (sem tela nova de cartas):** save versionado + exportar/importar; tipos `CardDef`/`Owned`; geração dos ~30 fictícios e dos times de acesso; `buildMeuTime()`; teste com semente provando que um `Team` montado a partir das cartas com os mesmos jogadores dá o mesmo resultado que o original.
2. **Criação do time e Clube:** fundar time, pacote inicial, escolha do craque, escalação, grade de cartas, estrelas e fragmentos.
3. **Economia e Circuito:** PN por partida, loja, garantia, temporadas com promoção, objetivos iniciais. Ajuste dos números com o dono jogando.
4. **Química** (com calibração do motor).
5. **Edições especiais e Draft de cartas.**

## 12. Decisões para o dono

1. Dois modos (Clássico + Meu Time) ou o modo de cartas substitui o atual?
2. Jogadores fictícios para a base e os times de acesso: ok? (Sem eles, a coleção tem 40 cartas e o começo é impossível de ganhar.)
3. Nomes: raridades Comum/Rara/Épica/Lendária e estrelas, ou raridades com nomes de elo do LoL (Prata/Ouro/Diamante/Desafiante)? O elo é mais "LoL", mas brigaria com a escada de divisões e com a regra do dourado.
4. Perder deve render PN (proposta: sim, 50)?
5. Treino: forma temporária (proposta) ou continuar subindo atributo permanente com teto?
