// Testes unitários do motor (NX-007, atualizados para as RN v0.2 na NX-008).
// Cada caso cita a RN ou o cenário Gherkin de docs/produto/backlog.md.
// Rodar: node --test tools/sim-economia/motor.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIVISOES, INTERVALO_PARTIDA, NEGOCIOS, OFFLINE_LIMITE_S, TOLERANCIA_DINHEIRO } from './regras.ts';
import {
  type Estado,
  aplicarOffline,
  avancarOnline,
  comprarNegocios,
  custoLote,
  custoNegocio,
  custoNivel,
  faltam,
  legadoDaRefundacao,
  maxLote,
  multLegadoPoder,
  multLegadoRenda,
  negocioVisivel,
  novoEstado,
  podePagar,
  podeRefundar,
  poderJogador,
  poderTime,
  pVitoria,
  refundar,
  renda,
  salvar,
  subirNivel,
  tocar,
} from './motor.ts';
import { sortear } from './rng.ts';
import { formatar, formatarPct } from './formato.ts';

const H = 3600;
const base = (parcial: Partial<Estado> = {}): Estado => ({ ...novoEstado(1, 0), ...parcial });
/** Estado do sorteio cujo próximo valor satisfaz `cond`. */
const rngQue = (cond: (u: number) => boolean) => {
  for (let s = 1; ; s++) if (cond(sortear(s)[0])) return s;
};
/** Renda de 100/s na Várzea: 40 "Aulas na lan" (20/s) × Legado 80 (×5). */
const RENDA_100 = { negocios: [40, 0, 0, 0, 0, 0], legado: 80 };

// ---------- RN-001, RN-003, RN-006 (NX-010) ----------

test('NX-010: comprar o primeiro negócio', () => {
  const e0 = novoEstado(1, 0);
  assert.equal(e0.ouro, 10); // RN-001
  const e = comprarNegocios(e0, 0, 1)!;
  assert.equal(e.ouro, 0);
  assert.equal(renda(e), 0.5);
  assert.equal(formatar(renda(e)), '0,5');
  assert.equal(formatar(custoNegocio(e, 0), 'cima'), '11,5'); // 10 × 1,15 = 11,4999…98 em float
});

test('RN-003: só "Aulas na lan" é visível no início; os outros pelo ouro acumulado na run', () => {
  const e0 = novoEstado(1, 0);
  assert.deepEqual(e0.visiveis, [true, false, false, false, false, false]);
  // Patrocínio local (150) aparece com 75 de ouro acumulado, mesmo que o ouro em caixa seja menor.
  let e = base({ ...RENDA_100, ouro: 0 });
  e = avancarOnline(e, 1).estado; // +100
  assert.equal(e.ouroRun, 100);
  assert.equal(negocioVisivel(e, 1), true);
  assert.equal(negocioVisivel(e, 2), false); // Camisa oficial: 1.000
  // Gastar não esconde: depois de visível, não some.
  e = comprarNegocios({ ...e, ouro: 0 }, 0, 1) ?? { ...e, ouro: 0 };
  assert.equal(negocioVisivel(e, 1), true);
  // 74 acumulados não bastam; o ouro inicial (10) não conta como "entrou".
  const quase = avancarOnline(base({ negocios: [37, 0, 0, 0, 0, 0], legado: 60 }), 1).estado; // 18,5 × 4 = 74/s
  assert.equal(quase.ouroRun, 74);
  assert.equal(quase.ouro, 84);
  assert.equal(negocioVisivel(quase, 1), false);
  assert.equal(negocioVisivel(avancarOnline(quase, 1).estado, 1), true);
});

test('RN-003 / RN-013: a refundação esconde de novo os negócios e o ouro volta a 10', () => {
  const e = base({ melhorDivRun: 2, div: 2, ouro: 1e6, ouroRun: 1e9, visiveis: NEGOCIOS.map(() => true) });
  const r = refundar(e)!;
  assert.equal(r.ouro, 10);
  assert.equal(r.ouroRun, 0);
  assert.deepEqual(r.visiveis, [true, false, false, false, false, false]);
});

