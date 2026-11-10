// Simulação da partida por eventos, em ticks de 30 s, com as regras do Patch 26.1 (Splits 1 e 2 de 2026).
// A "barra" (-100..+100) é o domínio do mapa: chega a ±100 quando o Nexus cai. O ouro é contabilizado à parte
// com os valores oficiais de 2026 e entra nas rolagens como vantagem de itens.
import { clamp, esc, fmtT, gauss, other, plOf, rnd, ROLES, sigmoid, teamOf } from './core';
import { aptFor, BEATS, compOf, fitOf, offPoolPenalty, picksOf, series, type Comp } from './draft';
import { shotcallerOf, tacticsOf, tactStr } from './tactics';
import type { Role, Side } from './types';

// ================= parâmetros (calibrados com calibrate.ts contra o pro de 2026) =================
export const CFG = {
  TICK: 30,
  EARLY_END: 840, MID_END: 1500,
  SKILL_K: 0.6, FORM_SD: 5, FORM_KEEP: 0.4,
  DICE_EARLY: 2.2, DICE_MID: 1.6, DICE_LATE: 1.8,
  EV_P: { early: 0.13, mid: 0.30, late: 0.34 } as Record<string, number>,
  JG_P: 0.5, JG_START: 150, JG_END: 900,      // trilha do caçador até 15:00 → 3 a 5 ganks por caçador
  GANK_ADV: 6,                                  // 2 contra 1
  DMG_K: 1.5, KILL_K: 2.15, KILL_EXTRA: 0.25,
  PHASE_MULT: { early: 0.45, mid: 0.55, late: 1.0 } as Record<string, number>,
  TRAIL_MULT: 2.0,                              // comeback: bounties + XP de recuperação
  BARON_P: 0.08, PLATE_START: 300, PLATE_P: 0.3, CONTEST: 4,
  GOLD_TICK: 820,                               // ouro passivo + farm por time a cada 30 s
  GD_ROLL: 3000,                                // 1 ponto de rolagem a cada 3.000 de ouro
  // valores oficiais 26.1
  KILL_G: 300, FB_BONUS: 100, FIRST_TOWER_BONUS: 300, TOWER_G: 250, PLATE_G: 120, INHIB_G: 50,
  DRAGON_G: 75, GRUBS_G: 90, HERALD_G: 100, BARON_G: 850, ELDER_G: 850,
  // spawns (Barão 20:00 confirmado no 26.1; dragão/larvas/arauto: confirmar no wiki oficial)
  DRAGON_AT: 300, DRAGON_RESPAWN: 300, GRUBS_AT: 480, GRUBS_END: 885, HERALD_AT: 900, HERALD_END: 1185,
  BARON_AT: 1200, BARON_RESPAWN: 360, BARON_BUFF: 180, ELDER_RESPAWN: 360, ELDER_BUFF: 150,
};

export const PHASE_OF = (t: number) => t < CFG.EARLY_END ? 'early' : t < CFG.MID_END ? 'mid' : 'late';
export const PHASE_PT: Record<string, string> = { early: 'Início · fase de rotas', mid: 'Meio de jogo', late: 'Final de jogo' };
export const barCap = (t: number) => t < 840 ? 55 : t < 1620 ? 80 : 100;

// habilidades testadas em cada lance
export const SK: Record<string, { l: string; w: Record<string, number> }> = {
  lane: { l: 'Fase de rotas', w: { laning: 2, mechanics: 2 } },
  gank: { l: 'Gank', w: { gank: 3, map: 1 } },
  escape: { l: 'Visão de mapa', w: { map: 3, mechanics: 1 } },
  fight: { l: 'Luta em equipe', w: { teamfight: 3, mental: 1 } },
  engageF: { l: 'Iniciação', w: { teamfight: 2, initiation: 2 } },
  peelF: { l: 'Proteção', w: { teamfight: 2, peel: 2 } },
  vision: { l: 'Visão de mapa', w: { map: 3, mental: 1 } },
  macro: { l: 'Macro', w: { map: 2, shotcalling: 1, mental: 1 } },
  defend: { l: 'Defesa', w: { peel: 2, map: 1, laning: 1 } },
  clutch: { l: 'Mental', w: { mental: 2, teamfight: 2 } },
  obj: { l: 'Controle de objetivo', w: { objectives: 3, teamfight: 1 } },
  smite: { l: 'Smite', w: { objectives: 2, map: 1, mechanics: 1 } },
  split: { l: 'Split push', w: { split: 3, mechanics: 1 } },
  roam: { l: 'Roaming', w: { roaming: 3, map: 1 } },
  siege: { l: 'Cerco', w: { siege: 3, laning: 1 } },
  pick: { l: 'Emboscada', w: { map: 2, mechanics: 2 } },
};

// ================= tipos =================
export interface Part { role: Role; sk: string; val?: number }
export interface Ev {
  kind: string; tag: string; icon: string; loc: string; init: Side; blue: Part[]; red: Part[];
  dmg: number; kill: number; kills?: [number, number] | null; adv?: number; say: string;
  counter?: boolean; vision?: boolean; lane?: Role; jg?: boolean;
}
export interface Roll { total: number; dice: number; parts: Part[]; avg: number; mods: number; adv?: number }
export interface Res {
  ev: Ev; objKey: string | null; rb: Roll; rr: Roll; win: Side; contest: boolean; steal: boolean; margin: number; done: boolean;
  free?: boolean; gank?: string; real?: number; victims?: string[]; back?: string[]; firstBlood?: boolean; trailing?: boolean;
}
export interface LogE { t: number; side: Side | ''; kind: string; icon?: string; html: string; big?: boolean; kills?: boolean }
interface Struct { kind: string; lane: string; th: number; p: [number, number]; alive: boolean; plates: number }
export interface PStat { side: Side; role: Role; k: number; d: number; a: number; nota: number }
export interface Quest { p: number; done: boolean; at: number | null }
export interface Match {
  t: number; bar: number; over: boolean; running: boolean; phase: string | null;
  gold: Record<Side, number>; drakes: Record<Side, number>; soul: Side | null; grubs: Side | null; herald: Side | null;
  barons: Record<Side, number>; baron: { side: Side | null; until: number }; elder: { side: Side | null; until: number };
  form: Record<Side, number>; vision: Side | null; next: Record<string, number | null>;
  first: Record<string, Side | null>;
  kills: Record<Side, number>; towers: Record<Side, number>; inhibs: Record<Side, number>; plates: Record<Side, number>; maxPush: Record<Side, number>;
  S: Record<Side, { list: Struct[]; nexus: [number, number] }>; nexusDown: Side | null;
  log: LogE[]; stats: Record<string, PStat>; csF: Record<string, number>;
  card: { R: Res; stage: 'setup' | 'skills' | 'result' } | null;
  comp: Record<Side, Comp>; quests: Record<string, Quest>;
  kstreak: Record<string, number>; dstreak: Record<string, number>; lastDeath: Record<string, number>;
  gk: Record<Side, { att: number; kill: number; flash: number; press: number; none: number; pun: number; counter: number }>;
  timeline: { t: number; gd: number; wp: number; bar: number }[];
  gd15: number | null; done: Record<string, boolean>;
}
export let M: Match | null = null;
export const clearMatch = () => { M = null; };

