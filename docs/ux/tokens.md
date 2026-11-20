# Design tokens — proposta v0.1 (NX-004)

> Dono: `nexus-ux`. Aqui estão **nomes, funções e escalas**. Os **valores de marca** (cores, fonte,
> sombras com cor) ficam com o `nexus-arte` (NX-005), marcados `[ARTE]`. Quando a stack sair
> (ADR-002), o `nexus-ux` publica estes tokens em `src/ui/tokens/` no formato que o `nexus-tech`
> escolher; até lá, este arquivo é a fonte.
>
> Regra de uso: componente usa só token semântico (`cor.texto.principal`), nunca valor solto nem
> token de paleta. Isso evita o erro do legado (vermelho = "lado vermelho" e "ruim" ao mesmo tempo).

## 1. Espaçamento (base 4 px)

| Token | px | Uso típico |
|---|---|---|
| `espaco.0` | 0 | — |
| `espaco.1` | 4 | Ícone ↔ texto |
| `espaco.2` | 8 | Folga mínima entre alvos de toque vizinhos |
| `espaco.3` | 12 | Padding interno de chips e linhas |
| `espaco.4` | 16 | Margem lateral da tela, padding de cards |
| `espaco.5` | 24 | Entre blocos |
| `espaco.6` | 32 | Respiro de telas cheias (T07, T11) |
| `espaco.7` | 48 | Separação grande / área de toque vazia |

Margem lateral fixa: `espaco.4` (16 px) → área útil de 328 px em 360 px.

## 2. Tamanho e área de toque

| Token | px | Uso |
|---|---|---|
| `toque.minimo` | 48 | Altura e largura mínimas de qualquer alvo |
| `toque.botao` | 56 | Botões de ação principal (Comprar, Subir, Receber) |
| `toque.principal` | 136 | Diâmetro do botão de toque da T02 |
| `barra.abas` | 64 | Altura da barra de abas |
| `barra.topo` | 48 | Altura da barra de topo da T02 |
| `area.segura.baixo` | env(safe-area-inset-bottom) | Somado abaixo da barra de abas |

## 3. Raio

| Token | Uso | Valor |
|---|---|---|
| `raio.nenhum` | Divisores | 0 |
| `raio.pequeno` | Chips, pílulas V/D | 4 px (proposta) |
| `raio.medio` | Botões, cartões | 8 px (proposta) |
| `raio.grande` | Painéis (só cantos de cima) | 16 px (proposta) |
| `raio.total` | Botão de toque, avatar | 50% |

A arte pode trocar os valores (ex.: cantos retos se a identidade pedir), mantendo a hierarquia
pequeno < médio < grande.

## 4. Tipografia

Escala em **px de referência com fonte do sistema em 100%**; no código, em unidade que acompanha a
fonte do sistema (rem/sp). Mínimo absoluto de 12 px em qualquer texto (lição do legado: 9–11 px era
ilegível). Números sempre com algarismos tabulares (`tabular-nums`), para não "pular" ao mudar.

| Token | px / altura de linha | Peso | Uso |
|---|---|---|---|
| `texto.numero.heroi` | 40 / 44 | Negrito | Ouro na T02, Legado na T11 |
| `texto.numero.grande` | 28 / 32 | Negrito | Ouro ganho na T13, placar na T06 |
| `texto.titulo` | 20 / 26 | Negrito | Título de tela e de painel |
| `texto.subtitulo` | 16 / 22 | Seminegrito | Nome de gerador/jogador, rótulo de card |
| `texto.corpo` | 16 / 24 | Normal | Texto corrido, capítulo |
| `texto.rotulo` | 14 / 20 | Seminegrito | Botões, abas, chips |
| `texto.apoio` | 12 / 16 | Normal | Legendas ("faltam 12 para dobrar") |

Fontes: `fonte.texto` e `fonte.destaque` `[ARTE]`. Evitar MAIÚSCULAS com espaçamento largo em
rótulos (piora a leitura de acentos, achado do legado).

**Fonte grande do sistema:** a 130% tudo continua cabendo na T02 se os textos de apoio quebrarem
em 2 linhas; acima disso, a T02 pode rolar, mantendo a ordem de prioridade (ouro → partida →
próxima compra → toque) e a barra de abas fixa. Critério no `criterios-usabilidade.md`.

## 5. Cores semânticas (por função)

Valores `[ARTE]`. Requisitos: texto ≥ 4,5:1 sobre o fundo onde aparece; ícones, bordas de foco e
partes de gráfico ≥ 3:1; estados nunca diferenciados só por cor (sempre letra, ícone ou texto).

