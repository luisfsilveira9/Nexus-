# Mapa de telas — Nexus Idle (MVP, épico E1)

> Dono: `nexus-ux`. Histórias: NX-004 (v0.1), NX-009 (v0.2), NX-024 (v0.3) e NX-025 (v0.3.1). Base: **RN v0.3.1**
> (RN-001 a RN-020), ADR-001, ADR-002, ADR-003 (identidade chibi), backlog E1 e nomes finais do lore
> (`docs/lore/nomes-do-jogo.md`, `biblia.md`).
> Frases finais do lore em `docs/lore/textos-mvp.md` e `docs/lore/temporadas/T01.md` (NX-019); não há mais `[LORE: …]` nos wireframes.
> Formato-alvo: celular em retrato, 360×640 px (CSS), uso com uma mão.

## Mudanças da v0.3 para a v0.3.1 (NX-025, 22/11/2026)

- **Tokens (T-03):** `cor.estado.pausa` → `cor.estado.info` e `cor.estado.erro-campo` →
  `cor.estado.aviso`, por mapeamento (`tokens.md` §5.2). `tokens.css` regerado: só essas 2 linhas
  entraram; `contraste.mjs` passa (77 pares).
- **Limites novos (`tokens.md` §10, pedido 6 do lore):** faixa de 1ª vez da T04 (60), linha de 1ª
  vez da T13 (120), linha extra do A01 (60), frase do jogador (60), título de tela cheia/T11 (26) e
  atribuição de fala (16).
- **Metas da T02 (NX-012):** novas 4b "Subida garantida!" e 5b "Título garantido!"; meta 7 vale em
  qualquer divisão fora do Mundial sem subida nem queda possível. As metas 4–8 não se sobrepõem e
  cobrem todos os placares (UX-60).
- **A03:** quem fala aparece **por extenso** ("— Rastro"), sem avatar; ícone ↑ ou ★ na frente. A
  fala do 2º título em diante (Zeca Trovão) usa o mesmo A03.
- **A01 da 1ª partida:** 6 s, com a linha do lore e sem o nome do rival, para caber nos 72 px.
- **T04:** frase do jogador abre dentro do cartão ao tocar no avatar/nome (alvo próprio).
- **Wireframes com os textos finais do lore:** T01 (prólogo), T02 (D1, D2, metas do onboarding,
  figuras novas 5b, 7b, 9 e 10), T04 (faixa e figura 3 nova), T07 (capítulo 1 com o bloco 4 novo,
  refundação, epílogo em 8 blocos), T08/T11 (títulos) e T13 (linha de 1ª vez). `check.mjs`: 11
  wireframes + índice, 67 telas, 0 problemas.
- **Critérios:** UX-50 e UX-59 ajustados; novos UX-60, UX-61 e UX-62.

## Mudanças da v0.2 para a v0.3 (NX-024, 22/11/2026)

- **Tokens da arte (P-ARTE-01):** `tokens.md` v0.3 inclui `cor.texto.destaque`,
  `cor.texto.sobre-desabilitada`, `cor.borda.divisor`, `cor.divisao.*`, `fonte.numero`,
  `curva.entrar/sair/quique/linear` e `ilustracao.*`, cada um com papel e regra de uso.
- **Chibi (ADR-003):** retrato decorativo da Rastro (96 px, x 8–104) à esquerda do "Fazer live" na
  T02, fora do alvo e sem mudar alturas; troca para "comemorando"/"frustrado" durante o A01; avatar
  de 48 px nos cartões da T04. **Dona Cel** é a mascote dos avisos: A02 (48 px), T01 (96 px), T09
  (48 px), T12a/b/c (48 px) e T11 (96 px). Os wireframes usam os SVGs reais de `assets/`, em cinza.
- **Nome do clube (RN-019 v0.3.1):** sem emoji. T15 refeita (8 figuras): "Los Grandes" com espaço,
  🔥 e `<` recusados com "Use só letras, números e espaços", aviso ao colar com proibidos e ao colar
  texto longo. Fluxo NX-018 reescrito.
- **Pausa do relógio = barra de abas visível (RN-009 v0.3, P-UX-10):** coluna "Pausa" sem
  pendências. T05 e T06 (painéis que cobrem a barra) também pausam e ganharam o chip; T06 abre
  direto na 14ª partida com a linha "Última partida" (sem A01 antes).
