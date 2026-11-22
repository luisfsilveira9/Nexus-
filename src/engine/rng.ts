// Origem: tools/sim-economia/rng.ts (NX-007), movido para src/engine/ na NX-015.
// Sorteio determinístico com estado de 32 bits (mulberry32). O estado vai no save (RN-009):
// o mesmo save sempre dá o mesmo resultado. Função pura: recebe o estado, devolve [valor, novo estado].

export function sortear(estado: number): [number, number] {
  const t = (estado + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

/** Mistura semente base e índice do jogador simulado numa semente de 32 bits. */
export function semente(base: number, indice: number): number {
  let h = (Math.imul(base ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(indice + 1, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}
