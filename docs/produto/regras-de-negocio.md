# Regras de negócio — Nexus Idle v0.2

> Dono: `nexus-po`. Fonte da verdade do produto: só o PO altera. Se uma regra permitir duas
> implementações, é defeito da regra: abra pedido em `pedidos.md`.
> **v0.2 (20/11/2026):** decide os 32 pedidos da onda 1 do Sprint 0 (lore, UX, QA e tech; ver
> `pedidos.md`), adota os nomes finais do lore (`docs/lore/nomes-do-jogo.md`) e as propostas R1, R2 e
> R3 do relatório da NX-007 (`docs/tech/nx-007-relatorio.md`). Simulador oficial:
> `tools/sim-economia/`. Decisões de base em `decisoes/ADR-001-visao-e-loop.md`.

## Convenções

- `n` = quantidade já comprada; `^` = potência.
- **Valores internos** guardados com precisão total (float64, ADR-002). **Arredondamento só na tela**
  e só pela RN-017.
- **Comparação de dinheiro:** "ouro ≥ custo" significa `ouro ≥ custo × (1 − 10⁻⁹)`. Depois da compra,
  `ouro = max(0, ouro − custo)`.
- Tempo em segundos. Dois relógios (ver RN-012): o **monotônico** (para o que acontece com o app
  aberto) e o **de parede** (para o tempo fora).
- **Run** = do início do clube (ou da última refundação) até a próxima refundação.

## Recursos

**RN-001 — Recursos.** O jogo tem exatamente duas moedas:
| Recurso | Ganho | Uso | Zera na refundação? |
|---|---|---|---|
| **Ouro** | Renda por segundo, toque, prêmios de partida, ganho offline | Negócios e níveis de jogador | Sim, volta a **10** |
| **Legado** | Refundação (RN-013) | Bônus permanente automático (RN-014); não é gasto | Não |

- Um clube novo começa com **10 de ouro**. Uma refundação também deixa o ouro em 10.
- Nenhum recurso fica negativo. Uma compra só acontece se `ouro ≥ custo` (ver Convenções).

## Renda

**RN-002 — Renda por segundo.**
```
renda/s = Σ_negócios ( renda_base_i × n_i × 2^floor(n_i / 50) )
          × mult_divisão (RN-008)
          × (1 + 0,05 × Legado)          (RN-014)
```
Com o app aberto e em primeiro plano, a renda é creditada continuamente (no mínimo a cada 1 s),
medida pelo relógio monotônico.

**RN-003 — Negócios (geradores).** Custo da próxima unidade: `custo = custo_base × 1,15^n`.

| # | Negócio | Custo base | Renda base/s |
|---|---|---|---|
| 1 | Aulas na lan | 10 | 0,5 |
| 2 | Patrocínio local | 150 | 6 |
| 3 | Camisa oficial | 2.000 | 60 |
| 4 | Canal do clube | 30.000 | 700 |
| 5 | Festa da torcida | 500.000 | 9.000 |
| 6 | Arena do clube | 8.000.000 | 120.000 |

- "Aulas na lan" é visível desde o início.
- Os outros ficam **visíveis** quando o **ouro acumulado na run** (tudo o que entrou, sem descontar
  gastos) chega a 50% do custo base deles. Depois de visível, o negócio **não some** até a próxima
  refundação.
- Um negócio fica **comprável** quando `ouro ≥ custo`.

**RN-004 — Marcos de negócio.** A cada 50 unidades de um mesmo negócio (50, 100, 150…), a renda dele
dobra (é o `2^floor(n/50)` da RN-002). A tela mostra quantas unidades faltam para o próximo marco.

**RN-005 — Toque ("Fazer live").** Cada toque dá `max(1, 0,1 × renda/s)` de ouro. Contam no máximo
**5 toques em qualquer janela móvel de 1 s**; os toques a mais são ignorados, sem mensagem de erro.

