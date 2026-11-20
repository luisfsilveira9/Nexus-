# ADR-002 — Stack, estrutura do repositório e comandos padrão

- **Status:** **Aprovada** pelo PO em 20/11/2026, com as condições C1–C10 do QA (ver "Decisão do PO" no fim)
- **Proposto por:** `nexus-tech` (NX-002), 20/11/2026
- **Consultado:** ADR-001 (item 6, plataforma), RN v0.1 (RN-011, RN-012, RN-015, RN-017), simulador da
  NX-007 (`docs/tech/nx-007-relatorio.md`), legado (`docs/legado/referencia/arquitetura.md`,
  `modo-cartas.md`, `sessoes-na-nuvem.md`)

## Contexto

O Nexus Idle é um idle em retrato para celular (~360 px), feito e mantido por agentes de IA, para uso
pessoal do dono. Requisitos que pesam na escolha:

1. **Rodar no Android do dono sem loja de apps** (ADR-001, item 6). iOS é desejável.
2. Lógica de jogo em funções puras, testável sem tela, com teste de ponta a ponta automatizado e
   sem tela na pipeline (NX-006).
3. Números além de 1e15 (RN-017). O simulador mediu ouro máximo de 2,7e14 em 1 semana, 1,6e15 em
   30 dias e 4,7e16 em 1 ano de jogo contínuo.
4. Save local confiável, com perda máxima de 10 s (RN-015).
5. Ganho offline pelo relógio do aparelho (RN-011, RN-012).
6. Tela principal a 60 fps num celular intermediário e pacote inicial abaixo de 2 MB (gzip).
7. Os agentes mantêm o código e precisam conseguir rodar, testar e ver o resultado sozinhos, numa
   sessão na nuvem sem interface gráfica.

## Opções avaliadas

