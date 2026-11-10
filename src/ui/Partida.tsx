import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { esc, fmtT, G, other, plOf, pOvr, ROLE_AB, ROLES, teamOf, teamOvr } from '@/game/core';
import { kda, nota, num, ouroK, pct } from '@/game/fmt';
import { BEATS, COMP_NM, compOf, draft, picksOf, series, teamFit, TIMING_NM } from '@/game/draft';
import { barCap, csOf, levelOf, M, mvpOf, outcome, passFilter, PHASE_OF, PHASE_PT, SK, type LogE, type Match } from '@/game/match';
import { live, newSeries, nextSeriesGame, pauseSim, seasonOf, setSpeed, skipSim, startSim, teamSeason } from '@/game/session';
import { shotcallerOf, tacticsSummary } from '@/game/tactics';
import type { Side } from '@/game/types';
import { ActionBar, Crest, Ct, Html, NotaBadge, Seg, useGame, useUI } from './common';
import { mapImgUrl } from '@/game/ddragon';
import { DraftView, FirstSelection, StratSection } from './Draft';
import { Ic } from './icons';

const tag = (sd: Side) => teamOf(sd).tag;

// ---------------- pré-jogo ----------------
function PreMatch({ onDraft }: { onDraft: () => void }) {
  const ui = useUI();
  const side = (sd: Side) => {
    const T = teamOf(sd), ts = teamSeason(T), agg = (k: 'laning' | 'teamfight' | 'map') => Math.round(T.roster.reduce((a, p) => a + p[k], 0) / 5);
    return <div className={`lu ${sd} pm`}>
      <div className="pm-h"><Crest t={T} size={30} /><div className="pm-t"><b>{T.name}</b><small>{sd === 'blue' ? 'Você' : 'Adversário'} · OVR {teamOvr(T)}</small></div></div>
      <div className="pm-rec"><span><small>Séries</small>{ts.w}-{ts.l}</span><span><small>Mapas</small>{ts.gw}-{ts.gl}</span><span><small>Aprov.</small>{ts.w + ts.l ? Math.round(100 * ts.w / (ts.w + ts.l)) + '%' : '—'}</span></div>
      <div className="lu-h"><span><small>Rotas</small>{agg('laning')}</span><span><small>Luta</small>{agg('teamfight')}</span><span><small>Macro</small>{agg('map')}</span></div>
      {ROLES.map(r => { const p = plOf(sd, r), ss = seasonOf(p), kdaTxt = ss.g ? kda(ss.k, ss.d, ss.a) : '—';
        return <div className="pm-r" key={r}><span className="role-b">{ROLE_AB[r]}</span><div className="pm-n"><b>{p.nickname}</b>
          <small>{ss.g ? `${ss.k}/${ss.d}/${ss.a} · ${ss.g}J` : 'Sem jogos'}</small>{ss.g ? <small>KDA {kdaTxt}</small> : null}</div>
          <div className="pm-v"><b>{pOvr(p)}</b><small>{ss.g ? <>nota <NotaBadge v={ss.nt / ss.g} /></> : 'OVR'}</small></div></div>; })}
    </div>;
  };
  const needSel = !series.selDone && series.priority === 'blue';
  return <>
    <div className="sec-h"><h2>{G.user.tag} × {G.opp.tag}</h2><span className="cap">MD{series.bo}{series.fearless ? ' · Fearless' : ''} · Jogo {series.game} · {series.wins.blue}-{series.wins.red}</span></div>
    <div className="lineup">{side('blue')}{side('red')}</div>
    <FirstSelection />
    <button className="panel tc-row" onClick={() => { ui.setElencoView('taticas'); ui.go('elenco'); }}><Ic n="ClipboardList" /><div className="row-main"><b>Táticas</b><small>{tacticsSummary(G.user)} · shotcaller {shotcallerOf(G.user).nickname}</small></div><span className="linkbtn">Editar</span></button>
    <StratSection />
    <button className="btn btn-primary" style={{ flex: 'none', width: '100%' }} disabled={needSel} onClick={onDraft}><Ic n="Swords" /> {needSel ? 'Faça a First Selection primeiro' : 'Iniciar draft'}</button>
  </>;
}

