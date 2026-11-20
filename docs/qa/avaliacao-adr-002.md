# Avaliação de testabilidade do ADR-002 (stack)

> Dono: `nexus-qa`. NX-002, 20/11/2026. Base: `docs/qa/requisitos-testabilidade.md` v0.1 contra
> `docs/produto/decisoes/ADR-002-stack.md` (Proposta, opção A: TS + React 19 + Vite, PWA).

## Requisitos

| ID | Resultado | Evidência no ADR / condição |
|---|---|---|
| R-01 | Atende | `src/engine/` puro; lint proíbe `Date`, `Math.random`, DOM, timers e `react` ali. |
| R-02 | Atende com condição | Não há esboço da API do motor. **C1** |
| R-03 | Atende com condição | Relógio de parede injetado (`Date.now()` só em `src/app/`). Falta o relógio monotônico separado. **C2** |
| R-04 | Atende | RNG com semente e estado de 32 bits no save; `Math.random` proibido no motor. |
| R-05 | Atende com condição | O ADR não fala de tempo acelerado. **C3** |
| R-06 | Atende com condição | O simulador importa de `src/engine/` (mesmo código), mas não aponta uma config única de constantes. **C4** |
| R-07 | Atende com condição | Playwright, Chromium sem tela, 360×640 e 360×700, `ubuntu-latest`. Faltam os perfis Android/iPhone e a estimativa de tempo do smoke. **C5** |
| R-08 | Atende com condição | `data-testid` `area-elemento`, mas só para "elemento interativo"; o requisito também cobre números. **C6** |
| R-09 | Atende | Vitest no Node, sem emulador. |
| R-10 | Atende com condição | O Vitest gera cobertura por pasta, mas o ADR não cita o provedor nem o script. **C7** |
| R-11 | Atende com condição | O save usa o `localStorage` direto (slots A/B), sem adaptador. **C8** |
| R-12 | Atende | `visibilitychange`→`hidden` e `pagehide`; no Playwright dá para disparar por evento ou fechando a página/contexto. |
| R-13 | Atende | `number` float64 (até 1,8e308), gatilho para `break_infinity.js` em 1e280, formatação só em `formato.ts`. |
| R-14 | Atende | `npm ci` + `npm run build` na CI, PWA instalável pelo Chrome; APK com Capacitor previsto na fase 2. |
| R-15 | Atende com condição | O service worker funciona sem rede, mas o ADR não diz que não há rede obrigatória. **C9** |
| R-16 | Atende | Ecossistema npm: `npm audit`/OSV-Scanner e Semgrep (TS) disponíveis; ficam na pipeline do QA. |
| R-17 (D) | Atende | `@axe-core/playwright` funciona na mesma stack. |
| R-18 (D) | Atende com condição | Screenshots do Playwright com `animations: 'disabled'`; as fontes precisam estar empacotadas (C9). |
| R-19 (D) | Atende | `vite --host`. Console de debug só em dev entra junto com C3. |
| R-20 (D) | Atende | StrykerJS tem runner para Vitest (fica para a noturna). |
| R-21 (D) | Atende com condição | Sem estimativa no ADR; o QA mede no 1º PR da NX-006. |

**Resumo:** 16/16 obrigatórios atendidos (9 com condição); 5/5 desejáveis.

## Pipeline

- **E2E no Chromium sem tela com perfil de celular:** sim. Condição: usar `isMobile`/`hasTouch` além
  do tamanho da tela (C5).
- **Cobertura da lógica pura:** sim. O motor roda no Node e o Vitest mede por pasta (C7).
- **Proteção da `main`:** o repositório é público, então branch protection e rulesets estão no plano
  gratuito. As checagens obrigatórias são configuradas na NX-006.
- **Atenção:** `node tools/sim-economia/sim.ts` precisa de Node com remoção de tipos ligada por padrão
  (22.18 ou mais novo). "Node 22 LTS" sozinho não basta (C10).

## Veredito: **Assino com condições**

Itens que o `nexus-tech` cumpre na implementação (a NX-015 só é aprovada pelo QA com eles):

- **C1.** O motor expõe `passo(estado, acao, agora) → novoEstado`, sem mutar a entrada, e o estado é
  JSON puro (o teste de ida e volta do save precisa passar).
- **C2.** Interface `Relogio` em `src/app/` com `paredeMs()` (epoch UTC) e `monotonicoMs()`
  (`performance.now()`), as duas injetáveis. A renda online e as partidas usam a monotônica.
- **C3.** Tempo acelerado (×10 a ×100) e console de debug só com `import.meta.env.MODE === 'test'`
  (ou flag de build equivalente), eliminados do build de produção. Um teste confere que o `dist/`
  não os aceita.
- **C4.** Constantes das RN num arquivo único (ex.: `src/engine/config.ts`), importado pelo motor,
  pelo simulador e pelos testes.
- **C5.** `playwright.config.ts` com projetos 360×640, 360×700, Pixel (Chromium) e iPhone (perfil
  no Chromium no PR; WebKit na regressão da `main`), todos com `isMobile` e `hasTouch`.
- **C6.** `data-testid` estável também em todo número exibido (ouro, renda, contadores), sem
  depender do texto do lore.
- **C7.** `@vitest/coverage-v8` com script `test:coverage` e limites por pasta: 90% de linhas e 85% de
  ramos em `src/engine/` e `src/save/`.
- **C8.** Save atrás de uma interface `ArmazenamentoSave`, com versão em memória e falhas
  simuláveis (corrompido, cota cheia, falha no meio da escrita). O `localStorage` é só um adaptador.
- **C9.** Nenhuma requisição fora da própria origem: fontes e assets empacotados, sem CDN ou
  analytics. O E2E bloqueia outras origens e roda um fluxo com `context.setOffline(true)`.
- **C10.** `engines.node` em `>=22.18` no `package.json` e a mesma versão fixada na CI.

Sobre a pendência 1 do ADR (relógio, RN-012): o QA aceita a opção (a) para o MVP, desde que o abuso
de adiantar e voltar o relógio fique registrado num teste unitário como comportamento conhecido.

## Entrega NX-002 (assinatura QA)
Feito: avaliação dos 21 requisitos contra o ADR-002. Veredito: **Assino com condições** (C1 a C10).
Arquivos: `docs/qa/avaliacao-adr-002.md`.
Pendências / riscos: as condições não estão no ADR; se não entrarem na NX-015, o QA reprova a entrega.
O iPhone no PR é só um perfil no Chromium; o WebKit real roda apenas na `main`.
Precisa do PO: incluir C1 a C10 no ADR-002 (ou no aceite da NX-015) e decidir a pendência do relógio.
