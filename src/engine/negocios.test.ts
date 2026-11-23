// NX-010: cenários Gherkin e casos CT-001 a CT-072 (docs/qa/casos/economia-renda.md) que o motor
// cobre, mais as funções da tela em negocios.ts. Os números esperados são os das tabelas do QA.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { describe, test } from 'vitest';
import { formatar, formatarMultiplicador, formatarRelogio } from './formato.ts';
import {
  type Agora,
  type Estado,
  avancarOnline,
  custoLote,
  custoNegocio,
  maxLote,
  novoEstado,
  ouroPorToque,
  passo,
  passoDetalhado,
  refundar,
  renda,
  tocar,
} from './motor.ts';
import {
  QUANTIDADE_DO_LOTE,
  haNegocioNovo,
  marcosCruzados,
  negocioNovo,
  negociosQueApareceram,
  negociosVisiveis,
  oferta,
  progressoMarco,
  proximaCompra,
  rendaDoNegocio,
  rendaPorUnidade,
} from './negocios.ts';
import { NEGOCIOS } from './regras.ts';
import { validarEstado } from './validacao.ts';

const T0 = 1_800_000_000;
const novo = () => novoEstado(7, T0);
const com = (parcial: Partial<Estado>): Estado => ({ ...novo(), ...parcial });
const em = (monoMs: number): Agora => ({ paredeMs: T0 * 1000, monoMs });
const quase = (a: number, b: number, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
/** n de "Aulas na lan" (índice 0), o resto zerado. */
const aulas = (n: number, ouro: number, extra: Partial<Estado> = {}) =>
  com({ ouro, negocios: [n, 0, 0, 0, 0, 0], ...extra });
/** Renda de 100/s exata: 200 Aulas na lan dão 0,5 × 200 × 2⁴ = 1.600; usamos Patrocínio. */
const rendaCem = () => {
  // Patrocínio: 6 × n × 2^floor(n/50). n = 50 → 6 × 50 × 2 = 600; queremos 100: Aulas n=200 não
  // serve. 0,5 × n com n < 50 dá no máximo 24,5. Combinação exata: Camisa 1 (60) + Patrocínio 6
  // (36) + Aulas 8 (4) = 100.
  const e = com({
    negocios: [8, 6, 1, 0, 0, 0],
    visiveis: [true, true, true, false, false, false],
  });
  assert.equal(renda(e), 100);
  return e;
};

describe('Gherkin NX-010', () => {
  test('CT-070 comprar o primeiro negócio: ouro 0, renda 0,5/s, próximo custo 11,5', () => {
    const e = novo();
    assert.equal(e.ouro, 10);
    assert.deepEqual(e.negocios, [0, 0, 0, 0, 0, 0]);
    const d = passo(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 1 }, em(0));
    assert.equal(d.ouro, 0);
    assert.equal(renda(d), 0.5);
    quase(custoNegocio(d, 0), 11.5);
    assert.equal(formatar(d.ouro, 'baixo'), '0');
    assert.equal(formatar(renda(d), 'baixo'), '0,5');
    assert.equal(formatar(custoNegocio(d, 0), 'cima'), '11,5');
  });

  test('CT-043 toque limitado: renda 100/s e 8 toques em 1 s dão 50 de ouro', () => {
    let e = { ...rendaCem(), ouro: 0 };
    for (let k = 0; k < 8; k++) e = passo(e, { tipo: 'toque' }, em(k * 125));
    assert.equal(e.ouro, 50);
  });

  test('CT-056/CT-072 Máx sem ouro suficiente: desabilitado e mostra quanto falta', () => {
    const o = oferta(aulas(0, 5), 0, 'max');
    assert.equal(o.pode, false);
    assert.equal(o.quantidade, 0);
    assert.equal(o.faltam, 5);
    assert.equal(formatar(o.faltam, 'cima'), '5');
    // O motor também recusa a compra.
    const e = aulas(0, 5);
    assert.equal(passo(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' }, em(0)), e);
  });
});

describe('RN-001 e Convenções', () => {
  test('CT-002/CT-003: custo exato zera o ouro; abaixo do custo, nada muda', () => {
    assert.equal(
      passo(aulas(0, 10), { tipo: 'comprarNegocio', indice: 0, quantidade: 1 }, em(0)).ouro,
      0,
    );
    const e = aulas(0, 9.99);
    assert.equal(passo(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 1 }, em(0)), e);
  });

  test('CT-006: tolerância de 10⁻⁹ na fronteira e ouro nunca negativo', () => {
    const a = passo(
      aulas(0, 10 * (1 - 1e-10)),
      { tipo: 'comprarNegocio', indice: 0, quantidade: 1 },
      em(0),
    );
    assert.equal(a.negocios[0], 1);
    assert.equal(a.ouro, 0);
    const b = aulas(0, 10 * (1 - 2e-9));
    assert.equal(oferta(b, 0, 'x1').pode, false);
    assert.equal(passo(b, { tipo: 'comprarNegocio', indice: 0, quantidade: 1 }, em(0)), b);
  });

  test('CT-007: clube novo com 10 de ouro, Legado 0 e nenhum negócio', () => {
    const e = novo();
    assert.equal(e.ouro, 10);
    assert.equal(e.legado, 0);
    assert.equal(e.ouroRun, 0);
    assert.equal(formatar(e.ouro, 'baixo'), '10');
  });
});

describe('RN-002 e RN-004: renda e marcos', () => {
  test('CT-010: renda composta (Acesso ×2, Legado 10) = 51/s; a soma das partes bate', () => {
    const e = com({
      negocios: [10, 2, 0, 0, 0, 0],
      div: 1,
      melhorDivRun: 1,
      melhorDivSempre: 1,
      legado: 10,
    });
    quase(renda(e), 51);
    quase(
      NEGOCIOS.reduce((s, _, i) => s + rendaDoNegocio(e, i), 0),
      renda(e),
    );
    quase(rendaPorUnidade(e, 0), 0.5 * 2 * 1.5);
    quase(ouroPorToque(e), 5.1); // CT-042
  });

  test('CT-011: uma unidade de cada = 129.766,5/s ("129 mil")', () => {
    const e = com({ negocios: [1, 1, 1, 1, 1, 1] });
    assert.equal(renda(e), 129_766.5);
    assert.equal(formatar(renda(e), 'baixo'), '129\u00a0mil');
  });

  test('CT-030: a renda do negócio dobra a cada 50', () => {
    const r = (n: number) => rendaDoNegocio(aulas(n, 0), 0);
    assert.equal(r(49), 24.5);
    assert.equal(r(50), 50);
    assert.equal(r(99), 99);
    assert.equal(r(100), 200);
    assert.equal(rendaPorUnidade(aulas(49, 0), 0), 0.5);
    assert.equal(rendaPorUnidade(aulas(50, 0), 0), 1);
  });

  test('CT-031: faltam para o próximo marco e progresso da barra', () => {
    assert.deepEqual(progressoMarco(0), { feitos: 0, faltam: 50, fracao: 0 });
    assert.deepEqual(progressoMarco(49), { feitos: 49, faltam: 1, fracao: 0.98 });
    assert.deepEqual(progressoMarco(50), { feitos: 0, faltam: 50, fracao: 0 });
    assert.deepEqual(progressoMarco(137), { feitos: 37, faltam: 13, fracao: 0.74 });
  });

  test('RN-004: marcos cruzados por uma compra (para o "dobrou!")', () => {
    assert.equal(marcosCruzados(49, 50), 1);
    assert.equal(marcosCruzados(48, 49), 0);
    assert.equal(marcosCruzados(45, 105), 2);
    assert.equal(marcosCruzados(50, 51), 0);
    const r = passoDetalhado(
      aulas(49, 1e6),
      { tipo: 'comprarNegocio', indice: 0, quantidade: 1 },
      em(0),
    );
    const ev = r.eventos[0];
    assert.ok(ev.tipo === 'compra' && marcosCruzados(49, 49 + ev.quantidade) === 1);
  });

  test('CT-014: comprar nunca diminui a renda', () => {
    let e = com({
      ouro: 1e12,
      visiveis: NEGOCIOS.map(() => true),
      negociosVistos: NEGOCIOS.map(() => true),
    });
    for (let k = 0; k < 300; k++) {
      const i = (k * 7) % NEGOCIOS.length;
      const antes = renda(e);
      e = passo(
        e,
        { tipo: 'comprarNegocio', indice: i, quantidade: k % 3 === 0 ? 'max' : 1 },
        em(0),
      );
      assert.ok(renda(e) >= antes);
      assert.ok(e.ouro >= 0 && Number.isFinite(e.ouro));
    }
  });
});

describe('RN-003: custo e visibilidade', () => {
  test('CT-020: custo da próxima unidade, exibido para cima', () => {
    const c = (i: number, n: number) => {
      const neg = [0, 0, 0, 0, 0, 0];
      neg[i] = n;
      return custoNegocio(com({ negocios: neg }), i);
    };
    const casos: [number, number, number, string][] = [
      [0, 0, 10, '10'],
      [0, 1, 11.5, '11,5'],
      [0, 2, 13.225, '13,3'],
      [0, 10, 40.455577, '40,5'],
      [0, 49, 9423.108, '9,43\u00a0mil'],
      [0, 50, 10836.574, '10,9\u00a0mil'],
      [5, 0, 8e6, '8,00\u00a0mi'],
      [5, 50, 8_669_259_532.67, '8,67\u00a0bi'],
      [5, 100, 9.3945e12, '9,40\u00a0tri'],
      [1, 1, 172.5, '173'],
      [1, 12, 802.5, '803'],
      [0, 13, 61.53, '61,6'],
    ];
    for (const [i, n, valor, tela] of casos) {
      quase(c(i, n), valor, 1e-4);
      assert.equal(formatar(c(i, n), 'cima'), tela, `negócio ${i}, n=${n}`);
    }
  });

  test('CT-021: custo estritamente crescente e finito até n = 1.000', () => {
    for (let i = 0; i < NEGOCIOS.length; i++) {
      let antes = -1;
      for (let n = 0; n <= 1000; n++) {
        const neg = [0, 0, 0, 0, 0, 0];
        neg[i] = n;
        const c = custoNegocio(com({ negocios: neg }), i);
        assert.ok(Number.isFinite(c) && c > antes);
        antes = c;
      }
    }
  });

  test('CT-022: cada negócio aparece no limiar do ouro ganho na run (sem os 10 iniciais)', () => {
    const limiares = [75, 1000, 15_000, 250_000, 4_000_000];
    const e = novo();
    assert.deepEqual(negociosVisiveis(e), [0]);
    limiares.forEach((lim, k) => {
      const i = k + 1;
      const quaseLa = com({ ouroRun: lim - 0.01 - 1, ouroTotal: lim - 0.01 - 1 });
      // Entra 1 de ouro por toque (renda 0): ouroRun vai a lim − 0,01.
      const antes = tocar(quaseLa, 0).estado;
      assert.equal(antes.visiveis[i], false, `${NEGOCIOS[i].id} oculto com ${lim - 0.01}`);
      const noLimiar = tocar(com({ ouroRun: lim - 1, ouroTotal: lim - 1 }), 0).estado;
      assert.equal(noLimiar.visiveis[i], true, `${NEGOCIOS[i].id} visível com ${lim}`);
    });
    // Patrocínio aparece com 85 em caixa (75 ganhos), nunca com 75 em caixa (65 ganhos).
    let x = novo();
    for (let t = 0; t < 65; t++) x = tocar(x, t * 1000).estado;
    assert.equal(x.ouro, 75);
    assert.equal(x.visiveis[1], false);
    for (let t = 65; t < 75; t++) x = tocar(x, t * 1000).estado;
    assert.equal(x.ouro, 85);
    assert.equal(x.visiveis[1], true);
  });

  test('CT-023/CT-027: gastar não esconde nem reduz o acumulado', () => {
    let e = aulas(0, 10);
    for (let t = 0; t < 70; t++) e = tocar(e, t * 1000).estado; // 80 em caixa, 70 ganhos
    e = passo(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' }, em(80_000));
    assert.ok(e.ouro < 80);
    assert.equal(e.visiveis[1], false);
    for (let t = 80; t < 85; t++) e = tocar(e, t * 1000).estado; // +5 ganhos = 75
    assert.equal(e.ouroRun, 75);
    assert.equal(e.visiveis[1], true);
    assert.equal(oferta(e, 1, 'x1').pode, false); // visível, mas 150 > ouro
  });

  test('CT-024: a refundação esconde de novo e zera o acumulado e os "vistos"', () => {
    const e = com({
      visiveis: [true, true, true, false, false, false],
      negociosVistos: [true, true, false, false, false, false],
      ouroRun: 5000,
      ouroTotal: 5000,
      melhorDivRun: 2,
      melhorDivSempre: 2,
      div: 2,
    });
    const r = refundar(e)!;
    assert.deepEqual(r.visiveis, [true, false, false, false, false, false]);
    assert.deepEqual(r.negociosVistos, [true, false, false, false, false, false]);
    assert.equal(r.ouroRun, 0);
    assert.equal(r.ouro, 10);
  });

  test('CT-026: renda, toques, prêmios e offline contam para a visibilidade', () => {
    // (a) renda: 0,5/s por 150 s = 75
    const a = avancarOnline(aulas(1, 0, { proxPartida: 90 }), 150, { modo: 'pausado' }).estado;
    assert.equal(a.visiveis[1], true);
    const a2 = avancarOnline(aulas(1, 0), 149, { modo: 'pausado' }).estado;
    assert.equal(a2.visiveis[1], false);
    // (b) toques: CT-022. (c) prêmio e (d) offline: o motor credita tudo por `ganhar` (motor.test).
  });

  test('não dá para comprar negócio oculto, nem com ouro de sobra', () => {
    const e = com({ ouro: 1e9 });
    assert.equal(passo(e, { tipo: 'comprarNegocio', indice: 1, quantidade: 1 }, em(0)), e);
    assert.equal(passo(e, { tipo: 'comprarNegocio', indice: 9, quantidade: 1 }, em(0)), e);
  });
});

describe('RN-005: toque', () => {
  test('CT-040/CT-041: valor do toque com mínimo de 1', () => {
    assert.equal(ouroPorToque(rendaCem()), 10);
    const valores = [
      [0, 1],
      [5, 1],
      [10, 1],
      [15, 1.5],
    ];
    for (const [r, v] of valores) {
      // Aulas: 0,5 × n (n < 50) → n = 2r
      const e = aulas(2 * r, 0);
      assert.equal(renda(e), r);
      assert.equal(ouroPorToque(e), v);
    }
    assert.equal(formatar(1.5, 'baixo'), '1,5');
  });

  test('CT-045: janela móvel na virada do segundo', () => {
    let e = { ...rendaCem(), ouro: 0 };
    for (const t of [900, 920, 940, 960, 990, 1010, 1030, 1050, 1070, 1100])
      e = passo(e, { tipo: 'toque' }, em(t));
    assert.equal(e.ouro, 50);
  });

  test('CT-048: toque ignorado não ocupa a janela', () => {
    let e = { ...rendaCem(), ouro: 0 };
    for (const t of [0, 100, 200, 300, 400, 990, 1050]) e = passo(e, { tipo: 'toque' }, em(t));
    assert.equal(e.ouro, 60);
  });

  test('CT-049: fronteira exata de 1 s', () => {
    let a = { ...rendaCem(), ouro: 0 };
    for (const t of [0, 100, 200, 300, 400, 1000]) a = passo(a, { tipo: 'toque' }, em(t));
    assert.equal(a.ouro, 60);
    let b = { ...rendaCem(), ouro: 0 };
    for (const t of [0, 100, 200, 300, 400, 999]) b = passo(b, { tipo: 'toque' }, em(t));
    assert.equal(b.ouro, 50);
  });

  test('CT-047: em qualquer janela de 1 s, no máximo 5 toques contam', () => {
    let semente = 12345;
    const proximo = () => {
      semente = (semente * 1103515245 + 12345) >>> 0;
      return semente / 2 ** 32;
    };
    for (let rodada = 0; rodada < 50; rodada++) {
      let e = novo();
      let t = 0;
      const aceitos: number[] = [];
      for (let k = 0; k < 300; k++) {
        t += Math.floor(proximo() * 400);
        const r = passoDetalhado(e, { tipo: 'toque' }, em(t));
        e = r.estado;
        const ev = r.eventos[0];
        if (ev.tipo === 'toque' && ev.aceito) aceitos.push(t);
      }
      for (const fim of aceitos)
        assert.ok(aceitos.filter((x) => x > fim - 1000 && x <= fim).length <= 5);
    }
  });

  test('o evento do toque diz se contou e quanto rendeu (para o "+X" da tela)', () => {
    let e = { ...rendaCem(), ouro: 0 };
    const vistos: { aceito: boolean; ouro: number }[] = [];
    for (let k = 0; k < 6; k++) {
      const r = passoDetalhado(e, { tipo: 'toque' }, em(k * 10));
      e = r.estado;
      const ev = r.eventos[0];
      if (ev.tipo === 'toque') vistos.push({ aceito: ev.aceito, ouro: ev.ouro });
    }
    assert.deepEqual(
      vistos.map((v) => v.aceito),
      [true, true, true, true, true, false],
    );
    assert.deepEqual(
      vistos.map((v) => v.ouro),
      [10, 10, 10, 10, 10, 0],
    );
  });
});

describe('RN-006: compra em lote', () => {
  test('CT-050/CT-051: custo do ×10 e o ×1 usa a fórmula da unidade', () => {
    quase(custoLote(aulas(0, 0), 0, 10), 203.0371823805);
    assert.equal(formatar(custoLote(aulas(0, 0), 0, 10), 'cima'), '204');
    quase(custoLote(aulas(1, 0), 0, 10), 233.4927597376);
    assert.equal(formatar(custoLote(aulas(1, 0), 0, 10), 'cima'), '234');
    assert.equal(oferta(aulas(0, 10), 0, 'x1').custo, 10);
  });

  test('CT-052: lote = soma das unidades (tolerância 10⁻⁹)', () => {
    for (const n of [0, 7, 49, 120, 500])
      for (const k of [1, 2, 10, 37, 100])
        for (let i = 0; i < NEGOCIOS.length; i++) {
          const neg = [0, 0, 0, 0, 0, 0];
          neg[i] = n;
          const e = com({ negocios: neg });
          let soma = 0;
          for (let j = 0; j < k; j++) soma += NEGOCIOS[i].custoBase * 1.15 ** (n + j);
          quase(custoLote(e, i, k), soma);
        }
  });

  test('CT-053: exemplos do Máx', () => {
    const casos: [number, number, number, number][] = [
      [0, 100, 6, 87.5374],
      [0, 1000, 19, 882.1181],
      [10, 1000, 11, 985.064],
      [0, 150, 8, 137.2682],
    ];
    for (const [n, ouro, k, custo] of casos) {
      const o = oferta(aulas(n, ouro), 0, 'max');
      assert.equal(o.quantidade, k);
      assert.ok(o.pode);
      quase(o.custo, custo, 1e-6);
      const d = passo(
        aulas(n, ouro),
        { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' },
        em(0),
      );
      assert.equal(d.negocios[0], n + k);
      quase(d.ouro, ouro - custo, 1e-5);
    }
  });

  test('CT-054: Máx no limite exato compra 10 e zera o ouro', () => {
    const d = passo(
      aulas(0, 203.0371823805271),
      { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' },
      em(0),
    );
    assert.equal(d.negocios[0], 10);
    assert.ok(d.ouro >= 0 && d.ouro < 1e-9);
  });

  test('CT-055: Máx é o maior k (com a tolerância)', () => {
    for (const ouro of [10, 11.5, 50, 203.03, 999, 12345.6, 1e7, 3.3e11])
      for (const n of [0, 3, 49, 50, 200]) {
        const e = aulas(n, ouro);
        const k = maxLote(e, 0);
        if (k > 0) assert.ok(custoLote(e, 0, k) <= (ouro * (1 + 1e-9)) / (1 - 1e-9));
        assert.ok(ouro < custoLote(e, 0, k + 1) * (1 - 1e-9));
      }
  });

  test('CT-057: "Faltam" para cima e nunca "0"', () => {
    const tela = (ouro: number) => formatar(oferta(aulas(0, ouro), 0, 'max').faltam, 'cima');
    assert.equal(tela(9.4), '0,6');
    assert.equal(tela(9.94), '0,1');
    assert.equal(tela(9.99), '0,1');
    assert.equal(tela(9.999999), '0,1');
  });

  test('CT-058: ×10 sem ouro para 10 fica desabilitado com "Faltam 53,1"; ×1 e Máx (8) habilitados', () => {
    const e = aulas(0, 150);
    const x10 = oferta(e, 0, 'x10');
    assert.equal(x10.pode, false);
    quase(x10.faltam, 53.0371823805);
    assert.equal(formatar(x10.faltam, 'cima'), '53,1');
    assert.equal(x10.maxCompraria, 8);
    assert.equal(passo(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 10 }, em(0)), e);
    assert.ok(oferta(e, 0, 'x1').pode);
    assert.deepEqual([oferta(e, 0, 'max').pode, oferta(e, 0, 'max').quantidade], [true, 8]);
  });

  test('CT-059: Máx com 1e15 de ouro compra 217 em menos de 5 ms', () => {
    const e = aulas(0, 1e15);
    const t = performanceAgora();
    const o = oferta(e, 0, 'max');
    const ms = performanceAgora() - t;
    assert.equal(o.quantidade, 217);
    quase(o.custo, 9.8933e14, 1e-4);
    assert.ok(ms < 5, `${ms} ms`);
  });

  test('CT-061: ×10 na fronteira', () => {
    const d = passo(
      aulas(0, 203.0371823805271),
      { tipo: 'comprarNegocio', indice: 0, quantidade: 10 },
      em(0),
    );
    assert.equal(d.negocios[0], 10);
    assert.ok(d.ouro >= 0 && d.ouro < 1e-9);
    const o = oferta(aulas(0, 203), 0, 'x10');
    assert.equal(o.pode, false);
    assert.equal(formatar(o.faltam, 'cima'), '0,1');
  });

  test('Lote ×10 parcial (fluxo UX): "Máx compraria 4" só no ×10 desabilitado', () => {
    // Patrocínio n=12 com 5.000: o ×10 custa ~16,3 mil; o Máx compra 4.
    const e = com({
      ouro: 5000,
      negocios: [0, 12, 0, 0, 0, 0],
      visiveis: [true, true, false, false, false, false],
    });
    const o = oferta(e, 1, 'x10');
    assert.equal(o.pode, false);
    assert.equal(o.maxCompraria, 4);
    assert.equal(formatar(o.faltam, 'cima'), '11,3\u00a0mil');
    assert.equal(oferta(e, 1, 'x1').maxCompraria, 0);
    assert.equal(oferta(aulas(0, 1e6), 0, 'x10').maxCompraria, 0);
  });

  test('QUANTIDADE_DO_LOTE liga o seletor à ação do motor', () => {
    assert.deepEqual(QUANTIDADE_DO_LOTE, { x1: 1, x10: 10, max: 'max' });
  });
});

describe('Tela: próxima compra, novos e formatos', () => {
  test('próxima compra = visível com menor custo; empate fica com o de número menor', () => {
    assert.equal(proximaCompra(novo()), 0);
    // Aulas n=20 custa 163,7; Patrocínio n=0 custa 150 → Patrocínio.
    const e = com({
      negocios: [20, 0, 0, 0, 0, 0],
      visiveis: [true, true, false, false, false, false],
    });
    assert.equal(proximaCompra(e), 1);
    // Oculto não conta, mesmo sendo mais barato.
    assert.equal(proximaCompra({ ...e, visiveis: [true, false, true, false, false, false] }), 0);
    // Empate exato: Aulas n=k e Camisa... usa custos iguais artificiais: Aulas n=0 (10) é o menor.
    assert.equal(proximaCompra(com({ visiveis: NEGOCIOS.map(() => true) })), 0);
  });

  test('selo "Novo": visível e ainda não visto; abrir a aba marca todos os visíveis', () => {
    const e = novo();
    assert.equal(haNegocioNovo(e), false); // "Aulas na lan" já nasce vista
    const apareceu = tocar(com({ ouroRun: 74, ouroTotal: 74 }), 0).estado;
    assert.deepEqual(negociosQueApareceram(com({}), apareceu), [1]);
    assert.equal(negocioNovo(apareceu, 1), true);
    assert.equal(haNegocioNovo(apareceu), true);
    const visto = passo(apareceu, { tipo: 'verNegocios' }, em(0));
    assert.equal(negocioNovo(visto, 1), false);
    assert.equal(haNegocioNovo(visto), false);
    // Sem nada novo, a ação devolve o mesmo objeto (nada a salvar).
    assert.equal(passo(visto, { tipo: 'verNegocios' }, em(0)), visto);
    assert.deepEqual(validarEstado(visto), []);
  });

  test('validação: "visto" sem estar visível é save impossível', () => {
    const ruim = com({ negociosVistos: [true, true, false, false, false, false] });
    assert.ok(validarEstado(ruim).some((p) => p.includes('vistos')));
    assert.ok(
      validarEstado({ ...novo(), negociosVistos: [true] }).some((p) => p.includes('vistos')),
    );
  });

  test('multiplicador e relógio da próxima partida', () => {
    assert.equal(formatarMultiplicador(1), '×1');
    assert.equal(formatarMultiplicador(2), '×2');
    assert.equal(formatarMultiplicador(2.25), '×2,25');
    assert.equal(formatarMultiplicador(11.25), '×11,25');
    assert.equal(formatarMultiplicador(2.5), '×2,5');
    assert.equal(formatarMultiplicador(32), '×32');
    assert.equal(formatarRelogio(90), '1:30');
    assert.equal(formatarRelogio(42), '0:42');
    assert.equal(formatarRelogio(89.2), '1:30');
    assert.equal(formatarRelogio(0.4), '0:01');
    assert.equal(formatarRelogio(0), '0:00');
    assert.equal(formatarRelogio(-3), '0:00');
  });
});

/** Relógio só para medir o CT-059 (o motor em si nunca lê relógio). */
const performanceAgora = () => performance.now();
