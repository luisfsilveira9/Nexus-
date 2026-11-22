# Casos — Nome do clube e limites de texto

> RN-019 (história NX-018) e RN-020 (transversal; conteúdo da NX-010 a NX-018) · Faixa CT-800 a
> CT-899. **v0.3** (NX-024), RN **v0.3.1** (o nome não aceita emoji; decisão do dono, 22/11/2026).
> **RN-019 v0.3.1:** padrão **Faísca eSports** / **FSC**.
> - Nome de 1 a 20 caracteres, **contados como o jogador vê** (grafemas: letra acentuada conta 1, em
>   forma composta ou decomposta).
> - **Permitido:** letras (com ou sem acento, incluindo "ç"), números, espaço entre palavras e os
>   sinais `-` `.` `'` `&`.
> - **Recusado:** emoji e qualquer outro símbolo, quebra de linha e caracteres de controle. Ao
>   **digitar**, o campo não aceita o caractere e mostra "Use só letras, números e espaços".
> - **Espaços:** os do começo e do fim saem; espaços seguidos viram um só; nome só de espaços é
>   recusado.
> - **Colar:** mais de 20 caracteres → corta em 20, com aviso; caracteres proibidos → removidos, com
>   aviso.
> - Sigla: exatamente 3 letras A–Z; minúsculas viram maiúsculas; acento, "ç" e números recusados; não
>   repete nenhuma das 42 siglas de rivais.
> - O texto é sempre texto puro, nunca HTML. Com a v0.3.1, `<` e `>` nem entram no campo; a prova de
>   que a tela não interpreta HTML é feita injetando o estado no build de teste (CT-807, pedido QA-28i).
> RN-020: limites oficiais = `docs/ux/tokens.md` §10, valendo **depois** de trocar `{clube}` por um
> nome de 20 caracteres; capítulo até 180 palavras e 8 blocos; fala de 1 linha até 60 caracteres.
> Segurança: ameaça A3 de `seguranca.md` (injeção de HTML).
> Os testes leem a mensagem e os avisos de `src/content/` (nunca texto fixo no teste), mas conferem
> que a mensagem de recusa é exatamente "Use só letras, números e espaços" (texto da RN).

