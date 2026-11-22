# Nexus Idle

Jogo mobile no estilo idle, ambientado no LoL competitivo. **Projeto do zero**, de fã, gratuito e sem
fins comerciais. O dono escreve em português e usa principalmente o celular.

Stack aprovada no ADR-002: TypeScript + React 19 + Vite, PWA publicada no GitHub Pages. O código começa
na NX-015 (Sprint 1).

## Como o projeto é tocado

A sessão principal é o **PO** (`.claude/agents/nexus-po.md`) e orquestra os outros agentes. As regras
do time estão em `docs/produto/time-de-agentes.md`. Leia antes de qualquer trabalho.

| Agente | Papel |
|---|---|
| `nexus-po` | Product Owner: regras de negócio, backlog, decisões e aceite. Palavra final. |
| `nexus-arte` | Arte e identidade visual |
| `nexus-tech` | Arquitetura e código |
| `nexus-ux` | UI/UX |
| `nexus-qa` | Testes (segurança, regressão, usabilidade, integração, exploratórios) e pipeline |
| `nexus-lore` | Lore, histórias, textos, narrativas e temporadas |

**Toda decisão de produto, stack, visual, narrativa ou processo é tomada pelo time e registrada
pelo PO** em `docs/produto/decisoes/ADR-###-titulo.md`. Nada é presumido.

## Comandos

Requisito: Node 22.18 ou mais novo (o npm vem junto). Rode tudo na raiz do repositório.

| Para | Comando |
|---|---|
| Instalar dependências | `npm ci` |
| Rodar no navegador (também abre no celular pela rede local) | `npm run dev` |
| Testar: lint + tipos + unitários com cobertura (falha abaixo de 90% linhas / 85% ramos em `src/engine` e `src/save`) | `npm test` |
| Build de produção (PWA em `dist/`; falha se sobrar debug) | `npm run build` (para conferir: `npm run preview`) |
| Teste de ponta a ponta no `dist/` (perfis `360x640`, `360x700`, `pixel`, `iphone`) | `npm run build` e depois `npm run test:e2e` (1ª vez: `npx playwright install chromium webkit`) |
| Build de teste (tempo acelerado `?acelerar=N` e debug, em `dist-teste/`) | `npm run build:teste` e `npm run preview:teste` |
| Medir o peso da 1ª carga | `npm run medir:peso` (depois do build) |
| Formatar o código | `npm run format` (conferir: `npm run format:check`) |
| Simular a economia | `npm run sim:economia` (opções em `tools/sim-economia/README.md`) |

Sem WebKit instalado, rode o E2E com `E2E_IPHONE_NAVEGADOR=chromium`; se o Playwright não conseguir
baixar o Chromium, aponte um já instalado com `E2E_CHROMIUM=<caminho do executável>`.

Lógica de jogo só em `src/engine/` (funções puras; o lint barra relógio, sorteio global e DOM ali).
Constantes das RN num arquivo só (`src/engine/regras.ts`). Textos só em `src/content/`. Tokens
visuais gerados com `npm run gerar:tokens`; ícones do app com `npm run gerar:icones`. Detalhes no
ADR-002 e em `docs/tech/nx-015-relatorio.md`.

## Onde está cada coisa

- `docs/produto/`: visão, regras de negócio, backlog, pedidos entre áreas e decisões.
- `docs/arte/`, `docs/ux/`, `docs/lore/`, `docs/qa/`, `docs/tech/`: uma pasta por área.
- `docs/legado/`: conhecimento do projeto anterior (Nexus eSports Manager), só para consulta. Leia
  `docs/legado/README.md` antes de reaproveitar algo. O código completo do manager está na branch
  `legado-manager`.

## Jeito de trabalhar com o dono

- Um commit por bloco, um PR por etapa. PR em português; commit em inglês (imperativo + corpo
  explicando o porquê).
- **Merge automático (autorizado em 11/11/2026):** ao fim de cada etapa, abra o PR e faça o merge no
  `main`, depois de passar nas checagens que o time tiver definido. Se algo falhar, não faça o merge;
  avise.
- Respostas curtas, em português simples, com ressalvas e erros ditos com clareza.
- Nada no jogo custa dinheiro de verdade.
