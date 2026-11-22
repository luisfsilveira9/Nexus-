# Guia visual — Nexus Idle v0.1 (NX-005)

> Dono: `nexus-arte`. Status: **proposta para aceite do PO** (20/11/2026).
> Valores prontos para CSS: `tokens-marca.md`. Nomes e funções dos tokens: `docs/ux/tokens.md`.
> Exemplo aplicado: `mockup-principal.html` (+ `mockup-principal.png` e `mockup-principal-aviso.png`).
> Elenco: `folha-referencia-chibi.html` (+ `.png`). Origem e licença de cada asset: `assets/inventario.md`.
> **Mudança de 20/11 (diretriz do dono, via PO):** o estilo de ilustração passa a ser **chibi**. Isso
> mudou o conceito (§1), criou a seção de ilustração (§6) e os retratos do elenco e da mascote, e
> acertou o arredondamento dos ícones (§5) com a família chibi.

## 1. Conceito

**"Acende, Faísca!": uma turma chibi da lan de bairro que vira clube, à noite, no cais de Porto Ventura.**
O fundo é o azul noite do cais; a ação é o laranja brasa da faísca; o dinheiro é a luz amarela do farol.
Personagens chibi (cabeça grande, olhos grandes, formas redondas) dão o calor de bairro; a interface
geométrica e limpa dá o "competitivo com cabeça".

**Palavras-chave:** noite no cais · faísca que vira fogueira · luz do farol · cartaz de várzea ·
turma de bairro · chibi redondo e amigável · leitura em 3 segundos.

**Por que não o Hextech do legado:** o dourado sobre preto e os cantos retos falavam de "liga de
elite"; o Nexus Idle começa numa lan de bairro (bíblia §1). A única coisa herdada é a regra de
significado ("cor de lado nunca quer dizer bom ou ruim"), que o UX já levou para `tokens.md` §5.

## 2. Paleta

Tema único escuro (o jogo é aberto em pausas curtas, muitas vezes à noite, e o laranja e o amarelo
brilham sobre o azul). Valores e papéis completos: `tokens-marca.md` §1–2.

| Grupo | Cores | Uso |
|---|---|---|
| Noite do cais (base) | `#0B1220` `#141E33` `#1D2A45` `#2B3B5E` `#6B7FA8` | Fundos por elevação, divisores, bordas |
| Texto | `#F5F0E6` principal · `#B4C0D8` secundário | Branco quente de papel, nunca branco puro |
| Brasa (marca e ação) | `#FF7A2F` · `#E8611A` pressionado · `#FFA06B` como texto | Botões principais, "Fazer live", aba ativa, camisa |
| Farol (ouro) | `#FFC83D` · `#FFE08A` foco | Ouro e prêmios, anel de foco |
| Maré (Legado) | `#4FD6C8` | Legado e o que é permanente |
| Resultado e chance | `#5BD38A` V/favorito · `#FF7A8A` D · `#8EC5FF` equilibrado/info · `#F7B977` azarão | Sempre com letra, ícone ou palavra |
| Estados | `#FFD166` aviso · `#FF5D5D` perigo (só T10) | |
| Divisões | ver §7 | Só em emblema e borda de chip |

Regras de cor:
- **Uma ação laranja por área.** Se dois botões laranja disputam a mesma tela, um deles vira secundário.
- **Texto sobre laranja, amarelo, verde ou vermelho é sempre escuro** (`#0B1220`). Branco sobre o
  laranja não passa AA.
- **Ouro é amarelo, Legado é turquesa, ação é laranja.** Não trocar: o jogador aprende a ler o
  dinheiro pela cor e pelo ícone.

### 2.1 Contraste AA medido

Script: `node docs/arte/contraste.mjs` (sem dependências; `--json` para máquina). Ele calcula a razão
WCAG 2.x de cada par texto/fundo e elemento/fundo usado nas telas e **sai com código 1 se algum par
falhar**, então o QA pode pôr na pipeline. Mínimos: texto 4,5:1 (não usamos a folga de "texto grande");
ícones, bordas de foco e partes de gráfico 3:1. Saída de 20/11/2026:

