# NX-010 — Relatório técnico: tocar e comprar negócios

> Dono: `nexus-tech`. História NX-010 (Sprint 1, bloco 2). RN-001 a RN-006 e RN-017 (v0.3.2), com as
> Convenções (tolerância de 10⁻⁹ na compra e na tela). Data: 22/11/2026.

## 1. O que foi feito

| Bloco | Onde | Resumo |
|---|---|---|
| Motor | `src/engine/negocios.ts` (novo), `motor.ts`, `formato.ts`, `validacao.ts` | Conferi ×1/×10/Máx, visibilidade pelo ouro ganho na run (sem os 10 iniciais), marcos de 50 e janela de toque de 1 s: estavam certos desde a NX-015. Entraram funções puras para a tela: `oferta()` (o botão de um lote: quantidade, custo, pode, faltam, "Máx compraria k"), `proximaCompra()`, `rendaDoNegocio()`, `rendaPorUnidade()`, `progressoMarco()`, `marcosCruzados()`, `negocioNovo()`/`haNegocioNovo()`, `negociosQueApareceram()`. No motor, o campo `negociosVistos` e a ação `verNegocios`. No formatador, `formatarMultiplicador()` ("×2"), `formatarRelogio()` ("1:30") e `pctInteiro()`. |
| Save | `src/save/migracoes.ts`, `validacao.ts` | `SAVE_VERSION` 1 → 2. A migração 1 → 2 cria `negociosVistos` igual a `visiveis` (quem já jogava não vê "Novo" no que já via) e mantém a ordem dos campos. Validação nova: "visto" só pode ser um negócio visível. Compras continuam salvando antes de a tela mudar (RN-015). |
| App | `src/app/jogo.ts` | `tocar()` devolve `{ aceito, ouro }` (para o "+X"); `comprarNegocio()` devolve `{ indice, quantidade, marcos }` ou `null`; `verNegocios()`; fila `vista.anuncios` com os negócios que acabaram de aparecer e `fecharAnuncio()`. |
| T02 "Clube" | `src/ui/Principal.tsx` | Layout do wireframe e do mockup (48/80/120/72/80/176 + abas 64 = 640 px): chip da divisão com emblema e multiplicador, chip do Legado (só com Legado > 0), ouro e renda/s, card do split, faixa da meta reservada, "Próxima compra" (sempre ×1) e "Fazer live" com a Rastro à esquerda (x 8–104, `aria-hidden`, fora do alvo). |
| T03 "Negócios" | `src/ui/Negocios.tsx` | Só os negócios visíveis (RN-003); cada linha com ícone, nome, quantidade, renda, barra e "faltam N para ×2" (RN-004), botão do lote escolhido com custo (para cima) ou "Faltam X" (para cima, nunca 0), "Máx (k)", "Máx compraria k" no ×10 parcial, "dobrou!" por 3 s, selo "Novo". Seletor ×1/×10/Máx fixo com `aria-pressed`. Lista com rolagem própria. |
| Casca | `src/ui/TelaJogo.tsx`, `Icone.tsx`, `icones.ts`, `efeitos.ts`, `jogo.module.css` | Abas (Clube, Negócios; Elenco e Jornada desabilitadas), ponto de novidade na aba, anúncio do Renatão (3 s ou um toque), "Reduzir animações" por `prefers-reduced-motion`, voo da moeda na compra, ícones de linha como máscara CSS (herdam a cor). Só tokens. |
| Textos | `src/content/negocios.ts`, `src/content/principal.ts` (novos) | Copiados sem mudar do fluxo, dos wireframes, de `tokens.md` e de `nomes-do-jogo.md`. `textos.ts` e `rivais.ts` não foram tocados. Revisão pedida ao lore (T-06). |
| Testes | `src/engine/negocios.test.ts` (novo), `src/app/jogo.test.ts`, `src/save/save.test.ts`, `tests/e2e/nx010-tech.spec.ts` (novo), `tests/e2e/save.spec.ts` | Ver §3. |
| Ferramentas | `tools/medir-peso.ts` | Lista de arte da 1ª carga atualizada para a T02 completa (20 SVGs). |

### Feedback (guia visual §8 e §9)

| Evento | Normal | Com "Reduzir animações" |
|---|---|---|
| Toque que conta | Botão 0,96 (100 ms); "+X" com moeda sobe 32 px do ponto tocado e some (400 ms) | Só a escala; nenhum "+X" |
| Toque ignorado (6º no mesmo segundo) | Nada: nem "+X", nem aviso (RN-005) | Igual |
| Compra | Botão 0,96; moeda voa do botão até o ouro (200 ms); ouro e renda dão um pulso de 1,04 | O número muda direto |
| Marco de 50 | "dobrou!" por 3 s e anel laranja no ícone por 1 s | "dobrou!" por 3 s; o anel some na hora (T-08 c) |
| Negócio novo | Aviso do Renatão (entra em 200 ms, fica 3 s), ponto na aba, selo "Novo" | Aviso sem deslocamento |

