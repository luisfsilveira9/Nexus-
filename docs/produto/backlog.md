# Backlog — Nexus Idle

> Mantido pelo `nexus-po`. Status: A fazer · Em andamento · Em revisão · Aceita · Devolvida.
> Prioridade MoSCoW (M = Must, S = Should, C = Could, W = Won't agora). Estimativa relativa em
> pontos (1, 2, 3, 5, 8, 13).

## Sprint 0 — Fundação

| ID | História | Agentes | Prio | Pts | Status |
|---|---|---|---|---|---|
| NX-001 | Visão v1, regras de negócio v0.1, ADR-001 e backlog do MVP | po | M | 3 | **Aceita** (20/11/2026) |
| NX-002 | ADR-002: escolha da stack (3+ opções), estrutura do repositório e comandos padrão | tech, qa, po | M | 5 | A fazer |
| NX-003 | Bíblia da lore v0.1: premissa, tom, clube, 5 jogadores, rivais, nomes de divisões, geradores, botão e prestígio | lore | M | 5 | A fazer |
| NX-004 | Mapa de telas, fluxo do loop principal, estados e tokens base | ux | M | 5 | A fazer |
| NX-005 | Identidade visual e guia visual mobile | arte | M | 5 | A fazer |
| NX-006 | Plano de testes e pipeline mínima (lint, tipos, unitários, build) | qa | M | 3 | A fazer |
| NX-007 | Simulador headless oficial da economia, validando a tabela de tempos das RN | tech, po | M | 5 | A fazer |

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
| NX-013 | Como jogador, quero ver o que ganhei enquanto estive fora, para voltar com vontade | 011, 012 | tech, ux, lore, qa | M | 5 | A fazer |
| NX-014 | Como jogador, quero refundar o clube em troca de Legado, para recomeçar mais forte | 013, 014 | tech, ux, arte, lore, qa | M | 5 | A fazer |
| NX-015 | Como jogador, quero que meu progresso nunca se perca, para jogar sem medo | 015 | tech, qa | M | 5 | A fazer |
| NX-016 | Como jogador novo, quero entender o jogo nos primeiros 5 minutos sem tutorial longo | todas | ux, lore, tech, qa | M | 3 | A fazer |
| NX-017 | Como jogador, quero um capítulo curto de história a cada divisão nova, para sentir a jornada | 010 | lore, ux, tech | S | 3 | A fazer |

### Critérios de aceite (Gherkin)

**NX-010 — Geradores e toque**
```gherkin
Cenário: comprar o primeiro gerador
  Dado um clube novo com 10 de ouro e nenhum gerador
  Quando eu compro 1 "Live do time"
  Então meu ouro é 0
  E minha renda é 0,5/s
  E o próximo custo exibido é 11 (10 × 1,15 = 11,5, arredondado para baixo)

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
  Dado poder do time 72 e rival 60 (Amadora)
  Então a tela mostra P(vitória) de 77%

Cenário: subir de divisão
  Dado 9 vitórias e 4 derrotas na Amadora
  Quando a 14ª partida termina em vitória
  Então o clube sobe para a Desafiante
  E a renda passa a ter multiplicador ×2
  E uma nova temporada começa com 0-0

Cenário: ninguém cai da Amadora
  Dado 0 vitórias em 14 partidas na Amadora
  Então o clube continua na Amadora
```

**NX-013 — Offline**
```gherkin
Cenário: volta depois de 10 horas
  Dado renda de 100/s e 5 partidas restantes na temporada
  Quando eu volto depois de 10 h
  Então recebo 1.440.000 de ouro (100 × 8 h × 0,5)
  E 5 partidas foram jogadas e a temporada terminou
  E vejo a tela "Enquanto você esteve fora" antes de qualquer outra

Cenário: relógio atrasado
  Dado que o horário do aparelho está antes do último save
  Quando eu abro o jogo
  Então o ganho offline é 0 e nada é perdido
```

**NX-014 — Prestígio**
```gherkin
Cenário: prestígio indisponível
  Dado que a melhor divisão da run é a Desafiante
  Então o prestígio aparece travado com "Chegue à Academy"

Cenário: refundar depois da Liga
  Dado melhor divisão da run Liga e Legado 0
  Quando eu confirmo o prestígio nas duas etapas
  Então tenho Legado 25, renda ×2,25 e poder ×1,25 nos próximos cálculos
  E ouro, geradores, níveis e divisão voltam ao início
```

**NX-015 — Save**
```gherkin
Cenário: fechar o app no meio
  Dado que comprei um gerador há 3 s
  Quando o app é encerrado à força e reaberto
  Então o gerador continua comprado

Cenário: save corrompido
  Dado que o save atual está ilegível
  Quando eu abro o jogo
  Então o último save válido é carregado e eu sou avisado
```

**NX-016 — Primeiros 5 minutos:** jogador novo (teste do QA) faz a 1ª compra em menos de 10 s sem
ajuda, entende para que serve o elenco antes da 1ª partida e chega à 2ª temporada em até 5 min de
partida acelerada de teste.

**NX-017 — Capítulos:** cada primeira subida de divisão na run abre um capítulo lido em menos de
1 min, que pode ser pulado e relido depois. Capítulo já visto não reaparece depois do prestígio.

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

**Sprint 0, onda 2:** `nexus-arte` → NX-005, depois de NX-003 e NX-004. PO revisa NX-007 e, se
preciso, publica RN v0.2.

**Sprint 1 (MVP, ordem de implementação):** NX-015 → NX-010 → NX-011 → NX-012 → NX-013 → NX-014 →
NX-016 → NX-017. QA escreve os testes de cada história antes do fim da implementação.