| Elemento (token) | Cor | Fundo (token) | Cor | Tipo | Razão | Mínimo | AA |
|---|---|---|---|---|---|---|---|
| `cor.texto.principal` | `#F5F0E6` | `cor.fundo.app` | `#0B1220` | texto | 16,48:1 | 4,50:1 | passa |
| `cor.texto.principal` | `#F5F0E6` | `cor.fundo.superficie` | `#141E33` | texto | 14,64:1 | 4,50:1 | passa |
| `cor.texto.principal` | `#F5F0E6` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 12,58:1 | 4,50:1 | passa |
| `cor.texto.secundario` | `#B4C0D8` | `cor.fundo.app` | `#0B1220` | texto | 10,23:1 | 4,50:1 | passa |
| `cor.texto.secundario` | `#B4C0D8` | `cor.fundo.superficie` | `#141E33` | texto | 9,08:1 | 4,50:1 | passa |
| `cor.texto.secundario` | `#B4C0D8` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,81:1 | 4,50:1 | passa |
| `cor.recurso.ouro` | `#FFC83D` | `cor.fundo.app` | `#0B1220` | texto | 12,11:1 | 4,50:1 | passa |
| `cor.recurso.ouro` | `#FFC83D` | `cor.fundo.superficie` | `#141E33` | texto | 10,75:1 | 4,50:1 | passa |
| `cor.recurso.ouro` | `#FFC83D` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 9,24:1 | 4,50:1 | passa |
| `cor.recurso.legado` | `#4FD6C8` | `cor.fundo.app` | `#0B1220` | texto | 10,51:1 | 4,50:1 | passa |
| `cor.recurso.legado` | `#4FD6C8` | `cor.fundo.superficie` | `#141E33` | texto | 9,33:1 | 4,50:1 | passa |
| `cor.recurso.legado` | `#4FD6C8` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 8,02:1 | 4,50:1 | passa |
| `cor.resultado.vitoria` | `#5BD38A` | `cor.fundo.app` | `#0B1220` | texto | 9,92:1 | 4,50:1 | passa |
| `cor.resultado.vitoria` | `#5BD38A` | `cor.fundo.superficie` | `#141E33` | texto | 8,81:1 | 4,50:1 | passa |
| `cor.resultado.vitoria` | `#5BD38A` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,57:1 | 4,50:1 | passa |
| `cor.resultado.derrota` | `#FF7A8A` | `cor.fundo.app` | `#0B1220` | texto | 7,49:1 | 4,50:1 | passa |
| `cor.resultado.derrota` | `#FF7A8A` | `cor.fundo.superficie` | `#141E33` | texto | 6,65:1 | 4,50:1 | passa |
| `cor.resultado.derrota` | `#FF7A8A` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 5,72:1 | 4,50:1 | passa |
| `cor.resultado.neutro` | `#B4C0D8` | `cor.fundo.app` | `#0B1220` | texto | 10,23:1 | 4,50:1 | passa |
| `cor.resultado.neutro` | `#B4C0D8` | `cor.fundo.superficie` | `#141E33` | texto | 9,08:1 | 4,50:1 | passa |
| `cor.resultado.neutro` | `#B4C0D8` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,81:1 | 4,50:1 | passa |
| `cor.chance.favorito` | `#5BD38A` | `cor.fundo.app` | `#0B1220` | texto | 9,92:1 | 4,50:1 | passa |
| `cor.chance.favorito` | `#5BD38A` | `cor.fundo.superficie` | `#141E33` | texto | 8,81:1 | 4,50:1 | passa |
| `cor.chance.favorito` | `#5BD38A` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,57:1 | 4,50:1 | passa |
| `cor.chance.equilibrado` | `#8EC5FF` | `cor.fundo.app` | `#0B1220` | texto | 10,33:1 | 4,50:1 | passa |
| `cor.chance.equilibrado` | `#8EC5FF` | `cor.fundo.superficie` | `#141E33` | texto | 9,17:1 | 4,50:1 | passa |
| `cor.chance.equilibrado` | `#8EC5FF` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,88:1 | 4,50:1 | passa |
| `cor.chance.azarao` | `#F7B977` | `cor.fundo.app` | `#0B1220` | texto | 10,84:1 | 4,50:1 | passa |
| `cor.chance.azarao` | `#F7B977` | `cor.fundo.superficie` | `#141E33` | texto | 9,63:1 | 4,50:1 | passa |
| `cor.chance.azarao` | `#F7B977` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 8,28:1 | 4,50:1 | passa |
| `cor.estado.aviso` | `#FFD166` | `cor.fundo.app` | `#0B1220` | texto | 12,98:1 | 4,50:1 | passa |
| `cor.estado.aviso` | `#FFD166` | `cor.fundo.superficie` | `#141E33` | texto | 11,53:1 | 4,50:1 | passa |
| `cor.estado.aviso` | `#FFD166` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 9,91:1 | 4,50:1 | passa |
| `cor.estado.info` | `#8EC5FF` | `cor.fundo.app` | `#0B1220` | texto | 10,33:1 | 4,50:1 | passa |
| `cor.estado.info` | `#8EC5FF` | `cor.fundo.superficie` | `#141E33` | texto | 9,17:1 | 4,50:1 | passa |
| `cor.estado.info` | `#8EC5FF` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,88:1 | 4,50:1 | passa |
| `cor.estado.novidade` | `#FFA06B` | `cor.fundo.app` | `#0B1220` | texto | 9,35:1 | 4,50:1 | passa |
| `cor.estado.novidade` | `#FFA06B` | `cor.fundo.superficie` | `#141E33` | texto | 8,31:1 | 4,50:1 | passa |
| `cor.estado.novidade` | `#FFA06B` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,14:1 | 4,50:1 | passa |
| `cor.texto.destaque` | `#FFA06B` | `cor.fundo.app` | `#0B1220` | texto | 9,35:1 | 4,50:1 | passa |
| `cor.texto.destaque` | `#FFA06B` | `cor.fundo.superficie` | `#141E33` | texto | 8,31:1 | 4,50:1 | passa |
| `cor.texto.destaque` | `#FFA06B` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 7,14:1 | 4,50:1 | passa |
| `cor.estado.perigo` | `#FF5D5D` | `cor.fundo.superficie-alta` | `#1D2A45` | texto | 4,75:1 | 4,50:1 | passa |
| `cor.estado.perigo` | `#FF5D5D` | `cor.fundo.app` | `#0B1220` | texto | 6,22:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.acao.primaria` | `#FF7A2F` | texto | 7,20:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.acao.primaria-pressionada` | `#E8611A` | texto | 5,49:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.acao.toque` | `#FF7A2F` | texto | 7,20:1 | 4,50:1 | passa |
| `cor.texto.principal` | `#F5F0E6` | `cor.acao.secundaria` | `#1D2A45` | texto | 12,58:1 | 4,50:1 | passa |
| `cor.texto.sobre-desabilitada` | `#C9D2E3` | `cor.acao.desabilitada` | `#26324D` | texto | 8,39:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.recurso.ouro (pílula)` | `#FFC83D` | texto | 12,11:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.estado.perigo (botão T10)` | `#FF5D5D` | texto | 6,22:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.resultado.vitoria` | `#5BD38A` | texto | 9,92:1 | 4,50:1 | passa |
| `cor.texto.sobre-acao` | `#0B1220` | `cor.resultado.derrota` | `#FF7A8A` | texto | 7,49:1 | 4,50:1 | passa |
| `cor.borda.foco` | `#FFE08A` | `cor.fundo.app` | `#0B1220` | ui | 14,52:1 | 3,00:1 | passa |
| `cor.borda.foco` | `#FFE08A` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 11,08:1 | 3,00:1 | passa |
| `cor.borda.foco` | `#FFE08A` | `cor.fundo.superficie` | `#141E33` | ui | 12,89:1 | 3,00:1 | passa |
| `cor.borda.sutil` | `#6B7FA8` | `cor.fundo.app` | `#0B1220` | ui | 4,66:1 | 3,00:1 | passa |
| `cor.borda.sutil` | `#6B7FA8` | `cor.fundo.superficie` | `#141E33` | ui | 4,14:1 | 3,00:1 | passa |
| `cor.acao.primaria` | `#FF7A2F` | `cor.fundo.app` | `#0B1220` | ui | 7,20:1 | 3,00:1 | passa |
| `cor.acao.primaria` | `#FF7A2F` | `cor.fundo.superficie` | `#141E33` | ui | 6,39:1 | 3,00:1 | passa |
| `cor.acao.secundaria (borda)` | `#6B7FA8` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 3,56:1 | 3,00:1 | passa |
| `cor.acao.desabilitada (borda)` | `#6B7FA8` | `cor.fundo.superficie` | `#141E33` | ui | 4,14:1 | 3,00:1 | passa |
| `cor.progresso.preenchido` | `#FF7A2F` | `cor.progresso.trilho` | `#2B3B5E` | ui | 4,27:1 | 3,00:1 | passa |
| `cor.progresso.trilho` | `#2B3B5E` | `cor.fundo.app` | `#0B1220` | ui | 1,69:1 | decorativo | passa |
| `Ícone de função/negócio` | `#F5F0E6` | `cor.fundo.superficie` | `#141E33` | ui | 14,64:1 | 3,00:1 | passa |
| `cor.divisao.varzea` | `#D39B68` | `cor.fundo.app` | `#0B1220` | ui | 7,72:1 | 3,00:1 | passa |
| `cor.divisao.varzea` | `#D39B68` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 5,89:1 | 3,00:1 | passa |
| `cor.divisao.acesso` | `#9CCB5B` | `cor.fundo.app` | `#0B1220` | ui | 9,90:1 | 3,00:1 | passa |
| `cor.divisao.acesso` | `#9CCB5B` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 7,56:1 | 3,00:1 | passa |
| `cor.divisao.ascensao` | `#4DA8F0` | `cor.fundo.app` | `#0B1220` | ui | 7,29:1 | 3,00:1 | passa |
| `cor.divisao.ascensao` | `#4DA8F0` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 5,56:1 | 3,00:1 | passa |
| `cor.divisao.elite` | `#B08CFF` | `cor.fundo.app` | `#0B1220` | ui | 7,17:1 | 3,00:1 | passa |
| `cor.divisao.elite` | `#B08CFF` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 5,47:1 | 3,00:1 | passa |
| `cor.divisao.continental` | `#CFD8E8` | `cor.fundo.app` | `#0B1220` | ui | 13,05:1 | 3,00:1 | passa |
| `cor.divisao.continental` | `#CFD8E8` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 9,96:1 | 3,00:1 | passa |
| `cor.divisao.mundial` | `#FFC83D` | `cor.fundo.app` | `#0B1220` | ui | 12,11:1 | 3,00:1 | passa |
| `cor.divisao.mundial` | `#FFC83D` | `cor.fundo.superficie-alta` | `#1D2A45` | ui | 9,24:1 | 3,00:1 | passa |

