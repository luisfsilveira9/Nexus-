# Textos do MVP — telas (NX-019)

> Dono: `nexus-lore`. Responde ao pedido P-UX-14 (b): todos os `[LORE: …]` dos fluxos
> (`docs/ux/fluxos/`), dos wireframes (`docs/ux/wireframes/`) e do `docs/ux/onboarding.md`.
> Base: RN v0.3.1 (RN-018, RN-019, RN-020), limites de `docs/ux/tokens.md` §10, bíblia v0.2.
> Capítulos completos (blocos do prólogo, capítulos 1–5, refundação e epílogo): `temporadas/T01.md`.
> Este arquivo é a fonte para o `nexus-tech` montar `src/content/pt-BR/` na NX-015. As chaves seguem
> `tela.elemento.estado` e não devem mudar depois de publicadas.

## Como ler as tabelas

- **Car.** = caracteres como o jogador vê (letra acentuada = 1), com espaços e pontuação.
- Variáveis contadas no **pior caso**: `{clube}` = 20 caracteres (RN-019, RN-020); `{v}` (vitórias no
  split) = 1 algarismo; `{p}` (partidas que faltam) = 2 algarismos (até 14).
- Ícones e prefixos que a interface já põe (↑, ⓘ, ›) estão no texto só quando o wireframe os
  mostra dentro da frase. Atribuição ("— Rastro") não faz parte da chave; a coluna "com atribuição"
  mostra que ela também cabe.
- Contagem feita à mão. O teste de limites do QA (CT-820) confirma.
- Nenhum texto usa número de economia (multiplicador, renda, Legado). "10 vitórias", "14 partidas" e
  "4 vitórias" são regras do split (RN-010).

---

## T01 · Boas-vindas (prólogo)

Blocos completos em `temporadas/T01.md`, "Prólogo".

| Chave | Texto | Limite | Car. |
|---|---|---|---|
| `t01.titulo` | A sala dos fundos | 26 (título de capítulo) | 17 |
| `t01.bloco.1` | A Lan do Farol vai fechar: conta atrasada, máquina velha, ventilador rangendo. Dona Cel apaga metade das luzes e chama você para a sala dos fundos. | 280 | 147 |
| `t01.bloco.2` | Lá dentro, cinco clientes de toda noite jogam juntos, sem nome de time.⏎— Eles são bons. Só falta alguém cuidar deles. | 280 | 118 |
| `t01.bloco.3` | Ela tira uma chave do bolso do cardigã.⏎— Eu podia vender as máquinas. Prefiro apostar. Time bom se faz no barro. | 280 | 113 |
| `t01.bloco.4` | Ela põe a chave na sua mão.⏎— Transforma essa turma num time de verdade. {clube} começa hoje, na Várzea. | 280 | 117 |
| `t01.regra` | O time joga sozinho. Você cuida dos negócios e do elenco. | 280 (junto com o bloco 4) | 57 (bloco 4 + regra: 175) |

⏎ = quebra de linha (conta 1). Total: 4 blocos (limite 4), 99 palavras.

---

## T02 · Clube (tela principal)

### Dicas de onboarding (A02)

| Chave | Quando | Texto | Limite | Car. |
|---|---|---|---|---|
| `t02.dica.d1` | Clube novo, aponta "Próxima compra" | Compre aulas na lan. Elas rendem ouro sozinhas. | 60 | 47 |
| `t02.dica.d2` | Depois da 1ª compra, aponta "Fazer live" | Faça live: cada toque rende ouro na hora. | 60 | 41 |
| `t02.dica.d3` | Antes da 1ª partida, na faixa da meta + "Elenco •" | A 1ª partida vem aí. Suba um jogador no Elenco › | 50 (aparece na faixa da meta) | 48 |

- A D3 não cita "40 s": o onboarding proíbe dica que fale em tempo acabando (`onboarding.md`, regra 6).
- A D3 é diferente da meta "azarão" de propósito: no onboarding ela fala da 1ª partida; depois, a
  meta normal assume.

### Meta atual (faixa da T02)

Ordem de prioridade: `docs/ux/fluxos/NX-012.md`. Limite: 50 (quebra em 2 linhas).

