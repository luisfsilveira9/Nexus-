// Uso: npx tsx docs/pesquisa-ligas/gerar-mundo.ts
// Gera src/game/mundo-dados.ts (363 jogadores + 20 times dos internacionais) e reescreve os atributos dos 40 titulares do CBLOL em src/game/data.ts.
// Entradas: jogadores-2026.json (estatísticas e OVR), pools-2026.json (campeões por jogador), deslocamentos.json (ajuste de cada time ao Elo real).
// O OVR dá o nível; a estatística dá o formato: cada número é comparado com os jogadores da mesma liga e rota (z), e o desvio vira ± pontos em volta do OVR.
import { readFileSync, writeFileSync } from 'node:fs';
import { champions, LEAGUE } from '../../src/game/data';
const DIR = new URL('.', import.meta.url).pathname, SRC = DIR + '../../src/game/';
type J = { nick: string; pais: string; liga: string; time: string; rota: string; jogos: number; vit: number; kda: number; k: number; d: number; a: number; dpm: number; gpm: number; cspm: number; dano: number; wards: number; fb: number; eloTime: number; ovr: number; indiv: number };
const JOG: J[] = JSON.parse(readFileSync(DIR + 'jogadores-2026.json', 'utf8'));
const POOLS = JSON.parse(readFileSync(DIR + 'pools-2026.json', 'utf8')).jogadores as Record<string, { nome: string; pool: [string, number, number, number, number, number][] }>;
const SHIFT: Record<string, number> = JSON.parse(readFileSync(DIR + 'deslocamentos.json', 'utf8'));
const ROLE: Record<string, string> = { top: 'Top', jun: 'Jungle', mid: 'Mid', adc: 'Adc', sup: 'Support' };
const SK = ['laning', 'teamfight', 'map', 'mental', 'mechanics', 'farm'] as const, OVR4 = SK.slice(0, 4);
const TAC = ['initiation', 'peel', 'split', 'siege', 'roaming', 'gank', 'objectives', 'shotcalling'], APT = ['T', 'P', 'F', 'A', 'M', 'K', 'H', 'C'];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)), avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ''), champByName = Object.fromEntries(champions.map(c => [norm(c.name), c]));

// ---- molde por rota, tirado dos titulares atuais do CBLOL: quanto cada atributo fica acima/abaixo do OVR do jogador ----
type P0 = (typeof LEAGUE.teams)[number]['roster'][number];
const ovr4 = (p: P0) => avg(OVR4.map(k => p[k]));
const byRole = (r: string) => LEAGUE.teams.map(t => t.roster.find(p => p.role === r)!);
const MOLD = Object.fromEntries(Object.values(ROLE).map(r => { const ps = byRole(r); return [r, {
  sk: Object.fromEntries(SK.map(k => [k, avg(ps.map(p => p[k] - ovr4(p)))])), tac: Object.fromEntries(TAC.map(k => [k, avg(ps.map(p => p.tac[k] - ovr4(p)))])),
  apt: Object.fromEntries(APT.map(k => [k, avg(ps.map(p => p.apt[k]))])), agg: avg(ps.map(p => p.hid.aggression)) }]; }));

// ---- perfil do pool: parcela dos jogos em cada estilo e marca de campeão, e variedade (número efetivo de campeões) ----
const poolOf = (p: J) => (POOLS[`${p.liga}|${p.nick}`]?.pool || []).map(([n, g, w]) => ({ c: champByName[norm(n)], g, w })).filter(x => x.c);
const share = (p: J, f: (c: (typeof champions)[number]) => boolean) => { const pl = poolOf(p), tot = pl.reduce((a, x) => a + x.g, 0) || 1; return pl.reduce((a, x) => a + (f(x.c) ? x.g : 0), 0) / tot; };
const effN = (p: J) => { const pl = poolOf(p), tot = pl.reduce((a, x) => a + x.g, 0) || 1; return Math.exp(-pl.reduce((a, x) => a + (x.g / tot) * Math.log(x.g / tot), 0)); };
// z de um número dentro de um grupo (liga+rota para estatística de jogo; rota no mundo todo para o perfil do pool), limitado a ±2,5
const zIn = (grp: (p: J) => string) => (f: (p: J) => number, sdMin = 1e-9) => { const m: Record<string, [number, number]> = {};
  for (const g of new Set(JOG.map(grp))) { const v = JOG.filter(p => grp(p) === g).map(f), mu = avg(v); m[g] = [mu, Math.max(sdMin, Math.sqrt(avg(v.map(x => (x - mu) ** 2))))]; }
  return (p: J) => clamp((f(p) - m[grp(p)][0]) / m[grp(p)][1], -2.5, 2.5); };
const zL = zIn(p => p.liga + p.rota), zR = zIn(p => p.rota);
const Z = { gpm: zL(p => p.gpm), cs: zL(p => p.cspm), kda: zL(p => p.kda), dano: zL(p => p.dano), ka: zL(p => p.k + p.a), k: zL(p => p.k), a: zL(p => p.a), wards: zL(p => p.wards), fb: zL(p => p.fb), vivo: zL(p => -p.d), kd: zL(p => p.k + p.d),
  tag: (...t: string[]) => zR(p => share(p, c => c.tags.some(x => t.includes(x))), 0.04), style: Object.fromEntries(APT.map(s => [s, zR(p => share(p, c => c.styles.includes(s)), 0.04)])), effN: zR(effN) };