## RN-019 / NX-018 — Nome e sigla do clube

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-800 | Padrão | Instalação limpa | Abrir o jogo | Nome "**Faísca eSports**" e sigla "**FSC**" nas telas e no save | U + E | Sim (PR smoke) |
| CT-801 | Limite de 20 caracteres | Tela de renomear | Salvar "Unidos da Ladeira FC" (20, com espaços); tentar digitar "Unidos da Ladeira FC2" (21) | 20: aceito e exibido inteiro. 21: o 21º caractere não entra; o clube **nunca** fica com mais de 20 | U + E | Sim (PR) |
| CT-802 | Nomes válidos (Gherkin NX-018: "Los Grandes") | Tela de renomear | Salvar, um de cada vez: "**Los Grandes**"; "Lowther eSports"; "Pain Gaming"; "São Caetano"; "Ação & Cia"; "D'Ávila FC"; "Sta. Cruz-RS"; "Time 2026"; "Ç"; "7" | Todos aceitos e exibidos exatamente como digitados; nenhuma mensagem de recusa | U + E | Sim (PR smoke) — "Los Grandes"; resto Sim (PR) |
| CT-813 | Emoji recusado (Gherkin NX-018: "Faísca 🔥") | Tela de renomear, nome atual "Los Grandes" | Digitar "Faísca 🔥"; depois tentar cada um: "👍🏽" (tom de pele), "🇧🇷" (bandeira), "❤️" (com seletor de variação), "👨‍👩‍👧" (sequência ZWJ), "1️⃣" (tecla) | O emoji **não entra** no campo e aparece "**Use só letras, números e espaços**"; o campo fica com "Faísca " (antes de salvar) e o nome salvo é "Faísca". Os outros emojis: nenhum caractere deles fica no campo, nem pedaço (sem seletor de variação, ZWJ ou indicador regional soltos) | U + E | Sim (PR smoke) — "Faísca 🔥"; resto Sim (PR) |
| CT-814 | Outros símbolos, quebra de linha e controle | Tela de renomear | Digitar ou injetar no campo: `@`, `#`, `_`, `/`, `!`, `?`, `;`, `:`, `"`, `*`, `+`, `=`, `<`, `>`, `™`, `©`, `★`, `°`, `ª`, `º`, `€`; quebra de linha (Enter e U+000A colado); tab (U+0009); U+0000; U+0007; U+200B (espaço de largura zero); U+202E (inversão da direção do texto) | Nenhum entra; mensagem de recusa nos digitados; nome salvo sem eles. Enter não cria segunda linha (no máximo envia o formulário) | U | Sim (PR) |
| CT-815 | Espaços | Tela de renomear | Salvar "  Los   Grandes  "; digitar "Los" + 2 espaços + "Grandes"; tentar salvar ""; tentar salvar "     " | "**Los Grandes**" (11) nos dois primeiros; vazio e só de espaços **recusados** (Salvar desabilitado ou mensagem), nome anterior mantido | U + E | Sim (PR) |
| CT-816 | Contagem por grafema | Tela de renomear | (a) "ÁÉÍÓÚáéíóúÇçÃãÕõÂâÊê" (20 letras acentuadas, forma composta NFC); (b) o mesmo em forma decomposta (letra + acento combinado, 40 unidades de código); (c) 21 letras acentuadas; (d) "Faísca" com `i` + U+0301 | (a) e (b) aceitos, contador mostra **20**; (c) 21º não entra; (d) aceito, conta **6** e aparece igual a "Faísca". Um corte nunca separa a letra do acento | U | Sim (PR) |
| CT-817 | Colar com caracteres proibidos | Tela de renomear | Colar: "Faísca 🔥 eSports"; "Los\nGrandes"; "Time™ & Cia©" | Viram "**Faísca eSports**" (o emoji sai e os espaços seguidos viram um), "**LosGrandes**" (a quebra de linha sai sem virar espaço), "**Time & Cia**"; aparece o **aviso de remoção** em cada um | U + E | Sim (PR) |
| CT-818 | Colar mais de 20 | Tela de renomear | Colar "Unidos da Ladeira FC Extra" (26); colar "🔥🔥 Los Grandes do Sul Unidos" (27 com os emojis) | 1º: "**Unidos da Ladeira FC**" + aviso de corte. 2º: proibidos removidos **e** corte, com aviso. A ordem (remover antes de cortar ou cortar antes) muda o resultado: **pedido QA-30c** | U + E | Sim (PR) — 1º; 2º após QA-30 |
| CT-819 | Teclado do celular | Android (Gboard) e iPhone (Safari), teclado em português | Digitar "D'Ávila FC" e "Sta. Cruz--RS" com a correção automática ligada | O apóstrofo curvo `’` (iOS troca `'` por `’`) e o travessão `–` (troca de `--`) são "outros símbolos" pela RN e seriam recusados: **pedido QA-30a** (aceitar convertendo ou recusar). Também o espaço não separável (U+00A0): **QA-30b** | E | Não (manual no aparelho) + Sim (PR) após QA-30 |
| CT-803 | Sigla válida | Tela de renomear | "ABC"; "UDF" | Aceitas | U | Sim (PR) |
| CT-804 | Sigla inválida | Tela de renomear | "AB"; "ABCD"; "AB1"; "A-B"; "A B"; "ÁBC"; "ÇAB"; "çab"; "🔥AB"; "" | Todas recusadas; a sigla anterior fica | U | Sim (PR) |
| CT-805 | Sigla em minúsculas (QA-24d decidido) | Tela de renomear | Digitar "abc"; "aBc" | Viram "**ABC**" no campo e no save | U | Sim (PR) |
| CT-806 | Sigla de rival | Tela de renomear | Tentar cada uma das 42 siglas de `nomes-do-jogo.md` (ex.: "VTX", "DJD", "ULD"), também em minúsculas | Todas recusadas; "FSC" é aceita (é a do próprio clube) | U | Sim (PR) — a lista vem do conteúdo, não fixa no teste |
| CT-826 | Gherkin NX-018: `<script>` digitado no campo | Tela de renomear | Digitar `<script>` | `<` e `>` **não entram** e aparece "Use só letras, números e espaços"; o campo fica com "script"; nenhum elemento novo no DOM | E + S | Sim (PR smoke) |
| CT-807 | Gherkin NX-018: `<script>` na tela mostra o texto literal | Build de teste com o estado injetado sem passar pela validação (nome `<script>`; pedido QA-28i) | Percorrer as telas onde o nome aparece: principal, jornada, resumo do split, tela offline, refundação, capítulos e falas com `{clube}` | O texto `<script>` aparece **literal** em todas; nenhum elemento `<script>` novo no DOM; nenhum diálogo aberto (defesa em profundidade: mesmo que a validação falhe, a tela não interpreta HTML) | E + S | Sim (PR smoke) |
| CT-808 | Outras injeções | (a) Colar no campo; (b) estado injetado no build de teste | `<b>x</b>`; `"><svg/onload=1>`; `<i>Faísca</i>`; `&lt;b&gt;`; `{{7*7}}`; `${1+1}`; `javascript:1` | (a) Proibidos removidos com aviso: "bx", "svgonload1", "iFaíscai", "&ltb&gt", "77", "11", "javascript1". (b) Tudo literal, inclusive `&lt;b&gt;` (não vira `<b>`), `{{7*7}}` (não vira 49) e `${1+1}` (não vira 2); nenhum elemento criado; nenhum link clicável | E + S | Sim (PR) |
| CT-809 | Injeção por save importado (QA-27a decidido) | Texto de save com checksum refeito e nome de 500 caracteres com HTML; outro com nome `<script>`; outro com "Faísca 🔥" | Importar | Os três **recusados** com aviso (nome fora da RN-019 = valor impossível, RN-015); o save atual intacto; nada renderizado | I + S | Sim (PR) |
| CT-810 | Nada de HTML cru no código | Código de `src/` | Semgrep | Nenhum `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` | S | Sim (noturna; no PR quando o Semgrep entrar lá, ver `pipeline.md` §4) |
| CT-811 | Nome e sigla persistem | Clube renomeado "D'Ávila FC" / "DAV" | Encerrar à força; reabrir; refundar; exportar/importar | Nome e sigla iguais em todos os passos (RN-013 mantém) | I | Sim (PR) |
| CT-812 | `{clube}` no texto do lore | Clube renomeado | Abrir capítulos e falas que usam `{clube}` | O nome atual aparece no lugar de `{clube}`; nunca o texto `{clube}` cru | I + E | Sim (PR) |