test('NX-010 / RN-006: Máx com k = 0 fica desabilitado e mostra quanto falta para 1 unidade', () => {
  const e = base({ ouro: 9.99 });
  assert.equal(maxLote(e, 0), 0);
  assert.equal(comprarNegocios(e, 0, 1), null);
  const f = faltam(e.ouro, custoLote(e, 0, 1));
  assert.ok(Math.abs(f - 0.01) < 1e-12);
  assert.equal(formatar(f, 'cima'), '0,1'); // "Faltam" para cima
  assert.equal(formatar(e.ouro), '9,9'); // ouro para baixo: 9,9 + 0,1 = 10
});

test('RN-006: ×10 só com ouro para 10 unidades; senão mostra "Faltam X"', () => {
  const e = base({ ouro: 200 });
  const c10 = custoLote(e, 0, 10); // 203,03…
  assert.equal(podePagar(e.ouro, c10), false);
  assert.equal(comprarNegocios(e, 0, 10), null);
  assert.equal(formatar(faltam(e.ouro, c10), 'cima'), '3,1');
  assert.equal(maxLote(e, 0), 9);
});

test('RN-006: custo do lote é a soma das compras unitárias, e Máx é o maior k', () => {
  const e = base({ negocios: [7, 0, 0, 0, 0, 0] });
  let soma = 0;
  for (let k = 0; k < 10; k++) soma += 10 * 1.15 ** (7 + k);
  assert.ok(Math.abs(custoLote(e, 0, 10) - soma) / soma < 1e-12);
  assert.equal(maxLote({ ...e, ouro: soma }, 0), 10);
});

// ---------- Convenções: tolerância de 10⁻⁹ ----------

test('Convenções: ouro ≥ custo com tolerância relativa de 10⁻⁹ e ouro = max(0, ouro − custo)', () => {
  const c = 1e12;
  assert.equal(podePagar(c * (1 - 0.5 * TOLERANCIA_DINHEIRO), c), true);
  assert.equal(podePagar(c * (1 - 2 * TOLERANCIA_DINHEIRO), c), false);
  // Compra dentro da tolerância: o ouro vai a 0, nunca negativo.
  const e = base({ negocios: [100, 0, 0, 0, 0, 0] });
  const custo = custoNegocio(e, 0);
  const comprado = comprarNegocios({ ...e, ouro: custo * (1 - 1e-10) }, 0, 1)!;
  assert.ok(comprado);
  assert.equal(comprado.ouro, 0);
  // QA-4: com o ouro exato da fórmula de lote, 10 compras ×1 seguidas passam todas.
  let x: Estado | null = { ...base(), ouro: custoLote(base(), 0, 10) };
  for (let k = 0; k < 10; k++) x = comprarNegocios(x!, 0, 1);
  assert.ok(x);
  assert.equal(x!.negocios[0], 10);
  assert.ok(x!.ouro >= 0 && x!.ouro < 1e-9);
  // Máx usa a mesma comparação.
  assert.equal(maxLote({ ...base(), ouro: custoLote(base(), 0, 10) * (1 - 1e-10) }, 0), 10);
});

// ---------- RN-005: toque em janela móvel ----------

test('NX-010 / RN-005: 8 toques em 1 s dão 5 × 10 = 50 de ouro', () => {
  let e = base({ ...RENDA_100, ouro: 0 });
  assert.equal(renda(e), 100);
  let aceitos = 0;
  for (let k = 0; k < 8; k++) {
    const r = tocar(e, 1000 + k * 100);
    e = r.estado;
    if (r.aceito) aceitos++;
  }
  assert.equal(aceitos, 5);
  assert.equal(e.ouro, 50);
  assert.equal(tocar(base({ ouro: 0 }), 0).estado.ouro, 1); // mínimo 1 por toque
});