77 pares conferidos, 0 falha(s).

Notas:
- O anel de foco amarelo **não** pode encostar no laranja (2,0:1): sempre 2 px de deslocamento.
- `cor.progresso.trilho` é decorativo (o número fica ao lado, `tokens.md` §5); quem precisa de 3:1 é
  o preenchido contra o trilho (4,3:1).
- Ilustrações chibi não entram na tabela: são decorativas, sempre acompanhadas de nome em texto.

## 3. Tipografia

| Papel | Fonte | Licença | Fallback |
|---|---|---|---|
| Texto e **todos os números** (`fonte.texto`) | **Inter** (Rasmus Andersson), pesos 400/600/700/800 | SIL Open Font License 1.1 | `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif` |
| Destaque (`fonte.destaque`) | **Archivo Black** (Omnibus-Type) | SIL Open Font License 1.1 | `"Arial Black", "Inter", system-ui, sans-serif` |

- Por que Inter: algarismos tabulares (`tnum`), acentos do português bem desenhados, ótima leitura em
  12–16 px e o 800 dá números heroicos sem fonte extra.
- Por que Archivo Black: pesada e larga como letra de cartaz de várzea e de camisa; com cantos
  levemente arredondados que conversam com o chibi. **Não tem algarismos tabulares:** nunca em número
  que muda. Mínimo de 17 px.
