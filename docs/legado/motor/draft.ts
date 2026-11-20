// Série (Fearless + First Selection 2026), draft oficial, encaixe jogador × campeão e estratégias de draft.
import { champions, champById, emit, G, other, plOf, rnd, ROLES, teamOf, teamOvr } from './core';
import type { Champion, Player, Role, Side, Team } from './types';

// ---------- encaixe ----------
export const aptFor = (p: Player, c: Champion) => c.styles.reduce((a, s) => a + (p.apt[s] || 50), 0) / c.styles.length;
export const masteryOf = (p: Player, c: Champion) => p.mastery[c.id] ?? (0.2 + 0.4 * aptFor(p, c) / 99);
export const fitOf = (p: Player, c: Champion) => 0.5 * masteryOf(p, c) + 0.35 * aptFor(p, c) / 99 + 0.15 * p.hid.versatility / 20;
// Fearless: fora do pool o jogador perde força (quanto menos versátil, mais perde)
export const offPoolPenalty = (p: Player, c: Champion) => masteryOf(p, c) < 0.4 ? 2 + 6 * (1 - p.hid.versatility / 20) : 0;
export const fitsRole = (c: Champion, role: Role) => c.role === role || c.secondaryRole === role;

// ---------- identidade da composição ----------
export type CompId = 'engage' | 'poke' | 'protect' | 'pick' | 'split';
export const COMP_KEYS: CompId[] = ['engage', 'poke', 'protect', 'pick', 'split'];
export const COMP_NM: Record<CompId, string> = { engage: 'Engage', poke: 'Poke e cerco', protect: 'Proteger o carry', pick: 'Pick', split: 'Split push' };
export const TIMING_NM: Record<string, string> = { early: 'início forte', scaling: 'escala', mid: 'equilibrada' };
// matriz do relatório: engage > poke > protect > engage ; pick > split > engage
export const BEATS: Record<CompId, CompId> = { engage: 'poke', poke: 'protect', protect: 'engage', pick: 'split', split: 'engage' };
export const TAG_COMP: Record<string, Partial<Record<CompId, number>>> = { en: { engage: 1 }, po: { poke: 1 }, si: { poke: 0.7 }, pe: { protect: 1 }, de: { protect: 0.7 }, pk: { pick: 1 }, sp: { split: 1 } };
export const STYLE_COMP: Record<string, Partial<Record<CompId, number>>> = { T: { engage: 0.5 }, P: { protect: 0.5 }, H: { protect: 0.4 }, C: { pick: 0.5 }, A: { pick: 0.5 }, K: { poke: 0.5 }, F: { split: 0.3 } };
export interface Comp { id: CompId; timing: 'early' | 'scaling' | 'mid' }
export type Picks = Record<Role, Champion | null>;
export function compOf(picks: Picks): Comp {
  const sc: Record<CompId, number> = { engage: 0, poke: 0, protect: 0, pick: 0, split: 0 }; let ea = 0, scl = 0;
  ROLES.forEach(r => {
    const c = picks[r]; if (!c) return;
    c.tags.forEach(t => { Object.entries(TAG_COMP[t] || {}).forEach(([k, v]) => { sc[k as CompId] += v!; }); if (t === 'ea') ea++; if (t === 'sc') scl++; });
    c.styles.forEach(st => Object.entries(STYLE_COMP[st] || {}).forEach(([k, v]) => { sc[k as CompId] += v!; }));
  });
  const id = (Object.keys(sc) as CompId[]).sort((a, b) => sc[b] - sc[a])[0];
  return { id, timing: ea - scl >= 2 ? 'early' : scl - ea >= 2 ? 'scaling' : 'mid' };
}
const identMatch = (c: Champion, id: CompId) => { let v = 0; c.tags.forEach(t => { v += TAG_COMP[t]?.[id] || 0; }); c.styles.forEach(s => { v += STYLE_COMP[s]?.[id] || 0; }); return Math.min(1, v); };

