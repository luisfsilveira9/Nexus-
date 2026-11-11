import { useRef, useState } from 'react';
import { champById, champions, emit, G, PERS_PT, pOvr, ROLE_AB, rolePtOf, STYLE_NM, TAC_NM, teamOvr } from '@/game/core';
import { fitOf, fitsRole, masteryOf } from '@/game/draft';
import { brl, kda, num, pct } from '@/game/fmt';
import { PRO_STATS } from '@/game/proStats';
import { PRESETS, presetFit, presetOf, presetTactics, shotcallerOf, suggestTactics, TACT_DESC, TACT_FIT, TACT_OPTS, TACT_STAT, tacticsOf, tacticsSummary } from '@/game/tactics';
import type { Champion, Hidden, Player, Role, Tactics, Team } from '@/game/types';
import { ActionBar, Bar, Ct, fitClr, NotaBadge, Seg, useGame, useUI } from './common';
import { Ic } from './icons';
import { Termo } from './Termo';
import { condicao, faixaCond } from './cond';

const topTraits = (p: Player) => [...Object.entries(p.apt).map(([k, v]) => ({ l: STYLE_NM[k], v })), ...Object.entries(p.tac).map(([k, v]) => ({ l: TAC_NM[k], v }))].sort((a, b) => b.v - a.v).slice(0, 3);
// condição junta energia e estresse (estresse invertido): sempre maior é melhor, com palavra além da cor
const faixaMoral = (m: number): [string, string] => m >= 75 ? ['Alta', 'var(--q-4)'] : m >= 60 ? ['Média', 'var(--q-3)'] : ['Baixa', 'var(--q-2)'];
// medidor rotulado: nome, número e palavra sempre visíveis; a barra só reforça
function Medidor({ l, v, f }: { l: string; v: number; f: [string, string] }) {
  return <div className="medidor"><div className="medidor-h"><span>{l}</span><b className="num">{v}</b><small>{f[0]}</small></div><Bar v={v} color={f[1]} /></div>;
}
// atributos em quatro famílias; KEY marca os que mais pesam em cada rota (realçados, o resto esmaecido)
type Attr = { k: string; l: string; v: number };
const FAMS: { id: string; l: string; get: (p: Player) => Attr[] }[] = [
  { id: 'jogo', l: 'Jogo', get: p => [{ k: 'laning', l: 'Fase de rotas', v: p.laning }, { k: 'teamfight', l: 'Lutas em equipe', v: p.teamfight }, { k: 'mechanics', l: 'Mecânica', v: p.mechanics }, { k: 'farm', l: 'Farm', v: p.farm }] },
  { id: 'cabeca', l: 'Cabeça', get: p => [{ k: 'map', l: 'Visão de mapa', v: p.map }, { k: 'mental', l: 'Mental', v: p.mental }] },
  { id: 'estilo', l: 'Estilo de campeão', get: p => Object.entries(STYLE_NM).map(([k, l]) => ({ k: 'apt.' + k, l, v: p.apt[k] })) },
  { id: 'tatico', l: 'Tático', get: p => Object.entries(TAC_NM).map(([k, l]) => ({ k: 'tac.' + k, l, v: p.tac[k] })) },
];
const allAttrs = (p: Player) => FAMS.flatMap(f => f.get(p));
const KEY: Record<Role, string[]> = {
  Top: ['laning', 'mechanics', 'apt.T', 'apt.F', 'tac.split'],
  Jungle: ['map', 'farm', 'tac.gank', 'tac.objectives'],
  Mid: ['laning', 'mechanics', 'apt.M', 'apt.A', 'tac.roaming'],
  Adc: ['farm', 'mechanics', 'teamfight', 'apt.H'],
  Support: ['map', 'tac.peel', 'tac.initiation', 'apt.P', 'apt.C'],
};
// faixas na escala --q-* (nunca vermelho): a palavra acompanha a cor
const banda = (v: number): [string, string] => v >= 85 ? ['Elite', 'var(--q-4)'] : v >= 75 ? ['Bom', 'var(--q-3)'] : v >= 60 ? ['Regular', 'var(--q-2)'] : ['Fraco', 'var(--q-1)'];
function hiddenReads(p: Player) {
  const h: Hidden = p.hid, r: string[] = [], n = Object.keys(p.mastery).length;
  if (h.consistency >= 15) r.push('Muito consistente'); else if (h.consistency <= 7) r.push('Oscila entre jogos');
  if (h.bigGames >= 14) r.push('Cresce em finais'); else if (h.bigGames <= 6) r.push('Sente jogos grandes');
  if (h.pressure >= 14) r.push('Frio sob pressão'); else if (h.pressure <= 6) r.push('Desaba quando está atrás');
  // tamanho do pool vem dos jogos reais do CBLOL 2026 (7 a 26 campeões, média ~14); a versatilidade (estimada) é o quanto ele se vira fora dele
  if (n >= 18) r.push(`Pool amplo: ${n} campeões`); else if (n <= 10) r.push(`Pool curto: ${n} campeões`);
  if (h.versatility >= 14) r.push('Se adapta fora do pool'); else if (h.versatility <= 7) r.push('Sofre fora do pool');
  if (h.aggression >= 14) r.push('Agressivo'); else if (h.aggression <= 7) r.push('Cauteloso');
  return r.length ? r : ['Perfil equilibrado'];
}
// ações do jogador: prévia do efeito antes de confirmar e "Desfazer" no aviso depois
const ACTIONS: Record<string, { ic: string; l: string; s: string; d: string; done: string }> = {
  train: { ic: 'Dumbbell', l: 'Treino SoloQ', s: 'Treino', d: 'Uma rodada de SoloQ: sobe rotas, lutas e mecânica, mas cansa e estressa.', done: 'treinou SoloQ' },
  rest: { ic: 'Coffee', l: 'Dia de folga', s: 'Folga', d: 'Um dia sem treino: recupera energia e alivia o estresse.', done: 'tirou folga' },
  mental: { ic: 'Brain', l: 'Psicólogo', s: 'Psicólogo', d: 'Sessão com o psicólogo: sobe o mental e alivia bastante o estresse.', done: 'conversou com o psicólogo' },
  stream: { ic: 'Video', l: 'Stream', s: 'Stream', d: 'Live patrocinada: dinheiro para o time, mas cansa.', done: 'fez stream' },
};
const canDo = (p: Player, k: string) => k !== 'train' || p.energy >= 20;
// aplica a ação em p e no orçamento t; usada tanto na prévia (em cópias) quanto de verdade
function mutate(p: Player, t: { budget: number }, k: string) {
  if (k === 'train') { p.laning = Math.min(99, p.laning + 1); p.teamfight = Math.min(99, p.teamfight + 1); p.mechanics = Math.min(99, p.mechanics + 1); p.energy = Math.max(0, p.energy - 25); p.stress = Math.min(100, p.stress + 15); }
  if (k === 'rest') { p.energy = Math.min(100, p.energy + 35); p.stress = Math.max(0, p.stress - 20); }
  if (k === 'mental') { p.mental = Math.min(99, p.mental + 2); p.stress = Math.max(0, p.stress - 30); }
  if (k === 'stream') { t.budget += 5000; p.energy = Math.max(0, p.energy - 15); }
}
const TOUCHED: [keyof Player & string, string][] = [['energy', 'Energia'], ['stress', 'Estresse'], ['laning', 'Fase de rotas'], ['teamfight', 'Lutas em equipe'], ['mechanics', 'Mecânica'], ['mental', 'Mental']];
// aplica a ação de verdade e devolve a função que desfaz (restaura só os campos que a ação mexe e o orçamento)
function doAction(p: Player, k: string) {
  const before = Object.fromEntries(TOUCHED.map(([f]) => [f, p[f]])), b0 = G.user.budget, t = { budget: b0 };
  mutate(p, t, k); G.user.budget = t.budget; emit();
  return () => { Object.assign(p, before); G.user.budget = b0; emit(); };
}
function ActionSheet({ id, k }: { id: string; k: string }) {
  useGame();
  const ui = useUI(), p = G.user.roster.find(x => x.id === id), a = ACTIONS[k];
  if (!p) return null;
  const q = { ...p }, t = { budget: G.user.budget }; mutate(q, t, k);
  const c0 = condicao(p), c1 = condicao(q);
  const rows: [string, string, string][] = TOUCHED.filter(([f]) => q[f] !== p[f]).map(([f, l]) => [l, String(p[f]), String(q[f])]);
  if (t.budget !== G.user.budget) rows.push(['Orçamento', brl(G.user.budget), brl(t.budget)]);
  const confirm = () => { const undo = doAction(p, k); ui.closeSheet(); ui.toast(`${p.nickname} ${a.done}`, () => { undo(); ui.toast('Ação desfeita'); }); };
  return <>
    <p style={{ margin: 0 }}>{a.d}</p>
    {canDo(p, k) ? <>
      <div className="prev">{rows.map(([l, x, y]) => <div key={l}><span>{l}</span><b className="num">{x} → {y}</b></div>)}
        {c1 !== c0 && <div><span>Condição</span><b className="num">{c0} → {c1}</b><small>{c1 > c0 ? 'sobe' : 'cai'}</small></div>}</div>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={ui.closeSheet}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirm}>Confirmar</button></div></>
      : <p className="muted" style={{ margin: 0 }}>{p.nickname} está exausto (energia {p.energy}). Dê uma folga antes de treinar.</p>}
  </>;
}

