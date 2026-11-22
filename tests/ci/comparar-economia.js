#!/usr/bin/env node
// Nexus Idle — NX-006 — compara a saída do simulador com a tabela de tempos das RN.
// Dono: nexus-qa. Sem dependências. Base: tests/ci/economia-base.json (copiada das RN v0.3.1;
// se o PO mudar a tabela, a base muda no mesmo PR).
// Uso (na raiz):
//   npm run --silent sim:economia -- --json --dias 30 --estrategia titulo > sim-tempos.json
//   npm run --silent sim:economia -- --json --dias 7 > sim-refundacoes.json
//   node tests/ci/comparar-economia.js --tempos sim-tempos.json --refundacoes sim-refundacoes.json
//        [--base tests/ci/economia-base.json] [--tolerancia 0.2]
//
// Falha (sai com 1) se algum marco de algum perfil ficar a mais de 20% (padrão) do valor das RN, ou
// se um perfil não chegar a um marco que a tabela diz que ele alcança. Marcos "mais de X" passam se a
// mediana for maior que X (ou se o perfil não chegou no horizonte simulado).

import { appendFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const pega = (k, pad) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : pad;
};

const base = JSON.parse(readFileSync(pega('base', 'tests/ci/economia-base.json'), 'utf8'));
const tol = Number(pega('tolerancia', String(base.tolerancia)));
const lerSim = (k) => {
  const f = pega(k, null);
  if (!f) throw new Error(`faltou --${k} <arquivo JSON do sim:economia>`);
  return Object.fromEntries(JSON.parse(readFileSync(f, 'utf8')).map((p) => [p.perfil, p]));
};
const sims = { tempos: lerSim('tempos'), refundacoes: lerSim('refundacoes') };

const tempo = (s) => {
  if (s === null || !Number.isFinite(s)) return 'não chegou';
  const h = s / 3600;
  const v = (x) => x.toFixed(1).replace('.', ',');
  return h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${v(h)} h` : `${v(h / 24)} d`;
};
const mostra = (v, unidade) => (unidade === 's' ? tempo(v) : String(v));

const linhas = [];
const falhas = [];
for (const m of base.marcos) {
  for (const [perfil, esperado] of Object.entries(m.perfis)) {
    const p = sims[m.execucao][perfil];
    if (!p) {
      falhas.push(`${m.marco} / ${perfil}: perfil ausente na saída do simulador.`);
      continue;
    }
    let obtido;
    let chegaram = '';
    if (m.chave) {
      const mk = p.marcos[m.chave];
      if (!mk) {
        falhas.push(`${m.marco} / ${perfil}: marco "${m.chave}" ausente na saída do simulador.`);
        continue;
      }
      // JSON.stringify(Infinity) vira null: o simulador grava "não chegou" assim.
      obtido = mk.mediana === null ? Infinity : mk.mediana;
      chegaram = ` (${mk.chegaram} chegaram)`;
    } else {
      obtido = p[m.campo];
    }

    let ok;
    let desvio;
    let esperadoTxt;
    if (typeof esperado === 'object' && 'acimaDe' in esperado) {
      ok = obtido > esperado.acimaDe;
      esperadoTxt = `mais de ${mostra(esperado.acimaDe, m.unidade)}`;
      desvio = '—';
    } else {
      const d = Number.isFinite(obtido) ? (obtido - esperado) / esperado : Infinity;
      ok = Math.abs(d) <= tol;
      esperadoTxt = mostra(esperado, m.unidade);
      desvio = Number.isFinite(d)
        ? `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1).replace('.', ',')}%`
        : '∞';
    }
    linhas.push(
      `| ${m.marco} | ${base.perfis[perfil] ?? perfil} | ${esperadoTxt} | ` +
        `${mostra(obtido, m.unidade)}${m.chave ? chegaram : ''} | ${desvio} | ${ok ? 'ok' : '**FALHA**'} |`,
    );
    if (!ok)
      falhas.push(
        `${m.marco} / ${base.perfis[perfil] ?? perfil}: esperado ${esperadoTxt}, obtido ${mostra(obtido, m.unidade)} (${desvio}).`,
      );
  }
}

const saida = [
  `## Economia: simulador × tabela das RN (tolerância ${Math.round(tol * 100)}%)`,
  '',
  `Base: ${base.fonte}.`,
  '',
  '| Marco | Perfil | RN | Simulador | Desvio | Gate |',
  '|---|---|---|---|---|---|',
  ...linhas,
  '',
  ...falhas.map((f) => `- **FALHA:** ${f}`),
  falhas.length ? '' : '- Resultado: **todos os marcos dentro da tolerância**.',
  '',
].join('\n');

console.log(saida);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, saida + '\n');
process.exit(falhas.length ? 1 : 0);