const nick = (sd: Side, role: Role) => esc(plOf(sd, role).nickname);
const tname = (sd: Side) => esc(teamOf(sd).name);
const ttag = (sd: Side) => esc(teamOf(sd).tag);
const LANE_LOC: Record<string, string> = { Top: 'Topo', Mid: 'Meio', Adc: 'Bot' };
const LANE_TXT: Record<string, string> = { Top: 'do topo', Mid: 'do meio', Adc: 'de baixo' };
const LANES: Role[] = ['Top', 'Mid', 'Adc'];
const laneOf = (r: Role): Role[] => r === 'Adc' ? ['Adc', 'Support'] : [r];
const P = (roles: Role[], sk: string): Part[] => roles.map(role => ({ role, sk }));
const attr = (p: ReturnType<typeof plOf>, k: string) => (p as unknown as Record<string, number>)[k] ?? p.tac[k] ?? 70;
const myBar = (sd: Side) => sd === 'blue' ? M!.bar : -M!.bar;
const gdOf = (sd: Side) => M!.gold[sd] - M!.gold[other(sd)];
const questDone = (sd: Side, role: Role) => !!M!.quests[plOf(sd, role).id]?.done;

// ================= forças =================
function champBonus(sd: Side, role: Role) {
  const m = M!, c = picksOf(sd)[role]; if (!c) return 0;
  const p = plOf(sd, role), x = Math.min(1, m.t / 1800), pow = c.earlyPower * (1 - x) + c.lateScaling * x;
  const foe = picksOf(other(sd))[role];
  let b = ((pow - 70) / 3 + 8) * fitOf(p, c) - offPoolPenalty(p, c);
  if (foe && m.t < 840 && c.earlyPower - foe.earlyPower >= 12) b += 3;
  if (m.t > 1800 && c.styles.includes('H')) b += (p.farm - 75) / 10 + (aptFor(p, c) - 75) / 15;
  // Role Quests 2026
  if (questDone(sd, role)) {
    if (role === 'Top' && m.t > 1500) b += 2;        // nível 20
    if (role === 'Adc') b += 1.5;                    // 7º slot (botas) + ouro extra
    if (role === 'Jungle') b += 1;                   // Smite melhorado
  }
  return b;
}
function skill(sd: Side, role: Role, w: Record<string, number>, sk?: string) {
  const p = plOf(sd, role); let tot = 0, sw = 0;
  for (const k in w) { tot += attr(p, k) * w[k]; sw += w[k]; }
  const tired = Math.max(0, 60 - p.energy) / 10 + Math.max(0, p.stress - 50) / 10;
  let q = 0;
  if (questDone(sd, role)) {
    if (role === 'Mid' && sk === 'roam') q += 4;               // botas T3 + recall potencializado
    if (role === 'Support' && sk === 'vision') q += 3;         // control wards guardadas
    if (role === 'Jungle' && sk === 'smite') q += 4;           // Smite 1400
    if (role === 'Top' && sk === 'split') q += 3;              // TP "Unleashed"
  }
  return tot / sw + champBonus(sd, role) - tired + q;
}
function compBonus(sd: Side, kind: string) {
  const m = M!, me = m.comp[sd], foe = m.comp[other(sd)]; let b = 0;
  if (['fight', 'base', 'obj'].includes(kind) && BEATS[me.id] === foe.id) b += 3;
  if (kind === 'split' && me.id === 'split') b += 3;
  if (kind === 'pick' && me.id === 'pick') b += 3;
  if ((kind === 'siege' || kind === 'plates') && me.id === 'poke') b += 3;
  if (kind === 'fight' && me.id === 'engage') b += 1;
  if (me.timing === 'early') b += m.t < 1200 ? 2 : m.t > 1800 ? -2 : 0;
  if (me.timing === 'scaling') b += m.t < 900 ? -2 : m.t > 1800 ? 3 : 0;
  return b;
}
function tacticBonus(sd: Side, kind: string, parts: Part[]) {
  const T = teamOf(sd), X = tacticsOf(T), t = M!.t, hasJ = parts.some(p => p.role === 'Jungle');
  const s = (k: string) => tactStr(T, k, (X as unknown as Record<string, string>)[k]);
  let b = 0;
  if (X.plan === 'early') b += t < 1200 ? 2 * s('plan') : t > 1800 ? -2 : 0;
  if (X.plan === 'late') b += t < 900 ? -1.5 : t > 1800 ? 2.5 * s('plan') : 0;
  if (X.jungle === 'gank' && kind === 'gank' && hasJ) b += 2 * s('jungle');
  if (X.jungle === 'farm') { if (kind === 'gank' && hasJ) b -= 1; if (hasJ && t > 1200) b += 1.5 * s('jungle'); }
  if (X.lanes === 'aggr' && (kind === 'duel' || kind === 'plates')) b += 2 * s('lanes');
  if (X.lanes === 'farm') { if (kind === 'duel') b -= 1; if (t > 1500) b += 1 * s('lanes'); }
  if (X.mid === 'macro' && ['obj', 'siege', 'plates', 'base', 'ward'].includes(kind)) b += 2.5 * s('mid');
  if (X.mid === 'fight' && kind === 'fight') b += 2.5 * s('mid');
  if (X.mid === 'split' && kind === 'split') b += 3 * s('mid');
  return b;
}
function tacticWeight(sd: Side, k: string) {
  const X = tacticsOf(teamOf(sd)); let w = 1;
  if (k === 'gank') w *= X.jungle === 'gank' ? 1.6 : X.jungle === 'farm' ? 0.5 : 1;
  if (k === 'duel' || k === 'plates') w *= X.lanes === 'aggr' ? 1.6 : X.lanes === 'farm' ? 0.6 : 1;
  if (k === 'fight') w *= X.mid === 'fight' ? 1.5 : 1;
  if (k === 'siege' || k === 'ward') w *= X.mid === 'macro' ? 1.5 : 1;
  if (k === 'split') w *= X.mid === 'split' ? 2.2 : 1;
  return w;
}
function tacticInit(sd: Side, jungleTrack: boolean) {
  const X = tacticsOf(teamOf(sd)); let v = 0;
  if (jungleTrack) v += X.jungle === 'gank' ? 0.12 : X.jungle === 'farm' ? -0.12 : 0;
  if (M!.t < 1200) v += X.plan === 'early' ? 0.05 : X.plan === 'late' ? -0.05 : 0;
  return v;
}
const gankLane = (sd: Side): Role => { const X = tacticsOf(teamOf(sd)); return X.lane !== 'any' && Math.random() < 0.7 ? X.lane as Role : rnd(LANES); };
const tacticGold = (sd: Side) => { const X = tacticsOf(teamOf(sd)); return (X.jungle === 'farm' ? 40 : 0) + (X.lanes === 'farm' ? 60 : 0); };
function buffBonus(sd: Side) {
  const m = M!; let b = m.drakes[sd] * 0.4 + (m.soul === sd ? 4 : 0) + (m.grubs === sd ? 1 : 0);
  if (m.baron.side === sd && m.t < m.baron.until) b += 5;
  if (m.elder.side === sd && m.t < m.elder.until) b += 8;
  if (m.vision === sd) b += 2;
  return b;
}
const fightParts = (sd: Side, roles: Role[]): Part[] => roles.map(role => { const c = picksOf(sd)[role], t = c ? c.tags : [];
  return { role, sk: t.includes('en') ? 'engageF' : (t.includes('pe') || t.includes('de')) ? 'peelF' : 'fight' }; });