test('RN-005: a janela é móvel, não o segundo do relógio', () => {
  // 5 toques em 0,80–0,98 s e 5 em 1,00–1,08 s: por segundo do relógio contariam 10; na janela móvel, 5.
  let e = base({ ouro: 0 });
  const instantes = [800, 850, 900, 950, 980, 1000, 1020, 1040, 1060, 1080];
  let aceitos = 0;
  for (const t of instantes) {
    const r = tocar(e, t);
    e = r.estado;
    if (r.aceito) aceitos++;
  }
  assert.equal(aceitos, 5);
  // 1 s depois do 1º aceito (800 ms), a janela (800, 1800] tem 4: o toque conta.
  assert.equal(tocar(e, 1800).aceito, true);
  assert.equal(tocar(e, 1799).aceito, false);
  // Ritmo constante de 5/s rende 5 por segundo.
  const r = avancarOnline(base({ ouro: 0 }), 10, { toquesPorSegundo: 5 });
  assert.equal(r.estado.ouro, 50);
});

// ---------- RN-007, RN-008 (NX-011) ----------

test('NX-011: subir nível', () => {
  const e = subirNivel(base({ ouro: 50 }), 2)!;
  assert.equal(e.niveis[2], 2);
  assert.equal(poderJogador(e.niveis[2]), 10.5);
  assert.equal(formatar(poderJogador(e.niveis[2])), '10,5');
  assert.equal(formatar(custoNivel(e, 2), 'cima'), '61');
});

// ---------- RN-009, RN-010 (NX-012) ----------

test('NX-012: chance mostrada antes da partida', () => {
  assert.equal(formatarPct(pVitoria(72, 60)), '77%'); // 0,7685
  assert.equal(formatarPct(pVitoria(60, 60)), '50%');
  assert.equal(formatarPct(pVitoria(48, 60)), '23%');
  assert.equal(pVitoria(1e9, 60), 0.95);
  assert.equal(pVitoria(1, 60), 0.05);
});

test('NX-012 / RN-009: subir de divisão paga o prêmio com a renda de antes da subida', () => {
  const forte = [200, 200, 200, 200, 200]; // p = 95%
  const e = base({ ...RENDA_100, niveis: forte, ouro: 0, vitorias: 9, derrotas: 4, proxPartida: 1, rng: rngQue((u) => u < 0.95) });
  const { estado, eventos } = avancarOnline(e, 1);
  const p = eventos.find((x) => x.tipo === 'partida');
  assert.ok(p && p.tipo === 'partida' && p.vitoria);
  assert.equal(p.premio, 6_000); // não 12.000
  assert.equal(estado.div, 1); // Acesso
  assert.equal(DIVISOES[estado.div].id, 'acesso');
  assert.equal(renda(estado), 200); // ×2
  assert.equal(estado.vitorias + estado.derrotas, 0);
  assert.ok(eventos.some((x) => x.tipo === 'fimSplit' && x.resultado === 'subiu'));
});

test('NX-012: ninguém cai da Várzea', () => {
  const e = base({ vitorias: 0, derrotas: 13, proxPartida: 1, rng: rngQue((u) => u >= 0.05) });
  assert.equal(avancarOnline(e, 1).estado.div, 0);
});

test('RN-010: cai com 3 vitórias ou menos fora da Várzea', () => {
  const e = base({ div: 2, melhorDivRun: 2, vitorias: 3, derrotas: 10, proxPartida: 1, rng: rngQue((u) => u >= 0.05) });
  assert.equal(avancarOnline(e, 1).estado.div, 1);
});