// ---------------- avaliação do draft ----------------
function DraftEval() {
  const cb = compOf(picksOf('blue')), cr = compOf(picksOf('red')), fb = teamFit('blue') * 100, fr = teamFit('red') * 100;
  const B = tag('blue'), R = tag('red'), ls: { txt: string; sd: string }[] = [];
  ls.push({ txt: `Identidade: ${B} ${COMP_NM[cb.id]} (${TIMING_NM[cb.timing]}) × ${COMP_NM[cr.id]} (${TIMING_NM[cr.timing]}) ${R}`, sd: '' });
  let edge = 0;
  if (BEATS[cb.id] === cr.id) { ls.push({ txt: `◀ ${COMP_NM[cb.id]} leva vantagem natural sobre ${COMP_NM[cr.id].toLowerCase()}`, sd: 'blue' }); edge++; }
  else if (BEATS[cr.id] === cb.id) { ls.push({ txt: `${COMP_NM[cr.id]} leva vantagem natural sobre ${COMP_NM[cb.id].toLowerCase()} ▶`, sd: 'red' }); edge--; }
  else ls.push({ txt: 'Nenhuma composição domina a outra no papel', sd: '' });
  const tw: Record<string, string> = { early: 'precisa decidir antes dos 25 min', scaling: 'fica mais forte depois dos 30 min', mid: 'joga bem em qualquer fase' };
  if (cb.timing !== cr.timing) ls.push({ txt: `Janela: ${B} ${tw[cb.timing]}; ${R} ${tw[cr.timing]}`, sd: '' });
  if (Math.abs(fb - fr) < 3) ls.push({ txt: `Encaixe com os campeões: equilibrado (${Math.round(fb)}% × ${Math.round(fr)}%)`, sd: '' });
  else { const bw = fb > fr; edge += bw ? 1 : -1; ls.push({ txt: bw ? `◀ ${B} joga mais confortável nos campeões (${Math.round(fb)}% × ${Math.round(fr)}%)` : `${R} joga mais confortável nos campeões (${Math.round(fb)}% × ${Math.round(fr)}%) ▶`, sd: bw ? 'blue' : 'red' }); }
  const verdict = edge >= 2 ? `${G.user.name} sai do draft na frente: composição certa e jogadores confortáveis.`
    : edge <= -2 ? `${G.opp.name} sai do draft na frente. Sua equipe vai precisar ganhar as disputas certas.`
    : cb.timing === 'early' && cr.timing === 'scaling' ? `${G.user.name} precisa abrir vantagem cedo, antes do adversário escalar.`
    : cr.timing === 'early' && cb.timing === 'scaling' ? `Segure o início: a partir dos 30 minutos o jogo é de ${G.user.name}.`
    : 'Draft equilibrado. As decisões da partida vão definir tudo.';
  return <div className="panel-gold evalc"><h2>Avaliação do draft</h2>{ls.map((l, i) => <p key={i} className={l.sd}>{l.txt}</p>)}<p className="verdict">{verdict}</p></div>;
}

// ---------------- placar ----------------
function Score() {
  const m = M, ref = useRef<HTMLDivElement>(null), sp = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const a = ref.current, b = sp.current; if (!a || !b) return;
    const fit = () => { b.style.height = Math.max(0, a.offsetHeight - 14) + 'px'; }; fit();
    const ro = new ResizeObserver(fit); ro.observe(a); return () => ro.disconnect();
  }, []);
  const t = m?.t ?? 0, bar = m?.bar ?? 0, gold = m?.gold ?? { blue: 2500, red: 2500 };
  const gd = gold.blue - gold.red, cap = barCap(t), share = (bar + 100) / 2;
  // uma só leitura de "quem está ganhando" em número: a probabilidade do último minuto
  const wp = m?.timeline.length ? m.timeline[m.timeline.length - 1].wp : 0.5;
  const objs = (sd: Side) => <><span title="Torres"><Ic n="Castle" />{m?.towers[sd] ?? 0}</span><span title="Dragões"><Ic n="Flame" />{m?.drakes[sd] ?? 0}</span><span title="Barões"><Ic n="Crown" />{m?.barons[sd] ?? 0}</span></>;
  return <>
    <div className="score" ref={ref}>
      <div className="sc1"><div className="tg blue"><Crest t={G.user} size={22} />{G.user.tag}</div><b className="k blue">{m?.kills.blue ?? 0}</b>
        <div className="clk"><b>{fmtT(t)}</b><span>{m?.over ? 'FIM' : m?.running ? 'AO VIVO' : m ? 'PAUSA' : 'PRÉ-JOGO'}</span></div>
        <b className="k red">{m?.kills.red ?? 0}</b><div className="tg r red">{G.opp.tag}<Crest t={G.opp} size={22} /></div></div>
      <div className="sc2"><div className="objs blue">{objs('blue')}</div>
        <div className="gdiff"><span className={gd > 0 ? 'blue' : gd < 0 ? 'red' : 'muted'}>{gd === 0 ? 'Ouro igual' : <>{(gd > 0 ? '◀ ' : '') + ouroK(Math.abs(gd)) + (gd < 0 ? ' ▶' : '')}<small> ouro</small></>}</span>
          <small>Vitória {G.user.tag} <b className="num">{pct(wp)}</b></small></div>
        <div className="objs r red">{objs('red')}</div></div>
      <div className="hp" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share)} aria-label={`Domínio do mapa: ${G.user.tag} ${Math.round(share)}%`}><i style={{ width: `${share}%` }} /><span className="mid" />
        {cap < 100 && <><span className="capl" style={{ left: `${(100 - cap) / 2}%` }} /><span className="capr" style={{ left: `${(100 + cap) / 2}%` }} /></>}</div>
    </div>
    <div ref={sp} aria-hidden="true" />
  </>;
}