| Chave | Quando (prioridade do NX-012) | Texto | Car. (pior caso) |
|---|---|---|---|
| `t02.meta.onboarding_compra` | Onboarding, junto com a D1 | Primeira meta: fazer o clube render ouro | 40 |
| `t02.meta.onboarding_live` | Onboarding, junto com a D2 | Junte ouro para a próxima compra | 32 |
| `t02.meta.onboarding_elenco` | Onboarding, D3 | = `t02.dica.d3` | 48 |
| `t02.meta.refundacao_disponivel` | 2 · refundação liberada (1ª vez na run) | Refundação disponível na Jornada › | 34 |
| `t02.meta.azarao` | 3 · chance < 40% e ninguém subiu de nível | Seu time é azarão. Suba um jogador no Elenco › | 46 |
| `t02.meta.subir` | 4 · ainda dá para subir | Vença 10 para subir: {v}/10 · faltam {p} partidas | 46 |
| `t02.meta.subir_um` | 4 · falta 1 partida | Vença 10 para subir: {v}/10 · falta 1 partida | 43 |
| `t02.meta.subida_garantida` | 4b · já tem 10 vitórias e o split não acabou (novo, ver pedido 6) | Subida garantida! Faltam {p} partidas no split | 44 |
| `t02.meta.subida_garantida_um` | 4b · falta 1 partida | Subida garantida! Falta 1 partida no split | 42 |
| `t02.meta.titulo` | 5 · Mundial, ainda dá para o título | Vença 10 pelo título: {v}/10 · faltam {p} partidas | 47 |
| `t02.meta.titulo_um` | 5 · falta 1 partida | Vença 10 pelo título: {v}/10 · falta 1 partida | 44 |
| `t02.meta.titulo_garantido` | 5b · Mundial com 10 vitórias e o split não acabou (novo, ver pedido 6) | Título garantido! Faltam {p} partidas no split | 44 |
| `t02.meta.titulo_garantido_um` | 5b · falta 1 partida | Título garantido! Falta 1 partida no split | 42 |
| `t02.meta.evitar_queda` | 6 · não dá mais para 10 e ainda dá para cair | Para não cair: chegue a 4 vitórias (tem {v}) | 42 |
| `t02.meta.proximo_split` | 7 · Várzea sem chance de subir (e, se o UX aceitar, qualquer divisão sem subir nem cair) | Fortaleça o time para o próximo split | 37 |
| `t02.meta.titulo_proximo_split` | 8 · Mundial sem chance de título e sem risco de cair | O título fica para o próximo split | 34 |

- Nas metas 4b e 5b, `{p}` tem no máximo 1 algarismo (já houve 10 partidas). Nas outras, o pior
  caso usa `{p}` = 14.
- O "4" da meta 6 vem da RN-010 (cai com 3 ou menos). Se a regra mudar, vira constante.
- Nenhuma meta diz que algo "acaba" ou "expira" (NX-012).

### Resultado da 1ª partida (A01, linha extra)

| Chave | Texto | Limite | Car. |
|---|---|---|---|
| `a01.primeira_partida.regra` | Vitória dá ouro. Com 10 vitórias em 14, o clube sobe. | 60 (fala de evento) | 53 |

- Substitui o rascunho "Vitória dá 60× sua renda/s…": o "60×" é número de economia. O valor do
  prêmio já aparece no próprio A01 ("+720").

### Fala de retorno (A03): uma por divisão

Aparece **só ao subir** de novo a uma divisão cujo capítulo já foi visto (RN-018). Some em 4 s ou
com um toque. Limite: 60. O wireframe põe "↑ " antes do texto (2 caracteres).

| Chave | Divisão | Quem | Texto | Car. | Com "↑ " e atribuição |
|---|---|---|---|---|---|
| `a03.fala.acesso` | Acesso | Rastro | Acesso de novo! Gente, a placa ainda tá torta! | 46 | 57 |
| `a03.fala.ascensao` | Ascensão | Prof | Ascensão de novo. Revisão: vocês já passaram aqui. | 50 | 59 |
| `a03.fala.elite` | Elite | Vulto | De volta à Elite. Dessa vez, sem provar nada. | 45 | 55 |
| `a03.fala.continental` | Continental | Bússola | Continental de novo. Mala pronta, time junto. | 45 | 57 |
| `a03.fala.mundial` | Mundial | Pedra | Mundial de novo. Forno quente. | 30 | 40 |

