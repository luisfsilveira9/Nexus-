# NX-015 — Relatório técnico: fundação do código e save

> Dono: `nexus-tech`. 22/11/2026. RN v0.3.1, ADR-002 (C1–C10), ADR-003. Pedidos abertos: T-01 a T-05
> em `docs/produto/pedidos.md`.

## 1. O que foi feito

| Bloco | Onde | Resumo |
|---|---|---|
| Projeto | raiz | Vite 8 + React 19.3 + TypeScript 6.0 (`strict`, `erasableSyntaxOnly`, imports com `.ts`). `package.json` com os scripts do ADR-002, `engines.node >=22.18`, `package-lock.json`. ESLint 10 (flat) + typescript-eslint + react-hooks; Prettier (aspas simples, 100 colunas). Vitest 5 com cobertura v8. Playwright 1.65. `vite-plugin-pwa` 2 (manifest + service worker, `base: './'`). |
| Motor | `src/engine/` | `motor.ts`, `regras.ts`, `rng.ts`, `formato.ts` movidos de `tools/sim-economia/` sem o bloco "Variantes". Novos: `passo()`/`passoDetalhado()` (C1, C2), `clube.ts` (RN-019 v0.3.1 + QA-30) e `validacao.ts` (RN-015: valores impossíveis). |
| Save | `src/save/` | Interface `ArmazenamentoSave` (C8), adaptador do `localStorage`, versão em memória com falhas simuladas, envelope `{ app, saveVersion, seq, salvoEm, estado, checksum }` com FNV-1a, migrações, 2 slots alternados, recuperação, nenhum válido, sem espaço, exportar/importar, `navigator.storage.persist()`. |
| App | `src/app/` | Relógios real e falso (C2), controlador com store para `useSyncExternalStore`, regras de quando salvar, loop de 1 Hz, `visibilitychange`/`pagehide`/`pageshow`, debug só no build de teste (C3). |
| UI mínima | `src/ui/`, `src/main.tsx` | T00, T12a, T12b (com exportar o ilegível), T12c, A05 e a tela principal mínima (ouro, renda/s, compra de "Aulas na lan", "Fazer live"). Todo número com `data-testid` (C6). Textos de `src/content/`. |
| Tokens | `src/ui/tokens/tokens.css` | Gerado por `tools/gerar-tokens.ts` (103 tokens) a partir de `docs/ux/tokens.md` e `docs/arte/tokens-marca.md`. |
| Fontes e ícones | `src/ui/fontes.css`, `public/` | Inter (variável) e Archivo Black via @fontsource, sem CDN, só o subconjunto latino. 8 ícones do guia §10 gerados por `tools/gerar-icones.sh` (rsvg-convert). |
| Simulador | `tools/sim-economia/` | Importa de `src/engine/`. Saíram as opções `--offline` e `--relogio` (eram das Variantes). |
| Testes | `src/**/*.test.ts`, `tools/ferramentas.test.ts`, `tests/e2e/` | 149 unitários/integração (os 29 migrados + 120 novos). E2E: `tests/e2e/save.spec.ts` (5 casos) e o fixture `tests/e2e/rede.ts`. |

### Ajustes do motor às RN v0.3.1

- **Relógio de partida (RN-009 v0.3):** o motor recebe `modo: 'emJogo' | 'pausado'` no `tique`. O app
  manda `emJogo` só na tela do jogo (stand-in da barra de abas); T00/T12 pausam. A renda não pausa.
- **Relógio depois do offline (RN-011 v0.3):** `r − t_ef` se não deu partida; **90** se as partidas
  pararam no fim de um split com subida ou queda (novo); senão `90 − ((t_ef − r) mod 90)`. Testado
  que fica sempre em (0, 90] e que 8 h dão no máximo 320 partidas.
- **Tolerância na tela (Convenções v0.3):** o formatador usa `TOLERANCIA_DINHEIRO` (10⁻⁹) antes de
  arredondar, nas duas direções (antes era 10⁻¹²). Porcentagem: empate em ,5 vai para cima, com a
  mesma tolerância (0,285 → 29%). Espaço antes da unidade é o não quebrável (tokens.md §9.1).
- **`maior` em todo save (RN-012 v0.3):** o gerenciador de save chama `salvar(estado, agora)` do motor
  antes de toda gravação; não há como gravar sem atualizar.
