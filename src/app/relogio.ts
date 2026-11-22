// C2 do ADR-002: os dois relógios ficam atrás da interface `Relogio` e são injetados no jogo.
// - parede: ms desde 1970 (UTC), só para o tempo fora (RN-011, RN-012);
// - monotônico: ms desde o início da página, para a renda online, os toques e as partidas.
// Este é o ÚNICO lugar do jogo que lê `Date.now()` e `performance.now()`.

export interface Relogio {
  paredeMs(): number;
  monotonicoMs(): number;
}

export function relogioReal(): Relogio {
  return {
    paredeMs: () => Date.now(),
    monotonicoMs: () => performance.now(),
  };
}

/** Relógio controlado à mão, para os testes. */
export interface RelogioFalso extends Relogio {
  avancar(ms: number): void;
  /** Muda só o relógio de parede (simula adiantar/atrasar o relógio do aparelho). */
  definirParede(ms: number): void;
  /** Nova página: o monotônico recomeça perto de zero. */
  reiniciarMonotonico(): void;
}

export function relogioFalso(paredeInicialMs = 1_800_000_000_000, monoInicialMs = 0): RelogioFalso {
  let parede = paredeInicialMs;
  let mono = monoInicialMs;
  return {
    paredeMs: () => parede,
    monotonicoMs: () => mono,
    avancar(ms) {
      parede += ms;
      mono += ms;
    },
    definirParede(ms) {
      parede = ms;
    },
    reiniciarMonotonico() {
      mono = 0;
    },
  };
}
