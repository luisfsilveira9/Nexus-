# Plano de ação: modo roguelike com cartas (etapas 2 a 6)

Registro do que foi combinado com o dono em 11/11/2026 e o passo a passo da próxima fase. A base está nas duas pesquisas: [pesquisa-progressao](pesquisa-progressao/relatorio.md) (cartas, save, economia) e [pesquisa-ligas](pesquisa-ligas/relatorio.md) (escala mundial, elos, runs). Quando as duas divergirem, vale a segunda e, acima das duas, este plano.

## 1. O que está decidido

### Visão

- O jogador começa com **o time mais fraco do CBLOL**, montado com cartas de jogadores reais em elo baixo, e tem poucas chances de ganhar na primeira tentativa.
- Cada tentativa é uma **run** (uma temporada 2026). Entre runs ficam as cartas, os elos e as regiões liberadas. Com run após run, o time melhora, vence o CBLOL, vai aos internacionais (onde chega entre os piores) e, no fim, ao Mundial.
- Os melhores jogadores (Gen.G, BLG e afins) são o objetivo final da coleção.

### Decisões do dono

| Tema | Decisão |
|---|---|
| Quem é o melhor jogador | Quem tem o **maior OVR calculado** a partir dos dados (Elo do time + desempenho individual). Nada de traço de "Lenda" ou reputação; o "Faker" das conversas era só exemplo. |
| Jogadores | Reais, de todas as ligas grandes, com os dados de 2026 (Splits 1 e 2) do op.gg. Sem jogadores fictícios. |
| Elos das cartas | Os 10 elos do LoL: Ferro, Bronze, Prata, Ouro, Platina, Esmeralda, Diamante, Mestre, Grão-Mestre, Desafiante. |
| Ritmo | Sair do CBLOL para os internacionais em **3 a 5 runs**. |
| Ordem | Seguir as etapas na ordem abaixo (seção 9 da pesquisa de ligas). |
| Merge | Claude abre o PR e faz o merge sozinho ao fim de cada etapa, depois das checagens (ver `CLAUDE.md`). |
| Nada à venda | Pacotes, cartas e pontos nunca custam dinheiro de verdade (ECA Digital e política de fãs da Riot). |

### Padrões adotados (o dono mandou seguir o plano; podem ser revistos)

- **Dois modos:** "Clássico" (o jogo de hoje, sem save) e o modo novo de cartas, com save.
- **Run com 3 etapas nacionais**, no calendário real: Copa → First Stand, Etapa 1 → MSI, Etapa 2 (1º e 2º) → Mundial. Se a run ficar longa demais, a primeira alavanca é encurtar (MD1 na fase regular já está previsto).
- **Seu time substitui um time real** do CBLOL escolhido ao fundar o clube (herda vaga, nome e cores; não os jogadores). O campeonato continua com 8 times.
- **Perder rende pontos** (menos que vencer).
- **Treino no modo de cartas não sobe atributo permanente**: quem faz a carta subir é o PdL.

### Números combinados

| Item | Valor |
|---|---|
| Conversão | 1 OVR ≈ 22 Elo (medido no motor) |
| Escala | CBLOL de ~52 a ~75; melhores do mundo de 93 a 96 (Chovy 96, Kiin 95, Canyon/Ruler/Duro 94) |
| CBLOL no jogo hoje (etapa 1, já feita) | LOS 71 · FURIA 68 · RED 65 · Fluxo 63 · LOUD 62 · VKS 61 · paiN 58 · Leviatán 55 (ajustados até o motor reproduzir o Elo real; a ordem por OVR difere da força porque pool e maestria pesam) |
| Elo por time | Fonte: LoL Pro Elo (nov/2026). Gen.G 2157 … LOS 1706 … Leviatán 1266 (lista em `pesquisa-ligas/ovr-mundial.mjs`) |
| Elo da carta | Desafiante = OVR real; cada elo abaixo tira **1,2** (Ferro = real − 10,8) |
| PdL | 100 por elo; vitória +15, derrota +6 (só quem jogou); carta repetida +50; a partir do Mestre, ganhos pela metade |
| Pacote | Toda carta sai em **Ferro**; chance de cada jogador ∝ `0,9^(OVR − 50)`; chances sempre visíveis |
| Pontos | Ponto de partida: vitória 120, derrota 50, pacote de 3 cartas 500 (o modelo indica baratear para ~250 e dobrar o PdL para cumprir as 3–5 runs) |
| Time inicial | 5 cartas Ferro do CBLOL, uma por rota, da metade de baixo (OVR do time ~47–50, abaixo da Leviatán) |
| Liberação | Começo: CBLOL (60 jogadores). Chegar ao First Stand ou ao MSI: LCS, LEC, LCP (+164). Chegar ao Mundial: LCK, LPL (+139). Vencer o Mundial: edições especiais. |

