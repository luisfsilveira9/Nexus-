import { useRef, useState } from 'react';
import { champById, champions, emit, G, PERS_PT, pOvr, ROLE_AB, rolePtOf, STYLE_NM, TAC_NM, teamOvr } from '@/game/core';
import { fitOf, fitsRole, masteryOf } from '@/game/draft';
import { brl, kda, num, pct } from '@/game/fmt';
import { shotcallerOf, suggestTactics, TACT_DESC, TACT_FIT, TACT_OPTS, TACT_STAT, tacticsOf, tacticsSummary } from '@/game/tactics';
import type { Champion, Hidden, Player, Role } from '@/game/types';
import { Bar, Ct, fitClr, NotaBadge, Seg, useGame, useUI } from './common';
import { Ic } from './icons';

const topTraits = (p: Player) => [...Object.entries(p.apt).map(([k, v]) => ({ l: STYLE_NM[k], v })), ...Object.entries(p.tac).map(([k, v]) => ({ l: TAC_NM[k], v }))].sort((a, b) => b.v - a.v).slice(0, 3);
// condição junta energia e estresse (estresse invertido): sempre maior é melhor, com palavra além da cor
const condicao = (p: Player) => Math.round((p.energy + (100 - p.stress)) / 2);
const faixaCond = (c: number): [string, string] => c >= 70 ? ['Boa', 'var(--positive)'] : c >= 40 ? ['Média', 'var(--q-3)'] : ['Baixa', 'var(--q-1)'];
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
function hiddenReads(h: Hidden) {
  const r: string[] = [];
  if (h.consistency >= 15) r.push('Muito consistente'); else if (h.consistency <= 7) r.push('Oscila entre jogos');
  if (h.bigGames >= 14) r.push('Cresce em finais'); else if (h.bigGames <= 6) r.push('Sente jogos grandes');
  if (h.pressure >= 14) r.push('Frio sob pressão'); else if (h.pressure <= 6) r.push('Desaba quando está atrás');
  if (h.versatility >= 14) r.push('Joga de tudo'); else if (h.versatility <= 7) r.push('Pool curto (sofre no Fearless)');
  if (h.aggression >= 14) r.push('Agressivo'); else if (h.aggression <= 7) r.push('Cauteloso');
  return r.length ? r : ['Perfil equilibrado'];
}
const ACTIONS: Record<string, { ic: string; l: string; fx: string }> = {
  train: { ic: 'Dumbbell', l: 'Treino SoloQ', fx: '+1 rotas, lutas e mecânica · −25 energia · +15 estresse' },
  rest: { ic: 'Coffee', l: 'Dia de folga', fx: '+35 energia · −20 estresse' },
  mental: { ic: 'Brain', l: 'Psicólogo', fx: '+2 mental · −30 estresse' },
  stream: { ic: 'Video', l: 'Stream', fx: '+R$ 5.000 · −15 energia' },
};
function playerAction(p: Player, k: string) {
  if (k === 'train') { if (p.energy < 20) return; p.laning = Math.min(99, p.laning + 1); p.teamfight = Math.min(99, p.teamfight + 1); p.mechanics = Math.min(99, p.mechanics + 1); p.energy = Math.max(0, p.energy - 25); p.stress = Math.min(100, p.stress + 15); }
  if (k === 'rest') { p.energy = Math.min(100, p.energy + 35); p.stress = Math.max(0, p.stress - 20); }
  if (k === 'mental') { p.mental = Math.min(99, p.mental + 2); p.stress = Math.max(0, p.stress - 30); }
  if (k === 'stream') { G.user.budget += 5000; p.energy = Math.max(0, p.energy - 15); }
  emit();
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
  </div>;
}
function Resumo({ p }: { p: Player }) {
  const ui = useUI(), cond = condicao(p);
  return <>
    <div><span className="cap">Leituras do olheiro</span><div className="tchips">{hiddenReads(p.hid).map(t => <span className="tchip ghost" key={t}>{t}</span>)}</div></div>
    <div><span className="cap">Pontos fortes</span><div className="tchips">{allAttrs(p).sort((a, b) => b.v - a.v).slice(0, 3).map(a => <span className="tchip" key={a.k}>{a.l} <b>{a.v}</b></span>)}</div></div>
    <div><span className="cap">Pontos fracos na rota</span>{(() => { const weak = allAttrs(p).filter(a => KEY[p.role].includes(a.k) && a.v < 75).sort((a, b) => a.v - b.v).slice(0, 2);
      return weak.length ? <div className="tchips">{weak.map(a => <span className="tchip ghost" key={a.k}>{a.l} <b>{a.v}</b> · {banda(a.v)[0].toLowerCase()}</span>)}</div>
        : <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--fs-sm)' }}>Nenhum atributo-chave da rota abaixo de Bom.</p>; })()}</div>
    <div><span className="cap">Condição e moral</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}><Medidor l="Condição" v={cond} f={faixaCond(cond)} /><Medidor l="Moral" v={p.morale} f={faixaMoral(p.morale)} /></div>
      <small className="muted">Energia {p.energy} · Estresse {p.stress}. Condição baixa reduz as rolagens na partida.</small></div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{Object.entries(ACTIONS).map(([k, a]) => { const dis = k === 'train' && p.energy < 20;
      return <button key={k} className="btn" style={{ flexDirection: 'column', alignItems: 'flex-start', textTransform: 'none', letterSpacing: 0, minHeight: 64, padding: '8px 10px', textAlign: 'left' }} disabled={dis}
        onClick={() => { playerAction(p, k); ui.toast(`${p.nickname}: ${a.l.toLowerCase()} feito`); }}>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 700, color: dis ? 'var(--dim)' : 'var(--gold-1)' }}><Ic n={a.ic} /> {a.l}</span>
        <small className="muted" style={{ fontWeight: 500, fontSize: 'var(--fs-xs)' }}>{dis ? 'Exausto: dê uma folga antes' : a.fx}</small></button>; })}</div>
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
  const m = masteryOf(p, c), [w, col] = encaixe(fitOf(p, c));
  return <div className="row champ"><Ct c={c} px={40} /><div className="row-main"><b>{c.name}</b>
    <div className="medidor-h"><span>Domínio</span><b className="num">{Math.round(m * 100)}%</b><small>encaixe {w.toLowerCase()}</small></div><Bar v={m * 100} color={col} /></div></div>;
}
function Campeoes({ p }: { p: Player }) {
  const pool = Object.entries(p.mastery).sort((a, b) => b[1] - a[1]).map(([cid]) => champById(cid)).filter((c): c is Champion => !!c);
  // fora do pool: os campeões da rota com melhor encaixe; é o que sobra quando o Fearless queima o pool
  const alt = champions.filter(c => fitsRole(c, p.role) && !(c.id in p.mastery)).sort((a, b) => fitOf(p, b) - fitOf(p, a)).slice(0, 3);
  const pen = 2 + 6 * (1 - p.hid.versatility / 20);   // mesmo cálculo de offPoolPenalty (draft.ts)
  return <>
    <div><span className="cap">Pool principal</span><div className="panel" style={{ marginTop: 8 }}>{pool.map(c => <ChampRow key={c.id} p={p} c={c} />)}</div></div>
    <div><span className="cap">Melhores opções fora do pool</span><div className="panel" style={{ marginTop: 8 }}>{alt.map(c => <ChampRow key={c.id} p={p} c={c} />)}</div>
      <p className="foot" style={{ marginTop: 8 }}>No Fearless, cada campeão usado fica bloqueado no resto da série. Fora do pool o domínio cai; em estilos em que {p.nickname} é fraco (abaixo de 50), cada lance ainda perde {num(pen, 1)} pontos (versatilidade {p.hid.versatility} de 20).</p></div>
  </>;
}

