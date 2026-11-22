# Pipeline de CI — desenho

> Dono: `nexus-qa`. **v0.2** (NX-009, 20/11/2026); v0.1 era da NX-006. **Desenho**, não o workflow
> real: os arquivos em `.github/workflows/` saem junto com a NX-015 (Sprint 1), quando o projeto Vite
> existir. A stack está definida (ADR-002): TypeScript + React 19 + Vite, PWA no GitHub Pages,
> Vitest, Playwright, ESLint, Prettier, Node ≥ 22.18.
> O que mudou da v0.1: comandos concretos no lugar de **[stack]**; repositório público confirmado;
> ruleset `pr-ok` criado pelo dono (desativado até a pipeline existir); deploy no GitHub Pages; sem
> APK/MobSF no MVP.

## 1. Princípios

- **Uma pipeline, três gatilhos:** PR (rápida, bloqueia o merge), `main` (completa + deploy) e
  noturna (longa).
- **Os mesmos comandos de dev:** a CI chama só os scripts do `package.json` listados no ADR-002
  (`format:check`, `lint`, `typecheck`, `test:unit`, `test:coverage`, `build`, `test:e2e`,
  `sim:economia`). Nada de lógica escondida no YAML.
- **Grátis:** só executor `ubuntu-latest`, gratuito em repositório público.
- **Determinística:** relógios e sorteio injetados; o E2E bloqueia toda origem que não seja a do
  próprio site e falha se houver tentativa (C9).
- **Mínimo privilégio:** `permissions: contents: read` por padrão; actions fixadas por SHA; sem
  `pull_request_target`; permissões de escrita só no job de deploy da `main` (ver `seguranca.md`, A14).

## 2. PR (`pull_request` para `main`) — bloqueia o merge

```
           ┌─ lint + formato ─┐
instalar ──┼─ tipos ──────────┼─► testes + cobertura ─► build + tamanho ─► e2e-smoke ─┐
(cache)    └─ segurança ──────┘   (gate 90/85)                              (4 perfis)  ├─► pr-ok
             (gitleaks, Semgrep, audit, lista proibida, segredos no build) ────────────┘
```

| # | Job | Comando | Falha quando | Tempo-alvo |
|---|---|---|---|---|
| 1 | `instalar` | `npm ci` (cache do npm; Node da `engines`, C10) | Lockfile fora de sincronia | ≤ 1 min |
| 2 | `lint` | `npm run format:check` e `npm run lint` | Qualquer erro, inclusive a regra de pureza de `src/engine/` | ≤ 1 min |
| 3 | `tipos` | `npm run typecheck` | Qualquer erro | ≤ 1 min |
| 4 | `testes` | `npm run test:coverage` (unitários, propriedades curtas e integração) | Teste vermelho; cobertura de `src/engine/` ou `src/save/` < **90% linhas** ou < **85% ramos** (QA-18, C7); caso CT de RN removido sem substituto | ≤ 3 min |
| 5 | `build` | `npm run build` + checagem de tamanho + varredura do `dist/` | Erro de build; pacote inicial ≥ 2 MB gzip; flag de tempo acelerado ou debug no `dist/` (C3, CT-532) | ≤ 2 min |
| 6 | `e2e-smoke` | `npm run test:e2e -- --grep @smoke` | Qualquer falha nos casos `@smoke` (Gherkin de NX-010 a NX-015 e NX-018, layout 360×640) nos 4 perfis (C5), com axe-core nas telas visitadas | ≤ 4 min |
| 7 | `seguranca` | gitleaks no diff; Semgrep (TS, React, GitHub Actions e regras próprias A3/A9/A13); `npm audit --omit=dev --audit-level=high`; lista proibida (CT-621) | Segredo achado; achado Semgrep `ERROR`; vulnerabilidade `high`/`critical` em dependência de produção sem exceção registrada | ≤ 3 min |
| 8 | `pr-ok` | Job agregador | Qualquer job anterior falhou, foi cancelado **ou pulado** | segundos |

**Tempo total-alvo do PR: ≤ 10 min** (jobs 2, 3 e 7 em paralelo).

### Detalhes obrigatórios do `pr-ok`

- O job se chama exatamente `pr-ok` (é o nome que o ruleset exige), fica fora de matriz e tem
  `needs:` com todos os outros jobs.
- Usa `if: always()` e falha se algum `needs.<job>.result` for diferente de `success`. Sem isso, um
  job pulado conta como sucesso para o GitHub e o merge passa sem teste.
- O workflow de PR **não** usa filtro de caminhos (`paths`/`paths-ignore`): se ele não rodar num PR
  só de documentação, a checagem obrigatória fica "pendente" para sempre e trava o merge. PR só de
  docs roda a pipeline inteira (rápida enquanto não houver mudança de código).

### Como o merge é bloqueado

