# Mapa de telas — Nexus Idle (MVP, épico E1)

> Dono: `nexus-ux`. Histórias: NX-004 (v0.1) e NX-009 (v0.2). Base: **RN v0.2** (RN-001 a RN-020),
> ADR-001, ADR-002, backlog E1 e nomes finais do lore (`docs/lore/nomes-do-jogo.md`, `biblia.md`).
> Frases que o lore ainda não escreveu aparecem como `[LORE: sentido]`; nomes não usam mais placeholder.
> Formato-alvo: celular em retrato, 360×640 px (CSS), uso com uma mão.

## Mudanças da v0.1 para a v0.2 (NX-009)

- **Nomes finais** em todas as telas: divisões (Várzea → Mundial), negócios ("Aulas na lan" …
  "Arena do clube"), "Fazer live", "Refundar o clube", Legado, Pedra/Rastro/Vulto/Fagulha/Bússola e
  os rivais. A aba "Geradores" virou **Negócios**; "temporada" (14 partidas) virou **split**.
  Arquivos renomeados: `T03-negocios.html`, `T05-split-e-fim.html`.
- **Números (RN-017 v0.2):** abaixo de 100 com 1 casa decimal sem zero final (ouro, custo, renda,
  poder); custos e "Faltam" para cima; % ao mais próximo. Todos os números dos wireframes foram
  recalculados com as fórmulas (ex.: 2º custo de "Aulas na lan" = 11,5; Patrocínio n=1 = 173).
- **Clube novo com 10 de ouro** e "Aulas na lan" visível: a T03 nunca fica vazia e o onboarding
  começa pela compra, não pelo toque.
- **T01 virou o prólogo** (RN-018). **T07** cobre capítulo de divisão, 1ª refundação, epílogo e
  releitura, em blocos. **A03** = fala de 1 linha ao voltar a uma divisão já vista.
- **T06** ganhou o **título mundial** (RN-010). **T13** mostra **vários splits** e só aparece com
  t_off ≥ 60 s (RN-011).
- **Relógio de partida pausado** nas telas cheias (RN-009): indicador "⏸ Partidas em pausa".
- **Save (RN-015):** T12a (cópia recuperada), T12b (nenhuma válida), T12c (confirmar clube novo),
  A05 (sem espaço); **exportar/importar** em Ajustes (T16, T17).
- **Novas telas:** T15 Nome do clube (NX-018), T16 Exportar save, T17 Importar save; avisos A04 e A05.
- **Bônus do Legado** mostrado como multiplicador (`renda ×2,25`), igual ao Gherkin da NX-014.
- Tabela RN → tela estendida até a RN-020. Pedidos novos: P-UX-09 a P-UX-14.

## Princípios aplicados

1. **3 segundos:** a tela principal responde "quanto tenho, quanto ganho, o que compro agora, como
   está o split e qual a chance da próxima partida", sem rolar.
2. **Polegar:** tudo que se toca com frequência fica na metade de baixo (y ≥ 320 px). A metade de
   cima é só leitura. Exceção consciente: a T15 (com teclado aberto, os botões ficam logo acima dele).
3. **Alvo de toque ≥ 48×48 px** e 8 px de folga entre alvos vizinhos. Texto ≥ 12 px.
4. **Nunca só cor:** vitória/derrota com letra V/D e ícone (✓/✕); título com ★ + "Campeão";
   travado com 🔒 + texto; chance com rótulo em palavra; pausa com ⏸ + texto.
5. **Honesto (RN-016):** nenhuma tela vende, nenhuma contagem regressiva além do relógio real da
   partida, todo "Cancelar"/"Agora não" tem o mesmo tamanho do "Confirmar".
6. **Mesmo número, mesmo formato:** toda quantia passa pelo formatador único da RN-017
   (`tokens.md` §9).

## Inventário

