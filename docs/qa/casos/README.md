# Casos de teste — índice e rastreabilidade

> Dono: `nexus-qa`. NX-006, v0.1 (20/11/2026). 171 casos, RN v0.1.
> Os resultados esperados foram calculados com as fórmulas das RN em precisão dupla. Quando a
> NX-007 mudar uma constante, os números mudam junto: os testes automatizados devem ler as
> constantes da config do jogo e manter aqui só os exemplos de referência.

## Convenções

- **ID:** `CT-###`, em faixas por área (001–099 economia, 100 elenco, 200 partidas, 300 offline,
  400 prestígio, 500 save, 600 exibição/honestidade, 700 onboarding/capítulos).
- **Nível:** U unitário · P propriedade · I integração · E E2E · V visual · A usabilidade/acessibilidade · S segurança.
- **Auto:** `Sim (PR)` roda em todo PR e bloqueia o merge · `Sim (main)` / `Sim (noturna)` roda
  depois do merge · `Sim após decisão` espera um pedido do PO · `Não` é manual.
- **Bloqueado por pedido QA-N:** a RN admite mais de um resultado; o caso existe, mas o esperado só
  fecha quando o PO decidir em `docs/produto/pedidos.md` (IDs `QA-1` a `QA-19`; os pedidos de outras áreas usam outra numeração).
- **Nomes:** os casos usam os nomes provisórios das RN v0.1 (Desafiante, Academy, Live do time…).
  O lore já propôs nomes finais (pedido 2 do `nexus-lore`); quando o PO aprovar, só os textos
  esperados na tela mudam, não os números. Os testes devem ler os nomes do conteúdo, não fixá-los.
  O lore também prevê **renomear o clube** (pedido 5 do lore): se entrar, é entrada do jogador e
  ganha casos de validação e de injeção de HTML (ameaça A3 de `seguranca.md`).
- Na hora de automatizar, o nome do teste começa com o ID (`CT-303 limite exato de 8 h`), para o
  relatório ligar falha → caso → RN.

## Arquivos

| Arquivo | RN | História | Casos |
|---|---|---|---|
| `economia-renda.md` | 001–006 | NX-010 | CT-001 a CT-072 |
| `elenco-divisoes.md` | 007, 008 | NX-011 | CT-100 a CT-115 |
| `partidas-temporada.md` | 009, 010 | NX-012 | CT-200 a CT-220 |
| `offline-relogio.md` | 011, 012 | NX-013 | CT-300 a CT-327 |
| `prestigio.md` | 013, 014 | NX-014 | CT-400 a CT-422 |
| `save.md` | 015 | NX-015 | CT-500 a CT-517 |
| `exibicao-e-honestidade.md` | 016, 017 | transversal | CT-600 a CT-624 |
| `onboarding-capitulos.md` | todas, 010 | NX-016, NX-017 | CT-700 a CT-715 |

## Matriz RN × casos

| RN | Casos | Automatizado no PR? |
|---|---|---|
| RN-001 Recursos | CT-001–005, CT-060 | Sim |
| RN-002 Renda/s | CT-010–014, CT-114, CT-115 | Sim |
| RN-003 Geradores | CT-020–025, CT-070 | Sim |
| RN-004 Marcos | CT-030–032 | Sim |
| RN-005 Toque | CT-040–047, CT-071 | Sim (CT-045 após pedido QA-7) |
| RN-006 Lote | CT-050–060, CT-072 | Sim (CT-057, CT-058 após pedidos QA-2 e QA-8) |
| RN-007 Elenco | CT-100–107 | Sim |
| RN-008 Poder e divisões | CT-110–115, CT-200 | Sim |
| RN-009 Partida | CT-200–209 | Sim |
| RN-010 Temporada | CT-210–220, CT-710–715 | Sim (CT-219 após pedido QA-6) |
| RN-011 Offline | CT-300–317 | Sim (CT-300, CT-316, CT-317 após pedidos QA-12, QA-10, QA-9) |
| RN-012 Relógio | CT-320–327, CT-013 | Sim (CT-323 após pedido QA-11) |
| RN-013 Prestígio | CT-400–414, CT-024 | Sim (CT-409 depende do pedido QA-1) |
| RN-014 Legado | CT-420–422, CT-010, CT-111, CT-406–408 | Sim |
| RN-015 Save | CT-500–517 | Sim (CT-505 e CT-413 na noturna; CT-517 manual) |
| RN-016 Sem dinheiro real | CT-312, CT-620–624 | Sim |
| RN-017 Números | CT-600–612, CT-314 | Sim (CT-603, CT-611 após pedido QA-13) |

**Cobertura:** 17 de 17 RN de E1 têm casos; todas têm pelo menos um caso automatizável no PR já
fechado (sem depender de pedido).

## Matriz história × casos (Gherkin)

| História | Cenário Gherkin | Caso |
|---|---|---|
| NX-010 | Comprar o primeiro gerador | CT-070 |
| NX-010 | Toque limitado | CT-043 / CT-071 |
| NX-010 | Compra Máx sem ouro suficiente | CT-056 / CT-072 |
| NX-011 | Subir nível | CT-103 |
| NX-012 | Chance mostrada antes da partida | CT-202 |
| NX-012 | Subir de divisão | CT-211 |
| NX-012 | Ninguém cai da Amadora | CT-212 |
| NX-013 | Volta depois de 10 horas | CT-306 |
| NX-013 | Relógio atrasado | CT-320 |
| NX-014 | Prestígio indisponível | CT-400 |
| NX-014 | Refundar depois da Liga | CT-406 |
| NX-015 | Fechar o app no meio | CT-504 |
| NX-015 | Save corrompido | CT-506 |
| NX-016 | 1ª compra < 10 s / entende o elenco / 2ª temporada em 5 min | CT-700, CT-701 / CT-702 / CT-703 |
| NX-017 | Capítulo por divisão nova, pulável, relido, não reaparece | CT-710–715 |

## Casos de borda pedidos na NX-006

| Borda | Casos |
|---|---|
| Limite exato do offline (8 h), 8 h ± 1 s | CT-303, CT-304, CT-305 |
| 0 s offline | CT-300 |
| Relógio adiantado / atrasado / ciclo | CT-322 / CT-320, CT-321 / CT-323 |
| Fuso alterado | CT-324, CT-325 |
| Fim de temporada durante o offline | CT-306, CT-307, CT-309 |
| Compra Máx com k = 0 | CT-056, CT-057 |
| Limite de 5 toques/s | CT-043–047 |
| Divisão do topo e do fundo | CT-212, CT-214, CT-215 |
| Prestígio travado e liberado | CT-400–405, CT-414 |
| Números acima de 1e15 | CT-605, CT-314, CT-059, CT-610 |
| Save corrompido e migração | CT-506–513 |
