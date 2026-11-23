// RN-015 v0.3 / NX-015: camada de save (C8) com a versão em memória e falhas simuladas.
// Casos do docs/qa/casos/save.md citados por ID.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { type Estado, comprarNegocios, novoEstado } from '../engine/motor.ts';
import { ArmazenamentoMemoria } from './memoria.ts';
import {
  type StorageMinimo,
  ErroArmazenamento,
  ErroSemEspaco,
  armazenamentoLocal,
  ehErroDeCota,
} from './armazenamento.ts';
import { fnv1a } from './checksum.ts';
import { APP_ID, lerTexto, serializar } from './envelope.ts';
import { CHAVES, criarGerenciadorSave } from './gerenciador.ts';
import { ErroMigracao, MIGRACOES, SAVE_VERSION, migrar } from './migracoes.ts';
import { pedirPersistencia } from './persistencia.ts';

const T = 1_800_000_000_000; // ms
const novo = (parcial: Partial<Estado> = {}): Estado => ({
  ...novoEstado(42, T / 1000),
  ...parcial,
});

function comSaves(n: number) {
  const arm = new ArmazenamentoMemoria();
  const g = criarGerenciadorSave(arm);
  assert.equal(g.carregar().tipo, 'novo');
  let e = novo();
  for (let k = 1; k <= n; k++) {
    const r = g.salvar({ ...e, ouro: k }, T + k * 1000);
    assert.ok(r.ok);
    e = r.estado;
  }
  return { arm, g, e };
}

describe('formato e checksum', () => {
  test('FNV-1a conhecido e sensível a 1 byte', () => {
    assert.equal(fnv1a(''), '811c9dc5');
    assert.equal(fnv1a('a'), 'e40c292c');
    assert.notEqual(fnv1a('{"ouro":10}'), fnv1a('{"ouro":11}'));
  });

  test('CT-515: conteúdo mínimo do save', () => {
    const texto = serializar(novo(), 3, T);
    const env = JSON.parse(texto);
    assert.deepEqual(Object.keys(env), [
      'app',
      'saveVersion',
      'seq',
      'salvoEm',
      'estado',
      'checksum',
    ]);
    assert.equal(env.app, APP_ID);
    assert.equal(env.saveVersion, SAVE_VERSION);
    for (const campo of [
      'maior',
      'proxPartida',
      'rng',
      'vitorias',
      'derrotas',
      'div',
      'melhorDivRun',
      'ouroRun',
      'capitulos',
      'titulos',
      'clube',
    ])
      assert.ok(campo in env.estado, campo);
  });

  test('CT-514: ida e volta com números extremos e nome com acentos e símbolos permitidos', () => {
    const e = novo({
      ouro: 4.72e16,
      ouroRun: 1.234e-7,
      ouroTotal: 9.99e299,
      maior: T / 1000 + 0.123,
      rng: 0xffffffff,
      proxPartida: 0.5,
      clube: { nome: "Ação & D'Ávila-Jr.", sigla: 'ADJ' },
    });
    const l = lerTexto(serializar(e, 7, T));
    assert.ok(l.ok);
    assert.deepEqual(l.estado, e);
    assert.equal(l.seq, 7);
    assert.equal(l.salvoEm, T);
  });

  test('CT-508 / CT-521: texto ruim é recusado com o motivo', () => {
    const bom = serializar(novo(), 1, T);
    const casos: [string | null, string][] = [
      [null, 'vazio'],
      ['', 'vazio'],
      ['   ', 'vazio'],
      [bom.slice(0, bom.length / 2), 'ilegivel'],
      ['%%%', 'ilegivel'],
      ['[1,2]', 'ilegivel'],
      ['"texto"', 'ilegivel'],
      ['{"nome":"outro jogo"}', 'outroApp'],
      [bom.replace('"ouro":10', '"ouro":99'), 'checksum'],
      [bom.replace(`"saveVersion":${SAVE_VERSION}`, '"saveVersion":99'), 'versaoFutura'],
      [bom.replace(`"saveVersion":${SAVE_VERSION}`, '"saveVersion":0'), 'ilegivel'],
      [bom.replace(/"seq":1/, '"seq":-1'), 'ilegivel'],
      [bom.replace(/"checksum":"[0-9a-f]+"/, '"checksum":5'), 'ilegivel'],
    ];
    for (const [texto, motivo] of casos) {
      const l = lerTexto(texto);
      assert.ok(
        !l.ok && l.motivo === motivo,
        `${String(texto).slice(0, 30)} → ${JSON.stringify(l)}`,
      );
    }
  });

  test('CT-509: checksum certo com valores impossíveis = corrompido (motivo "valores")', () => {
    for (const parcial of [
      { ouro: -1 },
      { div: 9 },
      { legado: -5 },
      { clube: { nome: 'A'.repeat(500), sigla: 'FSC' } },
    ]) {
      const l = lerTexto(serializar({ ...novo(), ...parcial } as Estado, 1, T));
      assert.ok(!l.ok && l.motivo === 'valores' && l.detalhes.length > 0, JSON.stringify(parcial));
    }
  });
});

