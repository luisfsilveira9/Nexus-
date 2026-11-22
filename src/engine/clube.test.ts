// RN-019 v0.3.1: nome sem emoji (letras, números, espaço e - . ' &) e sigla A–Z (NX-015).
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
  caracterePermitidoNoNome,
  contarCaracteres,
  limparNomeColado,
  normalizarEspacos,
  validarNome,
  validarSigla,
} from './clube.ts';

const RIVAIS = ['ULD', 'VTX', 'DJD'];

describe('nome do clube', () => {
  test('exemplos válidos da RN-019 e do backlog', () => {
    for (const nome of [
      'Lowther eSports',
      'Los Grandes',
      'Pain Gaming',
      'Faísca eSports',
      'Ação & Cia.',
      "O'Brien-Smith",
      'Time 2026',
      'São João',
      'Ñandú',
    ])
      assert.deepEqual(validarNome(nome), { ok: true, nome }, nome);
  });

  test('emoji, símbolos, HTML, quebra de linha e controle são recusados', () => {
    for (const nome of [
      'Faísca 🔥',
      '🔥',
      '1️⃣ Time',
      'Time #1',
      '<script>alert(1)</script>',
      'Linha\nDois',
      'Tab\tTab',
      'Nul\u0000',
      'Time@',
      'A_B',
      'Zero​Largura',
      'Família 👨‍👩‍👧',
    ])
      assert.deepEqual(validarNome(nome), { ok: false, motivo: 'caractere' }, nome);
  });

  test('espaços: pontas removidas, seguidos viram um; só espaços é recusado', () => {
    assert.deepEqual(validarNome('  Los   Grandes  '), { ok: true, nome: 'Los Grandes' });
    assert.deepEqual(validarNome('     '), { ok: false, motivo: 'vazio' });
    assert.deepEqual(validarNome(''), { ok: false, motivo: 'vazio' });
    assert.equal(normalizarEspacos('  a  b '), 'a b');
  });

  test('1 a 20 caracteres, contados como o jogador vê', () => {
    assert.equal(validarNome('A'.repeat(20)).ok, true);
    assert.deepEqual(validarNome('A'.repeat(21)), { ok: false, motivo: 'longo' });
    // "í" decomposto (i + acento combinado) conta 1 e é guardado composto (NFC).
    const decomposto = 'Faísca'.repeat(3) + 'AB'; // 20 caracteres vistos
    assert.equal(contarCaracteres(decomposto), 20);
    const r = validarNome(decomposto);
    assert.ok(r.ok && r.nome === 'Faísca'.repeat(3) + 'AB');
  });

  test('o campo recusa o caractere proibido ao digitar', () => {
    assert.equal(caracterePermitidoNoNome('ç'), true);
    assert.equal(caracterePermitidoNoNome('&'), true);
    assert.equal(caracterePermitidoNoNome('🔥'), false);
    assert.equal(caracterePermitidoNoNome('<'), false);
    assert.equal(caracterePermitidoNoNome(''), false);
  });

  test('texto colado: remove proibidos e corta em 20, avisando cada caso', () => {
    assert.deepEqual(limparNomeColado('Faísca 🔥 eSports'), {
      texto: 'Faísca eSports',
      removeu: true,
      cortou: false,
    });
    assert.deepEqual(limparNomeColado('Clube Muito Comprido Demais'), {
      texto: 'Clube Muito Comprido',
      removeu: false,
      cortou: true,
    });
    assert.deepEqual(limparNomeColado('<b>Os Melhores do Bairro Todo</b>'), {
      texto: 'bOs Melhores do Bair',
      removeu: true,
      cortou: true,
    });
    assert.deepEqual(limparNomeColado('Los Grandes'), {
      texto: 'Los Grandes',
      removeu: false,
      cortou: false,
    });
  });

  test("QA-30: o apóstrofo tipográfico ’ vira ' antes de validar e ao colar", () => {
    assert.deepEqual(validarNome('O’Brien'), { ok: true, nome: "O'Brien" });
    assert.equal(caracterePermitidoNoNome('’'), true);
    assert.deepEqual(limparNomeColado('D’Ávila 🔥  Team’s Club Grande'), {
      texto: "D'Ávila Team's Club ",
      removeu: true,
      cortou: true,
    });
    assert.deepEqual(limparNomeColado('O’Brien'), {
      texto: "O'Brien",
      removeu: false,
      cortou: false,
    });
  });

  test('entrada que não é texto é recusada', () => {
    assert.equal(validarNome(42 as unknown as string).ok, false);
  });
});

describe('sigla do clube', () => {
  test('3 letras A–Z; minúsculas viram maiúsculas', () => {
    assert.deepEqual(validarSigla('FSC', RIVAIS), { ok: true, sigla: 'FSC' });
    assert.deepEqual(validarSigla('lwt', RIVAIS), { ok: true, sigla: 'LWT' });
    assert.deepEqual(validarSigla('LwT', RIVAIS), { ok: true, sigla: 'LWT' });
  });

  test('acento, ç e números são recusados, sem conversão', () => {
    for (const s of ['FSÇ', 'çab', 'ÁBC', 'F1C', 'F C', 'F-C'])
      assert.deepEqual(validarSigla(s, RIVAIS), { ok: false, motivo: 'caractere' }, s);
  });

  test('tamanho diferente de 3 e sigla de rival são recusados', () => {
    assert.deepEqual(validarSigla('FS', RIVAIS), { ok: false, motivo: 'tamanho' });
    assert.deepEqual(validarSigla('FSCX', RIVAIS), { ok: false, motivo: 'tamanho' });
    assert.deepEqual(validarSigla('', RIVAIS), { ok: false, motivo: 'tamanho' });
    assert.deepEqual(validarSigla('uld', RIVAIS), { ok: false, motivo: 'rival' });
    assert.deepEqual(validarSigla(7 as unknown as string, RIVAIS), {
      ok: false,
      motivo: 'caractere',
    });
  });
});
