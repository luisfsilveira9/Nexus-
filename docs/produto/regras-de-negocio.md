# Regras de negócio — Nexus Idle v0.3

> Dono: `nexus-po`. Fonte da verdade do produto: só o PO altera. Se uma regra permitir duas
> implementações, é defeito da regra: abra pedido em `pedidos.md`.
> **v0.3.3 (22/11/2026):** renda exibida por negócio e selo "Novo" (RN-003).
> **v0.3.2 (22/11/2026):** o ganho offline é creditado ao abrir, com a tela de retorno na mesma hora
> (RN-011); o apóstrofo do iPhone e a ordem de limpeza ao colar (RN-019).
> **v0.3.1 (22/11/2026):** decisão do dono — o nome do clube não aceita emoji; espaço entre palavras
> continua permitido (RN-019).
> **v0.3 (22/11/2026):** decide os pedidos da onda 2 do Sprint 0 (QA-20 a QA-27, P-UX-09 a P-UX-14,
> P-ARTE-01 a 03) e os pontos B1–B8 do relatório da NX-008 (`docs/tech/nx-008-relatorio.md`), e
> adota a tabela de tempos medida na NX-008.
> **v0.2 (20/11/2026):** decide os 32 pedidos da onda 1 do Sprint 0 (lore, UX, QA e tech; ver
> `pedidos.md`), adota os nomes finais do lore (`docs/lore/nomes-do-jogo.md`) e as propostas R1, R2 e
> R3 do relatório da NX-007 (`docs/tech/nx-007-relatorio.md`). Simulador oficial:
> `tools/sim-economia/`. Decisões de base em `decisoes/ADR-001-visao-e-loop.md`.

## Convenções

- `n` = quantidade já comprada; `^` = potência.
- **Valores internos** guardados com precisão total (float64, ADR-002). **Arredondamento só na tela**
  e só pela RN-017.
- **Comparação de dinheiro:** "ouro ≥ custo" significa `ouro ≥ custo × (1 − 10⁻⁹)`. Depois da compra,
  `ouro = max(0, ouro − custo)`. Vale para ×1, ×10 e Máx.
- **Tolerância na tela:** antes de arredondar para exibir (RN-017), um valor a menos de 10⁻⁹
  (relativo) de um ponto de arredondamento é tratado como se estivesse nele. Assim, 11,4999999…
  aparece igual a 11,5 tanto como ouro quanto como custo.
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
- Os outros ficam **visíveis** quando o **ouro ganho na run** chega a 50% do custo base deles. Ouro
  ganho = renda, toques, prêmios e offline, **sem** os 10 de ouro iniciais e sem descontar gastos. Depois de visível, o negócio **não some** até a próxima
  refundação.
- Um negócio fica **comprável** quando `ouro ≥ custo`.
- **Na tela de Negócios,** cada linha mostra a renda total daquele negócio (já com marcos, divisão e
  Legado), e a soma das linhas é igual à renda/s do topo. Nos botões de compra, "+X/s cada" usa o
  mesmo multiplicador.
- Um negócio que acabou de ficar visível ganha o selo **"Novo"** até o jogador abrir a tela de
  Negócios. O selo fica no save e zera na refundação.

**RN-004 — Marcos de negócio.** A cada 50 unidades de um mesmo negócio (50, 100, 150…), a renda dele
dobra (é o `2^floor(n/50)` da RN-002). A tela mostra quantas unidades faltam para o próximo marco.

**RN-005 — Toque ("Fazer live").** Cada toque dá `max(1, 0,1 × renda/s)` de ouro. Um toque conta se,
no 1 s anterior a ele (sem incluir o instante de exatamente 1 s antes), houver **menos de 5 toques
que contaram**. Toques ignorados não contam para esse limite e não geram mensagem de erro.

**RN-006 — Compra em lote.** Opções ×1, ×10 e Máx.
- Custo de `k` unidades a partir de `n`: `custo_base × 1,15^n × (1,15^k − 1) / 0,15`. Para ×1 vale a
  fórmula da RN-003.
- **×10** só fica habilitado se `ouro ≥ custo de 10`. Se não der, fica desabilitado e mostra
  "Faltam X".
