# Casos — Nome do clube e limites de texto

> RN-019 (história NX-018) e RN-020 (transversal; conteúdo da NX-010 a NX-018) · Faixa CT-800 a
> CT-899. **Novo na v0.2** (NX-009).
> RN-019: padrão **Faísca eSports** / **FSC**; nome com até 20 caracteres; sigla com exatamente 3
> letras A–Z, maiúsculas, diferente das 42 siglas dos rivais; o texto é sempre texto puro, nunca HTML.
> RN-020: limites oficiais = `docs/ux/tokens.md` §10.
> Segurança: ameaça A3 de `seguranca.md` (injeção de HTML).

## RN-019 / NX-018 — Nome e sigla do clube

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-800 | Padrão | Instalação limpa | Abrir o jogo | Nome "**Faísca eSports**" e sigla "**FSC**" nas telas e no save | U + E | Sim (PR smoke) |
| CT-801 | Limite de 20 caracteres | Tela de renomear | Salvar "Unidos da Ladeira FC" (20, com espaços); tentar "Unidos da Ladeira FC2" (21) | 20: aceito e exibido inteiro. 21: não é salvo (o campo não aceita ou recusa com aviso); o clube **nunca** fica com mais de 20 | U + E | Sim (PR) |
| CT-802 | Nome fora do comum | Tela de renomear | Tentar: vazio; só espaços; com quebra de linha; com emoji ("Faísca 🔥"); "Faísca" com acento combinado (`a` + U+0301); caracteres de controle | **Bloqueado por pedido QA-24** (mínimo, o que conta como caractere, o que é permitido) | U | Sim após decisão |
| CT-803 | Sigla válida | Tela de renomear | "ABC"; "UDF" | Aceitas | U | Sim (PR) |
| CT-804 | Sigla inválida | Tela de renomear | "AB"; "ABCD"; "AB1"; "A-B"; "A B"; "ÁBC"; "ÇAB"; "" | Todas recusadas; a sigla anterior fica | U | Sim (PR) |
| CT-805 | Sigla em minúsculas | Tela de renomear | Digitar "abc" | Recusar ou converter para "ABC": **pedido QA-24** | U | Sim após decisão |
| CT-806 | Sigla de rival | Tela de renomear | Tentar cada uma das 42 siglas de `nomes-do-jogo.md` (ex.: "VTX", "DJD", "ULD") | Todas recusadas; "FSC" é aceita (é a do próprio clube) | U | Sim (PR) — a lista vem do conteúdo, não fixa no teste |
| CT-807 | Gherkin NX-018: `<script>` no nome | Clube renomeado para `<script>` | Percorrer as telas onde o nome aparece: principal, jornada, resumo do split, tela offline, refundação, capítulos e falas com `{clube}` | O texto `<script>` aparece **literal** em todas; nenhum elemento `<script>` novo no DOM; nenhum diálogo aberto | E + S | Sim (PR smoke) |
| CT-808 | Outras injeções (≤ 20 caracteres) | Renomear para cada carga | `<b>x</b>`; `"><svg/onload=1>`; `<i>Faísca</i>`; `&lt;b&gt;`; `{{7*7}}`; `${1+1}`; `javascript:1` | Tudo literal, inclusive `&lt;b&gt;` (não vira `<b>`), `{{7*7}}` (não vira 49) e `${1+1}` (não vira 2); nenhum elemento criado; nenhum link clicável | E + S | Sim (PR) |
| CT-809 | Injeção por save importado | Texto de save com nome de 500 caracteres contendo HTML, checksum refeito | Importar | Nunca renderiza HTML; o tamanho segue a decisão do **pedido QA-27a** (recusa ou corte) | I + S | Sim (PR) — parte do HTML; tamanho após decisão |
| CT-810 | Nada de HTML cru no código | Código de `src/` | Semgrep | Nenhum `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` | S | Sim (PR) |
| CT-811 | Nome e sigla persistem | Clube renomeado | Encerrar à força; reabrir; refundar; exportar/importar | Nome e sigla iguais em todos os passos (RN-013 mantém) | I | Sim (PR) |
| CT-812 | `{clube}` no texto do lore | Clube renomeado | Abrir capítulos e falas que usam `{clube}` | O nome atual aparece no lugar de `{clube}`; nunca o texto `{clube}` cru | I + E | Sim (PR) |

## RN-020 — Limites de texto

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-820 | Conteúdo dentro dos limites | Textos de `src/content/` | Teste lê cada texto pelo tipo e compara com `tokens.md` §10 | Divisão ≤ 12; negócio ≤ 18; descrição de negócio ≤ 45; anúncio ≤ 60; rival ≤ 20; apelido de jogador ≤ 12; nome do clube ≤ 20; bloco de capítulo ≤ 280; balão do toque ≤ 20; rótulo de aba ≤ 10; texto de botão ≤ 18 por linha. Qualquer texto acima falha o PR | U | Sim (PR) |
| CT-821 | Limites com `{clube}` no pior caso | Clube com nome de 20 caracteres ("WWWWWWWWWWWWWWWWWWWW") | Interpolar em todos os textos com `{clube}` e medir | Se o limite vale **depois** da troca: **pedido QA-26**. O teste roda com os dois nomes (padrão e 20 caracteres) | U | Sim após decisão |
| CT-822 | Textos no limite cabem na tela | 360×640, textos sintéticos com o tamanho máximo de cada tipo | Abrir cada tela | Sem corte fora do previsto em §10 (reticências só onde a tabela permite; rival quebra em 2 linhas, nunca corta) | E + V | Sim (main) |
| CT-823 | Nomes finais, sem provisórios | Bundle e telas | Procurar "Amadora", "Desafiante", "Academy", "Internacional", "Live do time", "Loja de camisas", "Canal de conteúdo", "Fan fest", "Arena própria" | Nenhuma ocorrência na interface (palavras comuns como "Liga" só nos nomes completos do lore) | E | Sim (main) |
| CT-824 | "Split" na tela, "Temporada" só no arco | E2E percorre placar, resumo, tela offline e jornada | Procurar o texto | O bloco de 14 partidas aparece como "split"; "Temporada" só no arco narrativo (ex.: "Temporada 1", epílogo) | E | Sim (main) |
| CT-825 | Divisões com preposição pronta | Conteúdo | Ler os textos com divisão ("Chegue à Ascensão", "no Acesso") | Frases usam as formas prontas do lore; nenhum "na Acesso" / "à Acesso" montado em código | U | Sim (PR) |
