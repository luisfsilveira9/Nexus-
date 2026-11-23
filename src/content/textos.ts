// Dono: nexus-lore. Textos pt-BR das telas da NX-015, com chaves estáveis (ADR-002).
// Criado pelo nexus-tech na NX-015 a partir de docs/ux/fluxos/NX-015.md, dos wireframes T00/T12 e
// T02 e de docs/lore/nomes-do-jogo.md. Revisado pelo lore na NX-025 (pedido T-02): registro e
// contagem de caracteres em docs/lore/textos-mvp.md, seção "T00 · T12 · A05".
// Componentes nunca têm texto escrito à mão: tudo vem daqui.

export const textos = {
  jogo: {
    nome: 'Nexus Idle',
  },
  carregando: {
    titulo: 'Carregando o clube…',
    demorado: 'Ainda carregando…',
  },
  recuperado: {
    titulo: 'Recuperamos seu clube',
    /**
     * {quando} = quando a cópia carregada foi salva ("hoje às 14:32"). O wireframe traz também
     * "(10 s antes)", mas o horário da cópia ilegível não pode ser lido; ver pedido T-02.
     */
    corpo: 'Não deu para ler o último save. Carregamos a cópia anterior, de {quando}.',
    perda: 'O que aconteceu depois disso pode ter se perdido. O resto está aqui.',
    continuar: 'Continuar',
  },
  ilegivel: {
    titulo: 'Não conseguimos abrir seu save',
    corpo:
      'As duas cópias do save não puderam ser lidas. Nada foi apagado. Tente de novo ou comece um clube novo.',
    apoio: 'O save que não abriu fica guardado para exportar.',
    tituloDeNovo: 'Ainda não abriu',
    /** {n} = número da tentativa (2, 3…). */
    corpoDeNovo:
      'Tentamos de novo ({n}ª vez) e o save ainda não abriu. Nada foi apagado. Para pedir ajuda, exporte esse save.',
    /** T12b quando a cópia é de uma versão mais nova do jogo (CT-511, `versaoFutura`). */
    tituloVersaoNova: 'Seu save é de uma versão mais nova',
    corpoVersaoNova:
      'Este aparelho abriu uma versão antiga do jogo. Nada foi apagado. Feche o jogo e abra de novo para atualizar.',
    apoioVersaoNova: 'Seu clube continua guardado. Ele abre quando o jogo atualizar.',
    tentarDeNovo: 'Tentar de novo',
    comecarNovo: 'Começar clube novo',
    exportar: 'Exportar o save que não abriu',
    exportarRotulo: 'Texto do save que não abriu',
    fecharExportar: 'Fechar',
  },
  confirmarNovo: {
    titulo: 'Começar um clube novo?',
    /** {ouro} = ouro inicial (RN-001); {legado} = Legado de um clube novo. */
    corpo: 'Você começa na Várzea, com {ouro} de ouro e Legado {legado}.',
    apoio: 'O save que não abriu continua guardado. Dá para exportá-lo depois em Ajustes.',
    cancelar: 'Cancelar',
    confirmar: 'Começar clube novo',
  },
  semEspaco: {
    /** {quando} = há quanto tempo foi o último save válido ("há 2 min"). */
    texto:
      'Sem espaço para salvar. Seu último save ({quando}) está seguro. Libere espaço no aparelho.',
    /** Sem espaço e ainda sem nenhum save válido (ex.: ao começar um clube novo na T12c). */
    textoSemSave: 'Sem espaço para salvar. Nada foi apagado. Libere espaço no aparelho.',
    /** A05 quando a gravação falha por outro motivo que não espaço. {quando} como em `texto`. */
    falha:
      'Não deu para salvar agora. Seu último save ({quando}) está seguro. Tentamos de novo em instantes.',
    falhaSemSave: 'Não deu para salvar agora. Nada foi apagado. Tentamos de novo em instantes.',
    fechar: 'Fechar aviso',
  },
  /** Aviso de armazenamento não persistente (CT-540; `navigator.storage.persist()` recusado). */
  armazenamento: {
    naoPersistenteTitulo: 'O navegador pode apagar seu save',
    naoPersistenteApoio:
      'Pôr o jogo na tela inicial ajuda a protegê-lo. Exportar uma cópia em Ajustes também ajuda.',
  },
  principal: {
    ouro: 'ouro',
    /** {valor} = renda por segundo já formatada (RN-017, para baixo). */
    renda: '+{valor}/s',
    fazerLive: 'Fazer live',
    /** {valor} = ouro por toque já formatado. */
    porToque: '+{valor} por toque',
    proximaCompra: 'Próxima compra',
    comprar: 'Comprar',
    /** {valor} = quanto falta, já formatado (para cima). */
    faltam: 'Faltam {valor}',
    /** {n} = unidades compradas; {renda} = renda de cada uma. */
    tem: 'tem {n} · +{renda}/s cada',
  },
  negocios: [
    'Aulas na lan',
    'Patrocínio local',
    'Camisa oficial',
    'Canal do clube',
    'Festa da torcida',
    'Arena do clube',
  ],
  tempo: {
    hojeAs: 'hoje às {hora}',
    emData: '{data}, {hora}',
    agora: 'agora',
    haSegundos: 'há {n} s',
    haMinutos: 'há {n} min',
    haHoras: 'há {n} h',
  },
} as const;

/** Troca `{chave}` pelos valores (texto puro; o React escapa tudo ao exibir). */
export function preencher(modelo: string, valores: Record<string, string | number>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? `{${k}}`));
}