// ---------- série ----------
export interface Series {
  bo: number; fearless: boolean; big: boolean; game: number; wins: Record<Side, number>;
  locked: Set<string>; over: boolean;
  priority: Side;                 // quem tem a First Selection neste jogo
  choice: null | 'side' | 'order'; // o que o dono da prioridade escolheu
  first: Side;                    // quem faz o 1º pick
  mapSide: Record<Side, 'Azul' | 'Vermelho'>;
  selDone: boolean;
}
export let series: Series = null as unknown as Series;
export function resetSeries(bo = 3, fearless = true) {
  // jogo 1: prioridade para o time de maior OVR (semente melhor); depois, para quem perdeu o jogo anterior
  const pr: Side = teamOvr(G.user) >= teamOvr(G.opp) ? 'blue' : 'red';
  series = { bo, fearless, big: bo === 5, game: 1, wins: { blue: 0, red: 0 }, locked: new Set(), over: false,
    priority: pr, choice: null, first: 'blue', mapSide: { blue: 'Azul', red: 'Vermelho' }, selDone: false };
  if (pr === 'red') aiFirstSelection();
}
// First Selection 2026: quem tem prioridade escolhe LADO ou ORDEM DE PICK; o outro fica com a outra decisão.
export function applyFirstSelection(choice: 'side' | 'order', value: 'Azul' | 'Vermelho' | 'first' | 'second') {
  const pr = series.priority, op = other(pr);
  series.choice = choice;
  if (choice === 'side') {
    const s = value as 'Azul' | 'Vermelho';
    series.mapSide = pr === 'blue' ? { blue: s, red: s === 'Azul' ? 'Vermelho' : 'Azul' } : { red: s, blue: s === 'Azul' ? 'Vermelho' : 'Azul' };
    // o outro time decide a ordem: a IA prefere o 1º pick quando tem campeão de alta prioridade
    series.first = op === 'red' ? 'red' : 'blue';
  } else {
    series.first = value === 'first' ? pr : op;
    // o outro time escolhe o lado: azul (mais confortável no Barão/Arauto)
    series.mapSide = op === 'blue' ? { blue: 'Azul', red: 'Vermelho' } : { red: 'Azul', blue: 'Vermelho' };
  }
  series.selDone = true;
}
function aiFirstSelection() {
  if (Math.random() < 0.6) applyFirstSelection('order', 'first'); else applyFirstSelection('side', 'Azul');
}
// quando o usuário tem prioridade mas ainda não escolheu (ex.: modo automático), aplica o padrão
export function ensureFirstSelection() { if (!series.selDone) applyFirstSelection('order', 'first'); }

