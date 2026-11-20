# Onboarding — os primeiros 5 minutos (NX-016)

> Dono: `nexus-ux`. Textos são `[LORE: ...]` até a NX-003; o sentido de cada texto está ao lado.
> Fluxo e estados: `fluxos/NX-016.md`. Tempos estimados com um jogador que toca ~3 vezes por
> segundo e sempre compra o gerador mais barato (simulação rápida da UX com as fórmulas da RN v0.1;
> o simulador oficial é a NX-007). Supõe ouro inicial 0 (pendente: P-UX-03).

## Regras do onboarding

1. Uma tela de boas-vindas, depois **só dicas ancoradas** (A02), uma por vez.
2. Cada dica some quando o jogador faz a ação. Nenhuma tem botão "Próximo".
3. Nenhuma dica bloqueia o toque em outra parte da tela.
4. Dica de algo que o jogador já fez não aparece.
5. Tudo pode ser revisto em Ajustes → "Rever dicas".
6. Nada de pressa: nenhuma dica fala em tempo acabando (a única contagem é o relógio real da
   partida, RN-009).

## Passo a passo

| Tempo (estimado) | O que o jogador vê | O que ele faz | O que aprende | Texto (sentido) |
|---|---|---|---|---|
| 0:00 | **T01 Boas-vindas**: nome do clube `[LORE]`, 2 frases, botão "Começar" na metade de baixo | Toca "Começar" | Quem ele é | `[LORE: você assumiu um clube amador; leve-o ao Mundial]` |
| 0:01 | **T02**, ouro `0`, renda `+0/s`. Dica **D1** apontando o botão de toque. Card "Próxima compra": "Junte ouro tocando no botão abaixo" | Toca | Toque = ouro | `[LORE: toque para fazer live e ganhar ouro]` |
| ~0:02 | Ouro chega a 5: `[LORE: gerador 1]` fica visível (RN-003) no card "Próxima compra", desabilitado "Faltam 5" | Continua tocando | O que vem a seguir | — |
| ~0:03 | Ouro 10: card fica habilitado; D1 dá lugar a **D2** apontando o card | Toca no card | Comprar | `[LORE: compre sua primeira live do time]` |
| ~0:04 | Compra feita: renda `+0,5/s`. **D3** por 6 s | Observa / continua | Gerador rende sozinho | `[LORE: ela rende ouro sozinha; compre mais]` |
| 0:05–0:50 | T02 normal. Card de temporada: `0V 0D · faltam 14` · "Próxima vs `[LORE: rival]` em 1:25 · Chance 27% · Azarão" | Toca e compra | Há partidas e uma chance | — |
| ~0:50 (40 s antes da 1ª partida) | Meta da T02: "Seu time é azarão. Suba um jogador no Elenco." + botão "Ver Elenco"; aba "Elenco •" | Abre o Elenco | Para que serve o elenco | `[LORE: o time joga em 40 s; fortaleça um jogador]` |
| ~0:55 | **T04** com faixa de 1ª vez: "Poder do time × rival = chance de vitória. Vitória dá ouro e sobe de divisão." Botão "Subir · 50" com prévia "27% → 28%" (pode faltar ouro: "Faltam X") | Sobe 1 jogador ou volta | Poder → chance | `[LORE]` |
| 1:30 | **1ª partida** (A01, provável derrota). Linha extra da 1ª vez: "Vitória dá 60× sua renda/s. 10 vitórias em 14 sobem o clube." | Lê (3 s, ou toca para fixar) | Regra da temporada | `[LORE]` |
| ~2:10 | `[LORE: gerador 2]` fica visível; aba "Geradores •" | Abre Geradores (opcional) | Há mais geradores e lotes | — |
| 3:00 | 2ª partida. Meta passa à lógica normal: "Vença 10 para subir: 0/10 · faltam 12" | Decide entre renda e elenco | As duas trilhas | — |
| 3:00–5:00 | Sem novas dicas. 1ª partida de vitória mostra o prêmio no A01 | Joga | Loop completo | — |

**Fim do onboarding:** depois da 2ª partida ou do 1º nível de jogador, o que vier por último. A
partir daí só existem a meta da T02 e as faixas de 1ª vez das telas ainda não abertas (Jornada).

## O que fica para depois dos 5 minutos (primeira vez de cada coisa)

- 1º fim de temporada → T06 com 1 frase de regra (≈ 21 min no tempo real).
- 1ª subida → T07 com "Capítulos ficam salvos na Jornada".
- 1º retorno do offline → T13 com linha "rende metade e conta até 8 h".
- 1ª vez com prestígio disponível → aba "Jornada •" e meta única.

## Modo de teste acelerado (para o QA)

O critério "chega à 2ª temporada em até 5 min de partida acelerada" pede um modo de teste com
relógio da partida mais rápido (ex.: 1 partida a cada 15 s → 14 partidas = 3,5 min). É opção de
build de teste do `nexus-tech`, **nunca** visível ao jogador. Registrado no P-UX-08.
