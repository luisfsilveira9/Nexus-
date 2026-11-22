#!/usr/bin/env node
// Nexus Idle — NX-005 — checagem de contraste WCAG 2.x da paleta de marca.
// Dono: nexus-arte. Sem dependências. Uso (na raiz do repositório):
//   node docs/arte/contraste.mjs          -> imprime a tabela em Markdown
//   node docs/arte/contraste.mjs --json   -> imprime os resultados em JSON
// Sai com código 1 se algum par ficar abaixo do mínimo, para poder entrar na pipeline do QA.
//
// Mínimos usados (WCAG 2.2, nível AA):
//   texto  -> 4,5:1 (texto normal; o jogo não usa a folga de 3:1 de "texto grande")
//   ui     -> 3:1   (ícones, bordas de foco, partes de gráfico, contorno de alvo; critério 1.4.11)
// Cores com transparência são compostas sobre o fundo antes da conta.

// ---- Paleta de marca (fonte: docs/arte/tokens-marca.md) ----
export const paleta = {
  'noite-950': '#0B1220', // fundo do app (azul noite do cais)
  'noite-900': '#141E33', // superfície (cards, linhas)
  'noite-800': '#1D2A45', // superfície alta (painéis, modais)
  'noite-700': '#2B3B5E', // trilho de progresso, desabilitado
  'noite-500': '#6B7FA8', // borda que separa alvos
  'nevoa-300': '#B4C0D8', // texto secundário
  'areia-50': '#F5F0E6', // texto principal (branco quente, papel de cartaz)
  'brasa-500': '#FF7A2F', // ação primária (laranja brasa)
  'brasa-600': '#E8611A', // ação primária pressionada
  'brasa-300': '#FFA06B', // brasa como texto sobre fundo escuro
  'farol-400': '#FFC83D', // ouro (luz do farol)
  'farol-200': '#FFE08A', // anel de foco
  'mare-400': '#4FD6C8', // Legado (maré)
  'vitoria-400': '#5BD38A',
  'derrota-400': '#FF7A8A',
  'ceu-300': '#8EC5FF', // info, equilibrado
  'ambar-300': '#F7B977', // azarão
  'aviso-300': '#FFD166',
  'perigo-400': '#FF5D5D',
  // Cores de identidade das divisões (emblema e chip; nunca sozinhas: sempre com forma e nome)
  'div-varzea': '#D39B68', // barro da quadra
  'div-acesso': '#9CCB5B', // grama do campo
  'div-ascensao': '#4DA8F0', // mar do cais
  'div-elite': '#B08CFF', // ametista
  'div-continental': '#CFD8E8', // prata
  'div-mundial': '#FFC83D', // luz do farol
  'desab-fundo': '#26324D', // fundo de botão desabilitado
  'desab-texto': '#C9D2E3', // texto de botão desabilitado
};

// ---- Pares usados nas telas: [token de texto/elemento, cor, token de fundo, cor de fundo, tipo, onde] ----
const P = paleta;
const fundos = {
  app: ['cor.fundo.app', P['noite-950']],
  sup: ['cor.fundo.superficie', P['noite-900']],
  alta: ['cor.fundo.superficie-alta', P['noite-800']],
};
const pares = [];
const emTodos = (tok, cor, tipo, onde) => {
  for (const f of Object.values(fundos)) pares.push([tok, cor, f[0], f[1], tipo, onde]);
};

// Texto sobre os três fundos
emTodos('cor.texto.principal', P['areia-50'], 'texto', 'Texto e números');
emTodos('cor.texto.secundario', P['nevoa-300'], 'texto', 'Legendas, apoio');
emTodos('cor.recurso.ouro', P['farol-400'], 'texto', 'Número e ícone de ouro');
emTodos('cor.recurso.legado', P['mare-400'], 'texto', 'Número e ícone de Legado');
emTodos('cor.resultado.vitoria', P['vitoria-400'], 'texto', 'Pílula V, "subiu"');
emTodos('cor.resultado.derrota', P['derrota-400'], 'texto', 'Pílula D, "caiu"');
emTodos('cor.resultado.neutro', P['nevoa-300'], 'texto', '"Manteve", casa vazia');
emTodos('cor.chance.favorito', P['vitoria-400'], 'texto', 'Rótulo "Favorito"');
emTodos('cor.chance.equilibrado', P['ceu-300'], 'texto', 'Rótulo "Equilibrado"');
emTodos('cor.chance.azarao', P['ambar-300'], 'texto', 'Rótulo "Azarão"');
emTodos('cor.estado.aviso', P['aviso-300'], 'texto', 'Save recuperado, relógio');
emTodos('cor.estado.info', P['ceu-300'], 'texto', 'Dicas');
emTodos('cor.estado.novidade', P['brasa-300'], 'texto', 'Ponto de novidade');
emTodos('cor.texto.destaque', P['brasa-300'], 'texto', 'Marca: "Acende, Faísca!", aba ativa');
pares.push(['cor.estado.perigo', P['perigo-400'], 'cor.fundo.superficie-alta', P['noite-800'], 'texto', 'Só na T10']);
pares.push(['cor.estado.perigo', P['perigo-400'], 'cor.fundo.app', P['noite-950'], 'texto', 'Só na T10']);