Tipos: **Tela** (ocupa tudo) · **Aba** (uma das 4 da barra de baixo) · **Painel** (bottom sheet
sobre a tela atual) · **Modal** (bloqueia até uma decisão) · **Aviso** (toast, não bloqueia).
"Pausa" = o relógio de partida para enquanto a tela está aberta (RN-009, RN-013, RN-018).

| ID | Nome | Tipo | Pausa | Resolve | RN | Histórias | Wireframe |
|---|---|---|---|---|---|---|---|
| T00 | Carregando | Tela | (P-UX-10) | Abre o jogo e carrega o save sem tela vazia | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T01 | Boas-vindas (prólogo) | Tela | Sim | Prólogo em 4 blocos; "Começar" inicia a 1ª partida | 009, 016, 018 | NX-016, 017 | `T01-boas-vindas.html` |
| T02 | Clube (principal) | Aba 1 | — | Ouro, renda/s, toque, próxima compra, divisão, split, chance, meta | 001–006, 008–010, 013, 017 | NX-010, 012, 016 | `T02-principal.html` |
| T03 | Negócios | Aba 2 | — | Comprar negócios ×1/×10/Máx e ver marcos de 50 | 001–004, 006, 017 | NX-010 | `T03-negocios.html` |
| T04 | Elenco | Aba 3 | — | Subir nível dos 5 jogadores e ver o efeito na chance | 001, 007–009, 014 | NX-011 | `T04-elenco.html` |
| T05 | Split | Painel (card da T02) | — | 14 partidas, rivais (sigla e nome), regra de subir/cair | 008–010, 019 | NX-012 | `T05-split-e-fim.html` |
| T06 | Fim do split | Painel | — | V-D e resultado: subiu, manteve, caiu ou campeão mundial | 008, 010 | NX-012 | `T05-split-e-fim.html` |
| T07 | Capítulo | Tela | Sim | Capítulo de divisão, 1ª refundação, epílogo; releitura | 009, 013, 018 | NX-017 | `T07-capitulo.html` |
| T08 | Jornada | Aba 4 | — | Nome do clube, Legado, divisões, refundação, capítulos, histórico | 010, 013, 014, 018, 019 | NX-014, 017, 018 | `T08-jornada-e-prestigio.html` |
| T09 | Refundar — etapa 1 | Tela | Sim | Legado que ganha, o que zera e o que mantém | 013, 014 | NX-014 | `T08-jornada-e-prestigio.html` |
| T10 | Refundar — etapa 2 | Modal | Sim | Confirmação final, sem atalho | 013 | NX-014 | `T08-jornada-e-prestigio.html` |
| T11 | Clube refundado | Tela | (P-UX-10) | Novo Legado e bônus já ativos | 013, 014 | NX-014 | `T08-jornada-e-prestigio.html` |
| T12a | Cópia válida recuperada | Modal | (P-UX-10) | Avisa que carregou a outra cópia e de quando ela é | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T12b | Nenhuma cópia válida | Modal | (P-UX-10) | "Tentar de novo" ou "Começar clube novo"; exportar o ilegível | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T12c | Confirmar clube novo | Modal | (P-UX-10) | Confirmação exigida pela RN-015 | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T13 | Enquanto você esteve fora | Tela | Sim | Tempo, ouro (renda + prêmios), partidas e cada split jogado | 009, 011, 012, 016, 017 | NX-013 | `T13-offline.html` |
| T14 | Ajustes | Tela (⚙ na T02) | (P-UX-10) | Animações, vibração, notificações, dicas, nome, save | 013, 015, 016, 019 | NX-015, 016, 018 | `T14-ajustes.html` |
| T15 | Nome do clube | Tela | (P-UX-10) | Renomear clube e sigla, com validação | 013, 015, 019 | NX-018 | `T15-nome-do-clube.html` |
| T16 | Exportar save | Painel (T14) | (P-UX-10) | Copiar ou salvar o save como texto | 015 | NX-015 | `T14-ajustes.html` |
| T17 | Importar save | Painel + modal (T14) | (P-UX-10) | Colar/escolher, conferir, mostrar prévia e confirmar a troca | 015 | NX-015 | `T14-ajustes.html` |
| A01 | Resultado da partida | Aviso | — | V/D, rival e prêmio, sem parar o jogo | 009 | NX-012 | `T02-principal.html` |
| A02 | Dica de onboarding | Aviso ancorado | — | Uma dica por vez, some ao agir | 016 | NX-016 | `T02-principal.html` |
| A03 | Fala de retorno | Aviso | — | Volta a uma divisão já vista: 1 linha, some em 4 s | 018 | NX-017 | `T02-principal.html` (7) |
| A04 | Confirmação curta | Aviso | — | "Nome salvo.", "Copiado." | 015, 019 | NX-015, 018 | `T08-jornada-e-prestigio.html` |
| A05 | Problema ao salvar | Aviso fixo | — | Sem espaço / falha: o último save válido está seguro | 015 | NX-015 | `T00-T12-carregar-e-save.html` |

