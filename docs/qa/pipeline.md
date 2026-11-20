# Pipeline de CI — desenho

> Dono: `nexus-qa`. NX-006, v0.1 (20/11/2026). **Desenho**, não o workflow real: os arquivos em
> `.github/workflows/` serão escritos depois que o PO aprovar o ADR-002. Tudo marcado **[stack]**
> troca de comando conforme a stack escolhida; a estrutura (etapas, gates, artefatos) não muda.

## 1. Princípios

- **Uma pipeline, três gatilhos:** PR (rápida, bloqueia o merge), `main` (completa) e noturna (longa).
- **Os mesmos comandos de dev:** a CI chama só os scripts padrão listados no `CLAUDE.md`
  (instalar, lint, tipos, testar, build, e2e). Nada de lógica escondida no YAML.
- **Grátis:** só executor `ubuntu-latest` (lição do legado). Sem executores maiores.
- **Determinística:** relógio e sorteio injetados nos testes; nenhuma chamada a rede externa nos
  testes (o E2E bloqueia rede e falha se houver tentativa).
- **Mínimo privilégio:** `permissions: contents: read` por padrão; actions fixadas por SHA;
  sem `pull_request_target`; segredos só em jobs da `main` (ver `seguranca.md`, A14).

## 2. PR (`pull_request` para `main`) — bloqueia o merge

```
           ┌─ lint ─────────┐
instalar ──┼─ tipos ────────┼─► unit+integração+cobertura ─► build ─► e2e-smoke ─┐
(cache)    └─ segurança ────┘   (gate de cobertura)                    (2 perfis)  ├─► pr-ok
             (gitleaks, Semgrep,                                                   │
              audit, lista proibida) ──────────────────────────────────────────────┘
```

| # | Job | O que faz | Falha quando | Tempo-alvo |
|---|---|---|---|---|
| 1 | `instalar` | Instala com lockfile congelado e cache **[stack]** (`npm ci`/`pnpm install --frozen-lockfile`) | Lockfile fora de sincronia | ≤ 1 min |
| 2 | `lint` | Linter e formatação | Qualquer erro | ≤ 1 min |
| 3 | `tipos` | Checagem de tipos **[stack]** (`tsc --noEmit` ou equivalente) | Qualquer erro | ≤ 1 min |
| 4 | `testes` | Unitários, propriedades (versão curta) e integração, com cobertura | Teste vermelho; cobertura da lógica do jogo < **90% linhas** ou < **85% ramos**; caso CT de RN removido sem substituto | ≤ 3 min |
| 5 | `build` | Build de produção | Erro de build; bundle acima do orçamento (a definir com tech, ex.: 1 MB) | ≤ 2 min |
| 6 | `e2e-smoke` | Casos marcados `@smoke` (Gherkin de NX-010 a NX-015, layout 360×640) em 360×640 e Pixel/iPhone **[stack]**; axe-core nas telas visitadas | Qualquer falha (1 repetição só para diagnóstico, ver política de instáveis) | ≤ 4 min |
| 7 | `seguranca` | gitleaks no diff; Semgrep; auditoria de dependências (npm audit ou OSV-Scanner); lista proibida de SDKs (CT-621); segredos no build | Segredo achado; achado Semgrep de severidade `ERROR`; vulnerabilidade `high`/`critical` em dependência de produção sem exceção registrada | ≤ 3 min |
| 8 | `pr-ok` | Job agregador que depende de todos acima | Qualquer job anterior falhou ou foi cancelado | segundos |

**Tempo total-alvo do PR: ≤ 10 min** (jobs 2, 3 e 7 em paralelo).

### Como o merge é bloqueado

1. **Regra de proteção da `main`** (ruleset ou branch protection): exigir o status `pr-ok` verde,
   branch atualizada e proibir push direto e force-push. Um só status obrigatório (`pr-ok`)
   evita ter de mudar a regra quando um job novo entra.
2. **Merge automático do dono (CLAUDE.md, 11/11/2026):** a sessão do PO só faz o merge depois de
   `gh pr checks` mostrar tudo verde; se algo falhar, não faz o merge e avisa.
3. **Ressalva:** regra de proteção é aplicada pelo GitHub em repositório **público** (ou plano pago).
   Se o repositório for privado no plano gratuito, o bloqueio fica só no passo 2 (procedimento).
   Precisa do PO confirmar a visibilidade do repositório e quem configura a regra (exige admin).