// Texto sobre botões
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.acao.primaria', P['brasa-500'], 'texto', 'Rótulo de Comprar/Subir/Receber']);
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.acao.primaria-pressionada', P['brasa-600'], 'texto', 'Rótulo pressionado']);
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.acao.toque', P['brasa-500'], 'texto', '"Fazer live", "+X por toque"']);
pares.push(['cor.texto.principal', P['areia-50'], 'cor.acao.secundaria', P['noite-800'], 'texto', 'Voltar, Cancelar, Agora não']);
pares.push(['cor.texto.sobre-desabilitada', P['desab-texto'], 'cor.acao.desabilitada', P['desab-fundo'], 'texto', '"Faltam X"']);
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.recurso.ouro (pílula)', P['farol-400'], 'texto', 'Chip "×2 renda" em destaque']);
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.estado.perigo (botão T10)', P['perigo-400'], 'texto', 'Botão "Refundar" na T10']);
// Pílulas V/D cheias (letra escura sobre a cor)
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.resultado.vitoria', P['vitoria-400'], 'texto', 'Casa V da trilha']);
pares.push(['cor.texto.sobre-acao', P['noite-950'], 'cor.resultado.derrota', P['derrota-400'], 'texto', 'Casa D da trilha']);
// Véu: texto principal de painel sobre superfície alta já coberto acima. Texto atrás do véu não precisa ser legível.

// Elementos não textuais (3:1)
const ui = (tok, cor, fTok, fCor, onde) => pares.push([tok, cor, fTok, fCor, 'ui', onde]);
ui('cor.borda.foco', P['farol-200'], 'cor.fundo.app', P['noite-950'], 'Anel de foco');
ui('cor.borda.foco', P['farol-200'], 'cor.fundo.superficie-alta', P['noite-800'], 'Anel de foco em painel');
ui('cor.borda.foco', P['farol-200'], 'cor.fundo.superficie', P['noite-900'], 'Anel de foco em card (sempre com 2 px de deslocamento: nunca encosta no laranja)');
ui('cor.borda.sutil', P['noite-500'], 'cor.fundo.app', P['noite-950'], 'Divisor que separa alvos');
ui('cor.borda.sutil', P['noite-500'], 'cor.fundo.superficie', P['noite-900'], 'Contorno de card tocável');
ui('cor.acao.primaria', P['brasa-500'], 'cor.fundo.app', P['noite-950'], 'Forma do botão principal');
ui('cor.acao.primaria', P['brasa-500'], 'cor.fundo.superficie', P['noite-900'], 'Botão Comprar dentro do card');
ui('cor.acao.secundaria (borda)', P['noite-500'], 'cor.fundo.superficie-alta', P['noite-800'], 'Contorno do botão secundário');
ui('cor.acao.desabilitada (borda)', P['noite-500'], 'cor.fundo.superficie', P['noite-900'], 'Contorno tracejado do desabilitado');
ui('cor.progresso.preenchido', P['brasa-500'], 'cor.progresso.trilho', P['noite-700'], 'Barra de progresso');
ui('cor.progresso.trilho', P['noite-700'], 'cor.fundo.app', P['noite-950'], 'Trilho visível (decorativo; número ao lado)');
ui('Ícone de função/negócio', P['areia-50'], 'cor.fundo.superficie', P['noite-900'], 'Ícones de linha');
for (const d of ['varzea', 'acesso', 'ascensao', 'elite', 'continental', 'mundial']) {
  ui(`cor.divisao.${d}`, P[`div-${d}`], 'cor.fundo.app', P['noite-950'], `Emblema e borda do chip (${d})`);
  ui(`cor.divisao.${d}`, P[`div-${d}`], 'cor.fundo.superficie-alta', P['noite-800'], `Emblema na trilha da T08 (${d})`);
  // O nome da divisão no chip é escrito em cor.texto.principal; a cor da divisão vai só na borda e no emblema.
}

// ---- Conta (WCAG 2.x, luminância relativa sRGB) ----
const hex = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
};
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const razao = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Ignorado: a borda.sutil é "≥ 3:1 se separar alvos"; o trilho é decorativo (sempre com número).
const minimo = (tipo) => (tipo === 'texto' ? 4.5 : 3);
const resultados = pares.map(([tok, cor, fTok, fCor, tipo, onde]) => {
  const r = razao(cor, fCor);
  const decorativo = tok === 'cor.progresso.trilho';
  const ok = decorativo || r >= minimo(tipo);
  return { tok, cor, fTok, fCor, tipo, onde, razao: r, minimo: decorativo ? null : minimo(tipo), ok };
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(resultados, null, 2));
} else {
  const f = (n) => n.toFixed(2).replace('.', ',');
  console.log('| Elemento (token) | Cor | Fundo (token) | Cor | Tipo | Razão | Mínimo | AA |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const r of resultados) {
    console.log(
      `| \`${r.tok}\` | \`${r.cor}\` | \`${r.fTok}\` | \`${r.fCor}\` | ${r.tipo} | ${f(r.razao)}:1 | ${
        r.minimo ? f(r.minimo) + ':1' : 'decorativo'
      } | ${r.ok ? 'passa' : '**FALHA**'} |`,
    );
  }
  const falhas = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length} pares conferidos, ${falhas} falha(s).`);
}
process.exitCode = resultados.some((r) => !r.ok) ? 1 : 0;