**RN-006 — Compra em lote.** Opções ×1, ×10 e Máx.
- Custo de `k` unidades a partir de `n`: `custo_base × 1,15^n × (1,15^k − 1) / 0,15`. Para ×1 vale a
  fórmula da RN-003.
- **×10** só fica habilitado se `ouro ≥ custo de 10`. Se não der, fica desabilitado e mostra
  "Faltam X".
- **Máx** compra o maior `k` com `custo de k ≤ ouro`. Se `k = 0`, fica desabilitado e mostra "Faltam X"
  (o que falta para 1 unidade).

## Elenco

**RN-007 — Elenco.** O clube tem 5 jogadores fixos, todos fictícios (`docs/lore/biblia.md`):
Pedra (Topo), Rastro (Selva), Vulto (Meio), Fagulha (Atirador) e Bússola (Suporte). Cada um começa
no nível 1.
- Custo para subir do nível `L` para `L+1`: `50 × 1,22^(L−1)`.
- Poder do jogador: `10 × 1,05^(L−1)`.
- Sem nível máximo na v0.2.

**RN-008 — Poder do time e divisões.**
`poder_time = Σ poder_jogadores × (1 + 0,01 × Legado)`

| # | Divisão | Poder dos rivais | Mult. de renda |
|---|---|---|---|
| 0 | Várzea | 60 | ×1 |
| 1 | Acesso | 220 | ×2 |
| 2 | Ascensão | 900 | ×4 |
| 3 | Elite | 20.000 | ×8 |
| 4 | Continental | 170.000 | ×16 |
| 5 | Mundial | 1.500.000 | ×32 |

- Os 7 rivais de cada divisão (nomes em `docs/lore/nomes-do-jogo.md`) têm todos o mesmo poder na v0.2.
- O multiplicador vale para a divisão **em que o clube está agora** (cai se o clube for rebaixado).

## Partidas e split

**RN-009 — Partida.** O clube joga sozinho uma partida a cada **90 s do relógio de partida**.
```
x = poder_time / poder_rival − 1
P(vitória) = limitar( 1 / (1 + e^(−6x)), 5%, 95% )
```
Exemplos: poder igual → 50%; 20% mais forte → 77%; 20% mais fraco → 23%.
- **Relógio de partida:**
  - Conta com o app aberto, em primeiro plano. Os segundos que faltam para a próxima partida ficam
    no save e continuam depois (inclusive no offline, RN-011).
  - **Pausa** enquanto estiverem abertas as boas-vindas, um capítulo, a tela "Enquanto você esteve
    fora" ou a confirmação da refundação. A renda não pausa.
  - A 1ª partida de um clube novo começa a contar quando o jogador fecha as boas-vindas.
- **Vitória:** prêmio de `60 × renda/s`, usando a renda de **antes** de aplicar qualquer subida ou
  queda que essa partida cause. Vale também para as partidas offline: prêmio cheio, sem o fator de
  0,5. **Derrota:** sem prêmio.
- O resultado usa um sorteio com semente guardada no save: o mesmo save sempre dá o mesmo resultado.
- A tela mostra o placar do split e P(vitória) da próxima partida antes de ela acontecer.

**RN-010 — Split.** O bloco de **14 partidas** (2 contra cada um dos 7 rivais) se chama **split** na
tela. "Temporada" fica reservado ao arco narrativo (T01, T02…).
- **Sobe** de divisão com **10 ou mais vitórias**; **cai** com **3 ou menos**. Na Várzea ninguém cai; no
  Mundial ninguém sobe.
- **Título mundial:** terminar um split no Mundial com 10 ou mais vitórias. Fica registrado no
  histórico do clube (não muda a divisão).
- Ao fim, a tela mostra o resumo (V-D e se subiu, manteve, caiu ou foi campeão) e o próximo split
  começa na hora.

## Offline