const MACRO_KINDS = ['siege', 'base', 'obj', 'split', 'ward', 'plates'];
// lado do mapa: o azul fica mais perto de Barão/Arauto/Larvas, o vermelho do Dragão
function mapSideBonus(sd: Side, objKey: string | null) {
  if (!objKey) return 0;
  const azul = series.mapSide[sd] === 'Azul';
  if (['baron', 'herald', 'grubs'].includes(objKey)) return azul ? 1 : 0;
  if (['dragon', 'elder'].includes(objKey)) return azul ? 0 : 1;
  return 0;
}
function rollSide(sd: Side, parts: Part[], kind: string, objKey: string | null = null): Roll {
  const m = M!;
  const vals = parts.map(p => ({ ...p, val: skill(sd, p.role, SK[p.sk].w, p.sk) }));
  const raw = vals.reduce((a, p) => a + p.val!, 0) / vals.length;
  const pl = parts.map(p => plOf(sd, p.role)), avgH = (k: keyof typeof pl[0]['hid']) => pl.reduce((a, p) => a + p.hid[k], 0) / pl.length;
  const base = 70 + (raw - 70) * CFG.SKILL_K + m.form[sd];
  // vantagem de itens (ouro) + domínio de mapa
  const snow = clamp(gdOf(sd) / CFG.GD_ROLL, -7, 7) + myBar(sd) / 50;
  let mods = compBonus(sd, kind) + tacticBonus(sd, kind, parts) + mapSideBonus(sd, objKey);
  if (myBar(sd) < -15) mods += (avgH('pressure') - 10) * 0.4;
  if (series && series.big) mods += (avgH('bigGames') - 10) * 0.4;
  if (MACRO_KINDS.includes(kind)) mods += (shotcallerOf(teamOf(sd)).tac.shotcalling - 70) / 10;
  // Dragon Vengeance 2026: quem tem menos dragões recebe redução de dano na disputa (15/30/45%)
  if (objKey === 'dragon' || objKey === 'elder') mods += clamp(m.drakes[other(sd)] - m.drakes[sd], 0, 3) * 1.5;
  const spread = 1.25 - 0.025 * avgH('consistency');
  const dm = m.t >= CFG.MID_END ? CFG.DICE_LATE : m.t < CFG.EARLY_END ? CFG.DICE_EARLY : CFG.DICE_MID;
  const dice = (Math.random() * 20 + Math.random() * 20) * spread * dm;
  return { total: Math.round(base + buffBonus(sd) + snow + mods + dice), dice: Math.round(dice), parts: vals, avg: raw, mods };
}

