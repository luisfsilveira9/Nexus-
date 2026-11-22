// Gera src/ui/tokens/tokens.css a partir de docs/ux/tokens.md (nomes e escalas, nexus-ux) e
// docs/arte/tokens-marca.md (valores de marca, nexus-arte). NX-015.
// Uso: node tools/gerar-tokens.ts          (grava o arquivo)
//      node tools/gerar-tokens.ts --check  (falha se o arquivo estiver desatualizado)
// Regra de nome (tokens-marca.md): `cor.texto.principal` → `--cor-texto-principal`.
// Lê toda linha de tabela "| `token.nome` | valor | …". Valor entre crases é usado como está; número
// vira px (espaço, toque, barra, ilustração), ms (duração) ou rem (tipografia). Os valores de marca
// ganham dos do UX. Linhas sem valor (ex.: "Valores [ARTE]") são ignoradas.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const ARQ_UX = 'docs/ux/tokens.md';
const ARQ_ARTE = 'docs/arte/tokens-marca.md';
const SAIDA = 'src/ui/tokens/tokens.css';

const PESOS: Record<string, number> = { Normal: 400, Seminegrito: 600, Negrito: 700 };
const NOME = /^[a-z]+(?:\.[a-z0-9-]+)+$/;

type Tokens = Map<string, string>;

const px = (n: string) => `${Number(n.replace(',', '.'))}px`;
const rem = (n: number) => `${n / 16}rem`;
const variavel = (nome: string) => `--${nome.replaceAll('.', '-')}`;

/** Lê as tabelas de um arquivo de tokens e devolve nome → valor CSS. */
export function lerTokens(md: string): Tokens {
  const t: Tokens = new Map();
  for (const linha of md.split('\n')) {
    const m = /^\|\s*`([^`]+)`(?:\s*\([^)]*\))?\s*\|([^|]*)\|([^|]*)/.exec(linha);
    if (!m) continue;
    const [, nome, c2raw, c3raw] = m;
    if (!NOME.test(nome)) continue;
    const c2 = c2raw.trim();
    const c3 = c3raw.trim();
    const crase = /^`([^`]+)`/.exec(c2);
    const tipo = /^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/.exec(c2);
    const num = /^(\d+(?:[.,]\d+)?)(?:\s*px)?\b/.exec(c2);
    if (crase) {
      t.set(nome, crase[1]);
    } else if (tipo && nome.startsWith('texto.')) {
      t.set(`${nome}.tamanho`, rem(Number(tipo[1])));
      t.set(`${nome}.altura`, rem(Number(tipo[2])));
      const peso = PESOS[c3];
      if (peso) t.set(`${nome}.peso`, String(peso));
    } else if (nome.startsWith('duracao.') && num) {
      t.set(nome, `${num[1]}ms`);
    } else if (c2.startsWith('env(')) {
      t.set(nome, c2);
    } else if (num && /^(espaco|toque|barra|ilustracao)\./.test(nome)) {
      t.set(nome, px(num[1]));
    }
  }
  // Camadas (z) vêm numa linha corrida: "`camada.base` 0 · `camada.fixa` 10 …".
  for (const m of md.matchAll(/`(camada\.[a-z]+)`\s+(\d+)/g)) t.set(m[1], m[2]);
  return t;
}

export function gerarCss(ux: string, arte: string): string {
  const tokens: Tokens = new Map([...lerTokens(ux), ...lerTokens(arte)]);
  // fonte.numero = fonte.texto com algarismos tabulares (tokens-marca.md §5).
  if (tokens.has('fonte.texto')) tokens.set('fonte.numero', 'var(--fonte-texto)');
  // texto.numero.* usa Inter 800, nunca Archivo Black (tokens-marca.md §5).
  for (const n of ['texto.numero.heroi', 'texto.numero.grande'])
    if (tokens.has(`${n}.peso`)) tokens.set(`${n}.peso`, '800');
  const grupos = new Map<string, string[]>();
  for (const [nome, valor] of [...tokens].sort(([a], [b]) => a.localeCompare(b))) {
    const g = nome.split('.')[0];
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g)!.push(`  ${variavel(nome)}: ${valor};`);
  }
  const corpo = [...grupos].map(([g, ls]) => `  /* ${g} */\n${ls.join('\n')}`).join('\n\n');
  return [
    '/* GERADO por tools/gerar-tokens.ts (npm run gerar:tokens). Não edite à mão.',
    ` * Fontes: ${ARQ_UX} (nomes e escalas, nexus-ux) e ${ARQ_ARTE} (valores, nexus-arte).`,
    ' * Componente usa só token semântico (docs/ux/tokens.md). */',
    ':root {',
    corpo,
    '}',
    '',
  ].join('\n');
}

function main() {
  const css = gerarCss(readFileSync(raiz + ARQ_UX, 'utf8'), readFileSync(raiz + ARQ_ARTE, 'utf8'));
  if (process.argv.includes('--check')) {
    let atual = '';
    try {
      atual = readFileSync(raiz + SAIDA, 'utf8');
    } catch {
      /* não existe */
    }
    if (atual !== css) {
      console.error(`${SAIDA} desatualizado: rode npm run gerar:tokens`);
      process.exit(1);
    }
    console.log(`${SAIDA} em dia.`);
    return;
  }
  writeFileSync(raiz + SAIDA, css);
  console.log(
    `${SAIDA} gerado (${css.split('\n').filter((l) => l.includes('--')).length} tokens).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
