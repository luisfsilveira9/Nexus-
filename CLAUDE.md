# Nexus Idle

Jogo mobile no estilo idle, ambientado no LoL competitivo. **Projeto do zero**, de fã, gratuito e sem
fins comerciais. O dono escreve em português e usa principalmente o celular.

Ainda não há código, stack nem site: tudo isso será decidido pelo time de agentes.

## Como o projeto é tocado

A sessão principal é o **PO** (`.claude/agents/nexus-po.md`) e orquestra os outros agentes. As regras
do time estão em `docs/produto/time-de-agentes.md`. Leia antes de qualquer trabalho.

| Agente | Papel |
|---|---|
| `nexus-po` | Product Owner: regras de negócio, backlog, decisões e aceite. Palavra final. |
| `nexus-arte` | Arte e identidade visual |
| `nexus-tech` | Arquitetura e código |
| `nexus-ux` | UI/UX |
| `nexus-qa` | Testes (segurança, regressão, usabilidade, integração, exploratórios) e pipeline |
| `nexus-lore` | Lore, histórias, textos, narrativas e temporadas |

**Toda decisão de produto, stack, visual, narrativa ou processo é tomada pelo time e registrada
pelo PO** em `docs/produto/decisoes/ADR-###-titulo.md`. Nada é presumido.

## Onde está cada coisa

- `docs/produto/`: visão, regras de negócio, backlog, pedidos entre áreas e decisões.
- `docs/arte/`, `docs/ux/`, `docs/lore/`, `docs/qa/`, `docs/tech/`: uma pasta por área.
- `docs/legado/`: conhecimento do projeto anterior (Nexus eSports Manager), só para consulta. Leia
  `docs/legado/README.md` antes de reaproveitar algo. O código completo do manager está na branch
  `legado-manager`.

## Jeito de trabalhar com o dono

- Um commit por bloco, um PR por etapa. PR em português; commit em inglês (imperativo + corpo
  explicando o porquê).
- **Merge automático (autorizado em 11/11/2026):** ao fim de cada etapa, abra o PR e faça o merge no
  `main`, depois de passar nas checagens que o time tiver definido. Se algo falhar, não faça o merge;
  avise.
- Respostas curtas, em português simples, com ressalvas e erros ditos com clareza.
- Nada no jogo custa dinheiro de verdade.
