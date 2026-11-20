# Regras de negócio — Nexus Idle v0.1

> Dono: `nexus-po`. Fonte da verdade do produto: só o PO altera. Se uma regra permitir duas
> implementações, é defeito da regra: abra pedido em `pedidos.md`.
> Números da v0.1 vêm do modelo `modelo-economia-v0.1.py` e **serão validados na NX-007** com o
> simulador oficial antes do MVP. Decisões de base em `decisoes/ADR-001-visao-e-loop.md`.

## Convenções

- `n` = quantidade já comprada; `^` = potência; arredondamentos só na exibição.
- Valores internos guardados com precisão total; a tela arredonda **para baixo** (o jogador nunca
  vê mais ouro do que tem).
- Tempo em segundos de relógio real.

## Recursos

**RN-001 — Recursos.** O jogo tem exatamente duas moedas:
| Recurso | Ganho | Uso | Zera no prestígio? |
|---|---|---|---|
| **Ouro** | Renda por segundo, toque, prêmios de partida, ganho offline | Geradores e níveis de jogador | Sim |
| **Legado** | Prestígio (RN-013) | Bônus permanente automático (RN-014); não é gasto | Não |

Nenhum recurso pode ficar negativo. Uma compra só acontece se `ouro ≥ custo` exato.

## Renda

**RN-002 — Renda por segundo.**
```
renda/s = Σ_geradores ( renda_base_i × n_i × 2^floor(n_i / 50) )
          × mult_divisão (RN-008)
          × (1 + 0,05 × Legado)          (RN-014)
```
A renda é creditada continuamente (no mínimo a cada 1 s) enquanto o app está aberto.

**RN-003 — Geradores.** Fontes de renda do clube. Custo da próxima unidade:
`custo = custo_base × 1,15^n`.

| # | Gerador (nome provisório, final do `nexus-lore`) | Custo base | Renda base/s |
|---|---|---|---|
| 1 | Live do time | 10 | 0,5 |
| 2 | Patrocínio local | 150 | 6 |
| 3 | Loja de camisas | 2.000 | 60 |
| 4 | Canal de conteúdo | 30.000 | 700 |
| 5 | Fan fest | 500.000 | 9.000 |
| 6 | Arena própria | 8.000.000 | 120.000 |

Um gerador fica **visível** quando o jogador alcança 50% do custo base dele pela primeira vez na
run, e **comprável** quando tem o custo.

**RN-004 — Marcos de gerador.** A cada 50 unidades de um mesmo gerador (50, 100, 150…), a renda
daquele gerador dobra (já incluído no `2^floor(n/50)` da RN-002). A tela mostra quantas unidades
faltam para o próximo marco.

**RN-005 — Toque.** O botão principal ("Fazer live", nome final do lore) dá, por toque,
`max(1, 0,1 × renda/s)` de ouro. Contam no máximo 5 toques por segundo; o excesso é ignorado sem
aviso de erro.

**RN-006 — Compra em lote.** Opções ×1, ×10 e Máx. Custo de `k` unidades a partir de `n`:
`custo_base × 1,15^n × (1,15^k − 1) / 0,15`. "Máx" compra o maior `k` com custo ≤ ouro; se `k = 0`,
o botão fica desabilitado e mostra quanto falta.

## Elenco

**RN-007 — Elenco.** O clube tem 5 jogadores fixos, um por função: Topo, Selva, Meio, Atirador e
Suporte (nomes e personalidades do `nexus-lore`, todos fictícios). Cada um começa no nível 1.
- Custo para subir do nível `L` para `L+1`: `50 × 1,22^(L−1)`.
- Poder do jogador: `10 × 1,05^(L−1)`.
- Sem nível máximo na v0.1.

**RN-008 — Poder do time e divisões.**
`poder_time = Σ poder_jogadores × (1 + 0,01 × Legado)`

| # | Divisão (nome provisório) | Poder dos rivais | Mult. de renda |
|---|---|---|---|
| 0 | Amadora | 60 | ×1 |
| 1 | Desafiante | 220 | ×2 |
| 2 | Academy | 900 | ×4 |
| 3 | Liga | 20.000 | ×8 |
| 4 | Internacional | 170.000 | ×16 |
| 5 | Mundial | 1.500.000 | ×32 |

Todos os rivais de uma divisão têm o mesmo poder na v0.1 (nomes dos 7 rivais por divisão: lore).
O multiplicador vale para a divisão **em que o clube está agora** (cai se for rebaixado).

## Partidas e temporada

**RN-009 — Partida.** Com o app aberto, o clube joga uma partida a cada **90 s**, sozinho.
```
x = poder_time / poder_rival − 1
P(vitória) = limitar( 1 / (1 + e^(−6x)), 5%, 95% )
```
Exemplos: poder igual → 50%; 20% mais forte → 77%; 20% mais fraco → 23%.
- Vitória: prêmio de `60 × renda/s` (renda no momento do resultado). Derrota: sem prêmio.
- O resultado usa um sorteio com semente salva no save (o mesmo save sempre dá o mesmo resultado).
- A tela mostra o placar e P(vitória) da próxima partida antes de ela acontecer.

