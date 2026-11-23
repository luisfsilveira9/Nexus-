// Mede o peso da 1ª carga do build (NX-015; ADR-002 e ADR-003):
// - pacote inicial (HTML + JS + CSS que o index.html carrega), com gzip: limite < 2 MB (alvo 300 kB);
// - arte + fontes da 1ª carga: limite ≤ 150 kB. Fontes = woff2 do subconjunto latino (o que o pt-BR
//   baixa); arte = SVGs que a tela principal e a de carregamento usam, sem compressão.
// Uso: node tools/medir-peso.ts [dist] [--json]. Sai com erro se algum limite estourar.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const LIMITE_PACOTE_GZIP = 2 * 1024 * 1024;
export const ALVO_PACOTE_GZIP = 300 * 1024;
export const LIMITE_ARTE_FONTES = 150 * 1024;

/**
 * SVGs da 1ª carga: tela de carregamento (escudo) e T02 completa da NX-010 (src/ui/Principal.tsx,
 * icones.ts, TelaJogo.tsx). Os 6 emblemas e os 6 ícones de negócio entram todos porque o pacote os
 * embute (o Vite troca SVG pequeno por data URI no JS).
 */
export const ARTE_PRIMEIRA_CARGA = [
  'assets/marca/escudo_faisca_padrao.svg',
  'assets/interface/botao_fazer-live_cor.svg',
  'assets/recursos/recurso_ouro_cor.svg',
  'assets/jogadores/jogador_rastro_feliz.svg',
  'assets/divisoes/divisao_varzea_emblema.svg',
  'assets/divisoes/divisao_acesso_emblema.svg',
  'assets/divisoes/divisao_ascensao_emblema.svg',
  'assets/divisoes/divisao_elite_emblema.svg',
  'assets/divisoes/divisao_continental_emblema.svg',
  'assets/divisoes/divisao_mundial_emblema.svg',
  'assets/interface/aba_clube_linha.svg',
  'assets/interface/aba_negocios_linha.svg',
  'assets/interface/aba_elenco_linha.svg',
  'assets/interface/aba_jornada_linha.svg',
  'assets/negocios/negocio_aulas-na-lan_linha.svg',
  'assets/negocios/negocio_patrocinio-local_linha.svg',
  'assets/negocios/negocio_camisa-oficial_linha.svg',
  'assets/negocios/negocio_canal-do-clube_linha.svg',
  'assets/negocios/negocio_festa-da-torcida_linha.svg',
  'assets/negocios/negocio_arena-do-clube_linha.svg',
];

const kB = (n: number) => `${(n / 1024).toFixed(1).replace('.', ',')} kB`;

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

export function medir(dist: string) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="\.?\/?([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  const pacote = [{ arquivo: 'index.html', bruto: Buffer.byteLength(html) }].concat(
    refs.map((r) => ({ arquivo: r, bruto: statSync(join(dist, r)).size })),
  );
  const comGzip = pacote.map((p) => {
    const conteudo = readFileSync(join(dist, p.arquivo));
    return { ...p, gzip: gzipSync(conteudo, { level: 9 }).length };
  });
  const fontes = arquivos(dist)
    .filter((f) => /\.woff2$/.test(f) && /-latin-/.test(f) && !/-latin-ext-/.test(f))
    .map((f) => ({ arquivo: f.slice(dist.length + 1), bruto: statSync(f).size }));
  const arte = ARTE_PRIMEIRA_CARGA.map((f) => ({ arquivo: f, bruto: statSync(f).size }));
  const soma = (xs: { bruto: number }[]) => xs.reduce((s, x) => s + x.bruto, 0);
  const pacoteGzip = comGzip.reduce((s, x) => s + x.gzip, 0);
  const arteFontes = soma(fontes) + soma(arte);
  return {
    pacote: comGzip,
    pacoteBruto: soma(comGzip),
    pacoteGzip,
    fontes,
    arte,
    arteFontes,
    primeiraCargaTotal: pacoteGzip + arteFontes,
    ok: pacoteGzip < LIMITE_PACOTE_GZIP && arteFontes <= LIMITE_ARTE_FONTES,
  };
}

function main() {
  const dist = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'dist';
  const m = medir(dist);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(m, null, 2));
  } else {
    console.log('| Item | Bruto | gzip |\n|---|---|---|');
    for (const p of m.pacote) console.log(`| ${p.arquivo} | ${kB(p.bruto)} | ${kB(p.gzip)} |`);
    console.log(
      `| **Pacote inicial** (limite < 2 MB gzip; alvo 300 kB) | ${kB(m.pacoteBruto)} | **${kB(m.pacoteGzip)}** |`,
    );
    for (const f of m.fontes) console.log(`| fonte ${f.arquivo} | ${kB(f.bruto)} | (woff2) |`);
    for (const a of m.arte) console.log(`| arte ${a.arquivo} | ${kB(a.bruto)} | — |`);
    console.log(
      `| **Arte + fontes da 1ª carga** (limite ≤ 150 kB) | **${kB(m.arteFontes)}** | — |`,
    );
    console.log(
      `| **1ª carga total** (pacote gzip + arte + fontes) | — | **${kB(m.primeiraCargaTotal)}** |`,
    );
  }
  if (!m.ok) {
    console.error('ERRO: limite de peso estourado.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