**RN-011 — Ganho offline.** Conta como **offline** todo o tempo em que o app não está em primeiro
plano (fechado, minimizado ou em segundo plano). Ao voltar:
```
t_off = tempo offline válido (RN-012)
t_ef  = min(t_off, 8 h)
ouro  = renda/s (no momento do save) × t_ef × 0,5
r     = segundos que faltavam para a próxima partida (guardado no save)
partidas possíveis = 0 se t_ef < r; senão 1 + floor((t_ef − r) / 90)
```
- As partidas offline são jogadas na ordem, com as regras da RN-009. Quando um split termina em
  **manteve** (ou em título mundial), o seguinte começa ainda offline.
- As partidas **param no fim do primeiro split em que o clube subir ou cair**. O split seguinte só
  começa com o app aberto.
- O relógio de partida volta com o resto que sobrou: `(t_ef − r) mod 90`, contado a partir de 90.
- **Tela "Enquanto você esteve fora":**
  - Mostra o tempo fora, o ouro offline, os prêmios das partidas e cada split jogado (V-D e
    resultado).
  - Só aparece quando `t_off ≥ 60 s`; abaixo disso, o ganho é creditado direto, sem tela.
  - Quando aparece, nada é creditado antes de o jogador vê-la. Ela não oferece nada pago.
  - Se houve recuperação de save (RN-015), esse aviso vem antes dela.

**RN-012 — Relógio.** O save guarda `maior`, o maior horário de parede já visto pelo jogo.
- Ao voltar: `t_off = max(0, agora − maior)` e, em seguida, `maior = max(maior, agora)`.
- Atrasar o relógio nunca tira nada; adiantar dá no máximo 8 h uma única vez, porque a volta ao
  horário certo não rende nada até o tempo real passar de `maior`. Assim, nenhum ciclo de
  adiantar/atrasar dá vantagem além de 8 h.
- O que acontece com o app aberto (renda e relógio de partida) usa só o relógio monotônico.

## Refundação (prestígio)

**RN-013 — Refundar o clube.** Fica disponível quando a melhor divisão alcançada **na run** é a
Ascensão ou acima.

| Melhor divisão da run | Legado ganho |
|---|---|
| Ascensão | 10 |
| Elite | 25 |
| Continental | 45 |
| Mundial | 80 |

- **Zera:** níveis dos jogadores, negócios, visibilidade dos negócios, divisão (volta à Várzea),
  split e relógio de partida. O ouro volta a 10.
- **Mantém:** Legado, capítulos já vistos (RN-018), histórico (títulos, estatísticas totais), nome
  do clube e configurações.
- Exige confirmação em duas etapas, mostrando antes o Legado que será ganho e o que zera. Durante a
  confirmação, o relógio de partida fica pausado (RN-009).
- *Nota (R1 da NX-007):* a tabela de Legado fica como está no MVP. O ritmo de quem joga sem parar se
  resolve com conteúdo depois do Mundial (Alfa), não cortando o Legado.

**RN-014 — Bônus do Legado.** Automático e permanente: **+5% de renda** e **+1% de poder** por ponto
de Legado (somados, e já incluídos nas RN-002 e RN-008).

## Save

**RN-015 — Save.**
- **Quando salva:** automaticamente a cada 10 s, a cada compra, ao fim de cada partida e ao sair ou
  minimizar. Perda máxima aceitável: 10 s de progresso.
- **Como guarda:** 2 cópias que se alternam, cada uma com verificação de integridade (checksum).
  Um save editado à mão que não confere é tratado como corrompido.
- **Se o save atual estiver corrompido:** o jogo carrega a outra cópia, se ela for válida, e avisa.
- **Se nenhuma cópia for válida:** o jogo oferece "Tentar de novo" ou "Começar clube novo". Começar
  de novo exige confirmação, e o save ilegível fica guardado para exportar.
- **Se faltar espaço:** mantém o último save válido e avisa. Nunca apaga um save válido sem
  confirmação.
- **Exportar/importar:** o jogador pode exportar o save como texto e importá-lo (proteção contra
  limpar os dados do navegador, ADR-002).

## Produto