describe('migrações (CT-510)', () => {
  const tabela = {
    1: (x: unknown) => ({ ...(x as object), v2: true }),
    2: (x: unknown) => ({ ...(x as object), v3: true }),
  };

  test('aplica em ordem, é idempotente na versão atual e falha sem o passo', () => {
    assert.deepEqual(migrar({ a: 1 }, 1, 3, tabela), { a: 1, v2: true, v3: true });
    assert.deepEqual(migrar({ a: 1 }, 3, 3, tabela), { a: 1 });
    assert.deepEqual(migrar({ a: 1 }, SAVE_VERSION), { a: 1 });
    assert.throws(() => migrar({}, 1, 4, tabela), ErroMigracao);
    assert.throws(() => migrar({}, 5, 3, tabela), ErroMigracao);
  });

  test('lerTexto migra um save de versão antiga e recusa quando a migração falha', () => {
    const atual = serializar(novo(), 1, T);
    const proxima = SAVE_VERSION + 1;
    const tabelaOk = { [SAVE_VERSION]: (x: unknown) => x };
    const l = lerTexto(atual, { versaoAtual: proxima, migracoes: tabelaOk });
    assert.ok(l.ok && l.versaoOriginal === SAVE_VERSION);
    const ruim = lerTexto(atual, { versaoAtual: proxima, migracoes: {} });
    assert.ok(!ruim.ok && ruim.motivo === 'migracao');
    const quebra = lerTexto(atual, {
      versaoAtual: proxima,
      migracoes: {
        [SAVE_VERSION]: () => {
          throw new Error('x');
        },
      },
    });
    assert.ok(!quebra.ok && quebra.motivo === 'migracao');
  });

  test('NX-010: save v1 (sem negociosVistos) migra para a v2 sem selo "Novo" nos já visíveis', () => {
    // Fixture: estado como a NX-015 gravava (v1), com Patrocínio já visível.
    const { negociosVistos: _, ...v1 } = {
      ...novo(),
      ouro: 80,
      ouroRun: 90,
      ouroTotal: 90,
      negocios: [3, 0, 0, 0, 0, 0],
      visiveis: [true, true, false, false, false, false],
    };
    const corpoV1 = { app: APP_ID, saveVersion: 1, seq: 4, salvoEm: T, estado: v1 };
    const texto = JSON.stringify({ ...corpoV1, checksum: fnv1a(JSON.stringify(corpoV1)) });
    const l = lerTexto(texto);
    assert.ok(l.ok, JSON.stringify(l));
    assert.equal(l.versaoOriginal, 1);
    assert.deepEqual(l.estado.negociosVistos, [true, true, false, false, false, false]);
    assert.deepEqual(Object.keys(l.estado), Object.keys(novo()));
    assert.equal(l.estado.ouro, 80);
    // Migração recusa lixo em vez de inventar campos.
    assert.throws(() => MIGRACOES[1](null), ErroMigracao);
    assert.throws(() => MIGRACOES[1]({ ouro: 1 }), ErroMigracao);
  });
});

