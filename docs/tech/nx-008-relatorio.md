# NX-008: simulador atualizado para as RN v0.2 e conferência da tabela de tempos

> Autor: `nexus-tech`, 20 a 22/11/2026. Simulador: `tools/sim-economia/` (README com os comandos).
> Mediana de 20 jogadores por perfil, semente 1, salvo indicação. Conferido também com as sementes 2
> a 5. Reproduzir: `node tools/sim-economia/sim.ts` (+ as opções citadas em cada tabela).

## Resumo

- O simulador implementa as RN v0.2 como estão escritas, com os nomes finais do lore. As constantes
  das RN estão num arquivo único, `tools/sim-economia/regras.ts` (preparo da C4). 29 testes unitários
  passam (`node --test tools/sim-economia/motor.test.ts`).
- **Tabela das RN:** 19 das 21 células ficam dentro de 20%. **Duas passam por pouco, ambas no
  típico:** Elite (11,1 h contra ~14 h, −21%) e Continental (5,7 d contra ~4,7 d, +21%). Nenhuma das
  duas vem de uma regra nova da v0.2 (detalhes na seção 2). Proponho números novos para essas linhas.
- **Achado 1, sobre o título mundial:** com o jogador simulado copiado do modelo do PO, **ninguém
  ganha o título mundial em 30 dias**, em nenhum perfil. O bot para de subir o nível dos jogadores
  depois da Continental e joga o Mundial com 5% de chance. Com um bot que continua subindo os níveis
  (`--estrategia titulo`), o 1º título sai em ~5,4 d no contínuo e ~22 d no frequente. O típico não
  chega em 30 d. O epílogo da Temporada 1 (RN-018) depende desse marco.
- **Achado 2, sobre números grandes:** com o bot que busca o título, o ouro passa de 2^53 já no 1º mês
  (2,9e17 no contínuo). Isso fica muito abaixo do gatilho do ADR-002 (1e280), mas antes do horizonte
  de "1 ano" citado lá.
- Sobram **8 pontos das RN v0.2 que ainda permitem duas leituras** (seção 4). Os mais importantes estão
  na RN-012: quando `maior` é atualizado e duas frases sobre o relógio que não batem com a regra.

## 1. O que foi implementado (RN v0.2)

| RN | Mudança | Onde |
|---|---|---|
| RN-001 / RN-013 | Ouro 10 no clube novo e depois da refundação | `regras.ts` `OURO_INICIAL`, `motor.ts` `refundar` |
| RN-003 | Visibilidade pelo ouro acumulado na run (`ouroRun`). "Aulas na lan" é visível desde o início. Um negócio visível não some até a refundação, que esconde de novo os outros | `ganhar`, `negocioVisivel` |
| RN-005 | Toque em janela móvel: um toque conta se houver menos de 5 aceitos em `(t − 1 s, t]`. Toques ignorados não entram na conta | `tocar` |
| Convenções | `podePagar(ouro, custo)`: `ouro ≥ custo × (1 − 10⁻⁹)`. Depois da compra, `ouro = max(0, ouro − custo)`. Vale para negócios, níveis, ×10 e Máx | `podePagar`, `pagar`, `maxLote` |
| RN-006 | Máx com k = 0 e ×10 sem ouro: o botão fica desabilitado e `faltam(ouro, custo)` dá o valor | `faltam` |
| RN-009 | Relógio de partida no save (`proxPartida`), com sobra levada de um segundo ao outro. Pausa opcional (`pausado`) em que a renda continua. Prêmio pago com a renda de antes da subida ou queda | `avancarOnline`, `partida` |
| RN-010 | Título mundial: split no Mundial com 10+ vitórias tem o resultado `campeao` e soma em `titulos`, que fica depois da refundação | `partida` |
| RN-011 | `r` vem do save; partidas possíveis `= 0` se `t_ef < r`, senão `1 + floor((t_ef − r)/90)`. As partidas seguem split após split enquanto o resultado é "manteve" ou "campeão" e param no 1º split com subida ou queda. O relógio volta com `90 − ((t_ef − r) mod 90)`. `mostrarTela` só com `t_off ≥ 60 s` | `aplicarOffline` |
| RN-012 | `t_off = max(0, agora − maior)`, depois `maior = max(maior, agora)`. `salvar` também atualiza `maior` (ver B2) | `aplicarOffline`, `salvar` |
| RN-017 | `formatar(v, 'baixo' \| 'cima')`. Abaixo de 100, 1 casa sem zero final. Custos e "Faltam" arredondados para cima, passando para a faixa seguinte quando estouram (999,2 → "1,00 mil"). `formatarPct` arredonda ao mais próximo | `formato.ts` |
| Nomes | Divisões e negócios com os ids finais do lore (`varzea`… `mundial`, `aulas-na-lan`… `arena-do-clube`). Os textos que o jogador vê continuam fora do motor | `regras.ts` |