test('RN-010: título mundial com 10+ vitórias no Mundial; não muda a divisão', () => {
  const forte = [600, 600, 600, 600, 600]; // poder muito acima de 1,5 mi: p = 95%
  const e = base({ div: 5, melhorDivRun: 5, niveis: forte, vitorias: 9, derrotas: 4, proxPartida: 1, rng: rngQue((u) => u < 0.95) });
  const { estado, eventos } = avancarOnline(e, 1);
  assert.equal(estado.div, 5);
  assert.equal(estado.titulos, 1);
  assert.ok(eventos.some((x) => x.tipo === 'fimSplit' && x.resultado === 'campeao'));
  // O título fica no histórico depois da refundação.
  assert.equal(refundar(estado)!.titulos, 1);
});

test('RN-009: mesmo save, mesmo resultado', () => {
  const e = base({ negocios: [10, 0, 0, 0, 0, 0], rng: 12345 });
  assert.deepEqual(avancarOnline(e, 90 * 30).estado, avancarOnline(e, 90 * 30).estado);
});

test('RN-009: o relógio de partida pausa (telas da RN-009), a renda não', () => {
  const e = base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 0, proxPartida: 5 });
  const { estado, eventos } = avancarOnline(e, 60, { pausado: true });
  assert.equal(estado.proxPartida, 5);
  assert.equal(eventos.length, 0);
  assert.equal(estado.ouro, 5 * 60);
});

// ---------- RN-011, RN-012 (NX-013) ----------

test('NX-013: volta depois de 10 horas', () => {
  // Renda 100/s, 5 partidas restantes no split, 90 s para a próxima partida. Poder ≈ 59,6 contra 60
  // (p ≈ 49%): na Várzea ninguém cai, então só para numa subida ou nas 320 partidas.
  const niveis = [5, 5, 5, 4, 4];
  let paraNaSubida = 0;
  let chegaA320 = 0;
  for (let s = 1; s <= 40; s++) {
    // Renda 100/s sem Legado (o Legado também daria +80% de poder): 8 × 0,5 + 16 × 6.
    const e = base({ negocios: [8, 16, 0, 0, 0, 0], niveis, ouro: 0, vitorias: 5, derrotas: 4, proxPartida: 90, maior: 0, rng: s });
    assert.equal(renda(e), 100);
    const { estado, resumo } = aplicarOffline(e, 10 * H);
    assert.equal(resumo.tEf, OFFLINE_LIMITE_S);
    assert.equal(resumo.ouro, 1_440_000); // 100 × 8 h × 0,5
    assert.equal(resumo.premios, 6_000 * resumo.vitorias); // prêmio cheio, sem o 0,5
    assert.equal(estado.ouro, 1_440_000 + 6_000 * resumo.vitorias);
    assert.equal(resumo.partidasPossiveis, 320);
    assert.equal(resumo.mostrarTela, true);
    const ultimo = resumo.splits.at(-1);
    // Todos os splits antes do último mantiveram a divisão.
    for (const sp of resumo.splits.slice(0, -1)) assert.equal(sp.resultado, 'manteve');
    if (ultimo?.resultado === 'subiu') {
      paraNaSubida++;
      assert.equal(resumo.partidas, 5 + 14 * (resumo.splits.length - 1));
      assert.equal(estado.div, 1);
    } else {
      chegaA320++;
      assert.equal(resumo.partidas, 320);
    }
    // Relógio: (t_ef − r) mod 90 = (28.800 − 90) mod 90 = 0 → volta a 90.
    assert.equal(estado.proxPartida, 90);
  }
  assert.ok(paraNaSubida > 0 && chegaA320 > 0, `${paraNaSubida} / ${chegaA320}`);
});

test('RN-011: offline para no primeiro split com queda', () => {
  // Ascensão com time fraco: cai no fim do 1º split e não joga mais nada.
  const e = base({ div: 2, melhorDivRun: 2, ...RENDA_100, maior: 0, proxPartida: 90 });
  const { estado, resumo } = aplicarOffline(e, 8 * H);
  assert.equal(resumo.splits.length, 1);
  assert.equal(resumo.splits[0].resultado, 'caiu');
  assert.equal(resumo.partidas, 14);
  assert.equal(estado.div, 1);
});

