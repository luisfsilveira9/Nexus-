// Simulador headless oficial da economia do Nexus Idle (NX-007).
// Uso: node tools/sim-economia/sim.ts [opções]   (veja o README ao lado)

import {
  DIVISOES,
  type Estado,
  type Evento,
  type Regras,
  aplicarOffline,
  avancarOnline,
  novoEstado,
  poderTime,
  prestigiar,
  renda,
  salvar,
} from './motor.ts';
import { type Modo, comprar, querPrestigiar, toquesNoInstante } from './estrategia.ts';
import { PERFIS, type Perfil } from './perfis.ts';
import { semente } from './rng.ts';
import { formatar } from './formato.ts';

const DIA = 86400;
const PASSO = 5; // o bot compra a cada 5 s, como no modelo do PO

export interface Foto {
  div: string;
  melhorDiv: string;
  renda: number;
  ouro: number;
  legado: number;
  prestigios: number;
  poder: number;
}

export interface Resultado {
  marcos: Record<string, number>; // segundo em que aconteceu
  fotos: Record<string, Foto>;
  maxOuro: number;
  maxRenda: number;
  prestigiosNoFim: number;
  prestigiosPorDiv: number[];
}

const foto = (e: Estado): Foto => ({
  div: DIVISOES[e.div].id,
  melhorDiv: DIVISOES[e.melhorDivSempre].id,
  renda: renda(e),
  ouro: e.ouro,
  legado: e.legado,
  prestigios: e.prestigios,
  poder: poderTime(e),
});

export function rodar(
  perfil: Perfil,
  dias: number,
  sem: number,
  regras: Regras,
  prestigia = true,
  modo: Modo = 'modelo',
): Resultado {
  const fim = dias * DIA;
  const alvos: [number, string][] = [
    [7200, '2h'],
    [DIA, '1d'],
    [7 * DIA, '1sem'],
    [30 * DIA, '30d'],
  ].filter(([s]) => (s as number) <= fim) as [number, string][];
  let e = novoEstado(sem, 0);
  let t = 0;
  let semSubir = 0;
  let maxOuro = 0;
  let maxRenda = 0;
  const marcos: Record<string, number> = {};
  const fotos: Record<string, Foto> = {};

  const marca = (k: string) => {
    if (!(k in marcos)) marcos[k] = t;
  };
  const eventos = (ev: Evento[]) => {
    for (const x of ev) if (x.tipo === 'fimTemporada') semSubir = x.inedita ? 0 : semSubir + 1;
  };
  const depoisDeMudar = () => {
    e = comprar(e);
    for (let d = 1; d < DIVISOES.length; d++) if (e.div >= d) marca(`div${d}`);
    if (prestigia && querPrestigiar(e, semSubir, regras, modo)) {
      marca(`prestigio${e.prestigios + 1}`);
      e = prestigiar(e, regras) as Estado;
      semSubir = 0;
    }
    maxOuro = Math.max(maxOuro, e.ouro);
    maxRenda = Math.max(maxRenda, renda(e));
  };
  const fotografaAte = (ate: number) => {
    for (const [s, nome] of alvos) if (!(nome in fotos) && s <= ate) fotos[nome] = foto(e);
  };

  for (const [on, off] of perfil()) {
    if (t >= fim) break;
    let resta = on;
    while (resta > 0 && t < fim) {
      const passo = Math.min(PASSO, resta, fim - t);
      const r = avancarOnline(e, passo, toquesNoInstante(t));
      e = r.estado;
      t += passo;
      resta -= passo;
      eventos(r.eventos);
      depoisDeMudar();
      fotografaAte(t);
    }
    e = salvar(e, t); // RN-015: salva ao sair/minimizar
    if (t >= fim) break;
    if (off > 0) {
      // Enquanto fora, o estado visível é o do save; o offline só é aplicado ao voltar.
      fotografaAte(Math.min(t + off - 1, fim));
      t += off;
      if (t > fim) break;
      const r = aplicarOffline(e, t, regras);
      e = r.estado;
      eventos(r.resumo.eventos);
      depoisDeMudar();
      fotografaAte(t);
    }
  }
  fotografaAte(fim);
  return {
    marcos,
    fotos,
    maxOuro,
    maxRenda,
    prestigiosNoFim: e.prestigios,
    prestigiosPorDiv: e.prestigiosPorDiv,
  };
}

