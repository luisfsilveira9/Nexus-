# Backlog — Nexus Idle

> Mantido pelo `nexus-po`. Status: A fazer · Em andamento · Em revisão · Aceita · Devolvida.
> Prioridade MoSCoW (M = Must, S = Should, C = Could, W = Won't agora). Estimativa relativa em
> pontos (1, 2, 3, 5, 8, 13).

## Sprint 0 — Fundação

| ID | História | Agentes | Prio | Pts | Status |
|---|---|---|---|---|---|
| NX-001 | Visão v1, regras de negócio v0.1, ADR-001 e backlog do MVP | po | M | 3 | **Aceita** (20/11/2026) |
| NX-002 | ADR-002: escolha da stack (3+ opções), estrutura do repositório e comandos padrão | tech, qa, po | M | 5 | **Aceita** (20/11): opção A aprovada com C1–C10 do QA |
| NX-003 | Bíblia da lore v0.1: premissa, tom, clube, 5 jogadores, rivais, nomes de divisões, geradores, botão e prestígio | lore | M | 5 | **Aceita** (20/11) |
| NX-004 | Mapa de telas, fluxo do loop principal, estados e tokens base | ux | M | 5 | **Aceita** (20/11): ajustar rótulos às RN v0.2 na NX-009 |
| NX-005 | Identidade visual e guia visual mobile | arte | M | 5 | **Aceita** (22/11): estilo chibi (ADR-003) |
| NX-006 | Plano de testes e pipeline mínima (lint, tipos, unitários, build) | qa | M | 3 | Em revisão: 4 workflows entregues; o aceite sai com o 1º `pr-ok` verde no GitHub |
| NX-007 | Simulador headless oficial da economia, validando a tabela de tempos das RN | tech, po | M | 5 | **Aceita** (20/11): diferença máxima de 8%; R1, R2 e R3 adotadas nas RN v0.2 |
| NX-008 | Atualizar o simulador e a tabela de tempos para as RN v0.2 (ouro pós-refundação, relógio de partida guardado, RN-012) | tech | M | 2 | **Aceita** (22/11): 29 testes; tabela adotada nas RN v0.3 |
| NX-009 | Atualizar casos de teste e fluxos/wireframes às RN v0.2 e aos nomes finais | qa, ux | M | 2 | **Aceita** (22/11): 255 casos; 11 wireframes com 0 problemas |
| NX-019 | Textos que faltam (prólogo, títulos dos capítulos, dicas, falas de 1 linha, metas, frases do elenco), "para o/para a" das divisões e aparência dos 5 jogadores e da Dona Cel na bíblia | lore | M | 3 | **Aceita** (22/11) |
| NX-024 | Incluir os tokens novos da arte em `docs/ux/tokens.md` e ajustar os casos e os fluxos às RN v0.3 e v0.3.1 (nome sem emoji) | ux, qa | M | 1 | **Aceita** (22/11): 276 casos; wireframes com 0 problemas |
| NX-025 | Ajustes pós-NX-015: o lore revisa `src/content/` (T-02) e o pedido 6; o UX fecha os limites de texto do §10 e as 2 cores sem valor (T-03); o QA fixa o Node da CI pelo `engines` (T-04) | lore, ux, qa | M | 2 | A fazer |

### Critérios de aceite do Sprint 0
- **NX-002:** ADR-002 compara ao menos 3 opções (custo de aprendizado, performance, Android sem loja,
  iOS, testabilidade, manutenção), recomenda uma, e o `CLAUDE.md` passa a listar os comandos
  instalar/rodar/testar/build. O QA assina a parte de testabilidade.
- **NX-003:** todos os nomes marcados como "provisório" nas RN têm nome final, e cada um dos 5
  jogadores tem nome, função, personalidade e jeito de falar. Tudo fictício.
- **NX-004:** cada RN de E1 aparece em pelo menos uma tela; estados (primeira vez, vazio, offline,
  fim de temporada, prestígio) desenhados; a tela principal cabe em 360×640 sem rolagem.
- **NX-005:** paleta com contraste AA conferido, ícones dos 6 geradores e das 5 funções, e um
  inventário de origem de cada asset, sem imagens da Riot.
- **NX-006:** plano cobre todas as RN de E1 com casos de teste; a pipeline roda em PR e bloqueia o
  merge quando falha.
- **NX-007:** `sim:economia` reproduz a tabela de tempos das RN com no máximo 20% de diferença, ou o PO
  aprova números novos; os 3 riscos abertos têm resposta.

## Épico E1 — MVP: loop principal idle

| ID | História | RN | Agentes | Prio | Pts | Status |
|---|---|---|---|---|---|---|
| NX-010 | Como jogador, quero tocar e comprar geradores, para ver minha renda crescer | 001–006, 017 | tech, ux, arte, lore, qa | M | 8 | A fazer |
| NX-011 | Como jogador, quero subir o nível dos 5 jogadores, para deixar o time mais forte | 007, 008 | tech, ux, arte, lore, qa | M | 5 | A fazer |
| NX-012 | Como jogador, quero que o time jogue sozinho e suba de divisão, para multiplicar a renda | 008–010 | tech, ux, lore, qa | M | 8 | A fazer |
| NX-013 | Como jogador, quero ver o que ganhei enquanto estive fora, para voltar com vontade | 009, 011, 012 | tech, ux, lore, qa | M | 5 | A fazer |
| NX-014 | Como jogador, quero refundar o clube em troca de Legado, para recomeçar mais forte | 013, 014 | tech, ux, arte, lore, qa | M | 5 | A fazer |
| NX-015 | Como jogador, quero que meu progresso nunca se perca, para jogar sem medo | 015 | tech, qa | M | 5 | Em revisão: 149 testes, cobertura de 98%, 80 kB; o aceite sai com o `pr-ok` verde |
| NX-016 | Como jogador novo, quero entender o jogo nos primeiros 5 minutos sem tutorial longo | todas | ux, lore, tech, qa | M | 3 | A fazer |
| NX-017 | Como jogador, quero capítulos curtos de história (prólogo, divisões, 1ª refundação, epílogo), para sentir a jornada | 010, 018 | lore, ux, tech | S | 3 | A fazer |
| NX-018 | Como jogador, quero dar nome e sigla ao meu clube, para ele ser meu | 019 | tech, ux, lore, qa | S | 2 | A fazer |

### Critérios de aceite (Gherkin)

**NX-010 — Geradores e toque**
```gherkin
Cenário: comprar o primeiro negócio
  Dado um clube novo com 10 de ouro e nenhum negócio
  Quando eu compro 1 "Aulas na lan"
  Então meu ouro é 0
  E minha renda é 0,5/s
  E o próximo custo exibido é 11,5 (10 × 1,15)

Cenário: toque limitado
  Dado renda de 100/s
  Quando eu toco 8 vezes em 1 segundo
  Então ganho 50 de ouro (5 toques × 10)

Cenário: compra Máx sem ouro suficiente
  Dado ouro menor que o custo da próxima unidade
  Então o botão Máx está desabilitado e mostra quanto falta
```

**NX-011 — Elenco**
```gherkin
Cenário: subir nível
  Dado o Meio no nível 1 e 50 de ouro
  Quando eu subo o Meio de nível
  Então ele vai para o nível 2, com poder 10,5
  E o próximo custo é 61 (50 × 1,22 = 61)
```

**NX-012 — Partidas e temporada**
```gherkin
Cenário: chance mostrada antes da partida
  Dado poder do time 72 e rival 60 (Várzea)
  Então a tela mostra P(vitória) de 77% (0,7685 arredondado ao mais próximo)

Cenário: subir de divisão
  Dado 9 vitórias e 4 derrotas na Várzea e renda de 100/s
  Quando a 14ª partida termina em vitória
  Então recebo o prêmio de 6.000 (renda de antes da subida)
  E o clube sobe para o Acesso
  E a renda passa a ter multiplicador ×2
  E um novo split começa com 0-0

Cenário: ninguém cai da Várzea
  Dado 0 vitórias em 14 partidas na Várzea
  Então o clube continua na Várzea
```

**NX-013 — Offline**
```gherkin
Cenário: volta depois de 10 horas
  Dado renda de 100/s, 5 partidas restantes no split e 90 s para a próxima partida
  Quando eu volto depois de 10 h
  Então recebo 1.440.000 de ouro offline (100 × 8 h × 0,5) mais 6.000 por vitória
  E as partidas seguem split após split enquanto o clube mantiver a divisão
  E param no fim do primeiro split com subida ou queda, ou ao chegar a 320 partidas
  E vejo a tela "Enquanto você esteve fora" antes de qualquer outra

Cenário: ausência curta
  Quando eu volto depois de 40 s
  Então o ganho é creditado sem mostrar a tela "Enquanto você esteve fora"

Cenário: relógio atrasado
  Dado que o horário do aparelho está antes do maior horário já visto
  Quando eu abro o jogo
  Então o ganho offline é 0 e nada é perdido

Cenário: ciclo de adiantar e atrasar
  Dado que adiantei o relógio 8 h, abri o jogo, voltei o relógio e adiantei de novo 8 h
  Quando eu abro o jogo pela segunda vez
  Então o ganho offline conta só o tempo real que passou, não mais 8 h
```

**NX-014 — Prestígio**
```gherkin
Cenário: refundação indisponível
  Dado que a melhor divisão da run é o Acesso
  Então "Refundar o clube" aparece travado com "Chegue à Ascensão"

Cenário: refundar depois da Elite
  Dado melhor divisão da run Elite e Legado 0
  Quando eu confirmo a refundação nas duas etapas
  Então tenho Legado 25, renda ×2,25 e poder ×1,25 nos próximos cálculos
  E o ouro volta a 10, e negócios, níveis e divisão (Várzea) voltam ao início
  E os capítulos já vistos continuam vistos
```

**NX-015 — Save**
```gherkin
Cenário: fechar o app no meio
  Dado que comprei um gerador há 3 s
  Quando o app é encerrado à força e reaberto
  Então o gerador continua comprado

Cenário: save corrompido
  Dado que a cópia atual do save está ilegível e a outra é válida
  Quando eu abro o jogo
  Então a cópia válida é carregada e eu sou avisado antes de qualquer outra tela

Cenário: nenhum save válido
  Dado que as duas cópias estão ilegíveis
  Então vejo "Tentar de novo" e "Começar clube novo"
  E começar de novo pede confirmação e guarda o save ilegível para exportar
```

**NX-016 — Primeiros 5 minutos:** jogador novo (teste do QA) faz a 1ª compra em menos de 10 s sem
ajuda, entende para que serve o elenco antes da 1ª partida e chega ao 2º split em até 5 min de
partida acelerada de teste.

**NX-015 — Condições técnicas:** cumpre as condições C1 a C10 do ADR-002 (o QA reprova sem elas) e
inclui exportar/importar o save como texto (RN-015).

**NX-017 — Capítulos (RN-018):** prólogo, um capítulo por divisão (1ª chegada em qualquer run), 1ª
refundação e epílogo no 1º título mundial. Cada um é lido em menos de 1 min e pode ser pulado (conta
como visto) e relido na jornada. Chegar de novo mostra só uma fala de 1 linha.

**NX-018 — Nome do clube (RN-019 v0.3.1):** padrão Faísca eSports / FSC.
- Nome com até 20 caracteres: letras, números, espaço entre palavras e `- . ' &`. Sem emoji.
- "Los Grandes" é aceito; "Faísca 🔥" é recusado com a mensagem "Use só letras, números e espaços".
- Sigla com 3 letras A–Z, sem repetir rival.
- Um teste com `<script>` no nome mostra o texto literal (os sinais `<` e `>` são recusados).

## Depois do MVP (Alfa — avaliar em ADR antes)

| ID | Ideia | Origem | Prio |
|---|---|---|---|
| NX-020 | Olheiro: pacotes de jogadores com garantia (pity) e fragmentos | legado `pesquisa-progressao` | C |
| NX-021 | Táticas simples por fase do jogo, com efeito no poder | legado `tactics` | C |
| NX-022 | Assistir à partida acelerada com lances narrados | legado `motor` | C |
| NX-023 | Conquistas e estatísticas da carreira | — | C |

## Ordem de delegação

**Sprint 0, onda 1 (em paralelo, sem dependência):**
1. `nexus-lore` → NX-003 (nomes e personagens destravam UX, arte e textos).
2. `nexus-tech` → NX-002 e, em seguida, NX-007 (o simulador pode ser feito antes da stack final,
   como script isolado).
3. `nexus-ux` → NX-004 (usa placeholders `[LORE: …]` até a NX-003).
4. `nexus-qa` → NX-006, rascunhando casos a partir das RN; a pipeline espera a NX-002.

**Sprint 0:** onda 1 concluída em 20/11 (RN v0.2) e onda 2 em 22/11 (RN v0.3, ADR-003). Ficam
NX-019 (lore) e NX-024 (UX e QA), pequenas, que podem correr em paralelo ao começo do Sprint 1:
nenhuma bloqueia a NX-015.

**Sprint 1 (MVP, ordem de implementação):** NX-015 (+ workflow da NX-006) → NX-010 → NX-011 →
NX-012 → NX-013 → NX-014 → NX-016 → NX-017 → NX-018. A NX-016 e a NX-017 dependem dos textos da
NX-019.

**Critérios extras da NX-015 (ADR-002 e ADR-003):**
- C1–C10;
- motor de `tools/sim-economia/` movido para `src/engine/`, sem o bloco "Variantes", com a checagem de tipos no `npm test`;
- fontes empacotadas e peso medido (1ª carga ≤ 150 kB de arte + fontes);
- PNGs do ícone do app;
- `contraste.mjs` e a checagem de peso na pipeline;
- a tabela de tempos das RN v0.3 repetida com o motor de `src/engine/` (dentro de 20%);
- o workflow da NX-006 com o job `pr-ok` (`if: always()` e sem filtro de caminhos).

Depois do 1º PR com o `pr-ok` verde, o dono ativa o ruleset. QA escreve os testes de cada história antes do fim da implementação.
