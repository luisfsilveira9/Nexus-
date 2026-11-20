# NX-007 — Relatório do simulador oficial da economia (RN v0.1)

> Autor: `nexus-tech`, 20/11/2026. Simulador: `tools/sim-economia/` (README com o comando).
> Tudo abaixo usa a mediana de 20 jogadores simulados por perfil, semente 1, salvo indicação.
> Reproduzir: `node tools/sim-economia/sim.ts` (+ as opções citadas em cada tabela).

## Resumo

- O simulador implementa as RN-002 a RN-014 como estão escritas e **reproduz a tabela das RN com
  menos de 20% de diferença em todos os marcos** (a maior diferença é +8%). Os números da v0.1 se
  confirmam, com uma ressalva: o perfil típico chega à Internacional por pouco antes do 7º dia (com
  outra semente, só 14 de 20 chegam).
- **Risco 1 (60 prestígios/semana):** a causa medida é outra. Só 1 dos 60 prestígios é de Academy;
  40 são runs que chegam ao Mundial. Depois do 2º dia, o jogador contínuo repete runs de ~2,8 h, um
  piso dado pelo relógio das temporadas. As três regras testadas contra "repetir a Academy" pioram o
  jogo ou não mudam nada. Proposta: manter a RN-013.
- **Risco 2 (números grandes):** confirmado que a renda passa de 1 bi/s na 1ª semana. O maior valor
  medido é 4,7e16 em 1 ano de jogo contínuo: o float64 aguenta com folga. Proposta: deixar a RN-017
  mais precisa (texto abaixo).
- **Risco 3 (degraus de 3 h):** confirmado. Do meio do jogo em diante, a progressão depende de
  quantas sessões o jogador faz, não de quanto tempo passa: o perfil frequente chega à Internacional
  na metade do tempo do típico. Proposta: as partidas offline seguem para a próxima temporada
  enquanto o resultado for "manteve". Isso traz o típico de 6,2 para 4,7 dias, sem mexer no
  frequente.
- Achei **7 pontos ambíguos nas RN** (seção final). Os mais importantes são o ouro inicial após o
  prestígio, os prêmios offline contra o Gherkin da NX-013 e uma brecha no relógio da RN-012.

## Como o simulador foi feito

- `motor.ts` tem as RN em funções puras, sem relógio nem `Math.random`. O sorteio usa estado salvo
  (RN-009). O ganho offline usa a fórmula fechada da RN-011. Esse motor é o que vai para
  `src/engine/` (ADR-002).
- `estrategia.ts` é o "jogador": uma **cópia fiel da estratégia do modelo do PO** (prioridade de
  compra, toques só nos 10 primeiros minutos, refundar após 3 temporadas sem divisão nova). Assim a
  comparação mede as regras, não o jeito de jogar. **Atenção:** vários números da tabela das RN
  dependem dessa estratégia, sobretudo os de prestígio (veja os riscos 1 e 3).
- 18 testes unitários (`node --test tools/sim-economia/motor.test.ts`) cobrem os cenários Gherkin da
  NX-010 à NX-014 e a RN-017. Todos passam.
- Diferenças de método em relação ao modelo do PO, nenhuma delas de regra:
  - outro gerador de sorteio (os jogadores sorteados não são os mesmos; as medianas batem);
  - foto do estado no instante exato. No modelo, a foto "2 h" do típico foi tirada às 5 h, depois
    do primeiro período offline;
  - na mediana, quem não chegou conta como "infinito". O modelo fazia a mediana só de quem chegou,
    o que favorece o resultado;
  - o bot avalia o prestígio a cada 5 s, não a cada 1 s.

## 1. Tempos até cada marco (RN v0.1, 7 dias)

