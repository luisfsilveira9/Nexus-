# Casos — Elenco, poder do time e divisões

> RN-007 e RN-008 · História NX-011 (e base da NX-012) · Faixa CT-100 a CT-199.
> Convenções de nível e automação em `economia-renda.md`.

## RN-007 — Elenco

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-100 | Elenco inicial | Clube novo | Ler o elenco | 5 jogadores, um por função: Topo, Selva, Meio, Atirador, Suporte; todos nível **1**, poder **10** cada | U | Sim (PR) |
| CT-101 | Custo de nível (tabela) | — | `50 × 1,22^(L−1)` | L1→2: **50**; L2→3: **61**; L3→4: **74,42**; L10→11: **299,3701**; L50→51: **852.318,09**; L100→101: **17.725.285.584,57** | U | Sim (PR) |
| CT-102 | Poder por nível (tabela) | — | `10 × 1,05^(L−1)` | L1: **10**; L2: **10,5**; L3: **11,025**; L10: **15,5133**; L50: **109,2133**; L100: **1.252,3929** | U | Sim (PR) |
| CT-103 | Gherkin "subir nível" | Meio nível 1, ouro 50 | Subir o Meio | Meio nível **2**, poder **10,5**; ouro **0**; próximo custo **61**; poder do time 50 → **50,5** | U + E | Sim (PR smoke) |
| CT-104 | Ouro insuficiente | Meio nível 1, ouro 49,99 | Tentar subir | Recusado; nada muda | U | Sim (PR) |
| CT-105 | Sem nível máximo | Meio nível 499 (save injetado), ouro suficiente | Subir para 500 | Aceito; poder L500 = **3,7451e11**, custo L500→501 = **6,2019e44**, ambos finitos; tela usa notação científica | U | Sim (PR) |
| CT-106 | Monotonia | L de 1 a 2.000 | Calcular | Custo e poder estritamente crescentes e finitos | P | Sim (PR) |
| CT-107 | Nomes fictícios | Conteúdo do lore carregado | Ler os 5 nomes | Nenhum nome da lista de jogadores reais do legado (`docs/legado/pesquisa-ligas/jogadores-2026.json`) | I | Sim (PR) |

## RN-008 — Poder do time e divisões

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-110 | Poder do time sem Legado | Todos nível 1 | Calcular | **50** | U | Sim (PR) |
| CT-111 | Poder com Legado | Todos nível 1; Legado 10; Legado 25; Legado 80 | Calcular | **55**; **62,5**; **90** | U | Sim (PR) |
| CT-112 | Tabela de divisões | — | Ler config | Poder dos rivais 60 / 220 / 900 / 20.000 / 170.000 / 1.500.000; multiplicadores ×1 / ×2 / ×4 / ×8 / ×16 / ×32, na ordem Amadora → Mundial | U | Sim (PR) |
| CT-113 | 7 rivais por divisão, mesmo poder | Conteúdo carregado | Ler rivais de cada divisão | 7 rivais com nome por divisão (42 no total), todos com o poder da divisão | I | Sim (PR) |
| CT-114 | Multiplicador da divisão atual | Live n=200 (renda base 0,5×200×16 = 1.600/s) | Estar na Desafiante; ser rebaixado para a Amadora | Desafiante: **3.200/s**; após cair: **1.600/s** | I | Sim (PR) |
| CT-115 | Multiplicador no topo | Mesma renda base 1.600/s, Mundial | Calcular | **51.200/s** | U | Sim (PR) |
