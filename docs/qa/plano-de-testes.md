# Plano de testes — Nexus Idle (MVP, épico E1)

> Dono: `nexus-qa`. **Versão 0.2** — 20/11/2026 (NX-009). v0.1 era da NX-006.
> Base: `regras-de-negocio.md` **v0.2** (RN-001 a RN-020), ADR-001, **ADR-002 aprovado** (stack e
> condições C1–C10), backlog (NX-010 a NX-018).
> O que mudou da v0.1: stack definida (as ferramentas deixam de ser candidatas), escopo com RN-018 a
> RN-020 e NX-018, meta de cobertura aprovada (QA-18), relógio mitigado pela RN-012 v0.2 (QA-11) e
> pedidos QA-1 a QA-19 decididos.

## 1. Objetivo e escopo

Garantir, com evidência, que o loop do MVP funciona no celular do dono sem bloqueio e sem perda de
save (critério do marco MVP na `visao.md`).

**Dentro do escopo:** RN-001 a RN-020, histórias NX-010 a NX-018, condições C1–C10 do ADR-002 (critério
da NX-015), save, migração e exportar/importar, ganho offline e relógio, formatação de números,
capítulos, nome do clube e limites de texto, acessibilidade básica (AA, alvo de toque de 44 px),
segurança do PWA e do repositório público, pipeline de CI.

**Fora do escopo do MVP:** gacha/pity (NX-020, avaliado no Alfa; o teste de 100 mil sorteios entra
quando a história existir), multijogador, servidor, contas, compras (não existem, RN-016), APK com
Capacitor (fase 2 do ADR-002, só com gatilho).

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
visual. **Cada número de uma RN é provado no nível mais baixo possível** (função pura); o E2E só prova
que o número chega à tela e que o fluxo não quebra.

| Nível | O que cobre | Ferramenta (ADR-002) | Onde |
|---|---|---|---|
| Unitário | Fórmulas das RN, formatação (RN-017), migração de save | Vitest | `src/engine/*.test.ts`, `src/save/*.test.ts` (tech) e `tests/` (QA) |
| Propriedades | Nada negativo, custo crescente, sem recurso infinito, offline limitado, `maior` nunca desce | fast-check com Vitest | `tests/propriedades/` |
| Integração | Motor + estado + save + conteúdo do lore, com relógios e sorteio falsos | Vitest + Testing Library | `tests/integracao/` |
| E2E | Fluxos críticos em 360×640, 360×700, Pixel e iPhone, com `isMobile` e `hasTouch` (C5) | Playwright (Chromium; WebKit na main) | `tests/e2e/` |
| Visual | Telas principais e estados (primeira vez, offline, fim de split, refundação, capítulo) | `toHaveScreenshot` do Playwright, animações desligadas | `tests/e2e/visual/` |
| Usabilidade | Roteiro moderado, axe-core, contraste, alvo de toque | `@axe-core/playwright` + roteiro em `docs/qa/usabilidade/` | |
| Segurança | Dependências, código, segredos, bundle | npm audit, OSV-Scanner, Semgrep, gitleaks | pipeline |
| Economia | Comparação com o simulador oficial (NX-007/NX-008) | `npm run sim:economia` | pipeline main e noturna |

Detalhes de segurança em `seguranca.md`; da pipeline em `pipeline.md`; da testabilidade da stack em
`avaliacao-adr-002.md`.

### Shift-left

Para cada história `NX-###`, os casos de `docs/qa/casos/` viram testes **antes** de a implementação
terminar (backlog, Sprint 1). O `nexus-tech` recebe os casos junto com a história; os unitários das
fórmulas podem ser escritos antes do código, com as tabelas de entrada → saída já calculadas aqui.
Ordem do Sprint 1: NX-015 (+ workflow) → NX-010 → NX-011 → NX-012 → NX-013 → NX-014 → NX-016 →
NX-017 → NX-018.

## 3. Ambientes

| Ambiente | Uso | Observações |
|---|---|---|
| Local / sessão na nuvem | Unitário, integração, E2E pontual | Mesmos comandos do `CLAUDE.md` (`npm ci`, `npm test`, `npm run test:e2e`, `npm run build`) |
| CI — GitHub Actions `ubuntu-latest` | Tudo automatizado | Executor padrão, gratuito no repositório público. Node fixado na mesma versão de `engines` (≥ 22.18, C10) |
| Perfis de celular na CI | E2E e visual | 360×640 e 360×700 (uso real do dono), Pixel 7 (Chromium) e iPhone 13 (perfil no Chromium no PR; WebKit na main) |
| PWA publicado (GitHub Pages) | Smoke de cada deploy | Endereço público; instalado no Android pelo Chrome ("Instalar app") |
| Aparelho real do dono (Android) | Aceite do marco MVP, smoke manual de cada release | Checklist curto em cada entrega (`seguranca.md` §5) |
| iOS real | Desejável | Não bloqueia o MVP; o WebKit do Playwright não substitui o Safari real (atenção à limpeza de dados após 7 dias sem uso, ADR-002) |