- Escala, tamanhos e alturas de linha: os do `tokens.md` §4 (do UX), sem mudança.
- Sem MAIÚSCULAS espaçadas em rótulo (achado do legado). Archivo Black em caixa normal ("Fazer live").
- **Empacotamento (para o `nexus-tech`):** as fontes vão **dentro do build**, sem Google Fonts (condição
  C9 do ADR-002: nenhum pedido de rede fora do site). Sugestão: pacotes npm `@fontsource/inter` e
  `@fontsource/archivo-black` (OFL), só o subconjunto `latin` + `latin-ext`, `font-display: swap`.
  Peso estimado: ~25 kB por peso de Inter em woff2 e ~20 kB da Archivo Black (estimativa; o tech mede).
  Se o orçamento apertar, cai primeiro o Inter 800 (o 700 serve para o número herói).
- O arquivo de licença (OFL) de cada fonte vai junto no build (exigência da OFL).

## 4. Grade, forma e arredondamento comuns

Uma regra serve para ícone, emblema e personagem: **tudo é redondo, contornado e sem ponta seca.**

| Item | Regra |
|---|---|
| Cantos | Raio 6/10/20 px (`tokens-marca.md` §3); em ícone, juntas e pontas `round` |
| Contorno | Ícone: 2 px na grade de 24 (1/12). Emblema: 3 px na grade de 48. Chibi: 3 px na grade de 120. Todos com junta redonda |
| Luz | Sempre de cima à esquerda; sombra de 1 tom embaixo à direita |
| Motivo da marca | A **faísca de 4 pontas** (estrela de 4 pontas com lados côncavos): na moeda, no escudo, no "comemorando", na aba Clube |

## 5. Ícones de interface

| Regra | Valor |
|---|---|
| Grade | `viewBox="0 0 24 24"`, área viva 20×20 (2 px de margem) |
| Traço | 2 px, `stroke-linecap="round"`, `stroke-linejoin="round"`, sem preenchimento |
| Cor | `currentColor` (a cor vem do token do componente) |
| Detalhe cheio | Permitido só em peças menores que 6 px (ponto "ao vivo", faísca no peito da camisa, losango do Meio) |
| Tamanho de uso | 24 px (abas, botões), 28 px em azulejo de 48 (negócios), nunca abaixo de 16 px |
| Espaço mínimo entre traços | 2 px (senão vira borrão a 24 px) |
| Alvo de toque | O ícone não é o alvo: o alvo tem ≥ 48×48 (`toque.minimo`) |
| Rótulo | Sempre com texto ao lado ou embaixo (aba, botão). Nunca só ícone, exceto Ajustes com `aria-label` |

