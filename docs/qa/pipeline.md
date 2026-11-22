# Pipeline de CI

> Dono: `nexus-qa`. **v0.3** (NX-006, workflow real, 22/11/2026). v0.2 era o desenho da NX-009; v0.1,
> o da NX-006.
> O que mudou da v0.2:
> - os arquivos existem em `.github/workflows/`;
> - actions fixadas por **versão maior** (`actions/checkout@v4`), por pedido do PO, e não por SHA (ver §8);
> - o smoke E2E do PR roda só em 360×640;
> - o Semgrep foi para a noturna;
> - o build usa o `base: './'` do `vite.config.ts` no lugar de `--base ./`;
> - §6 traz o passo a passo para ativar o ruleset `pr-ok`.

## 1. Arquivos

| Arquivo | Gatilho | Para quê |
|---|---|---|
| `.github/workflows/pr.yml` | `pull_request` para a `main`; também é chamado pela main (`workflow_call`) | Checagens que bloqueiam o merge; job final `pr-ok` |
| `.github/workflows/main.yml` | `push` na `main` e manual | Repete o PR, E2E completo, economia × RN; `main-ok`; issue se ficar vermelha |
| `.github/workflows/deploy.yml` | `workflow_run` do "Main" concluído com sucesso | Build e publicação no GitHub Pages |
| `.github/workflows/noturna.yml` | 06:00 UTC (03:00 em Brasília) e manual | Testes longos e varreduras; issue se falhar |
| `tests/ci/checar-cobertura.js` | job `unitarios` | Gate de 90% linhas / 85% ramos por pasta (QA-18, C7) |
| `tests/ci/checar-peso.js` | job `peso` | Pacote inicial < 2 MB gzip; alvo 300 kB; arte + fontes 150 kB; sem endereço externo (C9) |
| `tests/ci/comparar-economia.js` + `economia-base.json` | jobs `economia` e `economia-sementes` | Simulador × tabela "Tempo esperado até cada marco" das RN, tolerância de 20% |
| `tests/e2e/smoke.spec.ts` | job `e2e-smoke` | Abre sem erro, sem pedido externo (CT-538) e sem rolagem lateral (CT-704) |

Os scripts de `tests/ci/` não têm dependência, rodam em Node 22 e escrevem o resumo também na página
do run (`$GITHUB_STEP_SUMMARY`). Rodam igual na máquina; o uso e os parâmetros estão no cabeçalho de
cada arquivo.

## 2. Princípios

- **Uma pipeline, três gatilhos:** PR (rápida, bloqueia o merge), `main` (completa + deploy) e
  noturna (longa).
- **Os mesmos comandos de dev:** a CI chama os scripts do `package.json` (`format:check`, `lint`,
  `typecheck`, `test:coverage`, `build`, `test:e2e`, `sim:economia`) e os scripts do QA em
  `tests/ci/`. Nada de lógica escondida no YAML.
- **Grátis:** só `ubuntu-latest`, gratuito em repositório público. Node **22** em todos os jobs
  (C10: `engines` `>=22.18`; a CI fixa a linha 22 para não subir para a 24 sozinha).
- **Mínimo privilégio:** `permissions: contents: read` no topo de todo workflow. Exceções, só no job
  que precisa: `pull-requests: read` (gitleaks lê os commits do PR), `issues: write` (aviso de main ou
  noturna vermelha), `pages: write` + `id-token: write` (só o job `publicar` do deploy). Checkout com
  `persist-credentials: false`. Sem `pull_request_target`.
- **Sem filtro de caminhos no PR:** se o workflow não rodar, a checagem `pr-ok` fica pendente para
  sempre e trava o merge. PR só de documentação roda tudo.

## 3. PR (`pr.yml`) — bloqueia o merge

```
formato ─┐
lint ────┤
tipos ───┤
unitarios┤                                   (todos em paralelo, menos os que
contraste┤                                    dependem do build)
gitleaks ┤
audit ───┤
build ───┼─► peso ──────┤
         └─► e2e-smoke ─┴─► pr-ok
```