// ---------- Agregação ----------

/** Mesma mediana do modelo do PO (elemento n/2 da lista ordenada); quem não chegou conta como ∞. */
export const mediana = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

export function tempo(s: number): string {
  if (!Number.isFinite(s)) return 'não chegou';
  const h = s / 3600;
  const v = (x: number) => x.toFixed(1).replace('.', ',');
  return h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${v(h)} h` : `${v(h / 24)} d`;
}

export interface Agregado {
  perfil: string;
  n: number;
  marco: (k: string) => { mediana: number; chegaram: number };
  foto: (k: string) => Foto | undefined;
  prestigiosNoFim: number;
  prestigiosPorDiv: number[];
  maxOuro: number;
  maxRenda: number;
}

export function agregar(
  nome: string,
  dias: number,
  jogadores: number,
  base: number,
  regras: Regras,
  prestigia = true,
  modo: Modo = 'modelo',
): Agregado {
  const rs: Resultado[] = [];
  for (let k = 0; k < jogadores; k++)
    rs.push(rodar(PERFIS[nome], dias, semente(base, k), regras, prestigia, modo));
  const medFoto = (k: string): Foto | undefined => {
    const fs = rs.map((r) => r.fotos[k]).filter(Boolean);
    if (!fs.length) return undefined;
    // Foto do jogador mediano em renda (coerente entre os campos).
    const ord = [...fs].sort((a, b) => a.renda - b.renda);
    const m = ord[Math.floor(ord.length / 2)];
    return { ...m, prestigios: mediana(fs.map((f) => f.prestigios)), legado: mediana(fs.map((f) => f.legado)) };
  };
  return {
    perfil: nome,
    n: jogadores,
    marco: (k) => {
      const xs = rs.map((r) => r.marcos[k] ?? Infinity);
      return { mediana: mediana(xs), chegaram: xs.filter(Number.isFinite).length };
    },
    foto: medFoto,
    prestigiosNoFim: mediana(rs.map((r) => r.prestigiosNoFim)),
    prestigiosPorDiv: [2, 3, 4, 5].map((d) => mediana(rs.map((r) => r.prestigiosPorDiv[d]))),
    maxOuro: mediana(rs.map((r) => r.maxOuro)),
    maxRenda: mediana(rs.map((r) => r.maxRenda)),
  };
}

// ---------- Saída ----------

const NOMES_DIV = ['Amadora', 'Desafiante', 'Academy', 'Liga', 'Internacional', 'Mundial'];

let o_fim = '1sem'; // momento usado na linha "Legado no fim"
function tabelaMarcos(ags: Agregado[]): string {
  const linhas = [
    `| Marco | ${ags.map((a) => a.perfil).join(' | ')} |`,
    `|---|${ags.map(() => '---').join('|')}|`,
  ];
  const cel = (a: Agregado, k: string) => {
    const m = a.marco(k);
    return m.chegaram === a.n ? tempo(m.mediana) : `${tempo(m.mediana)} (${m.chegaram}/${a.n})`;
  };
  for (let d = 1; d < 6; d++) linhas.push(`| ${NOMES_DIV[d]} | ${ags.map((a) => cel(a, `div${d}`)).join(' | ')} |`);
  for (const p of [1, 2, 3, 5, 10]) linhas.push(`| ${p}º prestígio | ${ags.map((a) => cel(a, `prestigio${p}`)).join(' | ')} |`);
  linhas.push(`| Prestígios no fim | ${ags.map((a) => a.prestigiosNoFim).join(' | ')} |`);
  linhas.push(
    `| … por melhor divisão da run (Acad/Liga/Inter/Mund) | ${ags.map((a) => a.prestigiosPorDiv.join('/')).join(' | ')} |`,
  );
  linhas.push(`| Legado no fim | ${ags.map((a) => a.foto(o_fim)?.legado ?? '-').join(' | ')} |`);
  return linhas.join('\n');
}

function tabelaFotos(ags: Agregado[], chaves: string[]): string {
  const linhas = [
    '| Perfil | Momento | Divisão atual | Melhor já alcançada | Renda/s | Ouro | Poder | Legado | Prestígios |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const a of ags)
    for (const k of chaves) {
      const f = a.foto(k);
      if (!f) continue;
      linhas.push(
        `| ${a.perfil} | ${k} | ${f.div} | ${f.melhorDiv} | ${formatar(f.renda)} | ${formatar(f.ouro)} | ${formatar(f.poder)} | ${f.legado} | ${f.prestigios} |`,
      );
    }
  return linhas.join('\n');
}

function tabelaMaximos(ags: Agregado[]): string {
  const linhas = ['| Perfil | Maior ouro | Maior renda/s | > 2^53? |', '|---|---|---|---|'];
  for (const a of ags)
    linhas.push(
      `| ${a.perfil} | ${formatar(a.maxOuro)} (${a.maxOuro.toExponential(2)}) | ${formatar(a.maxRenda)} | ${a.maxOuro > 2 ** 53 ? 'sim' : 'não'} |`,
    );
  return linhas.join('\n');
}

function args() {
  const a = process.argv.slice(2);
  const pega = (k: string, pad: string) => {
    const i = a.indexOf(`--${k}`);
    return i >= 0 && a[i + 1] ? a[i + 1] : pad;
  };
  return {
    dias: Number(pega('dias', '7')),
    jogadores: Number(pega('jogadores', '20')),
    semente: Number(pega('semente', '1')),
    perfis: pega('perfil', 'continuo,tipico,frequente').split(','),
    regras: { legado: pega('legado', 'rn'), offline: pega('offline', 'rn') } as Regras,
    json: a.includes('--json'),
    prestigia: !a.includes('--sem-prestigio'),
    modo: pega('estrategia', 'modelo') as Modo,
  };
}

function main() {
  const o = args();
  for (const p of o.perfis) if (!PERFIS[p]) throw new Error(`perfil desconhecido: ${p}`);
  o_fim = o.dias >= 30 ? '30d' : o.dias >= 7 ? '1sem' : o.dias >= 1 ? '1d' : '2h';
  const t0 = performance.now();
  const ags = o.perfis.map((p) =>
    agregar(p, o.dias, o.jogadores, o.semente, o.regras, o.prestigia, o.modo),
  );
  if (o.json) {
    const out = ags.map((a) => ({
      perfil: a.perfil,
      marcos: Object.fromEntries(
        [1, 2, 3, 4, 5].map((d) => [NOMES_DIV[d], a.marco(`div${d}`)]).concat(
          [1, 2, 3, 5, 10].map((p) => [`prestigio${p}`, a.marco(`prestigio${p}`)]),
        ),
      ),
      fotos: Object.fromEntries(['2h', '1d', '1sem', '30d'].map((k) => [k, a.foto(k)])),
      prestigiosNoFim: a.prestigiosNoFim,
      maxOuro: a.maxOuro,
      maxRenda: a.maxRenda,
    }));
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  const r = o.regras;
  console.log(
    `# Simulação: ${o.dias} dias, ${o.jogadores} jogadores, semente ${o.semente}, legado=${r.legado}, offline=${r.offline}${o.prestigia ? '' : ', sem prestígio'}, estratégia=${o.modo}\n`,
  );
  console.log('## Tempo até cada marco (mediana)\n');
  console.log(tabelaMarcos(ags) + '\n');
  console.log('## Estado do jogador mediano\n');
  console.log(tabelaFotos(ags, ['2h', '1d', '1sem', '30d']) + '\n');
  console.log('## Maiores valores (mediana dos jogadores)\n');
  console.log(tabelaMaximos(ags) + '\n');
  console.log(`_(${((performance.now() - t0) / 1000).toFixed(1)} s)_`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
