// NX-015: prova que o lint barra relógio, sorteio global e DOM em src/engine/ (ADR-002) e testa as
// ferramentas de build (tokens e checagem do build do jogador, C3).
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, test } from 'vitest';
import { procurarDebug } from './checar-build-jogador.ts';
import { gerarCss, lerTokens } from './gerar-tokens.ts';

describe('lint: pureza do motor', () => {
  const eslint = new ESLint();
  const erros = async (codigo: string, arquivo: string) => {
    const [r] = await eslint.lintText(codigo, { filePath: arquivo });
    return r.messages.map((m) => m.ruleId);
  };

  test('barra Date, Math.random, performance, DOM, timers e imports proibidos no motor', async () => {
    const casos = [
      'export const t = Date.now();',
      'export const r = Math.random();',
      'export const p = performance.now();',
      'export const d = document.title;',
      'export const w = window.innerWidth;',
      'setTimeout(() => 0, 1);',
      'export const s = localStorage.getItem("x");',
      "import { useState } from 'react';\nexport const u = useState;",
      "import { textos } from '../content/textos.ts';\nexport const x = textos;",
    ];
    for (const c of casos) {
      const r = await erros(c, 'src/engine/x.ts');
      assert.ok(
        r.some((id) => /no-restricted-(globals|properties|imports)/.test(id ?? '')),
        `${c} → ${r.join(',')}`,
      );
    }
  });

  test('o mesmo código é permitido fora do motor', async () => {
    assert.deepEqual(await erros('export const t = Date.now();', 'src/app/x.ts'), []);
  });
});

describe('ferramentas', () => {
  test('gerar-tokens lê crases, px, ms, tipografia e camadas; a arte ganha do UX', () => {
    const ux = [
      '| `espaco.4` | 16 | x |',
      '| `cor.fundo.app` | Fundo das telas | — |',
      '| `texto.titulo` | 20 / 26 | Negrito | x |',
      '| `duracao.rapida` | 100 | x |',
      '| `area.segura.baixo` | env(safe-area-inset-bottom) | x |',
      '`camada.base` 0 · `camada.fixa` 10',
    ].join('\n');
    const arte = '| `cor.fundo.app` | `#0B1220` | |\n| `fonte.texto` | `"Inter", sans-serif` |';
    const t = lerTokens(ux);
    assert.equal(t.get('espaco.4'), '16px');
    assert.equal(t.has('cor.fundo.app'), false);
    assert.equal(t.get('texto.titulo.tamanho'), '1.25rem');
    assert.equal(t.get('texto.titulo.peso'), '700');
    assert.equal(t.get('camada.fixa'), '10');
    const css = gerarCss(ux, arte);
    assert.match(css, /--cor-fundo-app: #0B1220;/);
    assert.match(css, /--duracao-rapida: 100ms;/);
    assert.match(css, /--fonte-numero: var\(--fonte-texto\);/);
  });

  test('checar-build-jogador acha as marcas de debug e o arquivo de debug', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nx015-'));
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'assets', 'index.js'), 'console.log("ok")');
    assert.deepEqual(procurarDebug(dir), []);
    writeFileSync(join(dir, 'assets', 'x.js'), 'w.__nexusDebug=1;q.get("acelerar")');
    writeFileSync(join(dir, 'assets', 'debug-abc.js'), '');
    const achados = procurarDebug(dir).map((a) => a.marca);
    assert.deepEqual(achados.sort(), ['(nome do arquivo)', '__nexusDebug', 'acelerar'].sort());
  });
});
