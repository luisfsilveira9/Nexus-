---
name: calibrar-motor
description: Roda centenas de partidas simuladas do motor do Nexus e compara duração, abates, ganks, dragões, Barões e a taxa de vitória de quem pega os "primeiros" objetivos com as faixas-alvo do pro de 2026 (src/game/calibrate.ts). Use sempre que mudar src/game/match.ts, draft.ts, tactics.ts, core.ts ou os dados de data.ts, e antes de comitar qualquer mudança de balanceamento.
---

# Calibrar o motor de partidas

O motor (`src/game/match.ts`) é calibrado contra métricas reais de 2026 listadas em `TARGETS` (`src/game/calibrate.ts`), com fontes na pesquisa do Patch 26.1. Qualquer mudança em parâmetros de `CFG`, pesos de eventos, bônus de tática ou dados de campeões/jogadores pode tirar métricas da faixa.

## Rodar

Com o servidor do Vite no ar (veja a skill `rodar-nexus`, passo 1):

```bash
node .claude/skills/calibrar-motor/calibrar.cjs http://localhost:5173/ 500
```

- 500 partidas levam poucos segundos. Use 1000+ para decidir entre dois valores próximos, porque abaixo disso as porcentagens oscilam 2–4 pontos entre execuções.
- Para medir um confronto específico: terceiro argumento `timeA,timeB` com ids de `src/game/data.ts` (ex.: `furia,loud`). As faixas valem para a liga inteira (pares aleatórios); num par fixo é normal algumas métricas saírem delas.
- Sai com código 1 se alguma métrica ficar fora da faixa e imprime `✓`/`✗` por linha, mais a média da 1ª torre e quanto o time de OVR maior vence.

## Como ajustar

1. Rode **antes** de mexer, para ter a linha de base (as métricas oscilam; não confunda ruído com efeito).
2. Mude um parâmetro por vez em `CFG` (`match.ts`) e rode de novo.
3. Relações úteis:
   - Duração e desvio: `EV_P`, `PHASE_MULT`, `barCap`, `BARON_P`.
   - Abates: `KILL_K`, `KILL_EXTRA`, `kill` de cada evento em `EVENTS`.
   - Ganks por caçador e resultados: `JG_P`, `JG_START`/`JG_END`, os pesos `kill/flash/press/none/pun` do gank.
   - Vitória com objetivos e à frente aos 15: `GD_ROLL`, `TRAIL_MULT`, `buffBonus`.
4. Não mexa nas faixas de `TARGETS` para "passar": elas vêm de dados reais. Se uma faixa parecer errada, explique ao usuário com a fonte.

## Ressalva conhecida

A taxa de morte do caçador num gank (`pun`, ~7%) não tem meta em `TARGETS`; a pesquisa aponta ~15% como âncora antiga (LPL ~2015).