const zEn = Z.tag('en'), zPe = Z.tag('pe', 'de'), zSp = Z.tag('sp'), zSi = Z.tag('po', 'si'), zMo = Z.tag('mo');

export function perfil(p: J, level: number) {
  const r = ROLE[p.rota], M = MOLD[r], sup = r === 'Support';
  // desvio pela estatística (±6), centrado para o OVR (média de rotas, luta, mapa e mental) não mudar
  const dev: Record<string, number> = { laning: 3 * (sup ? Z.gpm(p) : 0.6 * Z.gpm(p) + 0.4 * Z.cs(p)), teamfight: 3 * Z.ka(p), map: 3 * (r === 'Jungle' ? 0.6 * Z.wards(p) + 0.4 * Z.fb(p) : Z.wards(p)), mental: 3 * Z.vivo(p),
    mechanics: 3 * (0.6 * Z.kda(p) + 0.4 * Z.dano(p)), farm: sup ? 0 : 3 * Z.cs(p) };
  for (let i = 0; i < 3; i++) { const c = avg(OVR4.map(k => dev[k])); SK.forEach(k => { dev[k] = clamp(dev[k] - c, -6, 6); }); }
  const off = Object.fromEntries(SK.map(k => [k, M.sk[k] + dev[k]])), top = Math.max(...OVR4.map(k => off[k])), f = top > 0 ? Math.min(1, (99 - level) / top) : 1; // perto de 99 o formato achata, a média fica
  const sk = Object.fromEntries(SK.map(k => [k, clamp(Math.round(level + off[k] * (OVR4.includes(k as never) ? f : 1)), 1, 99)]));
  for (let d = Math.round(level) * 4 - OVR4.reduce((a, k) => a + sk[k], 0), g = 0; d && g < 12; g++) { // arredondamento: acerta a soma para o OVR exibido bater
    const k = [...OVR4].sort((x, y) => (d > 0 ? 1 : -1) * ((level + off[y] * f - sk[y]) - (level + off[x] * f - sk[x])))[0]; if (sk[k] + Math.sign(d) > 99) break; sk[k] += Math.sign(d); d -= Math.sign(d); }
  const tdev: Record<string, number> = { initiation: 2.5 * zEn(p), peel: 2.5 * zPe(p), split: 2.5 * zSp(p), siege: 2.5 * zSi(p), roaming: 2 * Z.a(p) + zMo(p), gank: r === 'Jungle' ? 2 * Z.fb(p) + 1.5 * Z.k(p) : 1.5 * Z.fb(p), objectives: 1.5 * Z.wards(p) + 1.5 * Z.vivo(p), shotcalling: 0 };
  const tac = Object.fromEntries(TAC.map(k => [k, clamp(Math.round(level + M.tac[k] + clamp(tdev[k], -6, 6)), 1, 99)]));
  const apt = Object.fromEntries(APT.map(s => [s, clamp(Math.round(M.apt[s] + 7 * Z.style[s](p)), 35, 99)]));
  return { sk, tac, apt, aggression: clamp(Math.round(M.agg + 2.5 * Z.kd(p)), 3, 19), versatility: clamp(Math.round(10.5 + 2.5 * Z.effN(p)), 4, 18) };
}

// ---- 1. CBLOL em data.ts: mesmo método, no nível ajustado ao Elo (OVR + deslocamento do time); shotcalling e os ocultos sem estatística ficam como estavam ----
const ALIAS: Record<string, string> = { curse: 'doom', strensh: 'strange' };
const findJ = (liga: string, nick: string) => JOG.find(j => j.liga === liga && j.nick.toLowerCase() === (ALIAS[nick.toLowerCase()] || nick.toLowerCase()));
for (const t of LEAGUE.teams) for (const p of t.roster) {
  const j = findJ('CBLOL', p.nickname); if (!j) throw new Error('sem estatística: ' + p.nickname);
  const scOff = p.tac.shotcalling - Math.round(ovr4(p)), L = j.ovr + SHIFT[t.id], x = perfil(j, L);
  Object.assign(p, x.sk); Object.assign(p.tac, x.tac, { shotcalling: clamp(L + scOff, 1, 99) }); Object.assign(p.apt, x.apt); p.hid.aggression = x.aggression; p.hid.versatility = x.versatility;
  delete (p as { id?: string }).id;
}
const dataPath = SRC + 'data.ts', data = readFileSync(dataPath, 'utf8').split('\n'), li = data.findIndex(l => l.startsWith('export const LEAGUE = '));
data[li] = 'export const LEAGUE = ' + JSON.stringify(LEAGUE) + ' as unknown as League;';
writeFileSync(dataPath, data.join('\n'));