"(P-UX-10)": a RN-009 lista só boas-vindas, capítulo, T13 e confirmação da refundação. A proposta
P-UX-10 é uma regra única ("o relógio de partida só conta com a barra de abas visível"), que
inclui essas telas. Até a decisão, o tech implementa só as marcadas "Sim".

## Como as telas se conectam

```
                 ┌───────────────┐
  abrir app ───► │ T00 Carregando│
                 └──────┬────────┘
        cópia atual ok? │não ─► outra cópia ok? ─ sim ─► T12a ─┐
                        │             │não                    │
                        │             ▼                       │
                        │     T12b ─ Tentar de novo ─► T00    │
                        │       └─ Começar clube novo ─► T12c ─► T01 (clube novo)
                        │sim                                  │
                        ▼◄────────────────────────────────────┘
          sem save (1ª vez)? ─ sim ─► T01 Prólogo ─ Começar/Pular ─► T02 (dicas A02)
                        │não
          t_off ≥ 60 s? ─ sim ─► T13 Enquanto você esteve fora ─ Receber ─┐
                        │não (crédito direto, sem tela)                   │
                        ▼                                                 ▼
                        │          capítulo novo fora? (divisão inédita ou 1º título)
                        │                    │sim ─► T07 ─┐       │não
                        ▼◄───────────────────────────────┴───────┘
                 ┌────────────────────────────────────────────────────────┐
                 │ Barra de abas (sempre visível, embaixo)                │
                 │  T02 Clube · T03 Negócios · T04 Elenco · T08 Jornada   │
                 └────────────────────────────────────────────────────────┘
   T02 ─ card do split ──────────────► T05 Split (painel)
   T02 ─ "Próxima compra" ───────────► compra ×1 direto (não navega)
   T02 ─ ⚙ ──────────────────────────► T14 Ajustes ─► T15 Nome · T16 Exportar · T17 Importar
   a cada 90 s (com abas visíveis) ──► A01 Resultado
   14ª partida ──────────────────────► T06 Fim do split
        ├─ subiu a divisão inédita ──► T07 capítulo da divisão
        ├─ subiu a divisão já vista ─► A03 fala de 1 linha
        └─ 1º título mundial ────────► T07 epílogo
   T08 ─ "Renomear" ─────────────────► T15 ─ Salvar ─► T08 + A04
   T08 ─ "Ver o que muda" ───────────► T09 ─► T10 ─► T11 ─► (1ª refundação: T07) ─► T02 (run nova)
   T08 ─ capítulo da lista ──────────► T07 (releitura)
```