- **RN-019 v0.3.1:** `validarNome`, `limparNomeColado`, `caracterePermitidoNoNome`, `validarSigla`.
  Grafemas com `Intl.Segmenter`, NFC, sem emoji (inclusive "1️⃣", que é "1" + seletor de variação),
  sigla só A–Z. **QA-30:** `’` vira `'` antes de validar; ao colar, a ordem é converter, remover
  proibidos, juntar espaços e cortar em 20.

### Interface do motor (C1, C2)

```ts
passo(estado: Estado, acao: Acao, agora: { paredeMs: number; monoMs: number }): Estado
// Acao: abrir | tique {modo} | toque | comprarNegocio {indice, quantidade: n | 'max'}
//       | subirNivel {jogador} | refundar | salvar
```

`passoDetalhado` devolve também os eventos (toque, compra, partida, fimSplit, offline, refundação).
Ação recusada devolve o mesmo objeto. O estado é JSON puro; `maior` em segundos desde 1970 (UTC),
`monoMs` e toques em ms do relógio monotônico da sessão.

### Quando salva (RN-015)

A cada 10 s (relógio monotônico), a cada compra (antes de avisar a tela), ao fim de cada partida, em
`visibilitychange`→`hidden` e em `pagehide`. Segundo plano = offline: ao ocultar, credita o online
até agora, salva e para; ao voltar, o motor aplica o offline desde `maior`.

### Decisões de implementação (para o QA e o PO conhecerem)

- **Qual cópia vale:** a válida com maior `seq` (contador), não a de horário maior: o relógio de
  parede pode voltar.
- **Aviso T12a:** aparece quando a outra cópia existe e não abre, a não ser que dê para ler o `seq`
  dela e provar que é a mais velha (aí carrega sem aviso). O texto da cópia ruim é guardado em
  `nexus-idle:save:ilegivel` antes de ser sobrescrito.
- **Versão mais nova num slot (CT-511):** não carrega a cópia mais velha por cima, não grava nada e
  cai na T12b (`versaoFutura: true`). Falta texto próprio (T-02).
- **Nenhuma válida:** nenhuma gravação até o jogador decidir. "Começar clube novo" (com confirmação)
  guarda as cópias cruas na chave de ilegíveis; se não houver espaço para guardá-las, não começa e
  mostra o A05.
- **Importar:** grava o save importado com o `maior` dele (sem atualizar), para a abertura normal
  contar o `t_off` a partir dele (RN-015). Versão mais nova: motivo `versaoFutura`.
- **Duas abas (CT-516):** sem bloqueio; vence a gravação de `seq` maior. Nenhuma corrompe a outra
  (cada gravação é um texto inteiro e válido), mas o progresso de uma aba pode sobrescrever o da
  outra.
- **Offline creditado ao abrir:** ver T-01.

## 2. Condições C1–C10

| | Condição | Como foi atendida | Prova |
|---|---|---|---|
| C1 | `passo(estado, acao, agora)` puro, estado em JSON | `src/engine/motor.ts` | `passo.test.ts`: estado congelado em profundidade (CT-530) para todas as ações, ida e volta em JSON; ação recusada devolve o mesmo objeto |
| C2 | Relógios de parede e monotônico injetáveis | `Relogio { paredeMs(), monotonicoMs() }` em `src/app/relogio.ts` (único lugar com `Date.now()`/`performance.now()`); o motor recebe `{ paredeMs, monoMs }` | `passo.test.ts` (tique ignora a parede; abrir ignora o monotônico) e `jogo.test.ts` (CT-531 com relógio falso) |
| C3 | Tempo acelerado e debug só no build de teste | `src/app/debug.ts`, carregado por `import()` dentro de `if (import.meta.env.MODE === 'test')`. `?acelerar=N` (1–100) e `window.__nexusDebug` | `npm run build` roda `tools/checar-build-jogador.ts` e **falha** se achar as marcas no `dist/`; E2E "C3" abre o `dist/` com `?acelerar=100` e confere que nenhuma partida aconteceu em 2,5 s; no `dist-teste/` medido: 2 partidas em 3 s |
| C4 | Constantes num arquivo único | `src/engine/regras.ts`, importado pelo motor, simulador, validação, UI e testes | `grep` de literais (1,15; 1,22; 90; 28.800) fica para o CT-533 do QA |
| C5 | Perfis 360×640, 360×700, Pixel, iPhone, com toque e modo celular | `playwright.config.ts`: `360x640`, `360x700`, `pixel` (Pixel 7) e `iphone` (iPhone 13, WebKit), todos com `isMobile` e `hasTouch` | 28 E2E passaram nos 4 perfis |
| C6 | `data-testid` em todo número | Ouro, renda, custo/faltam, quantidade, renda por unidade, ouro por toque, horário do T12a, tentativa da T12b, ouro/Legado da T12c e "há X" do A05 | `Telas.tsx` |
| C7 | 90% linhas / 85% ramos em `src/engine` e `src/save`, falhando abaixo | `vitest.config.ts` com limites por pasta; `npm test` e `npm run test:coverage` falham abaixo | Motor 97,49% / 96,24%; save 100% / 97,97% (gate do QA também atendido) |
| C8 | Save atrás de camada própria, versão em memória e falhas simuláveis | `ArmazenamentoSave`, `armazenamentoLocal`, `ArmazenamentoMemoria` (cota cheia, falha no meio da escrita, leitura falha, 4 tipos de corrupção) | `save.test.ts` (30 testes, CT-506 a CT-524) |
| C9 | Nenhum pedido fora do site; E2E bloqueia outras origens | Fontes e arte empacotadas; registro do SW inline; fixture `auto` em `tests/e2e/rede.ts` reprova qualquer pedido externo | Smoke CT-538 do QA e os 5 casos do tech passam sem pedido externo. **Pendente:** fluxo com `context.setOffline(true)` (é do QA, CT-538) |
| C10 | `engines` em Node ≥ 22.18 | `"engines": { "node": ">=22.18" }` | Os workflows do QA usam `node-version: 22` (T-04 a) |

