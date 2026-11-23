# Bugs — Nexus Idle

> Dono: `nexus-qa`. Um bug por linha da tabela e um bloco de detalhes por bug. Severidade: **Crítica**
> (perde progresso, trava, dinheiro real) · **Alta** (regra de negócio errada, fluxo principal
> quebrado) · **Média** (funciona com contorno, atrapalha o jogador) · **Baixa** (estético, texto).
> Status: Aberto · Em correção · Corrigido (aguarda reteste) · Fechado · Não é bug.

| ID | Severidade | Título | História | Status |
|---|---|---|---|---|
| BUG-001 | Média | A fala do Renatão na T03 cobre o botão "Comprar" do 1º negócio e engole o toque por 3 s | NX-010 | Corrigido (aguarda reteste) |

## BUG-001 — A fala do Renatão cobre o botão de compra do 1º negócio

- **Severidade:** Média. Não perde ouro nem compra errado, mas o toque do jogador no "Comprar" não faz
  nada durante 3 s (ou fecha a fala no lugar de comprar), logo no momento em que ele quer comprar.
- **História / RN:** NX-010 (fluxo "negócio aparece"), RN-003. Wireframe T03, figura 2 (`.aviso` em
  `top: 56px`, logo abaixo do cabeçalho de 48 px).
- **Onde foi visto:** build da NX-010 ainda em andamento (22/11/2026, antes da entrega), perfis
  `360x640`, `360x700`, `pixel` e `iphone` (Chromium).
- **Passos:**
  1. Save com 74 de ouro ganho na run e "Patrocínio local" ainda oculto.
  2. Na T02, tocar em "Fazer live" (ganho na run chega a 75; o Patrocínio aparece e o Renatão fala).
  3. Abrir a aba Negócios em menos de 3 s e tocar em "Comprar" de "Aulas na lan".
- **Esperado:** a compra acontece (a fala não cobre nenhum alvo de toque).
- **Obtido:** o toque cai na fala (`anuncio-negocio`), que está por cima do botão
  `negocio-aulas-na-lan-comprar`; nada é comprado.
- **Evidência:** `tests/e2e/negocios.spec.ts`, teste "CT-023 ...": o Playwright acusa
  `<div role="status" data-testid="anuncio-negocio"> intercepts pointer events` ao tocar em
  `negocio-aulas-na-lan-comprar`. Também explicava falhas intermitentes no CT-032 e no CT-022 quando a
  renda fazia o Patrocínio aparecer no meio do teste.
- **Encaminhamento:** o tech já mudou a fala para cima do cabeçalho (`top` 4 px, sem botão) e ela
  fecha com um toque; a posição final é do UX (pedido **T-07 (a)**). Reteste quando a NX-010 for
  entregue: o CT-023 hoje espera a fala sumir antes de tocar; depois da correção confirmada, o QA
  acrescenta um caso que toca no "Comprar" com a fala na tela.