// ================= catálogo de lances =================
interface EvDef { w: number; min?: number; max?: number; once?: string; k: string; f: (a: Side) => Ev }
const EVENTS: Record<string, EvDef[]> = {
  early: [
    { w: 5, min: 90, k: 'duel', f: a => { const r = rnd(LANES), ro = laneOf(r);
      return { kind: 'duel', tag: 'Duelo de rota', icon: 'Swords', loc: LANE_LOC[r], init: a, lane: r, blue: P(ro, 'lane'), red: P(ro, 'lane'), dmg: 3, kill: 0.22,
        say: r === 'Adc' ? `${nick('blue', 'Adc')} e ${nick('red', 'Adc')} trocam dano na rota de baixo` : `${nick('blue', r)} e ${nick('red', r)} disputam a rota ${LANE_TXT[r]}` }; } },
    { w: 2, min: 120, k: 'ward', f: a => ({ kind: 'ward', tag: 'Visão', icon: 'Eye', loc: 'Selva', init: a, blue: P(['Support', 'Jungle'], 'vision'), red: P(['Support', 'Jungle'], 'vision'), dmg: 2, kill: 0, vision: true,
      say: `${nick(a, 'Support')} entra fundo na selva inimiga para colocar sentinela` }) },
    { w: 2.5, min: 240, k: 'plates', f: a => { const r = rnd(LANES);
      return { kind: 'plates', tag: 'Placas', icon: 'Shield', loc: LANE_LOC[r], init: a, lane: r, [a]: P([r], 'siege'), [other(a)]: P([r], 'defend'), dmg: 3, kill: 0,
        say: `${tname(a)} pressiona as placas da torre ${LANE_TXT[r]}` } as unknown as Ev; } },
  ],
  mid: [
    { w: 4, k: 'fight', f: a => ({ kind: 'fight', tag: 'Escaramuça', icon: 'Zap', loc: 'Rio', init: a, blue: fightParts('blue', ['Jungle', 'Mid', 'Support']), red: fightParts('red', ['Jungle', 'Mid', 'Support']), dmg: 5, kill: 0.6, kills: [1, 2],
      say: 'As equipes se encontram no rio: 3 contra 3' }) },
    { w: 3, k: 'pick', f: a => { const d = other(a), v = rnd<Role>(['Mid', 'Adc', 'Top']);
      return { kind: 'pick', tag: 'Emboscada', icon: 'Target', loc: LANE_LOC[v], init: a, [a]: [{ role: 'Jungle', sk: 'pick' }, { role: 'Support', sk: 'vision' }], [d]: P([v], 'escape'), dmg: 4, kill: 0.6,
        say: `${tname(a)} arma uma emboscada para ${nick(d, v)}` } as unknown as Ev; } },
    { w: 3, k: 'siege', f: a => { const r = rnd(LANES);
      return { kind: 'siege', tag: 'Cerco', icon: 'Castle', loc: LANE_LOC[r], init: a, lane: r, [a]: P(['Top', 'Mid', 'Adc'], 'siege'), [other(a)]: [{ role: 'Mid', sk: 'defend' }, { role: 'Adc', sk: 'defend' }, { role: 'Support', sk: 'defend' }], dmg: 5, kill: 0.2,
        say: `${tname(a)} agrupa para derrubar a torre ${LANE_TXT[r]}` } as unknown as Ev; } },
    { w: 2, k: 'plates', f: a => { const r = rnd(LANES);
      return { kind: 'plates', tag: 'Placas', icon: 'Shield', loc: LANE_LOC[r], init: a, lane: r, [a]: P([r], 'siege'), [other(a)]: P([r], 'defend'), dmg: 3, kill: 0,
        say: `${tname(a)} arranca placas da torre interna ${LANE_TXT[r]} (placas permanentes em 2026)` } as unknown as Ev; } },
    { w: 2, k: 'split', f: a => ({ kind: 'split', tag: 'Split push', icon: 'Axe', loc: rnd(['Topo', 'Bot']), init: a, [a]: P(['Top'], 'split'), [other(a)]: [{ role: 'Top', sk: 'lane' }, { role: 'Jungle', sk: 'macro' }], dmg: 4, kill: 0.3,
      say: `${nick(a, 'Top')} empurra a rota lateral sozinho` } as unknown as Ev) },
    { w: 2, k: 'ward', f: a => ({ kind: 'ward', tag: 'Visão', icon: 'Eye', loc: 'Rio', init: a, blue: P(['Support', 'Jungle'], 'vision'), red: P(['Support', 'Jungle'], 'vision'), dmg: 3, kill: 0, vision: true,
      say: 'Disputa de visão em volta do próximo objetivo' }) },
  ],
  late: [
    { w: 5, k: 'fight', f: a => ({ kind: 'fight', tag: 'Teamfight', icon: 'Flame', loc: rnd(['Rio', 'Meio']), init: a, blue: fightParts('blue', ROLES), red: fightParts('red', ROLES), dmg: 9, kill: 0.8, kills: [2, 3],
      say: 'Os dez jogadores se encontram: teamfight' }) },
    { w: 3, k: 'pick', f: a => { const d = other(a), v = rnd<Role>(['Mid', 'Adc', 'Support']);
      return { kind: 'pick', tag: 'Emboscada', icon: 'Target', loc: 'Selva', init: a, [a]: [{ role: 'Jungle', sk: 'pick' }, { role: 'Support', sk: 'vision' }, { role: 'Mid', sk: 'pick' }], [d]: P([v], 'escape'), dmg: 6, kill: 0.7,
        say: `${tname(a)} caça ${nick(d, v)} sem proteção` } as unknown as Ev; } },
    { w: 2, k: 'split', f: a => ({ kind: 'split', tag: 'Split push', icon: 'Axe', loc: rnd(['Topo', 'Bot']), init: a, [a]: P(['Top'], 'split'), [other(a)]: [{ role: 'Top', sk: 'lane' }, { role: 'Jungle', sk: 'macro' }], dmg: 5, kill: 0.3,
      say: `${nick(a, 'Top')} pressiona a lateral e puxa a atenção` } as unknown as Ev) },
    { w: 3, k: 'base', f: a => ({ kind: 'base', tag: 'Cerco à base', icon: 'Castle', loc: 'Base', init: a, [a]: P(ROLES, 'siege'), [other(a)]: P(ROLES, 'defend'), dmg: 8, kill: 0.5, kills: [1, 2],
      say: `${tname(a)} tenta entrar na base de ${tname(other(a))}` } as unknown as Ev) },
  ],
};
const IDENT_BOOST: Record<string, Record<string, number>> = { split: { split: 2 }, pick: { pick: 1.8 }, poke: { siege: 1.6, plates: 1.6 }, engage: { fight: 1.4 }, protect: { ward: 1.3 } };
// trilha do caçador (até 15:00): ganks, counter-ganks, roams, invasões e Caranguejo
const JG_EVENTS: EvDef[] = [
  { w: 6, min: 165, k: 'gank', f: a => { const m = M!, r = gankLane(a), d = other(a), aj = plOf(a, 'Jungle'), dj = plOf(d, 'Jungle');
    const win = (m.t >= 390 && m.t <= 450) || (m.t >= 690 && m.t <= 750);   // buffs renascendo: os dois caçadores por perto
    // counter-gank: maior no meio (rota de maior risco), quando o caçador inimigo lê o mapa melhor e na janela dos buffs
    const pc = clamp(0.11 + (r === 'Mid' ? 0.09 : 0) + (dj.map - aj.tac.gank) / 200 + (win ? 0.08 : 0) + (m.vision === d ? 0.05 : 0), 0.04, 0.45);
    const counter = Math.random() < pc;
    const def = P(laneOf(r), 'escape'); if (counter) def.push({ role: 'Jungle', sk: 'gank' });
    return { kind: 'gank', jg: true, lane: r, counter, tag: counter ? 'Gank × counter-gank' : 'Gank', icon: 'Crosshair', loc: LANE_LOC[r], init: a,
      [a]: [{ role: 'Jungle', sk: 'gank' }, { role: r, sk: 'lane' }], [d]: def,
      dmg: counter ? 5 : 4, kill: 0.6, kills: counter ? [1, 2] : null, adv: counter ? 0 : CFG.GANK_ADV,
      say: `${nick(a, 'Jungle')} chega na rota ${LANE_TXT[r]} para gankar${counter ? `, mas ${nick(d, 'Jungle')} está por perto` : ''}` } as unknown as Ev; } },
  { w: 1.2, k: 'invade', f: a => { const d = other(a);
    return { kind: 'invade', tag: 'Invasão', icon: 'Trees', loc: 'Selva', init: a, [a]: [{ role: 'Jungle', sk: 'gank' }, { role: 'Mid', sk: 'roam' }, { role: 'Support', sk: 'vision' }], [d]: [{ role: 'Jungle', sk: 'vision' }, { role: 'Mid', sk: 'fight' }, { role: 'Support', sk: 'vision' }], dmg: 3, kill: 0.2,
      say: `${tname(a)} invade a selva de ${nick(d, 'Jungle')}` } as unknown as Ev; } },
  { w: 1.3, min: 240, k: 'roam', f: a => { const tgt = rnd<Role>(['Top', 'Adc']), d = other(a);
    return { kind: 'gank', lane: tgt, tag: 'Roam', icon: 'Footprints', loc: LANE_LOC[tgt], init: a, [a]: [{ role: 'Mid', sk: 'roam' }, { role: 'Jungle', sk: 'gank' }], [d]: P(laneOf(tgt), 'escape'), dmg: 3, kill: 0.6, adv: CFG.GANK_ADV,
      say: `${nick(a, 'Mid')} sai do meio e roda para a rota ${LANE_TXT[tgt]}` } as unknown as Ev; } },
  { w: 9, min: 180, max: 270, once: 'crab', k: 'invade', f: a => ({ kind: 'invade', tag: 'Caranguejo do rio', icon: 'Shell', loc: 'Rio', init: a, blue: [{ role: 'Jungle', sk: 'smite' }, { role: 'Mid', sk: 'roam' }], red: [{ role: 'Jungle', sk: 'smite' }, { role: 'Mid', sk: 'roam' }], dmg: 2, kill: 0.12,
    say: `${nick('blue', 'Jungle')} e ${nick('red', 'Jungle')} disputam o Caranguejo do rio (2:55)` }) },
];
const objParts = (roles: Role[], sk: string): Part[] => roles.map(role => ({ role, sk: role === 'Jungle' ? 'smite' : sk }));
const OBJ: Record<string, { tag: string; icon: string; loc: string; parts: Part[]; dmg: number; kill: number; kills?: [number, number] }> = {
  dragon: { tag: 'Dragão', icon: 'Flame', loc: 'Covil do Dragão', parts: objParts(['Jungle', 'Mid', 'Adc', 'Support'], 'obj'), dmg: 3, kill: 0.3 },
  grubs: { tag: 'Vastilarvas', icon: 'Bug', loc: 'Covil do Barão', parts: objParts(['Jungle', 'Top', 'Mid'], 'obj'), dmg: 3, kill: 0.2 },
  herald: { tag: 'Arauto', icon: 'ScanEye', loc: 'Covil do Barão', parts: objParts(['Jungle', 'Top', 'Mid'], 'obj'), dmg: 5, kill: 0.3 },
  baron: { tag: 'Barão', icon: 'Crown', loc: 'Covil do Barão', parts: objParts(ROLES, 'fight'), dmg: 9, kill: 0.6, kills: [1, 2] },
  elder: { tag: 'Dragão Ancião', icon: 'Sparkles', loc: 'Covil do Dragão', parts: objParts(ROLES, 'clutch'), dmg: 11, kill: 0.7, kills: [2, 3] },
};

