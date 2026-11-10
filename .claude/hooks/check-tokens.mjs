#!/usr/bin/env node
// PostToolUse: confere só o trecho recém-escrito em src/ contra as regras de tokens do CLAUDE.md
// (tamanhos de fonte da escala, cores por token, nomes antigos de cor). Problemas voltam ao Claude com exit 2.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const t = input.tool_input ?? {};
const file = t.file_path ?? '';
if (!/\/src\/.*\.(css|tsx)$/.test(file) || /\/src\/components\/ui\//.test(file)) process.exit(0);

const added = [t.new_string, t.content, ...(t.edits ?? []).map(e => e.new_string)].filter(Boolean).join('\n');
const lines = added.split('\n').filter(l => !/^\s*--[\w-]+\s*:/.test(l)); // definições de token no :root são permitidas

const rules = [
  [/font-size:\s*[0-9.]+px|font:\s*(?:[0-9]{3}\s+)?[0-9.]+px|fontSize:\s*[0-9]/, 'tamanho de fonte em px: use var(--fs-xs|sm|md|lg|xl|2xl) (12/14/16/18/22/30)'],
  [/#[0-9a-fA-F]{3,8}\b/, 'cor hex solta: use um token (--side-*, --positive, --negative, --q-*, --gold-*, --text*, --surface*)'],
  [/var\(--(red|blue|good|me|muted)\)/, 'nome antigo de cor: --side-red/--side-blue só para lado; --positive/--negative para bom/ruim; --you; --text-muted'],
];
const problems = [];
for (const [re, msg] of rules) {
  const hit = lines.find(l => re.test(l));
  if (hit) problems.push(`- ${msg}\n    ${hit.trim().slice(0, 140)}`);
}
if (problems.length) {
  process.stderr.write(`Regras de tokens (CLAUDE.md) em ${file.split('/src/')[1] ? 'src/' + file.split('/src/')[1] : file}:\n${problems.join('\n')}\n`);
  process.exit(2);
}
