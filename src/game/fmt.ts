// Formatação pt-BR num lugar só: vírgula decimal, ponto de milhar, "k" com vírgula (12,3k). Não misturar com ponto decimal.
const nfs: Record<number, Intl.NumberFormat> = {};
const nf = (d: number) => nfs[d] ??= new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pf = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export const num = (v: number, d = 0) => nf(d).format(v);
export const nota = (v: number) => num(v, 1);
export const brl = (v: number) => 'R$ ' + num(v);
// valores grandes em telas estreitas: "R$ 850 mil", "R$ 1,2 mi"
export const brlCurto = (v: number) => v >= 1e6 ? `R$ ${num(v / 1e6, 1)} mi` : v >= 1e4 ? `R$ ${num(v / 1e3)} mil` : brl(v);
export const pct = (v: number) => pf.format(v);
export const ouroK = (v: number) => num(v / 1000, 1) + 'k';
// KDA = (abates + assistências) / mortes; sem mortes, "Perfeito" em vez de dividir sem avisar
export const kda = (k: number, d: number, a: number) => d ? num((k + a) / d, 1) : 'Perfeito';
