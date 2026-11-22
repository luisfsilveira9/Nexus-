// RN-017 v0.2: números na tela.
// < 100: 1 casa decimal, sem zero final (0,5 · 10,5 · 11 · 99,9).
// 100 a < 1.000: inteiro.
// 1.000 a < 10¹⁵: 3 algarismos significativos com zeros finais, espaço e unidade (1,00 mil · 999 tri).
// ≥ 10¹⁵: mantissa com 3 algarismos, "e" e expoente (1,00e15).
// Direção: 'baixo' para ouro, renda/s, poder e ganhos; 'cima' para custos e "Faltam X".
// Se o arredondamento para cima passar do limite da faixa, o número vai para a faixa seguinte
// (99,95 → "100"; 999,2 → "1,00 mil"): nenhuma faixa mostra "1.000 mil".

export type Direcao = 'baixo' | 'cima';

const UNIDADES: readonly [number, string][] = [
  [1e12, 'tri'],
  [1e9, 'bi'],
  [1e6, 'mi'],
  [1e3, 'mil'],
];

// Folga relativa para o arredondamento não errar por resíduo binário (10 × 1,15 = 11,4999…98).
const FOLGA = 1e-12;

/** Arredonda x × escala para inteiro na direção pedida, com a folga acima. */
function arred(x: number, escala: number, dir: Direcao): number {
  const y = x * escala;
  return dir === 'baixo' ? Math.floor(y * (1 + FOLGA)) : Math.ceil(y * (1 - FOLGA));
}

const virgula = (s: string) => s.replace('.', ',');

export function formatar(v: number, dir: Direcao = 'baixo'): string {
  if (Number.isNaN(v)) return '?';
  if (v === Infinity) return '∞';
  if (v < 0) return '-' + formatar(-v, dir); // não deveria ocorrer (RN-001)

  if (v < 100) {
    const d = arred(v, 10, dir); // décimos
    if (d >= 1000) return formatar(100, dir);
    return d % 10 === 0 ? String(d / 10) : virgula((d / 10).toFixed(1));
  }
  if (v < 1000) {
    const i = arred(v, 1, dir);
    if (i >= 1000) return formatar(1000, dir);
    return String(i);
  }
  if (v < 1e15) {
    for (let u = 0; u < UNIDADES.length; u++) {
      const [base, nome] = UNIDADES[u];
      if (v < base) continue;
      const x = v / base; // 1 ≤ x < 1000
      const casas = x < 10 ? 2 : x < 100 ? 1 : 0;
      const k = arred(x, 10 ** casas, dir);
      // Passou para a próxima casa (9,995 → 10,0) ou para a próxima unidade (999,5 → 1,00): formata
      // o valor já arredondado, que é exato.
      if (k >= 10 ** 3) return formatar(10 ** (3 - casas) * base, dir);
      return `${virgula((k / 10 ** casas).toFixed(casas))} ${nome}`;
    }
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
  const k = arred(m, 100, dir);
  if (k >= 1000) return `1,00e${exp + 1}`;
  return `${virgula((k / 100).toFixed(2))}e${exp}`;
}

/** RN-017: porcentagem inteira, arredondada ao mais próximo (0,7685 → "77%"). */
export const formatarPct = (p: number) => `${Math.round(p * 100)}%`;
