// RN-015 v0.3: valores impossíveis num estado com checksum certo = save corrompido (CT-509).
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { type Estado, avancarOnline, novoEstado } from './motor.ts';
import { CAMPOS_ESTADO, validarEstado } from './validacao.ts';

const RIVAIS = ['ULD', 'VTX'];
const ok = novoEstado(1, 1_800_000_000);

describe('validarEstado', () => {
  test('estado novo e estado jogado são válidos', () => {
    assert.deepEqual(validarEstado(ok, RIVAIS), []);
    const jogado = avancarOnline({ ...ok, negocios: [30, 5, 0, 0, 0, 0] }, 900).estado;
    assert.deepEqual(validarEstado(jogado, RIVAIS), []);
    assert.deepEqual(Object.keys(ok), [...CAMPOS_ESTADO]);
  });

  const impossiveis: [string, Partial<Record<keyof Estado, unknown>>][] = [
    ['ouro −1', { ouro: -1 }],
    ['ouro NaN', { ouro: NaN }],
    ['ouro infinito', { ouro: Infinity }],
    ['ouro "1e999"', { ouro: '1e999' }],
    ['nível 0', { niveis: [0, 1, 1, 1, 1] }],
    ['nível 2,5', { niveis: [2.5, 1, 1, 1, 1] }],
    ['4 jogadores', { niveis: [1, 1, 1, 1] }],
    ['divisão 9', { div: 9, melhorDivRun: 9, melhorDivSempre: 9 }],
    ['divisão −1', { div: -1 }],
    ['n = 2,5', { negocios: [2.5, 0, 0, 0, 0, 0] }],
    ['n negativo', { negocios: [-1, 0, 0, 0, 0, 0] }],
    ['visibilidade não booleana', { visiveis: [1, 0, 0, 0, 0, 0] }],
    ['Legado −5', { legado: -5 }],
    ['Legado 2,5', { legado: 2.5 }],
    ['split com 14 partidas', { vitorias: 10, derrotas: 4 }],
    ['vitórias 14', { vitorias: 14 }],
    ['divisão acima da melhor da run', { div: 2, melhorDivRun: 1, melhorDivSempre: 2 }],
    ['melhor da run acima da melhor de sempre', { melhorDivRun: 3, melhorDivSempre: 2 }],
    ['relógio de partida 0', { proxPartida: 0 }],
    ['relógio de partida 91', { proxPartida: 91 }],
    ['rng negativo', { rng: -1 }],
    ['rng acima de 32 bits', { rng: 2 ** 32 }],
    ['maior negativo', { maior: -10 }],
    ['ouro total menor que o da run', { ouroRun: 100, ouroTotal: 50 }],
    ['refundações 1,5', { refundacoes: 1.5 }],
    ['títulos −1', { titulos: -1 }],
    ['estatística curta', { refundacoesPorDiv: [0, 0] }],
    ['capítulos não-texto', { capitulos: [1] }],
    ['6 toques', { toques: [1, 2, 3, 4, 5, 6] }],
    ['monotônico NaN', { monoMs: NaN }],
    ['nome com 500 caracteres', { clube: { nome: 'A'.repeat(500), sigla: 'FSC' } }],
    ['nome com emoji', { clube: { nome: 'Faísca 🔥', sigla: 'FSC' } }],
    ['nome com espaço na ponta', { clube: { nome: ' Faísca', sigla: 'FSC' } }],
    ['nome com <script>', { clube: { nome: '<script>', sigla: 'FSC' } }],
    ['sigla minúscula', { clube: { nome: 'Faísca', sigla: 'fsc' } }],
    ['sigla de rival', { clube: { nome: 'Faísca', sigla: 'VTX' } }],
    ['clube com campo a mais', { clube: { nome: 'Faísca', sigla: 'FSC', x: 1 } }],
    ['clube nulo', { clube: null }],
  ];
  for (const [nome, parcial] of impossiveis)
    test(`recusa: ${nome}`, () => {
      assert.notDeepEqual(validarEstado({ ...ok, ...parcial }, RIVAIS), [], nome);
    });

  test('campo faltando e campo a mais', () => {
    const { ouro: _, ...semOuro } = ok;
    assert.deepEqual(validarEstado(semOuro, RIVAIS), ['falta o campo ouro']);
    assert.deepEqual(validarEstado({ ...ok, trapaca: 1 }, RIVAIS), ['campo desconhecido trapaca']);
  });

  test('o que não é objeto', () => {
    for (const x of [null, 1, 'texto', [], undefined])
      assert.deepEqual(validarEstado(x), ['estado não é um objeto']);
  });
});