test('RN-009 / RN-011 (QA-9): o resto do relógio de partida fica no save e é consumido primeiro', () => {
  // Faltavam 30 s; 60 s fora → 1 partida; o relógio volta com 90 − (30 mod 90) = 60.
  const e = base({ proxPartida: 30, maior: 0 });
  const { estado, resumo } = aplicarOffline(e, 60);
  assert.equal(resumo.partidasPossiveis, 1);
  assert.equal(resumo.partidas, 1);
  assert.equal(estado.proxPartida, 60);
  // Faltavam 50 s; 20 s fora → nenhuma partida; faltam 30.
  const b = aplicarOffline(base({ proxPartida: 50, maior: 0 }), 20);
  assert.equal(b.resumo.partidasPossiveis, 0);
  assert.equal(b.estado.proxPartida, 30);
  // O relógio também atravessa sessões online: salvar e voltar sem tempo fora não mexe nele.
  const c = aplicarOffline(salvar(base({ proxPartida: 17, maior: 100 }), 100), 100);
  assert.equal(c.estado.proxPartida, 17);
});

test('NX-013 / RN-011: ausência curta (40 s) é creditada sem a tela', () => {
  const e = base({ ...RENDA_100, ouro: 0, maior: 1000, proxPartida: 90 });
  const { estado, resumo } = aplicarOffline(e, 1040);
  assert.equal(resumo.mostrarTela, false);
  assert.equal(estado.ouro, 100 * 40 * 0.5);
  assert.equal(aplicarOffline(e, 1060).resumo.mostrarTela, true); // 60 s já mostra
});

test('NX-013 / RN-012: relógio atrasado não dá nem tira nada', () => {
  const e = base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 77, maior: 5000 });
  const { estado, resumo } = aplicarOffline(e, 4000);
  assert.equal(resumo.tOff, 0);
  assert.equal(estado.ouro, 77);
  assert.equal(estado.maior, 5000); // o maior horário visto não volta
});

test('NX-013 / RN-012: ciclo de adiantar e atrasar o relógio dá 8 h uma única vez', () => {
  // Horário real começa em 0. O jogador salva e fecha.
  let e = salvar(base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 0, maior: 0 }), 0);
  let total = 0;
  // 1) Adianta 8 h e abre.
  let r = aplicarOffline(e, 8 * H);
  total += r.resumo.tEf;
  e = salvar(r.estado, 8 * H);
  // 2) Volta o relógio para o horário real (10 s depois) e abre.
  r = aplicarOffline(e, 10);
  total += r.resumo.tEf;
  e = salvar(r.estado, 10);
  // 3) Adianta de novo 8 h (horário real + 8 h, 20 s depois do início) e abre.
  r = aplicarOffline(e, 20 + 8 * H);
  total += r.resumo.tEf;
  e = r.estado;
  assert.equal(total, 8 * H + 20); // 8 h uma vez + 20 s reais
  // 4) Repetir o ciclo inteiro mais 3 vezes não rende nada além do tempo real.
  for (let k = 1; k <= 3; k++) {
    const real = 20 + k * 30;
    r = aplicarOffline(salvar(e, real), real); // atrasa para o real
    total += r.resumo.tEf;
    r = aplicarOffline(salvar(r.estado, real), real + 8 * H); // adianta 8 h de novo
    total += r.resumo.tEf;
    e = r.estado;
  }
  assert.equal(total, 8 * H + 110);
});