- Não há fala para a Várzea: ninguém **sobe** para a Várzea.
- Coerência: cada personagem já apareceu no capítulo daquela divisão (Prof no 2, Vulto no 3 etc.),
  então a fala nunca vem antes de quem fala ter sido apresentado. O campo "quem" serve para o
  avatar chibi, se o UX quiser usá-lo (pedido 6).

---

## T04 · Elenco

| Chave | Texto | Limite | Car. |
|---|---|---|---|
| `t04.faixa.primeira_vez` | Mais poder que o rival, mais chance. Vitórias sobem o clube. | 60 (proposta; ver pedido 6) | 60 |

O tokens.md §10 não tem limite para a faixa de 1ª vez. Usei o da dica de onboarding (60), porque
as duas são da mesma família (ⓘ, `cor.estado.info`). O texto está **no limite**; se o UX fixar
menos, a versão curta é "Mais poder, mais chance. Vitórias sobem o clube." (48).

### Frase de cada jogador (toque no nome)

Limite: 60 (fala de 1 linha; o §10 não tem linha própria para ela). Jeito de falar da bíblia §6.

| Chave | Jogador | Texto | Car. |
|---|---|---|---|
| `t04.frase.pedra` | Pedra (Topo) | Rota de cima? Eu seguro. | 24 |
| `t04.frase.rastro` | Rastro (Selva) | Gente, eu conheço cada beco desse mapa! | 39 |
| `t04.frase.vulto` | Vulto (Meio) | Meio é meu. Já vi esse jogo. | 28 |
| `t04.frase.fagulha` | Fagulha (Atirador) | Tipo… eu fiz a conta três vezes. Tá boa, né? | 44 |
| `t04.frase.bussola` | Bússola (Suporte) | Respira. Ninguém joga sozinho aqui. | 35 |

---

## T06 · Fim do split: falas de título (Zeca Trovão)

Limite: 60 (fala na T06). A atribuição " — Zeca Trovão" tem 14 caracteres.

| Chave | Quando | Texto | Car. | Com atribuição |
|---|---|---|---|---|
| `t06.fala.titulo_primeiro` | 1º título (antes do epílogo) | Que campanha, {clube}! | 35 | 49 |
| `t06.fala.titulo_repetido.1` | 2º título em diante | Acendeu de novo! Mais uma estrela no peito! | 43 | 57 |
| `t06.fala.titulo_repetido.2` | 2º título em diante | {clube} de novo no topo do mundo! | 46 | 60 |
| `t06.fala.titulo_repetido.3` | 2º título em diante | Perdi a conta! Mais um título mundial! | 38 | 52 |

- Do 2º título em diante: o tech alterna as 3 em ordem (1, 2, 3, 1…), guardando no save o índice da
  última, para não repetir duas vezes seguidas. Sem sorteio global no motor (ADR-002).
- Todas sem gênero gramatical para o clube ("campeão/campeã" foi evitado de propósito).

---

## T07 / T08 · Títulos dos capítulos

Limite: 26 (T07 quebra em 2 linhas; a lista da T08 usa reticências).

| Chave | Capítulo | Título | Car. |
|---|---|---|---|
| `capitulo.prologo.titulo` | Prólogo | A sala dos fundos | 17 |
| `capitulo.acesso.titulo` | 1 · Acesso | A placa nova | 12 |
| `capitulo.ascensao.titulo` | 2 · Ascensão | O uniforme dos outros | 21 |
| `capitulo.refundacao.titulo` | Refundação | Lembrar com mais força | 22 |
| `capitulo.elite.titulo` | 3 · Elite | A planilha e o barro | 20 |
| `capitulo.continental.titulo` | 4 · Continental | Longe de casa | 13 |
| `capitulo.mundial.titulo` | 5 · Mundial | O farol aceso | 13 |
| `capitulo.epilogo.titulo` | Epílogo · Temporada 1 | Quantas vezes for preciso | 25 |

- Na lista da T08, "Refundação · Lembrar com mais força" (35) e "Epílogo · Quantas vezes for
  preciso" (35) passam de 26 e terminam em reticências, como o §10 prevê. Se o UX preferir sem
  corte, a T08 pode mostrar só o título.