// ---------------- faixa de timers: fase, buffs ativos e próximos objetivos numa linha ----------------
const OBJ_NM: Record<string, string> = { grubs: 'Larvas', herald: 'Arauto', baron: 'Barão', dragon: 'Dragão', elder: 'Ancião' };
function Timers() {
  const m = M; if (!m) return null;
  const it: { txt: string; sd?: Side }[] = [];
  (['blue', 'red'] as Side[]).forEach(sd => {
    if (m.baron.side === sd && m.t < m.baron.until) it.push({ sd, txt: `Barão ${tag(sd)} ${fmtT(m.baron.until - m.t)}` });
    if (m.elder.side === sd && m.t < m.elder.until) it.push({ sd, txt: `Ancião ${tag(sd)} ${fmtT(m.elder.until - m.t)}` });
    if (m.soul === sd) it.push({ sd, txt: `Alma ${tag(sd)}` });
    if (m.grubs === sd) it.push({ sd, txt: `Larvas ${tag(sd)}` });
  });
  Object.keys(OBJ_NM).filter(k => m.next[k] !== null).sort((a, b) => m.next[a]! - m.next[b]!).slice(0, 2)
    .forEach(k => it.push({ txt: m.next[k]! <= m.t ? `${OBJ_NM[k]} disponível` : `${OBJ_NM[k]} ${fmtT(m.next[k]!)}` }));
  if (!m.over && barCap(m.t) >= 100) it.push({ txt: 'Base exposta' });
  return <div className="tstrip"><span className="cap">{PHASE_PT[PHASE_OF(m.t)]}</span>{it.map((x, i) => <span key={i} className={x.sd ?? 'muted'}>{x.txt}</span>)}</div>;
}

