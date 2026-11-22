# Simulador headless da economia (NX-007, NX-008, NX-015)

Mede o tempo até cada marco com jogadores simulados, usando **o mesmo motor do jogo**
(`src/engine/`, RN v0.3.1). Desde a NX-015 o motor, as constantes (`regras.ts`), o sorteio (`rng.ts`)
e a formatação (`formato.ts`) moram em `src/engine/`; aqui ficam só o bot, os perfis e a saída.

## Rodar

```bash
npm run sim:economia                       # 7 dias, 20 jogadores por perfil (~10 s)
npm run sim:economia -- --dias 30 --estrategia titulo   # fim de jogo (~1 min)
```

Saída: tabelas em Markdown com a mediana de 20 jogadores (semente 1) nos perfis `continuo`, `tipico`
e `frequente`. Também roda com `node tools/sim-economia/sim.ts` (Node 22.18+, sem build).

### Opções

| Opção | Padrão | O que faz |
|---|---|---|
| `--dias N` | 7 | horizonte da simulação |
| `--jogadores N` | 20 | jogadores simulados por perfil |
| `--semente N` | 1 | semente base (cada jogador recebe uma derivada dela) |
| `--perfil a,b` | `continuo,tipico,frequente` | perfis a rodar |
| `--estrategia modelo\|titulo\|farm` | `modelo` | `modelo` = bot do modelo do PO; `titulo` = igual, mas também sobe níveis no Mundial (mede o 1º título); `farm` = refunda assim que chega à Ascensão |
| `--sem-refundacao` | | o bot nunca refunda |
| `--json` | | saída em JSON (usada por `tests/ci/comparar-economia.js`) |
| `--bot-ve-tudo` | | o bot também considera negócios invisíveis (só para medir a RN-003) |
| `--desvio-off N` | 0 | soma N segundos a cada período fora (sensibilidade) |

As opções `--offline v01` e `--relogio v01` (comparação com as RN v0.1) saíram na NX-015, junto com
o bloco "Variantes" do motor.

## Testes

Os testes do motor estão em `src/engine/*.test.ts` (Vitest): `npm run test:unit`.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `estrategia.ts` | Como o jogador simulado compra e refunda. Cópia da estratégia do modelo do PO, restrita aos negócios visíveis. **Não é regra de negócio.** |
| `perfis.ts` | Os perfis de sessão. |
| `sim.ts` | Roda os perfis e imprime as tabelas. |

## Perfis

- **continuo:** app aberto o tempo todo.
- **tipico:** dia 1 com 2 h seguidas e 3 h fora; depois, 5 × (3 min + 3 h fora) e 1 × (3 min + 8 h de sono).
- **frequente:** mesmo dia 1; depois, 15 × (3 min + 57 min fora) e 1 × (3 min + 8 h de sono).

O jogador simulado toca 5 vezes por segundo só nos primeiros 10 min de jogo, compra a cada 5 s com o
app aberto e ao voltar, e refunda depois de 3 splits seguidos sem divisão nova na run. As telas que
pausam o relógio de partida (RN-009) duram 0 s no simulador.