**RN-010 — Temporada.** Uma temporada tem **14 partidas** (2 contra cada um dos 7 rivais).
- **Sobe** de divisão com **10 ou mais vitórias**; **cai** com **3 ou menos** (na Amadora ninguém
  cai; no Mundial ninguém sobe).
- Ao fim, mostra o resumo (V-D, subiu/manteve/caiu) e a próxima temporada começa na hora.
- Subir pela primeira vez a uma divisão na run marca um **marco de história** (capítulo do lore).

## Offline

**RN-011 — Ganho offline.** Ao voltar ao app:
```
t_off   = tempo offline válido (RN-012)
t_ef    = min(t_off, 8 h)
ouro    = renda/s (no momento do save) × t_ef × 0,5
partidas offline = min( partidas que faltam na temporada atual, floor(t_ef / 90) )
```
- As partidas offline são jogadas na ordem, com as mesmas regras da RN-009, **e param no fim da
  temporada atual** (subir/cair acontece; a temporada seguinte só começa com o app aberto).
- A tela "Enquanto você esteve fora" mostra tempo, ouro, partidas (V-D) e o resultado da temporada
  se ela acabou. Nada é creditado antes de o jogador ver essa tela, e ela não oferece nada pago.

**RN-012 — Relógio.** `t_off = agora − momento do último save`.
- Se `t_off < 0` (relógio voltou): `t_off = 0`, e o momento do save é atualizado para `agora`.
- Se `t_off > 8 h`, vale só 8 h (RN-011); o excedente se perde sem punição.
- Nenhuma regra dá vantagem a quem adianta o relógio além do limite de 8 h.

## Prestígio

**RN-013 — Prestígio ("Refundar o clube", nome final do lore).** Fica disponível quando a melhor
divisão alcançada **na run atual** é Academy ou acima.
| Melhor divisão da run | Legado ganho |
|---|---|
| Academy | 10 |
| Liga | 25 |
| Internacional | 45 |
| Mundial | 80 |
- Zera: ouro, geradores, níveis dos jogadores, divisão (volta à Amadora) e a temporada.
- Mantém: Legado, marcos de história já vistos, estatísticas totais e configurações.
- Exige confirmação em duas etapas, mostrando antes o Legado que será ganho e o que zera.

**RN-014 — Bônus do Legado.** Automático e permanente: **+5% de renda** e **+1% de poder** por ponto
de Legado (aditivo, já incluído nas RN-002 e RN-008).

## Save e limites do produto

**RN-015 — Save.** Salvar automaticamente a cada 10 s, a cada compra, ao fim de cada partida e ao
sair ou minimizar o app. Perda máxima aceitável: 10 s de progresso. Save corrompido nunca apaga o
progresso anterior sem confirmação: o jogo tenta o último save válido.

**RN-016 — Sem dinheiro real.** Nada no jogo é vendido: sem compras, sem anúncios, sem doação em troca
de vantagem. Também sem contagem regressiva falsa ou pressão para voltar (notificação só se o
jogador ativar).

**RN-017 — Números na tela.** Abaixo de 1.000: inteiro. A partir daí, notação curta pt-BR com 3
algarismos significativos: 1,23 mil · 45,6 mi · 789 bi · 1,23 tri; acima de 999 tri, notação
científica (1,23e15). O mesmo número aparece igual em todas as telas.

## Tempo esperado até cada marco (modelo v0.1, mediana de 20 jogadores simulados)

| Marco | Perfil típico* | Jogando sem parar |
|---|---|---|
| Desafiante | ~20 min | ~20 min |
| Academy (libera o prestígio) | ~1,8 h | ~1,8 h |
| 1º prestígio | ~20 h | ~3 h |
| Liga | ~14 h | ~5 h |
| Internacional | ~6 dias | ~15 h |
| Mundial | depois da 1ª semana | ~2 dias |
| Prestígios em 1 semana | ~5 | ~60 |

\* 2 h seguidas no 1º dia, depois 6 sessões de 3 min por dia (a cada ~3 h, com 8 h de sono).

**Riscos abertos para a NX-007:**
1. Quem joga sem parar faz ~60 prestígios por semana, porque repetir a Academy compensa. Avaliar
   Legado só para melhor divisão inédita, ou ganho decrescente por repetição.
2. A renda passa de 1 bilhão/s na 1ª semana: a notação da RN-017 e a precisão numérica do código
   precisam aguentar isso.
3. Os tempos do perfil típico andam em degraus de 3 h (o intervalo entre sessões): medir também com
   sessões mais frequentes.
