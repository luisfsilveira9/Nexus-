# Design tokens — v0.2 (NX-004, NX-009)

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
| `texto.numero.heroi` | 40 / 44 | Negrito | Ouro na T02, ouro total na T13, Legado na T11 |
| `texto.numero.grande` | 28 / 32 | Negrito | Placar na T06, Legado na T08/T09 |
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
| `cor.resultado.titulo` | "Campeão mundial" (RN-010) | Estrela ★ + palavra "Campeão" |
| `cor.chance.favorito` | Chance ≥ 60% | Palavra "Favorito" |
| `cor.chance.equilibrado` | 40–59% | Palavra "Equilibrado" |
| `cor.chance.azarao` | < 40% | Palavra "Azarão" |
| `cor.estado.aviso` | Save recuperado, relógio | Ícone ⚠ + título |
| `cor.estado.perigo` | Etapa 2 do prestígio (zera progresso) | Texto explícito do que zera |
| `cor.estado.info` | Dicas de onboarding | Ícone ⓘ |
| `cor.estado.novidade` | Ponto de novidade na aba | Ponto + texto no rótulo |
| `cor.estado.pausa` | Chip "Partidas em pausa" (RN-009) | Ícone ⏸ + texto |
| `cor.estado.erro-campo` | Erro de validação na T15/T17 | Ícone ⚠ + mensagem + borda mais grossa |
| `cor.progresso.trilho` / `cor.progresso.preenchido` | Barras (split, marco de 50) | Número ao lado ("38/50") |

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
| `duracao.celebracao` | 1200 | Subiu de divisão ou título mundial (T06), refundou (T11) | só esmaecer, sem partículas |
| `curva.padrao` | — | `ease-out` para entrar, `ease-in` para sair | — |

- "Reduzir animações" segue `prefers-reduced-motion` do sistema por padrão e pode ser ligado na T14.
- Nada pisca mais de 3 vezes por segundo.
- Contagem animada de número nunca atrasa o crédito: o valor real já está no save.

## 8. Camadas (z)

`camada.base` 0 · `camada.fixa` 10 (abas, seletor de lote) · `camada.aviso` 20 (A01, A02) ·
`camada.painel` 30 · `camada.modal` 40 · `camada.sistema` 50 (T12, A05). O teclado do sistema fica acima de tudo; a T15 sobe a barra de ação para cima dele.

---

## 9. Números na tela (RN-017 v0.2)

Um formatador único, `formatarNumero(valor, tipo)`, usado por **todos** os componentes. O tipo diz
a direção do arredondamento. Teste unitário do QA cobre as tabelas abaixo (UX-20, UX-22).

### 9.1 Faixas

| Faixa do valor | Exibição | Exemplos (valor → tela, para baixo) |
|---|---|---|
| < 100 | 1 casa decimal, **sem zero final** | 0,5 → `0,5` · 10,5 → `10,5` · 11 → `11` · 99,9 → `99,9` · 9,96 → `9,9` |
| 100 a < 1.000 | inteiro | 100 → `100` · 999,9 → `999` |
| 1.000 a < 10¹⁵ | 3 algarismos significativos **com zeros finais**, espaço não quebrável (`U+00A0`) e unidade `mil`, `mi`, `bi`, `tri` | 1.000 → `1,00 mil` · 1.234 → `1,23 mil` · 45.678 → `45,6 mil` · 999.999 → `999 mil` · 1.440.000 → `1,44 mi` · 789e9 → `789 bi` |
| ≥ 10¹⁵ | mantissa com 3 algarismos, "e" e expoente | 1e15 → `1,00e15` · 4,72e16 → `4,72e16` |

- Separador decimal vírgula. Zeros finais só de 1.000 em diante (o número não muda de largura).
- **Depois de arredondar, refaz a faixa:** para cima, 99,95 → `100`; 999,2 → `1,00 mil`;
  999.999 → `1,00 mi`. Para baixo nunca muda de faixa ("1.000 mil" não existe).

### 9.2 Direção por tipo

| Tipo | Componente | Direção | Exemplos |
|---|---|---|---|
| `ouro` | Ouro em caixa (T02, T03, T04) | para baixo | `10` · `0` · `1,23 mil` |
| `taxa` | Renda/s, "+X por toque" | para baixo, + sufixo `/s` | `+0,5/s` · `+12,3/s` · `+1,23 mil/s` · `+1,2 por toque` |
| `ganho` | Prêmio (A01), ouro offline e prêmios (T13) | para baixo | `+720` · `+1,46 mi` |
| `poder` | Elenco, poder do time e do rival | para baixo | `10` · `10,5` · `12,1` · `220` |
| `custo` | Botões Comprar/Subir, Máx | **para cima** | 2º "Aulas na lan" `11,5` · Aulas n=13 `61,6` · Patrocínio n=1 `173` (real 172,5) · Vulto Nv 2→3 `74,5` |
| `falta` | "Faltam X" (×1, ×10, Máx, Subir) | **para cima**; nunca `0` (mínimo `0,1`) | 61,53 − 48 → `Faltam 13,6` |
| `porcentagem` | Chance (RN-009) | inteiro, **ao mais próximo** | 0,7685 → `77%` · poder 50 × 60 → `27%` |
| `multiplicador` | Divisão, bônus do Legado | `×` + até 2 casas, sem zeros finais | `×2` · `×2,25` · `×11,25` |
| `legado` | T02, T08, T09, T11 | inteiro | `25` · `205` |
| `quantidade` | Unidades de negócio, nível | inteiro (≥ 1.000 pela faixa) | `n 37` · `Nv 12` |
| `placar` | Split | letras sempre presentes | `6V 3D · faltam 5` |
| `tempo` | Próxima partida, T13 | `m:ss` abaixo de 1 h; `X h Y min` acima | `0:42` · `1 min 12 s` · `10 h 05 min` |

