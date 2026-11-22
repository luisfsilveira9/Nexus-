# Onboarding — os primeiros 5 minutos (NX-016)

> Dono: `nexus-ux`. v0.2 (NX-009): RN v0.2 (ouro inicial 10, "Aulas na lan" visível desde o início,
> prólogo da RN-018, relógio pausado no prólogo). Nomes finais do lore; frases que o lore ainda não
> escreveu estão como `[LORE: sentido]`. Fluxo e estados: `fluxos/NX-016.md`.
> Tempos estimados com um jogador que toca ~3 vezes por segundo e compra sempre o negócio mais barato
> (simulação rápida do UX com as fórmulas das RN v0.2; o simulador oficial é o da NX-007/NX-008).

## Regras do onboarding

1. Um prólogo curto que pode ser pulado; depois, **só dicas ancoradas** (A02), uma por vez.
2. Cada dica some quando o jogador faz a ação. Nenhuma tem botão "Próximo".
3. Nenhuma dica bloqueia o toque em outra parte da tela.
4. Dica de algo que o jogador já fez não aparece.
5. Tudo pode ser revisto em Ajustes → "Rever dicas"; o prólogo, na Jornada.
6. Nada de pressa: nenhuma dica fala em tempo acabando. A única contagem é o relógio real da
   partida (RN-009), que nem começa antes de o jogador fechar o prólogo.
7. O nome do clube não é pedido no começo (padrão Faísca eSports / FSC); dá para trocar na Jornada.

## Passo a passo

| Tempo (estimado) | O que o jogador vê | O que ele faz | O que aprende | Texto (sentido) |
|---|---|---|---|---|
| 0:00 | **T01 Prólogo**, bloco 1 de 4, chip "⏸ Partidas em pausa", Pular e Continuar do mesmo tamanho | Lê (~20 s) ou pula | Quem ele é: a direção da Faísca eSports, na Lan do Farol | `[LORE: prólogo — Dona Cel entrega a chave da sala dos fundos: "Transforma essa turma num time de verdade."]` |
| 0:00 (após Começar/Pular) | **T02**: ouro `10`, renda `+0/s`, "Próxima compra: Aulas na lan · Comprar 10" habilitado. Dica **D1** aponta o card. Relógio da 1ª partida começa: `1:30` | Toca "Comprar" | Comprar faz o ouro render | `[LORE: Compre aulas na lan: elas rendem ouro sozinhas]` |
| ~0:02 | Ouro `0`, renda `+0,5/s`, card "Faltam 11,5". **D2** aponta "Fazer live" | Toca "Fazer live" | Toque = ouro mais rápido | `[LORE: Faça live para ganhar ouro]` |
| 0:03–0:50 | T02 normal: compra mais aulas (11,5 · 13,3 · 15,3…). Split: `Split 1 · 0V 0D · faltam 14`, "Próxima vs Unidos da Ladeira · Chance 27% · Azarão" | Toca e compra | Existe partida e uma chance | — |
| ~0:15 | "Patrocínio local" fica visível (ouro acumulado ≥ 75, RN-003): selo "Novo", aba "Negócios •" e fala do Renatão "Fechei com a padaria! Pão e patrocínio!" | Abre Negócios (opcional) | Há mais negócios e lotes | Fala do lore (`nomes-do-jogo.md` §3) |
| ~0:50 (40 s antes da 1ª partida) | **D3** na meta: "Seu time é azarão. Suba um jogador no Elenco ›" + aba "Elenco •" | Abre o Elenco | Para que serve o elenco | `[LORE: o time joga em 40 s; fortaleça um jogador]` |
| ~0:55 | **T04** com faixa de 1ª vez: poder × rival = chance. Botões "Subir · 50" com prévia "chance 27% → 28%" (se faltar ouro: "Faltam X") | Sobe 1 jogador ou volta | Poder → chance | `[LORE: Poder do time contra o rival decide a chance. Vitórias dão ouro e sobem o clube.]` |
| 1:30 | **1ª partida** (A01, provável derrota). Linha extra: "Vitória dá 60× sua renda/s. 10 vitórias em 14 sobem o clube." | Lê (3 s, ou toca para fixar) | Regra do split | `[LORE]` |
| 3:00 | 2ª partida. Meta passa à lógica normal: "Vença 10 para subir: 0/10 · faltam 12 partidas" | Decide entre negócios e elenco | As duas trilhas | — |
| 3:00–5:00 | Sem novas dicas. A 1ª vitória mostra o prêmio no A01 | Joga | Loop completo | — |

**Fim do onboarding:** depois da 2ª partida ou do 1º nível de jogador, o que vier por último. A
partir daí só existem a meta da T02 e as faixas de 1ª vez das telas ainda não abertas.

**Por que a compra vem antes do toque (mudança da v0.2):** com 10 de ouro e "Aulas na lan" visível,
a 1ª compra é possível no primeiro segundo. Apontar a compra primeiro cumpre "1ª compra em < 10 s"
(UX-30) com folga e ensina a ideia central do idle (renda sozinha) antes do toque.

## O que fica para depois dos 5 minutos (primeira vez de cada coisa)

- 1º fim de split → T06 com 1 frase de regra (~21 min de jogo).
- 1ª subida ao Acesso → T07 "A placa nova", com "Capítulos ficam salvos na Jornada".
- 1º retorno do offline (≥ 60 s) → T13 com a linha "rende metade e segue jogando até subir ou cair;
  conta até 8 h".
- 1ª vez com refundação disponível (Ascensão, ~1,8 h) → aba "Jornada •" e meta única.
- 1ª refundação → T11 + capítulo da refundação. 1º título mundial → epílogo.

## Modo de teste acelerado (para o QA)

O critério "chega ao 2º split em até 5 min de partida acelerada" usa o relógio de partida acelerado
(ex.: 15 s por partida → 14 partidas = 3,5 min), **só no build de teste** (decisão do PO no P-UX-08,
ADR-002 C3). Nunca visível ao jogador. O tempo conta a partir de "Começar"/"Pular" no prólogo.