## RN-020 — Limites de texto

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-820 | Conteúdo dentro dos limites | Textos de `src/content/` | Teste lê cada texto pelo tipo e compara com `tokens.md` §10 | Divisão ≤ 12; negócio ≤ 18; descrição de negócio ≤ 45; anúncio ≤ 60; rival ≤ 20; apelido de jogador ≤ 12; nome do clube ≤ 20; bloco de capítulo ≤ 280; capítulo ≤ 180 palavras e ≤ 8 blocos; fala de 1 linha ≤ 60; balão do toque ≤ 20; rótulo de aba ≤ 10; texto de botão ≤ 18 por linha. Qualquer texto acima falha o PR | U | Sim (PR) |
| CT-821 | Limites com `{clube}` no pior caso (QA-26b decidido) | Clube com nome de 20 caracteres ("WWWWWWWWWWWWWWWWWWWW") | Interpolar em todos os textos com `{clube}` e medir | Todos os limites do CT-820 valem **depois** da troca. O teste roda com o padrão e com o de 20 caracteres | U | Sim (PR) |
| CT-822 | Textos no limite cabem na tela | 360×640, textos sintéticos com o tamanho máximo de cada tipo | Abrir cada tela | Sem corte fora do previsto em §10 (reticências só onde a tabela permite; rival quebra em 2 linhas, nunca corta) | E + V | Sim (main) |
| CT-823 | Nomes finais, sem provisórios | Bundle e telas | Procurar "Amadora", "Desafiante", "Academy", "Internacional", "Live do time", "Loja de camisas", "Canal de conteúdo", "Fan fest", "Arena própria" | Nenhuma ocorrência na interface (palavras comuns como "Liga" só nos nomes completos do lore) | E | Sim (main) |
| CT-824 | "Split" na tela, "Temporada" só no arco | E2E percorre placar, resumo, tela offline e jornada | Procurar o texto | O bloco de 14 partidas aparece como "split"; "Temporada" só no arco narrativo (ex.: "Temporada 1", epílogo) | E | Sim (main) |
| CT-825 | Divisões com preposição pronta | Conteúdo | Ler os textos com divisão ("Chegue à Ascensão", "no Acesso") | Frases usam as formas prontas do lore; nenhum "na Acesso" / "à Acesso" montado em código | U | Sim (PR) |