## 3. Main (`push` na `main`)

| Job | O que faz | Falha → | Tempo-alvo |
|---|---|---|---|
| Tudo do PR | Mesmo conjunto (garante que o merge não quebrou nada) | Main vermelha | ≤ 10 min |
| `e2e-completo` | Toda a suíte E2E de regressão, todos os perfis | Main vermelha | ≤ 12 min |
| `visual` | Screenshots das telas do CT-706 contra a base aprovada | Main vermelha; diferenças anexadas | ≤ 5 min |
| `economia` | Roda `sim:economia` (NX-007) e compara com a tabela de tempos das RN | Diferença > 20% em algum marco → main vermelha | ≤ 5 min |
| `build-release` [stack] | Gera o pacote (APK/PWA), SHA-256 e publica como artefato ou deploy | Erro de build/assinatura | ≤ 5 min |

**Main vermelha congela novos merges** até a correção (regra de processo: o PO não faz merge de
outro PR enquanto a `main` estiver vermelha). A falha abre issue automática com o link do run.

## 4. Noturna (`schedule`, 06:00 UTC = 03:00 em Brasília, e `workflow_dispatch`)

| Job | O que faz | Tempo-alvo |
|---|---|---|
| `propriedades-longas` | fast-check com 100.000 execuções por propriedade (CT-004, CT-005, CT-313, CT-606…) | ≤ 20 min |
| `sorteio-em-escala` | 100.000 partidas por P de referência (CT-208); no Alfa, 100 mil sorteios do gacha com pity (NX-020) | ≤ 5 min |
| `save-estresse` | Encerramento aleatório 100× (CT-505), prestígio atômico 50× (CT-413) | ≤ 15 min |
| `quarentena` | Roda os testes `@quarentena` e informa quantos voltaram a passar | ≤ 10 min |
| `mutacao` | Teste de mutação na lógica do jogo (Stryker ou similar) **[stack]**, informativo | ≤ 30 min |
| `dependencias` | Auditoria completa, OSV-Scanner, gitleaks no histórico inteiro, MobSF no APK **[stack]** | ≤ 10 min |

A noturna não bloqueia merge; falha abre issue e entra no relatório do QA. **Teto: 60 min.**

## 5. Artefatos publicados

| Artefato | Pipelines | Retenção |
|---|---|---|
| Relatório HTML do E2E (Playwright ou equivalente) | PR, main | 14 dias (PR), 30 dias (main) |
| Traces, vídeo e screenshot só das falhas | PR, main | 14 / 30 dias |
| Relatório de cobertura (HTML + resumo no PR) | PR, main | 14 / 30 dias |
| Relatório de segurança (gitleaks, Semgrep SARIF, auditoria) | PR, main, noturna | 30 dias; SARIF também na aba Security se o repo permitir |
| Diferenças visuais | main | 30 dias |
| Saída do `sim:economia` (CSV/markdown) | main, noturna | 90 dias |
| Pacote de instalação + SHA-256 | main | Até o próximo release |

## 6. O que depende da stack (ADR-002)

| Item | Web/PWA ou híbrida (Capacitor) | Nativa (Kotlin) | Flutter |
|---|---|---|---|
| Instalar/lint/tipos | npm/pnpm, ESLint, `tsc` | Gradle, ktlint/detekt | `flutter pub get`, `flutter analyze` |
| Unitário/propriedade | Vitest + fast-check | JUnit + Kotest | `flutter test` + glados |
| E2E | Playwright headless com perfis de celular | Maestro ou Espresso em emulador (mais lento, ~10–15 min) | `integration_test` em emulador ou web |
| Auditoria de dependências | npm audit / OSV-Scanner | OSV-Scanner | OSV-Scanner |
| Visual | `toHaveScreenshot` | Paparazzi | golden tests |

Com emulador Android na CI, o PR passa de 10 min com facilidade; nesse caso o E2E do PR roda só o
smoke mínimo e o resto vai para a `main`.

## 7. Fase atual (antes do ADR-002)

Enquanto não há código, nenhum workflow é criado. Primeira versão real (NX-006, fase 2), assim que
o PO aprovar a stack: jobs 1 a 5 e 8 do PR (critério do backlog: lint, tipos, unitários, build),
mais gitleaks. E2E smoke e o restante entram com a primeira tela (NX-010).
