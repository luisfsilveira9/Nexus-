// NX-015: interface do motor `passo(estado, acao, agora)` (C1, C2) e ajustes das RN v0.3.1.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { formatar, formatarPct } from './formato.ts';
import {
  type Acao,
  type Agora,
  type Estado,
  LOTE,
  aplicarOffline,
  custoLote,
  novoEstado,
  passo,
  passoDetalhado,
  salvar,
} from './motor.ts';
import { sortear } from './rng.ts';
import { INTERVALO_PARTIDA, LOTE_10, OFFLINE_LIMITE_S } from './regras.ts';

const H = 3600;
const T0 = 1_800_000_000; // s desde 1970
const base = (parcial: Partial<Estado> = {}): Estado => ({ ...novoEstado(7, T0), ...parcial });
const em = (paredeS: number, monoMs: number): Agora => ({ paredeMs: paredeS * 1000, monoMs });
const rngQue = (cond: (u: number) => boolean) => {
  for (let s = 1; ; s++) if (cond(sortear(s)[0])) return s;
};

function congelar<T>(x: T): T {
  if (typeof x === 'object' && x !== null) {
    for (const v of Object.values(x)) congelar(v);
    Object.freeze(x);
  }
  return x;
}

const TODAS: Acao[] = [
  { tipo: 'abrir' },
  { tipo: 'tique', modo: 'emJogo' },
  { tipo: 'tique', modo: 'pausado' },
  { tipo: 'toque' },
  { tipo: 'comprarNegocio', indice: 0, quantidade: 1 },
  { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' },
  { tipo: 'subirNivel', jogador: 2 },
  { tipo: 'refundar' },
  { tipo: 'salvar' },
];

describe('C1: passo é puro e o estado é JSON', () => {
  test('CT-530: não muta a entrada congelada e a saída faz ida e volta em JSON', () => {
    const e = congelar(
      base({ ouro: 1e6, negocios: [3, 1, 0, 0, 0, 0], melhorDivRun: 2, div: 2, monoMs: 0 }),
    );
    const antes = JSON.stringify(e);
    for (const acao of TODAS) {
      const r = passo(e, acao, em(T0 + 120, 5_000));
      assert.equal(JSON.stringify(e), antes, `mutou em ${acao.tipo}`);
      assert.deepEqual(JSON.parse(JSON.stringify(r)), r, `não é JSON em ${acao.tipo}`);
    }
  });

  test('passo devolve o mesmo estado que passoDetalhado', () => {
    const e = base({ ouro: 50 });
    const a = { tipo: 'comprarNegocio', indice: 0, quantidade: 1 } as const;
    assert.deepEqual(passo(e, a, em(T0, 0)), passoDetalhado(e, a, em(T0, 0)).estado);
  });

  test('ação recusada devolve o mesmo objeto, sem eventos', () => {
    const e = base({ ouro: 0 });
    for (const acao of [
      { tipo: 'comprarNegocio', indice: 0, quantidade: 1 },
      { tipo: 'comprarNegocio', indice: 1, quantidade: 1 }, // invisível
      { tipo: 'comprarNegocio', indice: 9, quantidade: 1 },
      { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' },
      { tipo: 'comprarNegocio', indice: 0, quantidade: 0 },
      { tipo: 'comprarNegocio', indice: 0, quantidade: 2.5 },
      { tipo: 'subirNivel', jogador: 0 },
      { tipo: 'subirNivel', jogador: 5 },
      { tipo: 'refundar' },
    ] as Acao[]) {
      const r = passoDetalhado(e, acao, em(T0, 0));
      assert.equal(r.estado, e, JSON.stringify(acao));
      assert.equal(r.eventos.length, 0);
    }
  });
});

describe('C2: dois relógios', () => {
  test('tique usa só o monotônico; mudar a parede não muda nada', () => {
    const e = base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 0, monoMs: 0 });
    const a = passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 3_000));
    const b = passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0 + 99 * H, 3_000));
    assert.deepEqual(a, b);
    assert.equal(a.ouro, 15); // 5/s × 3 s
  });

  test('tique credita segundos inteiros e guarda o resto para o próximo', () => {
    let e = base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 0, monoMs: 1_000 });
    e = passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 3_500));
    assert.equal(e.ouro, 10);
    assert.equal(e.monoMs, 3_000);
    e = passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 3_900));
    assert.equal(e.ouro, 10); // ainda não fechou 1 s
    e = passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 4_000));
    assert.equal(e.ouro, 15);
    // Relógio que volta (não deveria): nada acontece.
    assert.equal(passo(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 0)), e);
  });

  test('abrir usa só a parede: aplica o offline e começa a sessão no monotônico atual', () => {
    const e = base({ negocios: [10, 0, 0, 0, 0, 0], ouro: 0, toques: [1, 2], monoMs: 99_000 });
    const r = passoDetalhado(e, { tipo: 'abrir' }, em(T0 + 40, 123));
    assert.equal(r.estado.ouro, 5 * 40 * 0.5);
    assert.equal(r.estado.maior, T0 + 40);
    assert.equal(r.estado.monoMs, 123);
    assert.deepEqual(r.estado.toques, []);
    const off = r.eventos[0];
    assert.ok(off.tipo === 'offline' && off.resumo.tOff === 40 && !off.resumo.mostrarTela);
  });
});

