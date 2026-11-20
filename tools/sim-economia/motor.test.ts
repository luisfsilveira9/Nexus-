// Testes unitários do motor (NX-007). Cada caso cita a RN ou o cenário Gherkin do backlog.
// Rodar: node --test tools/sim-economia/motor.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  type Estado,
  aplicarOffline,
  avancarOnline,
  comprarGeradores,
  custoGerador,
  custoLote,
  custoNivel,
  legadoDoPrestigio,
  maxLote,
  multLegadoPoder,
  multLegadoRenda,
  novoEstado,
  podePrestigiar,
  poderJogador,
  poderTime,
  prestigiar,
  pVitoria,
  renda,
  subirNivel,
  tocar,
} from './motor.ts';
import { sortear } from './rng.ts';
import { formatar } from './formato.ts';

const H = 3600;
const base = (parcial: Partial<Estado> = {}): Estado => ({ ...novoEstado(1, 0), ...parcial });
/** Estado do sorteio cujo próximo valor satisfaz `cond`. */
const rngQue = (cond: (u: number) => boolean) => {
  for (let s = 1; ; s++) if (cond(sortear(s)[0])) return s;
};

test('NX-010: comprar o primeiro gerador', () => {
  const e = comprarGeradores(base(), 0, 1)!;
  assert.equal(e.ouro, 0);
  assert.equal(renda(e), 0.5);
  assert.equal(formatar(custoGerador(e, 0)), '11'); // 11,5 arredondado para baixo
});

test('NX-010 / RN-005: toque limitado a 5 por segundo', () => {
  // 40 lives = 20/s; Legado 80 → ×5 → 100/s
  const e = base({ geradores: [40, 0, 0, 0, 0, 0], legado: 80, ouro: 0 });
  assert.equal(renda(e), 100);
  assert.equal(tocar(e, 8).ouro, 50);
  assert.equal(tocar(base({ ouro: 0 }), 3).ouro, 3); // mínimo 1 por toque
});

test('NX-010 / RN-006: Máx sem ouro suficiente é 0', () => {
  assert.equal(maxLote(base({ ouro: 9.99 }), 0), 0);
  assert.equal(comprarGeradores(base({ ouro: 9.99 }), 0, 1), null);
});

test('RN-006: custo do lote é a soma das compras unitárias, e Máx é o maior k', () => {
  const e = base({ geradores: [7, 0, 0, 0, 0, 0] });
  let soma = 0;
  for (let k = 0; k < 10; k++) soma += 10 * 1.15 ** (7 + k);
  assert.ok(Math.abs(custoLote(e, 0, 10) - soma) / soma < 1e-12);
  const comOuro = { ...e, ouro: soma };
  assert.equal(maxLote(comOuro, 0), 10);
});

test('RN-004: renda do gerador dobra a cada 50 unidades', () => {
  assert.equal(renda(base({ geradores: [49, 0, 0, 0, 0, 0] })), 24.5);
  assert.equal(renda(base({ geradores: [50, 0, 0, 0, 0, 0] })), 50);
  assert.equal(renda(base({ geradores: [100, 0, 0, 0, 0, 0] })), 200);
});

test('NX-011: subir nível', () => {
  const e = subirNivel(base({ ouro: 50 }), 2)!;
  assert.equal(e.niveis[2], 2);
  assert.equal(poderJogador(e.niveis[2]), 10.5);
  assert.equal(formatar(custoNivel(e, 2)), '61');
});

test('NX-012: chance mostrada antes da partida', () => {
  assert.equal(Math.round(pVitoria(72, 60) * 100), 77);
  assert.equal(pVitoria(60, 60), 0.5);
  assert.equal(Math.round(pVitoria(48, 60) * 100), 23);
  assert.equal(pVitoria(1e9, 60), 0.95);
  assert.equal(pVitoria(1, 60), 0.05);
});

test('NX-012: subir de divisão com a 14ª partida', () => {
  const forte = [200, 200, 200, 200, 200]; // p = 95%
  const e = base({ niveis: forte, vitorias: 9, derrotas: 4, proxPartida: 1, rng: rngQue((u) => u < 0.95) });
  const { estado, eventos } = avancarOnline(e, 1);
  assert.equal(estado.div, 1);
  assert.equal(estado.vitorias + estado.derrotas, 0);
  assert.ok(eventos.some((x) => x.tipo === 'fimTemporada' && x.resultado === 'subiu'));
  const comRenda = { ...estado, geradores: [1, 0, 0, 0, 0, 0] };
  assert.equal(renda(comRenda), 1); // ×2
});

test('NX-012: ninguém cai da Amadora', () => {
  const e = base({ vitorias: 0, derrotas: 13, proxPartida: 1, rng: rngQue((u) => u >= 0.05) });
  const { estado } = avancarOnline(e, 1);
  assert.equal(estado.div, 0);
});