- **Máx** compra o maior `k` com `ouro ≥ custo de k` (Convenções). Se `k = 0`, fica desabilitado e mostra "Faltam X"
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
  - Conta com o app aberto, em primeiro plano, e **só enquanto a barra de abas estiver visível**.
    Qualquer tela cheia que esconde a barra (prólogo, capítulo, "Enquanto você esteve fora", avisos de
    save, confirmação e resultado da refundação, nome do clube, exportar/importar) **pausa** o
    relógio. A renda não pausa.
  - Os segundos que faltam (`r`) ficam no save, sempre com `0 < r ≤ 90`, e continuam depois
    (inclusive no offline, RN-011).
  - A 1ª partida de um clube novo, ou de uma run nova depois de refundar, começa a contar quando a
    barra de abas aparece pela primeira vez.
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
  histórico do clube (não muda a divisão). Vale também quando acontece no offline. É uma meta de longo
  prazo: pelas medições, o jogador típico leva mais de 30 dias para chegar lá.
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
- **Relógio de partida depois do offline:**
  - se `t_ef < r`, nenhuma partida acontece e o relógio volta com `r − t_ef`;
  - se as partidas pararam no fim de um split com subida ou queda, o relógio volta com 90;
  - senão, o relógio volta com `90 − ((t_ef − r) mod 90)`.
  - Como `r > 0`, o máximo em 8 h é 320 partidas.
- **Tela "Enquanto você esteve fora":**
  - Mostra o tempo fora, o ouro offline, os prêmios das partidas e cada split jogado (V-D e
    resultado).
  - Só aparece quando `t_off ≥ 60 s`. Abaixo disso, o ganho é creditado direto, sem tela, e se uma
    partida desse tempo fechar um split, o resumo do split e o capítulo (se houver) aparecem como se
    o app estivesse aberto.
  - O ganho é creditado no momento em que o app abre ou volta, e a tela aparece nesse mesmo instante,
    antes de qualquer outra coisa (exceto os avisos de save). Ela não oferece nada pago.
  - Ela já é o resumo dos splits jogados fora: não vem uma tela de fim de split para cada um. Vários
    títulos no mesmo offline dão uma fala de 1 linha só.
  - Se houve recuperação de save (RN-015), esse aviso vem antes dela.

**RN-012 — Relógio.** O save guarda `maior`, o maior horário de parede já visto pelo jogo.
- O jogo atualiza `maior = max(maior, agora)` **em todo save** (RN-015) e ao voltar.
- Ao voltar: `t_off = max(0, agora − maior)`.
- **Cada horário de parede rende offline uma vez só.** Atrasar o relógio nunca tira ouro já ganho;
  enquanto o relógio do aparelho estiver atrás de `maior`, o tempo fora só conta a partir de `maior`.
- Adiantar o relógio só **antecipa** ganho, que deixa de vir depois, até o tempo real passar de
  `maior`. Um ciclo de adiantar e atrasar rende no máximo 8 h. Adiantar em degraus cada vez maiores
  rende até 8 h por degrau, mas como adiantamento, não como ganho grátis (aceito: jogo pessoal, sem
  horário de servidor, ADR-002).
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

- **Zera:** níveis dos jogadores, negócios, visibilidade dos negócios, ouro ganho na run, divisão
  (volta à Várzea), split e relógio de partida (volta a 90 s). O ouro volta a 10.
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
- **Validação além do checksum:** uma cópia com checksum certo, mas com valores impossíveis (ouro
  negativo, divisão inexistente, nome fora da RN-019 etc.), é tratada como **corrompida**.
- **Se faltar espaço:** mantém o último save válido e avisa. Nunca apaga um save válido sem
  confirmação.
- **Exportar/importar:** o jogador pode exportar o save como texto e importá-lo (proteção contra
  limpar os dados do navegador, ADR-002).
  - Importar sobre um save válido exige confirmação mostrando o clube que sai e o que entra, com o
    atalho "Exportar o atual primeiro".
  - Save de versão mais nova que o jogo é recusado com mensagem.
  - Depois de importar, o jogo reabre pela sequência normal de abertura, com `t_off` contado a
    partir do `maior` do save importado (RN-012, limite de 8 h).

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
- **Porcentagens** (P(vitória)): inteiras, arredondadas ao mais próximo (0,7685 → 77%); empate
  exato em ,5 vai para cima.
- Quando o arredondamento para cima passa do limite de uma faixa, o número vai para a faixa seguinte
  (custo 999,2 → "1,00 mil").
- O mesmo número aparece igual em todas as telas.
- O botão de compra segue o valor real (Convenções), não o exibido.

**RN-018 — Capítulos da história.** Os capítulos são do jogador, não da run: um capítulo visto (ou
pulado) **nunca reaparece sozinho** e pode ser relido na tela de jornada.
- **Prólogo:** é a própria tela de boas-vindas do clube novo. A Várzea não tem capítulo próprio: o
  prólogo cumpre esse papel.