// ================= estruturas =================
const STRUCT_BLUE: Record<string, Record<string, [number, number]>> = {
  top: { outer: [9, 30], inner: [9, 52], inhibT: [9, 69], inhib: [9, 77] },
  mid: { outer: [38, 62], inner: [31, 69], inhibT: [25, 75], inhib: [20.5, 79.5] },
  bot: { outer: [70, 91], inner: [48, 91], inhibT: [31, 91], inhib: [23, 91] },
};
const NEXUS_T: [number, number][] = [[13, 82], [18, 87]], NEXUS: [number, number] = [11, 89];
const MIRROR: Record<string, string> = { top: 'bot', mid: 'mid', bot: 'top' };
const LANE_PT: Record<string, string> = { top: 'do topo', mid: 'do meio', bot: 'de baixo' };
const KIND_PT: Record<string, string> = { outer: 'Torre externa', inner: 'Torre interna', inhibT: 'Torre do inibidor', inhib: 'Inibidor', nexusT: 'Torre do Nexus' };
const LANE_KEY: Record<string, string> = { Top: 'top', Mid: 'mid', Adc: 'bot' };
function buildStructs() {
  const S = {} as Match['S'];
  (['blue', 'red'] as Side[]).forEach(sd => {
    const pos = (lane: string, kind: string): [number, number] => { const p = sd === 'blue' ? STRUCT_BLUE[lane][kind] : STRUCT_BLUE[MIRROR[lane]][kind]; return sd === 'blue' ? p : [100 - p[0], 100 - p[1]]; };
    const L = ['top', 'mid', 'bot'].sort(() => Math.random() - 0.5), list: Struct[] = [];
    L.forEach((ln, i) => list.push({ kind: 'outer', lane: ln, th: [26, 34, 42][i], p: pos(ln, 'outer'), alive: true, plates: 5 }));
    L.forEach((ln, i) => list.push({ kind: 'inner', lane: ln, th: [46, 54, 62][i], p: pos(ln, 'inner'), alive: true, plates: 5 }));
    L.forEach((ln, i) => { list.push({ kind: 'inhibT', lane: ln, th: [70, 78, 85][i], p: pos(ln, 'inhibT'), alive: true, plates: 5 }); list.push({ kind: 'inhib', lane: ln, th: [72, 80, 87][i], p: pos(ln, 'inhib'), alive: true, plates: 0 }); });
    const nt = sd === 'blue' ? NEXUS_T : NEXUS_T.map(p => [100 - p[0], 100 - p[1]] as [number, number]);
    nt.forEach((p, i) => list.push({ kind: 'nexusT', lane: '', th: [92, 96][i], p, alive: true, plates: 0 }));
    S[sd] = { list, nexus: sd === 'blue' ? NEXUS : [100 - NEXUS[0], 100 - NEXUS[1]] };
  });
  return S;
}
function destroyStruct(att: Side, s: Struct) {
  const m = M!; s.alive = false;
  let g = s.kind === 'inhib' ? CFG.INHIB_G : CFG.TOWER_G + s.plates * CFG.PLATE_G;
  s.plates = 0;
  if (s.kind !== 'inhib') {
    m.towers[att]++;
    if (!m.first.tower) { m.first.tower = att; g += CFG.FIRST_TOWER_BONUS; }
  } else m.inhibs[att]++;
  m.gold[att] += g;
  addLog({ side: att, kind: 'tower', icon: s.kind === 'inhib' ? 'Hexagon' : 'Castle', html: `<b class="h">${KIND_PT[s.kind]}${s.lane ? ' ' + LANE_PT[s.lane] : ''}</b> de ${ttag(other(att))} destruída${m.first.tower === att && m.towers[att] === 1 ? ' · <b class="gold">primeira torre (+300)</b>' : ''}` });
}
function checkStructures() {
  const m = M!;
  (['blue', 'red'] as Side[]).forEach(att => {
    const push = myBar(att);
    if (push <= m.maxPush[att]) return;
    m.maxPush[att] = push;
    m.S[other(att)].list.forEach(s => { if (s.alive && push >= s.th) destroyStruct(att, s); });
  });
}
// placas são permanentes em 2026: pega a torre de placa mais externa viva da rota
function takePlates(att: Side, lane: Role | undefined, n: number) {
  const m = M!, key = LANE_KEY[lane || 'Mid'];
  const s = m.S[other(att)].list.find(x => x.alive && x.lane === key && x.plates > 0);
  if (!s) return 0;
  const k = Math.min(n, s.plates); s.plates -= k; m.plates[att] += k; m.gold[att] += k * CFG.PLATE_G;
  // sem placas, a torre cai na própria rota (caminho independente da barra de domínio)
  if (s.plates === 0) destroyStruct(att, s);
  return k;
}

// ================= ciclo =================
export function setupMatch() {
  const cs: Record<string, number> = {};
  (['blue', 'red'] as Side[]).forEach(sd => teamOf(sd).roster.forEach(p => { cs[p.id] = 0.88 + Math.random() * 0.12 + (p.laning - 75) / 300; }));
  const g0 = () => ({ att: 0, kill: 0, flash: 0, press: 0, none: 0, pun: 0, counter: 0 });
  M = { t: 0, bar: 0, over: false, running: false, phase: null, gold: { blue: 2500, red: 2500 }, drakes: { blue: 0, red: 0 }, soul: null,
    grubs: null, herald: null, barons: { blue: 0, red: 0 }, baron: { side: null, until: 0 }, elder: { side: null, until: 0 },
    form: { blue: gauss() * CFG.FORM_SD, red: gauss() * CFG.FORM_SD }, vision: null,
    next: { dragon: CFG.DRAGON_AT, grubs: CFG.GRUBS_AT, herald: CFG.HERALD_AT, baron: CFG.BARON_AT, elder: null },
    first: { blood: null, tower: null, dragon: null, herald: null, grubs: null, baron: null },
    kills: { blue: 0, red: 0 }, towers: { blue: 0, red: 0 }, inhibs: { blue: 0, red: 0 }, plates: { blue: 0, red: 0 }, maxPush: { blue: 0, red: 0 },
    S: buildStructs(), nexusDown: null, log: [], stats: {}, csF: cs, card: null,
    comp: { blue: compOf(picksOf('blue')), red: compOf(picksOf('red')) }, quests: {},
    kstreak: {}, dstreak: {}, lastDeath: {}, gk: { blue: g0(), red: g0() }, timeline: [{ t: 0, gd: 0, wp: 0.5, bar: 0 }], gd15: null, done: {} };
  (['blue', 'red'] as Side[]).forEach(sd => teamOf(sd).roster.forEach(p => { M!.stats[p.id] = { side: sd, role: p.role, k: 0, d: 0, a: 0, nota: 6.0 }; M!.quests[p.id] = { p: 0, done: false, at: null }; }));
  addLog({ side: '', kind: 'sys', html: `${tname('blue')} (lado ${series.mapSide.blue.toLowerCase()}) contra ${tname('red')} (lado ${series.mapSide.red.toLowerCase()})` });
}
export const passFilter = (e: LogE, f: string) => f === 'all' || e.kind === 'sys' || (f === 'kills' && e.kills) || f === e.kind;
let onLog: ((e: LogE) => void) | null = null;
export const setOnLog = (fn: ((e: LogE) => void) | null) => { onLog = fn; };
function addLog(e: Omit<LogE, 't'>) { const x = { ...e, t: M!.t }; M!.log.unshift(x); if (onLog) onLog(x); }
const bump = (id: string, d: number) => { const s = M!.stats[id]; s.nota = clamp(s.nota + d, 1, 10); };

// ouro de abate 2026: abate repetido na mesma vítima vale menos (0,4); sequências viram recompensa (bounty)
function killGold(vid: string) {
  const m = M!, ds = m.dstreak[vid] || 0, ks = m.kstreak[vid] || 0;
  return Math.round(CFG.KILL_G * Math.max(0.35, 1 - 0.2 * ds) + Math.min(700, Math.max(0, ks - 1) * 100));
}
function registerKill(win: Side, killerRole: Role, victimRole: Role, assists: Role[]) {
  const m = M!, lose = other(win), kid = plOf(win, killerRole).id, vid = plOf(lose, victimRole).id;
  let g = killGold(vid);
  if (!m.first.blood) { m.first.blood = win; g += CFG.FB_BONUS; }
  m.gold[win] += g;
  m.stats[kid].k++; m.stats[vid].d++; m.kills[win]++;
  m.kstreak[kid] = (m.kstreak[kid] || 0) + 1; m.dstreak[kid] = 0;
  m.dstreak[vid] = (m.dstreak[vid] || 0) + 1; m.kstreak[vid] = 0;
  m.lastDeath[vid] = m.t;
  bump(kid, 0.3); bump(vid, -0.3);
  assists.filter(x => x !== killerRole).forEach(x => { m.stats[plOf(win, x).id].a++; bump(plOf(win, x).id, 0.08); m.gold[win] += 75; });
  return esc(plOf(lose, victimRole).nickname);
}

