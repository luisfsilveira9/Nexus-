// RN-015 v0.3: validação de valores além do checksum. Uma cópia com checksum certo, mas com valores
// impossíveis (ouro negativo, divisão inexistente, nome fora da RN-019, campo faltando ou sobrando,
// NaN etc.), é tratada como corrompida. Função pura: devolve a lista de problemas (vazia = válido).

import { validarNome, validarSigla } from './clube.ts';
import type { Estado } from './motor.ts';
import {
  DIVISOES,
  INTERVALO_PARTIDA,
  JOGADORES,
  NEGOCIOS,
  NIVEL_INICIAL,
  PARTIDAS_SPLIT,
  TOQUES_MAX_JANELA,
} from './regras.ts';

/** Campos do estado, na ordem do `novoEstado`. Campo a mais ou a menos = save impossível. */
export const CAMPOS_ESTADO: readonly (keyof Estado)[] = [
  'ouro',
  'negocios',
  'visiveis',
  'ouroRun',
  'niveis',
  'div',
  'vitorias',
  'derrotas',
  'melhorDivRun',
  'legado',
  'rng',
  'proxPartida',
  'maior',
  'clube',
  'capitulos',
  'refundacoes',
  'refundacoesPorDiv',
  'titulos',
  'ouroTotal',
  'melhorDivSempre',
  'toques',
  'monoMs',
];

const ehObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const finito = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const naoNegativo = (x: unknown): x is number => finito(x) && x >= 0;
const inteiroEntre = (x: unknown, min: number, max: number): x is number =>
  Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
const listaDe = (x: unknown, tamanho: number, ok: (v: unknown) => boolean) =>
  Array.isArray(x) && x.length === tamanho && x.every(ok);

/**
 * Confere se `x` é um estado possível pelas RN. `siglasProibidas` = siglas dos rivais (RN-019).
 * Não confere coerência histórica fina (ex.: se o ouro bate com as compras): só o que é impossível.
 */
export function validarEstado(x: unknown, siglasProibidas: readonly string[] = []): string[] {
  if (!ehObjeto(x)) return ['estado não é um objeto'];
  const p: string[] = [];
  const chaves = Object.keys(x);
  for (const c of CAMPOS_ESTADO) if (!(c in x)) p.push(`falta o campo ${c}`);
  for (const c of chaves)
    if (!CAMPOS_ESTADO.includes(c as keyof Estado)) p.push(`campo desconhecido ${c}`);
  if (p.length) return p;

  const div = DIVISOES.length - 1;
  const inteiroNaoNeg = (v: unknown) => inteiroEntre(v, 0, Number.MAX_SAFE_INTEGER);
  const confere = (ok: boolean, msg: string) => {
    if (!ok) p.push(msg);
  };

  confere(naoNegativo(x.ouro), 'ouro inválido');
  confere(listaDe(x.negocios, NEGOCIOS.length, inteiroNaoNeg), 'negócios inválidos');
  confere(
    listaDe(x.visiveis, NEGOCIOS.length, (v) => typeof v === 'boolean'),
    'visibilidade inválida',
  );
  confere(naoNegativo(x.ouroRun), 'ouro da run inválido');
  confere(
    listaDe(x.niveis, JOGADORES.length, (v) => inteiroEntre(v, NIVEL_INICIAL, 1e9)),
    'níveis inválidos',
  );
  confere(inteiroEntre(x.div, 0, div), 'divisão inexistente');
  confere(inteiroEntre(x.vitorias, 0, PARTIDAS_SPLIT - 1), 'vitórias inválidas');
  confere(inteiroEntre(x.derrotas, 0, PARTIDAS_SPLIT - 1), 'derrotas inválidas');
  confere(
    Number.isInteger(x.vitorias) &&
      Number.isInteger(x.derrotas) &&
      (x.vitorias as number) + (x.derrotas as number) < PARTIDAS_SPLIT,
    'split com 14 partidas ou mais',
  );
  confere(inteiroEntre(x.melhorDivRun, 0, div), 'melhor divisão da run inexistente');
  confere(inteiroEntre(x.melhorDivSempre, 0, div), 'melhor divisão inexistente');
  confere(
    inteiroEntre(x.div, 0, div) &&
      inteiroEntre(x.melhorDivRun, 0, div) &&
      inteiroEntre(x.melhorDivSempre, 0, div) &&
      x.div <= x.melhorDivRun &&
      x.melhorDivRun <= x.melhorDivSempre,
    'divisões fora de ordem (atual ≤ melhor da run ≤ melhor já alcançada)',
  );
  confere(inteiroNaoNeg(x.legado), 'Legado inválido');
  confere(inteiroEntre(x.rng, 0, 0xffffffff), 'estado do sorteio inválido');
  confere(
    finito(x.proxPartida) && x.proxPartida > 0 && x.proxPartida <= INTERVALO_PARTIDA,
    'relógio de partida fora de (0, 90]',
  );
  confere(naoNegativo(x.maior), 'maior horário inválido');
  confere(inteiroNaoNeg(x.refundacoes), 'refundações inválidas');
  confere(listaDe(x.refundacoesPorDiv, DIVISOES.length, inteiroNaoNeg), 'estatística inválida');
  confere(inteiroNaoNeg(x.titulos), 'títulos inválidos');
  confere(
    naoNegativo(x.ouroTotal) && naoNegativo(x.ouroRun) && x.ouroTotal >= x.ouroRun,
    'ouro total inválido',
  );
  confere(
    Array.isArray(x.capitulos) && x.capitulos.every((c) => typeof c === 'string' && c.length <= 40),
    'capítulos inválidos',
  );
  confere(
    Array.isArray(x.toques) && x.toques.length <= TOQUES_MAX_JANELA && x.toques.every(finito),
    'toques inválidos',
  );
  confere(finito(x.monoMs), 'relógio monotônico inválido');

  const clube = x.clube;
  if (!ehObjeto(clube) || Object.keys(clube).sort().join() !== 'nome,sigla') {
    p.push('clube inválido');
  } else {
    const nome = validarNome(clube.nome as string);
    // O nome salvo já está normalizado: "  A  " no save é impossível.
    confere(nome.ok && nome.nome === clube.nome, 'nome do clube fora da RN-019');
    const sigla = validarSigla(clube.sigla as string, siglasProibidas);
    confere(sigla.ok && sigla.sigla === clube.sigla, 'sigla do clube fora da RN-019');
  }
  return p;
}
