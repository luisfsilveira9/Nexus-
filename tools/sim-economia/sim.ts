// Simulador headless oficial da economia do Nexus Idle (NX-007, NX-008; na NX-015 passou a usar o
// motor do jogo, de src/engine/, sem as variantes de comparação com a v0.1).
// Uso: npm run sim:economia -- [opções]   (veja o README ao lado)

import { DIVISOES } from '../../src/engine/regras.ts';
import {
  type Estado,
  type Evento,
  aplicarOffline,
  avancarOnline,
  novoEstado,
  poderTime,
  refundar,
  renda,
  salvar,
} from '../../src/engine/motor.ts';
import { semente } from '../../src/engine/rng.ts';
import { formatar } from '../../src/engine/formato.ts';
import { type Modo, comprar, querRefundar, toquesNoInstante } from './estrategia.ts';
import { PERFIS, type Perfil } from './perfis.ts';

const DIA = 86400;
const PASSO = 5; // o bot compra a cada 5 s, como no modelo do PO

export interface Foto {
  div: string;
  melhorDiv: string;
  renda: number;
  ouro: number;
  legado: number;
  refundacoes: number;
  poder: number;
}

export interface Resultado {
  marcos: Record<string, number>; // segundo em que aconteceu
  fotos: Record<string, Foto>;
  maxOuro: number;
  maxRenda: number;
  refundacoesNoFim: number;
  refundacoesPorDiv: number[];
  titulosNoFim: number;
}

const foto = (e: Estado): Foto => ({
  div: NOMES_DIV[e.div],
  melhorDiv: NOMES_DIV[e.melhorDivSempre],
  renda: renda(e),
  ouro: e.ouro,
  legado: e.legado,
  refundacoes: e.refundacoes,
  poder: poderTime(e),
});

/** Só para medir sensibilidade (relatório NX-008). Não mudam regra nenhuma. */
export interface Ajustes {
  /** Segundos somados a cada período fora (os perfis usam múltiplos de 90 s). */
  desvioOff?: number;
  /** O bot também considera negócios ainda invisíveis (comportamento da NX-007). */
  botVeTudo?: boolean;
}

export function rodar(
  perfil: Perfil,
  dias: number,
  sem: number,
  refunda = true,
  modo: Modo = 'modelo',
  ajustes: Ajustes = {},
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
    for (const x of ev)
      if (x.tipo === 'fimSplit') {
        semSubir = x.inedita ? 0 : semSubir + 1;
        if (x.resultado === 'campeao') marca(`titulo${e.titulos}`);
      }
  };
  const depoisDeMudar = () => {
    e = comprar(e, ajustes.botVeTudo, modo);
    for (let d = 1; d < DIVISOES.length; d++) if (e.div >= d) marca(`div${d}`);
    if (refunda && querRefundar(e, semSubir, modo)) {
      marca(`refundacao${e.refundacoes + 1}`);
      e = refundar(e) as Estado;
      semSubir = 0;
    }
    maxOuro = Math.max(maxOuro, e.ouro);
    maxRenda = Math.max(maxRenda, renda(e));
  };
  const fotografaAte = (ate: number) => {
    for (const [s, nome] of alvos) if (!(nome in fotos) && s <= ate) fotos[nome] = foto(e);
  };

  for (const [on, off0] of perfil()) {
    const off = off0 > 0 ? off0 + (ajustes.desvioOff ?? 0) : 0;
    if (t >= fim) break;
    let resta = on;
    while (resta > 0 && t < fim) {
      const passo = Math.min(PASSO, resta, fim - t);
      const r = avancarOnline(e, passo, { toquesPorSegundo: toquesNoInstante(t) });
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
      const r = aplicarOffline(e, t);
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
    refundacoesNoFim: e.refundacoes,
    refundacoesPorDiv: e.refundacoesPorDiv,
    titulosNoFim: e.titulos,
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
  refundacoesNoFim: number;
  refundacoesPorDiv: number[];
  titulosNoFim: number;
  maxOuro: number;
  maxRenda: number;
}

export function agregar(
  nome: string,
  dias: number,
  jogadores: number,
  base: number,
  refunda = true,
  modo: Modo = 'modelo',
  ajustes: Ajustes = {},
): Agregado {
  const rs: Resultado[] = [];
  for (let k = 0; k < jogadores; k++)
    rs.push(rodar(PERFIS[nome], dias, semente(base, k), refunda, modo, ajustes));
  const medFoto = (k: string): Foto | undefined => {
    const fs = rs.map((r) => r.fotos[k]).filter(Boolean);
    if (!fs.length) return undefined;
    // Foto do jogador mediano em renda (coerente entre os campos).
    const ord = [...fs].sort((a, b) => a.renda - b.renda);
    const m = ord[Math.floor(ord.length / 2)];
    return {
      ...m,
      refundacoes: mediana(fs.map((f) => f.refundacoes)),
      legado: mediana(fs.map((f) => f.legado)),
    };
  };
  return {
    perfil: nome,
    n: jogadores,
    marco: (k) => {
      const xs = rs.map((r) => r.marcos[k] ?? Infinity);
      return { mediana: mediana(xs), chegaram: xs.filter(Number.isFinite).length };
    },
    foto: medFoto,
    refundacoesNoFim: mediana(rs.map((r) => r.refundacoesNoFim)),
    refundacoesPorDiv: [2, 3, 4, 5].map((d) => mediana(rs.map((r) => r.refundacoesPorDiv[d]))),
    titulosNoFim: mediana(rs.map((r) => r.titulosNoFim)),
    maxOuro: mediana(rs.map((r) => r.maxOuro)),
    maxRenda: mediana(rs.map((r) => r.maxRenda)),
  };
}

// ---------- Saída ----------

// Nomes curtos finais (docs/lore/nomes-do-jogo.md §1). Só para a saída desta ferramenta; no jogo os
// textos vêm de src/content/.
const NOMES_DIV = ['Várzea', 'Acesso', 'Ascensão', 'Elite', 'Continental', 'Mundial'];

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
  for (let d = 1; d < 6; d++)
    linhas.push(`| ${NOMES_DIV[d]} | ${ags.map((a) => cel(a, `div${d}`)).join(' | ')} |`);
  linhas.push(`| 1º título mundial | ${ags.map((a) => cel(a, 'titulo1')).join(' | ')} |`);
  for (const p of [1, 2, 3, 5, 10])
    linhas.push(`| ${p}ª refundação | ${ags.map((a) => cel(a, `refundacao${p}`)).join(' | ')} |`);
  linhas.push(`| Refundações no fim | ${ags.map((a) => a.refundacoesNoFim).join(' | ')} |`);
  linhas.push(
    `| … por melhor divisão da run (Asc/Elite/Cont/Mund) | ${ags.map((a) => a.refundacoesPorDiv.join('/')).join(' | ')} |`,
  );
  linhas.push(`| Títulos mundiais no fim | ${ags.map((a) => a.titulosNoFim).join(' | ')} |`);
  linhas.push(`| Legado no fim | ${ags.map((a) => a.foto(o_fim)?.legado ?? '-').join(' | ')} |`);
  return linhas.join('\n');
}