// resolve o lance (rolagens) sem aplicar
export function resolveEvent(ev: Ev, objKey: string | null): Res {
  const rb = rollSide('blue', ev.blue, ev.kind, objKey), rr = rollSide('red', ev.red, ev.kind, objKey);
  if (ev.adv) { const r = ev.init === 'blue' ? rb : rr; r.total += ev.adv; r.adv = ev.adv; }
  if (ev.counter) { const r = ev.init === 'blue' ? rr : rb; r.total += 3; }   // quem chega por último tem a vantagem
  const diff = rb.total - rr.total;
  let win: Side = diff === 0 ? (Math.random() < 0.5 ? 'blue' : 'red') : diff > 0 ? 'blue' : 'red';
  let contest = !objKey && Math.abs(diff) < CFG.CONTEST && ev.kind !== 'gank';
  let steal = false, gank: string | undefined;
  if (objKey && ['dragon', 'baron', 'elder'].includes(objKey)) steal = Math.random() < 0.03 * plOf(other(win), 'Jungle').tac.objectives / 80;
  // gank sem counter: resultado categórico calibrado (≈44% abate · 33% Flash · 18% pressão · 5% nada; quem ganka morre ≈15%)
  if (ev.kind === 'gank' && !ev.counter) {
    const d = (ev.init === 'blue' ? diff : -diff) - CFG.GANK_ADV;
    const tilt = Math.exp(d / 22);
    const w = { kill: 0.42 * tilt, flash: 0.37, press: 0.16, none: 0.05 / tilt, pun: 0.07 / tilt };
    let r = Math.random() * (w.kill + w.flash + w.press + w.none + w.pun);
    gank = 'pun';
    for (const [k, v] of Object.entries(w)) { if ((r -= v) <= 0) { gank = k; break; } }
    win = gank === 'pun' ? other(ev.init) : ev.init;
    contest = gank === 'none';
  }
  return { ev, objKey, rb, rr, win, contest, steal, margin: Math.abs(diff), done: false, gank };
}
const rolesOf = (parts: Part[]) => parts.map(p => p.role);

export function commitEvent(R: Res) {
  const m = M!;
  if (R.done) return R; R.done = true;
  const { ev, objKey, rb, rr, contest } = R, br = rolesOf(ev.blue), rdr = rolesOf(ev.red);
  if (ev.jg && ev.kind === 'gank') { const g = m.gk[ev.init]; g.att++; if (ev.counter) g.counter++; else if (R.gank) (g as Record<string, number>)[R.gank]++; }
  if (contest) {
    br.forEach(r => bump(plOf('blue', r).id, 0.02)); rdr.forEach(r => bump(plOf('red', r).id, 0.02));
    R.real = 0; R.victims = [];
    addLog({ side: '', kind: 'play', icon: ev.icon, html: `<b class="h">${ev.tag}</b> · ${ev.say}<span class="roll">${ttag('blue')} ${rb.total} × ${rr.total} ${ttag('red')} · ${R.gank === 'none' ? 'o alvo percebe a tempo e nada acontece' : 'contenda, ninguém leva vantagem'}</span>` });
    return R;
  }
  const win = R.win, lose = other(win), phase = PHASE_OF(m.t);
  let mult = CFG.DMG_K * CFG.PHASE_MULT[phase] * (1 + Math.min(0.5, R.margin / 40)) * (m.t > 1800 ? 1 + (m.t - 1800) / 900 : 1);
  R.trailing = myBar(win) < -15;
  if (R.trailing) mult *= CFG.TRAIL_MULT;
  if (!objKey) { if (m.baron.side === win && m.t < m.baron.until) mult *= 1.6; if (m.elder.side === win && m.t < m.elder.until) mult *= 1.5; }
  if (R.steal) mult *= 0.5;
  if (R.free) mult *= 0.6;
  if (R.gank === 'flash') mult *= 0.6; else if (R.gank === 'press') mult *= 0.4;
  // Crystalline Overgrowth: torre sem defensor (laner morto nos últimos 90 s) toma dano verdadeiro extra
  let crystal = false;
  if ((ev.kind === 'plates' || ev.kind === 'siege') && ev.lane) {
    const dId = plOf(lose, ev.lane).id; if (m.lastDeath[dId] !== undefined && m.t - m.lastDeath[dId] <= 90) { crystal = true; mult *= 1.3; }
  }
  const dmg = Math.max(1, Math.round(ev.dmg * mult)), before = m.bar, cap = barCap(m.t);
  m.bar = clamp(m.bar + (win === 'blue' ? dmg : -dmg), -cap, cap);
  const real = Math.abs(m.bar - before);
  m.gold[win] += dmg * 60; m.gold[lose] += 40;
  if (ev.vision) m.vision = win; else if (m.vision) m.vision = null;
  const wr = win === 'blue' ? br : rdr, lr = win === 'blue' ? rdr : br;
  wr.forEach(r => bump(plOf(win, r).id, 0.12)); lr.forEach(r => bump(plOf(lose, r).id, -0.1));
  const victims: string[] = [], back: string[] = [];
  let plates = 0;
  if (ev.kind === 'plates' || ev.kind === 'siege') plates = takePlates(win, ev.lane, ev.kind === 'plates' ? (Math.random() < 0.5 ? 1 : 2) + (crystal ? 1 : 0) : 2);
  // abates
  let doKill: boolean;
  if (ev.kind === 'gank' && !ev.counter) doKill = R.gank === 'kill' || R.gank === 'pun';
  else doKill = Math.random() < Math.min(0.95, ev.kill * CFG.KILL_K * (R.free ? 0.2 : 1));
  if (doKill) {
    if (ev.kind === 'gank' && !ev.counter) {
      if (R.gank === 'kill') { const vr = rnd(lr.filter(x => x !== 'Jungle')) || lr[0]; victims.push(registerKill(win, rnd(wr), vr, wr));
        if (Math.random() < 0.08) back.push(registerKill(lose, lr[0], 'Jungle', lr)); }          // troca: o caçador também morre
      else victims.push(registerKill(win, rnd(wr), 'Jungle', wr));                                  // gank punido: quem gankou morre
    } else {
      const n = (ev.kills ? ev.kills[0] + Math.floor(Math.random() * (ev.kills[1] - ev.kills[0] + 1)) : 1) + (Math.random() < CFG.KILL_EXTRA ? 1 : 0);
      for (let i = 0; i < Math.min(n, lr.length); i++) victims.push(registerKill(win, rnd(wr), lr[i % lr.length], wr));
      if (ev.kills && phase === 'late' && Math.random() < 0.35) back.push(registerKill(lose, rnd(lr), rnd(wr), lr));
    }
    if (m.first.blood === win && m.kills.blue + m.kills.red === victims.length + back.length) R.firstBlood = true;
  }
  R.real = real; R.victims = victims; R.back = back;
  if (objKey) afterObjective(objKey, R.steal ? lose : win);
  const [title, sub] = outcome(R), tag = win === 'blue' ? 'blue' : 'red';
  addLog({ side: win, kind: objKey ? 'obj' : 'play', kills: victims.length > 0, icon: ev.icon, big: objKey === 'baron' || objKey === 'elder',
    html: `<b class="h ${tag}">${ev.tag}: ${title}</b> · ${ev.say}
      <span class="roll">${ttag('blue')} ${rb.total} × ${rr.total} ${ttag('red')} · ${sub}</span>
      <span class="${tag}" style="font-weight:600">${ttag(win)} ${real ? '+' + Math.round(real / 2) + '%' : 'segura a posição'}${R.trailing ? ' · reação' : ''}</span>${victims.length ? ' · abate' + (victims.length > 1 ? 's' : '') + ': ' + victims.join(', ') : ''}${back.length ? ' · troca: ' + back.join(', ') : ''}${plates ? ` · ${plates} placa${plates > 1 ? 's' : ''}` : ''}${crystal ? ' · <b class="gold">cristal</b>' : ''}${R.firstBlood ? ' · <b class="gold">first blood</b>' : ''}` });
  return R;
}
export function outcome(R: Res): [string, string] {
  const ev = R.ev, a = ev.init, ok = R.win === a, k = R.victims ? R.victims.length : 0, W = ttag(R.win), D = ttag(other(a)), A = ttag(a);
  const kills = k ? `${k} abate${k > 1 ? 's' : ''} para ${W}` : 'sem abates';
  if (R.contest) return R.gank === 'none' ? ['Gank lido', 'O alvo recua a tempo'] : ['Contenda', 'Ninguém leva vantagem'];
  if (R.objKey && R.steal) return ['Roubo!', `${nick(other(R.win), 'Jungle')} rouba ${ev.tag === 'Barão' ? 'o Barão' : 'o ' + ev.tag} com o Smite`];
  if (R.objKey) return [`${W} garante ${ev.tag === 'Vastilarvas' ? 'as Vastilarvas' : 'o ' + ev.tag}`, R.free ? 'Sem disputa: o adversário não tinha prioridade' : kills];
  switch (ev.kind) {
    case 'gank':
      if (ev.counter) return ok ? (k ? ['Gank vence o 2×2', `${A} ganha a briga dos caçadores`] : ['Gank segura', 'Os dois caçadores se anulam']) : ['Counter-gank!', k ? `${D} chega a tempo e pune` : `${D} chega a tempo e salva a rota`];
      if (R.gank === 'kill') return ['Abate!', `${ev.tag} bem-sucedido de ${A}`];
      if (R.gank === 'flash') return ['Flash queimado', `O alvo escapa, mas sem Flash pelos próximos 5 minutos`];
      if (R.gank === 'press') return ['Pressão', 'O alvo recua sem vida e perde farm e placas'];
      return ['Gank punido', `${D} reage e derruba ${nick(a, ev.tag === 'Roam' ? 'Mid' : 'Jungle')}`];
    case 'duel': return k ? [ev.blue.length > 1 ? 'Abate na rota' : 'Abate solo', `${W} vence a troca`] : ['Vantagem na troca', `${W} sai na frente em ouro e vida`];
    case 'invade': return ok ? (k ? ['Invasão com abate', `${A} rouba a selva e pega um abate`] : ['Invasão bem-sucedida', `${A} rouba campos da selva`]) : (k ? ['Invasão punida', `${D} pega os invasores`] : ['Invasão repelida', `${D} defende a selva`]);
    case 'ward': return ok ? ['Visão garantida', `${A} enxerga o mapa nas próximas disputas`] : ['Sentinela limpa', `${D} nega a visão`];
    case 'plates': return ok ? ['Placas derrubadas', `${A} ganha ouro de placas`] : ['Torre defendida', `${D} segura a rota`];
    case 'fight': return [`${W} vence a luta`, kills];
    case 'pick': return ok ? (k ? ['Pickoff!', `${R.victims![0]} é eliminado`] : ['Pressão', 'O alvo recua sem vida']) : (k ? ['Emboscada virada', `${D} reage e pune`] : ['Emboscada falhou', 'O alvo escapa']);
    case 'siege': return ok ? ['Cerco bem-sucedido', `${A} avança sobre a torre`] : ['Cerco repelido', `${D} segura a torre`];
    case 'split': return ok ? ['Pressão na lateral', `${A} força a resposta do adversário`] : ['Split punido', `${D} pega o jogador sozinho`];
    case 'base': return ok ? ['Base invadida', `${A} entra na base`] : ['Defesa da base', `${D} segura o Nexus`];
  }
  return [`${W} vence`, kills];
}
function afterObjective(key: string, win: Side) {
  const m = M!;
  if (!m.first[key] && key !== 'elder') m.first[key] = win;
  if (key === 'dragon') {
    m.drakes[win]++; m.gold[win] += CFG.DRAGON_G;
    if (m.drakes[win] >= 4) { m.soul = win; m.next.dragon = null; m.next.elder = m.t + CFG.ELDER_RESPAWN; addLog({ side: win, kind: 'obj', icon: 'Flame', big: true, html: `<b class="h ${win === 'blue' ? 'blue' : 'red'}">Alma do dragão</b> para ${tname(win)}. O Ancião nasce em 6 minutos.` }); }
    else m.next.dragon = m.t + CFG.DRAGON_RESPAWN;
  }
  if (key === 'grubs') { m.grubs = win; m.next.grubs = null; m.gold[win] += CFG.GRUBS_G; }
  if (key === 'herald') { m.herald = win; m.next.herald = null; m.gold[win] += CFG.HERALD_G; takePlates(win, rnd(LANES), 3); }
  if (key === 'baron') { m.barons[win]++; m.gold[win] += CFG.BARON_G; m.baron = { side: win, until: m.t + CFG.BARON_BUFF }; m.next.baron = m.t + CFG.BARON_RESPAWN; }
  if (key === 'elder') { m.gold[win] += CFG.ELDER_G; m.elder = { side: win, until: m.t + CFG.ELDER_BUFF }; m.next.elder = m.t + CFG.ELDER_RESPAWN; }
}

