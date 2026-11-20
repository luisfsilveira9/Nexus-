# Plano de testes — Nexus Idle (MVP, épico E1)

> Dono: `nexus-qa`. História: NX-006 (Sprint 0, onda 1). Versão 0.1 — 20/11/2026.
> Base: `regras-de-negocio.md` v0.1 (RN-001 a RN-017), ADR-001, backlog (NX-010 a NX-017).
> A stack ainda não foi escolhida (ADR-002 em andamento). Tudo que depende dela está marcado com
> **[stack]**. As ferramentas abaixo são **candidatas**; a escolha final sai no ADR-002 com o
> `nexus-tech` e o PO.

## 1. Objetivo e escopo

Garantir, com evidência, que o loop do MVP funciona no celular do dono sem bloqueio e sem perda de
save (critério do marco MVP na `visao.md`).

**Dentro do escopo:** RN-001 a RN-017, histórias NX-010 a NX-017, save e migração, ganho offline e
relógio, formatação de números, acessibilidade básica (AA, alvo de toque de 44 px), segurança do
app e do repositório, pipeline de CI.

**Fora do escopo do MVP:** gacha/pity (NX-020, avaliado no Alfa; o teste de 100 mil sorteios entra
quando a história existir), multijogador, servidor, contas, compras (não existem, RN-016).

## 2. Estratégia (pirâmide)

```
            ▲  Exploratório (charters, tempo fixo)         manual
           ▲▲  Usabilidade (roteiro + axe-core)            manual + auto
          ▲▲▲  Visual (screenshots por tela)               auto (main)
        ▲▲▲▲▲  E2E em perfil de celular                    auto (smoke no PR, completo na main)
     ▲▲▲▲▲▲▲▲  Integração (motor + estado + save + conteúdo) auto (PR)
▲▲▲▲▲▲▲▲▲▲▲▲▲  Unitário e propriedades (fórmulas puras)    auto (PR; longos na noturna)
```

Proporção-alvo em quantidade de testes: ~70% unitário/propriedade, ~20% integração, ~10% E2E e
visual. A regra é: **cada número de uma RN é provado no nível mais baixo possível** (função pura) e
o E2E só prova que o número chega à tela e que o fluxo não quebra.

| Nível | O que cobre | Candidata (web/TS) | Alternativa se a stack for nativa **[stack]** |
|---|---|---|---|
| Unitário | Fórmulas das RN, formatação (RN-017), migração de save | Vitest | JUnit/Kotest (Kotlin), `flutter test` (Dart) |
| Propriedades | Invariantes da economia: nada negativo, custo crescente, sem recurso infinito, offline limitado | fast-check | Kotest property, `glados` (Dart) |
| Integração | Motor + estado + persistência + conteúdo do lore, com relógio e RNG falsos | Vitest + Testing Library | Robolectric, `flutter_test` widget tests |
| E2E | Fluxos críticos no perfil de celular (360×640, 360×700, Pixel, iPhone) | Playwright | Maestro ou Flutter `integration_test` |
| Visual | Telas principais e estados (primeira vez, offline, fim de temporada, prestígio) | `toHaveScreenshot` do Playwright | golden tests (Flutter), Paparazzi (Android) |
| Usabilidade | Roteiro moderado, axe-core, contraste, alvo de toque | `@axe-core/playwright` | Accessibility Scanner (Android) |
| Segurança | Dependências, código, segredos, save, app | npm audit, OSV-Scanner, Semgrep, gitleaks | OSV-Scanner, Semgrep, gitleaks, MobSF |
| Economia | Comparação com o simulador headless da NX-007 | script `sim:economia` | o mesmo, isolado da UI |

Detalhes de segurança em `seguranca.md`; da pipeline em `pipeline.md`; do que a stack precisa
oferecer em `requisitos-testabilidade.md`.

### Shift-left

Para cada história `NX-###`, os casos de `docs/qa/casos/` viram testes **antes** de a
implementação terminar. O `nexus-tech` recebe os casos junto com a história; os testes unitários
das fórmulas podem ser escritos antes do código (tabelas de entrada → saída já calculadas aqui).

