# ADR-003 — Identidade visual e estilo chibi

- **Status:** Aprovada pelo PO em 22/11/2026 (aceite da NX-005)
- **Proposto por:** `nexus-arte` (NX-005), com diretriz do dono em 20/11/2026 ("estilo chibi")
- **Consultado:** `nexus-ux` (tokens e wireframes da NX-004/NX-009), `nexus-lore` (bíblia e nomes da
  NX-003), ADR-001 (universo fictício, sem imagens da Riot) e ADR-002 (PWA, sem CDN)

## Decisão

1. **Conceito "Acende, Faísca!":**
   - azul noite do cais como fundo;
   - laranja brasa como cor de ação;
   - amarelo do farol para o ouro;
   - turquesa para o Legado.

   O guia completo está em `docs/arte/guia-visual.md` e os valores dos tokens em
   `docs/arte/tokens-marca.md`.
2. **Estilo chibi** para todos os personagens:
   - cerca de 2,5 cabeças de altura e olhos grandes;
   - mãos e pés simplificados;
   - contorno de 3 px `#101828`;
   - sombra chapada de 1 tom;
   - 4 expressões: feliz, focado, comemorando e frustrado.

   Os ícones de interface continuam simples e geométricos, mas com o mesmo arredondamento e contorno.
3. **Elenco:** retratos chibi originais de Pedra, Rastro, Vulto, Fagulha e Bússola nas 4 expressões,
   reconhecíveis pela silhueta e pelo acessório (`docs/arte/folha-referencia-chibi.png`). Saem de
   um gerador versionado (`docs/arte/gerar-chibi.py`), para manter a coerência entre eles.
4. **Mascote:** a Dona Cel em chibi é a voz dos avisos do jogo: dicas, avisos de save e capítulos.
5. **Tipografia:** Inter (texto e números) e Archivo Black (títulos), ambas com licença OFL 1.1,
   empacotadas no build, sem CDN (condição C9 do ADR-002).
6. **Acessibilidade:** todo par texto/fundo passa no nível AA. Isso é medido por
   `node docs/arte/contraste.mjs`, que falha se algum par reprovar, e o QA põe essa checagem na
   pipeline. Divisões e raridades nunca são diferenciadas só por cor.
7. **Originalidade:** todos os assets são originais. Nada de imagens, logos ou ícones da Riot, de
   times reais, de personagens de anime ou jogos, nem de mascotes de marcas (`assets/inventario.md`).
8. **Orçamento de peso:**
   - arte da tela principal ≤ 40 kB sem compressão (hoje 15,7 kB);
   - arte + fontes da 1ª carga ≤ 150 kB (fontes a medir na NX-015).
9. **Fora do MVP:** as telas de abertura específicas do iOS. O ícone do app, nas versões maskable e
   monocromática, é suficiente.

## Consequências

- **UX:** o retrato chibi decorativo de um jogador à esquerda do "Fazer live" na tela principal fica
  aprovado, fora da área de toque e sem mudar alturas. Também ficam aprovados o avatar de 48 px no
  Elenco e a troca de expressão no aviso de vitória. O UX inclui os tokens novos da arte em
  `docs/ux/tokens.md` (P-ARTE-01).
- **Lore:** registra a aparência dos 5 jogadores e da Dona Cel na bíblia (§6).
- **Tech:** gera os PNGs do ícone do app e empacota as fontes na NX-015, e mede o peso real.
- **QA:** acrescenta `contraste.mjs` e a checagem de peso na pipeline.

## Alternativas descartadas

- **Visual Hextech do projeto anterior:** era de outro produto. O Nexus Idle começa do zero e a lore
  pede um começo humilde de bairro.
- **Ilustração realista ou semirrealista:** pesada para 360 px e mais cara de manter coerente.
- **Personagens só em ícone, sem rosto:** não atende à diretriz do dono e enfraquece o vínculo com o
  elenco.
