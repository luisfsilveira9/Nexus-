#!/usr/bin/env node
// Nexus Idle — NX-006 — checagem de peso do build (ADR-002 "Orçamento", ADR-003 / P-ARTE-03).
// Dono: nexus-qa. Sem dependências. Uso (na raiz, depois de `npm run build`):
//   node tests/ci/checar-peso.js [pasta-do-build]      (padrão: dist)
//
// Mede o "pacote inicial": o index.html e tudo o que ele carrega direto (scripts, CSS, modulepreload
// e preload), em gzip nível 9.
//   - FALHA (sai com 1) se o pacote inicial chegar a 2 MB gzip (limite do ADR-002).
//   - AVISA se passar do alvo interno de 300 kB gzip (ADR-002).
//   - AVISA se arte + fontes da 1ª carga passarem de 150 kB sem compressão (P-ARTE-03). É uma
//     estimativa para cima: conta todas as fontes citadas no CSS inicial, mesmo os subconjuntos que o
//     navegador só baixa se a página usar aqueles caracteres.
// O resumo sai no terminal e, na CI, também em $GITHUB_STEP_SUMMARY.

import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMITE_INICIAL = 2 * 1024 * 1024;
const ALVO_INICIAL = 300 * 1024;
const LIMITE_ARTE_FONTES = 150 * 1024;

const pasta = resolve(process.argv[2] ?? 'dist');
const index = join(pasta, 'index.html');
if (!existsSync(index)) {
  console.error(`ERRO: ${relative(process.cwd(), index)} não existe. Rode o build antes.`);
  process.exit(1);
}

const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(1).replace('.', ',')} kB`;
const externo = (u) => /^(?:[a-z]+:)?\/\//i.test(u) || u.startsWith('data:');

/** Resolve um endereço do HTML/CSS para um arquivo dentro do build (aceita base `./` ou `/repo/`). */
function arquivoDe(url, baseDir) {
  const limpo = url.split(/[?#]/)[0];
  if (!limpo || externo(limpo)) return null;
  const tentativas = [];
  if (limpo.startsWith('/')) {
    // Base absoluta (ex.: /nexus-/assets/x.js): tenta tirar o 1º segmento e também usar como está.
    tentativas.push(join(pasta, limpo), join(pasta, limpo.split('/').slice(2).join('/')));
  } else {
    tentativas.push(join(baseDir, limpo));
  }
  for (const t of tentativas) {
    const n = normalize(t);
    if (n.startsWith(pasta) && existsSync(n) && statSync(n).isFile()) return n;
  }
  return null;
}

const html = readFileSync(index, 'utf8');
const iniciais = new Map([[index, 'html']]);
const naoAchados = [];
const externos = [];

const registra = (url, tipo, baseDir) => {
  if (externo(url)) {
    externos.push(url);
    return;
  }
  const f = arquivoDe(url, baseDir);
  if (f) iniciais.set(f, tipo);
  else naoAchados.push(url);
};

for (const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
  registra(m[1], 'js', pasta);
}
for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
  const tag = m[0];
  const rel = (tag.match(/\brel=["']([^"']+)["']/i) ?? [])[1] ?? '';
  const href = (tag.match(/\bhref=["']([^"']+)["']/i) ?? [])[1];
  if (!href) continue;
  if (/\b(stylesheet|modulepreload|preload)\b/i.test(rel)) {
    registra(href, /stylesheet/i.test(rel) || href.endsWith('.css') ? 'css' : 'js', pasta);
  }
}

// Arte e fontes citadas no CSS inicial e imagens do próprio HTML.
const arteFontes = new Map();
const ehArteOuFonte = (f) => /\.(woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg)$/i.test(f);
for (const [f, tipo] of iniciais) {
  if (tipo !== 'css') continue;
  const css = readFileSync(f, 'utf8');
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const alvo = arquivoDe(m[1], dirname(f));
    if (alvo && ehArteOuFonte(alvo)) arteFontes.set(alvo, statSync(alvo).size);
  }
}
for (const m of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
  const alvo = arquivoDe(m[1], pasta);
  if (alvo && ehArteOuFonte(alvo)) arteFontes.set(alvo, statSync(alvo).size);
}

const linhas = [];
let totalInicial = 0;
for (const [f, tipo] of iniciais) {
  const buf = readFileSync(f);
  const g = gz(buf);
  totalInicial += g;
  linhas.push(`| \`${relative(pasta, f)}\` | ${tipo} | ${kb(buf.length)} | ${kb(g)} |`);
}
const totalArte = [...arteFontes.values()].reduce((a, b) => a + b, 0);

function tudo(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tudo(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const totalDist = tudo(pasta).reduce((a, f) => a + statSync(f).size, 0);

const falhas = [];
const avisos = [];
if (totalInicial >= LIMITE_INICIAL) {
  falhas.push(
    `Pacote inicial com ${kb(totalInicial)} gzip: limite é ${kb(LIMITE_INICIAL)} (ADR-002).`,
  );
} else if (totalInicial > ALVO_INICIAL) {
  avisos.push(`Pacote inicial com ${kb(totalInicial)} gzip: acima do alvo de ${kb(ALVO_INICIAL)}.`);
}
if (totalArte > LIMITE_ARTE_FONTES) {
  avisos.push(
    `Arte + fontes da 1ª carga com ${kb(totalArte)} (estimativa para cima): orçamento de ` +
      `${kb(LIMITE_ARTE_FONTES)} (P-ARTE-03). Conferir com a arte e o tech.`,
  );
}
if (naoAchados.length)
  avisos.push(`Endereços do index.html não achados no build: ${naoAchados.join(', ')}`);
if (externos.length) {
  // C9: nenhum pedido de rede fora do próprio site.
  falhas.push(`O index.html carrega endereços externos (condição C9): ${externos.join(', ')}`);
}

const saida = [
  '## Peso do build',
  '',
  '| Arquivo do pacote inicial | Tipo | Tamanho | gzip |',
  '|---|---|---|---|',
  ...linhas,
  `| **Total inicial** | | | **${kb(totalInicial)}** |`,
  '',
  `- Arte + fontes da 1ª carga (sem compressão, estimativa): **${kb(totalArte)}** ` +
    `(${arteFontes.size} arquivos; orçamento ${kb(LIMITE_ARTE_FONTES)})`,
  `- Pasta \`${relative(process.cwd(), pasta) || '.'}\` inteira (sem compressão): ${kb(totalDist)}`,
  '',
  ...falhas.map((f) => `- **FALHA:** ${f}`),
  ...avisos.map((a) => `- Aviso: ${a}`),
  falhas.length ? '' : '- Resultado: **dentro do limite**.',
  '',
].join('\n');

console.log(saida);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, saida + '\n');
process.exit(falhas.length ? 1 : 0);
