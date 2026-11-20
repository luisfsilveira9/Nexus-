// RN-017: números na tela. Sempre arredonda para baixo (o jogador nunca vê mais do que tem).
// Abaixo de 1.000: inteiro. Depois: 3 algarismos significativos em mil/mi/bi/tri.
// A partir de 1e15 (acima de 999 tri): notação científica com vírgula, ex. 1,23e15.

const UNIDADES: readonly [number, string][] = [
  [1e12, 'tri'],
  [1e9, 'bi'],
  [1e6, 'mi'],
  [1e3, 'mil'],
];

// Folga relativa para o floor não errar por resíduo binário (1,23 × 100 = 122,999…).
const FOLGA = 1 + 1e-12;

function tresAlgarismos(x: number): string {
  const casas = x < 10 ? 2 : x < 100 ? 1 : 0;
  const f = 10 ** casas;
  const teto = 10 ** (3 - casas) - 1 / f; // 9,99 · 99,9 · 999
  const y = Math.min(Math.floor(x * f * FOLGA) / f, teto);
  return y.toFixed(casas).replace('.', ',');
}

export function formatar(v: number): string {
  if (Number.isNaN(v)) return '?';
  if (v === Infinity) return '∞';
  if (v < 0) return '-' + formatar(-v); // não deveria ocorrer (RN-001)
  if (v < 1000) return String(Math.min(999, Math.floor(v * FOLGA)));
  if (v < 1e15) {
    for (const [u, nome] of UNIDADES) if (v >= u) return `${tresAlgarismos(v / u)} ${nome}`;
  }
  let exp = Math.floor(Math.log10(v));
  let m = v / 10 ** exp;
  if (m >= 10) {
    m /= 10;
    exp++;
  } else if (m < 1) {
    m *= 10;
    exp--;
  }
  const mm = Math.min(Math.floor(m * 100 * FOLGA) / 100, 9.99);
  return `${mm.toFixed(2).replace('.', ',')}e${exp}`;
}