## 2. Dados de referência já coletados

- `docs/pesquisa-ligas/jogadores-2026.json`: 363 jogadores com 10+ jogos (LCK 57, LPL 82, LEC 68, LCS 45, LCP 51, CBLOL 60), com estatísticas e OVR proposto.
- Séries do op.gg em 2026 (para `championStatisticsBySerie`): LCK 703, 716 · LPL 704, 717, 736 · LEC 706, 712, 731 · LCS 702, 713, 730 · LCP 707, 714, 735 · CBLOL 705, 715, 734 · First Stand 709 · MSI 729 · Mundial 741.
- Times dos internacionais de 2026 (20 de fora do Brasil):
  - First Stand: GEN, BFX, BLG, JDG, G2, LYON, TSW (+ LOUD).
  - MSI: HLE, T1, BLG, TES, G2, KC, LYON, TL, TSW, DCG (+ FURIA).
  - Mundial: GEN, HLE, T1, DK, AL, BLG, TES, IG, TL, LYON, C9, G2, MKOI, KC, TSW, CFO, MVK (+ LOS, FURIA).

## 3. Passo a passo

Cada etapa vira um PR, com um commit por bloco. Cada uma termina com `tsc -b`, `pnpm lint` (20 avisos antigos, nenhum novo), o build do deploy e, se mexer no motor ou nos dados, calibração com 500+ partidas em 14/14. Depois o merge automático.

### Etapa 2: dados do mundo (feita em 11/11/2026)

Resultado: 363 jogadores com pool real (156 campeões, todos com par no jogo), atributos pelo perfil estatístico também no CBLOL, 20 times de fora ajustados ao Elo e "Amistoso internacional" na Liga. Calibração 14/14 com 1000 partidas; erro contra o Elo de 4,4 pontos no CBLOL, 3,8 nos pares mistos e 4,3 entre os times de fora; carregamento inicial de 138 kB gzip (os dados do mundo, 35 kB, só baixam ao abrir o amistoso). Como refazer: seção "Dados do mundo" do `CLAUDE.md`.

Ressalvas que a etapa 3 herda:

- **OVR do time ≠ OVR da carta.** Para reproduzir o Elo, os times de topo precisaram de deslocamento negativo (Gen.G −8, BLG −7): a Gen.G joga com 87 e não 95. Um time de cartas no OVR real ficaria mais forte que o time real. Opções: comprimir a escala das cartas na hora de montar o time, ou recalibrar a conversão (hoje 22 Elo por OVR) para diferenças grandes.
- **Sem idade:** o op.gg não tem o nascimento de 237 jogadores. Shotcalling e os ocultos sem estatística ficaram neutros nos jogadores de fora.
- CBLOL depois do novo ajuste: LOS 72 · FURIA 67 · LOUD 64 · RED 62 · VKS 62 · paiN 60 · Fluxo 59 · Leviatán 55.

O que estava planejado:

Objetivo: os jogadores e os times internacionais existem no jogo com o mesmo tratamento que o CBLOL já tem.