function tabelaFotos(ags: Agregado[], chaves: string[]): string {
  const linhas = [
    '| Perfil | Momento | Divisão atual | Melhor já alcançada | Renda/s | Ouro | Poder | Legado | Refundações |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const a of ags)
    for (const k of chaves) {
      const f = a.foto(k);
      if (!f) continue;
      linhas.push(
        `| ${a.perfil} | ${k} | ${f.div} | ${f.melhorDiv} | ${formatar(f.renda)} | ${formatar(f.ouro)} | ${formatar(f.poder)} | ${f.legado} | ${f.refundacoes} |`,
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
    json: a.includes('--json'),
    refunda: !a.includes('--sem-refundacao'),
    ajustes: {
      desvioOff: Number(pega('desvio-off', '0')),
      botVeTudo: a.includes('--bot-ve-tudo'),
    } as Ajustes,
    modo: pega('estrategia', 'modelo') as Modo,
  };
}

function main() {
  const o = args();
  for (const p of o.perfis) if (!PERFIS[p]) throw new Error(`perfil desconhecido: ${p}`);
  o_fim = o.dias >= 30 ? '30d' : o.dias >= 7 ? '1sem' : o.dias >= 1 ? '1d' : '2h';
  const t0 = performance.now();
  const ags = o.perfis.map((p) =>
    agregar(p, o.dias, o.jogadores, o.semente, o.refunda, o.modo, o.ajustes),
  );
  if (o.json) {
    const out = ags.map((a) => ({
      perfil: a.perfil,
      marcos: Object.fromEntries(
        [1, 2, 3, 4, 5]
          .map((d) => [NOMES_DIV[d], a.marco(`div${d}`)])
          .concat(
            [1, 2, 3, 5, 10].map((p) => [`refundacao${p}`, a.marco(`refundacao${p}`)]),
            [['titulo1', a.marco('titulo1')]],
          ),
      ),
      fotos: Object.fromEntries(['2h', '1d', '1sem', '30d'].map((k) => [k, a.foto(k)])),
      refundacoesNoFim: a.refundacoesNoFim,
      titulosNoFim: a.titulosNoFim,
      maxOuro: a.maxOuro,
      maxRenda: a.maxRenda,
    }));
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  console.log(
    `# Simulação: ${o.dias} dias, ${o.jogadores} jogadores, semente ${o.semente}${o.refunda ? '' : ', sem refundação'}, estratégia=${o.modo}${o.ajustes.desvioOff ? `, desvio-off=${o.ajustes.desvioOff}` : ''}${o.ajustes.botVeTudo ? ', bot-ve-tudo' : ''}\n`,
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