**Dados de teste:** saves de exemplo versionados em `tests/fixtures/saves/` (um por versão de save e um
por estado-chave: clube novo, Ascensão, pré-refundação, título mundial, números > 1e15, clube
renomeado com caracteres especiais, corrompido, checksum refeito com valor impossível).

**Relógio e sorteio:** todos os testes automatizados rodam com relógio de parede, relógio monotônico e
semente injetados (C2). Nenhum teste depende do horário real da máquina. O tempo acelerado existe só
no build de teste (C3).

## 4. Critérios de entrada e saída

### Entrada (QA começa a testar uma história)
1. História com critérios Gherkin e RN referenciadas sem pedido aberto **bloqueante** em `pedidos.md`
   (ou o PO decidiu aceitar o risco). Os pedidos abertos QA-20 a QA-27 bloqueiam só os casos listados
   na matriz de `casos/README.md`, não histórias inteiras.
2. Casos de teste da história escritos em `docs/qa/casos/` e revisados pelo `nexus-tech`.
3. Build da branch passando na pipeline de PR (lint, tipos, unitários).
4. Textos com nomes finais do lore, ou placeholders `[LORE: …]` marcados (não bloqueia teste de
   regra, bloqueia aceite).

### Saída (QA emite veredito em `docs/qa/relatorios/NX-###.md`)
| Veredito | Condição |
|---|---|
| **Aprovado** | Todos os casos da história executados; 0 bug S1/S2 aberto; cobertura no gate; pipeline verde; nenhum teste da história em quarentena |
| **Aprovado com ressalvas** | 0 S1; S2 só com aceite explícito do PO e data de correção; S3/S4 registrados; ou casos manuais/pendentes de decisão justificados |
| **Reprovado** | Qualquer S1 aberto; S2 sem aceite do PO; pipeline vermelha; caso de RN sem execução; na NX-015, qualquer condição C1–C10 não cumprida |

O aceite final é sempre do PO.

## 5. Bugs e severidade

Registro em `docs/qa/bugs.md` com: ID (`BUG-###`), severidade, passos, esperado × obtido, evidência
(trace, screenshot, save exportado), história e RN.

| Sev. | Nome | Definição (exemplos do jogo) | Efeito no merge |
|---|---|---|---|
| **S1** | Bloqueador | Perda ou corrupção de save; app não abre; ouro/Legado negativo, `NaN` ou infinito; ganho offline acima de 8 h, inclusive por ciclo de relógio (RN-012); qualquer coisa paga (RN-016); segredo vazado; nome do clube interpretado como HTML (RN-019) | Bloqueia merge e release |
| **S2** | Crítico | Fórmula de RN com resultado errado; subir/cair de divisão errado; refundação dá Legado errado ou zera o que não devia; capítulo que reaparece sozinho ou bloqueia o jogo; tempo acelerado no build do jogador (C3) | Bloqueia release; merge só com aceite do PO |
| **S3** | Maior | Regra secundária errada (ex.: "faltam X para o marco"); arredondamento na direção errada; layout quebrado em 360×640; falha AA; alvo < 44 px em ação principal; texto acima do limite da RN-020 | Não bloqueia; entra na próxima sprint |
| **S4** | Menor | Texto, cosmético, número igual mas com espaçamento diferente | Backlog |

A severidade é do QA; a prioridade é do PO.

## 6. Política de testes instáveis (flaky)

1. Na CI, um teste E2E que falha é repetido **uma vez**. Se passar na repetição, o job passa, mas o
   teste sai marcado como **instável** no relatório e no resumo do PR. Unitários e integração não têm
   repetição: falhou, está vermelho.
2. Teste instável vai para **quarentena** (tag `@quarentena`) no mesmo dia, com issue aberta
   (título `[flaky] nome do teste`, trace e link do run). Nunca é apagado nem comentado em silêncio.
3. Quarentena **não** bloqueia o PR, mas roda na noturna e aparece no relatório.
4. Prazo: 14 dias para corrigir ou substituir. Passou disso, o PO decide.
5. Limite: no máximo **5%** dos testes em quarentena. Acima disso, nova funcionalidade espera.
6. Testes que cobrem risco S1 (save, offline e relógio, Legado, RN-016, injeção no nome) **não entram
   em quarentena sem aceite do PO**: são consertados na hora.
7. Causas proibidas por regra: `sleep`/espera fixa, depender do relógio real, depender de rede
   externa, depender da ordem dos testes.

## 7. Métricas