- **Um capítulo por divisão** (do Acesso ao Mundial): na primeira vez que o clube **sobe** até ela,
  em qualquer run.
- **Primeira refundação:** capítulo próprio.
- **Epílogo da Temporada 1:** no primeiro título mundial (RN-010). Do 2º título em diante, só uma
  fala de 1 linha.
- **Fala de 1 linha:** aparece **só ao subir** de novo a uma divisão cujo capítulo já foi visto (na
  queda e na volta à Várzea pela refundação, as telas de resultado já trazem a fala). Até 60
  caracteres; some sozinha em 4 s ou com um toque.
- **Ordem quando vários eventos coincidem:** avisos de save → "Enquanto você esteve fora" → resumo de
  cada split, em ordem → capítulos, em ordem cronológica → falas de 1 linha.
- Pular o capítulo conta como visto. Nenhum capítulo bloqueia o jogo; o relógio de partida pausa
  enquanto ele está aberto (RN-009).

**RN-019 — Nome do clube.** O padrão é **Faísca eSports** (sigla **FSC**). O jogador pode renomear:
- **Nome:** de 1 a 20 caracteres, contados como o jogador vê (letra acentuada conta 1).
  - **Permitido:** letras (com ou sem acento, incluindo "ç"), números, espaço entre palavras e os
    sinais `-`, `.`, `'` e `&`. Exemplos válidos: "Lowther eSports", "Los Grandes", "Pain Gaming".
  - **Recusado:** **emoji** e qualquer outro símbolo, quebra de linha e caracteres de controle. O
    campo mostra a mensagem "Use só letras, números e espaços" e não aceita o caractere.
  - **Espaços:** os do começo e do fim são removidos e espaços seguidos viram um só. Um nome só de
    espaços é recusado.
  - O apóstrofo curvo `’` (que o teclado do iPhone gera) vira `'` antes de validar.
  - **Ao colar,** nesta ordem: converter `’`, remover os caracteres proibidos, juntar espaços e cortar
    em 20. Um aviso só diz o que mudou.
- **Sigla:** exatamente 3 letras de A a Z. O que for digitado em minúsculas vira maiúsculas; acento,
  "ç" e números são recusados (não há conversão de "Ç" para "C"). Não pode repetir nenhuma das 42
  siglas de rivais.

O texto é sempre tratado como texto puro: nunca é interpretado como HTML.

**RN-020 — Limites de texto.** Os limites oficiais de caracteres de cada componente são os de
`docs/ux/tokens.md` §10. O lore escreve dentro deles.
- Os limites valem **depois** de trocar `{clube}` por um nome de 20 caracteres (o pior caso).
- Capítulo: até 180 palavras e 8 blocos (lido em menos de 1 min).
- Fala de 1 linha: até 60 caracteres (RN-018).

## Tempo esperado até cada marco

Medido pelo simulador oficial na NX-008 (RN v0.2): mediana de 20 jogadores, sementes 1 a 5, 7 dias e
30 dias. O fim do jogo (Mundial e título) é medido com a estratégia `titulo` do simulador, que segue
subindo o elenco no Mundial.

| Marco | Típico* | Frequente** | Sem parar |
|---|---|---|---|
| Acesso | ~21 min | ~21 min | ~21 min |
| Ascensão (libera a refundação) | ~1,8 h | ~1,8 h | ~1,8 h |
| Elite | ~11 h | ~13 h | ~5 h |
| Continental | ~5,5 dias (1 ou 2 em 20 passam da 1ª semana) | ~3,1 dias | ~15 h |
| Mundial | ~18 dias | ~9 dias | ~2 dias |
| 1º título mundial (epílogo da Temporada 1) | mais de 30 dias | ~22 dias | ~5,4 dias |
| Refundações em 1 semana | ~6 | ~16 | ~60 |

\* 2 h seguidas no 1º dia, depois 6 sessões de 3 min por dia (a cada ~3 h, com 8 h de sono).
\*\* Sessões de 3 min a cada 1 h, com 8 h de sono.

**Decisão do PO (v0.3):** o título mundial fica como meta de longo prazo e a economia não muda agora.
O MVP é julgado pela primeira semana (até a Continental). Conteúdo depois do Mundial e o ritmo do
fim de jogo são temas do Alfa. A NX-015 deve repetir esta medição com o motor de `src/engine/`.