// ---------------- minimapa + cartão do lance ----------------
// polígono do território de um lado; o azul fica no canto de baixo à esquerda (base azul)
function territory(share: number, red = false) {
  const c = 100 - 200 * share, sq = [[0, 0], [100, 0], [100, 100], [0, 100]], out: number[][] = [];
  const inside = (p: number[]) => (p[1] >= p[0] + c) !== red;
  for (let i = 0; i < 4; i++) {
    const A = sq[i], B = sq[(i + 1) % 4], ia = inside(A), ib = inside(B);
    if (ia) out.push(A);
    if (ia !== ib) { const fa = A[1] - A[0] - c, fb = B[1] - B[0] - c, k = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]); }
  }
  return out.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
}
// onde cada lance acontece no esquema do mapa (rota do topo no canto de cima, Barão acima do rio). "Selva" não tem ponto único.
const LOC_XY: Record<string, [number, number]> = { Topo: [9, 9], Meio: [50, 50], Bot: [91, 91], Rio: [50, 50], 'Covil do Barão': [30, 30], 'Covil do Dragão': [70, 70] };
// a arte oficial do mapa vem do Data Dragon; se falhar (offline, CDN fora), volta o mapa desenhado
const mapArt = { failed: false };
const FULL = '0,0 100,0 100,100 0,100';
function Minimap() {
  const [, setFailed] = useState(false);
  const m = M, col = (sd: Side) => sd === 'blue' ? 'var(--side-blue)' : 'var(--side-red)', share = m ? (m.bar + 100) / 200 : 0.5;
  const ev = m?.card?.R.ev, xy = !ev ? undefined : ev.loc === 'Base' ? m!.S[other(ev.init)].nexus : LOC_XY[ev.loc];
  const art = !mapArt.failed;
  return <svg className="minimap" viewBox="0 0 100 100" role="img" aria-label="Mapa de Summoner's Rift com território, torres, inibidores e objetivos">
    {art ? <>
      <image href={mapImgUrl()} x="0" y="0" width="100" height="100" preserveAspectRatio="none" onError={() => { mapArt.failed = true; setFailed(true); }} />
      {/* a arte é clara: escurece um pouco e pinta o território de cada lado por cima, sem esconder rotas e rio */}
      <rect x="0" y="0" width="100" height="100" fill="var(--bg)" opacity=".3" />
      {share < 1 && <polygon points={share <= 0 ? FULL : territory(share, true)} fill="var(--side-red-deep)" opacity=".5" style={{ transition: 'all .5s' }} />}
      {share > 0 && <polygon points={share >= 1 ? FULL : territory(share)} fill="var(--side-blue-deep)" opacity=".5" style={{ transition: 'all .5s' }} />}
    </> : <>
      <rect x="0" y="0" width="100" height="100" fill="var(--map-red)" />
      {share > 0 && <polygon points={share >= 1 ? FULL : territory(share)} fill="var(--map-blue)" style={{ transition: 'all .5s' }} />}
      <rect x="0" y="0" width="100" height="100" fill="rgba(1,10,19,.25)" />
      <path d="M14 14 L86 86" stroke="rgba(30,90,120,.55)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M9 88 L9 9 L88 9" stroke="rgba(200,170,110,.18)" strokeWidth="4.5" fill="none" strokeLinejoin="round" />
      <path d="M12 91 L91 91 L91 12" stroke="rgba(200,170,110,.18)" strokeWidth="4.5" fill="none" strokeLinejoin="round" />
      <path d="M14 86 L86 14" stroke="rgba(200,170,110,.18)" strokeWidth="4.5" fill="none" />
      <circle cx="30" cy="30" r="5.5" fill="var(--surface-3)" stroke="var(--line)" strokeWidth=".8" />
      <circle cx="70" cy="70" r="5.5" fill="var(--surface-3)" stroke="var(--line)" strokeWidth=".8" />
    </>}
    {m && (['blue', 'red'] as Side[]).map(sd => <g key={sd}>
      {m.S[sd].list.map((st, i) => { const [x, y] = st.p, c = col(sd);
        return st.kind === 'inhib' ? <circle key={i} cx={x} cy={y} r="2.4" fill={st.alive ? c : 'none'} stroke={st.alive ? 'var(--bg)' : 'var(--map-dead)'} strokeWidth=".7" />
          : <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill={st.alive ? c : 'none'} stroke={st.alive ? 'var(--bg)' : 'var(--map-dead)'} strokeWidth=".6" opacity={st.alive && st.plates < 5 && st.plates > 0 ? 0.65 : 1} />; })}
      <rect x={m.S[sd].nexus[0] - 3} y={m.S[sd].nexus[1] - 3} width="6" height="6" transform={`rotate(45 ${m.S[sd].nexus[0]} ${m.S[sd].nexus[1]})`} fill={m.nexusDown === sd ? 'none' : col(sd)} stroke={m.nexusDown === sd ? 'var(--map-dead)' : 'var(--gold-1)'} strokeWidth=".6" />
    </g>)}
    {xy && <g aria-hidden="true"><circle className="ping" cx={xy[0]} cy={xy[1]} r="7" /><circle cx={xy[0]} cy={xy[1]} r="2.2" fill="var(--gold-1)" stroke="var(--bg)" strokeWidth=".6" /></g>}
  </svg>;
}
function Card() {
  const m = M; if (!m || !m.card) return <p className="evidle">{!m ? 'A transmissão começa quando você iniciar a partida.' : m.over ? 'Fim de jogo.' : 'Próximo lance em instantes…'}</p>;
  const { R, stage } = m.card, ev = R.ev;
  const head = <div className="evh"><b className="loc">{ev.loc}</b><span className="kind">{ev.tag}</span></div>;
  if (stage === 'setup') return <div className="evcard">{head}<Html className="desc" html={ev.say} /></div>;
  const col = (sd: Side, roll: typeof R.rb) => roll.parts.length > 3
    ? <div className="skrow"><span className="nm">{tag(sd)}</span><span className="sl">{[...new Set(roll.parts.map(p => SK[p.sk].l))].join(' / ')}</span><b>{Math.round(roll.avg)}</b></div>
    : roll.parts.map((p, i) => <div className="skrow" key={i}><span className="nm">{plOf(sd, p.role).nickname}</span><span className="sl">{SK[p.sk].l}</span><b>{Math.round(p.val!)}</b></div>);
  if (stage === 'skills') return <div className="evcard">{head}<span className="cap">Habilidades em teste</span>
    <div className="skg"><div className="skc bl">{col('blue', R.rb)}</div><div className="skx">×</div><div className="skc rd">{col('red', R.rr)}</div></div></div>;
  const [title, sub] = outcome(R), cls = R.contest ? '' : R.win === 'blue' ? 'w' : 'l';
  const extra = R.contest ? '' : `${esc(tag(R.win))} ${R.real ? '+' + Math.round(R.real / 2) + '%' : 'segura a posição'}${R.victims!.length ? ' · abate: ' + R.victims!.join(', ') : ''}${R.firstBlood ? ' · first blood' : ''}`;
  return <div className={'evcard ' + cls}>{head}<Html className="res" html={title} /><Html className="desc" html={sub} />{extra && <Html className="desc small" html={extra} />}
    <div className="sktot"><span className="blue">{tag('blue')} <b>{R.rb.total}</b></span><small>dados {R.rb.dice} · {R.rr.dice}</small><span className="red"><b>{R.rr.total}</b> {tag('red')}</span></div></div>;
}

