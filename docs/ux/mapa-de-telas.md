# Mapa de telas — Nexus Idle (MVP, épico E1)

> Dono: `nexus-ux`. História: NX-004. Base: RN v0.1 (RN-001 a RN-017), ADR-001, backlog E1.
> Nomes finais vêm do `nexus-lore` (NX-003). Até lá: nome provisório da RN ou `[LORE: ...]`.
> Formato-alvo: celular em retrato, 360×640 px (CSS), uso com uma mão.

## Princípios aplicados

1. **3 segundos:** a tela principal responde "quanto tenho, quanto ganho, o que compro agora, como
   está a temporada e qual a chance da próxima partida", sem rolar.
2. **Polegar:** tudo que se toca com frequência fica na metade de baixo (y ≥ 320 px). A metade de
   cima é só leitura.
3. **Alvo de toque ≥ 48×48 px** e 8 px de folga entre alvos vizinhos.
4. **Nunca só cor:** vitória/derrota com letra V/D e ícone (✓/✕); estado travado com cadeado e
   texto; chance com rótulo em palavra.
5. **Honesto (RN-016):** nenhuma tela vende, nenhuma tela tem contagem regressiva que não seja o
   relógio real da partida, todo "Cancelar" tem o mesmo tamanho do "Confirmar".
6. **Mesmo número, mesmo formato:** toda quantia passa pelo formatador da RN-017
   (`docs/ux/tokens.md`, seção Números).

## Inventário

Tipos: **Tela** (ocupa tudo, tem navegação própria) · **Aba** (uma das 4 da barra de baixo) ·
**Painel** (bottom sheet sobre a tela atual, fecha com arrastar, toque fora ou botão) ·
**Modal** (bloqueia até uma decisão) · **Aviso** (toast não bloqueante, some sozinho).

| ID | Nome | Tipo | Resolve | RN | Histórias | Wireframe |
|---|---|---|---|---|---|---|
| T00 | Carregando | Tela | Abre o jogo e carrega o save sem o jogador ver tela vazia | 015 | NX-015 | `wireframes/T00-T12-carregar-e-save.html` |
| T01 | Boas-vindas (1ª vez) | Modal | Diz em 2 frases quem você é e o que fazer; 1 botão | 016 | NX-016 | `wireframes/T01-boas-vindas.html` |
| T02 | Clube (principal) | Aba 1 | Ouro, renda/s, toque, próxima compra, divisão, placar, P(vitória), meta | 001, 002, 005, 006, 008, 009, 010, 017 | NX-010, 012, 016 | `wireframes/T02-principal.html` |
| T03 | Geradores | Aba 2 | Comprar geradores em ×1/×10/Máx e ver marcos de 50 | 001, 002, 003, 004, 006, 017 | NX-010 | `wireframes/T03-geradores.html` |
| T04 | Elenco | Aba 3 | Subir nível dos 5 jogadores e ver o efeito na chance | 001, 007, 008, 009, 014 | NX-011 | `wireframes/T04-elenco.html` |
| T05 | Temporada | Painel (do card da T02) | Placar partida a partida, rivais, regra de subir/cair | 008, 009, 010 | NX-012 | `wireframes/T05-temporada-e-fim.html` |
| T06 | Fim de temporada | Painel | Resumo V-D e resultado: subiu / manteve / caiu | 008, 010 | NX-012 | `wireframes/T05-temporada-e-fim.html` |
| T07 | Capítulo de história | Tela | Capítulo curto da divisão nova; pular ou ler | 010 | NX-017 | `wireframes/T07-capitulo.html` |
| T08 | Jornada | Aba 4 | Divisões alcançadas, capítulos para reler, Legado e acesso ao prestígio | 010, 013, 014 | NX-014, 017 | `wireframes/T08-jornada-e-prestigio.html` |
| T09 | Refundar — etapa 1 (resumo) | Tela | Mostra o Legado que ganha, o que zera e o que mantém | 013, 014 | NX-014 | `wireframes/T08-jornada-e-prestigio.html` |
| T10 | Refundar — etapa 2 (confirmação) | Modal | Confirmação final, sem atalho | 013 | NX-014 | `wireframes/T08-jornada-e-prestigio.html` |
| T11 | Clube refundado | Tela | Mostra o novo Legado e os bônus já ativos | 013, 014 | NX-014 | `wireframes/T08-jornada-e-prestigio.html` |
| T12 | Save recuperado / save ilegível | Modal | Avisa que carregou o último save válido; nunca apaga sem confirmar | 015 | NX-015 | `wireframes/T00-T12-carregar-e-save.html` |
| T13 | Enquanto você esteve fora | Tela | Tempo, ouro, partidas V-D e resultado da temporada antes de creditar | 011, 012, 016, 017 | NX-013 | `wireframes/T13-offline.html` |
| T14 | Ajustes | Tela (ícone na T02) | Reduzir animações, vibração, notificações (desligadas), rever dicas, save | 013, 015, 016 | NX-015, 016 | `wireframes/T14-ajustes.html` |
| A01 | Resultado da partida | Aviso | V/D, rival e prêmio, sem parar o jogo | 009 | NX-012 | `wireframes/T02-principal.html` (estado) |
| A02 | Dica de onboarding | Aviso ancorado | Uma dica por vez, apontando um alvo, some ao agir | 016 | NX-016 | `wireframes/T02-principal.html` (estado) |
| A03 | Divisão alcançada de novo | Aviso | Subida para divisão cujo capítulo já foi visto (pós-prestígio) | 010 | NX-017 | — (texto no fluxo NX-017) |

