# Nexus Idle — visão do produto (v1)

> Aprovada pelo PO na NX-001 (20/11/2026). Decisões e motivos em `decisoes/ADR-001-visao-e-loop.md`.
> Briefing original do dono (v0) no histórico do git.

## Em uma frase
Um idle de celular em que você dirige um clube fictício de LoL e o leva da Amadora ao Mundial,
em sessões de poucos minutos, com o time jogando sozinho enquanto você está fora.

## Público
O próprio dono: fã de LoL competitivo, joga no celular (~360 px de largura) em pausas curtas, gosta
de números, progressão e de ver o time crescer.

## Fantasia do jogador
"Eu montei esse clube do nada." Cada sessão termina com algo melhor que antes: mais renda, um
jogador mais forte, uma vitória, uma divisão nova ou um capítulo da história.

## Pilares
1. **Sempre há um próximo passo visível:** a próxima compra, a próxima divisão, o próximo marco.
2. **Respeita o tempo:** 1–3 min por sessão já rendem; voltar depois de horas é recompensador
   (até 8 h).
3. **Duas trilhas que se alimentam:** renda (geradores) e força (elenco). Escolher onde investir
   importa.
4. **O competitivo dá sentido aos números:** divisões, temporadas, rivais e histórias de bastidor.
5. **Honesto:** nada pago, nada de pressão, regras claras na tela.

## O que o jogo NÃO é
- Não é manager com draft, campeões e decisões de partida (era o projeto anterior).
- Não é gacha no MVP.
- Não usa jogadores, times ou imagens reais.
- Não vende nada nem pede para o jogador voltar com notificações que ele não ativou.

## Loop principal
```
toque + geradores → OURO → geradores (renda) ─┐
                         → elenco (poder) ──── partidas automáticas → divisão ↑ → ×renda
                                                          │
                     Academy+ → PRESTÍGIO → LEGADO (+renda, +poder) → nova run, mais rápida
```

## Marcos (roadmap)
| Marco | Conteúdo | Pronto quando |
|---|---|---|
| **MVP jogável** | Épico E1: loop completo (geradores, elenco, partidas, temporada, offline, prestígio, save, onboarding) | O dono joga 1 semana no celular sem bloqueio nem perda de save |
| **Alfa** | Capítulos de história, olheiro/pacotes (avaliar), táticas simples, assistir partida (avaliar) | Retenção pessoal de 2 semanas e economia revisada |
| **Beta** | Polimento visual, sons, conquistas, balanceamento completo até o Mundial | Testes de usabilidade aprovados pelo QA |
| **Temporada 1** | Arco narrativo completo até o primeiro título mundial | Lore e economia fechados |