| Marco | contínuo | típico | frequente |
|---|---|---|---|
| Desafiante | 21 min | 21 min | 21 min |
| Academy (libera prestígio) | 1,8 h | 1,8 h | 1,8 h |
| Liga | 5,3 h | 14,2 h | 12,9 h |
| Internacional | 15,1 h | 6,2 d | 3,1 d |
| Mundial | 2,1 d | não chegou em 7 d (18,8 d em 30 d) | não chegou em 7 d (8,8 d em 30 d) |
| 1º prestígio | 2,8 h | 20,3 h | 5,0 h |
| 2º prestígio | 6,3 h | 2,3 d | 15,9 h |
| 3º prestígio | 8,8 h | 3,4 d | 32,0 h |
| 5º prestígio | 12,9 h | 5,7 d | 2,3 d |
| 10º prestígio | 25,9 h | não chegou (12,0 d em 30 d) | 4,4 d |
| **Prestígios em 1 semana** | **60** | **5** | **15** |
| … por melhor divisão da run (Academy/Liga/Inter/Mundial) | 1/4/15/40 | 0/4/1/0 | 1/5/9/0 |
| Legado em 1 semana | 3.985 | 130 | 540 |

Com a semente 2, os números são os mesmos com diferença de até 0,3 d. A exceção é a Internacional
do típico: 6,5 d, e só 14 de 20 jogadores chegam.

### Estado em 2 h, 1 dia e 1 semana (jogador mediano em renda)

| Perfil | Momento | Divisão atual | Melhor já alcançada | Renda/s | Ouro | Poder | Legado | Prestígios |
|---|---|---|---|---|---|---|---|---|
| contínuo | 2 h | Academy | Academy | 6,72 mil | 432 mil | 471 | 0 | 0 |
| contínuo | 1 dia | Academy | Internacional | 1,20 bi | 195 bi | 24,4 mil | 290 | 9 |
| contínuo | 1 semana | Internacional | Mundial | 178 bi | 1,78 tri | 207 mil | 3.985 | 60 |
| típico | 2 h | Academy | Academy | 6,72 mil | 432 mil | 471 | 0 | 0 |
| típico | 1 dia | Desafiante | Academy | 5,04 mil | 135 mil | 410 | 10 | 1 |
| típico | 1 semana | Liga | Internacional | 1,10 bi | 65,2 bi | 24,6 mil | 130 | 5 |
| frequente | 2 h | Academy | Academy | 6,72 mil | 432 mil | 471 | 0 | 0 |
| frequente | 1 dia | Desafiante | Liga | 808 | 5,12 mil | 272 | 35 | 2 |
| frequente | 1 semana | Liga | Internacional | 5,18 bi | 502 bi | 125 mil | 540 | 15 |

Nas primeiras 2 h os três perfis jogam igual (2 h seguidas). Em "1 dia", o frequente aparece na
Desafiante com renda baixa porque acabou de refundar.

## 2. Comparação com a tabela das RN

| Marco | RN típico | Sim típico | Dif. | RN contínuo | Sim contínuo | Dif. |
|---|---|---|---|---|---|---|
| Desafiante | ~20 min | 21 min | +5% | ~20 min | 21 min | +5% |
| Academy | ~1,8 h | 1,8 h | 0% | ~1,8 h | 1,8 h | 0% |
| 1º prestígio | ~20 h | 20,3 h | +2% | ~3 h | 2,8 h | −7% |
| Liga | ~14 h | 14,2 h | +1% | ~5 h | 5,3 h | +6% (+8% contra os 4,9 h do modelo) |
| Internacional | ~6 d | 6,2 d | +3% | ~15 h | 15,1 h | +1% |
| Mundial | depois da 1ª semana | 18,8 d | confere | ~2 d | 2,1 d | +5% |
| Prestígios em 1 semana | ~5 | 5 | 0% | ~60 | 60 | 0% |

**Nada passou de 20%.** Pontos de atenção:
- A Internacional do típico (~6 d) fica no limite da semana. Se uma regra mudar e atrasar o típico em
  um dia, ele deixa de ver a Internacional na 1ª semana.
- Sugiro que a tabela das RN ganhe a coluna **frequente**. Ela mostra que, do meio do jogo em
  diante, os tempos dependem do número de sessões (risco 3).

## 3. Riscos abertos

### Risco 1 — "~60 prestígios por semana porque repetir a Academy compensa"

**O que o simulador mostra:**
- A causa não é a Academy. Dos 60 prestígios do contínuo, a melhor divisão da run foi 1 vez a
  Academy, 4 a Liga, 15 a Internacional e **40 o Mundial**. Em 1 ano de jogo contínuo, foram 3.011
  prestígios, 2.980 deles no Mundial.
