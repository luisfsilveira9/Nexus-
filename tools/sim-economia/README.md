# Simulador headless da economia (NX-007, atualizado na NX-008)

Implementa as RN-001 a RN-014 de `docs/produto/regras-de-negocio.md` (**v0.2**) e mede o tempo até
cada marco com jogadores simulados. Não depende de nenhum pacote: só Node 22.18 ou mais novo (o Node
roda os arquivos `.ts` direto).

## Rodar

```bash
node tools/sim-economia/sim.ts
```

Saída: tabelas em Markdown com a mediana de 20 jogadores (semente 1) nos perfis `continuo`, `tipico`
e `frequente`, para 7 dias. Leva uns 9 s. Quando o projeto da stack existir (NX-015), o mesmo comando
vira `npm run sim:economia`.

### Opções

| Opção | Padrão | O que faz |
|---|---|---|
| `--dias N` | 7 | horizonte da simulação (30 dias leva ~40 s) |
| `--jogadores N` | 20 | jogadores simulados por perfil |
| `--semente N` | 1 | semente base (cada jogador recebe uma derivada dela) |
| `--perfil a,b` | `continuo,tipico,frequente` | perfis a rodar |
| `--estrategia modelo\|titulo\|farm` | `modelo` | `modelo` = bot do modelo do PO; `titulo` = igual, mas também sobe níveis no Mundial (para medir o 1º título); `farm` = refunda assim que chega à Ascensão |
| `--sem-refundacao` | | o bot nunca refunda |
| `--json` | | saída em JSON |

Opções só para comparação e sensibilidade (não são regras do jogo):

| Opção | Padrão | O que faz |
|---|---|---|
| `--offline rn\|v01` | `rn` | `v01` = partidas offline param no fim do split atual (RN-011 v0.1) |
| `--relogio rn\|v01` | `rn` | `v01` = relógio de partida volta a 90 s e o offline conta `floor(t_ef/90)` (v0.1) |
| `--bot-ve-tudo` | | o bot também considera negócios ainda invisíveis (como na NX-007) |
| `--desvio-off N` | 0 | soma N segundos a cada período fora (os perfis usam múltiplos de 90 s) |

`--relogio v01 --bot-ve-tudo` reproduz exatamente a medição da NX-007 com a R3.

Exemplo: `node tools/sim-economia/sim.ts --dias 30 --estrategia titulo`

## Testes

```bash
node --test tools/sim-economia/motor.test.ts
```

Cobrem os cenários Gherkin das NX-010 a NX-014 (backlog v0.2), a tolerância de 10⁻⁹, o toque em
janela móvel, o relógio de partida guardado, o ciclo de adiantar/atrasar o relógio e a RN-017.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `regras.ts` | **Todas as constantes das RN** num arquivo único (condição C4 do ADR-002). Vai para `src/engine/` na NX-015. |
| `motor.ts` | Regras RN-001 a RN-014 em funções puras (sem relógio, sem `Math.random`). Vai para `src/engine/` na NX-015, sem o bloco "Variantes". |
| `rng.ts` | Sorteio determinístico (mulberry32) com estado salvo no save (RN-009). |
| `formato.ts` | Números na tela (RN-017 v0.2): `formatar(v, 'baixo' \| 'cima')` e `formatarPct(p)`. |
| `estrategia.ts` | Como o jogador simulado compra e refunda. Cópia da estratégia do modelo do PO, restrita aos negócios visíveis. **Não é regra de negócio.** |
| `perfis.ts` | Os perfis de sessão. |
| `sim.ts` | Roda os perfis e imprime as tabelas. |

## Perfis

- **continuo:** app aberto o tempo todo.
- **tipico:** dia 1 com 2 h seguidas e 3 h fora; depois, 5 × (3 min + 3 h fora) e 1 × (3 min + 8 h de sono).
  É igual ao do modelo do PO (cada "dia" tem 23 h 15 min).
- **frequente:** mesmo dia 1; depois, 15 × (3 min + 57 min fora) e 1 × (3 min + 8 h de sono): uma
  sessão por hora (cada "dia" tem 23 h 03 min).

O jogador simulado toca 5 vezes por segundo só nos primeiros 10 min de jogo, compra a cada 5 s com o
app aberto e ao voltar, e refunda depois de 3 splits seguidos sem divisão nova na run. Tudo isso
vem do modelo do PO. As telas que pausam o relógio de partida (RN-009) duram 0 s no simulador.