### Decisões de implementação

- **O que a T02 mostra da parte de partidas.** Só o que o estado já tem e as RN definem: placar
  ("0V 0D · faltam 14", RN-010), chance com o rótulo Favorito/Equilibrado/Azarão (RN-009 + faixas do
  UX em `tokens.md` §5) e o tempo até a próxima partida. **Não** entraram: a trilha V/D (o estado não
  guarda a ordem dos resultados), o número do split, o nome do rival (a ordem dos rivais não está nas
  RN) e a meta (prioridades da NX-012 e dicas da NX-016). A faixa da meta fica como espaço vazio de
  72 px, para as alturas não mudarem. As partidas já rodam desde a NX-015; agora o jogador vê o placar.
- **"Próxima compra":** regra do fluxo do UX (o visível de menor custo da próxima unidade); em empate,
  o de número menor. Sempre ×1.
- **Selo "Novo" no save.** Para sobreviver a recarregar a página, o "visto" vai no estado
  (`negociosVistos`). Ao abrir a aba, os novos daquela visita mantêm o selo até sair dela; na
  próxima visita, não. A ação `verNegocios` só devolve um estado novo se algo mudou.
- **Anúncio:** a fila nasce de comparar o estado antes e depois de cada mudança com o app aberto ou
  ao voltar. Negócio que aparece no ganho offline de quando o app **abre** não gera anúncio (só o
  selo e o ponto); a T13 da NX-013 é o lugar desse resumo. Estado injetado pelo debug não anuncia.
- **BUG-001 (do QA):** na posição do wireframe (T03, top 56 px) o aviso cobria o botão de compra do
  1º negócio por 3 s. Agora ele fica sobre o cabeçalho, que não tem botão, e fecha com um toque
  (pedido T-07 a).
- **`ouro` e `renda`** são só o número ("10" e "+0,5/s"), não o bloco inteiro do wireframe: assim
  `toHaveText` funciona. Os dois ids aparecem também no cabeçalho da T03 (só uma aba é desenhada por
  vez).
- **Botão sem ouro** usa `aria-disabled="true"` (como na NX-015) em vez de `disabled`: continua
  focável e lido pelo leitor de tela com o "Faltam X"; o clique não faz nada.
- **1 Hz:** o ouro na tela muda a cada crédito do motor (1 s), não a 4–10 Hz como no guia (T-08 a).

## 2. Ids para os testes (`data-testid`)

Wireframe: `topo`, `divisao`, `ouro`, `renda`, `split`, `placar`, `chance`, `meta`, `proxima-compra`,
`zona-toque`, `chibi-destaque`, `botao-toque`, `abas`, `lote`. Além deles (combinados com o QA,
pedido QA-31; lista completa no T-07 b): `aba-<id>`, `aba-negocios-novo`, `lote-x1|x10|max`,
`negocio-<id>` e `negocio-<id>-<comprar|custo|faltam|quantidade|renda|nome|novo|marco|marco-feitos|marco-faltam|max-k|max-compraria|dobrou>`,
`proxima-compra-<nome|quantidade|renda|comprar|custo|faltam>`, `por-toque`, `proxima-partida`,
`chance-rotulo`, `anuncio-negocio`, `toque-ganho`, `principal-tela`, `negocios-tela`.
Os ids da NX-015 `principal-ouro`, `principal-renda`, `principal-fazer-live` e
`negocio-aulas-na-lan-*` da tela mínima deixaram de existir (o `save.spec.ts`, do tech, foi
atualizado).

## 3. Testes