| | **A. Web: TypeScript + React + Vite, instalado como PWA** (Capacitor para APK, se preciso) | **B. React Native (Expo)** | **C. Flutter** | **D. Godot 4** |
|---|---|---|---|---|
| **Custo de aprendizado** | Baixo. TS/React é a stack com mais material para agentes, e o manager do legado já usava React + TS + Vite. | Médio. React, mas com componentes próprios (`View`, `Text`), Metro e build nativo. | Médio-alto. Dart e um modelo de widgets novos para o projeto. | Alto. GDScript, editor visual e cenas `.tscn` que os agentes editam às cegas. |
| **Performance (celular intermediário)** | Boa para uma tela de listas, números e barras. 60 fps exige disciplina: animar só `transform`/`opacity` e atualizar números a 4–10 Hz, não a cada quadro. | Boa (componentes nativos). | Muito boa (renderizador próprio). | Muito boa no desenho 2D, mas mantém um loop de render que gasta bateria num jogo que fica parado na maior parte do tempo. |
| **Android sem loja** | **Melhor.** O dono abre um link no Chrome e toca em "Instalar app". Atualiza sozinho a cada deploy, sem reinstalar. Se for preciso, o Capacitor gera um APK para instalar à mão. | APK por EAS Build (nuvem, conta Expo) ou Gradle local; instalar à mão a cada versão. | `flutter build apk`; instalar à mão a cada versão. | Exportar APK com templates, SDK e keystore; instalar à mão a cada versão. |
| **iOS (desejável)** | **Funciona sem App Store e sem Mac:** Safari → "Adicionar à Tela de Início". | Precisa de macOS + Xcode + conta Apple; perfil gratuito expira em 7 dias. | Igual a B. | Igual a B. |
| **Testabilidade** | **Melhor.** Unitário com Vitest no Node. E2E com Playwright no Chromium sem tela em 360×640: o mesmo motor que o jogador usa. O legado já fazia isso. | Unitário com Jest bom. E2E (Detox/Maestro) exige emulador Android na CI: lento e instável. | Unitário e de widget sem tela bons. E2E exige emulador; no web é tudo canvas, sem seletores. | Unitário sem tela possível (GUT/gdUnit4). E2E de interface praticamente inexistente. |
| **Números grandes** | `number` (float64) chega a 1,8e308. Se um dia faltar, há `break_infinity.js`, feito para idles em JS. | Igual a A (JS). | `double` resolve; não há biblioteca madura de números gigantes. | `float` de 64 bits resolve; sem biblioteca padrão para números gigantes. |
| **Save local (RN-015)** | `localStorage` grava na hora (síncrono), o que garante o save ao minimizar. O risco é o navegador apagar os dados: precisa pedir armazenamento persistente e ter exportar/importar. No APK do Capacitor o save fica nos dados do app. | Armazenamento privado do app (robusto). | Igual a B. | Arquivo em `user://` (robusto). |
| **Offline (RN-011/012)** | Só tem o relógio do aparelho entre sessões. | Pode usar relógio monotônico nativo (protege contra adiantar o relógio, mas zera ao reiniciar o aparelho). | Igual a B. | Igual a B. |
| **Manutenção por agentes** | **Melhor.** Tudo é texto e tipado. O agente roda, testa e tira print sem tela. | Boa no código; frágil nas atualizações de SDK nativo. | Razoável. | Fraca: o fluxo depende do editor visual. |
| **Tamanho** | React + ReactDOM somam ~60 kB gzip; o jogo todo deve ficar bem abaixo de 2 MB (estimativa). | APK com runtime de JS (estimativa: dezenas de MB). | APK de alguns MB por arquitetura (estimativa). | Build web mínimo de ~6 MB, medido por terceiros ([Godot-Web-LoadingTest](https://github.com/JohannesDeml/Godot-Web-LoadingTest), versões 4.4–4.6). Passa do limite de 2 MB. |

Unity foi descartada antes da tabela: editor pesado, licença, build grande e pouca automação sem tela.
Pelos mesmos motivos ela fica pior que D em quase todos os critérios.

## Recomendação: opção A

**TypeScript + React 19 + Vite, publicado como PWA no GitHub Pages.** Um empacotamento Capacitor para
gerar APK fica previsto, mas só entra se aparecer um gatilho (veja "Fase 2").

Por quê:
- É a única opção que atende o Android sem loja **e** o iOS sem App Store, sem Mac e sem reinstalar
  a cada versão. Com merge automático no `main` (CLAUDE.md), o dono recebe cada etapa sozinho.
- Na testabilidade, o E2E roda no mesmo motor do jogo (Chromium), sem emulador, em 360×640, na CI
  gratuita. O legado provou esse caminho (`sessoes-na-nuvem.md`).
- O motor puro em TypeScript roda no Node sem build: o simulador da NX-007 já roda assim. O
  simulador e o jogo vão usar **o mesmo código** de regras, então o que o PO calibra é o que vai para
  o jogo.
- É a stack que os agentes mantêm com menos erro e que o dono já usou no manager.

Custos aceitos:
- **Save no navegador pode ser apagado** (limpeza de dados pelo usuário, falta de espaço). No iOS, o
  WebKit apaga os dados de um site depois de 7 dias de uso do Safari sem interação. Um app na tela de
  início tem a própria contagem de dias, que zera quando o app é usado
  ([WebKit, "Full Third-Party Cookie Blocking and More"](https://webkit.org/?p=10218)). Mitigações:
  `navigator.storage.persist()`, dois slots de save com checksum, aviso se o armazenamento não for
  persistente, e exportar/importar save como texto (ideia do legado, `modo-cartas.md`).
- **Sem relógio monotônico entre sessões** (veja "Pendências").
- **60 fps depende de disciplina,** não da ferramenta. Regras abaixo.

### Fase 2 (só com gatilho): APK com Capacitor

Gatilho: o PWA perder um save no aparelho do dono, ou o PO pedir um APK. Aí entra o Capacitor
(Android). Compilar Android exige Android Studio e SDK de API 24 ou maior; iOS exige macOS e Xcode
([Capacitor, Environment Setup](https://capacitorjs.com/docs/getting-started/environment-setup)). Por
isso o APK seria gerado na CI (o executor Ubuntu já traz o SDK Android) e instalado à mão. O código
do jogo não muda. Precisa de um ADR curto na hora.

## Decisões técnicas que vêm junto

| Tema | Decisão |
|---|---|
| Linguagem | TypeScript `strict`, com `erasableSyntaxOnly` (sem `enum`/`namespace`), para o motor rodar no Node sem build. |
| Node / pacotes | Node 22 LTS e npm (vem com o Node; `npm ci` na CI). |
| UI | React 19. Estado do jogo numa store mínima com `useSyncExternalStore`, sem biblioteca de estado. |
| Estilo | CSS com variáveis (tokens do `nexus-ux` em `src/ui/tokens/tokens.css`) e CSS Modules do Vite. Sem Tailwind: menos dependência, e os tokens ficam num lugar só. |
| PWA | `vite-plugin-pwa` (manifest + service worker; funciona sem rede). |
| Lint | ESLint 9 (configuração flat) com `typescript-eslint` e `eslint-plugin-react-hooks`. Regra **só para `src/engine/`**: proíbe `Date`, `Math.random`, `performance`, `window`, `document`, `localStorage`, timers e imports de `react`/`src/ui`. Assim, a pureza do motor é checada pela máquina. |
| Formatador | Prettier (aspas simples, 100 colunas). |
| Testes | Vitest (unitários do motor e do save, do `nexus-tech`). Playwright (E2E em 360×640 e 360×700 no Chromium sem tela, do `nexus-qa`). `node --test` não é usado no projeto: o simulador migra para Vitest junto com o motor. |
| Números | `number` (float64) em todo o motor e no save (JSON). Formatação só por `src/engine/formato.ts` (RN-017). **Gatilho para `break_infinity.js`:** algum valor passar de 1e280 em 1 ano de jogo contínuo no simulador, ou uma RN criar crescimento exponencial do Legado. Hoje o máximo medido é 4,7e16 (NX-007). Acima de 2^53 os inteiros deixam de ser exatos, mas o erro relativo (~1e-16) não aparece com 3 algarismos e não muda nenhuma compra. |
| Sorteio | Gerador com semente e estado de 32 bits salvo no save (RN-009), como em `tools/sim-economia/rng.ts`. |
| Save | `{ saveVersion, salvoEm, estado, checksum }` em JSON, gravado alternando dois slots do `localStorage` (A/B), com checksum FNV-1a do conteúdo. Na carga, vale o save válido mais novo. Se os dois estiverem corrompidos, guarda as cópias cruas e avisa, sem sobrescrever nada (RN-015). Grava a cada 10 s, a cada compra, ao fim de cada partida e em `visibilitychange`→`hidden` e `pagehide`. Migrações em `src/save/migracoes.ts`, uma função por versão (ideia do legado, `modo-cartas.md`). |
| Offline | Fórmula fechada (RN-011) a partir de `Date.now()` lido **só** na camada `src/app/` e passado ao motor. |
| 60 fps | O motor credita a renda a 1 Hz (RN-002); a tela atualiza números a 4–10 Hz. Animação só com `transform`/`opacity`. Nada de trabalho pesado na thread de UI (o passo do motor leva microssegundos; um worker só entra se a medição pedir). O QA mede com CPU desacelerada 4× no Playwright como substituto de celular intermediário. |
| Orçamento | Pacote inicial abaixo de 2 MB gzip, checado na pipeline (alvo interno: 300 kB). |
| Textos | Só em `src/content/` (do `nexus-lore`), com chaves estáveis; componentes nunca têm texto escrito à mão. |
| Testes de interface | Todo elemento interativo tem `data-testid` estável, no formato `area-elemento` (ex.: `gerador-comprar-live`). |

## Estrutura de pastas proposta

```
src/
  engine/          lógica pura das RN: regras, estado, economia, elenco, partida, offline,
                   prestígio, rng, formato (RN-017). Testes unitários ao lado (*.test.ts). Dono: tech
  save/            serialização, saveVersion, migrações, checksum e slots. Dono: tech
  app/             relógio real, loop (1 Hz), visibilidade, store e ligação motor↔tela. Dono: tech
  ui/              componentes e telas React. Dono: tech (código), seguindo o ux
    tokens/        tokens visuais (tokens.css). Dono: ux
  content/         textos pt-BR, nomes, capítulos (JSON/TS tipado). Dono: lore
  main.tsx
assets/            arte original (SVG/PNG) e inventário de origem. Dono: arte
public/            manifest, ícones do app gerados a partir de assets/
tests/             e2e/ (Playwright), integração e regressão. Dono: qa
tools/
  sim-economia/    simulador headless; passa a importar de src/engine/. Dono: tech
docs/              como hoje
.github/workflows/ pipeline e deploy. Dono: qa
```

## Seção "Comandos" para o CLAUDE.md (entra quando o PO aprovar)

```markdown
## Comandos

Requisito: Node 22 LTS ou mais novo (o npm vem junto). Rode tudo na raiz do repositório.

| Para | Comando |
|---|---|
| Instalar dependências | `npm ci` |
| Rodar no navegador (também abre no celular pela rede local) | `npm run dev` |
| Testar: lint + tipos + unitários | `npm test` |
| Teste de ponta a ponta (Chromium sem tela, 360×640 e 360×700) | `npm run test:e2e` (1ª vez: `npx playwright install chromium`) |
| Build de produção (PWA em `dist/`) | `npm run build` (para conferir: `npm run preview`) |
| Formatar o código | `npm run format` |
| Simular a economia | `npm run sim:economia` (opções em `tools/sim-economia/README.md`) |

Stack e motivos: `docs/produto/decisoes/ADR-002-stack.md`. Lógica de jogo só em `src/engine/`
(funções puras; o lint barra relógio, sorteio global e DOM ali). Textos só em `src/content/`.
```

Scripts do `package.json` que sustentam esses comandos: `dev` (`vite --host`), `build`
(`tsc -b && vite build`), `preview`, `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test:unit`
(`vitest run`), `test` (lint + typecheck + test:unit), `test:e2e` (`playwright test`), `format`
(`prettier --write .`), `format:check` e `sim:economia` (`node tools/sim-economia/sim.ts`). A pipeline
do QA (NX-006) chama `format:check`, `lint`, `typecheck`, `test:unit`, `build`, `test:e2e` e a
checagem de tamanho.

## Reaproveitamento do legado

Nenhum código do legado é copiado. Reaproveitamos **ideias**, com origem citada:
- save versionado com migrações e exportar/importar como texto: `docs/legado/referencia/modo-cartas.md`;
- E2E no Chromium em 360×640 e 360×700, com auditoria de layout: `docs/legado/referencia/sessoes-na-nuvem.md`;
- deploy gratuito no GitHub Pages com `--base ./` e executor `ubuntu-latest`: mesmo arquivo;
- formatação de números num módulo só: `docs/legado/referencia/arquitetura.md` (`fmt.ts`).

## Consequências

- A NX-006 (QA) monta a pipeline com Vitest + Playwright + ESLint + Prettier + checagem de tamanho.
- A primeira história do Sprint 1 (NX-015) cria o projeto Vite e move `tools/sim-economia/motor.ts`,
  `rng.ts` e `formato.ts` para `src/engine/`, com os testes migrados para Vitest.
- O jogo fica num endereço público do GitHub Pages (como o manager). É gratuito e fora de loja, mas o
  PO deve confirmar que isso combina com o ADR-001.

## Pendências para o PO

1. **Relógio (RN-012):** no navegador não há relógio monotônico entre sessões. Quem adianta o relógio
   8 h, abre o jogo, volta o relógio e repete ganha 8 h a cada ciclo. Isso contraria a frase "nenhuma
   regra dá vantagem a quem adianta o relógio além do limite de 8 h". Opções: (a) aceitar, já que o
   jogo é pessoal e sem ranking; (b) limitar o ganho offline somado a 8 h por janela de 8 h do
   relógio do aparelho (reduz o abuso, mas não o elimina); (c) relógio monotônico, só no APK (fase 2).
   Recomendo (a) no MVP, com o caso registrado no teste unitário.
2. **Assinatura do QA** na linha "Testabilidade" e na lista de scripts da pipeline.
3. **Endereço público** no GitHub Pages (veja "Consequências").

## Decisão do PO (20/11/2026)

**Aprovada a opção A** (TypeScript + React 19 + Vite, PWA no GitHub Pages; APK com Capacitor só com
gatilho).

1. **Testabilidade:** o `nexus-qa` assinou com condições (`docs/qa/avaliacao-adr-002.md`). As
   condições **C1–C10** passam a fazer parte desta decisão e são critério de aceite da NX-015:
   - C1: motor exposto como função pura `passo(estado, acao, agora)`, com estado em JSON.
   - C2: relógio de parede e relógio monotônico injetáveis.
   - C3: tempo acelerado e debug só no build de teste, com teste que garante a ausência no build do jogador.
   - C4: constantes das RN num arquivo único, usado pelo motor, pelo simulador e pelos testes.
   - C5: perfis 360×640, 360×700, Pixel e iPhone no Playwright, com toque e modo celular.
   - C6: `data-testid` em todo número exibido, além dos botões.
   - C7: script de cobertura com mínimo de 90% das linhas e 85% dos ramos em `src/engine/` e `src/save/`.
   - C8: save atrás de uma camada própria, com versão em memória e falhas simuláveis.
   - C9: nenhum pedido de rede fora do próprio site; o E2E bloqueia outros endereços e testa o modo avião.
   - C10: `engines` do `package.json` em Node ≥ 22.18.
2. **Relógio (pendência 1):** nenhuma das opções (a), (b) ou (c). A **RN-012 v0.2** fecha a brecha
   guardando no save o maior horário de parede já visto: `t_off = max(0, agora − maior)`. Assim um
   ciclo de adiantar e atrasar dá no máximo 8 h uma única vez, sem precisar de relógio confiável. O
   QA mantém um teste do ciclo.
3. **Endereço público (pendência 3):** aceito. O jogo é gratuito, fora de loja e sem login, o que
   está de acordo com o ADR-001. O rodapé de créditos traz a frase de que a Riot Games não endossa o
   projeto (política de projetos de fã).
4. Os comandos foram para o `CLAUDE.md`. Passam a funcionar quando a NX-015 criar o projeto.