**Fila de abertura (ordem fixa, uma tela por vez):** T00 → T12a/T12b (se houver) → T01 (clube
novo) **ou** T13 (se t_off ≥ 60 s) → T07 (se o offline abriu capítulo) → aba em que o jogador
estava. Nada é creditado antes da T13 (RN-011); a T13 só sai com o crédito feito (botão, voltar do
sistema ou toque fora creditam igual). O offline para na 1ª subida ou queda (RN-011), então ele abre
**no máximo um** capítulo por volta (divisão nova ou epílogo).

**Fila durante o jogo:** se dois eventos coincidem, vale: T06 Fim do split > T07 Capítulo >
A03 Fala de retorno > A01 Resultado. Avisos (A01, A03) aparecem por 3–4 s sobre a faixa da meta
(y 248–320) e nunca cobrem a barra de abas, o botão de toque, o ouro/renda nem o placar. A04/A05
aparecem no topo (y 4–56) das telas sem ação ali.

**Indicador de pausa:** toda tela que pausa o relógio mostra o chip "⏸ Partidas em pausa" (texto
+ ícone, 12 px) no topo. Ao fechar, o relógio continua do ponto em que parou (RN-009).

## Barra de abas (navegação global)

- 4 abas: **Clube, Negócios, Elenco, Jornada**. 90×64 px cada, ícone + rótulo (nunca só ícone).
- Marcador de novidade = ponto + texto no rótulo ("Jornada •"), não só cor. Usos: Negócios quando
  um negócio novo fica visível (RN-003); Jornada quando a refundação fica disponível (RN-013) ou há
  capítulo novo para reler. Some ao abrir a aba.
- Sem marcador em Elenco por "dinheiro sobrando" (RN-016). Exceção: a dica do onboarding (D3).
- Aba ativa: fundo, negrito e barra de 3 px; não só cor.

## Cobertura das RN v0.2

Cada RN aparece em pelo menos uma tela. "Onde se vê" diz o elemento exato.

| RN | Assunto | Telas | Onde se vê |
|---|---|---|---|
| RN-001 | Ouro e Legado; ouro inicial 10; nada negativo | T02, T03, T04, T08, T11, T12c | Ouro no topo da T02 (clube novo: `10`); Legado na T08/T11; botões com "Faltam X"; T12c "começa com 10 de ouro" |
| RN-002 | Renda/s com divisão e Legado | T02, T03, T08 | "+X/s" sob o ouro; renda por negócio na T03; "renda ×2,25" na T08 |
| RN-003 | Negócios, custo, visível a 50% do acumulado, "Aulas na lan" desde o início | T02, T03 | "Próxima compra" escolhe o mais barato visível; selo "Novo" + anúncio do Renatão |
| RN-004 | Dobra a cada 50 unidades | T03 | Barra "37/50 · faltam 13 para ×2"; "dobrou!" por 3 s |
| RN-005 | "Fazer live" = max(1; 0,1×renda/s), 5 por janela de 1 s | T02 | Botão "Fazer live" com "+X por toque"; toques a mais sem feedback e sem erro |
| RN-006 | ×1, ×10, Máx; ×10 e Máx desabilitados com "Faltam X" | T03 | Seletor fixo; ×10 parcial com "Faltam"; "Máx (4)" |
| RN-007 | 5 jogadores, custo e poder por nível | T04 | Cartões Pedra, Rastro, Vulto, Fagulha, Bússola: nível, poder, "Subir · custo" |
| RN-008 | Poder do time, divisões, multiplicador | T02, T04, T05, T06 | Chip "Várzea · ×1 renda"; "Poder 50 × 60"; mudança de rival e multiplicador na T06 |
| RN-009 | Partida a cada 90 s, chance, prêmio, pausa do relógio | T02, T04, T05, A01, T01, T07, T09, T10, T13 | "Próxima em 0:42 · Chance 77%"; A01 com prêmio; chip "⏸ Partidas em pausa" |
| RN-010 | Split de 14; sobe ≥ 10, cai ≤ 3; título mundial | T02, T05, T06, T08 | "Split 3 · 6V 3D · faltam 5"; T06 subiu/manteve/caiu/"★ Campeão mundial!"; títulos no histórico da T08 |
| RN-011 | Offline 8 h × 0,5, vários splits, para na subida/queda, tela só com t_off ≥ 60 s | T13 | Tempo, ouro (renda + prêmios), partidas, lista de splits com resultado |
| RN-012 | Relógio: maior horário já visto | T13 | Relógio atrasado: sem T13, ganho 0, sem erro; > 8 h: "Contamos as 8 h máximas" |
| RN-013 | Refundar a partir da Ascensão, 2 etapas, zera/mantém | T08, T09, T10, T11 | "🔒 Chegue à Ascensão"; T09 zera (ouro → 10) e mantém (nome, capítulos, histórico) |
| RN-014 | +5% renda e +1% poder por Legado | T04, T08, T09, T11 | "renda ×1 → ×2,25 · poder ×1 → ×1,25"; "inclui +10% do Legado" na T04 |
| RN-015 | Save: 2 cópias, recuperação, nenhuma válida, sem espaço, exportar/importar | T00, T12a–c, A05, T14, T16, T17 | Avisos de recuperação; "Tentar de novo"/"Começar clube novo"; Exportar/Importar |
| RN-016 | Sem dinheiro real nem pressão | todas | Nenhuma oferta; notificações desligadas; só o relógio real da partida conta |
| RN-017 | Números na tela | todas | Formatador único (`tokens.md` §9); "Faltam 13,6", "11,5", "1,00 mil", "77%" |
| RN-018 | Prólogo, capítulos por divisão, 1ª refundação, epílogo, fala de retorno, releitura | T01, T07, A03, T08 | Prólogo; "Capítulo 1 de 5 · Acesso"; A03; lista de capítulos na Jornada |
| RN-019 | Nome (≤ 20) e sigla (3 letras A–Z, ≠ rivais), texto puro | T15, T08, T14, T05 | Campos com contador e mensagens; sigla no título da T05; `<script>` literal |
| RN-020 | Limites de texto = `tokens.md` §10 | todas | Tabela §10; nomes do lore medidos nos wireframes (0 cortes no Chrome headless) |