## 3. Peso (medido, `npm run medir:peso` e `tests/ci/checar-peso.js`)

| Item | Bruto | gzip |
|---|---|---|
| index.html | 1,0 kB | 0,5 kB |
| JS inicial (`assets/index-*.js`, React + jogo + SVGs embutidos) | 245,6 kB | 77,0 kB |
| CSS inicial | 8,9 kB | 2,6 kB |
| **Pacote inicial** (limite < 2 MB gzip; alvo 300 kB) | 255,5 kB | **80,1 kB** |
| Fonte Inter variável, latim (`woff2`) | 47,1 kB | — |
| Fonte Archivo Black, latim (`woff2`) | 18,2 kB | — |
| Arte da 1ª carga (escudo, botão "Fazer live", moeda) | 2,1 kB | — |
| **Arte + fontes da 1ª carga** (limite ≤ 150 kB) | **67,4 kB** | — |
| 1ª carga total (pacote gzip + arte + fontes) | — | 147,6 kB |

- A fonte do Inter latino estendido (+85 kB) foi tirada: o pt-BR não precisa dela e, na conta do QA
  (que soma toda fonte citada no CSS), arte + fontes passaria de 150 kB. Letras fora do Latin-1 num
  nome de clube caem na fonte do sistema.
- A arte da T02 completa (16 SVGs, 15,7 kB pelo guia §11) cabe com folga: daria ~81 kB.
- O cache offline do service worker baixa 401 kB depois da 1ª carga (22 arquivos, inclui os ícones).

## 4. Economia com o motor de `src/engine/` (RN v0.3.1)

`npm run sim:economia -- --json --dias 30 --estrategia titulo` e `--dias 7`, comparados por
`tests/ci/comparar-economia.js` (tolerância 20%). Mediana de 20 jogadores, semente 1.

| Marco | Típico (RN → sim) | Frequente | Sem parar |
|---|---|---|---|
| Acesso | 21 min → 21 min (0%) | 21 min → 21 min (0%) | 21 min → 21 min (0%) |
| Ascensão | 1,8 h → 1,8 h (−2,8%) | 1,8 h → 1,8 h (−2,8%) | 1,8 h → 1,8 h (−2,8%) |
| Elite | 11 h → 11,1 h (+0,9%) | 13 h → 12,9 h (−0,4%) | 5 h → 4,9 h (−2,0%) |
| Continental | 5,5 d → 5,7 d (+3,6%) | 3,1 d → 3,1 d (+0,9%) | 15 h → 14,7 h (−2,0%) |
| Mundial | 18 d → 17,9 d (−0,3%) | 9 d → 8,9 d (−1,6%) | 2 d → 2,1 d (+6,5%) |
| 1º título mundial | > 30 d → não chegou em 30 d (ok) | 22 d → 21,5 d (−2,1%; 19/20) | 5,4 d → 5,4 d (−0,6%) |
| Refundações em 1 semana | 6 → 6 | 16 → 16 | 60 → 60 |

**Resultado: todos os marcos dentro de 20%; maior desvio +6,5%.** A regra nova do relógio (volta a 90
depois de subida ou queda no offline) não muda a tabela de forma visível.