describe('RN-009 v0.3: relógio de partida só com a barra de abas', () => {
  test('"pausado" não anda o relógio; "emJogo" anda e joga a partida no 90º segundo', () => {
    const e = base({ monoMs: 0 });
    const p = passo(e, { tipo: 'tique', modo: 'pausado' }, em(T0, 200_000));
    assert.equal(p.proxPartida, INTERVALO_PARTIDA);
    assert.equal(p.vitorias + p.derrotas, 0);
    const j = passoDetalhado(e, { tipo: 'tique', modo: 'emJogo' }, em(T0, 90_000));
    assert.equal(j.eventos.filter((x) => x.tipo === 'partida').length, 1);
    assert.equal(j.estado.proxPartida, INTERVALO_PARTIDA);
  });
});

describe('ações de jogo pelo passo', () => {
  test('toque: evento com o ouro ganho; o 6º no mesmo segundo é ignorado', () => {
    let e = base({ ouro: 0, monoMs: 0 });
    const ganhos: number[] = [];
    for (let k = 0; k < 6; k++) {
      const r = passoDetalhado(e, { tipo: 'toque' }, em(T0, 100 + k * 10));
      e = r.estado;
      const ev = r.eventos[0];
      assert.ok(ev.tipo === 'toque');
      ganhos.push(ev.aceito ? ev.ouro : 0);
    }
    assert.deepEqual(ganhos, [1, 1, 1, 1, 1, 0]);
  });

  test('compra ×1, ×10 e Máx (RN-006)', () => {
    const e = base({ ouro: 10 });
    const r1 = passoDetalhado(e, { tipo: 'comprarNegocio', indice: 0, quantidade: 1 }, em(T0, 0));
    assert.equal(r1.estado.negocios[0], 1);
    assert.equal(r1.estado.ouro, 0);
    assert.deepEqual(r1.eventos[0], {
      tipo: 'compra',
      alvo: 'negocio',
      indice: 0,
      quantidade: 1,
      custo: 10,
    });
    const c10 = custoLote(e, 0, LOTE_10);
    const r10 = passo(
      { ...e, ouro: c10 },
      { tipo: 'comprarNegocio', indice: 0, quantidade: LOTE.x10 },
      em(T0, 0),
    );
    assert.equal(r10.negocios[0], 10);
    const rmax = passo(
      { ...e, ouro: 100 },
      { tipo: 'comprarNegocio', indice: 0, quantidade: 'max' },
      em(T0, 0),
    );
    assert.equal(rmax.negocios[0], 6); // 10 × (1,15⁶ − 1)/0,15 = 87,5 ≤ 100 < 116,1
  });

  test('subir nível e refundar pelo passo', () => {
    const n = passoDetalhado(base({ ouro: 50 }), { tipo: 'subirNivel', jogador: 2 }, em(T0, 0));
    assert.equal(n.estado.niveis[2], 2);
    assert.equal(n.eventos[0].tipo, 'compra');
    const r = passoDetalhado(base({ melhorDivRun: 3, div: 3 }), { tipo: 'refundar' }, em(T0, 0));
    assert.deepEqual(r.eventos, [{ tipo: 'refundacao', legadoGanho: 25 }]);
    assert.equal(r.estado.legado, 25);
  });
});