// Role Quests 2026: progresso por tick (farm/rota), completa por volta dos 13–17 min
const QUEST_RATE: Record<Role, number> = { Top: 3.3, Jungle: 3.6, Mid: 3.3, Adc: 3.5, Support: 3.4 };
const QUEST_PT: Record<Role, string> = { Top: 'nível 20 liberado e TP potencializado', Jungle: 'Smite evoluído (pet com 35 cargas)', Mid: 'botas T3 e recall potencializado', Adc: '+300 de ouro e o 7º slot', Support: 'control wards guardadas no slot da quest' };
function questTick() {
  const m = M!;
  (['blue', 'red'] as Side[]).forEach(sd => teamOf(sd).roster.forEach(p => {
    const q = m.quests[p.id]; if (q.done) return;
    const lead = clamp(myBar(sd) / 20, -1, 1), X = tacticsOf(teamOf(sd));
    const farmy = (p.role === 'Jungle' ? X.jungle === 'farm' : X.lanes === 'farm') ? 0.4 : 0;
    q.p += QUEST_RATE[p.role] * (0.85 + p.farm / 500 + lead * 0.15 + farmy) * (0.85 + Math.random() * 0.3);
    if (q.p >= 100) {
      q.done = true; q.at = m.t;
      if (p.role === 'Adc') m.gold[sd] += 300;
      addLog({ side: sd, kind: 'quest', icon: 'ScrollText', html: `<b class="h ${sd === 'blue' ? 'blue' : 'red'}">Role Quest</b> · ${esc(p.nickname)} completa a quest: ${QUEST_PT[p.role]}` });
    }
  }));
}

// pressão de rota: placas caem aos poucos pela rota que vence o matchup (placas permanentes em 2026)
function lanePlates() {
  const m = M!; if (m.t < CFG.PLATE_START) return;
  LANES.forEach(r => {
    if (Math.random() > CFG.PLATE_P) return;
    const e = (skill('blue', r, SK.lane.w) - skill('red', r, SK.lane.w)) / 30 + m.bar / 200;
    const sd: Side = Math.random() < sigmoid(e) ? 'blue' : 'red';
    takePlates(sd, r, 1);
  });
}

// probabilidade de vitória exibida (estado: ouro, torres, barra, buffs)
export function winProb(m: Match) {
  const tm = m.t / 60;
  const x = (m.gold.blue - m.gold.red) / (1500 + 60 * tm) * 0.55 + m.bar / 45 + 0.08 * (m.towers.blue - m.towers.red)
    + (m.soul === 'blue' ? 0.6 : m.soul === 'red' ? -0.6 : 0)
    + (m.baron.side && m.t < m.baron.until ? (m.baron.side === 'blue' ? 0.8 : -0.8) : 0)
    + (m.elder.side && m.t < m.elder.until ? (m.elder.side === 'blue' ? 1 : -1) : 0);
  return sigmoid(x);
}