## Como as telas se conectam

```
                 ┌──────────────┐
  abrir app ───► │ T00 Carregando│
                 └──────┬───────┘
          save ilegível?│sim ──► T12 Save recuperado ──┐
                        │não                          │
                        ▼                             ▼
             1ª vez? ── sim ──► T01 Boas-vindas ──► T02 (dicas A02)
                        │não
             t_off ≥ 60 s? ── sim ──► T13 Enquanto você esteve fora
                        │não              │ (se a temporada acabou fora:
                        │                 │  resultado dentro da T13)
                        │                 ▼
                        │      subiu a divisão inédita? ── sim ──► T07 Capítulo
                        ▼                 │não                        │
                 ┌──────────────────────────────────────────────────────┐
                 │ Barra de abas (sempre visível, embaixo)              │
                 │  T02 Clube · T03 Geradores · T04 Elenco · T08 Jornada │
                 └──────────────────────────────────────────────────────┘
   T02 ─ toque no card da temporada ─► T05 Temporada (painel)
   T02 ─ toque em "Próxima compra" ──► compra direto (não navega)
   T02 ─ ícone de engrenagem ────────► T14 Ajustes
   a cada 90 s (qualquer aba) ───────► A01 Resultado da partida
   14ª partida ──────────────────────► T06 Fim de temporada ─ subiu inédita ─► T07
   T08 ─ "Refundar o clube" (disponível) ─► T09 ─► T10 ─► T11 ─► T02 (run nova)
   T08 ─ capítulo da lista ──────────► T07 (modo releitura)
```

**Fila de abertura (ordem fixa, uma tela por vez):** T00 → T12 (se houver) → T13 (se houver) →
T07 (se houver capítulo novo) → aba em que o jogador estava. Nada é creditado antes da T13
(RN-011); a T13 só sai com o crédito feito (botão, voltar do sistema ou toque fora creditam igual).

**Fila durante o jogo:** se dois eventos coincidem, vale: T06 Fim de temporada > T07 Capítulo >
A01 Resultado. Um aviso A01 nunca cobre a barra de abas, o botão de toque, o ouro/renda nem o placar: ele
aparece por 3 s sobre a faixa da meta (y 248–320).

## Barra de abas (navegação global)

- 4 abas, 90 px de largura × 64 px de altura cada, ícone + rótulo em texto (nunca só ícone).
- Marcador de "tem novidade" = ponto + texto curto no rótulo ("Elenco •"), não só cor. Usos:
  Geradores quando um gerador novo fica visível (RN-003); Jornada quando o prestígio fica
  disponível (RN-013) ou há capítulo novo. Some quando o jogador abre a aba.
- Sem marcador em Elenco por "dinheiro sobrando": evita pressão (RN-016).
- A aba ativa tem fundo, texto em negrito e barra de 3 px; não só cor.

## Cobertura das RN do épico E1

Cada RN aparece em pelo menos uma tela. "Onde se vê" diz o elemento exato.