test('RN-010: cai com 3 vitórias ou menos fora da Amadora', () => {
  const e = base({ div: 2, melhorDivRun: 2, vitorias: 3, derrotas: 10, proxPartida: 1, rng: rngQue((u) => u >= 0.05) });
  assert.equal(avancarOnline(e, 1).estado.div, 1);
});

test('RN-009: mesmo save, mesmo resultado', () => {
  const e = base({ geradores: [10, 0, 0, 0, 0, 0], rng: 12345 });
  const a = avancarOnline(e, 90 * 30).estado;
  const b = avancarOnline(e, 90 * 30).estado;
  assert.deepEqual(a, b);
});

test('NX-013: volta depois de 10 horas', () => {
  // renda 100/s, 5 partidas restantes
  const e = base({ geradores: [40, 0, 0, 0, 0, 0], legado: 80, ouro: 0, vitorias: 5, derrotas: 4, salvoEm: 0 });
  const { estado, resumo } = aplicarOffline(e, 10 * H);
  assert.equal(resumo.ouro, 1_440_000);
  assert.equal(resumo.vitorias + resumo.derrotas, 5);
  assert.ok(resumo.eventos.some((x) => x.tipo === 'fimTemporada'));
  assert.equal(estado.vitorias + estado.derrotas, 0);
  // Atenção (ambiguidade A3): o ouro total recebido inclui os prêmios das vitórias offline.
  assert.equal(estado.ouro, 1_440_000 + resumo.premios);
});

test('NX-013 / RN-012: relógio atrasado não dá nem tira nada', () => {
  const e = base({ geradores: [10, 0, 0, 0, 0, 0], ouro: 77, salvoEm: 5000 });
  const { estado, resumo } = aplicarOffline(e, 4000);
  assert.equal(resumo.tOff, 0);
  assert.equal(estado.ouro, 77);
  assert.equal(estado.salvoEm, 4000);
});

test('RN-012: lacuna — adiantar e voltar o relógio repetidamente soma 8 h a cada ciclo', () => {
  let e = base({ geradores: [10, 0, 0, 0, 0, 0], ouro: 0, salvoEm: 0, vitorias: 0 });
  e = aplicarOffline(e, 8 * H).estado; // adianta 8 h
  e = aplicarOffline(e, 1).estado; // volta para o horário real
  e = aplicarOffline(e, 8 * H + 1).estado; // adianta de novo
  const soOuroOffline = 2 * 5 * 8 * H * 0.5;
  assert.ok(e.ouro >= soOuroOffline); // 16 h de ganho em ~0 s reais
});

test('NX-014: prestígio indisponível na Desafiante', () => {
  const e = base({ melhorDivRun: 1, div: 1 });
  assert.equal(podePrestigiar(e), false);
  assert.equal(prestigiar(e), null);
});

test('NX-014: refundar depois da Liga', () => {
  const e = base({ melhorDivRun: 3, div: 3, ouro: 1e9, geradores: [9, 9, 9, 0, 0, 0], niveis: [9, 9, 9, 9, 9], melhorDivSempre: 3 });
  assert.equal(legadoDoPrestigio(e), 25);
  const p = prestigiar(e)!;
  assert.equal(p.legado, 25);
  assert.equal(multLegadoRenda(p.legado), 2.25);
  assert.equal(multLegadoPoder(p.legado), 1.25);
  assert.equal(poderTime(p), 50 * 1.25);
  assert.deepEqual(p.geradores, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(p.niveis, [1, 1, 1, 1, 1]);
  assert.equal(p.div, 0);
  assert.equal(p.melhorDivRun, 0);
  assert.equal(p.melhorDivSempre, 3); // marcos de história já vistos ficam
});

test('Variantes de Legado (propostas do risco 1)', () => {
  const e = base({ melhorDivRun: 2, legadoPagoAte: 2, prestigiosPorDiv: [0, 0, 3, 0, 0, 0] });
  assert.equal(legadoDoPrestigio(e, { legado: 'inedita', offline: 'rn' }), 0);
  assert.equal(legadoDoPrestigio({ ...e, melhorDivRun: 3 }, { legado: 'inedita', offline: 'rn' }), 15);
  assert.equal(legadoDoPrestigio(e, { legado: 'decrescente', offline: 'rn' }), 2); // 10 / 4
});

test('RN-017: formatação', () => {
  const casos: [number, string][] = [
    [0, '0'],
    [999.999, '999'],
    [1000, '1,00 mil'],
    [1234, '1,23 mil'],
    [999_999, '999 mil'],
    [45_600_000, '45,6 mi'],
    [789e9, '789 bi'],
    [1.23e12, '1,23 tri'],
    [999.9999e12, '999 tri'],
    [1e15, '1,00e15'],
    [1.239e15, '1,23e15'],
    [9.999e20, '9,99e20'],
    [1.79e308, '1,79e308'],
  ];
  for (const [v, s] of casos) assert.equal(formatar(v), s, `formatar(${v})`);
});