1. **Pools reais:** coletar `championStatisticsBySerie` dos ~363 jogadores nas séries de 2026 da liga deles. Reaproveitar o mapeamento de campeões do op.gg para os ids do Nexus usado em `proStats.ts`; campeão sem par entra numa lista para revisão.
2. **Atributos pelo perfil estatístico:** distribuir o OVR de cada jogador entre os atributos, comparando-o com a mesma rota:
   - mecânica ← KDA e participação no dano;
   - farm e rotas ← CS e ouro por minuto;
   - luta ← abates + assistências;
   - mapa ← visão (e first blood no caçador);
   - mental ← poucas mortes.

   A média fica igual ao OVR, com espalhamento de ±6. Os táticos saem das estatísticas e do estilo dos campeões; as aptidões de estilo (`apt`), das tags dos campeões do pool ponderadas por jogos. Os ocultos (`hid`): agressividade ← abates + mortes por jogo; o resto, neutro.
3. **Aplicar o mesmo método ao CBLOL:** hoje os perfis do CBLOL são estimados. Trocar pelo perfil estatístico, mantendo o nível ajustado da etapa 1.
4. **Arquivo do mundo:** `src/game/mundo.ts` (ou JSON) com os 363 jogadores e os 20 times internacionais. Carregar com `import()` dinâmico só quando for preciso, para o download inicial não passar muito dos ~136 kB gzip.
5. **Nível dos times internacionais:** rodar o `ajustar-elo.ts` estendido aos times de fora (pares mistos, inclusive com o CBLOL) até o erro médio contra o Elo ficar no nível do ruído (~4 pontos). Guardar o deslocamento por time.
6. **Teste no celular:** no modo Clássico, um "Amistoso internacional" na Liga para escolher qualquer um dos 20 times como adversário. Serve para o dono sentir a diferença de nível antes das cartas existirem.
7. **Verificação:** calibração 14/14 (pares do CBLOL); `validar-elo` com pares mistos; build abaixo de ~140 kB gzip no carregamento inicial.

### Etapa 3: save, cartas, elos e pacotes (feita em 11/11/2026)

Resultado: tela inicial com Modo Cartas e Clássico; fundar o clube no lugar de um time do CBLOL; pacote inicial de 5 cartas Ferro; save versionado com exportar/importar; PdL e promoção; Loja com três pacotes e chances visíveis; Clube e grade de cartas. Verificado: time de cartas em Desafiante idêntico ao elenco original com a mesma semente; fluxo completo em 360×640 e 360×700; calibração 14/14.

Decisões do dono nesta etapa:

- **A carta mostra o OVR do jogo, não o da pesquisa.** O topo fica comprimido (Chovy 88 em Desafiante, 77 em Ferro); a ordem dos jogadores não muda. Substitui a faixa "93 a 96" dos números combinados.
- **Reservas ficam para a etapa 4**, quando a run der uso a elas.

Fica para a etapa 4: sem a run, as partidas são amistosos sem limite, e pontos, preços e PdL ainda estão nos valores de partida.

O que estava planejado:

Objetivo: o modo novo existe e o jogador tem uma coleção que sobrevive a recarregar a página.

1. **Save versionado:** `localStorage` com `{ v, criadoEm, ... }`, gravado após cada partida e ação, com `try/catch`. Uma função de migração por versão, `navigator.storage.persist()` ao criar o time, **exportar/importar** (código copiável e arquivo) e "Último salvamento: há X min".
2. **Tipos:** `CardDef` (jogador, liga, OVR real) e `Owned` (uid, jogador, elo 0–9, PdL, energia, estresse, moral, temporada).
3. **`buildMeuTime()`:** monta um `Team` a partir das cartas, com OVR = real − (9 − elo) × 1,2 aplicado a todos os atributos. O motor e o draft não mudam.
4. **Tela inicial com os dois modos**, e no modo novo:
   - fundar o time (escolher o time real que vai substituir, nome, sigla e cores);
   - pacote inicial (5 Ferro do CBLOL, um por rota, da metade de baixo);
   - escalação (5 titulares + até 3 reservas).
5. **PdL e promoção:** ganhos por partida e por repetida, promoção a cada 100, aviso de promoção ("Tutsz subiu para Prata").
6. **Loja:** pacote básico, de rota e de região; chances visíveis; revelação carta a carta com "Revelar tudo"; animação desligada com `prefers-reduced-motion`.
7. **Clube:** grade de cartas (3 por linha), filtros por rota, liga e elo, nome do elo sempre escrito. A cor usa a escala `--q-1` a `--q-5` em pares de elos, com ícones próprios (não os emblemas da Riot).
8. **Verificação:** com semente fixa, o `Team` montado pelas cartas com os jogadores originais em Desafiante dá o mesmo resultado que o time original. Teste de layout em 360×640 e 360×700.

