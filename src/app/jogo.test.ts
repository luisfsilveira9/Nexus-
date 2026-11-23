// NX-015: integração motor ↔ save ↔ app com relógio falso e armazenamento em memória.
// Gherkin da NX-015 e CT-500 a CT-504, CT-531 (C2).
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { ArmazenamentoMemoria } from '../save/memoria.ts';
import { CHAVES } from '../save/gerenciador.ts';
import { lerTexto } from '../save/envelope.ts';
import { criarJogo } from './jogo.ts';
import { relogioFalso } from './relogio.ts';

function montar(arm = new ArmazenamentoMemoria(), relogio = relogioFalso()) {
  const jogo = criarJogo({ relogio, armazenamento: arm, novaSemente: () => 123 });
  return { jogo, arm, relogio };
}

/** Avança `s` segundos chamando o tique a cada 1 s, como o loop de 1 Hz. */
function rodar(j: ReturnType<typeof montar>, s: number) {
  for (let k = 0; k < s; k++) {
    j.relogio.avancar(1000);
    j.jogo.tique();
  }
}

const saveAtual = (arm: ArmazenamentoMemoria) => {
  const ls = [CHAVES.A, CHAVES.B].map((k) => lerTexto(arm.dados.get(k) ?? null));
  const ok = ls.filter((l) => l.ok);
  return ok.sort((a, b) => b.seq - a.seq)[0];
};

describe('abertura', () => {
  test('sem save: clube novo, já salvo', () => {
    const j = montar();
    j.jogo.iniciar();
    const v = j.jogo.vista();
    assert.equal(v.tela, 'jogo');
    assert.equal(v.estado?.ouro, 10);
    assert.equal(v.estado?.rng, 123);
    assert.equal(j.arm.gravacoes.length, 1);
  });

  test('assinar avisa a cada mudança e pode cancelar', () => {
    const j = montar();
    let n = 0;
    const sair = j.jogo.assinar(() => n++);
    j.jogo.iniciar();
    assert.ok(n > 0);
    sair();
    const antes = n;
    j.jogo.tocar();
    assert.equal(n, antes);
  });
});

describe('quando salva (RN-015)', () => {
  test('CT-500: nenhum save em 9 s; 1 save aos 10 s', () => {
    const j = montar();
    j.jogo.iniciar();
    const base = j.arm.gravacoes.length;
    rodar(j, 9);
    j.relogio.avancar(900);
    j.jogo.tique();
    assert.equal(j.arm.gravacoes.length, base);
    j.relogio.avancar(100);
    j.jogo.tique();
    assert.equal(j.arm.gravacoes.length, base + 1);
  });

  test('CT-501: compra salva antes de a tela mostrar; compra recusada não salva', () => {
    const j = montar();
    j.jogo.iniciar();
    const base = j.arm.gravacoes.length;
    let gravadoAoAvisar = -1;
    j.jogo.assinar(() => (gravadoAoAvisar = j.arm.gravacoes.length));
    j.jogo.comprarNegocio(0, 1);
    assert.equal(gravadoAoAvisar, base + 1);
    const s = saveAtual(j.arm);
    assert.ok(s?.ok && s.estado.negocios[0] === 1);
    j.jogo.comprarNegocio(0, 1); // sem ouro
    assert.equal(j.arm.gravacoes.length, base + 1);
  });

  test('CT-502: salva no fim de cada partida', () => {
    const j = montar();
    j.jogo.iniciar();
    rodar(j, 85); // 8 autosaves
    const base = j.arm.gravacoes.length;
    rodar(j, 5); // 90º segundo: partida
    assert.equal(j.arm.gravacoes.length, base + 1);
    const s = saveAtual(j.arm);
    assert.ok(s?.ok && s.estado.vitorias + s.estado.derrotas === 1 && s.estado.proxPartida === 90);
  });

  test('CT-503: salva ao minimizar e ao sair (os dois eventos)', () => {
    const j = montar();
    j.jogo.iniciar();
    const base = j.arm.gravacoes.length;
    j.jogo.aoOcultar(); // visibilitychange → hidden
    j.jogo.aoOcultar(); // pagehide
    assert.equal(j.arm.gravacoes.length, base + 2);
  });

  test('A05: sem espaço avisa, o jogo continua e o aviso some quando volta a salvar', () => {
    const j = montar();
    j.jogo.iniciar();
    j.arm.falhas.cotaCheia = true;
    j.jogo.comprarNegocio(0, 1);
    assert.equal(j.jogo.vista().avisoSemEspaco, true);
    assert.equal(j.jogo.vista().estado?.negocios[0], 1);
    j.jogo.fecharAvisoSemEspaco();
    assert.equal(j.jogo.vista().avisoSemEspaco, false);
    j.arm.falhas.cotaCheia = false;
    rodar(j, 10);
    assert.equal(j.jogo.vista().avisoSemEspaco, false);
    assert.ok(saveAtual(j.arm)?.ok);
  });
});