// ---------- página do jogador: cabeçalho fixo, faixa dos cinco titulares (toque ou deslize) e abas ----------
type PTab = 'resumo' | 'atributos' | 'campeoes' | 'temporada';
function PlayerPage({ id }: { id: string }) {
  useGame();
  const ui = useUI(), R = G.user.roster, i = R.findIndex(x => x.id === id), p = R[i];
  const [tab, setTab] = useState<PTab>('resumo');   // a aba fica ao trocar de jogador, para comparar os titulares no mesmo ponto
  const sw = useRef<{ x: number; y: number } | null>(null);
  if (!p) return null;
  const step = (d: number) => ui.openPlayer(R[(i + d + R.length) % R.length].id);
  const cond = condicao(p), [cw] = faixaCond(cond), [mw] = faixaMoral(p.morale);
  return <div className="pp"
    onTouchStart={e => { const t = e.touches[0]; sw.current = { x: t.clientX, y: t.clientY }; }}
    onTouchEnd={e => { const s = sw.current, t = e.changedTouches[0]; sw.current = null; if (!s) return; const dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1); }}>
    <div className="pp-top">
      <div className="pp-nav"><button className="btn btn-sq" onClick={() => ui.openPlayer(null)} aria-label="Voltar ao elenco"><Ic n="ChevronLeft" /></button>
        <div className="pp-strip" role="group" aria-label="Titulares">{R.map(x => <button key={x.id} aria-current={x.id === id ? 'true' : undefined} onClick={() => ui.openPlayer(x.id)}>
          <span className="cap">{ROLE_AB[x.role]}</span><b>{x.nickname}</b></button>)}</div></div>
      <div className="pp-head"><span className="role-b">{ROLE_AB[p.role]}</span>
        <div className="row-main"><b>{p.nickname}</b><small>{p.realName ? p.realName + ' · ' : ''}{rolePtOf(p.role)}{p.age ? ' · ' + p.age + ' anos' : ''}</small>
          <small className="pp-state">Condição <b>{cond}</b> {cw.toLowerCase()} · Moral <b>{p.morale}</b> {mw.toLowerCase()}</small></div>
        <div className="pp-ovr"><div className="ovr">{pOvr(p)}</div><span className="cap">OVR</span></div></div>
    </div>
    <Seg value={tab} opts={[['resumo', 'Resumo'], ['atributos', 'Atributos'], ['campeoes', 'Campeões'], ['temporada', 'Temporada']]} onChange={setTab} />
    {tab === 'resumo' && <Resumo p={p} />}
    {tab === 'atributos' && <Atributos p={p} />}
    {tab === 'campeoes' && <Campeoes p={p} />}
    {tab === 'temporada' && <Temporada p={p} />}
    <p className="foot">Deslize para os lados ou toque na faixa de cima para trocar de titular.</p>
    <ActionBar>{Object.entries(ACTIONS).map(([k, a]) => <button key={k} className={'btn pact' + (canDo(p, k) ? '' : ' off')} onClick={() => ui.openSheet(a.l, () => <ActionSheet id={p.id} k={k} />)}>
      <Ic n={a.ic} /><span>{a.s}</span></button>)}</ActionBar>
  </div>;
}
function Resumo({ p }: { p: Player }) {
  const cond = condicao(p);
  return <>
    <div><span className="cap">Leituras do olheiro</span><div className="tchips">{hiddenReads(p).map(t => <span className="tchip ghost" key={t}>{t}</span>)}</div></div>
    <div><span className="cap">Pontos fortes</span><div className="tchips">{allAttrs(p).sort((a, b) => b.v - a.v).slice(0, 3).map(a => <span className="tchip" key={a.k}>{a.l} <b>{a.v}</b></span>)}</div></div>
    <div><span className="cap">Pontos fracos na rota</span>{(() => { const weak = allAttrs(p).filter(a => KEY[p.role].includes(a.k) && a.v < 75).sort((a, b) => a.v - b.v).slice(0, 2);
      return weak.length ? <div className="tchips">{weak.map(a => <span className="tchip ghost" key={a.k}>{a.l} <b>{a.v}</b> · {banda(a.v)[0].toLowerCase()}</span>)}</div>
        : <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--fs-sm)' }}>Nenhum atributo-chave da rota abaixo de Bom.</p>; })()}</div>
    <div><span className="cap">Condição e moral</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}><Medidor l="Condição" v={cond} f={faixaCond(cond)} /><Medidor l="Moral" v={p.morale} f={faixaMoral(p.morale)} /></div>
      <small className="muted">Energia {p.energy} · Estresse {p.stress}. Condição baixa reduz as rolagens na partida.</small></div>
  </>;
}
function Atributos({ p }: { p: Player }) {
  const key = KEY[p.role];
  // abre a família com mais atributos-chave da rota
  const open = FAMS.map(f => ({ id: f.id, n: f.get(p).filter(a => key.includes(a.k)).length })).sort((a, b) => b.n - a.n)[0].id;
  return <>
    <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-xs)' }}>★ atributo-chave para {rolePtOf(p.role).toLowerCase()} · Fraco abaixo de 60 · Regular 60–74 · Bom 75–84 · Elite 85+</p>
    {FAMS.map(f => { const as = f.get(p).sort((a, b) => b.v - a.v), nk = as.filter(a => key.includes(a.k)).length;
      return <details key={f.id} className="fam" open={f.id === open}>
        <summary><b>{f.l}</b><span>média {Math.round(as.reduce((s, a) => s + a.v, 0) / as.length)}{nk ? ` · ${nk} chave` : ''}</span><Ic n="ChevronRight" /></summary>
        {as.map(a => { const [w, c] = banda(a.v), isK = key.includes(a.k);
          return <div key={a.k} className={'attr' + (isK ? ' key' : '')}><span>{isK ? '★ ' : ''}{a.l}</span><b className="num">{a.v}</b><small>{w}</small><Bar v={a.v} color={c} /></div>; })}
      </details>; })}
  </>;
}
function Temporada({ p }: { p: Player }) {
  const ss = p.season;
  if (!ss?.g) return <p className="muted" style={{ margin: 0 }}>Sem jogos nesta temporada ainda.</p>;
  return <div className="tiles">
    <div className="tile"><span className="cap">Jogos</span><b>{ss.g}</b><small className="muted">{ss.w} vitórias · {pct(ss.w / ss.g)}</small></div>
    <div className="tile"><span className="cap">KDA</span><b>{kda(ss.k, ss.d, ss.a)}</b><small className="muted">{ss.k}/{ss.d}/{ss.a}</small></div>
    <div className="tile"><span className="cap">Nota média</span><div style={{ marginTop: 4 }}><NotaBadge v={ss.nt / ss.g} /></div></div></div>;
}
// encaixe em uma palavra (mesmos cortes do draft): a barra mostra o domínio, a palavra diz se o campeão serve
const encaixe = (s: number): [string, string] => s >= 0.75 ? ['Ótimo', 'var(--q-4)'] : s >= 0.6 ? ['Ok', 'var(--q-3)'] : ['Ruim', 'var(--q-1)'];
function ChampRow({ p, c }: { p: Player; c: Champion }) {
  const m = masteryOf(p, c), [w, col] = encaixe(fitOf(p, c)), s = PRO_STATS[p.id]?.find(x => x[0] === c.id);
  return <div className="row champ"><Ct c={c} px={40} /><div className="row-main"><b>{c.name}</b>
    {s && <small className="champ-st">{s[1]} {s[1] > 1 ? 'jogos' : 'jogo'} · {s[2]}V {s[1] - s[2]}D · KDA {kda(s[3], s[4], s[5])}</small>}
    <div className="medidor-h"><span>Domínio</span><b className="num">{Math.round(m * 100)}%</b><small>encaixe {w.toLowerCase()}</small></div><Bar v={m * 100} color={col} /></div></div>;
}
function Campeoes({ p }: { p: Player }) {
  const [all, setAll] = useState(false);
  // pool real (CBLOL 2026, ordenado por domínio): mostra os 5 principais; o resto num toque
  const pool = Object.entries(p.mastery).sort((a, b) => b[1] - a[1]).map(([cid]) => champById(cid)).filter((c): c is Champion => !!c);
  const shown = all ? pool : pool.slice(0, 5), games = (PRO_STATS[p.id] ?? []).reduce((a, x) => a + x[1], 0);
  // fora do pool: os campeões da rota com melhor encaixe; é o que sobra quando o Fearless queima o pool
  const alt = champions.filter(c => fitsRole(c, p.role) && !(c.id in p.mastery)).sort((a, b) => fitOf(p, b) - fitOf(p, a)).slice(0, 3);
  const pen = 2 + 6 * (1 - p.hid.versatility / 20);   // mesmo cálculo de offPoolPenalty (draft.ts)
  return <>
    <div><span className="cap">Pool no CBLOL 2026</span>
      <p className="muted" style={{ margin: '4px 0 0', fontSize: 'var(--fs-sm)' }}>{pool.length} campeões em {games} jogos (Splits 1 e 2). O domínio vem de jogos e vitórias com cada um.</p>
      <div className="panel" style={{ marginTop: 8 }}>{shown.map(c => <ChampRow key={c.id} p={p} c={c} />)}
        {pool.length > 5 && <button className="ev-grp" aria-expanded={all} onClick={() => setAll(!all)}><span /><span>{all ? 'Mostrar só os 5 principais' : `Ver todos os ${pool.length}`}</span><Ic n="ChevronRight" className={all ? 'rot' : ''} /></button>}</div></div>
    <div><span className="cap">Melhores opções fora do pool</span><div className="panel" style={{ marginTop: 8 }}>{alt.map(c => <ChampRow key={c.id} p={p} c={c} />)}</div>
      <p className="foot" style={{ marginTop: 8 }}>No <Termo t="Fearless" />, cada campeão usado fica bloqueado no resto da série. Fora do pool o domínio cai; em estilos em que {p.nickname} é fraco (abaixo de 50), cada lance ainda perde {num(pen, 1)} pontos (versatilidade {p.hid.versatility} de 20).</p></div>
  </>;
}