**RN-016 — Sem dinheiro real.** Nada no jogo é vendido: sem compras, sem anúncios e sem doação em
troca de vantagem. Também nada de contagem regressiva falsa ou de pressão para voltar: notificação
só se o jogador ativar, e elas vêm desligadas.

**RN-017 — Números na tela.**

| Faixa | Formato | Exemplos |
|---|---|---|
| < 100 | 1 casa decimal, sem zero final | 0,5 · 10,5 · 11 · 99,9 |
| 100 a < 1.000 | inteiro | 100 · 999 |
| 1.000 a < 10¹⁵ | 3 algarismos significativos **com zeros finais**, espaço e unidade | 1,00 mil · 12,5 mil · 999 mil · 1,23 mi · 45,6 bi · 999 tri |
| ≥ 10¹⁵ | mantissa com 3 algarismos, "e" e expoente | 1,00e15 · 4,72e16 |

- **Direção do arredondamento:**
  - Ouro em caixa, renda/s, poder e ganhos: **para baixo**. O jogador nunca vê mais do que tem.
  - Custos e "Faltam X": **para cima**. O jogador nunca vê menos do que precisa.
  - Uma faixa nunca mostra "1.000 mil": 999.999 aparece "999 mil".
- **Porcentagens** (P(vitória)): inteiras, arredondadas ao mais próximo (0,7685 → 77%).
- O mesmo número aparece igual em todas as telas.
- O botão de compra segue o valor real (Convenções), não o exibido.

**RN-018 — Capítulos da história.** Os capítulos são do jogador, não da run: um capítulo visto (ou
pulado) **nunca reaparece sozinho** e pode ser relido na tela de jornada.
- **Prólogo:** ao criar o clube.
- **Um capítulo por divisão:** na primeira vez que o clube chega a ela, em qualquer run.
- **Primeira refundação:** capítulo próprio.
- **Epílogo da Temporada 1:** no primeiro título mundial (RN-010).
- Chegar de novo a uma divisão cujo capítulo já foi visto mostra só uma fala de 1 linha, que some
  sozinha.
- Pular o capítulo conta como visto. Nenhum capítulo bloqueia o jogo; o relógio de partida pausa
  enquanto ele está aberto (RN-009).

**RN-019 — Nome do clube.** O padrão é **Faísca eSports** (sigla **FSC**). O jogador pode renomear:
- nome com até 20 caracteres;
- sigla com exatamente 3 letras de A a Z, maiúsculas e diferente das siglas dos rivais.

O texto é sempre tratado como texto puro: nunca é interpretado como HTML.

**RN-020 — Limites de texto.** Os limites oficiais de caracteres de cada componente são os de
`docs/ux/tokens.md` §10. O lore escreve dentro deles.

## Tempo esperado até cada marco

Medido pelo simulador oficial (NX-007): mediana de 20 jogadores, semente fixa, 7 dias, já com a
regra offline da v0.2 (R3).

| Marco | Típico* | Frequente** | Sem parar |
|---|---|---|---|
| Acesso | ~21 min | ~21 min | ~21 min |
| Ascensão (libera a refundação) | ~1,8 h | ~1,8 h | ~1,8 h |
| Elite | ~14 h | ~13 h | ~5 h |
| Continental | ~4,7 dias | ~3,2 dias | ~15 h |
| Mundial | depois da 1ª semana (~19 d) | depois da 1ª semana (~9 d) | ~2 dias |
| Refundações em 1 semana | ~5 | ~16 | ~60 |

\* 2 h seguidas no 1º dia, depois 6 sessões de 3 min por dia (a cada ~3 h, com 8 h de sono).
\*\* Sessões de 3 min a cada 1 h, com 8 h de sono.

**Pendência:** a v0.2 muda o ouro inicial pós-refundação, o relógio de partida guardado e a regra de
relógio. O `nexus-tech` atualiza o simulador e confirma esta tabela (dentro de 20%) antes do MVP.
