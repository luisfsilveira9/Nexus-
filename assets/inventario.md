# Inventário de assets — Nexus Idle

> Dono: `nexus-arte`. Toda arte que entra em `assets/` ganha uma linha aqui **antes** de ser usada.
> Atualizado em 20/11/2026 (NX-005). Guia: `docs/arte/guia-visual.md`.

## Resumo

- **58 arquivos SVG, todos originais**, criados neste projeto pelo `nexus-arte` com formas geométricas
  em código (à mão ou pelo gerador `docs/arte/gerar-chibi.py`). Nenhum foi traçado, copiado ou
  adaptado de imagem existente. Nenhum editor externo nem banco de imagens foi usado.
- **Riot Games:** nenhuma imagem, logo, ícone de rota, ícone de campeão, splash, fonte ou elemento de
  interface da Riot ou do LoL. Os ícones de função (Topo, Selva, Meio, Atirador, Suporte) são desenhos
  próprios (montanha, folha, losango, mira, escudo com coração) e **não** seguem a forma dos ícones
  oficiais de rota.
- **Times e marcas reais:** nenhum logo, escudo, cor-assinatura ou mascote de time, liga ou marca real.
  O escudo da Faísca (farol + faísca + ondas do cais) vem da bíblia da lore §5.
- **Personagens (diretriz chibi de 20/11/2026):** os 5 jogadores e a Dona Cel são **originais**, feitos
  a partir da personalidade descrita em `docs/lore/biblia.md` §6–7. Não copiam nem lembram personagens
  de anime, de jogos (inclusive campeões da Riot) ou mascotes de marcas. Os acessórios (bandana de
  padeiro, boné e celular de entregadora, capuz, óculos com topete de faísca, headset com pingente de
  bússola, coque com apito) saem da lore, não de referências externas.
- **Licença:** arte original do projeto, de fã, gratuito e sem fins comerciais (CLAUDE.md, ADR-001).
  Não há obrigação de atribuição a terceiros porque não há material de terceiros nos arquivos.
- **Raster:** nenhum PNG/WebP em `assets/`. Os PNGs do ícone do app são gerados pelo `nexus-tech` a
  partir de `app/*.svg` (lista em `guia-visual.md` §10) e herdam a origem do mestre. As capturas em
  `docs/arte/*.png` são imagens dos nossos próprios mockups.

## Terceiros usados pela identidade, mas fora de `assets/`

| Item | Autor | Licença | Onde entra | Observação |
|---|---|---|---|---|
| Fonte **Inter** | Rasmus Andersson e colaboradores | SIL Open Font License 1.1 | Build do jogo (via `@fontsource/inter`, a cargo do `nexus-tech`) | O texto da OFL vai junto no build |
| Fonte **Archivo Black** | Omnibus-Type | SIL Open Font License 1.1 | Build do jogo (via `@fontsource/archivo-black`) | Idem |

Nenhum arquivo de fonte foi copiado para o repositório nesta história.

## Lista de arquivos