**Preparo da C4:** `regras.ts` só tem números e ids, e o motor, a estratégia e os testes leem dali. A
NX-015 move `regras.ts`, `motor.ts`, `rng.ts` e `formato.ts` para `src/engine/`. No caminho, tira
o bloco "Variantes" do motor, que só serve ao simulador para comparar com a v0.1.

**Testes (29, todos passam):** NX-010 (1ª compra com custo exibido "11,5", Máx com k = 0 e "Faltam
0,1", ×10 desabilitado, toque 8 → 5); janela móvel atravessando a virada do segundo; tolerância de
10⁻⁹ (dentro e fora dela, 10 compras ×1 com o ouro exato do lote, Máx); visibilidade (75 de ouro
acumulado, não some depois de gastar, volta a esconder na refundação); NX-011; NX-012 (77%, prêmio de
6.000 e não 12.000 na subida, Várzea sem queda); queda; título mundial; pausa do relógio; NX-013 com 10
h (40 sementes: 1.440.000 + 6.000 por vitória, 320 partidas possíveis, para na 1ª subida ou chega a
320, os dois casos acontecem); queda offline para no 1º split; resto do relógio (QA-9); ausência de 40
s sem tela; relógio atrasado; **ciclo de adiantar/atrasar dá 8 h uma única vez** (e repetir o ciclo 3
vezes não rende mais); a lacuna B4 documentada; NX-014; e os exemplos da tabela da RN-017 nas duas
direções.

## 2. Tabela nova contra a tabela das RN v0.2

Simulador v0.2, bot do modelo do PO, semente 1. Para o Mundial, 30 dias.

| Marco | RN típico | Sim típico | Dif. | RN frequente | Sim frequente | Dif. | RN sem parar | Sim contínuo | Dif. |
|---|---|---|---|---|---|---|---|---|---|
| Acesso | ~21 min | 21 min | 0% | ~21 min | 21 min | 0% | ~21 min | 21 min | 0% |
| Ascensão | ~1,8 h | 1,8 h | 0% | ~1,8 h | 1,8 h | 0% | ~1,8 h | 1,8 h | 0% |
| Elite | ~14 h | **11,1 h** | **−21%** | ~13 h | 12,9 h | −1% | ~5 h | 4,9 h | −2% |
| Continental | ~4,7 d | **5,7 d** (19/20 em 7 d) | **+21%** | ~3,2 d | 3,1 d | −3% | ~15 h | 14,7 h | −2% |
| Mundial | ~19 d | 17,9 d | −6% | ~9 d | 8,9 d | −1% | ~2 d | 2,1 d | +5% |
| Refundações em 1 semana | ~5 | 6 | +20% | ~16 | 16 | 0% | ~60 | 60 | 0% |

**As duas células acima de 20%:**
- **Elite do típico (−21%, para melhor):** o típico só avança no início de cada sessão, de 3 em 3 h
  (risco 3 da NX-007), e 11,1 h é a sessão anterior a 14,2 h. Na NX-007, a semente 2 já dava
  11,1 h. Na v0.2, as sementes 1 a 5 dão todas 11,1 h. O valor novo é estável.
- **Continental do típico (+21%, para pior):** os ~4,7 d da tabela eram a semente 1 com sorte. Com
  as regras da NX-007, as sementes 2 a 5 já davam 5,3 a 5,6 d. Na v0.2, as sementes 1 a 5 dão
  5,4 a 5,7 d, e em 4 delas 1 ou 2 dos 20 jogadores não chegam na 1ª semana.

**Sensibilidade (5 sementes, 7 dias):** Elite do típico 11,1 h em todas; Continental do típico
5,4–5,7 d; Continental do frequente 3,0–3,2 d; refundações 6 (típico) e 16 (frequente) em todas. Em
30 dias, o Mundial dá 17,9 d (típico) e 8,9–9,0 d (frequente) nas sementes 1 e 2.

**Proposta de tabela (o PO decide):**

| Marco | Típico | Frequente | Sem parar |
|---|---|---|---|
| Acesso | ~21 min | ~21 min | ~21 min |
| Ascensão (libera a refundação) | ~1,8 h | ~1,8 h | ~1,8 h |
| Elite | **~11 h** | ~13 h | ~5 h |
| Continental | **~5,5 dias** (1 ou 2 em 20 passam da 1ª semana) | ~3,1 dias | ~15 h |
| Mundial | depois da 1ª semana (**~18 d**) | depois da 1ª semana (~9 d) | ~2 dias |
| 1º título mundial (epílogo T01)* | **mais de 30 d** | **~22 d** | **~5,4 d** |
| Refundações em 1 semana | **~6** | ~16 | ~60 |

\* Só com o bot `titulo`. Com o bot do modelo do PO, ninguém chega (seção 3).

## 3. O que mudou em relação à NX-007 e por quê

**Medição por partes (7 dias, semente 1):**

| Configuração | Elite típ. | Continental típ. | Elite cont. | Continental cont. | Refund. típ./freq. |
|---|---|---|---|---|---|
| NX-007 com a R3 (`--relogio v01 --bot-ve-tudo`) | 14,2 h | 4,7 d | 5,3 h | 15,1 h | 5 / 16 |
| + relógio de partida guardado (`--bot-ve-tudo`) | 14,2 h | 4,7 d | 5,3 h | 15,1 h | 5 / 16 |
| + bot só compra o que vê (RN-003): **v0.2** | 11,1 h | 5,7 d | 4,9 h | 14,7 h | 6 / 16 |

- **A refatoração é fiel:** com as duas opções de comparação ligadas, a saída é idêntica à da NX-007,
  número por número.
- **Relógio de partida guardado (RN-009/011): efeito zero nos perfis.** Todas as ausências dos perfis
  são múltiplas de 90 s (3 h, 57 min, 8 h). Nesse caso, `1 + floor((t_ef − r)/90)` dá o mesmo número
  de partidas que `floor(t_ef/90)`, e as sessões de 3 min sempre têm 2 partidas. Com as ausências
  desalinhadas em 45 s (`--desvio-off 45`, sementes 1 a 3), a diferença ficou em até 0,1 d na
  Continental e 25 de Legado em 1 semana. É uma correção de justiça, não de ritmo.
- **Visibilidade (RN-003): a única mudança que mexe nos números.** O bot da NX-007 podia "esperar"
  por um negócio que o jogador ainda não vê. Agora ele compra só entre os visíveis, o que antecipa
  alguns segundos de renda no começo. Isso muda em qual sessão de 3 h cada marco cai. Também é o que
  um jogador de verdade faria.
- **Sem efeito no simulador, mas testadas:** ouro 10 depois da refundação (o simulador da NX-007 já
  fazia assim, conforme a A1), prêmio com a renda de antes (o código já fazia assim, agora o teste
  garante), tolerância de 10⁻⁹, janela móvel (o bot toca 5 por segundo em ritmo constante), offline
  abaixo de 60 s (nenhum perfil sai por menos de 57 min) e `maior` (o relógio do bot não volta).
- **Achado 1, sobre o título mundial:** o bot copiado do modelo do PO só persegue a chance-alvo até a
  Continental e não sobe nível no Mundial. Em 30 dias, o contínuo faz 229 runs que chegam ao Mundial
  e nenhuma ganha o título. Com `--estrategia titulo` (mesmo bot, só que também sobe níveis no
  Mundial):

| 30 dias, semente 1 (semente 2) | contínuo | típico | frequente |
|---|---|---|---|
| Mundial | 2,1 d (2,2 d) | 17,9 d | 8,9 d (9,0 d) |
| 1º título mundial | **5,4 d** (5,3 d) | não chegou (0/20) | **21,5 d**, 19/20 (22,5 d, 15/20) |
| Refundações em 30 d | 46 | 25 | 47 |
| Maior ouro | 2,9e17 | 4,8e13 | 5,3e16 |

  Depois do 1º título, esse bot fica no Mundial e não refunda mais (o critério do modelo só refunda
  fora do Mundial). Por isso o contínuo junta 1.413 títulos. O número de refundações depois do título
  depende do critério do bot, não das regras.
- **Achado 2, sobre números grandes:** o ouro passa de 2^53 (9,0e15) em 30 dias com o bot `titulo`
  (contínuo 2,9e17, frequente 5,3e16), porque o bot para de refundar e acumula. O float64 segue
  sobrando (gatilho do ADR-002: 1e280). Corrijo o contexto do ADR-002: 2^53 pode ser passado no
  1º mês, não só em 1 ano. A RN-017 já cobre (1,00e15 em diante).

## 4. RN v0.2 que ainda permitem duas implementações

Não alterei as RN. Abaixo, o que o simulador faz e o texto que proponho.

| # | RN | Dúvida | O que o simulador faz | Texto proposto |
|---|---|---|---|---|
| B1 | RN-005 | "Qualquer janela móvel de 1 s": um toque exatamente 1 s depois de outro está na mesma janela? E os toques ignorados contam para a janela? | Janela `(t − 1 s, t]`: o toque de exatamente 1 s antes já saiu. Ignorados não contam. | "Um toque conta se, no 1 s anterior a ele (sem contar o instante de exatamente 1 s antes), houver menos de 5 toques que contaram. Toques ignorados não contam para esse limite." |
| B2 | RN-012 / RN-015 | Quando `maior` é atualizado? Se for só "ao voltar", o tempo jogado com o app aberto conta de novo como offline na próxima volta (renda paga 2 vezes). | Atualizado a cada save (`maior = max(maior, agora)`) e ao voltar. | "O jogo atualiza `maior` em todo save (RN-015) e ao voltar." |
| B3 | RN-012 | "Atrasar o relógio nunca tira nada" não vale para o ganho offline: com o relógio do aparelho 5 h atrás de `maior`, uma ausência real de 8 h rende só 3 h. | Como a fórmula manda (rende 3 h). O ouro já ganho nunca diminui. | "Atrasar o relógio nunca tira ouro já ganho. Enquanto o relógio do aparelho estiver atrás de `maior`, o tempo fora só conta a partir de `maior`." |
| B4 | RN-012 | "Adiantar dá no máximo 8 h uma única vez" não vale para quem adianta em degraus cada vez maiores (+8 h, +16 h, +24 h…): cada degrau rende até 8 h. Não é ciclo de adiantar e atrasar, mas a frase "nenhum ciclo… dá vantagem além de 8 h" sugere que é impossível. | Como a fórmula manda. O teste documenta: 3 degraus rendem 24 h, e depois o tempo real até alcançar `maior` não rende nada. É ganho antecipado, não ganho grátis. | Aceitar (jogo pessoal, sem horário de servidor no ADR-002) e trocar a frase por: "Cada horário de parede rende offline uma vez só. Adiantar o relógio antecipa ganho, que deixa de vir depois, até o tempo real passar de `maior`." |
| B5 | RN-011 | O relógio volta com `(t_ef − r) mod 90` "contado a partir de 90". Quando `t_ef < r` (nenhuma partida), a conta dá negativo. | Faltam `r − t_ef`. | "Se `t_ef < r`, o relógio volta com `r − t_ef`. Senão, com `90 − ((t_ef − r) mod 90)`." |
| B6 | RN-013 | "Zera… o relógio de partida": volta a 90 s (cheio) ou a 0 (partida na hora)? | Volta a 90 s. | "O relógio de partida volta a 90 s." |
| B7 | RN-003 | "Ouro acumulado na run (tudo o que entrou)": os 10 de ouro iniciais contam? Muda se o Patrocínio local aparece com 65 ou com 75 de ouro ganho. | Não contam: só renda, toques, prêmios e offline. | "…tudo o que o clube ganhou na run (renda, toques, prêmios e offline), sem contar o ouro inicial e sem descontar gastos." |
| B8 | RN-006 | O Máx diz "custo de k ≤ ouro", sem citar as Convenções. Aplica a tolerância? | Aplica (a mesma comparação de ×1 e ×10). | "Máx compra o maior k com `ouro ≥ custo de k` (Convenções)." |

**Interpretação sem ambiguidade real, só para registro:**
- RN-017: quando o arredondamento para cima estoura a faixa, o número passa para a faixa seguinte
  (custo 999,2 → "1,00 mil", 999.001 → "1,00 mi"). É a leitura de "uma faixa nunca mostra 1.000 mil"
  aplicada para cima.
- RN-017: na porcentagem, um empate exato em ,5 arredonda para cima. Na prática não acontece com
  float.

## 5. Limites desta medição

- As telas que pausam o relógio (boas-vindas, capítulos, offline, confirmação) duram 0 s no
  simulador. Na vida real, cada volta de mais de 60 s gasta alguns segundos na tela offline, com a
  renda correndo e as partidas paradas. O efeito é pequeno nas sessões de 3 min.
- Os tempos do meio do jogo em diante dependem da estratégia do bot. O título mundial depende
  totalmente dela (achado 1). Se o UX passar a sugerir ao jogador quando subir nível ou refundar, o
  bot deve acompanhar.
- Os perfis só têm ausências múltiplas de 90 s. O efeito do relógio guardado foi medido à parte
  (`--desvio-off`).
- Todos os arquivos de `tools/sim-economia/`, inclusive `sim.ts` e os testes, passam no
  `tsc --strict` como ESM, com um `@types/node` 22 instalado fora do repositório (ainda não há
  `package.json`). A NX-015 transforma isso num passo do `npm test`.