Ícones coloridos (`*_cor.svg`: moeda, Legado, botão) seguem a mesma grade multiplicada (32 e 136) e
têm cores fixas da paleta.

**Funções (Topo, Selva, Meio, Atirador, Suporte):** desenhos próprios (montanha, folha, losango,
mira, escudo com coração). **Não** usam nem lembram os ícones oficiais de rota do LoL.

**Negócios:** contam a escada da lore: monitor com capelo (aulas na lan) → toldo de comércio
(patrocínio local) → camisa com faísca → câmera "ao vivo" (canal) → bandeira com confete (festa) →
galpão de teto curvo (arena no cais).

## 6. Ilustração: estilo chibi

### 6.1 Proporção

| Medida | Regra |
|---|---|
| Altura em cabeças | **2,5 cabeças** no corpo inteiro (aceito de 2 a 3). No busto (formato do jogo), a cabeça ocupa ~57% da altura da arte |
| Cabeça | Quase redonda, um pouco mais larga que alta (70 × 68 na grade de 120). Queixo curto e arredondado |
| Olhos | Grandes: cada olho ~19% da largura da cabeça (13 × 16 na grade de 120), na linha do meio da cabeça ou pouco abaixo. Íris colorida, pupila escura, **2 brilhos brancos** (um grande em cima à direita, um pequeno embaixo à esquerda) |
| Nariz | Nenhum (ou um ponto de sombra). Boca pequena, só uma linha, exceto ao comemorar |
| Bochecha | Rubor oval `#FF8A7A` a 45% |
| Corpo | Ombros arredondados, sem cintura marcada. Pescoço curto |
| Mãos e pés | Simplificados: mão = luva arredondada (palma + polegar, sem dedos separados); pé = gota arredondada, sem dedos. Tamanho ~1/3 da cabeça |
| Roupa | Camisa do clube `#1D2A45` com gola laranja e o ícone da função no peito, em `#FFA06B` |

### 6.2 Contorno e sombreamento

- **Contorno:** `#101828` (quase preto azulado, nunca preto puro), **3 px na grade de 120**, junta
  redonda, espessura única. Detalhes internos (sobrancelha, boca, óculos): 2–3 px.
- **Cel shading de 1 tom** (no máximo 2): sombra chapada, sem degradê, ~20% mais escura que a cor
  base, no lado direito e embaixo (luz de cima à esquerda). Sem brilho especular, exceto nos olhos.
- Paleta das peles: tons variados e reais, cada um com sua sombra. Sem cor "de pele" padrão.

### 6.3 Expressões básicas

| Expressão | Olhos | Sobrancelha | Boca | Extra | Quando |
|---|---|---|---|---|---|
| **feliz** (padrão) | Abertos, brilhos | Arcos suaves | Sorriso de 1 linha | — | Estado normal, Elenco |
| **focado** | Mais baixos, pálpebra reta por cima | Inclinadas para o centro | Linha reta curta | — | Partida em andamento, poder do time |
| **comemorando** | Fechados em arco (^ ^) | Altas | Aberta em "D", com língua | 3 faíscas amarelas | Vitória, subida de divisão |
| **frustrado** | Abertos | Pontas de dentro levantadas (preocupado) | Linha ondulada | Gota de suor azul | Derrota, queda (nunca humilhação: bíblia §2) |

### 6.4 O elenco (retratos em `assets/jogadores/`)

Cada um é reconhecível por **silhueta, cor e acessório** (teste de silhueta na folha de referência).

| Jogador | Função | Silhueta / acessório | Cor de assinatura | Da bíblia |
|---|---|---|---|---|
| **Pedra** | Topo | Bandana branca de padeiro com nó saindo à direita; ombros mais largos; barba por fazer | Barro `#D39B68` | Padeiro, calmo, o mais velho |
| **Rastro** | Selva | Boné verde virado para trás, rabo de cavalo cacheado alto, celular gravando na mão | Grama `#9CCB5B` | Entregadora, elétrica, grava tudo |
| **Vulto** | Meio | Capuz do moletom, franja cobrindo um olho, sorriso de canto | Mar `#4DA8F0` (reflexo do cabelo) | Talentoso, irônico, inseguro |
| **Fagulha** | Atirador | Óculos redondos, topete em forma de faísca | Céu `#8EC5FF` (lentes) | O caçula, ansioso, números |
| **Bússola** | Suporte | Headset laranja com microfone, coque cacheado, pingente de bússola | Ouro `#FFC83D` (pingente) | Voz de comando, acolhedora |