// ---------------- gráfico único: vitória % ou ouro (azul acima da linha de equilíbrio, vermelho abaixo) ----------------
// viewBox de 300 de largura com fonte 12: no celular de 360 px o texto fica em ~12 px, nunca abaixo
function LineChart({ m }: { m: Match }) {
  const [kind, setKind] = useState<'wp' | 'gd'>('wp');
  const [hover, setHover] = useState<number | null>(null);
  const pts = m.timeline, W = 300, H = 150, PL = 38, PR = 40, PT = 12, PB = 22, FS = 12;
  const tMax = Math.max(15 * 60, pts[pts.length - 1].t);
  const vals = pts.map(p => kind === 'wp' ? p.wp * 100 - 50 : p.gd);
  const lim = kind === 'wp' ? 50 : Math.max(2000, Math.ceil(Math.max(...vals.map(Math.abs)) / 1000) * 1000);
  const x = (t: number) => PL + (W - PL - PR) * t / tMax, y = (v: number) => PT + (H - PT - PB) * (0.5 - v / (2 * lim));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts[pts.length - 1].t).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`;
  const fmt = (v: number) => kind === 'wp' ? `${Math.round(v + 50)}%` : `${v > 0 ? '+' : ''}${ouroK(v)}`;
  const id = 'clip-' + kind, hi = hover !== null ? pts[hover] : null, hv = hover !== null ? vals[hover] : 0;
  const readout = (p: Match['timeline'][number]) => kind === 'wp'
    ? `${fmtT(p.t)} · ${G.user.tag} ${Math.round(p.wp * 100)}%`
    : `${fmtT(p.t)} · ${p.gd === 0 ? 'ouro igual' : `${p.gd > 0 ? G.user.tag : G.opp.tag} +${ouroK(Math.abs(p.gd))}`}`;
  const ticks = [0, 600, 1200, 1800, 2400, 3000].filter(t => t <= tMax);
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.target as SVGRectElement).getBoundingClientRect(), tt = ((e.clientX - r.left) / r.width) * tMax;
    let best = 0; pts.forEach((p, i) => { if (Math.abs(p.t - tt) < Math.abs(pts[best].t - tt)) best = i; }); setHover(best);
  };
  const last = pts.length - 1, lv = vals[last];
  return <div className="panel chartbox">
    <div className="chart-h"><div><span className="cap">{kind === 'wp' ? `Chance de vitória de ${G.user.tag}` : 'Diferença de ouro'}</span>
      <span className="num">{readout(hi ?? pts[last])}</span></div>
      <Seg className="seg-mini" value={kind} opts={[['wp', 'Vitória'], ['gd', 'Ouro']]} onChange={k => { setKind(k); setHover(null); }} /></div>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={kind === 'wp' ? `Chance de vitória do seu time ao longo da partida; agora ${fmt(lv)}` : `Diferença de ouro ao longo da partida; agora ${fmt(lv)}`}>
      <defs>
        <clipPath id={id + 'a'}><rect x={0} y={0} width={W} height={y(0)} /></clipPath>
        <clipPath id={id + 'b'}><rect x={0} y={y(0)} width={W} height={H} /></clipPath>
      </defs>
      {[lim, lim / 2, -lim / 2, -lim].map(v => <line key={v} x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth=".6" />)}
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="var(--dim)" strokeWidth="1" />
      <text x={PL - 4} y={y(lim) + 4} textAnchor="end" fontSize={FS} fill="var(--text-muted)">{kind === 'wp' ? '100%' : `+${lim / 1000}k`}</text>
      <text x={PL - 4} y={y(0) + 4} textAnchor="end" fontSize={FS} fill="var(--text-muted)">{kind === 'wp' ? '50%' : '0'}</text>
      <text x={PL - 4} y={y(-lim) + 4} textAnchor="end" fontSize={FS} fill="var(--text-muted)">{kind === 'wp' ? '0%' : `−${lim / 1000}k`}</text>
      {ticks.map(t => <text key={t} x={x(t)} y={H - 5} textAnchor="middle" fontSize={FS} fill="var(--text-muted)">{t / 60}′</text>)}
      <path d={area} fill="var(--side-blue)" opacity=".18" clipPath={`url(#${id}a)`} />
      <path d={area} fill="var(--side-red)" opacity=".18" clipPath={`url(#${id}b)`} />
      <path d={line} fill="none" stroke="var(--side-blue)" strokeWidth="2" strokeLinejoin="round" clipPath={`url(#${id}a)`} />
      <path d={line} fill="none" stroke="var(--side-red)" strokeWidth="2" strokeLinejoin="round" clipPath={`url(#${id}b)`} />
      <text x={PL + 4} y={PT + 10} fontSize={FS} fill="var(--text)">▲ {G.user.tag}</text>
      <text x={PL + 4} y={H - PB - 4} fontSize={FS} fill="var(--text)">▼ {G.opp.tag}</text>
      {/* rótulo direto no último ponto: o valor de agora sem precisar tocar */}
      <text x={x(pts[last].t) + 5} y={y(lv) + 4} fontSize={FS} fontWeight="700" fill={lv >= 0 ? 'var(--side-blue)' : 'var(--side-red)'}>{fmt(lv)}</text>
      {hi && <><line x1={x(hi.t)} x2={x(hi.t)} y1={PT} y2={H - PB} stroke="var(--gold-3)" strokeWidth=".8" />
        <circle cx={x(hi.t)} cy={y(hv)} r="4" fill={hv >= 0 ? 'var(--side-blue)' : 'var(--side-red)'} stroke="var(--surface)" strokeWidth="2" /></>}
      {/* no toque a mira fica fixa no último ponto tocado; só o mouse a solta ao sair */}
      <rect x={PL} y={0} width={W - PL - PR} height={H} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null); }} style={{ touchAction: 'pan-y' }} />
    </svg>
  </div>;
}

