#!/usr/bin/env node
// Nexus Idle — NX-006 — gate de cobertura por pasta (QA-18, condição C7 do ADR-002).
// Dono: nexus-qa. Sem dependências. Lê o resumo do Vitest (reporter `json-summary`).
// Uso (na raiz, depois dos unitários com cobertura):
//   node tests/ci/checar-cobertura.js [--arquivo coverage/coverage-summary.json]
//        [--pastas src/engine,src/save] [--linhas 90] [--ramos 85]
//
// Falha (sai com 1) se alguma pasta ficar abaixo do mínimo de linhas ou de ramos, ou se uma pasta do
// gate não tiver nenhum arquivo no relatório (gate vazio = gate que não protege nada).
// É um gate independente da configuração do Vitest: mesmo que o limite mude lá, a CI continua
// cobrando os números aprovados pelo PO.

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const pega = (k, pad) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : pad;
};

const arquivo = resolve(pega('arquivo', 'coverage/coverage-summary.json'));
const pastas = pega('pastas', 'src/engine,src/save').split(',').filter(Boolean);
const minLinhas = Number(pega('linhas', '90'));
const minRamos = Number(pega('ramos', '85'));

if (!existsSync(arquivo)) {
  console.error(
    `ERRO: ${relative(process.cwd(), arquivo)} não existe. Os unitários precisam rodar com ` +
      '`--coverage.reporter=json-summary`.',
  );
  process.exit(1);
}

const resumo = JSON.parse(readFileSync(arquivo, 'utf8'));
const raiz = process.cwd();
const ehTeste = (f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f);

const pct = (c, t) => (t === 0 ? 100 : (100 * c) / t);
const fmt = (n) => n.toFixed(2).replace('.', ',');

const linhasTabela = [];
const falhas = [];
for (const pasta of pastas) {
  const prefixo = resolve(raiz, pasta) + sep;
  const soma = { lc: 0, lt: 0, bc: 0, bt: 0, arquivos: 0 };
  for (const [f, m] of Object.entries(resumo)) {
    if (f === 'total') continue;
    const abs = resolve(raiz, f);
    if (!abs.startsWith(prefixo) || ehTeste(abs)) continue;
    soma.arquivos++;
    soma.lc += m.lines.covered;
    soma.lt += m.lines.total;
    soma.bc += m.branches.covered;
    soma.bt += m.branches.total;
  }
  const l = pct(soma.lc, soma.lt);
  const b = pct(soma.bc, soma.bt);
  const ok = soma.arquivos > 0 && l >= minLinhas && b >= minRamos;
  linhasTabela.push(
    `| \`${pasta}/\` | ${soma.arquivos} | ${fmt(l)}% (${soma.lc}/${soma.lt}) | ` +
      `${fmt(b)}% (${soma.bc}/${soma.bt}) | ${ok ? 'ok' : '**FALHA**'} |`,
  );
  if (soma.arquivos === 0) falhas.push(`${pasta}/: nenhum arquivo no relatório de cobertura.`);
  if (l < minLinhas) falhas.push(`${pasta}/: linhas ${fmt(l)}% < ${minLinhas}%.`);
  if (b < minRamos) falhas.push(`${pasta}/: ramos ${fmt(b)}% < ${minRamos}%.`);
}

const saida = [
  `## Cobertura (gate: ${minLinhas}% linhas e ${minRamos}% ramos por pasta)`,
  '',
  '| Pasta | Arquivos | Linhas | Ramos | Gate |',
  '|---|---|---|---|---|',
  ...linhasTabela,
  '',
  ...falhas.map((f) => `- **FALHA:** ${f}`),
  falhas.length ? '' : '- Resultado: **gate atendido**.',
  '',
].join('\n');

console.log(saida);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, saida + '\n');
process.exit(falhas.length ? 1 : 0);
