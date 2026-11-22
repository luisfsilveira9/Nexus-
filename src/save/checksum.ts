// Checksum FNV-1a de 32 bits (ADR-002), sobre os bytes UTF-8 do texto. Detecta save truncado,
// bytes trocados e edição à mão. Não é proteção contra quem refaz o checksum: para isso há a
// validação de valores (RN-015 v0.3, src/engine/validacao.ts).

const codificador = new TextEncoder();

export function fnv1a(texto: string): string {
  let h = 0x811c9dc5;
  for (const byte of codificador.encode(texto)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