### Etapa 4: a run

Objetivo: jogar uma temporada inteira com começo, meio e fim, e cumprir a meta de 3 a 5 runs.

1. **Calendário:** Copa, Etapa 1 e Etapa 2. Cada uma é todos contra todos em MD1 (7 jogos) mais mata-mata dos 4 primeiros em MD5. A tabela reaproveita `standings`, e os jogos entre a IA usam o motor rápido (resultado só), sem transmissão.
2. **Escolhas de 1 entre 3** na pré-temporada e entre as etapas: bootcamp, analista, psicólogo e afins, cada uma com efeito pequeno e explicado.
3. **Entrosamento da run:** começa baixo, sobe a cada partida com os mesmos cinco e dá bônus de partida para cartas da mesma organização real. É o primeiro uso de `chemistry` no motor, então pede calibração.
4. **Domínio da tática:** cada partida com a mesma tática aumenta um pouco o bônus dela na run.
5. **Fim da run:** prêmio por campanha, resumo da temporada e recordes. Entre runs ficam as cartas, os elos, o PdL, as regiões liberadas e os pontos; recomeçam a tabela, a condição, o entrosamento e o domínio da tática.
6. **Afinar o ritmo:** com o `runs.cjs` atualizado com as regras reais, ajustar pontos, preço de pacote e PdL até o primeiro título do CBLOL cair na **3ª a 5ª run**. Depois o dono confirma jogando.
7. **Verificação:** calibração 14/14 com entrosamento e domínio ligados; modelo de runs dentro da meta.

### Etapa 5: internacionais

Objetivo: vencer o CBLOL leva a um torneio real de 2026, com os times reais.

1. **First Stand:** 8 times, 2 grupos em dupla eliminação, semifinais e final, tudo MD5 com Fearless.
2. **MSI:** play-in de 4 times e chave principal de 8 em dupla eliminação, MD5. O campeão brasileiro entra direto na chave.
3. **Mundial:** play-in (4), Suíço (16 times, 3 vitórias classificam, MD1 nas duas primeiras rodadas, MD3 depois) e mata-mata de 8 em MD5. O 1º do Brasil entra no Suíço; o 2º, no play-in.
4. **Liberação de regiões** ao chegar a cada torneio (seção 1), com aviso na tela.
5. **Tela do torneio:** chave ou tabela do Suíço legível em 360 px.
6. **Verificação:** simular cada formato com a IA e conferir que as campanhas seguem o Elo (ex.: a Gen.G vence a maior parte dos Mundiais simulados).

### Etapa 6: Ascensão e edições especiais

1. **Ascensão** depois do primeiro título mundial: níveis opcionais (rivais +2 de OVR, MD1 nos internacionais, cansaço mais rápido) com recompensa maior.
2. **Edições especiais:** "Campeão Mundial 2026", "MVP do First Stand" (Bin), "Campeão do MSI" (Hanwha Life). Saem só depois de vencer o Mundial; cada uma tem +2 a +3 sobre a carta normal e uma regra própria.
3. **Recordes e conquistas** da conta.

## 4. Riscos e cuidados

- **Tamanho do download:** 363 jogadores com pools podem somar dezenas de kB. Usar `import()` dinâmico por região.
- **Calibração:** entrosamento, domínio de tática e os times de fora mexem no motor. Rodar 500+ partidas e o `validar-elo` a cada mudança.
- **Save perdido:** o navegador interno do celular pode apagar o armazenamento. Exportar/importar é obrigatório desde o primeiro dia do modo novo.
- **Mundial 2026 ainda em andamento** (final em 14/11): as edições especiais da etapa 6 esperam o resultado.
- **Política da Riot:** manter o jogo gratuito, sem loja de apps e com o aviso de que a Riot não endossa o projeto.