test('RN-012: lacuna documentada — adiantar em degraus cada vez maiores rende 8 h por degrau', () => {
  // Não é ciclo de adiantar/atrasar: é só adiantar mais a cada vez. Cada degrau rende até 8 h, e
  // depois o tempo real até alcançar `maior` não rende offline. Ver relatório da NX-008 (B4).
  let e = base({ maior: 0 });
  let total = 0;
  for (let k = 1; k <= 3; k++) {
    const r = aplicarOffline(e, k * 8 * H);
    total += r.resumo.tEf;
    e = salvar(r.estado, k * 8 * H);
  }
  assert.equal(total, 24 * H);
  // Volta ao horário real (1 min depois do início) e espera 10 h reais: nada.
  assert.equal(aplicarOffline(e, 60 + 10 * H).resumo.tOff, 0);
});

// ---------- RN-013, RN-014 (NX-014) ----------

test('NX-014: refundação indisponível no Acesso', () => {
  const e = base({ melhorDivRun: 1, div: 1 });
  assert.equal(podeRefundar(e), false);
  assert.equal(refundar(e), null);
});

test('NX-014: refundar depois da Elite', () => {
  const e = base({
    melhorDivRun: 3,
    div: 3,
    ouro: 1e9,
    negocios: [9, 9, 9, 0, 0, 0],
    niveis: [9, 9, 9, 9, 9],
    melhorDivSempre: 3,
    proxPartida: 12,
    maior: 777,
  });
  assert.equal(legadoDaRefundacao(e), 25);
  const p = refundar(e)!;
  assert.equal(p.legado, 25);
  assert.equal(multLegadoRenda(p.legado), 2.25);
  assert.equal(multLegadoPoder(p.legado), 1.25);
  assert.equal(poderTime(p), 50 * 1.25);
  assert.equal(p.ouro, 10);
  assert.deepEqual(p.negocios, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(p.niveis, [1, 1, 1, 1, 1]);
  assert.equal(p.div, 0);
  assert.equal(p.melhorDivRun, 0);
  assert.equal(p.proxPartida, INTERVALO_PARTIDA);
  assert.equal(p.melhorDivSempre, 3); // capítulos já vistos continuam vistos
  assert.equal(p.maior, 777);
  assert.equal(p.refundacoes, 1);
});

// ---------- RN-017 ----------

test('RN-017: exemplos da tabela (para baixo)', () => {
  const casos: [number, string][] = [
    [0, '0'],
    [0.5, '0,5'],
    [10.5, '10,5'],
    [11, '11'],
    [99.9, '99,9'],
    [99.99, '99,9'],
    [100, '100'],
    [999, '999'],
    [999.999, '999'],
    [1000, '1,00 mil'],
    [12_500, '12,5 mil'],
    [999_000, '999 mil'],
    [999_999, '999 mil'], // nunca "1.000 mil"
    [1_230_000, '1,23 mi'],
    [45.6e9, '45,6 bi'],
    [999e12, '999 tri'],
    [999.9999e12, '999 tri'],
    [1e15, '1,00e15'],
    [4.72e16, '4,72e16'],
    [1.239e15, '1,23e15'],
    [1.79e308, '1,79e308'],
  ];
  for (const [v, s] of casos) assert.equal(formatar(v), s, `formatar(${v})`);
});

test('RN-017: custos e "Faltam" para cima, sem passar o limite da faixa', () => {
  const casos: [number, string][] = [
    [10 * 1.15, '11,5'],
    [10 * 1.15 ** 2, '13,3'], // 13,225
    [61, '61'],
    [99.95, '100'],
    [999.2, '1,00 mil'],
    [1001, '1,01 mil'],
    [999_001, '1,00 mi'],
    [999.9999e12, '1,00e15'],
    [1.231e15, '1,24e15'],
  ];
  for (const [v, s] of casos) assert.equal(formatar(v, 'cima'), s, `formatar(${v}, 'cima')`);
});

test('RN-017: porcentagem ao mais próximo', () => {
  assert.equal(formatarPct(0.7685), '77%');
  assert.equal(formatarPct(0.264), '26%');
  assert.equal(formatarPct(0.95), '95%');
});