- **Ordem de eventos (RN-018 v0.3):** fila única avisos de save → T13 → T06 → T07 → A03; A03 só
  na subida e do 2º título mundial em diante, ≤ 60 caracteres, 4 s ou toque.
- **Importar (RN-015 v0.3):** confirmação com "Exportar o atual primeiro", recusa de save de versão
  mais nova (figura nova na T17) e reabertura pela fila com t_off a partir do save importado.
- **Critérios:** UX-11, 14, 40, 46, 47, 55, 57 e 58 ajustados; novos UX-16, 48 e 59.
- **Pedidos novos:** P-UX-15 (ordem da limpeza ao colar), P-UX-16 (leitura do Gherkin do
  `<script>`) e P-UX-17 (T13 como resumo dos splits na ordem da RN-018).
- Wireframes regerados por `docs/ux/ferramentas/gerar.py`; `check.mjs`: 11 wireframes + índice, 62 telas,
  0 problemas.

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
"Pausa" = o relógio de partida para enquanto a tela está aberta. Regra única da RN-009 v0.3: o
relógio só conta com a **barra de abas visível**; tudo que esconde ou cobre a barra pausa.

| ID | Nome | Tipo | Pausa | Resolve | RN | Histórias | Wireframe |
|---|---|---|---|---|---|---|---|
| T00 | Carregando | Tela | Sim | Abre o jogo e carrega o save sem tela vazia | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T01 | Boas-vindas (prólogo) | Tela | Sim | Prólogo em 4 blocos; "Começar" inicia a 1ª partida | 009, 016, 018 | NX-016, 017 | `T01-boas-vindas.html` |
| T02 | Clube (principal) | Aba 1 | — | Ouro, renda/s, toque, próxima compra, divisão, split, chance, meta | 001–006, 008–010, 013, 017 | NX-010, 012, 016 | `T02-principal.html` |
| T03 | Negócios | Aba 2 | — | Comprar negócios ×1/×10/Máx e ver marcos de 50 | 001–004, 006, 017 | NX-010 | `T03-negocios.html` |
| T04 | Elenco | Aba 3 | — | Subir nível dos 5 jogadores e ver o efeito na chance | 001, 007–009, 014 | NX-011 | `T04-elenco.html` |
| T05 | Split | Painel (card da T02) | Sim | 14 partidas, rivais (sigla e nome), regra de subir/cair | 008–010, 019 | NX-012 | `T05-split-e-fim.html` |
| T06 | Fim do split | Painel | Sim | V-D e resultado: subiu, manteve, caiu ou campeão mundial | 008, 010 | NX-012 | `T05-split-e-fim.html` |
| T07 | Capítulo | Tela | Sim | Capítulo de divisão, 1ª refundação, epílogo; releitura | 009, 013, 018 | NX-017 | `T07-capitulo.html` |
| T08 | Jornada | Aba 4 | — | Nome do clube, Legado, divisões, refundação, capítulos, histórico | 010, 013, 014, 018, 019 | NX-014, 017, 018 | `T08-jornada-e-prestigio.html` |
| T09 | Refundar — etapa 1 | Tela | Sim | Legado que ganha, o que zera e o que mantém | 013, 014 | NX-014 | `T08-jornada-e-prestigio.html` |
| T10 | Refundar — etapa 2 | Modal | Sim | Confirmação final, sem atalho | 013 | NX-014 | `T08-jornada-e-prestigio.html` |
| T11 | Clube refundado | Tela | Sim | Novo Legado e bônus já ativos | 013, 014 | NX-014 | `T08-jornada-e-prestigio.html` |
| T12a | Cópia válida recuperada | Modal | Sim | Avisa que carregou a outra cópia e de quando ela é | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T12b | Nenhuma cópia válida | Modal | Sim | "Tentar de novo" ou "Começar clube novo"; exportar o ilegível | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T12c | Confirmar clube novo | Modal | Sim | Confirmação exigida pela RN-015 | 015 | NX-015 | `T00-T12-carregar-e-save.html` |
| T13 | Enquanto você esteve fora | Tela | Sim | Tempo, ouro (renda + prêmios), partidas e cada split jogado | 009, 011, 012, 016, 017 | NX-013 | `T13-offline.html` |
| T14 | Ajustes | Tela (⚙ na T02) | Sim | Animações, vibração, notificações, dicas, nome, save | 013, 015, 016, 019 | NX-015, 016, 018 | `T14-ajustes.html` |
| T15 | Nome do clube | Tela | Sim | Renomear clube e sigla, com validação | 013, 015, 019 | NX-018 | `T15-nome-do-clube.html` |
| T16 | Exportar save | Painel (T14) | Sim | Copiar ou salvar o save como texto | 015 | NX-015 | `T14-ajustes.html` |
| T17 | Importar save | Painel + modal (T14) | Sim | Colar/escolher, conferir, mostrar prévia e confirmar a troca | 015 | NX-015 | `T14-ajustes.html` |
| A01 | Resultado da partida | Aviso | — | V/D, rival e prêmio, sem parar o jogo; chibi da T02 troca de expressão. Na 1ª partida: linha extra do lore e 6 s | 009 | NX-012 | `T02-principal.html` (4, 5, 5b) |
| A02 | Dica de onboarding | Aviso ancorado | — | Uma dica por vez, com a Dona Cel (48 px), some ao agir | 016 | NX-016 | `T02-principal.html` (2, 3) |
| A03 | Fala de 1 linha | Aviso | — | Só na subida a divisão já vista e do 2º título em diante: ↑/★ + fala ≤ 60 + "— quem fala" por extenso (sem avatar), some em 4 s ou com toque | 018 | NX-017 | `T02-principal.html` (7, 7b) |
| A04 | Confirmação curta | Aviso | — | "Nome salvo.", "Copiado." | 015, 019 | NX-015, 018 | `T08-jornada-e-prestigio.html` |
| A05 | Problema ao salvar | Aviso fixo | — | Sem espaço / falha: o último save válido está seguro | 015 | NX-015 | `T00-T12-carregar-e-save.html` |

