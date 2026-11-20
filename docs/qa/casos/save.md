# Casos — Save, corrupção e migração

> RN-015 · História NX-015 · Faixa CT-500 a CT-599.
> Fixtures em `tests/fixtures/saves/` (uma por versão de save e por estado-chave).
> Itens sobre checksum, número de cópias e armazenamento cheio dependem do **pedido QA-14**.

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-500 | Save a cada 10 s | App aberto, sem ações, relógio injetado | Avançar 9,9 s; 10 s | Nenhum save novo em 9,9 s; **1** save em 10 s | I | Sim (PR) |
| CT-501 | Save a cada compra | — | Comprar 1 gerador | Save gravado antes de a tela confirmar a compra | I | Sim (PR) |
| CT-502 | Save no fim de cada partida | — | Terminar 1 partida | Save com o novo placar | I | Sim (PR) |
| CT-503 | Save ao minimizar e sair | — | Disparar o evento de 2º plano **[stack]** (`visibilitychange`/`pagehide` na web; `onPause` no Android) | Save gravado | I + E | Sim (PR) |
| CT-504 | Gherkin "fechar o app no meio" | Comprei 1 gerador há 3 s | Encerrar à força e reabrir | O gerador continua comprado | E | Sim (PR smoke) |
| CT-505 | Perda máxima de 10 s | App aberto com renda | Encerrar à força num instante aleatório; reabrir (repetir 100×) | O estado carregado é de no máximo **10 s** antes do encerramento | E | Sim (noturna) |
| CT-506 | Gherkin "save corrompido" | Save atual ilegível (JSON truncado; bytes aleatórios; vazio) e um save anterior válido | Abrir o jogo | Carrega o **último save válido** e avisa o jogador; o arquivo corrompido não é apagado sem confirmação | I + E | Sim (PR smoke) |
| CT-507 | Todos os saves corrompidos | Nenhum save válido | Abrir | Não começa do zero em silêncio: pergunta antes e mantém os arquivos corrompidos | I | Sim (PR) |
| CT-508 | Integridade (checksum) | Save válido | Alterar 1 byte do campo de ouro | Detectado como inválido; segue o CT-506. Se save editado à mão deve ser aceito: **pedido QA-14** | U | Sim (PR) |
| CT-509 | Valores impossíveis | Saves com ouro −1, `NaN`, `"1e999"`, nível 0, divisão 9, n = 2,5, Legado −5, campo faltando, campo extra | Carregar cada um | Rejeitado (ou saneado conforme pedido QA-14); **nunca** trava o app nem propaga `NaN` | U | Sim (PR) |
| CT-510 | Migração de versão antiga | Fixture de cada versão anterior | Carregar | Migra para a versão atual sem perder campo; migrar duas vezes dá o mesmo resultado (idempotente) | U | Sim (PR) — a cada mudança de formato nasce uma fixture |
| CT-511 | Versão do futuro | Save com versão 99 | Carregar | Não carrega, não apaga, avisa | U | Sim (PR) |
| CT-512 | Armazenamento cheio | Escrita falha por cota (`QuotaExceededError` na web; disco cheio no Android) | Tentar salvar | Save anterior intacto; aviso discreto; o jogo continua; nova tentativa no próximo gatilho | I | Sim (PR) |
| CT-513 | Escrita atômica | Falha simulada no meio da escrita | Reabrir | Carrega o último válido | I | Sim (PR) |
| CT-514 | Ida e volta | Estado aleatório (inclui semente do sorteio, números > 1e15 e < 1e−6) | Serializar e desserializar | Estado idêntico | P | Sim (PR) |
| CT-515 | Conteúdo mínimo do save | Qualquer save | Ler | Versão, momento do save em epoch UTC, semente/estado do sorteio, melhor divisão da run, capítulos vistos, verificação de integridade | U | Sim (PR) |
| CT-516 | Duas instâncias abertas | Duas abas ou duas janelas **[stack: web]** | Jogar nas duas | Uma não corrompe a outra; a regra (última vence ou bloqueio) definida pelo tech | E | Sim (main) |
| CT-517 | Sem perda numa atualização | Save da versão N publicada | Instalar a versão N+1 por cima | Progresso mantido (smoke manual no Android a cada release) | E | Não (manual) |