| RN | Assunto | Telas | Onde se vê |
|---|---|---|---|
| RN-001 | Duas moedas, nada negativo, compra só com ouro ≥ custo | T02, T03, T04, T08, T11 | Ouro no topo da T02; Legado na T08/T11; botões de compra desabilitados com "faltam X" |
| RN-002 | Renda/s com divisão e Legado | T02, T03, T08 | "+X/s" sob o ouro; na T03 renda por gerador; na T08 "+Y% renda pelo Legado" |
| RN-003 | Geradores, custo crescente, visível a 50%, comprável com custo | T03, T02 | Linhas da T03 aparecem quando visíveis; "Próxima compra" da T02 escolhe entre os compráveis |
| RN-004 | Dobra a cada 50 unidades | T03 | "Faltam 12 para dobrar" + barra de 50 em cada linha |
| RN-005 | Toque = max(1; 0,1×renda/s), máx. 5/s | T02 | Botão de toque com "+X por toque"; excesso ignorado sem erro |
| RN-006 | Lote ×1, ×10, Máx; Máx desabilitado com "faltam" | T03, T02 | Seletor de lote fixo acima da barra de abas na T03; a T02 compra sempre ×1 |
| RN-007 | 5 jogadores, custo e poder por nível | T04 | 5 cartões: função, nome `[LORE]`, nível, poder, botão "Subir · custo" |
| RN-008 | Poder do time, divisões, multiplicador | T04, T02, T05, T06 | Poder do time × rival na T04; chip de divisão e "×2 renda" na T02; mudança de multiplicador na T06 |
| RN-009 | Partida a cada 90 s, P(vitória), prêmio | T02, T04, T05, A01 | Card "Próxima partida em 0:42 · chance 77%"; A01 com V/D e prêmio |
| RN-010 | 14 partidas, sobe ≥ 10 V, cai ≤ 3 V, marco de história | T02, T05, T06, T07 | Placar "6V 3D · faltam 5"; trilha de 14 casas; T06 subiu/manteve/caiu; T07 capítulo |
| RN-011 | Ganho offline 8 h × 50%, partidas até o fim da temporada | T13 | Tempo, ouro, V-D offline, resultado da temporada, "contou até 8 h" |
| RN-012 | Relógio atrasado/adiantado | T13 | Relógio atrasado: T13 não aparece (ganho 0, sem erro); > 8 h: linha "Contamos as 8 h máximas" |
| RN-013 | Prestígio a partir da Academy, 2 etapas | T08, T09, T10, T11 | Card travado "Chegue à Academy"; T09 resumo; T10 confirmação; T11 resultado |
| RN-014 | Bônus do Legado | T08, T09, T11, T04 | "+5% renda e +1% poder por ponto"; antes → depois na T09; poder já com bônus na T04 |
| RN-015 | Save automático, último save válido | T00, T12, T14 | Carregando; aviso de save recuperado; "Último save: há 4 s" em Ajustes |
| RN-016 | Sem dinheiro real nem pressão | todas | Nenhum botão de compra real, anúncio ou contagem falsa; notificações desligadas por padrão na T14 |
| RN-017 | Notação curta pt-BR | todas | Formatador único (tokens.md); exemplos em cada wireframe |

## O que cada tela mostra (resumo; detalhe nos fluxos)

- **T02 Clube:** detalhada em `fluxos/NX-010.md` e `fluxos/NX-012.md`. Orçamento vertical em
  360×640: topo 48 · ouro 80 · temporada/partida 120 · meta 72 (soma 320: metade de cima só de
  leitura) · próxima compra 80 · toque 176 · abas 64 = 640 px. Conferido no Chrome headless.
- **T03 Geradores:** lista rolável (é a única rolagem esperada no loop), seletor de lote e barra de
  abas fixos embaixo.
- **T04 Elenco:** cabeçalho "Poder do time 50 × rival 60 · chance 27%", 5 cartões. O botão de
  cada cartão mostra a prévia "chance 27% → 28%".
- **T05/T06:** painéis de baixo para cima, cabem em 640 px, fecham com 1 toque.
- **T07 Capítulo:** texto curto `[LORE]`, botão "Pular" sempre visível embaixo, igual em tamanho a
  "Continuar".
- **T08 Jornada:** trilha das 6 divisões (melhor da run marcada), Legado atual e bônus, card
  "Refundar o clube", lista de capítulos vistos.
- **T13 Offline:** uma tela, uma ação ("Receber"), sem nada pago (RN-011).
- **T14 Ajustes:** reduzir animações (segue o sistema por padrão), vibração, notificações (desligadas;
  só se o jogador ligar), rever dicas, info do save.

## Fora do MVP (não desenhado)

Olheiro/pacotes (NX-020), táticas (NX-021), assistir partida (NX-022), conquistas (NX-023),
estatísticas totais em tela própria (a RN-013 diz que são mantidas; no MVP aparecem só como linha
na T08).