Telas com barra de abas (T02, T03, T04, T08) e avisos (A01–A05, que nunca cobrem a barra) não
pausam. T05 e T06 são painéis, mas cobrem a barra: pausam e mostram o chip (decisão de layout do UX
aplicando a regra única; alternativa seria encurtar os painéis para deixar a barra visível).

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
        ├─ 1º título mundial ────────► T07 epílogo
        └─ 2º título em diante ──────► A03 fala de 1 linha   (caiu: nada além da T06)
   T08 ─ "Renomear" ─────────────────► T15 ─ Salvar ─► T08 + A04
   T08 ─ "Ver o que muda" ───────────► T09 ─► T10 ─► T11 ─► (1ª refundação: T07) ─► T02 (run nova)
   T08 ─ capítulo da lista ──────────► T07 (releitura)
```

**Fila de eventos (RN-018 v0.3, ordem fixa, uma tela por vez):** avisos de save (T12a/T12b) →
"Enquanto você esteve fora" (T13) → resumo de cada split (T06), em ordem → capítulos (T07), em ordem
cronológica → falas de 1 linha (A03). Na abertura: T00 → T12 (se houver) → T01 (clube novo) **ou**
T13 (se t_off ≥ 60 s) → T07 (se o offline abriu capítulo) → A03 (se houver) → aba em que o jogador
estava. Com T13, ela já é o resumo dos splits jogados fora e não vem T06 depois (leitura do UX,
pedido P-UX-17). Sem T13 (t_off < 60 s) e com split fechado, entram T06 e T07 como se o app
estivesse aberto (RN-011 v0.3). Importar um save reabre por esta mesma fila (RN-015 v0.3). Nada é creditado antes da T13 (RN-011); a T13 só sai com o crédito feito (botão, voltar do
sistema ou toque fora creditam igual). O offline para na 1ª subida ou queda (RN-011), então ele abre
**no máximo um** capítulo por volta (divisão nova ou epílogo).

**Fila durante o jogo:** na 14ª partida, a T06 abre direto (a linha "Última partida" substitui o
A01 dessa partida); depois T07 e/ou A03, na ordem acima. Como T06 e T07 pausam o relógio, nenhuma
partida acontece no meio da fila. Avisos (A01, A03) aparecem por 3–4 s sobre a faixa da meta
(y 248–320) e nunca cobrem a barra de abas, o botão de toque, o ouro/renda nem o placar. A04/A05
aparecem no topo (y 4–56) das telas sem ação ali.

**Indicador de pausa:** toda tela ou painel que pausa o relógio mostra o chip "⏸ Partidas em pausa" (texto
+ ícone, 12 px) no topo. Ao fechar, o relógio continua do ponto em que parou (RN-009).

## Barra de abas (navegação global)

- 4 abas: **Clube, Negócios, Elenco, Jornada**. 90×64 px cada, ícone + rótulo (nunca só ícone).
- Marcador de novidade = ponto + texto no rótulo ("Jornada •"), não só cor. Usos: Negócios quando
  um negócio novo fica visível (RN-003); Jornada quando a refundação fica disponível (RN-013) ou há
  capítulo novo para reler. Some ao abrir a aba.
- Sem marcador em Elenco por "dinheiro sobrando" (RN-016). Exceção: a dica do onboarding (D3).
- Aba ativa: fundo, negrito e barra de 3 px; não só cor.

## Cobertura das RN v0.3.1

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
| RN-009 | Partida a cada 90 s, chance, prêmio, pausa = barra de abas escondida | T02, T04, T05, A01, e todas as telas sem barra | "Próxima em 0:42 · Chance 77%"; A01 com prêmio; chip "⏸ Partidas em pausa" em toda tela/painel sem barra |
| RN-010 | Split de 14; sobe ≥ 10, cai ≤ 3; título mundial | T02, T05, T06, T08 | "Split 3 · 6V 3D · faltam 5"; T06 subiu/manteve/caiu/"★ Campeão mundial!"; títulos no histórico da T08 |
| RN-011 | Offline 8 h × 0,5, vários splits, para na subida/queda, tela só com t_off ≥ 60 s | T13 | Tempo, ouro (renda + prêmios), partidas, lista de splits com resultado |
| RN-012 | Relógio: maior horário já visto | T13 | Relógio atrasado: sem T13, ganho 0, sem erro; > 8 h: "Contamos as 8 h máximas" |
| RN-013 | Refundar a partir da Ascensão, 2 etapas, zera/mantém | T08, T09, T10, T11 | "🔒 Chegue à Ascensão"; T09 zera (ouro → 10) e mantém (nome, capítulos, histórico) |
| RN-014 | +5% renda e +1% poder por Legado | T04, T08, T09, T11 | "renda ×1 → ×2,25 · poder ×1 → ×1,25"; "inclui +10% do Legado" na T04 |
| RN-015 | Save: 2 cópias, recuperação, nenhuma válida, sem espaço, exportar/importar com confirmação, versão mais nova | T00, T12a–c, A05, T14, T16, T17 | Avisos de recuperação; "Tentar de novo"/"Começar clube novo"; Importar: prévia, "Trocar o clube atual?" com "Exportar o atual primeiro", recusa de versão mais nova |
| RN-016 | Sem dinheiro real nem pressão | todas | Nenhuma oferta; notificações desligadas; só o relógio real da partida conta |
| RN-017 | Números na tela | todas | Formatador único (`tokens.md` §9); "Faltam 13,6", "11,5", "1,00 mil", "77%" |
| RN-018 | Prólogo, capítulos por divisão, 1ª refundação, epílogo, fala de 1 linha (só subida e 2º título+), ordem de eventos, releitura | T01, T07, A03, T08, T06, T13 | Prólogo; "Capítulo 1 de 5 · Acesso"; A03 (≤ 60, 4 s); fila de eventos; lista de capítulos na Jornada |
| RN-019 | Nome (1–20; letras, números, espaço e `- . ' &`; sem emoji) e sigla (3 letras A–Z, ≠ 42 rivais), texto puro | T15, T08, T14, T05 | Contador; "Use só letras, números e espaços" ao digitar 🔥 ou `<`; aviso ao colar; sigla no título da T05 |
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
- **T15 Nome do clube:** dois campos, contador, lista do que vale, prévia, Cancelar/Salvar do mesmo
  tamanho; recusa emoji e símbolos (RN-019 v0.3.1).

## Fora do MVP (não desenhado)

Olheiro/pacotes (NX-020), táticas (NX-021), assistir partida (NX-022), conquistas (NX-023),
estatísticas totais em tela própria (no MVP aparecem só como linha "Histórico" na T08).