Arquivos: `jogador_<nome>_<expressao>.svg` (4 expressões × 5 = 20 arquivos, ~3,3 kB cada). Gerados
por `python3 docs/arte/gerar-chibi.py`: mudar a base no script muda todos juntos.

### 6.5 Mascote dos avisos (proposta)

**Dona Cel** (`assets/mascote/mascote_dona-cel_<expressao>.svg`): coque grisalho, óculos de leitura na
corrente, apito de técnica de várzea, cardigã na cor do Legado (`#4FD6C8`). Faz sentido na lore: ela
apresenta o jogo, explica a refundação e o Legado (bíblia §7). Uso proposto: dica A02, aviso de save
(T12), boas-vindas (T01) e etapa 1 da refundação (T09), em 48 px ao lado do texto. O Renatão (voz dos
negócios) fica para depois, se o UX quiser um rosto nos anúncios de negócio novo. Precisa de aceite
do lore e do UX (pedido P-ARTE-02).

### 6.6 Chibi e interface legível em 360 px

- **A interface é a camada de leitura; o chibi é a camada de calor.** Nenhuma informação depende do
  chibi: número, nome e resultado estão sempre em texto.
- Chibi **nunca** fica dentro de um alvo de toque nem cobre número, placar, botão ou aba. Na T02 a
  Rastro fica à esquerda do botão "Fazer live" (x 8–104; o botão ocupa x 112–248), com
  `pointer-events: none` e `aria-hidden`.
- Tamanhos: 48 px (cartão do Elenco, aviso), 96 px (destaque da T02), 160 px (capítulo, fim de split).
  Abaixo de 48 px, use o ícone da função, não o rosto.
- Ícones de UI continuam **geométricos e simples**, mas com o mesmo DNA: junta redonda, cantos
  arredondados e contorno de espessura única (§4).
- Uma ilustração grande por tela, no máximo. Na T02 o destaque é um só jogador.
- Reação ao resultado da partida: o chibi em destaque troca para "comemorando" (vitória) ou
  "frustrado" (derrota) durante o aviso A01 (3 s) e volta ao "feliz". Com "Reduzir animações", troca
  sem animação.

### 6.7 Originalidade

Todos os personagens, emblemas e ícones são **originais**, desenhados neste projeto com formas
geométricas no código. Não copiam nem lembram personagens de anime, de jogos (inclusive campeões da
Riot), mascotes de marca ou times reais. Acessórios foram escolhidos a partir da bíblia da lore
(padaria, entregas, moletom, números, voz de comando), não de referências externas. Registro em
`assets/inventario.md`.

## 7. Divisões: linguagem visual (nunca só cor)

Cada divisão tem **forma de moldura + símbolo + cor**, e o nome sempre escrito ao lado. A moldura
evolui de tampinha de várzea a escudo coroado.

| # | Divisão | Moldura | Símbolo | Cor | Arquivo |
|---|---|---|---|---|---|
| 0 | Várzea | Círculo (tampinha) com anel pontilhado | Trave e bola de campo de terra | Barro `#D39B68` | `divisao_varzea_emblema.svg` |
| 1 | Acesso | Escudo de topo reto | Seta para cima | Grama `#9CCB5B` | `divisao_acesso_emblema.svg` |
| 2 | Ascensão | Escudo de topo em ponta | Dois chevrons subindo | Mar `#4DA8F0` | `divisao_ascensao_emblema.svg` |
| 3 | Elite | Escudo largo de laterais retas | Estrela de 5 pontas cheia | Ametista `#B08CFF` | `divisao_elite_emblema.svg` |
| 4 | Continental | Escudo estreito com louros dos dois lados | Globo com meridianos | Prata `#CFD8E8` | `divisao_continental_emblema.svg` |
| 5 | Mundial | Escudo com coroa de 3 pontas | Taça + faísca laranja no topo | Farol `#FFC83D` | `divisao_mundial_emblema.svg` |

Uso: chip da T02 (24 px + nome + multiplicador, borda 2 px na cor), trilha da T08 (48 px), T06 e
capítulo (96–160 px). Divisão ainda não alcançada na T08: emblema em `#6B7FA8` com cadeado e o nome,
não escondido.

## 8. Movimento

Durações do UX (`tokens.md` §7) mantidas; curvas em `tokens-marca.md` §6.

