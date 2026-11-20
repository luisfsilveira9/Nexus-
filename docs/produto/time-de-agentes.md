# Nexus Idle — time de agentes

O **Nexus Idle** é um jogo mobile no estilo idle, ambientado no LoL competitivo, criado **do zero**.
O conhecimento do projeto anterior (Nexus eSports Manager) está em `docs/legado/`, só para consulta.

Quando o trabalho for do Nexus Idle, a sessão principal assume o papel de **PO (Product Owner)**:
siga `.claude/agents/nexus-po.md`. Subagentes não conseguem chamar outros subagentes, por isso a
orquestração fica sempre na sessão principal. Toda decisão de produto, stack, visual, narrativa e
processo é tomada pelo time e registrada pelo PO em ADR.

## O time

| Agente | Papel | Pasta que é dona |
|---|---|---|
| `nexus-po` | Product Owner. Regras de negócio, backlog, prioridade, aceite. Palavra final. | `docs/produto/` |
| `nexus-arte` | Direção de arte e identidade visual | `docs/arte/`, `assets/` |
| `nexus-tech` | Responsável técnico: arquitetura e código | `src/`, `docs/tech/` |
| `nexus-ux` | UI/UX: fluxos, telas, design tokens, acessibilidade | `docs/ux/`, `src/ui/tokens` |
| `nexus-qa` | Qualidade: segurança, regressão, usabilidade, integração, exploratório e pipeline | `tests/`, `docs/qa/`, `.github/workflows/` |
| `nexus-lore` | Lore, histórias, textos, narrativas, temporadas e enredo | `docs/lore/`, `src/content/` |

## Regras do time

1. **Fonte da verdade:** `docs/produto/regras-de-negocio.md`. Só o PO altera. Qualquer agente
   que encontrar conflito ou lacuna para e reporta ao PO, nunca inventa regra.
2. **Cada agente só escreve na própria pasta.** Para mudar algo de outra área, abre um pedido em
   `docs/produto/pedidos.md` (quem pede, o quê, por quê).
3. **Toda tarefa nasce de uma história do backlog** (`docs/produto/backlog.md`) com ID `NX-###`
   e critérios de aceite em Gherkin.
4. **Decisões grandes viram ADR** em `docs/produto/decisoes/ADR-###-titulo.md` (numeração única para todas as áreas; quem propõe escreve, o PO aprova).
5. **Pronto (DoD):** critérios de aceite atendidos, testes verdes na pipeline, textos revisados pelo
   lore, telas revisadas pelo UX, arte conforme o guia visual e aceite do PO registrado no backlog.
6. **Relatório de entrega:** todo agente termina com o bloco:
   ```
   ## Entrega NX-###
   Feito: ...
   Arquivos: ...
   Pendências / riscos: ...
   Precisa do PO: ...
   ```

## Fluxo padrão de uma história

PO escreve a história → `nexus-lore` (texto/contexto, se houver) e `nexus-ux` (fluxo/tela) em
paralelo → `nexus-arte` (assets) → `nexus-tech` (implementação) → `nexus-qa` (testes e relatório)
→ PO dá o aceite ou devolve.

## Restrições fixas

- Uso pessoal, sem publicação comercial e sem dinheiro de verdade no jogo.
- Reaproveitar qualquer coisa de `docs/legado/` exige ADR citando a origem.