describe('slots alternados e carga', () => {
  test('CT-518: 3 saves seguidos gravam A, B, A; vale a cópia mais nova', () => {
    const { arm } = comSaves(3);
    assert.deepEqual(arm.gravacoes, [CHAVES.A, CHAVES.B, CHAVES.A]);
    const r = criarGerenciadorSave(arm).carregar();
    assert.ok(r.tipo === 'ok' && r.estado.ouro === 3 && r.salvoEm === T + 3000);
  });

  test('RN-012: todo save atualiza maior', () => {
    const arm = new ArmazenamentoMemoria();
    const g = criarGerenciadorSave(arm);
    g.carregar();
    const r = g.salvar(novo({ maior: 0 }), T + 5000);
    assert.equal(r.estado.maior, T / 1000 + 5);
    const l = lerTexto(arm.dados.get(CHAVES.A)!);
    assert.ok(l.ok && l.estado.maior === T / 1000 + 5);
  });

  test('a carga continua a sequência: o próximo save vai no outro slot', () => {
    const { arm } = comSaves(2); // A=1, B=2
    const g = criarGerenciadorSave(arm);
    g.carregar();
    g.salvar(novo({ ouro: 50 }), T + 9000);
    assert.equal(arm.gravacoes.at(-1), CHAVES.A);
    assert.equal(JSON.parse(arm.dados.get(CHAVES.A)!).seq, 3);
  });

  test('o seq decide, não o horário (relógio atrasado)', () => {
    const arm = new ArmazenamentoMemoria();
    const g = criarGerenciadorSave(arm);
    g.carregar();
    g.salvar(novo({ ouro: 1 }), T);
    g.salvar(novo({ ouro: 2 }), T - 3_600_000); // relógio voltou 1 h
    const r = criarGerenciadorSave(arm).carregar();
    assert.ok(r.tipo === 'ok' && r.estado.ouro === 2);
  });
});

describe('Gherkin "save corrompido" e CT-506', () => {
  for (const modo of ['truncar', 'lixo', 'vazio', 'byte'] as const)
    test(`cópia atual ${modo}: carrega a outra, avisa e guarda o texto ruim`, () => {
      const { arm } = comSaves(2); // A=1 (ouro 1), B=2 (ouro 2, atual)
      const ruim = (arm.corromper(CHAVES.B, modo), arm.dados.get(CHAVES.B));
      const g = criarGerenciadorSave(arm);
      const r = g.carregar();
      assert.equal(r.tipo, 'recuperado');
      assert.ok(r.tipo === 'recuperado' && r.estado.ouro === 1 && r.slotRuim === 'B');
      // A cópia ruim não some sem confirmação: fica guardada antes de ser sobrescrita.
      assert.ok(g.ilegivelGuardado()?.includes(JSON.stringify(ruim).slice(1, 20)));
      g.salvar(r.estado, T + 10_000);
      assert.equal(arm.gravacoes.at(-1), CHAVES.B);
      assert.ok(criarGerenciadorSave(arm).carregar().tipo === 'ok');
    });

  test('cópia ruim provadamente mais velha: carrega a nova sem aviso', () => {
    const { arm } = comSaves(2);
    arm.corromper(CHAVES.A, 'byte'); // seq 1 legível, checksum errado
    const r = criarGerenciadorSave(arm).carregar();
    assert.ok(r.tipo === 'ok' && r.estado.ouro === 2);
  });

  test('cópia com valores impossíveis e checksum refeito também é corrompida', () => {
    const { arm } = comSaves(2);
    const env = JSON.parse(arm.dados.get(CHAVES.B)!);
    arm.dados.set(CHAVES.B, serializar({ ...env.estado, ouro: -1 }, 99, T));
    const r = criarGerenciadorSave(arm).carregar();
    assert.ok(r.tipo === 'recuperado' && r.motivo === 'valores' && r.estado.ouro === 1);
  });

  test('CT-513: falha no meio da escrita deixa a outra cópia válida', () => {
    const { arm, g, e } = comSaves(2);
    arm.falhas.falharNoMeio = true;
    const r = g.salvar({ ...e, ouro: 3 }, T + 3000);
    assert.ok(!r.ok && r.motivo === 'falha');
    const c = criarGerenciadorSave(arm).carregar();
    assert.ok(c.tipo === 'recuperado' && c.estado.ouro === 2);
    // E a próxima tentativa vai no mesmo slot (o bom continua intacto).
    assert.ok(g.salvar({ ...e, ouro: 4 }, T + 4000).ok);
    assert.equal(arm.gravacoes.at(-1), CHAVES.A);
  });
});