// ---------------- escalações ao vivo ----------------
function Lineup() {
  const m = M;
  // campeão, nick, K/D/A, progresso da Role Quest em texto e nota; sem os agregados Rotas/Luta/Macro do pré-jogo
  const side = (sd: Side) => <div className={`lu ${sd}`}><div className="lu-t">{teamOf(sd).name}</div>
    {ROLES.map(r => { const p = plOf(sd, r), s = m ? m.stats[p.id] : null, c = picksOf(sd)[r], q = m?.quests[p.id];
      const qt = !q ? '' : q.done ? ` · quest ✓ ${fmtT(q.at!)}` : ` · quest ${Math.min(99, Math.round(q.p))}%`;
      return <div className="lu-r" key={r}><Ct c={c} px={26} /><span className="nm">{p.nickname}<small>{s ? `${s.k}/${s.d}/${s.a}` : ROLE_AB[r]}{qt}</small></span><NotaBadge v={s ? s.nota : 6} /></div>; })}</div>;
  return <div className="lineup">{side('blue')}{side('red')}</div>;
}
function LogItem({ e }: { e: LogE }) {
  if (e.kind === 'sys') return <div className="ev sys"><Html html={e.html} /></div>;
  return <div className={`ev ${e.side === 'blue' ? 'bl' : e.side === 'red' ? 'rd' : ''} ${e.big ? 'big' : ''}`}><span className="t">{fmtT(e.t)}</span><span className="i"><Ic n={e.icon || 'Zap'} /></span><div className="x"><Html html={e.html} /></div></div>;
}