// ---- 2. o mundo: todos os jogadores no OVR real (o deslocamento do time entra só ao montar os 20 times) ----
const TIMES: [string, string, string, string][] = [ // sigla no op.gg, nome, liga, torneios de 2026 (F First Stand, M MSI, W Mundial)
  ['GEN', 'Gen.G', 'LCK', 'FW'], ['HLE', 'Hanwha Life Esports', 'LCK', 'MW'], ['T1', 'T1', 'LCK', 'MW'], ['DK', 'Dplus KIA', 'LCK', 'W'], ['BFX', 'BNK FEARX', 'LCK', 'F'],
  ['BLG', 'Bilibili Gaming', 'LPL', 'FMW'], ['TES', 'Top Esports', 'LPL', 'MW'], ['IG', 'Invictus Gaming', 'LPL', 'W'], ['AL', "Anyone's Legend", 'LPL', 'W'], ['JDG', 'JD Gaming', 'LPL', 'F'],
  ['G2', 'G2 Esports', 'LEC', 'FMW'], ['KC', 'Karmine Corp', 'LEC', 'MW'], ['MKOI', 'Movistar KOI', 'LEC', 'W'],
  ['LY', 'LYON', 'LCS', 'FMW'], ['TL', 'Team Liquid', 'LCS', 'MW'], ['C9', 'Cloud9', 'LCS', 'W'],
  ['TSW', 'Team Secret Whales', 'LCP', 'FMW'], ['CFO', 'CTBC Flying Oyster', 'LCP', 'W'], ['MVK', 'MVK Esports', 'LCP', 'W'], ['DCG', 'Deep Cross Gaming', 'LCP', 'M'],
];
const champIdx: string[] = [], ci = (id: string) => { let i = champIdx.indexOf(id); if (i < 0) i = champIdx.push(id) - 1; return i; };
const q75 = Object.fromEntries([...new Set(JOG.map(p => p.liga))].map(l => { const v = JOG.filter(p => p.liga === l).map(p => p.jogos).sort((a, b) => a - b); return [l, v[Math.floor(v.length * 0.75)]]; }));
const rows = JOG.map(p => { const x = perfil(p, p.ovr), pl = poolOf(p); if (!pl.length) throw new Error('sem pool: ' + p.nick);
  const cb = p.liga === 'CBLOL' ? LEAGUE.teams.flatMap(t => t.roster).find(q => findJ('CBLOL', q.nickname) === p) : undefined; // titular do CBLOL: mesmo nick e personalidade do jogo
  const pers = cb?.personality ?? (p.indiv >= 1.5 ? 'Star' : p.jogos >= q75[p.liga] ? 'Workaholic' : 'Quiet');
  return [cb?.nickname ?? p.nick, POOLS[`${p.liga}|${p.nick}`].nome, p.pais, p.liga, p.time, ROLE[p.rota], p.ovr, p.jogos, p.vit, SK.map(k => x.sk[k]), TAC.map(k => x.tac[k]), APT.map(k => x.apt[k]), x.aggression, x.versatility, pers, pl.flatMap(c => [ci(c.c.id), c.g, c.w])]; });
for (const [tag] of TIMES) for (const r of Object.values(ROLE)) if (!rows.some(x => x[4] === tag && x[5] === r)) throw new Error(`${tag} sem ${r}`);
const elo = (tag: string) => JOG.find(p => p.time === tag)!.eloTime;
const out = `// GERADO por docs/pesquisa-ligas/gerar-mundo.ts. Não edite à mão.
// Jogadores de 2026 com 10+ jogos nas seis ligas (estatísticas do esports.op.gg, coletadas uma vez em 11/11/2026) e os 20 times de fora do Brasil nos internacionais.
// Jogador: [nick, nome, país, liga, time, rota, OVR, jogos, vitórias, [rotas, luta, mapa, mental, mecânica, farm], [táticos], [estilos], agressividade, versatilidade, personalidade, [campeão, jogos, vitórias, ...]]
export type Linha = [string, string, string, string, string, string, number, number, number, number[], number[], number[], number, number, string, number[]];
export const CAMPEOES = ${JSON.stringify(champIdx)};
export const TAC_K = ${JSON.stringify(TAC)};
export const APT_K = ${JSON.stringify(APT)};
// Time: [id, sigla, nome, liga, torneios (F First Stand, M MSI, W Mundial), Elo (LoL Pro Elo, nov/2026), deslocamento dos atributos ajustado ao Elo]
export const TIMES: [string, string, string, string, string, number, number][] = [
${TIMES.map(([tag, nome, liga, ev]) => '  ' + JSON.stringify([tag.toLowerCase(), tag, nome, liga, ev, elo(tag), SHIFT[tag.toLowerCase()] ?? 0])).join(',\n')},
];
export const JOGADORES = [
${rows.map(r => '  ' + JSON.stringify(r)).join(',\n')},
] as Linha[];
`;
writeFileSync(SRC + 'mundo-dados.ts', out);
console.log(`mundo-dados.ts: ${rows.length} jogadores, ${champIdx.length} campeões, ${(out.length / 1024).toFixed(0)} kB`);
