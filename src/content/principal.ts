// Dono: nexus-lore. Textos pt-BR da tela principal (T02, "Clube") e da barra de abas, NX-010.
// Criado pelo nexus-tech na NX-010 copiando, sem mudar, as frases de docs/ux/wireframes/
// T02-principal.html, docs/ux/fluxos/NX-010.md, docs/ux/tokens.md §5 e §9 e os nomes de
// docs/lore/nomes-do-jogo.md §1. Revisão do lore pedida em docs/produto/pedidos.md (T-06).
// Arquivo separado de textos.ts, que o lore revisa em paralelo (NX-025).

export const textosPrincipal = {
  ouro: 'Ouro',
  /** {valor} = renda por segundo já formatada (RN-017, para baixo). */
  renda: '+{valor}/s',

  /** Nome curto das divisões (RN-008; nomes-do-jogo.md §1). Limite: 12. */
  divisoes: ['Várzea', 'Acesso', 'Ascensão', 'Elite', 'Continental', 'Mundial'],
  /** Chip da divisão: {divisao} e {mult} (multiplicador de renda, "×2"). */
  divisao: '{divisao} · {mult} renda',
  /** Chip do Legado (só com Legado > 0). */
  legado: 'Legado {valor}',

  /** Card do split (RN-009, RN-010). A trilha, o número do split e o rival vêm na NX-012. */
  split: {
    titulo: 'Split',
    /** {v} vitórias, {d} derrotas, {p} partidas que faltam (tokens.md §9.2, tipo `placar`). */
    placar: '{v}V {d}D · faltam {p}',
    /** {tempo} = "m:ss" até a próxima partida. */
    proxima: 'Próxima partida em {tempo}',
    /** {pct} = P(vitória) da próxima partida, inteira (RN-017). */
    chance: 'Chance {pct}',
    /** Faixas do UX (tokens.md §5): ≥ 60%, 40–59%, < 40%. */
    favorito: 'Favorito',
    equilibrado: 'Equilibrado',
    azarao: 'Azarão',
  },

  /** Botão de toque (RN-005). */
  toque: {
    rotulo: 'Fazer live',
    /** {valor} = ouro por toque já formatado (para baixo). */
    porToque: '+{valor} por toque',
    /** Nome acessível (fluxo NX-010, Acessibilidade). */
    acessivel: 'Fazer live, ganha {valor} de ouro',
    /** "+X" que sobe do botão. */
    ganho: '+{valor}',
  },

  /** Retrato decorativo ao lado do "Fazer live" (ADR-003). */
  destaque: 'Rastro',

  abas: {
    rotulo: 'Navegação principal',
    clube: 'Clube',
    negocios: 'Negócios',
    elenco: 'Elenco',
    jornada: 'Jornada',
    /** Ponto de novidade (cor.estado.novidade + texto, nunca só cor). */
    novidade: '•',
    /** Leitor de tela da aba com novidade. */
    novidadeAcessivel: '{aba}, tem novidade',
  },
} as const;
