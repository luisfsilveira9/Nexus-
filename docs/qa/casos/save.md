# Casos — Save, corrupção, migração, exportar/importar e condições técnicas

> RN-015 · História NX-015 · Faixa CT-500 a CT-599. **v0.3** (NX-024), RN v0.3.1.
> RN-015 v0.3 + ADR-002: 2 cópias que se alternam (slots A/B no `localStorage`), cada uma com checksum
> (FNV-1a); save editado à mão que não confere = corrompido; **checksum certo com valor impossível
> também = corrompido** (QA-27a); vale a cópia válida mais nova; sem espaço mantém o último válido e
> avisa; exportar/importar como texto; **importar sobre um save válido exige confirmação** com o
> clube que sai e o que entra e o atalho "Exportar o atual primeiro" (QA-27b, P-UX-11); save de versão
> mais nova é recusado; depois de importar, o jogo reabre pela sequência normal com `t_off` contado
> do `maior` do save importado. `maior` é gravado em todo save (RN-012 v0.3, CT-338).
> Fixtures em `tests/fixtures/saves/` (uma por versão de save e por estado-chave). O armazenamento é
> testado pela interface `ArmazenamentoSave` com versão em memória e falhas simuladas (C8).

## RN-015 — Quando e como salva

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-500 | Save a cada 10 s | App aberto, sem ações, relógio injetado | Avançar 9,9 s; 10 s | Nenhum save novo em 9,9 s; **1** save em 10 s | I | Sim (PR) |
| CT-501 | Save a cada compra | — | Comprar 1 negócio | Save gravado antes de a tela confirmar a compra | I | Sim (PR) |
| CT-502 | Save no fim de cada partida | — | Terminar 1 partida | Save com o novo placar e o relógio de partida reiniciado | I | Sim (PR) |
| CT-503 | Save ao minimizar e sair | — | Disparar `visibilitychange`→`hidden` e `pagehide` | Save gravado nos dois eventos | I + E | Sim (PR) |
| CT-504 | Gherkin "fechar o app no meio" | Comprei 1 negócio há 3 s | Encerrar à força e reabrir | O negócio continua comprado | E | Sim (PR smoke) |
| CT-505 | Perda máxima de 10 s | App aberto com renda | Encerrar à força num instante aleatório; reabrir (100×) | O estado carregado é de no máximo **10 s** antes do encerramento | E | Sim (noturna) |
| CT-515 | Conteúdo mínimo do save | Qualquer save | Ler | `saveVersion`, `salvoEm` e `maior` (epoch UTC), segundos para a próxima partida, semente/estado do sorteio, placar do split, divisão atual e melhor da run, acumulado da run, capítulos vistos, histórico (títulos, estatísticas), nome e sigla, configurações, checksum | U | Sim (PR) |
| CT-518 | Cópias alternadas | Clube novo | Disparar 3 saves seguidos | Gravam A, B, A (ou B, A, B); sempre uma cópia anterior válida intacta | I | Sim (PR) |
| CT-513 | Escrita atômica | Falha simulada no meio da escrita | Reabrir | Carrega a outra cópia, válida | I | Sim (PR) |
| CT-514 | Ida e volta | Estado aleatório (semente, números > 1e15 e < 1e−6, nome com acentos e `<>&"'`) | Serializar e desserializar | Estado idêntico | P | Sim (PR) |
| CT-516 | Duas abas abertas | Duas abas do mesmo PWA | Jogar nas duas | Uma não corrompe a outra; a regra (última vence ou bloqueio) é do tech e fica documentada | E | Sim (main) |
| CT-517 | Sem perda numa atualização | Save da versão N publicada no Pages | Publicar N+1 e abrir no celular | Progresso mantido (smoke manual a cada release) | E | Não (manual) |

