# Tokens de marca — Nexus Idle v0.1 (NX-005)

> Dono: `nexus-arte`. Preenche os valores `[ARTE]` de `docs/ux/tokens.md` (v0.1, `nexus-ux`), que
> continua sendo a fonte dos **nomes e funções**. Este arquivo não muda nomes; só dá valores.
> Contraste de cada par conferido por `node docs/arte/contraste.mjs` (tabela no `guia-visual.md` §2).
> Formato pronto para CSS: o nome da variável é o token com `.` trocado por `-` (`cor.texto.principal`
> → `--cor-texto-principal`). Exemplo aplicado: `docs/arte/mockup-principal.html`.

## 1. Paleta base (só para referência; componente nunca usa direto)

| Nome | Valor | Papel |
|---|---|---|
| `noite-950` | `#0B1220` | Azul noite do cais: fundo |
| `noite-900` | `#141E33` | Superfície |
| `noite-800` | `#1D2A45` | Superfície alta, camisa do clube |
| `noite-700` | `#2B3B5E` | Divisor, trilho |
| `noite-500` | `#6B7FA8` | Borda que separa alvos |
| `nevoa-300` | `#B4C0D8` | Texto secundário |
| `areia-50` | `#F5F0E6` | Texto principal (branco quente, papel de cartaz) |
| `brasa-600` | `#E8611A` | Laranja brasa pressionado |
| `brasa-500` | `#FF7A2F` | **Laranja brasa: cor da marca e da ação** |
| `brasa-300` | `#FFA06B` | Brasa como texto sobre fundo escuro |
| `farol-400` | `#FFC83D` | Luz do farol: ouro |
| `farol-200` | `#FFE08A` | Foco |
| `mare-400` | `#4FD6C8` | Maré: Legado |
| `contorno` | `#101828` | Contorno das ilustrações chibi |

## 2. Cores semânticas (`docs/ux/tokens.md` §5)

| Token | Valor | Observação |
|---|---|---|
| `cor.fundo.app` | `#0B1220` | Pode levar o brilho radial `radial-gradient(120% 60% at 50% 100%, #162443, transparent 60%)` só na T02 (luz do cais atrás do botão) |
| `cor.fundo.superficie` | `#141E33` | |
| `cor.fundo.superficie-alta` | `#1D2A45` | |
| `cor.fundo.sobreposicao` | `rgba(5, 9, 18, 0.72)` | Véu atrás de painel/modal |
| `cor.texto.principal` | `#F5F0E6` | |
| `cor.texto.secundario` | `#B4C0D8` | ≥ 7,8:1 nos três fundos |
| `cor.texto.sobre-acao` | `#0B1220` | Texto escuro sobre laranja (7,2:1). Texto claro sobre laranja **não** passa AA |
| `cor.borda.sutil` | `#6B7FA8` | ≥ 3:1: pode separar alvos |
| `cor.borda.foco` | `#FFE08A` | Anel de 2 px com 2 px de deslocamento (nunca colado no laranja: 2,0:1) |
| `cor.acao.primaria` | `#FF7A2F` | Sombra de base `0 3px 0 #A8440F` (botão "de cartaz") |
| `cor.acao.primaria-pressionada` | `#E8611A` | Com escala 0,96 e sombra `0 1px 0 #A8440F` |
| `cor.acao.secundaria` | `#1D2A45` | Com borda 2 px `#6B7FA8` e texto `cor.texto.principal` |
| `cor.acao.desabilitada` | `#26324D` | Borda tracejada 2 px `#6B7FA8`; texto `#C9D2E3` (8,4:1) |
| `cor.acao.toque` | `#FF7A2F` | Arte própria: `assets/interface/botao_fazer-live_cor.svg` |
| `cor.recurso.ouro` | `#FFC83D` | Ícone `recurso_ouro_*` |
| `cor.recurso.legado` | `#4FD6C8` | Ícone `recurso_legado_*` |
| `cor.resultado.vitoria` | `#5BD38A` | Casa cheia com letra **V** em `#0B1220` |
| `cor.resultado.derrota` | `#FF7A8A` | Casa cheia com letra **D** em `#0B1220` |
| `cor.resultado.neutro` | `#B4C0D8` | Casa vazia: borda tracejada `#6B7FA8` |
| `cor.chance.favorito` | `#5BD38A` | Sempre com a palavra |
| `cor.chance.equilibrado` | `#8EC5FF` | Sempre com a palavra |
| `cor.chance.azarao` | `#F7B977` | Âmbar, não vermelho: azarão não é "ruim" |
| `cor.estado.aviso` | `#FFD166` | Com ⚠ |
| `cor.estado.perigo` | `#FF5D5D` | Só T10. Botão: fundo `#FF5D5D`, texto `#0B1220` (6,2:1) |
| `cor.estado.info` | `#8EC5FF` | Com ⓘ |
| `cor.estado.novidade` | `#FFA06B` | Ponto + texto |
| `cor.progresso.trilho` | `#2B3B5E` | Decorativo (o número vai ao lado) |
| `cor.progresso.preenchido` | `#FF7A2F` | 4,3:1 sobre o trilho |