| Job | Comando | Falha quando | Tempo-alvo |
|---|---|---|---|
| `formato` | `npm run format:check` | Arquivo fora do Prettier (o `.prettierignore` do tech exclui `docs/`, `*.md` e `.github/`) | ≤ 1 min |
| `lint` | `npm run lint` | Qualquer erro, inclusive a pureza de `src/engine/` | ≤ 1 min |
| `tipos` | `npm run typecheck` | Qualquer erro (cobre `src/`, `tools/` e `tests/`) | ≤ 1 min |
| `unitarios` | `npm run test:coverage` e `node tests/ci/checar-cobertura.js` | Teste vermelho; `src/engine/` ou `src/save/` abaixo de **90% linhas** ou **85% ramos**; pasta do gate sem arquivo no relatório | ≤ 3 min |
| `build` | `npm run build` (publica o `dist/` como artefato) | Erro de build ou da checagem do build do jogador do tech (`tools/checar-build-jogador.ts`, CT-532) | ≤ 2 min |
| `peso` | `node tests/ci/checar-peso.js dist` | Pacote inicial ≥ **2 MB gzip** ou endereço externo no `index.html`. Acima de 300 kB ou arte + fontes acima de 150 kB: só aviso | ≤ 1 min |
| `contraste` | `node docs/arte/contraste.mjs` | Algum par de cores abaixo do WCAG AA (script da arte) | segundos |
| `e2e-smoke` | `npm run test:e2e -- --grep @smoke --project=360x640` sobre o `dist/` do job `build` | Qualquer caso `@smoke` vermelho em 360×640 | ≤ 4 min |
| `gitleaks` | `gitleaks/gitleaks-action@v2` nos commits do PR | Segredo encontrado | ≤ 1 min |
| `audit` | `npm audit --omit=dev --audit-level=high` | Vulnerabilidade high ou critical em dependência de **produção** (A5). As de desenvolvimento aparecem como aviso no PR e bloqueiam a noturna | ≤ 1 min |
| `pr-ok` | Job agregador | Algum job anterior falhou, foi cancelado **ou pulado** | segundos |

**Tempo total-alvo: ≤ 10 min.** Relatório do Playwright e cobertura ficam como artefatos por 14 dias;
traces só quando falha.

### Regras do `pr-ok` (já no arquivo)

- O job se chama exatamente `pr-ok` (é o nome que o ruleset exige) e fica fora de matriz.
- `needs:` com **todos** os outros jobs e `if: always()`. Ele lê o resultado de cada um e falha se
  algum não for `success`. Sem isso, um job pulado conta como sucesso e o merge passa sem teste.
- **Job novo no `pr.yml` entra no `needs` do `pr-ok`.** Quem revisa um PR que mexe em
  `.github/workflows/` confere isso.

## 4. Main (`main.yml`) e deploy (`deploy.yml`)

| Job | O que faz | Falha → |
|---|---|---|
| `checagens` | Chama o `pr.yml` inteiro (garante que o merge não quebrou nada) | Main vermelha |
| `e2e-completo` | Toda a suíte E2E (menos `@quarentena` e `@noturna`) em todos os projetos do `playwright.config.ts`; Chromium e WebKit (iPhone) | Main vermelha |
| `economia` | `sim:economia` em 30 dias (estratégia `titulo`) e em 7 dias, comparado à tabela das RN pelo `comparar-economia.js` | Algum marco a mais de **20%** da tabela → main vermelha |
| `main-ok` | Agregador, igual ao `pr-ok` | Main vermelha |
| `avisar-falha` | Abre (ou comenta) a issue "[CI] Main vermelha" com o link do run | — |

- **Deploy:** o `deploy.yml` só roda quando o workflow "Main" termina em `success` num push (ou
  disparo manual) na `main`. Ele faz checkout **do mesmo commit** que passou, roda `npm run build`,
  registra o SHA-256 de cada arquivo (artefato `dist-sha256`, 90 dias, e resumo no run; A10) e
  publica com `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`, no ambiente
  `github-pages`. Um deploy por vez; nenhum é cancelado no meio.
- **Caminhos relativos:** o legado usava `vite build --base ./`. Aqui o `vite.config.ts` do tech já
  tem `base: './'`, então o comando é só `npm run build`, igual ao do PR. Não dá para usar
  `npm run build -- --base ./`: o último comando do script `build` é a checagem do tech, não o
  `vite build`, e o argumento iria para o lugar errado.
- **Main vermelha congela novos merges** até a correção (o PO não faz merge de outro PR enquanto a
  `main` estiver vermelha).
- **Regressão visual (CT-706):** entra no `e2e-completo` (screenshots com `toHaveScreenshot`) quando
  existirem as telas e a base aprovada. Hoje não há tela para comparar.
- **Pré-requisito do deploy (uma vez, o dono):** Settings → Pages → Build and deployment → Source =
  **GitHub Actions**. Sem isso o job `publicar` falha.

## 5. Noturna (`noturna.yml`)

