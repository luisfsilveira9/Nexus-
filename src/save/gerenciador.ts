// RN-015 v0.3: save com 2 cópias alternadas (slots A e B), checksum e validação de valores.
// - Gravação: sempre no slot que NÃO guarda o último save bom. Se a gravação falhar (sem espaço ou
//   no meio), o save bom continua intacto na outra cópia e a próxima tentativa vai no mesmo slot.
// - Todo save atualiza `maior` (RN-012) antes de gravar.
// - Carga: vale a cópia válida com o maior `seq`. Se a outra cópia existir e estiver ilegível (e não
//   der para provar que é mais velha), o jogo avisa (T12a). O texto ilegível é guardado à parte antes
//   de qualquer gravação por cima (nunca apaga sem confirmação).
// - Nenhuma cópia válida: nada é gravado até o jogador escolher "Tentar de novo" ou "Começar clube
//   novo" (que guarda as cópias ilegíveis para exportar).
// - Duas abas: não há bloqueio; a gravação com `seq` maior vence (CT-516, documentado no relatório).

import { type Estado, salvar as atualizarMaior } from '../engine/motor.ts';
import { type ArmazenamentoSave, ErroSemEspaco } from './armazenamento.ts';
import { APP_ID, type Leitura, type MotivoInvalido, lerTexto, serializar } from './envelope.ts';

export const CHAVES = {
  A: 'nexus-idle:save:A',
  B: 'nexus-idle:save:B',
  /** Cópias ilegíveis guardadas para exportar (T12b, T14). */
  ilegivel: 'nexus-idle:save:ilegivel',
} as const;

export type Slot = 'A' | 'B';

export interface CopiasCruas {
  A: string | null;
  B: string | null;
}

export type ResultadoCarga =
  /** Nenhum save: clube novo. */
  | { tipo: 'novo' }
  | { tipo: 'ok'; estado: Estado; salvoEm: number }
  /** A cópia mais nova não abriu; a outra sim (T12a, antes de qualquer outra tela). */
  | { tipo: 'recuperado'; estado: Estado; salvoEm: number; slotRuim: Slot; motivo: MotivoInvalido }
  /** Nenhuma cópia válida (T12b). `versaoFutura`: alguma cópia é de uma versão mais nova do jogo. */
  | {
      tipo: 'nenhumValido';
      copias: CopiasCruas;
      motivos: { A: MotivoInvalido | null; B: MotivoInvalido | null };
      versaoFutura: boolean;
      erroLeitura: boolean;
    };

export type ResultadoGravacao =
  | { ok: true; estado: Estado; salvoEm: number }
  | { ok: false; estado: Estado; motivo: 'semEspaco' | 'falha' | 'bloqueado' };

export type ResultadoImportacao =
  | { ok: true; estado: Estado; salvoEm: number }
  | { ok: false; motivo: MotivoInvalido | 'semEspaco' | 'falha' };

const outro = (s: Slot): Slot => (s === 'A' ? 'B' : 'A');

export interface GerenciadorSave {
  carregar(): ResultadoCarga;
  /** Atualiza `maior` (RN-012) e grava no próximo slot. Devolve o estado com `maior` atualizado. */
  salvar(estado: Estado, paredeMs: number): ResultadoGravacao;
  /** Depois de "Começar clube novo" confirmado: guarda as cópias ilegíveis e libera a gravação. */
  descartarIlegiveis(): boolean;
  /** Texto das cópias ilegíveis guardadas (para exportar), ou null. */
  ilegivelGuardado(): string | null;
  /** Texto para exportar as cópias cruas que não abriram (T12b). */
  exportarIlegiveis(copias: CopiasCruas, paredeMs: number): string;
  /** Texto para exportar o save atual (RN-015). */
  exportar(estado: Estado, paredeMs: number): string;
  /** Confere um texto colado, sem gravar nada (T17: prévia). Versão mais nova = `versaoFutura`. */
  conferirImportacao(texto: string): Leitura;
  /**
   * Grava o save importado como o atual (depois da confirmação do jogador). Mantém o `maior` do
   * save importado: o jogo reabre pela abertura normal e conta o t_off a partir dele (RN-015).
   */
  importar(texto: string): ResultadoImportacao;
  /** Quando foi o último save gravado com sucesso (ms de parede), ou null. */
  ultimoSalvoEm(): number | null;
}