| Regra | Valor |
|---|---|
| Entrar | `curva.entrar` (ease-out) |
| Sair | `curva.sair` (ease-in), 75% da duração de entrada |
| Celebração | `curva.quique`: um pulo leve (escala 1 → 1,08 → 1), uma vez só |
| O que anima | Só `transform` e `opacity` (ADR-002, 60 fps) |
| Partículas | No máximo 12 por evento, vida ≤ 800 ms, só em celebração |
| Piscar | Nunca mais de 3 vezes por segundo |
| Personagem | Chibi não fica animado em loop. Pode "respirar" (escala 1 → 1,02, 3 s) só na T02 e só sem "Reduzir animações" |
| Reduzir animações | Segue `prefers-reduced-motion` e o ajuste da T14: sem deslocamento, sem partículas, sem quique; só esmaecer de 100 ms ou troca direta. O valor final aparece na hora |

## 9. Feedback do loop idle

Cada feedback tem versão normal e versão reduzida. O crédito acontece **antes** da animação (o valor
real já está no save, `tokens.md` §7).

| Evento | Normal | Reduzida |
|---|---|---|
| **Toque em "Fazer live"** | Botão encolhe a 0,96 (100 ms). "+1,2" com moedinha sobe 32 px e some (400 ms, ease-out), a partir do ponto tocado. No máx. 5 por segundo na tela (RN-005) | Botão encolhe sem deslocamento; o número do ouro muda direto |
| **Renda contínua** | O número do ouro atualiza a 4–10 Hz, sem animação. Nada pisca | Igual |
| **Compra** | Botão 0,96; a moeda do botão "voa" até o ouro (200 ms) e o ouro dá um pulso de escala 1,04 | Sem voo; o número muda |
| **Vitória (A01)** | Aviso entra de cima (200 ms), borda verde, "V ✓", prêmio com moeda; o chibi em destaque troca para "comemorando" | Esmaece; chibi troca sem animação |
| **Derrota (A01)** | Igual, borda `#FF7A8A`, "D ✕", sem prêmio; chibi "frustrado". Tom de aprendizado, sem tremer a tela | Igual, sem movimento |
| **Subida de divisão (T06)** | Emblema novo cresce de 0,6 a 1 com `curva.quique` (1200 ms), 12 faíscas laranja e amarelas, os 5 chibis "comemorando", o multiplicador "×2 → ×4" conta. Título em Archivo Black | Emblema e texto aparecem com esmaecer; sem faíscas |
| **Queda de divisão** | Emblema da divisão nova entra sem quique; chibis "focado" (não "frustrado": "a gente já conhece o caminho de volta") | Igual, sem movimento |
| **Refundação (T11)** | Tela escurece até o azul noite; a chama turquesa do Legado sobe ao centro e "acende" o escudo da Faísca (1200 ms); o novo Legado conta com `curva.linear`; Dona Cel "feliz" | Esmaece direto para o resultado |
| **Retorno offline (T13)** | Tela cheia calma: escudo do clube com o cais ao fundo, ouro conta de 0 até o valor (400 ms), splits como casas V/D em sequência (50 ms cada, até 14). Um botão "Receber" | Valores finais direto |
| **Marco de 50 do negócio** | O ícone do negócio ganha um anel laranja por 1 s; "×2" pula uma vez | Anel sem animação por 1 s |

## 10. Ícone do app e splash

| Arquivo mestre | Uso |
|---|---|
| `assets/app/app_icone_padrao.svg` | Ícone "any" (quadrado arredondado com o escudo) e favicon SVG |
| `assets/app/app_icone_maskable.svg` | Ícone "maskable" do Android: fundo até a borda, conteúdo dentro do círculo seguro de 80% |
| `assets/app/app_icone_mono.svg` | Ícone monocromático (Android 13+ temático), preto sobre transparente |

**PNGs que o `nexus-tech` gera a partir dos mestres** (para `public/`; ex.: `rsvg-convert -w N -h N`):

| Arquivo em `public/` | Tamanho | Origem | Para quê |
|---|---|---|---|
| `favicon.svg` | vetor | padrão | Aba do navegador |
| `favicon-32.png` | 32×32 | padrão | Navegadores sem SVG |
| `apple-touch-icon.png` | 180×180 | **maskable** (iOS arredonda sozinho; não usar o com cantos) | Tela de início do iOS |
| `icon-192.png` | 192×192 | padrão | Manifesto, `purpose: any` |
| `icon-512.png` | 512×512 | padrão | Manifesto, `purpose: any` (e splash do Android) |
| `icon-maskable-192.png` | 192×192 | maskable | Manifesto, `purpose: maskable` |
| `icon-maskable-512.png` | 512×512 | maskable | Manifesto, `purpose: maskable` |
| `icon-mono-512.png` | 512×512 | mono | Manifesto, `purpose: monochrome` (opcional) |