| Token | Função | Par obrigatório (não só cor) |
|---|---|---|
| `cor.fundo.app` | Fundo das telas | — |
| `cor.fundo.superficie` | Cards, linhas de lista | — |
| `cor.fundo.superficie-alta` | Painéis, modais | — |
| `cor.fundo.sobreposicao` | Véu atrás de painel/modal | — |
| `cor.texto.principal` | Texto e números | — |
| `cor.texto.secundario` | Legendas, apoio (ainda ≥ 4,5:1) | — |
| `cor.texto.sobre-acao` | Texto em cima de `cor.acao.*` | — |
| `cor.borda.sutil` | Divisores (≥ 3:1 se separar alvos) | — |
| `cor.borda.foco` | Anel de foco de teclado/leitor | Anel de 2 px + deslocamento |
| `cor.acao.primaria` | Botão principal (Comprar, Subir, Receber) | Rótulo em texto |
| `cor.acao.primaria-pressionada` | Estado pressionado | Também reduz escala 0,96 |
| `cor.acao.secundaria` | Botão secundário (Voltar, Cancelar) | Mesmo tamanho do primário |
| `cor.acao.desabilitada` | Fundo de botão sem ouro | Texto "Faltam X" + ícone de cadeado opcional; texto ainda ≥ 4,5:1 |
| `cor.acao.toque` | Botão de toque da T02 | Rótulo "+X por toque" |
| `cor.recurso.ouro` | Ícone e número de ouro | Ícone de moeda |
| `cor.recurso.legado` | Ícone e número de Legado | Ícone próprio `[ARTE]` |
| `cor.resultado.vitoria` | Pílula V, "subiu" | Letra **V** + ✓ / seta ↑ |
| `cor.resultado.derrota` | Pílula D, "caiu" | Letra **D** + ✕ / seta ↓ |
| `cor.resultado.neutro` | "Manteve", partida não jogada | Traço — / casa vazia |
| `cor.chance.favorito` | Chance ≥ 60% | Palavra "Favorito" |
| `cor.chance.equilibrado` | 40–59% | Palavra "Equilibrado" |
| `cor.chance.azarao` | < 40% | Palavra "Azarão" |
| `cor.estado.aviso` | Save recuperado, relógio | Ícone ⚠ + título |
| `cor.estado.perigo` | Etapa 2 do prestígio (zera progresso) | Texto explícito do que zera |
| `cor.estado.info` | Dicas de onboarding | Ícone ⓘ |
| `cor.estado.novidade` | Ponto de novidade na aba | Ponto + texto no rótulo |
| `cor.progresso.trilho` / `cor.progresso.preenchido` | Barras (temporada, marco de 50) | Número ao lado ("38/50") |

Regras:
- `cor.resultado.derrota` **não** é usada para "sem ouro" nem para "rival". Rival não tem cor de
  significado; usa `cor.texto.principal`.
- `cor.estado.perigo` aparece **só** na T10. Usar em outro lugar banaliza o aviso.
- Faixas de chance (60/40) são proposta de UX para o rótulo; a regra da chance é da RN-009.

## 6. Elevação e sombra

| Token | Uso | Valor |
|---|---|---|
| `elevacao.0` | Fundo | nenhuma |
| `elevacao.1` | Cards | `[ARTE]` |
| `elevacao.2` | Barra de abas, seletor de lote fixo | `[ARTE]` |
| `elevacao.3` | Painéis, modais, avisos | `[ARTE]` |

Elevação nunca é a única pista de que algo é tocável (botão também tem forma e rótulo).

## 7. Movimento

| Token | ms | Uso | Com "Reduzir animações" |
|---|---|---|---|
| `duracao.instantanea` | 0 | — | — |
| `duracao.rapida` | 100 | Feedback de toque (escala 0,96) | mantém (sem deslocamento) |
| `duracao.media` | 200 | Abrir/fechar painel, troca de aba | troca por esmaecer de 100 ms |
| `duracao.lenta` | 400 | "+X" subindo do botão de toque, contagem do ouro na T13 | sem animação; número final direto |
| `duracao.celebracao` | 1200 | Subiu de divisão (T06), refundou (T11) | só esmaecer, sem partículas |
| `curva.padrao` | — | `ease-out` para entrar, `ease-in` para sair | — |

- "Reduzir animações" segue `prefers-reduced-motion` do sistema por padrão e pode ser ligado na T14.
- Nada pisca mais de 3 vezes por segundo.
- Contagem animada de número nunca atrasa o crédito: o valor real já está no save.

## 8. Camadas (z)

`camada.base` 0 · `camada.fixa` 10 (abas, seletor de lote) · `camada.aviso` 20 (A01, A02) ·
`camada.painel` 30 · `camada.modal` 40 · `camada.sistema` 50 (T12).

---

## 9. Números na tela (RN-017 aplicada)

Um formatador único, `formatarNumero(valor, tipo)`, usado por **todos** os componentes. Teste
unitário do QA cobre a tabela abaixo.

### 9.1 Regra base (RN-017 + convenções da RN)

