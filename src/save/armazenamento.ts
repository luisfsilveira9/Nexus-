// C8 do ADR-002: o save fica atrás da interface `ArmazenamentoSave`. O `localStorage` é só um
// adaptador; os testes usam a versão em memória com falhas simuláveis (`memoria.ts`).

export interface ArmazenamentoSave {
  /** Texto guardado na chave, ou null se não houver. Pode lançar `ErroArmazenamento`. */
  ler(chave: string): string | null;
  /** Grava o texto inteiro. Lança `ErroSemEspaco` se faltar espaço, ou `ErroArmazenamento`. */
  gravar(chave: string, valor: string): void;
}

/** O armazenamento não está acessível (navegador bloqueou, falha de E/S etc.). */
export class ErroArmazenamento extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem, opcoes);
    this.name = 'ErroArmazenamento';
  }
}

/** Falta de espaço (RN-015: mantém o último save válido e avisa). */
export class ErroSemEspaco extends ErroArmazenamento {
  constructor(opcoes?: { cause?: unknown }) {
    super('sem espaço para salvar', opcoes);
    this.name = 'ErroSemEspaco';
  }
}

/** Reconhece o erro de cota cheia dos navegadores (Chrome, Firefox, Safari antigos). */
export function ehErroDeCota(erro: unknown): boolean {
  if (typeof erro !== 'object' || erro === null) return false;
  const { name, code } = erro as { name?: unknown; code?: unknown };
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014
  );
}

/** Interface mínima do `Storage` do navegador que o adaptador usa. */
export interface StorageMinimo {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

/** Adaptador para o `localStorage` (gravação síncrona: garante o save ao minimizar, ADR-002). */
export function armazenamentoLocal(storage: StorageMinimo): ArmazenamentoSave {
  return {
    ler(chave) {
      try {
        return storage.getItem(chave);
      } catch (erro) {
        throw new ErroArmazenamento('não foi possível ler o save', { cause: erro });
      }
    },
    gravar(chave, valor) {
      try {
        storage.setItem(chave, valor);
      } catch (erro) {
        if (ehErroDeCota(erro)) throw new ErroSemEspaco({ cause: erro });
        throw new ErroArmazenamento('não foi possível gravar o save', { cause: erro });
      }
    },
  };
}