// ---------- draft (formato oficial: F = time do 1º pick, S = o outro) ----------
export const DRAFT_SEQ = ['Fb', 'Sb', 'Fb', 'Sb', 'Fb', 'Sb', 'Fp', 'Sp', 'Sp', 'Fp', 'Fp', 'Sp', 'Sb', 'Fb', 'Sb', 'Fb', 'Sp', 'Fp', 'Fp', 'Sp'];
export const PHASE_LBL = (i: number) => i < 6 ? 'Bans · fase 1' : i < 12 ? 'Picks · fase 1' : i < 16 ? 'Bans · fase 2' : 'Picks · fase 2';
const emptyPicks = (): Picks => ({ Top: null, Jungle: null, Mid: null, Adc: null, Support: null });
export interface DraftState {
  step: number; bans: Record<Side, (Champion | null)[]>; picks: Record<Side, Picks>;
  hover: Champion | null; slot: Role | null; timer: number; aiAt: number; done: boolean;
}
export let draft: DraftState = null as unknown as DraftState;
export let draftMode: 'auto' | 'manual' = 'auto';
export const setDraftModeRaw = (m: 'auto' | 'manual') => { draftMode = m; };
export const picksOf = (sd: Side) => draft.picks[sd];
export function resetDraft() {
  draft = { step: 0, bans: { blue: [], red: [] }, picks: { blue: emptyPicks(), red: emptyPicks() }, hover: null, slot: null, timer: 30, aiAt: 2, done: false };
  startStep();
}
export const curStep = () => draft.done ? null : DRAFT_SEQ[draft.step];
export const ownerOf = (st: string): Side => st[0] === 'F' ? series.first : other(series.first);
export const userTurn = () => { const s = curStep(); return !!s && ownerOf(s) === 'blue'; };
export function unavailable(c: Champion): null | 'ban' | 'pick' | 'fearless' {
  if (draft.bans.blue.includes(c) || draft.bans.red.includes(c)) return 'ban';
  if (ROLES.some(r => draft.picks.blue[r] === c || draft.picks.red[r] === c)) return 'pick';
  if (series.fearless && series.locked.has(c.id)) return 'fearless';
  return null;
}
function startStep() {
  if (draft.step >= DRAFT_SEQ.length) { draft.done = true; return; }
  const st = DRAFT_SEQ[draft.step];
  draft.timer = 30; draft.hover = null; draft.aiAt = 2 + Math.floor(Math.random() * 3);
  if (ownerOf(st) === 'blue' && st[1] === 'p') draft.slot = ROLES.find(r => !draft.picks.blue[r]) || null;
}
export function commit(side: Side, champ: Champion | null, role?: Role | null) {
  const st = DRAFT_SEQ[draft.step];
  if (st[1] === 'b') draft.bans[side].push(champ);
  else if (champ && role) draft.picks[side][role] = champ;
  draft.step++; startStep();
}
// IA: bans pelos campeões de maior encaixe do adversário, picks por encaixe + meta + counter de rota + coerência de composição
export function aiChoose(side: Side, kind: 'b' | 'p'): { champ: Champion; role?: Role } {
  const team = teamOf(side), foe = teamOf(other(side));
  const picks = picksOf(side), foePicks = picksOf(other(side));
  const avail = champions.filter(c => !unavailable(c));
  const base = (c: Champion) => (c.earlyPower + c.lateScaling) / 4;
  let best: { champ: Champion; role?: Role } | null = null, bs = -1e9;
  if (kind === 'b') {
    avail.forEach(c => {
      const f = Math.max(...foe.roster.map(p => p.mastery[c.id] ? p.mastery[c.id] : fitOf(p, c) * 0.6)), o = Math.max(...team.roster.map(p => p.mastery[c.id] || 0));
      const sc = f * 70 - o * 40 + base(c) + Math.random() * 12;
      if (sc > bs) { bs = sc; best = { champ: c }; }
    });
    return best!;
  }
  const mine = compOf(picks), started = Object.values(picks).some(Boolean);
  ROLES.filter(r => !picks[r]).forEach(role => {
    const pl = team.roster.find(p => p.role === role)!;
    avail.forEach(c => {
      let sc = fitOf(pl, c) * 70 - offPoolPenalty(pl, c) * 2 + base(c) + (c.role === role ? 25 : c.secondaryRole === role ? 8 : -40) + Math.random() * 8;
      const fp = foePicks[role];
      if (fp && c.earlyPower - fp.earlyPower >= 12) sc += 4;
      if (started && c.tags.some(t => TAG_COMP[t]?.[mine.id])) sc += 5;
      if (sc > bs) { bs = sc; best = { champ: c, role }; }
    });
  });
  return best!;
}
export const plFor = (team: Team, role: Role) => team.roster.find(p => p.role === role)!;
export const threatOf = (c: Champion) => Math.max(...G.opp.roster.map(p => fitsRole(c, p.role) ? fitOf(p, c) : 0));
export const teamFit = (sd: Side) => { const pk = picksOf(sd), f = ROLES.filter(r => pk[r]).map(r => fitOf(plOf(sd, r), pk[r]!)); return f.length ? f.reduce((a, b) => a + b, 0) / f.length : 0; };

