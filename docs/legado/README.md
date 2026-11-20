# Legado do Nexus eSports Manager (só consulta)

O Nexus Idle é um projeto do zero. Esta pasta guarda o **conhecimento** do projeto anterior, o
Nexus eSports Manager (manager de LoL do CBLOL 2026). Nada daqui é compilado nem faz parte do jogo.

Regras para os agentes:
- Consulte à vontade. Reaproveitar qualquer parte (ideia, número, dado ou código) é decisão do time,
  registrada pelo PO em `docs/produto/decisoes/` com a origem citada.
- Não edite esta pasta. O código completo do manager, com interface e build, está na branch
  `legado-manager`.
- Valores do LoL (regras do Patch 26.1, estatísticas do pro de 2026) são de 2026: confira antes de
  usar como verdade atual.

## O que tem aqui

| Pasta / arquivo | Conteúdo | Útil para |
|---|---|---|
| `referencia/motor.md` | Motor de partida por eventos e calibração contra 14 métricas do pro de 2026 | tech, PO (economia), QA |
| `referencia/modo-cartas.md` | Cartas, elos, PdL, pacotes, run, save versionado | PO (gacha, progressão), tech |
| `referencia/dados.md` | Dados de op.gg, os 363 jogadores e 20 times de 2026, imagens da Riot | tech, arte, lore |
| `referencia/arquitetura.md` | Como o manager foi organizado | tech |
| `referencia/sessoes-na-nuvem.md` | Teste de ponta a ponta, capturas e deploy nas sessões na nuvem | QA, tech |
| `pesquisa-ligas/` | Relatório do mundo do LoL 2026, OVR global, Elo; scripts e JSON de jogadores e pools | PO, tech, lore |
| `pesquisa-progressao/` | Criação de time e progressão por cartas, ritmo medido | PO |
| `pesquisa-uiux/` | Pesquisas de UI/UX: sistema visual, elenco, estatísticas, partida | UX, arte |
| `plano-roguelike.md` | Plano do modo roguelike com cartas (etapas 2 a 6) | PO |
| `historico.md` | O que foi feito em cada PR do manager | todos |
| `motor/` | Código TypeScript do motor e dos dados (`match.ts`, `draft.ts`, `calibrate.ts`, `cartas.ts`, `data.ts`…) | tech |
| `ui/tokens-e-estilos.css` | Tokens visuais Hextech e estilos do manager | arte, UX |
| `e2e/e2e.cjs` | Teste de ponta a ponta no Chromium de celular | QA |

## Lições que valem lembrar

- Jogar no celular em ~360×650–700 era o uso real; o teste de ponta a ponta rodava nesses tamanhos.
- Calibrar números de jogo contra dados reais, com um simulador sem interface, funcionou bem.
- Save versionado com migrações evitou perda de progresso.
- Cor de lado não é cor de significado; acessibilidade (contraste 4,5:1, toque de 44 px) foi regra.