// encaixe da tática com o elenco em palavra (mesmos cortes de fitClr)
const fitWord = (v: number) => v >= 85 ? 'ótimo' : v >= 76 ? 'bom' : 'fraco';
// troca as táticas do time e devolve como desfazer
function applyTactics(t: Team, next: Tactics) { const prev = { ...tacticsOf(t) }; t.tactics = next; emit(); return () => { t.tactics = prev; emit(); }; }
export function Taticas() {
  useGame();
  const ui = useUI(), U = G.user, X = tacticsOf(U), sug = suggestTactics(U);
  const XR = X as unknown as Record<string, string>;
  const set = (k: string, v: string) => { XR[k] = v; if (k === 'jungle' && v !== 'gank') X.lane = 'any'; emit(); };
  // cada opção mostra quanto encaixa a mais ou a menos que "Equilibrado" (75); controles de quatro opções viram grade 2×2
  const dl = (k: string, v: string) => v === 'bal' || !TACT_FIT[k]?.[v] ? null : Math.round(TACT_FIT[k][v](U) - 75);
  const seg = (k: string) => <div className={'seg' + (TACT_OPTS[k].o.length > 3 ? ' four' : '')}>{TACT_OPTS[k].o.map(([v, l]) => { const d = dl(k, v);
    return <button key={v} aria-pressed={XR[k] === v} onClick={() => set(k, v)}>{l}{d !== null && <small className="dl">{d > 0 ? '+' : d < 0 ? '−' : '±'}{Math.abs(d)}</small>}</button>; })}</div>;
  const fitLine = (k: string) => { const v0 = XR[k]; if (v0 === 'bal' || !TACT_STAT[k]?.[v0]) return null; const v = Math.round(TACT_FIT[k][v0](U));
    return <span className="tc-fit">Combina com: {TACT_STAT[k][v0]} <b style={{ color: fitClr(v) }}>{v}</b></span>; };
  const block = (k: string, extra?: React.ReactNode) => <div className="panel tc"><div className="sec-h"><h3>{TACT_OPTS[k].t}</h3>{fitLine(k)}</div>{seg(k)}<p className="tc-d">{TACT_DESC[k][XR[k]]}</p>{extra}</div>;
  const jg = U.roster.find(p => p.role === 'Jungle')!, sc = shotcallerOf(U);
  const cur = presetOf(U), fits = PRESETS.map(pr => ({ pr, f: presetFit(U, pr.x) })), best = [...fits].sort((a, b) => b.f - a.f)[0].pr.id;
  const use = (next: Tactics, msg: string) => { const undo = applyTactics(U, next); ui.toast(msg, () => { undo(); ui.toast('Tática anterior de volta'); }); };
  return <>
    <div className="panel-gold tc-sum"><span className="cap">Perfil tático</span><b>{tacticsSummary(U)}</b>
      <small>{cur ? PRESETS.find(p => p.id === cur)!.l : 'Personalizado'} · shotcaller {sc.nickname}</small></div>
    <div><span className="cap">Estilos prontos</span>
      <div className="presets">{fits.map(({ pr, f }) => <button key={pr.id} className="preset" aria-pressed={cur === pr.id} onClick={() => use(presetTactics(U, pr.id), `Tática: ${pr.l}`)}>
        <b>{pr.l}</b>{pr.id === best && <span className="rec">Recomendado pela comissão técnica</span>}
        <small>{pr.d}</small><span className="pf">Encaixe com o elenco <b className="num">{Math.round(f)}</b> · {fitWord(Math.round(f))}</span></button>)}</div></div>
    <details className="fam tune"><summary><b>Ajuste fino</b><span>shotcaller e cada opção</span><Ic n="ChevronRight" /></summary>
      <div className="tune-in">
      <p className="tc-d" style={{ margin: 0 }}>O número em cada opção diz quanto ela combina com o elenco comparada a "Equilibrado": + combina mais, − combina menos.</p>
      <button className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => use(suggestTactics(U), 'Táticas sugeridas pelo perfil do elenco')}>Usar a sugestão do elenco</button>
    <div className="panel tc"><div className="sec-h"><h3><Termo t="Shotcaller" /></h3><span className="tc-fit">Shotcalling <b style={{ color: fitClr(sc.tac.shotcalling) }}>{sc.tac.shotcalling}</b></span></div>
      <div className="tc-sc">{U.roster.map(p => <button key={p.id} aria-pressed={X.shotcaller === p.id} onClick={() => set('shotcaller', p.id)}><span className="role-b">{ROLE_AB[p.role]}</span><b>{p.nickname}</b><small>{p.tac.shotcalling}{p.id === sug.shotcaller ? ' ★' : ''}</small></button>)}</div>
      <p className="tc-d">Quem faz as chamadas. O shotcalling dele pesa em todo lance de macro: cercos, placas, visão, objetivos e entrada na base.</p></div>
    {block('plan')}
    {block('jungle', <><div className="tc-j"><span>{jg.nickname}</span><span>Gank <b>{jg.tac.gank}</b></span><span>Farm <b>{jg.farm}</b></span><span>Objetivos <b>{jg.tac.objectives}</b></span></div>
      {X.jungle === 'gank' && <div><span className="cap">Rota preferida para os ganks</span><div style={{ marginTop: 6 }}>{seg('lane')}</div></div>}</>)}
    {block('lanes')}
    {block('mid')}
      </div></details>
    <p className="foot">As táticas valem para todas as partidas. O adversário também joga com a tática que combina com o elenco dele.</p>
  </>;
}