## 3. Ambientes

| Ambiente | Uso | Observações |
|---|---|---|
| Local (dev) | Unitário, integração, E2E pontual | Mesmos comandos da CI (`instalar/testar/build` do `CLAUDE.md`, vêm do ADR-002) |
| CI — GitHub Actions `ubuntu-latest` | Tudo automatizado | Só executor padrão, que é gratuito em repositório público (lição do legado). Navegadores headless |
| Perfis de celular na CI | E2E e visual | 360×640 e 360×700 (uso real do dono, legado), Pixel 7 (Chromium) e iPhone 13 (WebKit) se a stack for web **[stack]** |
| Aparelho real do dono (Android) | Aceite do marco MVP, smoke manual de cada release | Instalação sem loja (ADR-001 item 6). Checklist curto em cada entrega |
| iOS real | Desejável | Não bloqueia o MVP; WebKit do Playwright não substitui Safari real |

**Dados de teste:** saves de exemplo versionados em `tests/fixtures/saves/` (um por versão de save
e um por estado-chave: clube novo, Academy, pré-prestígio, números > 1e15, corrompido).

**Relógio e sorteio:** todos os testes automatizados rodam com relógio injetado e semente fixa
(requisitos R-03 e R-04). Nenhum teste depende do horário real da máquina.

## 4. Critérios de entrada e saída

### Entrada (QA começa a testar uma história)
1. História com critérios Gherkin e RN referenciadas sem pedido aberto **bloqueante** em
   `pedidos.md` (ou o PO decidiu aceitar o risco).
2. Casos de teste da história escritos em `docs/qa/casos/` e revisados pelo `nexus-tech`.
3. Build da branch passando na pipeline de PR (lint, tipos, unitários).
4. Textos com nomes finais do lore, ou placeholders `[LORE: …]` marcados (não bloqueia teste de
   regra, bloqueia aceite).

### Saída (QA emite veredito em `docs/qa/relatorios/NX-###.md`)
| Veredito | Condição |
|---|---|
| **Aprovado** | Todos os casos da história executados; 0 bug S1/S2 aberto; cobertura no gate; pipeline verde; nenhum teste da história em quarentena |
| **Aprovado com ressalvas** | 0 S1; S2 só com aceite explícito do PO e data de correção; S3/S4 registrados; ou casos manuais pendentes justificados |
| **Reprovado** | Qualquer S1 aberto; S2 sem aceite do PO; pipeline vermelha; caso de RN sem execução |

O aceite final é sempre do PO.

## 5. Bugs e severidade

Registro em `docs/qa/bugs.md` com: ID (`BUG-###`), severidade, passos, esperado × obtido, evidência
(trace, screenshot, save anexado), história e RN.

| Sev. | Nome | Definição (exemplos do jogo) | Efeito no merge |
|---|---|---|---|
| **S1** | Bloqueador | Perda ou corrupção de save; app não abre; ouro/Legado negativo, `NaN` ou infinito; ganho offline acima de 8 h; qualquer coisa paga (RN-016); segredo vazado | Bloqueia merge e release |
| **S2** | Crítico | Fórmula de RN com resultado errado; subir/cair de divisão errado; prestígio dá Legado errado ou zera o que não devia; relógio dá vantagem | Bloqueia release; merge só com aceite do PO |
| **S3** | Maior | Regra secundária errada (ex.: "faltam X para o marco"); layout quebrado em 360×640; falha AA; alvo < 44 px em ação principal | Não bloqueia; entra na próxima sprint |
| **S4** | Menor | Texto, cosmético, número igual mas com espaçamento diferente | Backlog |

A severidade é do QA; a prioridade é do PO.

## 6. Política de testes instáveis (flaky)

1. Na CI, um teste E2E que falha é repetido **uma vez**. Se passar na repetição, o job passa, mas o
   teste sai marcado como **instável** no relatório e no resumo do PR. Testes unitários e de
   integração não têm repetição: falhou, está vermelho.