// avança 30 s; devolve o lance resolvido (ainda não aplicado) ou null
export function stepTime(): Res | null {
  const m = M!;
  m.t += CFG.TICK;
  m.gold.blue += CFG.GOLD_TICK + tacticGold('blue') + (questDone('blue', 'Adc') ? 30 : 0);
  m.gold.red += CFG.GOLD_TICK + tacticGold('red') + (questDone('red', 'Adc') ? 30 : 0);
  questTick();
  lanePlates();
  if (m.t % 60 === 0) m.timeline.push({ t: m.t, gd: m.gold.blue - m.gold.red, wp: winProb(m), bar: m.bar });
  if (m.t === 900) m.gd15 = m.gold.blue - m.gold.red;
  const ph = PHASE_OF(m.t);
  if (ph !== m.phase) {
    if (m.phase) (['blue', 'red'] as Side[]).forEach(sd => { m.form[sd] = m.form[sd] * CFG.FORM_KEEP + gauss() * CFG.FORM_SD * Math.sqrt(1 - CFG.FORM_KEEP ** 2); });
    m.phase = ph; addLog({ side: '', kind: 'sys', html: PHASE_PT[ph] });
  }
  if (m.next.grubs !== null && m.t > CFG.GRUBS_END) m.next.grubs = null;
  if (m.next.herald !== null && m.t > CFG.HERALD_END) m.next.herald = null;
  const due = ['elder', 'baron', 'dragon', 'herald', 'grubs'].find(k => m.next[k] !== null && m.t >= m.next[k]! && (k !== 'baron' || Math.random() < CFG.BARON_P));
  if (due) {
    const o = OBJ[due];
    const txt: Record<string, string> = { dragon: `${m.drakes.blue + m.drakes.red + 1}º dragão elemental em disputa`, grubs: 'As duas equipes disputam as Vastilarvas', herald: 'Disputa pelo Arauto',
      baron: 'Disputa pelo Barão Nashor', elder: 'O Dragão Ancião despertou' };
    // prioridade: quem domina o mapa pega sem lutar (o relatório: objetivo vem do estado, não de bônus fixo)
    const prio = m.bar / 30 + (m.gold.blue - m.gold.red) / 3000;
    const freeP = clamp((Math.abs(prio) - 0.6) * 0.35, 0, 0.55);
    if (Math.random() < freeP) {
      const sd: Side = prio > 0 ? 'blue' : 'red';
      const parts = o.parts;
      const R = resolveEvent({ ...o, kind: 'obj', blue: parts, red: parts, say: txt[due] + ' · ' + tname(sd) + ' tem prioridade nas rotas', init: sd }, due);
      R.win = sd; R.free = true; R.steal = false;
      return R;
    }
    return resolveEvent({ ...o, kind: 'obj', blue: o.parts, red: o.parts, say: txt[due], init: 'blue' }, due);
  }
  const aggr = (sd: Side) => teamOf(sd).roster.reduce((a, p) => a + p.hid.aggression, 0) / 5;
  if (m.t >= CFG.JG_START && m.t <= CFG.JG_END && Math.random() < CFG.JG_P) {
    const jgA = (sd: Side) => aggr(sd) + plOf(sd, 'Jungle').tac.gank / 10;
    const attacker: Side = Math.random() < 0.5 + m.bar / 400 + (jgA('blue') - jgA('red')) / 60 + tacticInit('blue', true) - tacticInit('red', true) ? 'blue' : 'red';
    const pool = JG_EVENTS.filter(e => (!e.min || m.t >= e.min) && (!e.max || m.t <= e.max) && !(e.once && m.done[e.once])).map(e => ({ e, w: e.w * tacticWeight(attacker, e.k === 'roam' ? 'gank' : e.k) }));
    if (pool.length) {
      let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), ev = pool[0].e;
      for (const x of pool) { if ((r -= x.w) <= 0) { ev = x.e; break; } }
      if (ev.once) m.done[ev.once] = true;
      return resolveEvent(ev.f(attacker), null);
    }
  }
  if (Math.random() < (m.t < 150 ? 0.06 : CFG.EV_P[ph])) {
    const attacker: Side = Math.random() < 0.5 + m.bar / 400 + (aggr('blue') - aggr('red')) / 60 + tacticInit('blue', false) - tacticInit('red', false) ? 'blue' : 'red';
    const boost = IDENT_BOOST[m.comp[attacker].id] || {};
    const pool = EVENTS[ph].filter(e => !e.min || m.t >= e.min).map(e => ({ e, w: e.w * (boost[e.k] || 1) * tacticWeight(attacker, e.k) }));
    if (!pool.length) return null;
    let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), ev = pool[0].e;
    for (const x of pool) { if ((r -= x.w) <= 0) { ev = x.e; break; } }
    return resolveEvent(ev.f(attacker), null);
  }
  return null;
}
export function afterCommit(onEnd: () => void) {
  checkStructures();
  if (Math.abs(M!.bar) >= 100) finishCore(onEnd);
}
function finishCore(onEnd: () => void) {
  const m = M!;
  if (m.over) return;
  m.over = true; m.running = false;
  const win: Side = m.bar > 0 ? 'blue' : 'red';
  m.S[other(win)].list.forEach(s => { s.alive = false; }); m.nexusDown = other(win);
  teamOf(win).roster.forEach(p => bump(p.id, 0.3));
  m.timeline.push({ t: m.t, gd: m.gold.blue - m.gold.red, wp: win === 'blue' ? 1 : 0, bar: m.bar });
  addLog({ side: win, kind: 'obj', icon: 'Trophy', big: true, html: `<b class="h ${win === 'blue' ? 'blue' : 'red'}">Nexus destruído.</b> ${tname(win)} vence em ${fmtT(m.t)} · abates ${m.kills.blue} × ${m.kills.red}` });
  onEnd();
}
// modo instantâneo
export function runToEnd(onEnd: () => void) {
  const m = M!;
  if (m.card && !m.card.R.done) { commitEvent(m.card.R); afterCommit(onEnd); }
  m.card = null;
  let g = 0;
  while (!m.over && g++ < 400) { const R = stepTime(); if (R) commitEvent(R); afterCommit(onEnd); }
}
export function mvpOf(side: Side) {
  const m = M!; let best: { id: string; s: PStat } | null = null;
  Object.entries(m.stats).filter(([, s]) => s.side === side).forEach(([id, s]) => { if (!best || s.nota > best.s.nota) best = { id, s }; });
  const b = best!, p = teamOf(side).roster.find(x => x.id === b.id)!;
  return { p, s: b.s, c: picksOf(side)[p.role] };
}
export function levelOf(id: string) {
  const m = M!, s = m.stats[id], mins = m.t / 60, rate = { Top: 0.62, Mid: 0.62, Jungle: 0.58, Adc: 0.57, Support: 0.5 }[s.role];
  const cap = s.role === 'Top' && m.quests[id]?.done ? 20 : 18;
  return Math.max(1, Math.min(cap, Math.floor(1 + mins * rate + s.k * 0.15 + s.a * 0.05 - s.d * 0.05)));
}
export function csOf(id: string) {
  const m = M!, s = m.stats[id], rate = { Top: 8.2, Jungle: 6.2, Mid: 8.6, Adc: 9.0, Support: 1.3 }[s.role];
  return Math.max(0, Math.round(Math.max(0, m.t - 30) / 60 * rate * m.csF[id]));
}
export const snapshotMatch = () => M;
export const restoreMatch = (m: Match | null) => { M = m; };