// ---------------- folhas ----------------
export function TabSheet() {
  useGame();
  const m = M; if (!m) return null;
  const block = (sd: Side) => <div className="panel" style={{ padding: '0 10px' }}><div className="tabrow cap" style={{ minHeight: 34 }}><span /><span>{teamOf(sd).name}</span><span>Nv</span><span style={{ textAlign: 'center' }}>K/D/A</span><span style={{ textAlign: 'center' }}>CS</span></div>
    {ROLES.map(r => { const p = plOf(sd, r), s = m.stats[p.id], c = picksOf(sd)[r]; return <div className="tabrow" key={r}><Ct c={c} px={30} /><div style={{ minWidth: 0 }}><b>{p.nickname}</b><small className="muted">{c?.name}</small></div>
      <span className="lvl">{levelOf(p.id)}</span><span className="n">{s.k}/{s.d}/{s.a}</span><span className="n muted">{csOf(p.id)}</span></div>; })}</div>;
  const gd = m.gold.blue - m.gold.red;
  return <>
    <div className="sec-h"><span className="num blue" style={{ fontSize: 'var(--fs-lg)' }}>{ouroK(m.gold.blue)}</span><span className="cap">{gd === 0 ? 'Ouro igual' : (gd > 0 ? '◀ ' : '') + num(Math.abs(gd)) + (gd < 0 ? ' ▶' : '')}</span><span className="num red" style={{ fontSize: 'var(--fs-lg)' }}>{ouroK(m.gold.red)}</span></div>
    {block('blue')}{block('red')}
    <div className="tiles"><div className="tile"><span className="cap">Placas</span><b>{m.plates.blue} · {m.plates.red}</b></div><div className="tile"><span className="cap">Ganks (JG)</span><b>{m.gk.blue.att} · {m.gk.red.att}</b></div><div className="tile"><span className="cap">Counter</span><b>{m.gk.blue.counter} · {m.gk.red.counter}</b></div></div>
  </>;
}
export function ResultSheet() {
  useGame();
  const ui = useUI(), m = M; if (!m || !m.over) return null;
  const win: Side = m.bar > 0 ? 'blue' : 'red', W_ = teamOf(win), mvp = mvpOf(win);
  const head = series.over ? `Série encerrada · ${series.wins.blue}-${series.wins.red}` : `Série ${series.wins.blue}-${series.wins.red} · MD${series.bo}`;
  const firsts: [string, string][] = [['blood', 'First Blood'], ['tower', '1ª torre'], ['dragon', '1º dragão'], ['baron', '1º Barão']];
  const won = win === 'blue';
  return <>
    <div className={'banner ' + (won ? 'win' : 'loss')}><i className="gem" aria-hidden="true" /><h2 className="banner-t">{won ? 'Vitória' : 'Derrota'}</h2><i className="gem" aria-hidden="true" /></div>
    <div className="vs"><div className="side"><Crest t={G.user} size={48} /><b className="num" style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--f-num)' }}>{m.kills.blue}</b></div>
      <div className="mid" style={{ fontSize: 'var(--fs-sm)' }}>{fmtT(m.t)}<div className="cap">{head}</div></div>
      <div className="side"><Crest t={G.opp} size={48} /><b className="num" style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--f-num)' }}>{m.kills.red}</b></div></div>
    <div className="tiles"><div className="tile"><span className="cap">Ouro</span><b>{ouroK(m.gold.blue)} · {ouroK(m.gold.red)}</b></div>
      <div className="tile"><span className="cap">Torres</span><b>{m.towers.blue} · {m.towers.red}</b></div>
      <div className="tile"><span className="cap">Dragões</span><b>{m.drakes.blue} · {m.drakes.red}</b></div></div>
    <div className="tchips" style={{ marginTop: 0 }}>{firsts.map(([k, l]) => m.first[k] ? <span key={k} className="tchip ghost">{l}: {tag(m.first[k]!)}</span> : null)}</div>
    <div className="panel-gold" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}><Ct c={mvp.c} px={56} />
      <div className="row-main"><span className="cap gold">MVP · {W_.tag} · nota {nota(mvp.s.nota)}</span><b style={{ fontSize: 'var(--fs-lg)' }}>{mvp.p.nickname}</b><small>{mvp.c ? mvp.c.name + ' · ' : ''}KDA {mvp.s.k}/{mvp.s.d}/{mvp.s.a}</small></div></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => ui.openSheet(`Placar · ${fmtT(m.t)}`, () => <TabSheet />)}><Ic n="List" /> Placar</button>
      <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { ui.closeSheet(); if (series.over) newSeries(); else nextSeriesGame(); }}>{series.over ? 'Nova série' : 'Próximo jogo'}</button></div>
    {series.fearless && !series.over && <p className="foot">Fearless: os 10 campeões deste jogo ficam bloqueados no resto da série. A First Selection do próximo jogo é de {teamOf(other(win)).tag}, que perdeu.</p>}
  </>;
}