## RN-015 — Save corrompido, sem espaço e versões

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-506 | Gherkin "save corrompido" | Cópia atual ilegível (JSON truncado; bytes aleatórios; vazia) e a outra válida | Abrir o jogo | Carrega a cópia válida e **avisa antes de qualquer outra tela** (antes da tela offline, CT-311); a cópia ruim não é apagada sem confirmação | I + E | Sim (PR smoke) |
| CT-507 | Gherkin "nenhum save válido" | As duas cópias ilegíveis | Abrir | Mostra "**Tentar de novo**" e "**Começar clube novo**"; não começa do zero em silêncio. "Começar clube novo" pede confirmação; o save ilegível fica guardado e **exportável** | I + E | Sim (PR smoke) |
| CT-519 | "Tentar de novo" e cancelar | Cenário do CT-507 | (a) Consertar o armazenamento simulado e tocar "Tentar de novo"; (b) tocar "Começar clube novo" e cancelar a confirmação | (a) Carrega o save. (b) Nada muda; as cópias continuam lá | I | Sim (PR) |
| CT-508 | Save editado à mão | Save válido | Alterar 1 byte do campo de ouro sem refazer o checksum | Tratado como **corrompido** (QA-14 decidido); segue o CT-506 | U | Sim (PR) |
| CT-509 | Valores impossíveis (QA-27a decidido) | Uma cópia com cada valor, com checksum **errado** e com checksum **refeito**; a outra cópia válida (e, noutra rodada, também ruim): ouro −1, `NaN`, `"1e999"` (Infinity); nível 0; divisão 9 ou −1; n = 2,5; Legado −5; `r` = 0, −1 ou 90,5; `maior` menor que `salvoEm`; placar com mais de 14 partidas; melhor divisão da run abaixo da atual; campo obrigatório faltando; nome fora da RN-019 (vazio, 21 caracteres, 500 caracteres, com emoji "Faísca 🔥", com `<script>`, com quebra de linha); sigla "AB1", "abc" ou de rival ("VTX") | Carregar cada um | Nos dois checksums: a cópia é **corrompida** (não é corrigida em silêncio). Com a outra válida: carrega a outra e avisa (CT-506). Sem cópia válida: "Tentar de novo"/"Começar clube novo" (CT-507). Nunca trava, nunca propaga `NaN`. Campo **extra** desconhecido não é valor impossível: não trava e não volta no próximo save (o tech documenta) | U | Sim (PR) |
| CT-510 | Migração de versão antiga | Fixture de cada versão anterior | Carregar | Migra para a versão atual sem perder campo; migrar duas vezes dá o mesmo resultado | U | Sim (PR) — cada mudança de formato cria uma fixture |
| CT-511 | Versão do futuro | Save com `saveVersion` 99 | Carregar | Não carrega, não apaga, avisa | U | Sim (PR) |
| CT-512 | Armazenamento cheio | Escrita falha com `QuotaExceededError` | Tentar salvar | Último save válido intacto; aviso ao jogador; o jogo continua; nova tentativa no próximo gatilho | I | Sim (PR) |
| CT-540 | Armazenamento persistente | Navegador que nega `navigator.storage.persist()` | Abrir o jogo | O jogo pede armazenamento persistente e, se negado, avisa e sugere exportar (mitigação do ADR-002) | I + E | Sim (main) |