- Blocos de cada capítulo: chaves `capitulo.<id>.bloco.<n>`, texto em `temporadas/T01.md`.

---

## T11 · Clube refundado

| Chave | Texto | Limite | Car. |
|---|---|---|---|
| `t11.titulo` | Clube refundado | 26 (título; sem linha própria no §10) | 15 |

A fala da Dona Cel na T11 ("Mais uma refundação. O bairro lembra de tudo.", 45) já está no fluxo
NX-014 e continua valendo.

---

## T13 · Enquanto você esteve fora

| Chave | Quando | Texto | Limite | Car. (pior caso) |
|---|---|---|---|---|
| `t13.apoio.primeira_vez` | 1º retorno da vida | Fora do jogo, o clube rende {pct_offline} da renda e joga até subir ou cair. Contamos até {teto_offline} fora. | 120 (texto de apoio) | 89 (com "50%" e "8 h") |
| `t13.apoio.primeira_vez_sem_numero` | Reserva, se o PO não aprovar as variáveis | Fora do jogo, o clube rende menos e segue jogando até subir ou cair. | 120 | 68 |

- `{pct_offline}` e `{teto_offline}` saem das constantes das RN (RN-011: fator 0,5 e limite de 8 h),
  formatadas pelo tech ("50%", "8 h"). Assim o texto não envelhece se o balanceamento mudar (pedido 7).
- A fala da Bússola ("A gente jogou {v}-{d} enquanto você esteve fora.") continua igual. Pior caso,
  com 320 partidas ("180-140"): 48 caracteres. Só deve aparecer quando houve partida.

---

## T00 · T12 · A05 · Carregar e save (NX-025, revisão do `src/content/textos.ts`)

Revisão do pedido T-02. As chaves abaixo são as do `textos.ts` (objeto TypeScript, não
`tela.elemento.estado`), e não mudam. Limites: `tokens.md` §10, "Mensagem de erro/validação"
(título ≤ 60, apoio ≤ 120). Pior caso: `{quando}` = "hoje às 14:32" (13) ou "há 59 min" (9); `{n}`
= 3 algarismos. Os números (`{ouro}`, `{legado}`) vêm das constantes, nunca escritos no texto.

### Revisados sem mudança (vieram do UX; voz e limites conferidos)

| Chave | Texto | Car. |
|---|---|---|
| `carregando.titulo` | Carregando o clube… | 19 |
| `carregando.demorado` | Ainda carregando… | 17 |
| `recuperado.titulo` | Recuperamos seu clube | 21 |
| `recuperado.corpo` | Não deu para ler o último save. Carregamos a cópia anterior, de {quando}. | 78 |
| `recuperado.perda` | O que aconteceu depois disso pode ter se perdido. O resto está aqui. | 68 |
| `ilegivel.titulo` | Não conseguimos abrir seu save | 30 |
| `ilegivel.corpo` | As duas cópias do save não puderam ser lidas. Nada foi apagado. Tente de novo ou comece um clube novo. | 102 |
| `ilegivel.apoio` | O save que não abriu fica guardado para exportar. | 49 |
| `ilegivel.tituloDeNovo` | Ainda não abriu | 15 |
| `confirmarNovo.titulo` | Começar um clube novo? | 22 |
| `confirmarNovo.corpo` | Você começa na Várzea, com {ouro} de ouro e Legado {legado}. | 50 |
| `confirmarNovo.apoio` | O save que não abriu continua guardado. Dá para exportá-lo depois em Ajustes. | 77 |
| `semEspaco.texto` | Sem espaço para salvar. Seu último save ({quando}) está seguro. Libere espaço no aparelho. | 90 |
| Botões e rótulos | Continuar · Tentar de novo · Começar clube novo · Exportar o save que não abriu · Texto do save que não abriu · Fechar · Cancelar · Fechar aviso | ≤ 18 por linha (o de exportar quebra em 2) |
| `principal.*` | ouro · +{valor}/s · Fazer live · +{valor} por toque · Próxima compra · Comprar · Faltam {valor} · tem {n} · +{renda}/s cada | — |
| `negocios` | Os 6 nomes de `nomes-do-jogo.md` §3, na ordem | ≤ 16 |
| `tempo.*` | hoje às {hora} · {data}, {hora} · agora · há {n} s · há {n} min · há {n} h | — |