| Job | O que faz | Tempo-alvo |
|---|---|---|
| `propriedades-longas` | `npm run test:unit` com `FC_NUM_RUNS=100000` e `NEXUS_NOTURNA=1` (CT-004, CT-005, CT-208, CT-313, CT-337, CT-339, CT-606, CT-617…) | ≤ 30 min |
| `economia-sementes` | A mesma comparação da main com as sementes 1 a 5 (a tabela das RN foi medida assim) | ≤ 5 min cada |
| `e2e-longos` | Testes `@noturna`: encerramento aleatório 100× (CT-505), refundação atômica 50× (CT-413) | ≤ 30 min |
| `quarentena` | Roda os `@quarentena` e informa quantos voltaram a passar. **Nunca** falha a noturna | ≤ 10 min |
| `dependencias` | `npm audit --audit-level=high` com as dependências de desenvolvimento | ≤ 2 min |
| `gitleaks-historico` | gitleaks no histórico inteiro | ≤ 5 min |
| `semgrep` | Semgrep 1.x com `p/typescript`, `p/react` e `p/github-actions` (A3, A9, A14; CT-810) | ≤ 10 min |
| `avisar-falha` | Abre (ou comenta) a issue "[CI] Noturna vermelha" | — |

A noturna não bloqueia merge. **Fica para quando houver o que testar:** mutação com StrykerJS
(precisa de dependência nova, pedido ao tech na hora) e OSV-Scanner.
**Semgrep no PR:** proposta do QA para depois de uma semana de noturna limpa (o desenho v0.2 o punha
no PR; a lista do PO para este bloco não o incluía). Decisão do PO.

## 6. Ativar o ruleset `pr-ok` (PO e dono)

O ruleset já existe na `main`, com a checagem `pr-ok` e origem **GitHub Actions**, e está
**Disabled**. Enquanto estiver assim, o bloqueio depende só do procedimento do PO (risco aberto,
`seguranca.md` A14).

### 6.1 Antes de ativar

1. O PR da NX-015 (o primeiro com o `pr.yml`) roda e o job **`pr-ok` fica verde**. Confira em
   `gh pr checks <número>` que aparece uma linha `pr-ok` com `pass`.
   - Se o `pr-ok` ficar vermelho, **não ative**: ativar agora travaria todo merge. Corrija primeiro.
2. Depois do merge desse PR, confira que o "Main" rodou verde e que o deploy publicou (Settings →
   Pages mostra o endereço).

### 6.2 Ativar (o dono, no navegador; é preciso ser admin)

1. Repositório → **Settings** → **Rules** → **Rulesets** → abrir **`pr-ok`**.
2. **Enforcement status:** trocar de *Disabled* para **Active**.
3. **Target branches:** só a branch padrão (`main`).
4. **Bypass list:** **vazia**. A sessão do PO usa o `gh` com a conta do dono: se o dono estiver no
   bypass, o merge automático passaria por cima do bloqueio.
5. Regras marcadas:
   - **Require status checks to pass**, com a checagem **`pr-ok`** e a origem **GitHub Actions**
     (já estão). Recomendado também *Require branches to be up to date before merging*: o PO roda
     `gh pr update-branch <número>` antes do merge quando a `main` andar.
   - **Require a pull request before merging**, com **0 aprovações**. Com 1 aprovação, nenhum PR do
     próprio dono passaria (ninguém aprova o próprio PR).
   - **Block force pushes** e **Restrict deletions**.
6. **Save changes**.
7. O PO confere pela API que ficou ativo:
   ```bash
   gh api repos/{owner}/{repo}/rulesets --jq '.[] | {name, enforcement}'
   gh api repos/{owner}/{repo}/rules/branches/main --jq '.[].type'
   ```
   Esperado: `pr-ok` com `"enforcement": "active"` e, na lista de regras da `main`, pelo menos
   `required_status_checks`, `pull_request`, `non_fast_forward` e `deletion`.

### 6.3 Teste de bloqueio (logo depois de ativar)

Prova de que um job vermelho impede o merge, inclusive para o dono. O PR de teste **não** mexe em
código de produção: só cria um arquivo em `tests/ci/` fora do Prettier, o que deixa só o job
`formato` vermelho.

```bash
git switch main && git pull
git switch -c teste/bloqueio-pr-ok
printf 'export const teste = "aspas duplas quebram o format:check";\n' > tests/ci/teste-bloqueio.js
git add tests/ci/teste-bloqueio.js
git commit -m "Test that a red job blocks the merge" -m "Temporary PR to prove the pr-ok ruleset blocks merges. Never merge."
git push -u origin teste/bloqueio-pr-ok
gh pr create --base main --title "[TESTE] bloqueio do pr-ok (não fazer merge)" \
  --body "PR de teste da NX-006: o job formato fica vermelho de propósito. Fechar sem merge."
gh pr checks --watch                       # espera terminar
```

