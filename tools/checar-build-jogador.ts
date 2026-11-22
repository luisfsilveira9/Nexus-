// C3 do ADR-002: garante que o build do jogador NÃO tem tempo acelerado nem console de debug.
// Roda no fim de `npm run build` (falha o build se encontrar) e pode ser chamado à parte:
//   node tools/checar-build-jogador.ts dist
// Procura em todo arquivo de texto do build as marcas que só existem em src/app/debug.ts.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Textos que só aparecem no módulo de debug (src/app/debug.ts). */
export const MARCAS_DEBUG = ['__nexusDebug', 'acelerar', 'relogioDeTeste', 'instalarConsole'];

const TEXTO = /\.(js|mjs|css|html|webmanifest|json|txt)$/;

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

export function procurarDebug(dir: string): { arquivo: string; marca: string }[] {
  const achados: { arquivo: string; marca: string }[] = [];
  for (const arq of arquivos(dir)) {
    if (/debug/i.test(arq)) achados.push({ arquivo: arq, marca: '(nome do arquivo)' });
    if (!TEXTO.test(arq)) continue;
    const conteudo = readFileSync(arq, 'utf8');
    for (const marca of MARCAS_DEBUG)
      if (conteudo.includes(marca)) achados.push({ arquivo: arq, marca });
  }
  return achados;
}

function main() {
  const dir = process.argv[2] ?? 'dist';
  const achados = procurarDebug(dir);
  if (achados.length) {
    console.error('ERRO (C3): o build do jogador tem código de teste/debug:');
    for (const a of achados) console.error(`  ${a.arquivo}: ${a.marca}`);
    process.exit(1);
  }
  console.log(`C3 ok: nenhum tempo acelerado ou debug em ${dir}/.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