## RN-015 — Exportar e importar

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-520 | Ida e volta por texto | Save no meio da run, Legado 25, 2 capítulos vistos | Exportar; limpar os dados do site; importar o texto | Estado idêntico ao exportado (inclusive `maior`, semente e relógio de partida) | I + E | Sim (PR) |
| CT-521 | Importar texto ruim | Save atual válido | Importar: texto vazio; texto truncado; checksum errado; `saveVersion` 99; JSON de outro app | Recusado com aviso; o save atual **intacto** | I | Sim (PR) |
| CT-522 | Importar sobre um save válido (QA-27b decidido) | Save atual válido "Faísca eSports"; texto válido de "Los Grandes" | Importar; ler a confirmação; cancelar. Repetir e confirmar | A confirmação mostra o clube que **sai** (Faísca eSports) e o que **entra** (Los Grandes), com o atalho "Exportar o atual primeiro". Cancelar: nada muda (as duas cópias intactas). Confirmar: carrega o importado | I + E | Sim (PR) |
| CT-523 | Importar save antigo | Texto exportado de uma versão anterior | Importar | Migra como no CT-510 | I | Sim (PR) |
| CT-524 | Exportar o save ilegível | Cenário do CT-507 | Exportar | O texto cru das duas cópias fica disponível para copiar | I + E | Sim (PR) |
| CT-525 | Atalho "Exportar o atual primeiro" | Cenário do CT-522, confirmação aberta | Tocar o atalho; copiar; voltar | Abre o exportar (T16) com o texto do save **atual** (igual ao do CT-520); ao voltar, a confirmação continua aberta e nada foi trocado | I + E | Sim (PR) |
| CT-526 | Depois de importar: abertura normal e `t_off` do save importado | Relógio de parede em A; renda 100/s no save importado | Importar e confirmar textos com `maior` = (a) A − 2 h; (b) A + 1 h; (c) A − 3 dias; (d) A − 30 s | O jogo reabre pela fila normal (T00 → avisos → T13 se t_off ≥ 60 s). (a) T13 com 2 h: ouro **360.000** + prêmios. (b) t_off **0**, sem T13, `maior` continua A + 1 h. (c) só 8 h: **1.440.000** + prêmios. (d) **1.500** creditados direto, sem T13. Nada do save anterior se mistura | I + E | Sim (PR) |
| CT-527 | Importar texto com valor impossível | Save atual válido | Importar um texto com checksum refeito e um valor do CT-509 (ex.: ouro −1; nome "Faísca 🔥") | Recusado com aviso **antes** da confirmação; o save atual intacto | I | Sim (PR) |

## NX-015 — Condições técnicas do ADR-002 (C1–C10)

Sem essas condições o QA reprova a NX-015 (critério do backlog).

| ID | Condição | Verificação | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|
| CT-530 | C1 — motor puro | `passo(estado, acao, agora)` com estado congelado (`Object.freeze` profundo) e comparação de JSON | Não muta a entrada; o estado é JSON puro (ida e volta igual) | U | Sim (PR) |
| CT-531 | C2 — dois relógios injetáveis | Teste de integração com relógio falso de parede e monotônico | Renda e partidas seguem o monotônico; offline segue a parede | I | Sim (PR) |
| CT-532 | C3 — tempo acelerado só em teste | Procurar a flag e o console de debug no `dist/`; abrir o build de produção com o parâmetro de aceleração | Nada encontrado no bundle; o build de produção ignora o parâmetro (partida continua em 90 s) | S + E | Sim (PR) |
| CT-533 | C4 — constantes num arquivo só | Teste importa a config e confere as tabelas das RN-003, 007, 008, 011, 013; busca por literais (1,15; 1,22; 90; 28.800) fora da config | Tabelas iguais às RN; nenhum literal duplicado em `src/engine/` | U | Sim (PR) |
| CT-534 | C5 — perfis de celular | Ler o `playwright.config.ts` | Projetos 360×640, 360×700, Pixel e iPhone, todos com `isMobile` e `hasTouch` | I | Sim (PR) |
| CT-535 | C6 — `data-testid` em números | E2E percorre as telas e lista cada número visível | Todo número está dentro de um elemento com `data-testid` estável | E | Sim (main) |
| CT-536 | C7 — cobertura | Script `test:coverage` | Falha abaixo de 90% de linhas ou 85% de ramos em `src/engine/` e `src/save/` | I | Sim (PR) |
| CT-537 | C8 — camada de save | Testes CT-506 a CT-513 rodando na versão em memória | Falhas simuláveis: corrompido, cota cheia, falha no meio da escrita | I | Sim (PR) |
| CT-538 | C9 — sem rede externa | E2E com bloqueio de outras origens e um fluxo com `context.setOffline(true)` | Nenhum pedido fora da própria origem; o jogo abre e funciona offline | E + S | Sim (PR smoke) |
| CT-539 | C10 — versão do Node | Ler `engines.node` e o workflow | `>=22.18` no `package.json` e a mesma versão fixada na CI | S | Sim (PR) |
