import { useState } from 'react';
import { G, LEAGUE, rolePtOf, SEASON, tById, teamOvr, ROLE_AB } from '@/game/core';
import { series } from '@/game/draft';
import { standings } from '@/game/league';
import { pickTeam, playMatch, setFormat } from '@/game/session';
import { Crest, Seg, useGame, useUI } from './common';
import { Ic } from './icons';

function TeamSheet({ id }: { id: string }) {
  useGame();
  const ui = useUI(), t = tById(id), isU = id === G.userId, isO = id === G.oppId;
  const pick = (side: 'user' | 'opp') => { pickTeam(side, id); ui.closeSheet(); ui.toast(side === 'user' ? `Agora você comanda ${G.user.name}` : `Próximo adversário: ${G.opp.name}`); };
  return <>
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><Crest t={t} size={56} />
      <div className="row-main"><small>{t.status}{t.coach ? ' · Técnico ' + t.coach : ''}</small>
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}><span><span className="cap">OVR</span> <b className="ovr" style={{ fontSize: 18 }}>{teamOvr(t)}</b></span>
          <span><span className="cap">Entrosamento</span> <b className="num" style={{ fontSize: 17, color: 'var(--gold-1)' }}>{t.chemistry}%</b></span></div></div></div>
    <div className="panel">{t.roster.map(p => <div className="row" key={p.id}><span className="role-b">{ROLE_AB[p.role]}</span>
      <div className="row-main"><b>{p.nickname}</b><small>{p.realName || rolePtOf(p.role)}</small></div>
      <span className="ovr" style={{ fontSize: 18 }}>{Math.round((p.laning + p.teamfight + p.map + p.mental) / 4)}</span></div>)}</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button className={'btn ' + (isU ? '' : 'btn-primary')} style={{ flex: 1 }} disabled={isU} onClick={() => pick('user')}>{isU ? 'Seu time' : 'Assumir'}</button>
      <button className="btn" style={{ flex: 1 }} disabled={isO} onClick={() => pick('opp')}>{isO ? 'Adversário' : 'Enfrentar'}</button>
    </div>
  </>;
}

function MatchRow({ h, a, hs, as, bo }: { h: string; a: string; hs: number; as: number; bo: number }) {
  const ui = useUI(), H = tById(h), A = tById(a), hw = hs > as;
  return <div className="match">
    <div className="t"><Crest t={H} size={26} /><span className={hw ? '' : 'lose'}>{H.tag}</span></div>
    <div className="sc num">{hs}-{as}</div>
    <div className="t r"><Crest t={A} size={26} /><span className={hw ? 'lose' : ''}>{A.tag}</span></div>
    <button className="play" aria-label={`Simular ${H.name} contra ${A.name}`} onClick={() => { playMatch(h, a, bo); ui.go('partida'); ui.toast(`${H.name} × ${A.name} · MD${bo}`); }}><Ic n="Play" /></button>
  </div>;
}