describe('Gherkin "nenhum save válido" (CT-507, CT-519, CT-524)', () => {
  test('as duas ilegíveis: nada é gravado até o jogador decidir', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: '{"app":', [CHAVES.B]: 'lixo' });
    const g = criarGerenciadorSave(arm);
    const r = g.carregar();
    assert.equal(r.tipo, 'nenhumValido');
    assert.ok(r.tipo === 'nenhumValido' && r.copias.B === 'lixo' && !r.versaoFutura);
    assert.ok(r.tipo === 'nenhumValido' && r.motivos.A === 'ilegivel');
    const s = g.salvar(novo(), T);
    assert.ok(!s.ok && s.motivo === 'bloqueado');
    assert.equal(arm.dados.get(CHAVES.B), 'lixo');
    const exp = JSON.parse(g.exportarIlegiveis(r.copias, T));
    assert.equal(exp.copias[0].B, 'lixo');
  });

  test('"Tentar de novo" depois de consertar o armazenamento carrega o save', () => {
    const { arm } = comSaves(1);
    arm.falhas.leituraFalha = true;
    const g = criarGerenciadorSave(arm);
    const r = g.carregar();
    assert.ok(r.tipo === 'nenhumValido' && r.erroLeitura);
    arm.falhas.leituraFalha = false;
    assert.equal(g.carregar().tipo, 'ok');
  });

  test('"Começar clube novo" guarda as ilegíveis para exportar e libera a gravação', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: 'x1', [CHAVES.B]: 'x2' });
    const g = criarGerenciadorSave(arm);
    g.carregar();
    assert.ok(g.descartarIlegiveis());
    const guardado = JSON.parse(g.ilegivelGuardado()!);
    assert.deepEqual(guardado.copias.at(-1), { motivo: 'comecarNovo', A: 'x1', B: 'x2' });
    assert.ok(g.salvar(novo(), T).ok);
    assert.equal(criarGerenciadorSave(arm).carregar().tipo, 'recuperado'); // B ainda é 'x2'
  });

  test('guardar de novo acumula as cópias (inclusive um guardado antigo ilegível)', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: 'a', [CHAVES.ilegivel]: 'velho' });
    const g = criarGerenciadorSave(arm);
    g.carregar();
    assert.ok(g.descartarIlegiveis());
    const x = JSON.parse(g.ilegivelGuardado()!);
    assert.deepEqual(x.copias, ['velho', { motivo: 'comecarNovo', A: 'a', B: null }]);
  });

  test('sem espaço nem para guardar as ilegíveis: não libera', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: 'x1' });
    const g = criarGerenciadorSave(arm);
    g.carregar();
    arm.falhas.cotaCheia = true;
    assert.equal(g.descartarIlegiveis(), false);
  });

  test('CT-511: cópia de versão mais nova não carrega, não é apagada e avisa', () => {
    const { arm } = comSaves(1);
    const futuro = serializar(novo(), 9, T).replace(
      `"saveVersion":${SAVE_VERSION}`,
      '"saveVersion":99',
    );
    arm.dados.set(CHAVES.B, futuro);
    const g = criarGerenciadorSave(arm);
    const r = g.carregar();
    assert.ok(r.tipo === 'nenhumValido' && r.versaoFutura && r.motivos.B === 'versaoFutura');
    assert.ok(!g.salvar(novo(), T).ok);
    assert.equal(arm.dados.get(CHAVES.B), futuro);
  });
});