## 5. Resultados dos comandos (rodados em 22/11/2026, Node 22.23.5, npm 10.9.9)

```
$ rm -rf node_modules dist coverage && npm ci
added 470 packages ... 4 moderate severity vulnerabilities   (só desenvolvimento; ver T-04 d)

$ npm test                       → exit 0
eslint .                          (sem problemas)
tsc --noEmit                      (sem erros)
vitest run --coverage
 Test Files  7 passed (7)
      Tests  149 passed (149)
Statements 97.32% | Branches 96.43% | Functions 94.96% | Lines 98.06%

$ npm run test:coverage          → exit 0 (mesmos números)
$ node tests/ci/checar-cobertura.js --pastas src/engine,src/save --linhas 90 --ramos 85
| src/engine/ | 6 | 97,49% (350/359) | 96,24% (205/213) | ok |
| src/save/   | 7 | 100,00% (174/174) | 97,97% (145/148) | ok |

$ npm run build                  → exit 0
dist/assets/index-*.js  251.49 kB │ gzip: 79.78 kB
PWA v2.0.0  precache 22 entries (401.14 KiB)
C3 ok: nenhum tempo acelerado ou debug em dist/.

$ npm run format:check           → All matched files use Prettier code style!
$ npm audit --omit=dev --audit-level=high → found 0 vulnerabilities

$ E2E_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome \
  E2E_IPHONE_NAVEGADOR=chromium npm run test:e2e      → exit 0
  28 passed (51.1s)     (save.spec.ts × 5 e smoke.spec.ts do QA × 2, nos 4 perfis)
$ ... npm run test:e2e -- --grep @smoke --project=360x640   → 3 passed (comando do pr.yml)

$ npm run dev                    → Local: http://localhost:5173/  Network: http://<ip>:5173/
$ npm run sim:economia           → ok (ver §4)
```

**Ressalva do E2E nesta máquina:** `npx playwright install chromium` foi **recusado pelo proxy** da
sessão (403 em `cdn.playwright.dev`). Usei o Chromium já instalado em `/opt/pw-browsers` (de uma
versão anterior do Playwright) pela variável `E2E_CHROMIUM`, e o perfil `iphone` rodou no Chromium
(`E2E_IPHONE_NAVEGADOR=chromium`), porque não há WebKit. Na CI o Playwright baixa os navegadores dele
e o `iphone` roda no WebKit, o que **não foi testado aqui**.

## 6. Diferenças em relação ao ADR-002 (precisam de registro do PO)

- **ESLint 10** em vez de 9: o 9 está marcado como sem suporte no npm. Os plugins aceitam o 10.
- **TypeScript 6.0**, não o 7: o typescript-eslint ainda exige `< 6.1`.
- `typecheck`/`build` usam `tsc --noEmit` (um tsconfig só), não `tsc -b`.
- `npm test` roda a cobertura (`test:coverage`), não só `test:unit`, para o limite C7 valer localmente.
- E2E roda no build do jogador (`dist/`), como a CI do QA. O build de teste fica em `dist-teste/`.

## 7. Pendências e riscos

1. **T-01 (PO):** quando o offline é creditado (ao abrir ou ao tocar em "Receber").
2. **T-02 (lore):** revisar os textos criados pelo tech; faltam textos de versão mais nova, falha de
   gravação que não é de espaço e armazenamento não persistente (CT-540 pede o aviso; o jogo já pede
   `persist()` e guarda o resultado na vista, mas não mostra nada).
3. **T-03 (UX):** fluxo do gerador de tokens e 2 cores sem valor.
4. **T-04/T-05 (QA):** Node fixo na CI, testes de propriedade (sem `fast-check` ainda), fluxo com
   `setOffline(true)`.
5. **Sem UI de exportar/importar** do save atual (T14/T16/T17): a camada existe e está testada; as
   telas entram com a T14. A T12b já exporta o save que não abriu.
6. **Configurações (T14) não estão no save:** quando existirem, sobem o `saveVersion` para 2 com a
   1ª migração e a 1ª fixture (CT-510).
7. A tela principal é provisória (sem barra de abas, split, meta ou os outros negócios): a T02 vem na
   NX-010. Usa 3 valores sem token (32 px da moeda, 132 px do botão, 20 px do rótulo).
8. `substituirEstadoSemValidar` existe no objeto do jogo também no build do jogador (sem nenhum
   acesso pela página); só o console do build de teste o expõe.
9. Dependências de desenvolvimento com 4 alertas moderados (`workbox-build` → `glob`). Não afeta o
   jogo publicado.