| Arquivo | O que é | viewBox | Bytes | Origem | Como foi feito | Licença |
|---|---|---|---|---|---|---|
| `app/app_icone_maskable.svg` | Ícone do app (mestre) | 0 0 512 512 | 1236 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `app/app_icone_mono.svg` | Ícone do app (mestre) | 0 0 512 512 | 675 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `app/app_icone_padrao.svg` | Ícone do app (mestre) | 0 0 512 512 | 1247 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_acesso_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 364 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_ascensao_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 381 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_continental_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 672 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_elite_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 347 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_mundial_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 617 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `divisoes/divisao_varzea_emblema.svg` | Emblema de divisão (RN-008) | 0 0 48 48 | 486 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `funcoes/funcao_atirador_linha.svg` | Ícone de função (RN-007) | 0 0 24 24 | 344 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `funcoes/funcao_meio_linha.svg` | Ícone de função (RN-007) | 0 0 24 24 | 314 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `funcoes/funcao_selva_linha.svg` | Ícone de função (RN-007) | 0 0 24 24 | 256 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `funcoes/funcao_suporte_linha.svg` | Ícone de função (RN-007) | 0 0 24 24 | 389 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `funcoes/funcao_topo_linha.svg` | Ícone de função (RN-007) | 0 0 24 24 | 277 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/aba_clube_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 365 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/aba_elenco_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 349 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/aba_jornada_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 292 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/aba_negocios_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 274 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/botao_fazer-live_cor.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 136 136 | 749 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/botao_fazer-live_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 354 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/interface_ajustes_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 340 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `interface/interface_cadeado_linha.svg` | Interface (abas, ajustes, cadeado, botão de toque) | 0 0 24 24 | 301 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `jogadores/jogador_bussola_comemorando.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3756 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_bussola_feliz.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3693 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_bussola_focado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3809 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_bussola_frustrado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3880 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_fagulha_comemorando.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 2958 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_fagulha_feliz.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 2897 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_fagulha_focado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3011 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_fagulha_frustrado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3082 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_pedra_comemorando.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3046 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_pedra_feliz.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 2981 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_pedra_focado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3099 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_pedra_frustrado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3170 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_rastro_comemorando.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3426 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_rastro_feliz.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3363 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_rastro_focado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3479 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_rastro_frustrado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3550 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_vulto_comemorando.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3025 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_vulto_feliz.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 2964 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_vulto_focado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3078 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `jogadores/jogador_vulto_frustrado.svg` | Retrato chibi de jogador (RN-007, bíblia §6) | 0 0 120 120 | 3149 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `marca/escudo_faisca_mono.svg` | Escudo da Faísca eSports | 0 0 64 64 | 667 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `marca/escudo_faisca_padrao.svg` | Escudo da Faísca eSports | 0 0 64 64 | 998 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `mascote/mascote_dona-cel_comemorando.svg` | Mascote chibi (proposta, bíblia §7) | 0 0 120 120 | 3445 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `mascote/mascote_dona-cel_feliz.svg` | Mascote chibi (proposta, bíblia §7) | 0 0 120 120 | 3382 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `mascote/mascote_dona-cel_focado.svg` | Mascote chibi (proposta, bíblia §7) | 0 0 120 120 | 3498 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `mascote/mascote_dona-cel_frustrado.svg` | Mascote chibi (proposta, bíblia §7) | 0 0 120 120 | 3569 | Original (`nexus-arte`, NX-005, 20/11/2026) | Gerado por `docs/arte/gerar-chibi.py` | Do projeto; sem terceiros |
| `negocios/negocio_arena-do-clube_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 302 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `negocios/negocio_aulas-na-lan_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 326 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `negocios/negocio_camisa-oficial_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 418 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `negocios/negocio_canal-do-clube_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 359 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `negocios/negocio_festa-da-torcida_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 506 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `negocios/negocio_patrocinio-local_linha.svg` | Ícone de negócio (RN-003) | 0 0 24 24 | 308 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `recursos/recurso_legado_cor.svg` | Recurso (RN-001) | 0 0 32 32 | 441 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `recursos/recurso_legado_linha.svg` | Recurso (RN-001) | 0 0 24 24 | 455 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `recursos/recurso_ouro_cor.svg` | Recurso (RN-001) | 0 0 32 32 | 457 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |
| `recursos/recurso_ouro_linha.svg` | Recurso (RN-001) | 0 0 24 24 | 336 | Original (`nexus-arte`, NX-005, 20/11/2026) | SVG escrito à mão | Do projeto; sem terceiros |

## Como adicionar um asset

1. Siga o nome `categoria_nome_variante.svg` e as regras de grade do guia (§4–6).
2. Se não for original, só entra com licença livre que permita uso no projeto (CC0, CC BY, OFL, MIT),
   com autor, link e licença nesta tabela. Material da Riot ou de times reais **não entra**.
3. Rode o QA visual: abra `docs/arte/folha-referencia-chibi.html` ou o mockup no Chrome em 360×640.