// ---------- estratégias de draft ----------
export interface Strat { name: string; comp: CompId | null; picks: Partial<Record<Role, string[]>>; bans: string[] }
const STRATS: Record<string, Strat[]> = {};
export let activeStrat = 0;
export const setActiveStratRaw = (i: number) => { activeStrat = i; };
export function suggestPicks(team: Team, id: CompId | null) {
  const out: Partial<Record<Role, string[]>> = {}, used = new Set<string>();
  ROLES.forEach(role => {
    const pl = plFor(team, role);
    out[role] = champions.filter(c => fitsRole(c, role) && !used.has(c.id))
      .map(c => ({ c, s: fitOf(pl, c) * (id ? 0.65 : 1) + (id ? identMatch(c, id) * 0.35 : 0) + (c.role === role ? 0.03 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 3).map(x => { used.add(x.c.id); return x.c.id; });
  });
  return out;
}
function identPotential(team: Team, id: CompId) {
  return ROLES.reduce((a, role) => { const pl = plFor(team, role);
    return a + Math.max(...champions.filter(c => fitsRole(c, role)).map(c => fitOf(pl, c) * 0.6 + identMatch(c, id) * 0.4)); }, 0);
}
export function stratsOf(team: Team) {
  if (!STRATS[team.id]) {
    const ids = [...COMP_KEYS].sort((a, b) => identPotential(team, b) - identPotential(team, a)).slice(0, 2);
    STRATS[team.id] = [{ name: 'Conforto', comp: null, picks: suggestPicks(team, null), bans: [] },
      ...ids.map(id => ({ name: COMP_NM[id], comp: id, picks: suggestPicks(team, id), bans: [] as string[] }))];
  }
  return STRATS[team.id];
}
export const curStrat = () => stratsOf(G.user)[activeStrat] || stratsOf(G.user)[0];
function stratPick(S: Strat) {
  let best: { champ: Champion; role: Role; sc: number } | null = null;
  ROLES.filter(r => !draft.picks.blue[r]).forEach(role => {
    const ids = S.picks[role] || [], pl = plFor(G.user, role);
    const opts = ids.map(champById).filter((c): c is Champion => !!c && !unavailable(c));
    if (!opts.length) return;
    const c = opts[0], sc = fitOf(pl, c) * 100 - ids.indexOf(c.id) * 6 + (opts.length === 1 ? 8 : 0);
    if (!best || sc > best.sc) best = { champ: c, role, sc };
  });
  return best || aiChoose('blue', 'p');
}
// um passo do draft automático (os dois lados)
export function autoStep(useStrategy = true) {
  const st = curStep(); if (!st) return;
  const side = ownerOf(st);
  if (side === 'red' || !useStrategy) { const r = aiChoose(side, st[1] as 'b' | 'p'); commit(side, r.champ, r.role); return; }
  const S = curStrat();
  if (st[1] === 'b') { const c = S.bans.map(champById).find(x => x && !unavailable(x)); commit('blue', c || aiChoose('blue', 'b').champ); return; }
  const r = stratPick(S); commit('blue', r.champ, r.role);
}
export function autoFinish(useStrategy = true) { let g = 0; while (!draft.done && g++ < 30) autoStep(useStrategy); }
export function aiTurn() { const st = curStep(); if (!st) return; const r = aiChoose('red', st[1] as 'b' | 'p'); commit('red', r.champ, r.role); }
export function userTimeout() {
  const st = curStep()!; const h = draft.hover;
  if (st[1] === 'b') return commit('blue', h && !unavailable(h) ? h : null);
  if (h && !unavailable(h)) return commit('blue', h, draft.slot);
  const r = aiChoose('blue', 'p'); commit('blue', r.champ, r.role);
}
// 1 s de relógio do draft (chamado pela interface)
export function draftTick() {
  if (!draft || draft.done) return;
  if (draftMode === 'auto') { autoStep(); emit(); return; }
  const st = curStep()!;
  draft.timer--;
  if (ownerOf(st) === 'red') { if (30 - draft.timer >= draft.aiAt || draft.timer <= 0) aiTurn(); }
  else if (draft.timer <= 0) userTimeout();
  emit();
}
export function lockIn() { const st = curStep(); if (st && ownerOf(st) === 'blue' && draft.hover) { commit('blue', draft.hover, draft.slot); emit(); } }
export function hoverChamp(c: Champion) { if (!userTurn() || unavailable(c)) return; draft.hover = c; emit(); }
export function selectSlot(role: Role) { const st = curStep(); if (!st || ownerOf(st) !== 'blue' || st[1] !== 'p' || draft.picks.blue[role]) return; draft.slot = role; draft.hover = null; emit(); }
export function recordSeriesResult(blueWon: boolean) {
  series.wins[blueWon ? 'blue' : 'red']++;
  ROLES.forEach(r => [draft.picks.blue[r], draft.picks.red[r]].forEach(c => c && series.locked.add(c.id)));
  const need = Math.ceil(series.bo / 2);
  series.over = series.wins.blue >= need || series.wins.red >= need;
}
export function nextGameSelection(lastWinner: Side) {
  series.game++;
  series.priority = other(lastWinner);    // quem perdeu ganha a First Selection
  series.choice = null; series.selDone = false;
  if (series.priority === 'red') aiFirstSelection();
}
export const randomOf = rnd;
// usado pela calibração para não mexer na série em andamento
export const snapshotDraftState = () => ({ series, draft });
export const restoreDraftState = (s: { series: Series; draft: DraftState }) => { series = s.series; draft = s.draft; };
