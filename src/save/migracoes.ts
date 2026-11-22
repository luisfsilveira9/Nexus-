// Migrações de save, uma função por versão (ADR-002; ideia do legado, docs/legado/referencia/
// modo-cartas.md). `MIGRACOES[n]` leva o estado da versão n para a n + 1.
//
// Regra para quem mudar o formato do estado:
//   1. suba SAVE_VERSION;
//   2. escreva MIGRACOES[versão antiga] (pura, sem perder campo);
//   3. guarde uma fixture da versão antiga e um teste que a migra (CT-510).
// Exemplo esperado: a T14 (Ajustes) vai criar o campo de configurações → versão 2.

/** Versão atual do formato do save. */
export const SAVE_VERSION = 1;

export type Migracao = (estado: unknown) => unknown;

export const MIGRACOES: Readonly<Record<number, Migracao>> = {};

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