| Faixa do valor | Exibição | Exemplos (valor → tela) |
|---|---|---|
| < 1.000 | inteiro, arredondado para baixo | 0,9 → `0` · 11,5 → `11` · 999,9 → `999` |
| 1.000 a < 1 mi | 3 algarismos significativos + `mil` | 1.000 → `1,00 mil` · 1.234 → `1,23 mil` · 45.678 → `45,6 mil` · 999.999 → `999 mil` |
| 1 mi a < 1 bi | + `mi` | 1.440.000 → `1,44 mi` · 45.600.000 → `45,6 mi` |
| 1 bi a < 1 tri | + `bi` | 789.000.000.000 → `789 bi` |
| 1 tri a ≤ 999 tri | + `tri` | 1,234e12 → `1,23 tri` |
| > 999 tri | científica, 3 significativos | 1,234e15 → `1,23e15` |

- Separador decimal vírgula; sufixo separado por espaço (não quebrável, `U+00A0`).
- Arredondamento **sempre para baixo** (convenção das RN): 1.999 → `1,99 mil`, nunca `2,00 mil`.
- Zeros finais mantidos (`1,00 mil`), para o número não mudar de largura. **Pendente de decisão do
  PO** (pedido P-UX-01).

### 9.2 Por tipo de número (componentes)

| Tipo | Componente | Formato | Exemplo |
|---|---|---|---|
| `ouro` | Ouro da T02, custos, prêmios, T13 | Regra base | `1,23 mil` |
| `custo` | Botões Comprar/Subir | Regra base. Desabilitado: "Faltam " + diferença **arredondada para cima** (se faltam 13,5, mostrar 13 faria o jogador juntar 13 e continuar sem conseguir; proposta, P-UX-01) | `Faltam 14` |
| `taxa` | Renda/s, "+X por toque" | Regra base + `/s`. **Abaixo de 100 com 1 casa decimal truncada** (proposta, P-UX-01) | `+0,5/s` · `+12,3/s` · `+1,23 mil/s` |
| `poder` | Elenco, poder do time e do rival | Regra base; **abaixo de 100 com 1 casa decimal truncada** (proposta, P-UX-01) | `10,5` · `52,0` · `220` |
| `porcentagem` | P(vitória), bônus | Inteiro + `%`, **arredondado ao mais próximo** (proposta, P-UX-02) | `77%` |
| `multiplicador` | Divisão, Legado | `×` + até 2 casas, sem zeros finais | `×2` · `×2,25` |
| `quantidade` | Unidades de gerador, nível | Inteiro; ≥ 1.000 segue regra base | `Nv 12` · `n 1,05 mil` |
| `legado` | T08/T11 | Inteiro (regra base acima de 999) | `25` |
| `placar` | Temporada | `6V 3D` (letras sempre presentes) | `6V 3D · faltam 5` |
| `tempo` | Próxima partida, T13 | `m:ss` abaixo de 1 h; `X h Y min` acima | `0:42` · `7 h 12 min` |

### 9.3 Leitor de tela

O texto acessível usa a forma por extenso do mesmo valor arredondado: `1,23 mil` → "1,23 mil de
ouro"; `+12,3/s` → "12,3 de ouro por segundo"; `6V 3D` → "6 vitórias, 3 derrotas".

---

## 10. Limites de texto (resposta ao pedido 5 do `nexus-lore`)

Medidos nos wireframes em 360 px com fonte em 100%, trocando os placeholders pelos nomes da
`docs/lore/nomes-do-jogo.md` (ainda sem aceite do PO) e checando corte no Chrome headless.

| Texto | Onde aparece | Limite | Se passar |
|---|---|---|---|
| Nome curto da divisão | Chip da T02 ("Continental · ×16 renda" coube), T06, T08 | ≤ 12 | Reticências no chip |
| Nome de gerador/negócio | T02 "Próxima compra", T03 | ≤ 16 sem corte; ≤ 18 com reticências | Reticências; nome completo no leitor de tela |
| Descrição do negócio | Não cabe na linha da T03 no MVP; usar só no aviso de "novo negócio" | ≤ 45 | — |
| Anúncio ao aparecer (aviso) | Aviso no topo da T03/T02, 3 s | ≤ 60 (2 linhas) | Corta na 2ª linha |
| Nome do rival | Card da temporada (T02), T05, A01 | ≤ 20 (19 coube) | Na T02 pode quebrar em 2 linhas, nunca cortar |
| Apelido do jogador | T04 (a T04 mostra só o apelido; nome completo fica para capítulo/detalhe) | ≤ 12 | Reticências |
| Nome do clube | T01, T08 | ≤ 20 | — |
| Bloco de capítulo | T07 | ≤ 280 por bloco; capítulo inteiro lido em < 1 min (~150 palavras) | Rolagem interna |
| Balão do botão de toque | Sobre o botão de toque | ≤ 20; no máximo 1 a cada 30 s; nunca com "Reduzir animações" | — |
| Rótulo de aba | Barra de abas (90 px) | ≤ 10 ("Geradores" e "Negócios" cabem) | — |
| Texto de botão | Qualquer botão de 156 px | ≤ 18 por linha | Quebra em 2 linhas |