- O botão de compra segue o valor **real** com a tolerância das Convenções (`ouro ≥ custo × (1 − 10⁻⁹)`),
  não o exibido.
- **Erro de ponto flutuante:** 10 × 1,15 vale 11,499999999999998 em float64; para cima vira `11,5`,
  para baixo viraria `11,4`. Proposta (P-UX-13): antes de arredondar, o formatador desconta a mesma
  tolerância de 10⁻⁹ (para baixo multiplica por `1 + 10⁻⁹`, para cima por `1 − 10⁻⁹`), para ouro e
  custo iguais aparecerem iguais. Empate exato em porcentagem (x,5%): para cima (proposta, P-UX-13).
- Bônus do Legado aparece como multiplicador (`renda ×2,25`), não como porcentagem: evita "+1.025%".

### 9.3 Leitor de tela

O texto acessível usa a forma por extenso do mesmo valor arredondado: `1,23 mil` → "1,23 mil de
ouro"; `+12,3/s` → "12,3 de ouro por segundo"; `Faltam 13,6` → "faltam 13,6 de ouro";
`6V 3D` → "6 vitórias, 3 derrotas"; `×2,25` → "vezes 2,25".

---

## 10. Limites de texto (oficiais pela RN-020)

> Desde as RN v0.2, esta tabela é o limite oficial (RN-020); o lore escreve dentro dela. Medida nos
> wireframes v0.2 em 360 px com fonte em 100%, com os nomes finais do lore, sem corte no Chrome
> headless. Mudança aqui passa pelo `nexus-lore` e entra no changelog do `mapa-de-telas.md`.
> Caractere = o que o jogador vê (letra acentuada ou emoji = 1), espaços incluídos.

| Texto | Onde aparece | Limite | Se passar |
|---|---|---|---|
| Nome curto da divisão | Chip da T02 ("Continental · ×16 renda" + "Legado 25" cabem), T06, T08 | ≤ 12 | Reticências no chip |
| Nome de negócio | T02 "Próxima compra", T03 | ≤ 16 sem corte; ≤ 18 com reticências | Reticências; nome completo no leitor de tela |
| Descrição do negócio | Não aparece no MVP | ≤ 45 | — |
| Anúncio de negócio novo (Renatão) | Aviso na T03/T02, 3 s | ≤ 60 (2 linhas) | Corta na 2ª linha |
| Nome do rival | Card do split (T02), T05, A01 | ≤ 20 (19 coube) | Na T02 quebra em 2 linhas, nunca corta |
| Sigla (rival e clube) | T05, T08, T15 | 3 letras A–Z | — |
| Apelido do jogador | T04 | ≤ 12 | Reticências |
| Nome do clube | T08, T14, T15, T07 (`{clube}`), T13 | ≤ 20 (RN-019) | Reticências só na T08/T14; texto corrido quebra |
| Título de capítulo | T07, lista da T08 | ≤ 26 | Quebra em 2 linhas na T07; reticências na T08 |
| Bloco de capítulo | T07 | ≤ 280 por bloco; ≤ 8 blocos; capítulo ≤ 180 palavras (< 1 min) | Rolagem interna só com fonte grande |
| Prólogo / capítulo da refundação | T01, T07 | ≤ 4 blocos (~20–30 s) | — |
| Fala de 1 linha (A03, falas de evento, linha da Bússola na T13, fala na T06/T11) | Avisos e apoios | ≤ 60 | Corta na 2ª linha |
| Dica de onboarding (A02) | Dica ancorada | ≤ 60 | Quebra em até 3 linhas |
| Meta atual | Faixa da T02 | ≤ 50 | Quebra em 2 linhas |
| Mensagem de erro/validação | T15, T17, T12, A05 | ≤ 60 (título) + ≤ 120 (apoio) | Quebra |
| Balão do "Fazer live" | Sobre o botão | ≤ 20; no máximo 1 a cada 30 s; nunca com "Reduzir animações" | — |
| Rótulo de aba | Barra de abas (90 px) | ≤ 10 ("Negócios" cabe) | — |
| Texto de botão | Botão de 156 px | ≤ 18 por linha | Quebra em 2 linhas |

Mudanças da v0.1: o limite do capítulo passou de ~150 para **180 palavras e 8 blocos**, alinhado à
bíblia do lore (o capítulo 1 tem ~170 palavras); entraram sigla, título de capítulo, prólogo, fala
de 1 linha, dica, meta e mensagens de erro.