describe('Gherkin "fechar o app no meio"', () => {
  test('comprei um gerador há 3 s, o app é encerrado à força e reaberto: continua comprado', () => {
    const j = montar();
    j.jogo.iniciar();
    j.jogo.comprarNegocio(0, 1);
    rodar(j, 3);
    // Encerrado à força: nenhum evento de saída. Reabre com o mesmo armazenamento.
    j.relogio.reiniciarMonotonico();
    const reaberto = montar(j.arm, j.relogio);
    reaberto.jogo.iniciar();
    assert.equal(reaberto.jogo.vista().tela, 'jogo');
    assert.equal(reaberto.jogo.vista().estado?.negocios[0], 1);
  });
});

describe('Gherkin "save corrompido" e "nenhum save válido" pelo app', () => {
  test('cópia atual ilegível: aviso (T12a) antes de tudo, depois o jogo', () => {
    const j = montar();
    j.jogo.iniciar();
    j.jogo.comprarNegocio(0, 1); // seq 2 no slot B
    j.arm.corromper(CHAVES.B, 'truncar');
    const r = montar(j.arm, j.relogio);
    r.jogo.iniciar();
    const v = r.jogo.vista();
    assert.equal(v.tela, 'recuperado');
    assert.equal(v.estado?.negocios[0], 0);
    assert.equal(v.recuperadoSalvoEm, 1_800_000_000_000);
    // O relógio de partida fica pausado no aviso (RN-009); a renda não.
    r.relogio.avancar(120_000);
    r.jogo.tique();
    assert.equal(r.jogo.vista().estado?.proxPartida, 90);
    r.jogo.continuar();
    assert.equal(r.jogo.vista().tela, 'jogo');
  });

  test('nenhuma válida: tentar de novo, cancelar, confirmar clube novo e exportar', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: 'ruim', [CHAVES.B]: 'pior' });
    const j = montar(arm);
    j.jogo.iniciar();
    assert.equal(j.jogo.vista().tela, 'nenhumValido');
    assert.equal(j.jogo.vista().tentativas, 1);
    j.jogo.tique(); // sem estado: nada
    j.jogo.tocar();
    j.jogo.aoOcultar();
    assert.equal(arm.gravacoes.length, 0);
    j.jogo.aoMostrar();
    j.jogo.tentarDeNovo();
    assert.equal(j.jogo.vista().tentativas, 2);
    j.jogo.abrirExportarIlegivel();
    assert.ok(j.jogo.vista().exportarTexto?.includes('pior'));
    j.jogo.fecharExportar();
    assert.equal(j.jogo.vista().exportarTexto, null);
    j.jogo.pedirClubeNovo();
    assert.equal(j.jogo.vista().tela, 'confirmarNovo');
    j.jogo.cancelarClubeNovo();
    assert.equal(j.jogo.vista().tela, 'nenhumValido');
    assert.equal(arm.dados.get(CHAVES.A), 'ruim');
    j.jogo.pedirClubeNovo();
    j.jogo.confirmarClubeNovo();
    assert.equal(j.jogo.vista().tela, 'jogo');
    assert.equal(j.jogo.vista().estado?.ouro, 10);
    assert.ok(arm.dados.get(CHAVES.ilegivel)?.includes('pior'));
  });

  test('confirmar clube novo sem espaço para guardar as ilegíveis: avisa e não começa', () => {
    const arm = new ArmazenamentoMemoria({ [CHAVES.A]: 'ruim' });
    const j = montar(arm);
    j.jogo.iniciar();
    j.jogo.pedirClubeNovo();
    arm.falhas.cotaCheia = true;
    j.jogo.confirmarClubeNovo();
    assert.equal(j.jogo.vista().tela, 'confirmarNovo');
    assert.equal(j.jogo.vista().avisoSemEspaco, true);
  });

  test('ações fora da tela certa são ignoradas', () => {
    const j = montar();
    j.jogo.iniciar();
    const v = j.jogo.vista();
    j.jogo.continuar();
    j.jogo.tentarDeNovo();
    j.jogo.pedirClubeNovo();
    j.jogo.cancelarClubeNovo();
    j.jogo.confirmarClubeNovo();
    j.jogo.abrirExportarIlegivel();
    assert.equal(j.jogo.vista().tela, v.tela);
    const injetado = { ...v.estado!, clube: { nome: '<script>x</script>', sigla: 'FSC' } };
    j.jogo.substituirEstadoSemValidar(injetado);
    assert.equal(j.jogo.vista().estado, injetado);
    j.jogo.definirPersistencia('negado');
    assert.equal(j.jogo.vista().persistencia, 'negado');
  });
});