export function Liga() {
  useGame();
  const ui = useUI();
  const [view, setView] = useState<'times' | 'tabela' | 'jogos' | 'playoffs'>('times');
  const [spId, setSp] = useState('s2');
  const sp = SEASON.splits.find(x => x.id === spId)!, U = G.user, R = G.opp;
  let body;
  if (view === 'times') {
    body = <div className="panel">{[...LEAGUE.teams].sort((a, b) => teamOvr(b) - teamOvr(a)).map(t =>
      <button key={t.id} className={'row ' + (t.id === G.userId ? 'me-row' : '')} onClick={() => ui.openSheet(t.name, () => <TeamSheet id={t.id} />)}>
        <Crest t={t} size={34} />
        <div className="row-main"><b>{t.name}{t.id === G.userId ? <span className="me cap"> · você</span> : t.id === G.oppId ? <span className="red cap"> · adversário</span> : null}</b>
          <small>{t.status} · {t.roster.map(p => p.nickname).join(', ')}</small></div>
        <span className="ovr" style={{ fontSize: 20 }}>{teamOvr(t)}</span><span className="dim"><Ic n="ChevronRight" /></span></button>)}</div>;
  } else if (view === 'tabela') {
    const st = standings(sp);
    body = <><div className="panel" style={{ overflowX: 'auto' }}><table className="tbl"><thead><tr><th>#</th><th>Time</th><th>V-D</th><th>Mapas</th><th>Saldo</th><th>Forma</th></tr></thead><tbody>
      {st.map((r, i) => { const t = tById(r.id), sd = r.gw - r.gl; return <tr key={r.id} className={`${i === 5 ? 'cut' : ''} ${i > 5 ? 'out' : ''} ${r.id === G.userId ? 'me-row' : ''}`}>
        <td className="muted">{i + 1}</td><td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Crest t={t} size={24} />{t.tag}</span></td>
        <td>{r.w}-{r.l}</td><td>{r.gw}-{r.gl}</td><td style={{ color: sd >= 0 ? 'var(--good)' : 'var(--red)' }}>{sd > 0 ? '+' : ''}{sd}</td>
        <td><span style={{ display: 'inline-flex', gap: 3 }}>{r.form.slice(-5).map((w, k) => <i key={k} style={{ width: 7, height: 7, display: 'block', background: w ? 'var(--good)' : 'var(--red)' }} />)}</span></td></tr>; })}
    </tbody></table></div><p className="foot">Os 6 primeiros vão aos playoffs (linha tracejada). Ordem oficial da liga, com desempates.</p></>;
  } else if (view === 'jogos') {
    let last = '';
    body = <div className="panel">{sp.regular.map(([d, h, a, hs, as], i) => { const head = d !== last ? <div className="grp-h">{d}</div> : null; last = d;
      return <div key={i}>{head}<MatchRow h={h} a={a} hs={hs} as={as} bo={3} /></div>; })}</div>;
  } else {
    let last = '';
    body = <div className="panel">{sp.playoffs.map(([st, d, h, a, hs, as], i) => { const head = st !== last ? <div className="grp-h">{st} · {d}</div> : null; last = st;
      return <div key={i}>{head}<MatchRow h={h} a={a} hs={hs} as={as} bo={5} /></div>; })}
      <div className="row" style={{ background: 'var(--surface-2)' }}><Ic n="Trophy" className="gold" /><div className="row-main"><b>Campeão: {tById(sp.campeao).name}</b><small>Vice: {tById(sp.vice).name} · 3º: {tById(sp.terceiro).name}</small></div></div></div>;
  }
  return <>
    <div className="panel-gold" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="sec-h"><span className="cap gold">Próximo confronto</span><span className="cap">MD{series.bo}{series.fearless ? ' · Fearless' : ''} · Jogo {series.game}</span></div>
      <div className="vs">
        <div className="side"><Crest t={U} size={52} /><b>{U.name}</b><span className="cap blue">Você · OVR {teamOvr(U)}</span></div>
        <div className="mid">VS<div className="num muted" style={{ fontSize: 20, fontFamily: 'var(--f-num)' }}>{series.wins.blue}-{series.wins.red}</div></div>
        <div className="side"><Crest t={R} size={52} /><b>{R.name}</b><span className="cap red">Adversário · OVR {teamOvr(R)}</span></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button className="linkbtn" onClick={() => { setView('times'); ui.toast('Toque num time para assumir ou enfrentar'); }}>Trocar times</button>
        <Seg className="" value={series.bo} opts={[[1, 'MD1'], [3, 'MD3'], [5, 'MD5']]} onChange={b => setFormat(b, series.fearless)} />
      </div>
    </div>
    <Seg value={view} opts={[['times', 'Times'], ['tabela', 'Tabela'], ['jogos', 'Jogos'], ['playoffs', 'Playoffs']]} onChange={setView} />
    {view !== 'times' && <div className="chips">{SEASON.splits.map(x => <button key={x.id} className="chip" aria-pressed={spId === x.id} onClick={() => setSp(x.id)}>{x.name} · {x.periodo}</button>)}</div>}
    {body}
    <p className="foot">Projeto de fã, sem fins comerciais. Não é afiliado nem endossado pela Riot Games, pelo CBLOL ou pelas equipes citadas. League of Legends é marca da Riot Games, Inc. As imagens dos campeões vêm do Data Dragon da Riot Games; escudos e retratos dos jogadores são gerados pelo jogo; atributos são estimativas.</p>
  </>;
}