## O que cada tela mostra (resumo; detalhe nos fluxos)

- **T01 Prólogo:** componente de capítulo (T07) com 4 blocos, Pular/Continuar; último bloco com
  "Começar". Fluxos NX-016 e NX-017.
- **T02 Clube:** `fluxos/NX-010.md` e `fluxos/NX-012.md`. Orçamento vertical em 360×640: topo 48 ·
  ouro 80 · split 120 · meta 72 (= 320, só leitura) · próxima compra 80 · toque 176 · abas 64.
- **T03 Negócios:** lista rolável (única rolagem esperada no loop), seletor de lote e abas fixos.
- **T04 Elenco:** cabeçalho "Poder do time 50 × 60 · Chance 27% · Azarão" e 5 cartões com prévia.
- **T05/T06:** painéis de baixo para cima, cabem em 640 px, fecham com 1 toque.
- **T07 Capítulo:** blocos ≤ 280 caracteres, um por vez; Pular e Continuar do mesmo tamanho.
- **T08 Jornada:** nome e sigla com "Renomear", Legado e bônus, divisões alcançadas desde a última
  refundação, card "Refundar o clube", capítulos (rola) e histórico (títulos, refundações).
- **T13 Offline:** totais fixos no topo; lista de splits rola; uma ação ("Receber").
- **T14 Ajustes:** lista que rola; nome do clube, animações, vibração, notificações, dicas, save.
- **T15 Nome do clube:** dois campos, contador, prévia, Cancelar/Salvar do mesmo tamanho.

## Fora do MVP (não desenhado)

Olheiro/pacotes (NX-020), táticas (NX-021), assistir partida (NX-022), conquistas (NX-023),
estatísticas totais em tela própria (no MVP aparecem só como linha "Histórico" na T08).
