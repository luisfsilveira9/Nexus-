# Casos — Elenco, poder do time e divisões

> RN-007 e RN-008 · História NX-011 (e base da NX-012) · Faixa CT-100 a CT-199. **v0.2** (sem mudança na v0.3; NX-009).
> Convenções de nível, automação e comparação de dinheiro em `economia-renda.md`.
> Exibição (RN-017 v0.2): custo para cima; poder para baixo; abaixo de 100 com 1 casa decimal.

## RN-007 — Elenco

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-100 | Elenco inicial | Clube novo | Ler o elenco | 5 jogadores: Pedra (Topo), Rastro (Selva), Vulto (Meio), Fagulha (Atirador), Bússola (Suporte); todos nível **1**, poder **10** ("10") | U | Sim (PR) |
| CT-101 | Custo de nível (tabela) | — | `50 × 1,22^(L−1)` | L1→2: **50** ("50"); L2→3: **61** ("61"); L3→4: **74,42** ("74,5"); L10→11: **299,3701** ("300"); L50→51: **852.318,09** ("853 mil"); L100→101: **17.725.285.584,57** ("17,8 bi") | U | Sim (PR) |
| CT-102 | Poder por nível (tabela) | — | `10 × 1,05^(L−1)` | L1: **10** ("10"); L2: **10,5** ("10,5"); L3: **11,025** ("11"); L10: **15,5133** ("15,5"); L50: **109,2133** ("109"); L100: **1.252,3929** ("1,25 mil") | U | Sim (PR) |
| CT-103 | Gherkin "subir nível" | Vulto (Meio) nível 1, ouro 50 | Subir o Vulto | Nível **2**, poder **10,5** ("10,5"); ouro **0**; próximo custo **61** ("61"); poder do time 50 → **50,5** | U + E | Sim (PR smoke) |
| CT-104 | Ouro insuficiente | Meio nível 1, ouro 49,99 | Tentar subir | Recusado; nada muda | U | Sim (PR) |
| CT-105 | Sem nível máximo | Meio nível 499 (save injetado), ouro suficiente | Subir para 500 | Aceito; poder L500 = **3,7451e11** ("374 bi"); custo L500→501 = **6,2019e44** ("6,21e44"); ambos finitos | U | Sim (PR) |
| CT-106 | Monotonia | L de 1 a 2.000 | Calcular | Custo e poder estritamente crescentes e finitos | P | Sim (PR) |
| CT-107 | Nomes fictícios | Conteúdo do lore carregado | Ler os 5 nomes | Iguais aos da RN-007 e fora da lista de jogadores reais do legado (`docs/legado/pesquisa-ligas/jogadores-2026.json`) | I | Sim (PR) |
| CT-108 | Tolerância no nível | Meio nível 1 | Subir com ouro `50 × (1 − 10⁻¹⁰)` | Aceito; ouro final **0** (nunca negativo) | U | Sim (PR) |

## RN-008 — Poder do time e divisões

| ID | Caso | Pré-condição | Passos | Resultado esperado | Nível | Auto |
|---|---|---|---|---|---|---|
| CT-110 | Poder do time sem Legado | Todos nível 1 | Calcular | **50** | U | Sim (PR) |
| CT-111 | Poder com Legado | Todos nível 1; Legado 10; 25; 80 | Calcular | **55**; **62,5**; **90** | U | Sim (PR) |
| CT-112 | Tabela de divisões | — | Ler a config única (C4) | Várzea, Acesso, Ascensão, Elite, Continental, Mundial, nessa ordem; rivais 60 / 220 / 900 / 20.000 / 170.000 / 1.500.000; multiplicadores ×1 / ×2 / ×4 / ×8 / ×16 / ×32 | U | Sim (PR) |
| CT-113 | 7 rivais por divisão | Conteúdo carregado | Ler os rivais | 7 por divisão (42), nomes de `docs/lore/nomes-do-jogo.md`, todos com o poder da divisão; 42 siglas de 3 letras A–Z, únicas, nenhuma igual a **FSC** | I | Sim (PR) |
| CT-114 | Multiplicador da divisão atual | Aulas n=200 (renda base 0,5×200×2⁴ = 1.600/s) | Estar no Acesso; ser rebaixado para a Várzea | Acesso: **3.200/s** ("3,20 mil/s"); depois de cair: **1.600/s** ("1,60 mil/s") | I | Sim (PR) |
| CT-115 | Multiplicador no topo | Renda base 1.600/s, Mundial | Calcular | **51.200/s** ("51,2 mil/s") | U | Sim (PR) |
| CT-116 | Título não muda o multiplicador | Mundial, renda base 1.600/s | Ganhar o título mundial (CT-230) | Continua **51.200/s** | I | Sim (PR) |
