# Simulador headless da economia (NX-007)

Implementa as RN-002 a RN-014 de `docs/produto/regras-de-negocio.md` (v0.1) e mede o tempo até cada
marco com jogadores simulados. Não depende de nenhum pacote: só Node 22 ou mais novo (o Node roda
os arquivos `.ts` direto).

## Rodar

```bash
node tools/sim-economia/sim.ts
```

Saída: tabelas em Markdown com a mediana de 20 jogadores (semente 1) nos perfis `continuo`, `tipico`
e `frequente`, para 7 dias. Leva uns 8 s.

Quando o projeto da stack existir (ADR-002), o mesmo comando vira `npm run sim:economia`.

### Opções

| Opção | Padrão | O que faz |
|---|---|---|
| `--dias N` | 7 | horizonte da simulação (30 dias leva ~35 s) |
| `--jogadores N` | 20 | jogadores simulados por perfil |
| `--semente N` | 1 | semente base (cada jogador recebe uma derivada dela) |
| `--perfil a,b` | `continuo,tipico,frequente` | perfis a rodar |
| `--legado rn\|inedita\|decrescente\|recorde` | `rn` | regra de Legado (propostas do risco 1) |
| `--offline rn\|atravessa\|ate-inedita\|ate-mudanca` | `rn` | regra das partidas offline (propostas do risco 3) |
| `--estrategia modelo\|farm` | `modelo` | `farm` refunda assim que chega à Academy |
| `--sem-prestigio` | | o bot nunca refunda |
| `--json` | | saída em JSON |

Exemplo: `node tools/sim-economia/sim.ts --dias 30 --perfil tipico --offline ate-mudanca`

## Testes

```bash
node --test tools/sim-economia/motor.test.ts
```

Cobrem os cenários Gherkin das NX-010 a NX-014 e a RN-017.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `motor.ts` | Regras RN-001 a RN-014 em funções puras (sem relógio, sem `Math.random`). Vai para `src/engine/` quando a stack existir. |
| `rng.ts` | Sorteio determinístico (mulberry32) com estado salvo no save (RN-009). |
| `formato.ts` | Números na tela (RN-017). |
| `estrategia.ts` | Como o jogador simulado compra e refunda. É uma cópia da estratégia do modelo do PO. **Não é regra de negócio.** |
| `perfis.ts` | Os perfis de sessão. |
| `sim.ts` | Roda os perfis e imprime as tabelas. |

## Perfis

- **continuo:** app aberto o tempo todo.
- **tipico:** dia 1 com 2 h seguidas e 3 h fora; depois, 5 × (3 min + 3 h fora) e 1 × (3 min + 8 h de sono).
  É igual ao do modelo do PO (cada "dia" tem 23 h 15 min).
- **frequente:** mesmo dia 1; depois, 15 × (3 min + 57 min fora) e 1 × (3 min + 8 h de sono): uma
  sessão por hora (cada "dia" tem 23 h 03 min).

O jogador simulado toca 5 vezes por segundo só nos primeiros 10 min de jogo, compra a cada 5 s com o
app aberto e ao voltar, e refunda depois de 3 temporadas seguidas sem divisão nova na run. Tudo isso
vem do modelo do PO.