| Nível | Onde | Quantos | O que cobre |
|---|---|---|---|
| Unitário (motor) | `src/engine/negocios.test.ts` | 40 novos | Os 3 cenários Gherkin da NX-010 e os casos CT-002, 003, 006, 007, 010, 011, 014, 020 a 024, 026, 027, 030, 031, 040 a 043, 045, 047 a 059, 061 do `economia-renda.md`; "Máx compraria", próxima compra, "Novo", validação, formatos novos |
| Integração (app) | `src/app/jogo.test.ts` | 6 novos | Resultado do toque e da compra, save na compra, marcos, fila de anúncios, "Novo" e debug |
| Save | `src/save/save.test.ts` | 1 novo, 4 ajustados | Fixture de save v1 migrada para a v2 (CT-510); testes que tinham `"saveVersion":1` fixo passaram a usar `SAVE_VERSION` |
| E2E (tech) | `tests/e2e/nx010-tech.spec.ts` | 12 × 4 perfis | CT-070, CT-043/044, CT-056/072, CT-058, CT-025, negócio novo (anúncio, ponto, selo), BUG-001, CT-032, UX-02 + ADR-003 (7 elementos sem rolar, chibi fora do alvo), "Reduzir animações", abas desabilitadas, save v1 → v2 |
| E2E (QA) | `tests/e2e/negocios.spec.ts` | 22 × 4 perfis | **Não editado.** Está em "fixme" até o QA trocar `NX010_ENTREGUE` para `true`. Rodado com `E2E_NX010=1`: **88 de 88 passam** |

Resultados (22/11, Node 22.23, Chrome do sistema; WebKit não instalado, então `iphone` rodou com
`E2E_IPHONE_NAVEGADOR=chromium`):

| Comando | Resultado |
|---|---|
| `npm ci` | ok |
| `npm test` (lint + tipos + unitários com cobertura) | **196 testes** (eram 149); `format:check` ok |
| Cobertura `src/engine` | **97,75% linhas / 97,09% ramos** (`negocios.ts` 100%) |
| Cobertura `src/save` | **100% linhas / 98,08% ramos** |
| Cobertura geral | 98,26% linhas / 97,28% ramos |
| `npm run build` | ok; C3 ok (sem debug nem tempo acelerado no `dist/`) |
| `npm run test:e2e` (4 perfis, como está no repositório) | **76 passam**, 88 pulados (o spec do QA em "fixme") |
| `npm run test:e2e` com `E2E_NX010=1` | **164 de 164 passam** |
| `npm run sim:economia` + `comparar-economia.js` | Todos os marcos iguais à base (0,0%): a economia não mudou |

## 4. Peso (`npm run medir:peso` e `tests/ci/checar-peso.js`)

| Item | NX-015 | NX-010 |
|---|---|---|
| JS inicial (gzip) | 77,0 kB | 84,7 kB |
| CSS inicial (gzip) | 2,6 kB | 4,2 kB |
| **Pacote inicial** (gzip; limite < 2 MB, alvo 300 kB) | 80,1 kB | **89,5 kB** |
| Arte da 1ª carga (sem compressão) | 2,1 kB (3 SVGs) | 11,6 kB (20 SVGs: botão, moeda, Rastro, 6 emblemas, 4 abas, 6 negócios, escudo) |
| **Arte + fontes da 1ª carga** (limite ≤ 150 kB) | 67,4 kB | **76,9 kB** |
| 1ª carga total (pacote gzip + arte + fontes) | 147,6 kB | 166,4 kB |

A arte da T02 ficou em 11,6 kB, bem abaixo dos 40 kB do guia (§11). Os SVGs pequenos vão embutidos no
JS como data URI.

## 5. Pendências e riscos

1. **Spec do QA em "fixme".** Passa inteiro com `E2E_NX010=1`, mas só entra na pipeline quando o QA
   trocar `NX010_ENTREGUE` para `true` (arquivo dele). Durante a NX-010 o QA mudou o spec em
   paralelo (BUG-001 e `fecharAnuncio`); a última versão passou.
2. **Execuções do Playwright em paralelo** apagam o `test-results/` uma da outra (vi `ENOENT` nos
   traces enquanto o QA rodava). Usei `--output` numa pasta própria. Na CI não acontece.
3. **WebKit não testado** aqui (sem o navegador instalado). O perfil `iphone` rodou no Chromium; a
   main da CI roda no WebKit. Ponto de atenção: `mask-image` dos ícones (uso também `-webkit-mask-*`)
   e `100dvh`.
4. **T02 sem trilha, rival, número do split e meta** até a NX-012/NX-016 (decisão do pedido do PO:
   não inventar regra). A faixa da meta fica vazia.
5. **Textos novos sem revisão do lore** (T-06) e **decisões de tela sem aceite do UX** (T-07):
   posição do anúncio, ids além do wireframe, abas desabilitadas, balão do "Fazer live" não feito.
6. **Ouro a 1 Hz** em vez de 4–10 Hz (T-08 a).
7. Save agora é **v2**. Um aparelho com o jogo novo grava v2; se voltar a abrir uma versão antiga
   (cache do service worker), ela recusa o save como "versão mais nova" sem apagar nada (já testado
   na NX-015, CT-511). O `autoUpdate` do service worker deixa essa janela curta.