export function criarGerenciadorSave(arm: ArmazenamentoSave): GerenciadorSave {
  let seq = 0;
  /** Slot com o último save bom (o próximo vai no outro). */
  let slotBom: Slot | null = null;
  let bloqueado = false;
  let salvoEm: number | null = null;

  const lerSeguro = (chave: string): { texto: string | null; erro: boolean } => {
    try {
      return { texto: arm.ler(chave), erro: false };
    } catch {
      return { texto: null, erro: true };
    }
  };

  /** Guarda as cópias ilegíveis à parte (não sobrescreve um guardado anterior com nada). */
  const guardarIlegiveis = (copias: CopiasCruas, motivo: string): boolean => {
    if (copias.A === null && copias.B === null) return true;
    try {
      const anterior = lerSeguro(CHAVES.ilegivel).texto;
      const lista: unknown[] = [];
      if (anterior) {
        try {
          const x = JSON.parse(anterior) as { copias?: unknown[] };
          if (Array.isArray(x.copias)) lista.push(...x.copias);
        } catch {
          lista.push(anterior);
        }
      }
      lista.push({ motivo, ...copias });
      arm.gravar(CHAVES.ilegivel, JSON.stringify({ app: APP_ID, tipo: 'ilegivel', copias: lista }));
      return true;
    } catch {
      return false;
    }
  };

  const gravar = (estado: Estado, quando: number): ResultadoGravacao => {
    if (bloqueado) return { ok: false, estado, motivo: 'bloqueado' };
    const destino: Slot = slotBom ? outro(slotBom) : 'A';
    const texto = serializar(estado, seq + 1, quando);
    try {
      arm.gravar(CHAVES[destino], texto);
    } catch (erro) {
      return { ok: false, estado, motivo: erro instanceof ErroSemEspaco ? 'semEspaco' : 'falha' };
    }
    seq += 1;
    slotBom = destino;
    salvoEm = quando;
    return { ok: true, estado, salvoEm: quando };
  };

  return {
    carregar() {
      const a = lerSeguro(CHAVES.A);
      const b = lerSeguro(CHAVES.B);
      const copias: CopiasCruas = { A: a.texto, B: b.texto };
      const erroLeitura = a.erro || b.erro;
      if (!erroLeitura && a.texto === null && b.texto === null) {
        seq = 0;
        slotBom = null;
        bloqueado = false;
        salvoEm = null;
        return { tipo: 'novo' };
      }
      const la = a.texto === null ? null : lerTexto(a.texto);
      const lb = b.texto === null ? null : lerTexto(b.texto);
      const validos = (
        [
          ['A', la],
          ['B', lb],
        ] as const
      ).filter((x): x is readonly [Slot, Extract<Leitura, { ok: true }>] => x[1]?.ok === true);

      const motivo = (l: Leitura | null) => (l && !l.ok ? l.motivo : null);
      const versaoFutura = motivo(la) === 'versaoFutura' || motivo(lb) === 'versaoFutura';
      // Sem cópia válida, ou com uma cópia de versão mais nova do jogo (CT-511: não carrega a mais
      // velha por cima dela, não apaga e avisa): nada é gravado até o jogador decidir.
      if (validos.length === 0 || versaoFutura) {
        bloqueado = true;
        return {
          tipo: 'nenhumValido',
          copias,
          motivos: { A: motivo(la), B: motivo(lb) },
          versaoFutura,
          erroLeitura,
        };
      }

      const [slot, leitura] = validos.reduce((m, x) => (x[1].seq > m[1].seq ? x : m));
      seq = leitura.seq;
      slotBom = slot;
      bloqueado = false;
      salvoEm = leitura.salvoEm;
      const lo = slot === 'A' ? lb : la;
      if (lo === null || lo.ok)
        return { tipo: 'ok', estado: leitura.estado, salvoEm: leitura.salvoEm };

      // A outra cópia existe e não abre. Guarda o texto antes que a próxima gravação o substitua.
      guardarIlegiveis(
        { A: slot === 'A' ? null : copias.A, B: slot === 'B' ? null : copias.B },
        lo.motivo,
      );
      // Se o seq da cópia ruim provar que ela é mais velha, o save atual está bom: sem aviso.
      if (lo.seq !== undefined && lo.seq < leitura.seq)
        return { tipo: 'ok', estado: leitura.estado, salvoEm: leitura.salvoEm };
      return {
        tipo: 'recuperado',
        estado: leitura.estado,
        salvoEm: leitura.salvoEm,
        slotRuim: outro(slot),
        motivo: lo.motivo,
      };
    },

    salvar(estado, paredeMs) {
      return gravar(atualizarMaior(estado, paredeMs / 1000), paredeMs);
    },

    descartarIlegiveis() {
      const a = lerSeguro(CHAVES.A).texto;
      const b = lerSeguro(CHAVES.B).texto;
      if (!guardarIlegiveis({ A: a, B: b }, 'comecarNovo')) return false;
      bloqueado = false;
      seq = 0;
      slotBom = null;
      return true;
    },

    ilegivelGuardado() {
      return lerSeguro(CHAVES.ilegivel).texto;
    },

    exportarIlegiveis(copias, paredeMs) {
      return JSON.stringify({
        app: APP_ID,
        tipo: 'ilegivel',
        exportadoEm: paredeMs,
        copias: [copias],
      });
    },

    exportar(estado, paredeMs) {
      return serializar(estado, seq, paredeMs);
    },

    conferirImportacao(texto) {
      return lerTexto(texto);
    },

    importar(texto) {
      const l = lerTexto(texto);
      if (!l.ok) return { ok: false, motivo: l.motivo };
      bloqueado = false;
      const r = gravar(l.estado, l.salvoEm);
      if (!r.ok) return { ok: false, motivo: r.motivo === 'semEspaco' ? 'semEspaco' : 'falha' };
      return { ok: true, estado: l.estado, salvoEm: l.salvoEm };
    },

    ultimoSalvoEm() {
      return salvoEm;
    },
  };
}
