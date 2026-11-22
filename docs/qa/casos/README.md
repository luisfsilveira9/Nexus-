# Casos de teste — índice e rastreabilidade

> Dono: `nexus-qa`. **v0.2** (NX-009, 20/11/2026): 255 casos, RN v0.2 (RN-001 a RN-020).
> v0.1 (NX-006): 171 casos, RN v0.1. Mudanças no [changelog](#changelog-v01--v02) no fim.
> Os resultados esperados foram calculados com as fórmulas das RN v0.2 em precisão dupla e conferidos
> em Node 22. Os testes automatizados leem as constantes da config única do jogo (condição C4 do
> ADR-002); aqui ficam os exemplos de referência. Se uma constante mudar, o número esperado muda junto.

## Convenções

- **ID:** `CT-###`, em faixas por área: 001–099 economia · 100 elenco · 200 partidas e split ·
  300 offline e relógio · 400 refundação · 500 save · 600 exibição e honestidade · 700 onboarding e
  capítulos · 800 nome do clube e textos. Um ID nunca é reaproveitado para outro caso.
- **Nível:** U unitário · P propriedade · I integração · E E2E · V visual · A usabilidade/acessibilidade · S segurança.
- **Auto:** `Sim (PR)` roda em todo PR e bloqueia o merge · `Sim (main)` / `Sim (noturna)` roda depois
  do merge · `Sim após decisão` espera um pedido do PO · `Não` é manual.
- **Bloqueado por pedido QA-N:** a RN admite mais de um resultado; o caso existe, mas o esperado só
  fecha quando o PO decidir em `docs/produto/pedidos.md`. Na v0.2 os pedidos QA-1 a QA-19 estão
  decididos; os abertos são **QA-20 a QA-27**.
- **Nomes:** os casos usam os nomes finais do lore (`docs/lore/nomes-do-jogo.md`): Várzea, Acesso,
  Ascensão, Elite, Continental, Mundial; "Aulas na lan"; "Fazer live"; "Refundar o clube"; Legado;
  "split" para o bloco de 14 partidas. Mesmo assim, os testes leem os textos de `src/content/` e
  localizam elementos por `data-testid` (C6), nunca pelo texto.
- **Números na tela** seguem a RN-017 v0.2 e aparecem entre aspas: "11,5", "1,44 mi".
- Na hora de automatizar, o nome do teste começa com o ID (`CT-303 limite exato de 8 h`), para o
  relatório ligar falha → caso → RN.

## Arquivos

| Arquivo | RN | História | Casos | Qtde |
|---|---|---|---|---|
| `economia-renda.md` | 001–006 | NX-010 | CT-001 a CT-072 | 47 |
| `elenco-divisoes.md` | 007, 008 | NX-011 | CT-100 a CT-116 | 16 |
| `partidas-temporada.md` | 009, 010 | NX-012 | CT-200 a CT-233 | 31 |
| `offline-relogio.md` | 011, 012 | NX-013 | CT-300 a CT-339 | 37 |
| `prestigio.md` | 013, 014 | NX-014 | CT-400 a CT-422 | 21 |
| `save.md` | 015 (+ C1–C10 do ADR-002) | NX-015 | CT-500 a CT-540 | 36 |
| `exibicao-e-honestidade.md` | 016, 017 | transversal | CT-600 a CT-624 | 22 |
| `onboarding-capitulos.md` | 018 (e todas, na NX-016) | NX-016, NX-017 | CT-700 a CT-726 | 26 |
| `clube-e-textos.md` | 019, 020 | NX-018, transversal | CT-800 a CT-825 | 19 |
| **Total** | | | | **255** |

## Matriz RN × casos

| RN | Casos | Automatizado no PR? | Pendente de decisão |
|---|---|---|---|
| RN-001 Recursos | CT-001–007, CT-060, CT-416 | Sim | — |
| RN-002 Renda/s | CT-010–014, CT-114–116 | Sim | — |
| RN-003 Negócios | CT-020–027, CT-070 | Sim | CT-022, CT-024, CT-026 (só a origem do acumulado: QA-20) |
| RN-004 Marcos | CT-030–032 | Sim | — |
| RN-005 Toque | CT-040–048, CT-071 | Sim | — |
| RN-006 Lote | CT-050–061, CT-072 | Sim | — |
| RN-007 Elenco | CT-100–108 | Sim | — |
| RN-008 Poder e divisões | CT-110–116, CT-200 | Sim | — |
| RN-009 Partida e relógio de partida | CT-200–209, CT-219, CT-221–226 | Sim | — |
| RN-010 Split e título mundial | CT-210–220, CT-226, CT-230–233 | Sim | — |
| RN-011 Offline | CT-300–319, CT-330–335 | Sim | CT-333, CT-334 (QA-21), CT-335 (QA-23) |
| RN-012 Relógio | CT-320–329, CT-339, CT-013, CT-417 | Sim | — |
| RN-013 Refundação | CT-400–417, CT-024 | Sim (CT-413 na noturna) | — |
| RN-014 Legado | CT-420–422, CT-010, CT-111, CT-406–408 | Sim | — |
| RN-015 Save | CT-500–524, CT-540, CT-724 | Sim (CT-505 na noturna; CT-517 manual) | CT-509 (QA-27a), CT-522 (QA-27b) |
| RN-016 Sem dinheiro real | CT-312, CT-620–624 | Sim | — |
| RN-017 Números | CT-600–616, CT-020, CT-070, CT-314 | Sim | CT-616 (QA-22) |
| RN-018 Capítulos | CT-710–726, CT-217, CT-311, CT-330 | Sim | CT-710 (ordem), CT-712 (Várzea), CT-720 (fala), CT-726 (QA-25); CT-716, CT-725 (QA-26) |
| RN-019 Nome do clube | CT-800–812, CT-410 | Sim | CT-802, CT-805 (QA-24); CT-809 (tamanho, QA-27a) |
| RN-020 Limites de texto | CT-820–825, CT-725 | Sim | CT-821 (QA-26) |
| ADR-002 C1–C10 (critério da NX-015) | CT-530–539 | Sim (CT-535 na main) | — |

**Cobertura:** 20 de 20 RN têm casos, e todas têm pelo menos um caso automatizável no PR que já não
depende de pedido aberto.

## Matriz história × casos (Gherkin e critérios do backlog)

| História | Cenário / critério | Caso |
|---|---|---|
| NX-010 | Comprar o primeiro negócio | CT-070 |
| NX-010 | Toque limitado | CT-043 / CT-071 |
| NX-010 | Compra Máx sem ouro suficiente | CT-056, CT-057 / CT-072 |
| NX-011 | Subir nível | CT-103 |
| NX-012 | Chance mostrada antes da partida | CT-202 |
| NX-012 | Subir de divisão (prêmio com a renda de antes) | CT-211, CT-219 |
| NX-012 | Ninguém cai da Várzea | CT-212 |
| NX-013 | Volta depois de 10 horas | CT-306 (e CT-303, CT-307, CT-330) |
| NX-013 | Ausência curta | CT-318, CT-319 |
| NX-013 | Relógio atrasado | CT-320, CT-321 |
| NX-013 | Ciclo de adiantar e atrasar | CT-323 |
| NX-014 | Refundação indisponível | CT-400 |
| NX-014 | Refundar depois da Elite | CT-406, CT-409, CT-410 |
| NX-015 | Fechar o app no meio | CT-504 |
| NX-015 | Save corrompido | CT-506 |
| NX-015 | Nenhum save válido | CT-507, CT-519, CT-524 |
| NX-015 | Condições técnicas C1–C10 | CT-530–539 |
| NX-015 | Exportar/importar o save como texto | CT-520–523 |
| NX-016 | 1ª compra < 10 s / entende o elenco / 2º split em 5 min acelerados | CT-700, CT-701 / CT-702 / CT-703 |
| NX-017 | Prólogo | CT-710, CT-711 |
| NX-017 | Capítulo por divisão, 1ª chegada em qualquer run | CT-712, CT-713 |
| NX-017 | 1ª refundação | CT-719 |
| NX-017 | Epílogo no 1º título mundial | CT-720, CT-721 |
| NX-017 | Chegar de novo mostra só a fala de 1 linha | CT-714, CT-715, CT-716 |
| NX-017 | Pular conta como visto; reler na jornada | CT-717, CT-718 |
| NX-017 | Lido em menos de 1 min | CT-725 |
| NX-018 | Padrão Faísca eSports / FSC | CT-800 |
| NX-018 | Nome com até 20 caracteres | CT-801 |
| NX-018 | Sigla com 3 letras A–Z, sem repetir rival | CT-803, CT-804, CT-806 |
| NX-018 | `<script>` no nome mostra o texto literal | CT-807, CT-808 |

## Casos de borda pedidos na NX-006

| Borda | Casos |
|---|---|
| Limite exato do offline (8 h), 8 h ± 1 s, 320 partidas | CT-303, CT-304, CT-305, CT-334 |
| 0 s offline e limiar da tela (59/60 s) | CT-300, CT-319 |
| Resto do relógio de partida no offline | CT-301, CT-302, CT-317, CT-333 |
| Relógio adiantado / atrasado / ciclo | CT-322, CT-328 / CT-320, CT-321 / CT-323, CT-339 |
| Fuso alterado | CT-324, CT-325 |
| Fim de split durante o offline (subida, queda, manteve, título) | CT-306, CT-307, CT-309, CT-330, CT-331 |
| Comparação de dinheiro na fronteira (10⁻⁹) | CT-002, CT-006, CT-054, CT-061, CT-108, CT-615 |
| Compra Máx com k = 0 e ×10 sem ouro | CT-056, CT-057, CT-058 |
| Limite de 5 toques/s (janela móvel) | CT-043–048 |
| Divisão do topo e do fundo | CT-212, CT-214, CT-215, CT-231 |
| Refundação travada, liberada e durante a confirmação | CT-400–405, CT-414, CT-415 |
| Números acima de 1e15 e troca de faixa | CT-603, CT-605, CT-314, CT-059, CT-610, CT-613 |
| Save corrompido, migração e importação | CT-506–513, CT-519–524 |
| Entrada do jogador (nome e sigla) | CT-801–809 |

## Changelog v0.1 → v0.2

**Base:** RN v0.2 de 20/11/2026 (pedidos QA-1 a QA-19 decididos) e ADR-002 aprovado com C1–C10.

- **Desbloqueados:** CT-022 (acumulado, QA-15), CT-045 (janela móvel, QA-7), CT-057 e CT-058
  ("Faltam" para cima; ×10 desabilitado, QA-2 e QA-8), CT-200 e CT-202 (77%, QA-3), CT-219 (prêmio
  com a renda de antes, QA-6), CT-300 (tela a partir de 60 s, QA-12), CT-306 (Gherkin corrigido,
  QA-5), CT-316 (2º plano = offline, QA-10), CT-317 (resto do relógio, QA-9), CT-323 (ciclo
  mitigado, QA-11), CT-409 (ouro 10, QA-1), CT-603, CT-605 e CT-611 ("1,00 mil", "1,00e15" e 1 casa
  decimal, QA-13), CT-506 a CT-508 e CT-512 (save, QA-14), CT-700 (participante, QA-16), CT-717
  (pular = visto, QA-17).
- **Resultados recalculados:** exibição de todos os custos (para cima) e valores abaixo de 100 (1 casa
  decimal); CT-020, CT-030, CT-032, CT-070, CT-101, CT-102, CT-105 (poder "374 bi", não científica),
  CT-406; offline com o resto do relógio e splits seguidos (CT-301 a CT-309, CT-313, CT-315);
  relógio com `maior` (CT-320, CT-321: o atraso não vira novo ponto de partida, então 1 h depois ainda
  dá 0); prêmio com a renda de antes também na queda (CT-226).
- **Nomes finais** em todos os arquivos (divisões, "Aulas na lan", "Refundar o clube", "split",
  "Chegue à Ascensão").
- **Casos novos (saldo de +84, de 171 para 255):** tolerância de 10⁻⁹ (CT-006, CT-061, CT-108, CT-615); ouro inicial (CT-007);
  acumulado da run (CT-026, CT-027); relógio de partida e pausas (CT-221 a CT-225); título mundial
  (CT-230 a CT-233, CT-116); offline após título, queda, pausa na tela, ausência curta (CT-318,
  CT-319, CT-330 a CT-335); `maior` (CT-328, CT-329, CT-339, CT-417); refundação (CT-415 a CT-417);
  save: cópias alternadas, "Tentar de novo", exportar/importar, persistência (CT-518 a CT-524,
  CT-540); condições C1–C10 (CT-530 a CT-539); RN-017 para cima, porcentagem e ponto flutuante
  (CT-613 a CT-616); RN-018 (CT-710 a CT-726, reescritos); RN-019 e RN-020 (arquivo novo
  `clube-e-textos.md`, CT-800 a CT-825).
- **Removido:** o "marco de história na run" do CT-217 (os capítulos passaram a ser do jogador,
  RN-018); o caso volta como "chegada repetida".
- **Pedidos novos:** QA-20 a QA-27. 12 casos esperam decisão e outros 7 têm só uma parte
  pendente (coluna "Pendente de decisão" da matriz); nenhum deles é a única cobertura de uma RN.
