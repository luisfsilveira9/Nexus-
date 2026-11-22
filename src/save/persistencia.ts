// ADR-002 / RN-015: pede ao navegador armazenamento persistente (`navigator.storage.persist()`), para
// o save não ser apagado em limpeza automática. Se for negado, o jogo deve sugerir exportar (CT-540).

export type EstadoPersistencia = 'persistente' | 'negado' | 'indisponivel';

/** Parte de `navigator.storage` que usamos (injetável nos testes). */
export interface StorageManagerMinimo {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}

export async function pedirPersistencia(
  storage: StorageManagerMinimo | undefined,
): Promise<EstadoPersistencia> {
  if (!storage || typeof storage.persist !== 'function') return 'indisponivel';
  try {
    if (typeof storage.persisted === 'function' && (await storage.persisted()))
      return 'persistente';
    return (await storage.persist()) ? 'persistente' : 'negado';
  } catch {
    return 'indisponivel';
  }
}
