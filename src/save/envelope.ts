// Formato do save (ADR-002): JSON `{ app, saveVersion, seq, salvoEm, estado, checksum }`.
// - `checksum` = FNV-1a do JSON de `{ app, saveVersion, seq, salvoEm, estado }`, nessa ordem.
// - `seq` cresce a cada gravação e decide qual cópia é a mais nova (o horário de parede pode voltar).
// - `salvoEm` = relógio de parede da gravação, em ms desde 1970 (UTC). Só informativo (T12a).
// O mesmo texto serve para os slots do localStorage e para exportar/importar (RN-015).

import type { Estado } from '../engine/motor.ts';
import { validarEstado } from '../engine/validacao.ts';
import { SIGLAS_RIVAIS } from '../content/rivais.ts';
import { fnv1a } from './checksum.ts';
import { ErroMigracao, MIGRACOES, type Migracao, SAVE_VERSION, migrar } from './migracoes.ts';

export const APP_ID = 'nexus-idle';

export interface Envelope {
  app: string;
  saveVersion: number;
  seq: number;
  salvoEm: number;
  estado: Estado;
  checksum: string;
}

const corpo = (
  app: unknown,
  saveVersion: unknown,
  seq: unknown,
  salvoEm: unknown,
  estado: unknown,
) => JSON.stringify({ app, saveVersion, seq, salvoEm, estado });

export function serializar(estado: Estado, seq: number, salvoEm: number): string {
  const checksum = fnv1a(corpo(APP_ID, SAVE_VERSION, seq, salvoEm, estado));
  const env: Envelope = { app: APP_ID, saveVersion: SAVE_VERSION, seq, salvoEm, estado, checksum };
  return JSON.stringify(env);
}

/**
 * Por que uma cópia não serve:
 * - `vazio`: texto vazio; `ilegivel`: não é JSON ou falta a estrutura do envelope;
 * - `outroApp`: JSON de outro programa; `checksum`: não confere (truncado, editado à mão);
 * - `versaoFutura`: `saveVersion` maior que a do jogo (recusado, nunca apagado);
 * - `migracao`: falhou ao migrar de uma versão antiga; `valores`: valores impossíveis (RN-015).
 */
export type MotivoInvalido =
  'vazio' | 'ilegivel' | 'outroApp' | 'checksum' | 'versaoFutura' | 'migracao' | 'valores';

export type Leitura =
  | { ok: true; estado: Estado; seq: number; salvoEm: number; versaoOriginal: number }
  | { ok: false; motivo: MotivoInvalido; detalhes: string[]; seq?: number };

export interface OpcoesLeitura {
  versaoAtual?: number;
  migracoes?: Readonly<Record<number, Migracao>>;
  siglasProibidas?: readonly string[];
}

const falha = (motivo: MotivoInvalido, detalhes: string[] = [], seq?: number): Leitura => ({
  ok: false,
  motivo,
  detalhes,
  ...(seq === undefined ? {} : { seq }),
});

/** Lê e confere uma cópia do save (ou um texto importado). Nunca lança. */
export function lerTexto(texto: string | null, opcoes: OpcoesLeitura = {}): Leitura {
  const versaoAtual = opcoes.versaoAtual ?? SAVE_VERSION;
  if (texto === null || texto.trim() === '') return falha('vazio');
  let x: unknown;
  try {
    x = JSON.parse(texto);
  } catch {
    return falha('ilegivel');
  }
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return falha('ilegivel');
  const env = x as Record<string, unknown>;
  if (env.app !== APP_ID) return falha('outroApp');
  const { saveVersion, seq, salvoEm, estado, checksum } = env;
  if (!Number.isInteger(saveVersion) || (saveVersion as number) < 1) return falha('ilegivel');
  const seqOk = Number.isInteger(seq) && (seq as number) >= 0 ? (seq as number) : undefined;
  if ((saveVersion as number) > versaoAtual)
    return falha('versaoFutura', [`versão ${saveVersion}`], seqOk);
  if (typeof checksum !== 'string' || seqOk === undefined || typeof salvoEm !== 'number')
    return falha('ilegivel', [], seqOk);
  if (fnv1a(corpo(env.app, saveVersion, seq, salvoEm, estado)) !== checksum)
    return falha('checksum', [], seqOk);

  let migrado: unknown;
  try {
    migrado = migrar(estado, saveVersion as number, versaoAtual, opcoes.migracoes ?? MIGRACOES);
  } catch (erro) {
    return falha('migracao', [erro instanceof ErroMigracao ? erro.message : String(erro)], seqOk);
  }
  const problemas = validarEstado(migrado, opcoes.siglasProibidas ?? SIGLAS_RIVAIS);
  if (problemas.length) return falha('valores', problemas, seqOk);
  return {
    ok: true,
    estado: migrado as Estado,
    seq: seqOk,
    salvoEm,
    versaoOriginal: saveVersion as number,
  };
}