- Depois do Mundial (2,1 d), o contínuo entra num ciclo: chega ao Mundial, cai, fica 3 temporadas
  sem subir e refunda. A run tem um piso de ~2,8 h, formado por 5 subidas mais 3 temporadas paradas
  de 21 min cada. Ou seja, **o número de prestígios é limitado pelo relógio das temporadas e pelo
  critério do jogador, não pela economia**. É o fim do conteúdo para quem joga 24 h por dia.
- Teste direto da hipótese, com um bot que refunda assim que chega à Academy (`--estrategia farm`):

| Perfil | Legado em 1 semana: jogando normal | Legado em 1 semana: repetindo a Academy | Divisão máxima repetindo |
|---|---|---|---|
| contínuo | 3.985 | 2.360 | Academy |
| típico | 130 | 170 | Academy |
| frequente | 540 | 510 | Academy |

  Repetir a Academy **não compensa** no contínuo nem no frequente. No típico, rende 30% mais Legado,
  mas o jogador nunca vê a Liga. Não é uma estratégia dominante.

**Regras testadas (7 dias):**

| Regra | contínuo: prestígios / Legado / Internacional / Mundial | típico: prestígios / Legado / Internacional | frequente: prestígios / Legado / Internacional |
|---|---|---|---|
| RN v0.1 | 60 / 3.985 / 15,1 h / 2,1 d | 5 / 130 / 6,2 d | 15 / 540 / 3,1 d |
| **Inédita:** paga só a diferença para a melhor divisão já paga | 3 / 45 / 25,2 h / **nunca** (nem em 30 d) | 2 / 45 / 4,6 d | 3 / 45 / 3,2 d |
| **Decrescente:** tabela ÷ (1 + vezes que já refundou naquela divisão) | 70 / 278 / 2,4 d / não chegou | 5 / 56 / **não chegou** | 14 / 85 / **não chegou** |
| **Recorde:** tabela cheia só se a run igualar o recorde do jogador; abaixo, 0 | 59 / 3.985 / 15,1 h / 2,1 d | 5 / 130 / 6,2 d | 15 / 540 / 3,1 d |

- *Inédita* corta os prestígios, mas o Legado trava em 45 antes do Mundial, e o poder de 1,5 mi
  fica fora de alcance: **o Mundial vira inalcançável.** Rejeitar.
- *Decrescente* aumenta os prestígios (Legado menor deixa o jogador travado mais cedo) e tira a
  Internacional da 1ª semana de quem joga em sessões. Rejeitar.
- *Recorde* não muda nada, porque nenhum bot refunda abaixo do próprio recorde.

**Proposta R1:** manter a RN-013 como está no MVP. O "risco" é o fim de conteúdo para quem joga sem
parar, e isso pede conteúdo depois do Mundial (Alfa), não um corte no Legado. Se o PO quiser uma
trava barata contra repetir divisões baixas, a variante *recorde* tem custo medido zero, mas também
não muda os números atuais. Para reduzir os prestígios do contínuo de verdade, a alavanca é a
duração mínima da run (temporada mais longa ou mais divisões), não a tabela de Legado.

### Risco 2 — renda acima de 1 bi/s na 1ª semana: notação e precisão

**Medido:**

| Horizonte | Perfil | Maior ouro | Maior renda/s |
|---|---|---|---|
| 1 semana | contínuo | 268 tri (2,7e14) | 404 bi |
| 1 semana | típico | 669 bi | 2,11 bi |
| 1 semana | frequente | 2,55 tri | 10,3 bi |
| 30 dias | contínuo | 1,64e15 | 2,16 tri |
| 30 dias | típico | 225 tri | 123 bi |
| 30 dias | frequente | 540 tri | 441 bi |
| 1 ano (5 jogadores) | contínuo | 4,72e16 | 63,7 tri |

- A renda passa de 1 bi/s na 1ª semana nos três perfis: confirmado.
- O ouro passa de 999 tri (notação científica da RN-017) só depois de ~1 mês de jogo contínuo, e
  passa de 2^53 (9,0e15) só no horizonte de 1 ano. O float64 vai até 1,8e308: **sobram ~290 ordens
  de grandeza.** Acima de 2^53 os inteiros deixam de ser exatos, mas o erro relativo (1e-16) é
  invisível com 3 algarismos e não muda o resultado de nenhuma compra.