**Splash:** no Android, a PWA monta a splash sozinha com `background_color` `#0B1220`, o ícone de 512 e
o nome. No iOS, sem imagens `apple-touch-startup-image` a abertura é uma tela da cor de fundo; como o
jogo abre a T00 (Carregando) com o escudo em segundos, **não** recomendo gerar as ~10 imagens por
resolução de iPhone no MVP (mais peso e manutenção do que valor). Se o PO quiser, o mestre da splash é o
escudo de 160 px centrado sobre `#0B1220`.

## 11. Orçamento de peso (combinar com o `nexus-tech`, pedido P-ARTE-03)

| Item | Limite | Medido hoje |
|---|---|---|
| **Arte da tela principal (T02)**, todos os SVG que ela usa, sem compressão | **≤ 40 kB** | 15,7 kB (2,5 kB com gzip) no pior caso: 16 arquivos (3 expressões da Rastro, 2 emblemas, moeda em 2 versões, botão em 2 versões, 1 negócio, 4 abas, ajustes e cadeado) |
| Arte + fontes da 1ª carga da T02 | **≤ 150 kB** | ~16 kB + fontes (estimativa ~120 kB, a medir) |
| Qualquer outra tela (só arte) | ≤ 60 kB | — |
| Um ícone de linha | ≤ 1 kB | 256–506 B |
| Um retrato chibi | ≤ 5 kB | 3,0–3,9 kB |
| Um emblema | ≤ 2 kB | 0,35–0,7 kB |
| Raster (PNG/WebP) | Só ícone do app, capturas e, no futuro, cenário pintado. WebP, ≤ 80 kB por imagem | Nenhum no jogo |

Os SVGs são escritos à mão ou gerados por script, já sem metadados de editor. O `nexus-tech` pode
embutir ícones de linha como componentes (herdam `currentColor`) e servir os coloridos como arquivo.

## 12. Faça e não faça

| Faça | Não faça |
|---|---|
| Texto escuro sobre laranja, amarelo, verde e vermelho | Texto branco ou areia sobre o laranja da ação (2,6:1 e 2,3:1) |
| Uma ilustração chibi por tela, fora dos alvos | Chibi atrás de número ou dentro de botão |
| Cor + forma + palavra para resultado, chance e divisão | Diferenciar V/D, divisão ou chance só pela cor |
| Contorno `#101828` de espessura única no chibi | Contorno preto puro, traço variável "de pincel", degradê na pele |
| Faísca de 4 pontas como motivo de comemoração e marca | Raios, explosões e telas tremendo em derrota |
| Ícone de linha em `currentColor`, traço 2 | Ícone com preenchimento pesado ou traço 1 (some a 24 px) |
| Inter com `tabular-nums` em todo número | Archivo Black em número que muda |
| Laranja para a ação principal, uma por área | Laranja como decoração ou como "erro" |
| `cor.estado.perigo` só na T10 | Vermelho para "sem ouro" ou para rival |
| Fontes empacotadas no build | Google Fonts ou qualquer CDN (C9) |
| Assets originais, com linha no inventário | Imagem, logo, ícone de rota ou campeão da Riot; logo de time real; personagem que lembre anime, jogo ou mascote conhecido |

Exemplo certo e errado no mesmo componente (botão de compra):
- Certo: fundo `#FF7A2F`, "Comprar" + moeda + "173" em `#0B1220`, raio 10, sombra de base.
  Sem ouro: fundo `#26324D`, borda tracejada, "Faltam 15" em `#C9D2E3`.
- Errado: fundo cinza só com o texto mais claro (parece quebrado e não diz o que fazer); ou fundo
  laranja com texto branco.

## 13. Arquivos e nomes

Formato: `categoria_nome_variante.svg`, tudo minúsculo, sem acento, palavras com hífen.
Variantes: `linha` (traço, `currentColor`), `cor` (cores fixas), `emblema`, `padrao`, `mono`,
`maskable` e, nos personagens, a expressão (`feliz`, `focado`, `comemorando`, `frustrado`).

```
assets/
  app/        app_icone_{padrao,maskable,mono}.svg
  divisoes/   divisao_<divisao>_emblema.svg          (6)
  funcoes/    funcao_<funcao>_linha.svg              (5)
  interface/  aba_<aba>_linha.svg (4), interface_{ajustes,cadeado}_linha.svg,
              botao_fazer-live_{cor,linha}.svg
  jogadores/  jogador_<nome>_<expressao>.svg         (20)
  marca/      escudo_faisca_{padrao,mono}.svg
  mascote/    mascote_dona-cel_<expressao>.svg       (4)
  negocios/   negocio_<negocio>_linha.svg            (6)
  recursos/   recurso_{ouro,legado}_{cor,linha}.svg
  inventario.md
```