2. Teste instável vai para **quarentena** (tag `@quarentena`) no mesmo dia, com issue aberta
   (título `[flaky] nome do teste`, trace e link do run). Nunca é apagado nem comentado em silêncio.
3. Quarentena **não** bloqueia o PR, mas roda na noturna e aparece no relatório.
4. Prazo: 14 dias para corrigir ou substituir. Passou disso, o PO decide.
5. Limite: no máximo **5%** dos testes em quarentena. Acima disso, nova funcionalidade espera.
6. Testes que cobrem risco S1 (save, offline, Legado, RN-016) **não entram em quarentena sem aceite
   do PO**: são consertados na hora.
7. Causas proibidas por regra: `sleep`/espera fixa, depender do relógio real, depender de rede
   externa, depender da ordem dos testes.

## 7. Métricas

| Métrica | Meta proposta | Onde é medida |
|---|---|---|
| Cobertura de linhas da **lógica do jogo** (módulo puro: fórmulas, motor, save, formatação) | **≥ 90%** (gate de PR; piso inegociável 80%) | Relatório de cobertura no PR |
| Cobertura de ramos (branches) da lógica do jogo | **≥ 85%** (gate de PR) | Idem |
| Cobertura da UI | Sem gate; coberta por E2E e visual | — |
| RN de E1 com pelo menos 1 caso automatizado passando | **100%** (17/17) | Matriz em `casos/README.md` |
| Critérios Gherkin de NX-010 a NX-015 automatizados | **100%** | Idem |
| Escore de mutação da lógica do jogo (Stryker ou similar) | ≥ 70%, informativo no início | Noturna |
| Taxa de testes instáveis | < 2% dos runs | Relatório da noturna |
| Tempo da pipeline de PR | ≤ 10 min | Actions |
| Bugs escapados (achados pelo dono no celular) | 0 S1 no marco MVP | `bugs.md` |
| Diferença `sim:economia` × tabela base | ≤ 20% (critério NX-007) | Main e noturna |

A meta final de cobertura é combinada com o PO (pedido em `pedidos.md`, item da NX-006).

## 8. Testes exploratórios (charters iniciais)

Sessões de 30 a 45 min, notas em `docs/qa/exploratorio/AAAA-MM-DD-tema.md` (missão, área, achados,
bugs, perguntas).

| Charter | Missão |
|---|---|
| EX-01 Relógio | Explorar adiantar, atrasar, trocar fuso e alternar modo avião com o app aberto e fechado, para achar vantagem ou perda |
| EX-02 Toque nervoso | Tocar rápido com vários dedos, segurar o botão, tocar durante a transição de tela, para achar ganho além de 5/s ou compra dupla |
| EX-03 Fim de temporada | Abrir e fechar o app exatamente na 14ª partida, minimizar no resumo, para achar temporada travada ou dupla |
| EX-04 Prestígio | Confirmar, voltar, girar a tela, matar o app no meio, para achar prestígio duplo ou parcial |
| EX-05 Números grandes | Carregar save com renda > 1 bi/s e > 1e15, percorrer todas as telas, para achar texto cortado ou notação errada |
| EX-06 Primeiro contato | Jogar 5 min como jogador novo sem ler nada, para achar ponto de dúvida |

## 9. Riscos de teste

| Risco | Efeito | Mitigação |
|---|---|---|
| Stack sem E2E headless em CI | Fluxos só testados à mão | Requisito R-07 no ADR-002 |
| Ponto flutuante nas comparações `ouro ≥ custo` | Compra recusada/aceita na fronteira | Pedido QA-4; testes de fronteira CT-002, CT-051, CT-054 |
| Regras ambíguas (19 pedidos QA-1 a QA-19 abertos) | Caso de teste sem resultado único | Casos marcados **bloqueado por pedido QA-N** até a decisão |
| Teste de usabilidade com "jogador novo" | O dono já conhece o jogo | Pedido QA-16 |
| Economia ainda v0.1 | Números mudam na NX-007 | Casos usam tabelas de entrada/saída geradas das constantes; muda a constante, regenera o esperado |

## 10. Rastreabilidade

Matriz RN × caso e história × caso em `docs/qa/casos/README.md`.