1. **Ruleset `pr-ok` na `main` (já criado pelo dono, decisão do QA-19):** exige a checagem `pr-ok`
   com **origem GitHub Actions** (outra integração ou chamada à API não consegue marcar a checagem
   como verde). Está **desativado** até a pipeline existir.
   - **Ativar** (o dono, que é admin) só depois de o workflow rodar ao menos uma vez com `pr-ok` verde
     num PR, para o nome da checagem aparecer e bater. Antes disso, ativar travaria todo merge.
   - Recomendações do QA para o mesmo ruleset: exigir PR antes do merge, bloquear push direto e
     force-push, exigir branch atualizada; **lista de bypass vazia**. A sessão do PO usa o `gh` com a
     conta do dono: se o dono estiver no bypass, o merge automático também passaria por cima do
     bloqueio. Numa emergência, o dono desativa o ruleset na hora e reativa depois.
2. **Merge automático (CLAUDE.md, 11/11/2026):** a sessão do PO só faz o merge depois de
   `gh pr checks` mostrar tudo verde; se algo falhar, não faz o merge e avisa. Com o ruleset ativo,
   o GitHub também recusa o merge.
3. Enquanto o ruleset estiver desativado, o bloqueio depende só do passo 2 (procedimento). O PO deve
   tratar como risco aberto até a ativação (ver §7).

## 3. Main (`push` na `main`)

| Job | O que faz | Falha → | Tempo-alvo |
|---|---|---|---|
| Tudo do PR | Mesmo conjunto (garante que o merge não quebrou nada) | Main vermelha | ≤ 10 min |
| `e2e-completo` | Toda a suíte E2E de regressão, nos 4 perfis; iPhone também no WebKit | Main vermelha | ≤ 12 min |
| `visual` | Screenshots das telas do CT-706 contra a base aprovada | Main vermelha; diferenças anexadas | ≤ 5 min |
| `economia` | `npm run sim:economia` comparado à tabela de tempos das RN | Diferença > 20% em algum marco → main vermelha (gate só depois da NX-008; antes, informativo) | ≤ 5 min |
| `deploy` | Publica o `dist/` no GitHub Pages; só roda se os jobs acima passarem | Deploy não acontece; main vermelha | ≤ 3 min |

O job `deploy` é o único com `pages: write` e `id-token: write`, e roda no ambiente `github-pages`.
**Main vermelha congela novos merges** até a correção (o PO não faz merge de outro PR enquanto a
`main` estiver vermelha). A falha abre issue automática com o link do run.

## 4. Noturna (`schedule`, 06:00 UTC = 03:00 em Brasília, e `workflow_dispatch`)

| Job | O que faz | Tempo-alvo |
|---|---|---|
| `propriedades-longas` | fast-check com 100.000 execuções por propriedade (CT-004, CT-005, CT-313, CT-339, CT-606…) | ≤ 20 min |
| `sorteio-em-escala` | 100.000 partidas por P de referência (CT-208); no Alfa, 100 mil sorteios do gacha com pity (NX-020) | ≤ 5 min |
| `save-estresse` | Encerramento aleatório 100× (CT-505), refundação atômica 50× (CT-413) | ≤ 15 min |
| `quarentena` | Roda os testes `@quarentena` e informa quantos voltaram a passar | ≤ 10 min |
| `mutacao` | StrykerJS com runner do Vitest em `src/engine/`, informativo | ≤ 30 min |
| `dependencias` | `npm audit` completo, OSV-Scanner, gitleaks no histórico inteiro | ≤ 10 min |

A noturna não bloqueia merge; falha abre issue e entra no relatório do QA. **Teto: 60 min.**

## 5. Artefatos publicados

| Artefato | Pipelines | Retenção |
|---|---|---|
| Relatório HTML do Playwright | PR, main | 14 dias (PR), 30 dias (main) |
| Traces, vídeo e screenshot só das falhas | PR, main | 14 / 30 dias |
| Relatório de cobertura (HTML + resumo no PR) | PR, main | 14 / 30 dias |
| Relatório de segurança (gitleaks, Semgrep SARIF, auditoria) | PR, main, noturna | 30 dias; SARIF também na aba Security (disponível em repositório público) |
| Diferenças visuais | main | 30 dias |
| Saída do `sim:economia` (CSV/markdown) | main, noturna | 90 dias |
| `dist/` publicado + SHA-256 do build | main | Até o próximo deploy |

## 6. Repositório público: o que muda

- Actions e GitHub Pages gratuitos; rulesets e checagens obrigatórias disponíveis no plano gratuito.
- Qualquer pessoa pode abrir PR de fork: o workflow de PR roda **sem segredos** e com token só de
  leitura (é o padrão para forks). Nada no PR precisa de segredo; o deploy fica só na `main`.
- Tudo o que entra no histórico é público para sempre: gitleaks no PR e no histórico (noturna) é
  obrigatório. Recomendado ao dono ligar o *secret scanning* com *push protection* e os alertas do
  Dependabot nas configurações do repositório.

## 7. Fase atual e próximos passos

Enquanto não há código, nenhum workflow é criado. Ordem prevista:

1. **NX-015:** primeira versão real do workflow de PR (jobs 1 a 5, 7 e 8; o `e2e-smoke` entra com a
   primeira tela, mas o job já existe e roda o teste de "abre sem erro").
2. Primeiro PR com `pr-ok` verde → o PO pede ao dono para **ativar o ruleset `pr-ok`** e confere com
   um PR de teste que um job vermelho bloqueia o merge.
3. Workflow da `main` com deploy no Pages; noturna em seguida.
4. Gate do job `economia` depois da NX-008.
