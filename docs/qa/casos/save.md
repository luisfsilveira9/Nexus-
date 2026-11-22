# Casos — Save, corrupção, migração, exportar/importar e condições técnicas

> RN-015 · História NX-015 · Faixa CT-500 a CT-599. **v0.2** (NX-009).
> RN-015 v0.2 + ADR-002: 2 cópias que se alternam (slots A/B no `localStorage`), cada uma com checksum
> (FNV-1a); save editado à mão que não confere = corrompido; vale a cópia válida mais nova; sem
> espaço mantém o último válido e avisa; exportar/importar como texto.
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
| CT-509 | Valores impossíveis | Saves com ouro −1, `NaN`, `"1e999"`, nível 0, divisão 9, n = 2,5, Legado −5, campo faltando, campo extra, nome com 500 caracteres — com checksum **errado** e com checksum **refeito** | Carregar cada um | Checksum errado: corrompido (CT-506). Checksum certo: **nunca** trava o app nem propaga `NaN`; se a cópia é recusada ou saneada: **pedido QA-27a** | U | Sim (PR) — parte do checksum errado; resto após decisão |
| CT-510 | Migração de versão antiga | Fixture de cada versão anterior | Carregar | Migra para a versão atual sem perder campo; migrar duas vezes dá o mesmo resultado | U | Sim (PR) — cada mudança de formato cria uma fixture |
| CT-511 | Versão do futuro | Save com `saveVersion` 99 | Carregar | Não carrega, não apaga, avisa | U | Sim (PR) |
| CT-512 | Armazenamento cheio | Escrita falha com `QuotaExceededError` | Tentar salvar | Último save válido intacto; aviso ao jogador; o jogo continua; nova tentativa no próximo gatilho | I | Sim (PR) |
| CT-540 | Armazenamento persistente | Navegador que nega `navigator.storage.persist()` | Abrir o jogo | O jogo pede armazenamento persistente e, se negado, avisa e sugere exportar (mitigação do ADR-002) | I + E | Sim (main) |

## RN-015 — Exportar e importar

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-520 | Ida e volta por texto | Save no meio da run, Legado 25, 2 capítulos vistos | Exportar; limpar os dados do site; importar o texto | Estado idêntico ao exportado (inclusive `maior`, semente e relógio de partida) | I + E | Sim (PR) |
| CT-521 | Importar texto ruim | Save atual válido | Importar: texto vazio; texto truncado; checksum errado; `saveVersion` 99; JSON de outro app | Recusado com aviso; o save atual **intacto** | I | Sim (PR) |
| CT-522 | Importar sobre um save válido | Save atual válido | Importar um texto válido; cancelar a confirmação; repetir e confirmar | Sem confirmação nada muda ("nunca apaga um save válido sem confirmação"); com confirmação carrega o importado. Confirmação exigida: **pedido QA-27b** | I + E | Sim (PR) após confirmação do PO |
| CT-523 | Importar save antigo | Texto exportado de uma versão anterior | Importar | Migra como no CT-510 | I | Sim (PR) |
| CT-524 | Exportar o save ilegível | Cenário do CT-507 | Exportar | O texto cru das duas cópias fica disponível para copiar | I + E | Sim (PR) |

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