export function Elenco() {
  useGame();
  const ui = useUI(), U = G.user;
  if (ui.player && U.roster.some(p => p.id === ui.player)) return <PlayerPage id={ui.player} />;
  return <>
    <Seg value={ui.elencoView} opts={[['jogadores', <><Ic n="Users" /> Jogadores</>], ['taticas', <><Ic n="ClipboardList" /> Táticas</>]]} onChange={ui.setElencoView} />
    {ui.elencoView === 'taticas' ? <Taticas /> : <>
      <div className="tiles">
        <div className="tile"><span className="cap">Orçamento</span><b>{brl(U.budget)}</b></div>
        <div className="tile"><span className="cap">Entrosamento</span><b>{U.chemistry}%</b></div>
        <div className="tile"><span className="cap">OVR médio</span><b>{teamOvr(U)}</b></div>
      </div>
      <div className="sec-h"><h2>Titulares</h2><span className="cap">Toque para gerenciar</span></div>
      <div className="panel">{U.roster.map(p => { const c = Object.keys(p.mastery).map(champById).filter(Boolean)[0], cond = condicao(p);
        return <button key={p.id} className="row" style={{ minHeight: 72 }} onClick={() => ui.openPlayer(p.id)}>
          <span style={{ position: 'relative' }}><Ct c={c} px={48} /><span className="role-b" style={{ position: 'absolute', right: -8, bottom: -8, width: 28, height: 22, fontSize: 'var(--fs-xs)', background: 'var(--bg-2)' }}>{ROLE_AB[p.role]}</span></span>
          <div className="row-main"><b>{p.nickname}</b><small>{rolePtOf(p.role)} · {PERS_PT[p.personality] || ''}</small>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}><Medidor l="Condição" v={cond} f={faixaCond(cond)} /><Medidor l="Moral" v={p.morale} f={faixaMoral(p.morale)} /></div>
            <div className="tchips">{topTraits(p).map(t => <span className="tchip" key={t.l}>{t.l} <b>{t.v}</b></span>)}</div></div>
          <div style={{ textAlign: 'right' }}><div className="ovr">{pOvr(p)}</div><span className="cap">OVR</span></div></button>; })}</div>
      <p className="foot">Condição junta energia e estresse: maior é sempre melhor. Condição baixa reduz as rolagens do jogador na partida.</p>
    </>}
  </>;
}
