// Dono: nexus-lore. Textos pt-BR da NX-010 (aba Negócios, T03, e card "Próxima compra" da T02).
// Criado pelo nexus-tech na NX-010 copiando, sem mudar, as frases de docs/ux/fluxos/NX-010.md,
// docs/ux/wireframes/T02-principal.html e T03-negocios.html e os nomes e anúncios de
// docs/lore/nomes-do-jogo.md §3. Revisão do lore pedida em docs/produto/pedidos.md (T-06).
// Arquivo separado de textos.ts e rivais.ts, que o lore revisa em paralelo (NX-025).
// `{campo}` = número já formatado pela RN-017 (cada um vai num <span data-testid>, condição C6).

export const textosNegocios = {
  /** RN-003, na ordem da tabela (índice = número do negócio − 1). Limite: 16 (tokens.md §10). */
  nomes: [
    'Aulas na lan',
    'Patrocínio local',
    'Camisa oficial',
    'Canal do clube',
    'Festa da torcida',
    'Arena do clube',
  ],
  /** Fala do Renatão quando o negócio fica visível (nomes-do-jogo.md §3). Limite: 60. */
  anuncios: [
    'Direção, a molecada quer aula! Cobra barato, cobra sempre.',
    'Fechei com a padaria! Pão e patrocínio!',
    'A camisa esgotou na feira. Faz mais!',
    'A Rastro viralizou de novo. Vamos profissionalizar.',
    'Telão no cais, direção. Vai lotar.',
    'O galpão é nosso. Agora é arena.',
  ],
  /** {fala} = um dos `anuncios`. */
  anuncio: '“{fala}” — Renatão',

  /** T02, card "Próxima compra". */
  proxima: {
    rotulo: 'Próxima compra',
    /** {n} = unidades compradas; {renda} = renda/s de cada uma. */
    tem: 'tem {n} · +{renda}/s cada',
    comprar: 'Comprar',
  },

  /** T03 */
  tela: {
    titulo: 'Negócios',
    /** Cabeçalho: {ouro} em caixa e {renda} = renda/s no formato de `principal.renda` ("+0,5/s"). */
    resumo: '{ouro} · {renda}',
    /** Linha com n > 0: {n} unidades e {renda} = renda/s total do negócio. */
    linha: 'n {n} · +{renda}/s',
    /** Linha com n = 0: {renda} = renda/s de cada unidade. */
    linhaZero: 'n {n} · +{renda}/s cada',
    /** Apoio do ×10 desabilitado quando o Máx compraria algo (RN-006). */
    maxCompraria: ' · Máx compraria {k}',
    /** Marco de 50 atingido (RN-004), por 3 s. */
    dobrou: ' · dobrou!',
    /** RN-004: {feitos}/50 e {faltam} para o próximo marco. */
    marco: '{feitos}/50 · faltam {faltam} para ×2',
    novo: 'Novo',
    /** Enquanto houver negócio oculto (RN-003). */
    maisNegocios: 'Mais negócios aparecem conforme o clube junta ouro.',
  },

  /** Botão de compra (T02 e T03). */
  botao: {
    x1: 'Comprar ×1',
    x10: 'Comprar ×10',
    /** {k} = unidades que o Máx compra agora. */
    max: 'Máx ({k})',
    faltam: 'Faltam',
  },

  /** Seletor de lote fixo da T03 (RN-006). */
  lote: {
    rotulo: 'Quantidade por compra',
    x1: '×1',
    x10: '×10',
    max: 'Máx',
  },
} as const;