### Mudou

| Chave | Antes | Agora | Car. | Por quê |
|---|---|---|---|---|
| `ilegivel.corpoDeNovo` | Tentamos de novo ({n}ª vez) e o save continua ilegível. Nada foi apagado. Se quiser pedir ajuda, exporte o save que não abriu. | Tentamos de novo ({n}ª vez) e o save ainda não abriu. Nada foi apagado. Para pedir ajuda, exporte esse save. | 108 | Tinha 124 com "2ª" e passava do limite de 120. "Ilegível" sai: é palavra de sistema; "não abriu" é a mesma do título |

### Novos (faltavam; a tela já cai nesses casos)

| Chave | Quando | Texto | Car. |
|---|---|---|---|
| `ilegivel.tituloVersaoNova` | T12b com `versaoFutura` (CT-511) | Seu save é de uma versão mais nova | 34 |
| `ilegivel.corpoVersaoNova` | idem | Este aparelho abriu uma versão antiga do jogo. Nada foi apagado. Feche o jogo e abra de novo para atualizar. | 109 |
| `ilegivel.apoioVersaoNova` | idem | Seu clube continua guardado. Ele abre quando o jogo atualizar. | 62 |
| `semEspaco.textoSemSave` | Sem espaço e sem nenhum save válido (T12c que não conseguiu guardar) | Sem espaço para salvar. Nada foi apagado. Libere espaço no aparelho. | 67 |
| `semEspaco.falha` | A05 por falha que não é de espaço | Não deu para salvar agora. Seu último save ({quando}) está seguro. Tentamos de novo em instantes. | 102 |
| `semEspaco.falhaSemSave` | idem, sem save válido | Não deu para salvar agora. Nada foi apagado. Tentamos de novo em instantes. | 75 |
| `armazenamento.naoPersistenteTitulo` | `persist()` recusado (CT-540) | O navegador pode apagar seu save | 32 |
| `armazenamento.naoPersistenteApoio` | idem | Pôr o jogo na tela inicial ajuda a protegê-lo. Exportar uma cópia em Ajustes também ajuda. | 90 |

- `semEspaco.texto` com `{quando}` vazio mostrava "Seu último save () está seguro": quando não há
  save válido, a tela deve usar `textoSemSave` (ou `falhaSemSave`).
- "Tentamos de novo em instantes" vale porque o jogo grava de novo a cada 10 s (relatório NX-015);
  se isso mudar, o texto muda.
- Na versão mais nova, o texto não sugere "Começar clube novo": isso gravaria por cima de um save
  mais novo (ver pendência no relatório da NX-025).

---

## Conferência: `[LORE: …]` encontrados e onde foram resolvidos

Sem acesso a busca por texto nesta sessão, os arquivos foram lidos um a um: fluxos NX-010 a NX-018,
`onboarding.md`, `mapa-de-telas.md` e os 11 wireframes.

| Onde estava | Marcador | Resolvido em |
|---|---|---|
| T01 (wireframe), NX-017, onboarding | título do prólogo; blocos 1 e 4; linha "O time joga sozinho…" | `t01.*` |
| T02 fig. 2 e 3, onboarding | metas do onboarding; D1; D2 | `t02.meta.onboarding_*`, `t02.dica.d1`, `t02.dica.d2` |
| onboarding (0:50) | D3 "o time joga em 40 s…" | `t02.dica.d3` |
| NX-012 | "Texto final [LORE]" das 8 metas | `t02.meta.*` |
| onboarding (1:30) | linha extra do A01 | `a01.primeira_partida.regra` |
| T02 fig. 7, NX-017 | A03 "De volta ao Acesso…" | `a03.fala.*` |
| T04 fig. 1, NX-011, onboarding | faixa de 1ª vez; "1 frase por jogador" | `t04.*` |
| T07 fig. 4 e 5, T08, NX-017 | títulos da refundação e do epílogo; blocos | `capitulo.*`, `temporadas/T01.md` |
| T08 fig. T11 | "Clube refundado" | `t11.titulo` |
| T13 fig. 1, NX-013 | linha de 1ª vez | `t13.apoio.primeira_vez` |