### Tokens novos propostos (pedido P-ARTE-01 ao `nexus-ux`)

| Token | Valor | Por quê |
|---|---|---|
| `cor.texto.destaque` | `#FFA06B` | Texto de marca ("Acende, Faísca!", rótulo da função no Elenco). O laranja da ação também passaria (5,5:1 no pior fundo), mas a versão clara lê melhor em 12–14 px (≥ 7,1:1) e separa "texto de marca" de "isto é um botão" |
| `cor.texto.sobre-desabilitada` | `#C9D2E3` | O texto "Faltam X" precisa de ≥ 4,5:1 sobre `cor.acao.desabilitada` |
| `cor.borda.divisor` | `#2B3B5E` | Divisor decorativo que **não** separa alvos (o `borda.sutil` fica para os que separam) |
| `cor.divisao.varzea` | `#D39B68` | Barro da quadra |
| `cor.divisao.acesso` | `#9CCB5B` | Grama do campo |
| `cor.divisao.ascensao` | `#4DA8F0` | Mar do cais |
| `cor.divisao.elite` | `#B08CFF` | Ametista |
| `cor.divisao.continental` | `#CFD8E8` | Prata |
| `cor.divisao.mundial` | `#FFC83D` | Luz do farol |

As cores de divisão vão só em **borda de chip e emblema**; o nome da divisão é sempre escrito em
`cor.texto.principal`.

## 3. Raio (`docs/ux/tokens.md` §3)

| Token | Valor | Motivo |
|---|---|---|
| `raio.nenhum` | `0` | |
| `raio.pequeno` | `6px` | Casas V/D, pílulas |
| `raio.medio` | `10px` | Botões, cartões, ícone em azulejo |
| `raio.grande` | `20px` | Painéis (só cantos de cima) |
| `raio.total` | `50%` (ou `999px` em pílula) | Botão de toque, chip de divisão, avatar chibi |

Cantos arredondados combinam com a família chibi (formas redondas, nenhuma ponta seca).

## 4. Elevação (`docs/ux/tokens.md` §6)

No tema escuro a elevação vem primeiro do **tom** (app → superfície → superfície alta); a sombra só reforça.

| Token | Valor CSS (`box-shadow`) |
|---|---|
| `elevacao.0` | `none` |
| `elevacao.1` | `inset 0 1px 0 rgba(245, 240, 230, 0.05), 0 2px 6px rgba(0, 0, 0, 0.35)` |
| `elevacao.2` | `0 -1px 0 #2B3B5E, 0 -6px 16px rgba(0, 0, 0, 0.45)` (barra de abas, seletor de lote) |
| `elevacao.3` | `0 0 0 1px #2B3B5E, 0 10px 28px rgba(0, 0, 0, 0.55)` (painéis, modais, avisos) |

## 5. Tipografia (`docs/ux/tokens.md` §4)

| Token | Valor CSS |
|---|---|
| `fonte.texto` | `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif` |
| `fonte.destaque` | `"Archivo Black", "Arial Black", "Inter", system-ui, sans-serif` |
| `fonte.numero` (novo, P-ARTE-01) | igual a `fonte.texto`, com `font-variant-numeric: tabular-nums` |

Pesos usados de Inter: 400 (corpo, apoio), 600 (rótulo, subtítulo), 700 (título), 800 (número herói).
`texto.numero.heroi` e `texto.numero.grande` usam Inter 800, **nunca** Archivo Black (ela não tem
algarismos tabulares). Archivo Black: título de tela cheia (T06, T07, T11), nome do botão "Fazer live",
nome de jogador no cartão do Elenco. Mínimo de 17 px nela.

## 6. Movimento (`docs/ux/tokens.md` §7, durações do UX mantidas)

| Token | Valor |
|---|---|
| `curva.entrar` | `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out) |
| `curva.sair` | `cubic-bezier(0.4, 0, 1, 1)` (ease-in) |
| `curva.quique` (novo) | `cubic-bezier(0.34, 1.56, 0.64, 1)`: leve passada e volta, o "pulo" chibi; só em celebração e na moeda que chega |
| `curva.linear` | `linear` (só na contagem de números) |

## 7. Ilustração (novos, P-ARTE-01)

| Token | Valor |
|---|---|
| `ilustracao.contorno` | `#101828`, 3 px na grade de 120 px (2,5% da altura do busto) |
| `ilustracao.avatar.p` | 48 px (cartão do Elenco, aviso) |
| `ilustracao.avatar.m` | 96 px (T02, destaque) |
| `ilustracao.avatar.g` | 160 px (capítulo, fim de split) |

## 8. Manifesto da PWA

| Campo | Valor |
|---|---|
| `theme_color` | `#0B1220` |
| `background_color` | `#0B1220` (a splash do Android usa esta cor + o ícone) |
