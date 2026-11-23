// Migrações de save, uma função por versão (ADR-002; ideia do legado, docs/legado/referencia/
// modo-cartas.md). `MIGRACOES[n]` leva o estado da versão n para a n + 1.
//
// Regra para quem mudar o formato do estado:
//   1. suba SAVE_VERSION;
//   2. escreva MIGRACOES[versão antiga] (pura, sem perder campo);
//   3. guarde uma fixture da versão antiga e um teste que a migra (CT-510).
// Histórico:
//   1 → 2 (NX-010): entra `negociosVistos` (selo "Novo" da aba Negócios). Quem já jogava não vê
//   "Novo" nos negócios que já estavam visíveis: começa igual a `visiveis`.

/** Versão atual do formato do save. */
export const SAVE_VERSION = 2;

export type Migracao = (estado: unknown) => unknown;

const objeto = (x: unknown): Record<string, unknown> => {
  if (typeof x !== 'object' || x === null || Array.isArray(x))
    throw new ErroMigracao('o estado não é um objeto');
  return x as Record<string, unknown>;
};

export const MIGRACOES: Readonly<Record<number, Migracao>> = {
  1: (x) => {
    const e = objeto(x);
    if (!Array.isArray(e.visiveis)) throw new ErroMigracao('save v1 sem `visiveis`');
    // Mantém a ordem dos campos do `novoEstado` (visiveis, negociosVistos, ouroRun…).
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(e)) {
      saida[k] = v;
      if (k === 'visiveis') saida.negociosVistos = [...e.visiveis];
    }
    return saida;
  },
};

export class ErroMigracao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroMigracao';
  }
}

/** Aplica as migrações em ordem, de `de` até `para`. Lança `ErroMigracao` se faltar um passo. */
export function migrar(
  estado: unknown,
  de: number,
  para: number = SAVE_VERSION,
  tabela: Readonly<Record<number, Migracao>> = MIGRACOES,
): unknown {
  if (de > para) throw new ErroMigracao(`save da versão ${de} é mais novo que o jogo (${para})`);
  let x = estado;
  for (let v = de; v < para; v++) {
    const m = tabela[v];
    if (!m) throw new ErroMigracao(`falta a migração da versão ${v} para a ${v + 1}`);
    x = m(x);
  }
  return x;
}