describe('RN-012 v0.3: maior atualizado em todo save', () => {
  test('salvar só sobe o maior, nunca desce', () => {
    const e = base({ maior: 5_000 });
    assert.equal(passo(e, { tipo: 'salvar' }, em(6_000, 0)).maior, 6_000);
    assert.equal(passo(e, { tipo: 'salvar' }, em(4_000, 0)).maior, 5_000);
    assert.equal(salvar(e, 4_000).maior, 5_000);
  });
});

describe('RN-011 v0.3: relógio de partida depois do offline', () => {
  test('t_ef < r: volta com r − t_ef e nenhuma partida', () => {
    const { estado, resumo } = aplicarOffline(base({ proxPartida: 50, maior: 0 }), 20);
    assert.equal(resumo.partidas, 0);
    assert.equal(estado.proxPartida, 30);
  });

  test('sem mudança de divisão: volta com 90 − ((t_ef − r) mod 90)', () => {
    const { estado, resumo } = aplicarOffline(base({ proxPartida: 30, maior: 0 }), 75);
    assert.equal(resumo.partidas, 1);
    assert.equal(estado.proxPartida, 45);
  });

  test('parou no fim de um split com subida: volta com 90, não com o resto', () => {
    const forte = [200, 200, 200, 200, 200];
    const e = base({
      niveis: forte,
      vitorias: 9,
      derrotas: 4,
      proxPartida: 30,
      maior: 0,
      rng: rngQue((u) => u < 0.95),
    });
    const { estado, resumo } = aplicarOffline(e, 75); // resto seria 45
    assert.equal(resumo.splits[0]?.resultado, 'subiu');
    assert.equal(estado.div, 1);
    assert.equal(estado.proxPartida, INTERVALO_PARTIDA);
  });

  test('o máximo em 8 h é 320 partidas, para qualquer 0 < r ≤ 90', () => {
    for (const r of [0.001, 1, 45, 89.999, 90]) {
      const { resumo } = aplicarOffline(
        base({ proxPartida: r, maior: 0 }),
        OFFLINE_LIMITE_S + 5 * H,
      );
      assert.ok(resumo.partidasPossiveis <= 320, `r = ${r}`);
    }
    assert.equal(
      aplicarOffline(base({ proxPartida: 0.001, maior: 0 }), OFFLINE_LIMITE_S).resumo
        .partidasPossiveis,
      320,
    );
  });

  test('o relógio sempre volta em (0, 90]', () => {
    for (let s = 1; s <= 30; s++) {
      const r = (s * 37) % 90 || 90;
      const t = s * 1234;
      const { estado } = aplicarOffline(base({ proxPartida: r, maior: 0, rng: s }), t);
      assert.ok(estado.proxPartida > 0 && estado.proxPartida <= 90, `${r}, ${t}`);
    }
  });
});

describe('Convenções v0.3: tolerância antes de arredondar na tela (QA-22, P-UX-13)', () => {
  test('valores a menos de 10⁻⁹ de um ponto de arredondamento contam como no ponto', () => {
    assert.equal(formatar(10 - 9.7, 'cima'), '0,3'); // 0,3000000000000007
    assert.equal(formatar(4349.999999999999, 'baixo'), '4,35 mil');
    assert.equal(formatar(10 * 1.15, 'baixo'), '11,5'); // 11,4999…98 aparece igual ao custo
    assert.equal(formatar(10 * 1.15, 'cima'), '11,5');
    // Fora da tolerância continua a direção normal.
    assert.equal(formatar(11.4999, 'baixo'), '11,4');
    assert.equal(formatar(11.4001, 'cima'), '11,5');
  });

  test('porcentagem: ao mais próximo, empate em ,5 para cima', () => {
    assert.equal(formatarPct(0.125), '13%');
    assert.equal(formatarPct(0.285), '29%'); // 28,499999… em float
    assert.equal(formatarPct(0.2849), '28%');
    assert.equal(formatarPct(0.05), '5%');
  });

  test('casos-limite do formatador', () => {
    assert.equal(formatar(NaN), '?');
    assert.equal(formatar(Infinity), '∞');
    assert.equal(formatar(-5), '-5');
    assert.equal(formatar(9.96), '9,9');
    assert.equal(formatar(999.9, 'cima'), '1,00 mil');
    assert.equal(formatar(9.995e3, 'cima'), '10,0 mil');
    assert.equal(formatar(9.99999e15, 'cima'), '1,00e16');
    assert.equal(formatar(0.99999999995), '1');
  });
});