describe('falta de espaço (CT-512)', () => {
  test('mantém o último save válido, avisa e tenta de novo no próximo gatilho', () => {
    const { arm, g, e } = comSaves(2);
    arm.falhas.cotaCheia = true;
    const r = g.salvar({ ...e, ouro: 77 }, T + 9000);
    assert.ok(!r.ok && r.motivo === 'semEspaco');
    assert.equal(g.ultimoSalvoEm(), T + 2000);
    const c = criarGerenciadorSave(arm).carregar();
    assert.ok(c.tipo === 'ok' && c.estado.ouro === 2);
    arm.falhas.cotaCheia = false;
    assert.ok(g.salvar({ ...e, ouro: 78 }, T + 10_000).ok);
  });

  test('adaptador do localStorage traduz QuotaExceededError e outras falhas', () => {
    const cota = Object.assign(new Error('cheio'), { name: 'QuotaExceededError' });
    const s: StorageMinimo = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: (k) => {
        throw k === 'q' ? cota : new Error('io');
      },
    };
    const a = armazenamentoLocal(s);
    assert.throws(() => a.gravar('q', 'x'), ErroSemEspaco);
    assert.throws(
      () => a.gravar('z', 'x'),
      (e) => e instanceof ErroArmazenamento && !(e instanceof ErroSemEspaco),
    );
    assert.throws(() => a.ler('k'), ErroArmazenamento);
    const mapa = new Map<string, string>();
    const b = armazenamentoLocal({
      getItem: (k) => mapa.get(k) ?? null,
      setItem: (k, v) => void mapa.set(k, v),
    });
    b.gravar('k', 'v');
    assert.equal(b.ler('k'), 'v');
    assert.equal(ehErroDeCota({ code: 22 }), true);
    assert.equal(ehErroDeCota({ name: 'NS_ERROR_DOM_QUOTA_REACHED' }), true);
    assert.equal(ehErroDeCota(null), false);
    assert.equal(ehErroDeCota('x'), false);
  });
});

describe('exportar e importar (CT-520 a CT-523)', () => {
  test('CT-520: ida e volta por texto, com maior, semente e relógio de partida', () => {
    const { g, e } = comSaves(2);
    const atual = {
      ...comprarNegocios({ ...e, ouro: 10 }, 0)!,
      legado: 25,
      proxPartida: 33,
      rng: 999,
    };
    const texto = g.exportar(atual, T + 5000);
    const outro = new ArmazenamentoMemoria();
    const g2 = criarGerenciadorSave(outro);
    assert.equal(g2.carregar().tipo, 'novo');
    const prev = g2.conferirImportacao(texto);
    assert.ok(prev.ok && prev.estado.legado === 25);
    const r = g2.importar(texto);
    assert.ok(r.ok);
    assert.deepEqual(r.estado, atual); // maior do save importado, sem atualizar (RN-015)
    const c = criarGerenciadorSave(outro).carregar();
    assert.ok(c.tipo === 'ok');
    assert.deepEqual(c.estado, atual);
  });

  test('CT-521: texto ruim ou de versão mais nova é recusado e o save atual fica intacto', () => {
    const { arm, g } = comSaves(2);
    const antes = new Map(arm.dados);
    const futuro = serializar(novo(), 1, T).replace(
      `"saveVersion":${SAVE_VERSION}`,
      '"saveVersion":99',
    );
    for (const [texto, motivo] of [
      ['', 'vazio'],
      ['{"app":"x"}', 'outroApp'],
      [futuro, 'versaoFutura'],
    ] as const) {
      const r = g.importar(texto);
      assert.ok(!r.ok && r.motivo === motivo, motivo);
    }
    assert.deepEqual(arm.dados, antes);
  });

  test('importar sem espaço avisa e não perde o save atual', () => {
    const { arm, g, e } = comSaves(2);
    const texto = g.exportar(e, T);
    arm.falhas.cotaCheia = true;
    const r = g.importar(texto);
    assert.ok(!r.ok && r.motivo === 'semEspaco');
    arm.falhas.cotaCheia = false;
    arm.falhas.falharNoMeio = true;
    const r2 = g.importar(texto);
    assert.ok(!r2.ok && r2.motivo === 'falha');
  });
});

describe('armazenamento persistente (CT-540)', () => {
  test('persistente, negado, indisponível e erro', async () => {
    assert.equal(await pedirPersistencia(undefined), 'indisponivel');
    assert.equal(await pedirPersistencia({}), 'indisponivel');
    assert.equal(
      await pedirPersistencia({ persisted: async () => true, persist: async () => false }),
      'persistente',
    );
    assert.equal(
      await pedirPersistencia({ persisted: async () => false, persist: async () => true }),
      'persistente',
    );
    assert.equal(await pedirPersistencia({ persist: async () => false }), 'negado');
    assert.equal(
      await pedirPersistencia({
        persist: async () => {
          throw new Error('x');
        },
      }),
      'indisponivel',
    );
  });
});