describe('C2 / RN-011: relógios e segundo plano', () => {
  test('CT-531: renda online segue o monotônico; offline segue a parede', () => {
    const j = montar();
    j.jogo.iniciar();
    j.jogo.comprarNegocio(0, 1); // 0,5/s, ouro 0
    // Parede pula 5 h sem o monotônico andar (relógio adiantado com o app aberto): nada muda.
    j.relogio.definirParede(1_800_000_000_000 + 5 * 3600_000);
    j.jogo.tique();
    assert.equal(j.jogo.vista().estado?.ouro, 0);
    // 10 s de monotônico: 5 de ouro.
    rodar(j, 10);
    assert.equal(j.jogo.vista().estado?.ouro, 5);
  });

  test('segundo plano conta como offline (50%) e não credita online', () => {
    const j = montar();
    j.jogo.iniciar();
    j.jogo.comprarNegocio(0, 1); // 0,5/s
    rodar(j, 4); // +2
    j.jogo.aoOcultar();
    rodar(j, 100); // em segundo plano: o tique não credita
    assert.equal(j.jogo.vista().estado?.ouro, 2);
    j.jogo.aoMostrar();
    assert.equal(j.jogo.vista().estado?.ouro, 2 + 0.5 * 100 * 0.5);
    j.jogo.aoMostrar(); // repetido: nada
    assert.equal(j.jogo.vista().estado?.ouro, 27);
  });

  test('toque só na tela do jogo', () => {
    const j = montar();
    j.jogo.iniciar();
    j.jogo.tocar();
    assert.equal(j.jogo.vista().estado?.ouro, 11);
  });
});

describe('NX-010: toque, compra, selo "Novo" e anúncio do Renatão', () => {
  test('o toque diz se contou e quanto rendeu; o 6º no mesmo segundo não conta (RN-005)', () => {
    const j = montar();
    j.jogo.iniciar();
    const r = [0, 1, 2, 3, 4, 5].map(() => {
      j.relogio.avancar(100);
      return j.jogo.tocar();
    });
    assert.deepEqual(
      r.map((x) => x?.aceito),
      [true, true, true, true, true, false],
    );
    assert.deepEqual(
      r.map((x) => x?.ouro),
      [1, 1, 1, 1, 1, 0],
    );
    assert.equal(j.jogo.vista().estado?.ouro, 15);
  });

  test('compra devolve a quantidade e os marcos, e salva na hora; sem ouro devolve null', () => {
    const j = montar();
    j.jogo.iniciar();
    const antes = j.arm.gravacoes.length;
    assert.deepEqual(j.jogo.comprarNegocio(0, 1), { indice: 0, quantidade: 1, marcos: 0 });
    assert.equal(j.arm.gravacoes.length, antes + 1);
    assert.equal(saveAtual(j.arm)?.ok && saveAtual(j.arm).estado.negocios[0], 1);
    assert.equal(j.jogo.comprarNegocio(0, 'max'), null);
    assert.equal(j.jogo.comprarNegocio(0, 10), null);
    assert.equal(j.arm.gravacoes.length, antes + 1);
  });

  test('compra que cruza o marco de 50 devolve marcos = 1 (RN-004)', () => {
    const j = montar();
    j.jogo.iniciar();
    const e = j.jogo.vista().estado!;
    j.jogo.substituirEstadoSemValidar({ ...e, ouro: 1e9, negocios: [49, 0, 0, 0, 0, 0] });
    assert.deepEqual(j.jogo.comprarNegocio(0, 1), { indice: 0, quantidade: 1, marcos: 1 });
  });

  test('negócio que aparece entra na fila de anúncios e fica "Novo" até abrir a aba', () => {
    const j = montar();
    j.jogo.iniciar();
    assert.deepEqual(j.jogo.vista().anuncios, []);
    // 75 de ouro ganho na run em toques (1 por toque, 1 por segundo) libera o Patrocínio.
    for (let k = 0; k < 75; k++) {
      j.relogio.avancar(1000);
      j.jogo.tocar();
    }
    const v = j.jogo.vista();
    assert.equal(v.estado?.visiveis[1], true);
    assert.deepEqual(v.anuncios, [1]);
    assert.equal(v.estado?.negociosVistos[1], false);
    j.jogo.fecharAnuncio();
    assert.deepEqual(j.jogo.vista().anuncios, []);
    j.jogo.fecharAnuncio(); // fila vazia: nada muda
    j.jogo.verNegocios();
    assert.equal(j.jogo.vista().estado?.negociosVistos[1], true);
    const est = j.jogo.vista().estado;
    j.jogo.verNegocios(); // nada novo: mesmo estado
    assert.equal(j.jogo.vista().estado, est);
  });

  test('estado injetado pelo debug não gera anúncio', () => {
    const j = montar();
    j.jogo.iniciar();
    const e = j.jogo.vista().estado!;
    j.jogo.substituirEstadoSemValidar({ ...e, visiveis: [true, true, true, false, false, false] });
    assert.deepEqual(j.jogo.vista().anuncios, []);
  });

  test('fora do jogo, tocar e comprar não fazem nada', () => {
    const j = montar();
    assert.equal(j.jogo.tocar(), null);
    assert.equal(j.jogo.comprarNegocio(0, 1), null);
    j.jogo.verNegocios();
  });
});