// pular é irreversível (a transmissão acaba), então pede confirmação
function SkipConfirm() {
  const ui = useUI();
  return <>
    <p style={{ margin: 0 }}>A partida é simulada até o fim e você vai direto para o resultado. Não dá para voltar à transmissão.</p>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={ui.closeSheet}>Continuar assistindo</button>
      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { ui.closeSheet(); skipSim(); }}>Pular para o fim</button></div>
  </>;
}

// ---------------- tela principal ----------------
export function Partida() {
  useGame();
  const ui = useUI();
  const [draftOpen, setDraftOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState<'aovivo' | 'lances' | 'graficos' | 'times'>('aovivo');
  live.onFinish = () => ui.openSheet('Resultado', () => <ResultSheet />);
  const inDraft = draftOpen || (draft.step > 0 && !draft.done);
  // a aba Ao vivo é desenhada para caber na tela a partir do topo; ao sair do draft (página rolada) ou voltar a ela, sobe
  useEffect(() => { if (tab === 'aovivo' && !inDraft) scrollTo(0, 0); }, [tab, inDraft]);
  if (!draft.done && !inDraft && !M) return <PreMatch onDraft={() => setDraftOpen(true)} />;
  if (inDraft) return <DraftView onStart={() => { setDraftOpen(false); }} />;
  const m = M;
  let action: React.ReactNode = null;
  if (m && m.over) action = <><button className="btn btn-sq" onClick={() => ui.openSheet(`Placar · ${fmtT(m.t)}`, () => <TabSheet />)} aria-label="Placar"><Ic n="List" /></button>
    <button className="btn btn-primary" onClick={() => { if (series.over) newSeries(); else nextSeriesGame(); }}>{series.over ? 'Nova série' : 'Próximo jogo'}</button></>;
  // durante a transmissão os controles são discretos (contorno, só ícone): o dourado fica para a ação principal
  else if (m) action = <><button className="btn btn-sq" onClick={() => m.running ? pauseSim() : startSim()} aria-label={m.running ? 'Pausar' : 'Continuar'}><Ic n={m.running ? 'Pause' : 'Play'} /></button>
    <div className="seg spd" role="group" aria-label="Velocidade">{[1, 2, 4].map(s => <button key={s} aria-pressed={live.speed === s} onClick={() => setSpeed(s)} aria-label={`Velocidade ${s}×`}>{s}×</button>)}</div>
    <button className="btn btn-sq" onClick={() => ui.openSheet('Pular para o fim?', () => <SkipConfirm />)} aria-label="Pular para o fim"><Ic n="SkipForward" /></button></>;
  else action = <><button className="btn btn-primary" onClick={() => startSim()}><Ic n="Play" />Iniciar partida</button>
    <button className="btn btn-sq" onClick={skipSim} aria-label="Simular até o fim"><Ic n="SkipForward" /></button></>;
  return <>
    <Score />
    <Seg value={tab} opts={[['aovivo', 'Ao vivo'], ['lances', 'Lances'], ['graficos', 'Gráficos'], ['times', 'Times']]} onChange={setTab} />
    {/* Ao vivo: timers, mapa e cartão cabem juntos na tela sem rolar (o mapa se ajusta à altura disponível) */}
    {tab === 'aovivo' && <>
      <div className="panel mapbox"><Timers /><Minimap /><div className={'evslot' + (m && !m.over ? ' live' : '')}><Card /></div></div>
      {!m && <DraftEval />}</>}
    {tab === 'lances' && <>
      <div className="chips">{([['all', 'Todos'], ['kills', 'Abates'], ['obj', 'Objetivos'], ['tower', 'Torres'], ['quest', 'Quests']] as [string, string][]).map(([k, l]) =>
        <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}</div>
      <div className="panel log">{m ? m.log.filter(e => passFilter(e, filter)).map((e, i) => <LogItem key={m.log.length - i} e={e} />) : <div className="ev sys">Toque em iniciar para começar a transmissão</div>}</div></>}
    {tab === 'graficos' && (m && m.timeline.length > 2 ? <LineChart m={m} /> : <p className="foot">O gráfico aparece depois dos primeiros minutos de jogo.</p>)}
    {tab === 'times' && <><Lineup />
      {m && <button className="btn btn-sm" onClick={() => ui.openSheet(`Placar · ${fmtT(m.t)}`, () => <TabSheet />)}><Ic n="List" /> Placar completo (nível, CS, ouro)</button>}</>}
    <ActionBar compact={!!m && !m.over}>{action}</ActionBar>
  </>;
}