| # | Conferir | Esperado |
|---|---|---|
| 1 | `gh pr checks` | `formato` = fail; `pr-ok` = fail; o resto pass |
| 2 | Página do PR no navegador | Merge bloqueado ("Required status check `pr-ok` has failed" ou equivalente) |
| 3 | `gh pr merge --squash` | **Recusado** pelo GitHub |
| 4 | `gh pr merge --squash --admin` | **Recusado** também (bypass vazio). Se passar, o dono está no bypass: tirar e repetir o teste |
| 5 | `git push origin HEAD:main` (push direto) | **Recusado** pela regra de PR obrigatório |

Depois:

```bash
gh pr close --delete-branch --comment "Teste de bloqueio concluído: merge recusado como esperado."
git switch main && git branch -D teste/bloqueio-pr-ok
```

Se algum passo da tabela der diferente do esperado, o ruleset não está protegendo. O PO não faz
merge automático até corrigir e repetir o teste. O QA registra o resultado (links do PR e do run) no
relatório da NX-006 (`docs/qa/relatorios/NX-006.md`).
**Emergência:** o dono desativa o ruleset na hora (passo 6.2, *Disabled*), corrige e reativa,
repetindo o teste.

## 7. Artefatos

| Artefato | Onde | Retenção |
|---|---|---|
| `playwright-smoke` / `playwright-completo` (relatório HTML) | PR / main | 14 / 30 dias |
| `...-traces` (traces, vídeo e screenshot das falhas) | PR / main, só se falhar | 14 / 30 dias |
| `cobertura` (`coverage/`, com o `coverage-summary.json`) | PR e main | 14 dias |
| `dist` (build testado) | PR e main | 14 dias |
| `economia`, `economia-semente-N` (JSON do simulador + tabela) | main / noturna | 90 dias |
| `dist-sha256` (SHA-256 de cada arquivo publicado) | deploy | 90 dias |
| `semgrep`, `playwright-noturna` | noturna | 30 dias |
| Resumo em tabela (cobertura, peso, contraste, economia, `pr-ok`) | página de cada run | a do run |

## 8. Segurança da própria pipeline

- **Actions por versão maior** (`@v4`, `@v2`), por pedido do PO para este bloco. Só actions oficiais
  do GitHub (`actions/*`) e a do gitleaks. Risco aceito: se o dono de uma action mover a tag para um
  código malicioso, a CI roda esse código. Mitigação: permissões mínimas por job, nenhum segredo
  próprio, escrita só no deploy. Recomendação do QA (decisão do PO): ligar o Dependabot para
  `github-actions` e, depois de estabilizar, fixar por SHA com o Dependabot atualizando.
- O gitleaks dispensa licença em repositório de conta pessoal. Se o repositório for movido para uma
  organização, ele passa a pedir o segredo `GITLEAKS_LICENSE`.
- PR de fork roda sem segredos e com token só de leitura (padrão do GitHub); nada no PR precisa de
  segredo.
- Recomendado ao dono: Settings → Code security → *Secret scanning* com *Push protection* e alertas
  do Dependabot; Settings → Actions → General → *Workflow permissions* = **Read repository
  contents** (os workflows já declaram o que precisam).

## 9. O que depende do tech (pedido QA-28)

O `package.json` e as configs são do tech. A pipeline já está alinhada com o que existe hoje
(`test:coverage` com `json-summary`, `base: './'`, `.prettierignore`). Ainda faltam:
- `playwright.config.ts` com `testDir: 'tests/e2e'` e o projeto **`360x640`** (o PR roda
  `--project=360x640`), `baseURL` e `webServer` que sirva o `dist/` já pronto (o job baixa o artefato
  do `build`) ou que gere o build de teste sozinho, se o E2E usar o `dist-teste/`;
- testes de propriedade lendo `FC_NUM_RUNS` e testes longos atrás de `NEXUS_NOTURNA=1`;
- o `include` do Vitest cobrir `tests/**/*.test.ts` quando o QA escrever os testes de integração;
- um jeito de injetar estado no build de teste (CT-807, CT-808).

Enquanto o `playwright.config.ts` não existir, o job `e2e-smoke` fica vermelho e o `pr-ok` também.
É o comportamento certo: não há como provar que o jogo abre.