- O formatador da RN-017 foi testado de 0 a 1,79e308, incluindo as viradas de faixa (999.999 → "999 mil", nunca
  "1.000 mil"; 999,9999 tri → "999 tri"; 1e15 → "1,00e15").

**Proposta R2:** (a) no motor, usar `number` (float64), com o gatilho do ADR-002 para trocar por
`break_infinity.js`; (b) deixar a RN-017 sem duas leituras. Texto sugerido:

> **RN-017 — Números na tela.** Sempre truncado para baixo. Abaixo de 1.000: inteiro (ex.: 999).
> De 1.000 até abaixo de 1e15: 3 algarismos significativos **com zeros à direita**, vírgula decimal
> e espaço antes da unidade: 1,00 mil · 12,5 mil · 999 mil · 1,23 mi · 45,6 bi · 999 tri. De 1e15 em
> diante: mantissa com 3 algarismos, "e" e expoente sem sinal: 1,00e15 · 4,72e16. O mesmo número
> aparece igual em todas as telas.

Efeito medido: nenhum valor do jogo, em 1 ano de jogo contínuo, chega perto do limite. O formatador
cobre todos os casos acima.

### Risco 3 — tempos do típico em degraus de 3 h; medir com sessões mais frequentes

**Medido (perfil frequente: 3 min a cada 1 h, 8 h de sono):**
- Os degraus existem: todos os marcos do típico caem no início de uma sessão (5 h, 8,05 h, 11,1 h,
  14,15 h…). A Liga em 14,2 h é o início da 5ª sessão. É inevitável enquanto a progressão só aparece na volta.
- O que pesa mais é outra coisa: com a RN-011 v0.1, **cada volta joga no máximo uma temporada**.
  O típico joga ~6 temporadas por dia; o frequente, ~16. Daí:

| Marco | típico | frequente | frequente ÷ típico |
|---|---|---|---|
| Liga (sem prestígio) | 14,2 h | 6,0 h | 0,42 |
| Liga (com prestígio) | 14,2 h | 12,9 h | 0,91 |
| Internacional | 6,2 d | 3,1 d | 0,50 |
| Mundial (30 d) | 18,8 d | 8,8 d | 0,47 |
| Prestígios em 1 semana | 5 | 15 | 3,0 |

  Quem abre o jogo 16 vezes por dia anda o dobro de quem abre 6, com o mesmo tempo total de tela
  por sessão. Isso conflita com o pilar "Respeita o tempo", segundo o qual voltar depois de horas é
  recompensador (até 8 h): hoje, 8 h fora rendem ouro, mas no máximo 14 partidas.
- O 1º prestígio do frequente vem cedo (5 h) porque o bot refunda depois de 3 temporadas sem subir,
  e o frequente junta 3 temporadas em 3 h.

**Regras testadas (típico / frequente, 7 dias):**

| Regra offline | Liga | Internacional | Prestígios | Observação |
|---|---|---|---|---|
| RN v0.1 (para no fim da temporada) | 14,2 h / 12,9 h | 6,2 d / 3,1 d | 5 / 15 | — |
| **Atravessa:** segue temporadas até o limite de 8 h | 6,7 d (12/20) / 29,0 h | não chegou / 3,2 d | 18 / 31 | Sem compras durante a noite, o time cai de divisão em cascata. Rejeitar. |
| **Até subida inédita:** segue até a 1ª subida inédita da run | 34,4 h / 34,0 h | 6,2 d (18/20) / 4,0 d | 10 / 23 | Muitas temporadas paradas offline fazem o bot refundar cedo demais. Pior. |
| **Até mudança:** segue enquanto a temporada terminar em "manteve"; para na 1ª subida ou queda | 14,2 h / 12,9 h | **4,7 d** / 3,2 d | 5 / 16 | Com a semente 2: típico na Liga em 11,1 h e na Internacional em 5,6 d (20/20). |

**Proposta R3 (até mudança).** Texto sugerido para a RN-011:

> As partidas offline são jogadas na ordem, com as regras da RN-009. Ao fim de uma temporada que
> **manteve** a divisão, a próxima começa ainda offline. As partidas **param no fim da primeira
> temporada em que o clube subir ou cair** (a seguinte só começa com o app aberto). Limite:
> `floor(t_ef / 90)` partidas. A tela "Enquanto você esteve fora" mostra cada temporada jogada.

Efeito medido: o típico chega à Internacional em 4,7 d em vez de 6,2 d (−24%). O frequente fica
igual (3,2 d). A razão entre eles cai de 2,0× para 1,5×. Na semente 1, a Liga e os prestígios não mudam; na
semente 2, a Liga do típico melhora de 14,2 h para 11,1 h. O perfil contínuo não é afetado. Subida e queda continuam sendo vistas na volta, uma por vez, e não há queda em cascata.
Custo: a tela offline precisa mostrar várias temporadas (pedido ao `nexus-ux` se o PO aprovar).
Junto com a R3, a tabela das RN deveria trazer a coluna "frequente".

## 4. RN ambíguas: interpretação que escolhi

| # | RN | Dúvida | O que o simulador faz | Precisa do PO |
|---|---|---|---|---|
| A1 | RN-013 / NX-010 | Com quanto ouro começa o clube depois de refundar? A RN-013 diz que o ouro "zera"; o Gherkin da NX-010 dá 10 de ouro ao clube novo. Com 0, o jogador precisa tocar 10 vezes antes da 1ª compra. | 10 de ouro no clube novo e depois do prestígio, como o modelo. | Definir o ouro inicial nas RN. |
| A2 | RN-009 / RN-011 | O cronômetro de 90 s da partida continua entre sessões? Quem sai aos 89 s perde esse tempo? | Ao voltar, o cronômetro recomeça em 90 s, e o offline conta `floor(t_ef/90)` desde o save, como o modelo. | Confirmar ou mandar guardar o resto. |
| A3 | RN-011 / NX-013 | As vitórias offline pagam o prêmio cheio da RN-009 (60 × renda), sem o fator 0,5? O Gherkin da NX-013 diz "recebo 1.440.000 de ouro", contando só o ouro offline. Com 5 partidas, o total real é 1.440.000 + 6.000 por vitória. | Prêmio cheio, como o modelo. O teste mostra a diferença. | Corrigir o Gherkin ("1.440.000 de ouro offline + prêmios") ou a regra. |
| A4 | RN-012 | Adiantar o relógio 8 h, voltar e adiantar de novo rende 8 h a cada ciclo. Isso contraria "nenhuma regra dá vantagem a quem adianta o relógio além do limite de 8 h". | Implementado como está escrito; o teste unitário documenta a brecha. | Escolher entre aceitar (jogo pessoal), limitar o offline por janela, ou relógio monotônico só no APK (ADR-002). |
| A5 | RN-005 | "5 toques por segundo": segundo do relógio ou janela móvel de 1 s? Muda o caso "8 toques em 1 s" quando os toques cruzam a virada do segundo. | Por segundo inteiro do relógio. | Escolher; sugiro janela móvel (mais justa ao toque). |
| A6 | RN-017 | "3 algarismos significativos": "1,00 mil" ou "1 mil"? Formato do expoente? | "1,00 mil" e "1,23e15". | Texto sugerido no risco 2. |
| A7 | Tabela das RN | O perfil típico do modelo tem "dias" de 23 h 15 min (5 × 3 h 03 min + 8 h 03 min) e o comentário do código diz "a cada ~4 h", mas o código usa 3 h. | Cópia exata do código do modelo; o frequente segue o mesmo método (dias de 23 h 03 min). | Só ciência: muda pouco os números. |

## 5. Limites desta medição

- O bot não é uma pessoa. O momento do prestígio (3 temporadas paradas) e os toques só nos 10
  primeiros minutos mudam bastante os números de prestígio e o início do jogo. Se o UX mudar o que o
  jogo sugere ao jogador (ex.: "refundar agora rende X"), o critério do bot deve acompanhar.
- O simulador não mede sensação: se 21 min de temporada são longos demais, ou se a tela offline com
  várias temporadas é clara, fica para o UX e o QA.