function Taticas() {
  useGame();
  const ui = useUI(), U = G.user, X = tacticsOf(U), sug = suggestTactics(U);
  const XR = X as unknown as Record<string, string>, SR = sug as unknown as Record<string, string>;
  const set = (k: string, v: string) => { XR[k] = v; if (k === 'jungle' && v !== 'gank') X.lane = 'any'; emit(); };
  const seg = (k: string) => <div className="seg">{TACT_OPTS[k].o.map(([v, l]) => <button key={v} aria-pressed={XR[k] === v} onClick={() => set(k, v)}>{l}{SR[k] === v && v !== 'bal' && v !== 'any' ? ' ★' : ''}</button>)}</div>;
  const fitLine = (k: string) => { const v0 = XR[k]; if (v0 === 'bal' || !TACT_STAT[k]?.[v0]) return null; const v = Math.round(TACT_FIT[k][v0](U));
    return <span className="tc-fit">Combina com: {TACT_STAT[k][v0]} <b style={{ color: fitClr(v) }}>{v}</b></span>; };
  const block = (k: string, extra?: React.ReactNode) => <div className="panel tc"><div className="sec-h"><h3>{TACT_OPTS[k].t}</h3>{fitLine(k)}</div>{seg(k)}<p className="tc-d">{TACT_DESC[k][XR[k]]}</p>{extra}</div>;
  const jg = U.roster.find(p => p.role === 'Jungle')!, sc = shotcallerOf(U);
  return <>
    <div className="panel-gold tc-sum"><span className="cap">Perfil tático</span><b>{tacticsSummary(U)}</b>
      <small>Shotcaller: {sc.nickname} · as escolhas com ★ combinam mais com o elenco</small>
      <button className="linkbtn" onClick={() => { U.tactics = suggestTactics(U); emit(); ui.toast('Táticas sugeridas pelo perfil do elenco'); }}>Usar a sugestão</button></div>
    <div className="panel tc"><div className="sec-h"><h3>Shotcaller</h3><span className="tc-fit">Shotcalling <b style={{ color: fitClr(sc.tac.shotcalling) }}>{sc.tac.shotcalling}</b></span></div>
      <div className="tc-sc">{U.roster.map(p => <button key={p.id} aria-pressed={X.shotcaller === p.id} onClick={() => set('shotcaller', p.id)}><span className="role-b">{ROLE_AB[p.role]}</span><b>{p.nickname}</b><small>{p.tac.shotcalling}{p.id === sug.shotcaller ? ' ★' : ''}</small></button>)}</div>
      <p className="tc-d">Quem faz as chamadas. O shotcalling dele pesa em todo lance de macro: cercos, placas, visão, objetivos e entrada na base.</p></div>
    {block('plan')}
    {block('jungle', <><div className="tc-j"><span>{jg.nickname}</span><span>Gank <b>{jg.tac.gank}</b></span><span>Farm <b>{jg.farm}</b></span><span>Objetivos <b>{jg.tac.objectives}</b></span></div>
      {X.jungle === 'gank' && <div><span className="cap">Rota preferida para os ganks</span><div style={{ marginTop: 6 }}>{seg('lane')}</div></div>}</>)}
    {block('lanes')}
    {block('mid')}
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
