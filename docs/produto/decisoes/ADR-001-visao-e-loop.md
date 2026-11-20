# ADR-001 — Visão do produto e loop principal

- **Status:** Aprovada pelo PO em 20/11/2026 (NX-001)
- **Decidido por:** `nexus-po`
- **Consultado:** briefing do dono (`visao.md` v0) e legado (`docs/legado/referencia/modo-cartas.md`,
  `docs/legado/pesquisa-progressao/relatorio.md`, `docs/legado/referencia/motor.md`)

## Contexto
O dono quer um jogo mobile idle ambientado no LoL competitivo, criado do zero, com todas as decisões
tomadas pelo time. Uso pessoal, sem dinheiro real. Ele joga pelo celular.

## Decisões

1. **Fantasia:** o jogador é o diretor de um clube de eSports **fictício** que sobe da Amadora ao
   Mundial. Premissa, tom e nomes ficam com o `nexus-lore` (NX-003).
2. **Universo fictício:** jogadores, times, ligas e casters são inventados. Termos do jogo (rotas,
   Barão, gank) podem aparecer; **nomes e imagens de campeões e de jogadores reais ficam fora do MVP**.
   - *Por quê:* a pesquisa do legado mostrou que a política de fã da Riot permite projeto gratuito,
     mas cartas e notas de pessoas reais aumentam o risco, e o lore ganha liberdade.
3. **Loop principal:** gerar ouro (geradores e toque) → investir em geradores (renda) e no elenco
   (poder) → as partidas automáticas sobem o clube de divisão, que multiplica a renda → prestígio
   troca a run por Legado permanente. Números em `regras-de-negocio.md`.
   - *Por quê:* duas trilhas que se alimentam (renda × poder) dão escolha real. O legado mostrou que
     a força do time decide partidas, e por isso o poder é o freio natural da progressão.
4. **Partida no MVP:** simulada ao fundo por uma fórmula de probabilidade (RN-009), sem draft, sem
   campeões e sem decisões.
   - O motor de eventos do legado **não** é reaproveitado no MVP: mais custo do que valor para um
     idle. Pode voltar no Alfa como "assistir à partida" (NX-022), mediante novo ADR.
5. **Só duas moedas** (Ouro e Legado). Pacotes e cartas de jogadores (gacha) ficam fora do MVP e
   voltam a ser avaliados no Alfa (NX-020).
   - *Por quê:* o legado registrou que moeda extra aumenta a complexidade; o MVP precisa provar o
     loop primeiro.
6. **Plataforma:** celular em retrato. Requisito para a NX-002: rodar no Android do dono sem loja de
   apps (a política de fã da Riot proíbe publicar em loja sem licença); iOS é desejável.
7. **Idioma:** pt-BR.
8. **Sessão-alvo:** 1–3 min com metas sempre visíveis; ganho offline de até 8 h.

## Consequências
- A NX-002 (stack) passa a se chamar **ADR-002** e deve atender o item 6.
- O lore (NX-003) define nomes das divisões, geradores, botão de toque, prestígio e os 5 jogadores.
- A arte (NX-005) não depende de imagens da Riot.
- Os números da v0.1 precisam ser validados pela NX-007 antes do MVP.

## Alternativas descartadas
- **Manager com draft e motor completo:** é o projeto anterior; pesado para sessões curtas.
- **Gacha de jogadores no MVP:** atrasa o MVP e mistura sorte com o teste do loop.
- **Jogadores reais do CBLOL:** risco de imagem e menos liberdade narrativa.