| Métrica | Meta | Onde é medida |
|---|---|---|
| Cobertura de linhas em `src/engine/` e `src/save/` | **≥ 90%** (gate de PR; piso 80%). **Aprovada** pelo PO (QA-18, C7) | `npm run test:coverage` no PR |
| Cobertura de ramos nas mesmas pastas | **≥ 85%** (gate de PR). Aprovada (QA-18, C7) | Idem |
| Cobertura da UI | Sem gate; coberta por E2E e visual | — |
| RN com pelo menos 1 caso automatizado passando | **100%** (20/20) | Matriz em `casos/README.md` |
| Critérios Gherkin de NX-010 a NX-015 e NX-018 automatizados | **100%** | Idem |
| Escore de mutação da lógica do jogo (StrykerJS) | ≥ 70%, informativo no início | Noturna |
| Taxa de testes instáveis | < 2% dos runs | Relatório da noturna |
| Tempo da pipeline de PR | ≤ 10 min | Actions |
| Pacote inicial (gzip) | < 2 MB (gate; alvo interno 300 kB, ADR-002) | Job `build` |
| Bugs escapados (achados pelo dono no celular) | 0 S1 no marco MVP | `bugs.md` |
| Diferença `sim:economia` × tabela das RN | ≤ 20% (critério NX-007; confirmação da NX-008) | Main e noturna |

## 8. Testes exploratórios (charters iniciais)

Sessões de 30 a 45 min, notas em `docs/qa/exploratorio/AAAA-MM-DD-tema.md` (missão, área, achados,
bugs, perguntas).

| Charter | Missão |
|---|---|
| EX-01 Relógio | Adiantar, atrasar, trocar fuso e alternar modo avião com o app aberto e fechado, inclusive ciclos repetidos e refundação no meio, para achar ganho acima de 8 h ou perda (RN-012 v0.2) |
| EX-02 Toque nervoso | Tocar rápido com vários dedos, segurar o botão, tocar durante a transição de tela, para achar ganho além de 5 por janela de 1 s ou compra dupla |
| EX-03 Fim de split | Abrir e fechar o app exatamente na 14ª partida, minimizar no resumo, ausências de 30 a 90 s, para achar split travado, duplo ou capítulo perdido |
| EX-04 Refundação | Confirmar, voltar, girar a tela, matar o app no meio, para achar refundação dupla ou parcial |
| EX-05 Números grandes | Save com renda > 1 bi/s e > 1e15, percorrer todas as telas, para achar texto cortado ou arredondamento na direção errada |
| EX-06 Primeiro contato | Jogar 5 min como jogador novo sem ler nada, para achar ponto de dúvida |
| EX-07 Nome do clube | Renomear com acentos, emoji, HTML, textos longos e colar texto de fora, e depois percorrer capítulos e falas com `{clube}` |
| EX-08 Dados do navegador | Limpar dados do site, modo anônimo, armazenamento quase cheio, duas abas, exportar/importar entre aparelhos, para achar perda de save |

## 9. Riscos de teste

| Risco | Efeito | Mitigação |
|---|---|---|
| Ponto flutuante nas comparações e na tela | Compra recusada/aceita na fronteira; número exibido na direção errada | Tolerância de 10⁻⁹ decidida (QA-4); casos de fronteira CT-006, CT-061, CT-615; pedido QA-22 para a tela |
| Relógio do aparelho (PWA sem relógio monotônico entre sessões) | Ganho indevido | **Mitigado, não aceito** (QA-11): RN-012 v0.2 guarda o `maior` horário visto; CT-323, CT-339. Resíduo: quem edita o save e refaz o checksum burla isso (aceito, `seguranca.md` A2) |
| Navegador apagar os dados (limpeza, iOS após 7 dias sem uso) | Perda de save | Exportar/importar, `storage.persist()` e aviso (CT-520 a CT-524, CT-540); EX-08 |
| Regras ainda ambíguas (8 pedidos QA-20 a QA-27) | Caso sem resultado único | Casos marcados **bloqueado por pedido QA-N**; nenhum é a única cobertura de uma RN |
| Teste de usabilidade com "jogador novo" | O dono já conhece o jogo | QA-16 decidido: 1 ou 2 convidados do dono; senão avaliação heurística + o dono |
| Simulador ainda na v0.1 das RN | Tabela de tempos sem confirmação | NX-008 (tech) atualiza; o job `economia` só vira gate depois dela |
| `tokens.md` §9 ainda descreve a RN-017 v0.1 | Tech implementar o formato antigo | Os casos CT-600 a CT-616 seguem a RN v0.2; o UX atualiza o §9 na parte dele da NX-009 |

## 10. Rastreabilidade

Matrizes RN × caso e história × caso em `docs/qa/casos/README.md`.
