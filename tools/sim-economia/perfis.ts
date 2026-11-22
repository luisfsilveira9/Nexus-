// Perfis de sessão: sequência infinita de [segundos com o app aberto, segundos fora].
// "contínuo" e "típico" reproduzem exatamente os do modelo do PO (modelo-economia-v0.1.py).
// Todos os períodos fora são múltiplos de 90 s (ver --desvio-off em sim.ts).

export type Perfil = () => Generator<[number, number]>;

const H = 3600;

/** App aberto o tempo todo. */
function* continuo(): Generator<[number, number]> {
  for (;;) yield [H, 0];
}

/** Dia 1: 2 h seguidas e 3 h fora; depois 5 × (3 min + 3 h fora) e 1 × (3 min + 8 h de sono). */
function* tipico(): Generator<[number, number]> {
  yield [2 * H, 3 * H];
  for (;;) {
    for (let k = 0; k < 5; k++) yield [180, 3 * H];
    yield [180, 8 * H];
  }
}

/**
 * NX-007: sessões de 3 min a cada 1 h (início a início), com 8 h de sono.
 * Mesmo dia 1 do "típico" (2 h seguidas) para isolar o efeito da frequência.
 * Dia = 15 × (3 min + 57 min fora) + 1 × (3 min + 8 h) = 23 h 03 min, como o típico (23 h 15 min).
 */
function* frequente(): Generator<[number, number]> {
  yield [2 * H, H - 180];
  for (;;) {
    for (let k = 0; k < 15; k++) yield [180, H - 180];
    yield [180, 8 * H];
  }
}

export const PERFIS: Record<string, Perfil> = { continuo, tipico, frequente };
