import { useEffect, useState } from 'react';
import { champById, champions, emit, G, ROLE_AB, ROLES, rolePtOf, STYLE_NM, STYLE_PT } from '@/game/core';
import {
  activeStrat, applyFirstSelection, autoFinish, COMP_KEYS, COMP_NM, curStep, curStrat, draft, draftMode, draftTick, DRAFT_SEQ, fitOf, fitsRole,
  hoverChamp, lockIn, ownerOf, PHASE_LBL, picksOf, plFor, resetDraft, selectSlot, series, setActiveStratRaw, setDraftModeRaw, stratsOf, suggestPicks,
  teamFit, threatOf, unavailable, userTurn, type CompId, type Strat,
} from '@/game/draft';
import { clearMatch } from '@/game/match';
import { setFormat } from '@/game/session';
import type { Role, Side } from '@/game/types';
import { ActionBar, Ct, fitColor, Seg, useGame, useUI } from './common';
import { Ic } from './icons';

export const setDraftMode = (m: 'auto' | 'manual') => { setDraftModeRaw(m); emit(); };
export const setActiveStrat = (i: number) => { setActiveStratRaw(i); emit(); };

// ---------------- First Selection (regra 2026) ----------------
export function FirstSelection() {
  useGame();
  const U = G.user, R = G.opp, mine = series.priority === 'blue';
  const [mode, setMode] = useState<'side' | 'order'>('order');
  const hold = mine ? U : R;
  if (series.selDone) {
    const firstT = series.first === 'blue' ? U : R;
    return <div className="panel fs">
      <div className="sec-h"><h2 style={{ fontSize: 15 }}>First Selection</h2><span className="cap">Jogo {series.game}</span></div>
      <p className="tc-d" style={{ margin: 0 }}>{hold.tag} tinha a prioridade e escolheu {series.choice === 'side' ? 'o lado' : 'a ordem de pick'}.</p>
      <div className="tchips"><span className="tchip">{U.tag}: lado {series.mapSide.blue.toLowerCase()}</span><span className="tchip">{R.tag}: lado {series.mapSide.red.toLowerCase()}</span><span className="tchip">1º pick: {firstT.tag}</span></div>
      {mine && draft.step === 0 && <button className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => { series.selDone = false; series.choice = null; emit(); }}>Mudar escolha</button>}
    </div>;
  }
  return <div className="panel-gold fs">
    <div className="sec-h"><h2 style={{ fontSize: 15 }}>First Selection</h2><span className="cap gold">sua prioridade</span></div>
    <p className="tc-d" style={{ margin: 0 }}>Regra de 2026: quem tem a prioridade escolhe <b>o lado</b> ou <b>a ordem de pick</b>; o adversário fica com a outra decisão. {series.game === 1 ? 'No jogo 1 a prioridade é da melhor semente.' : 'Depois do jogo 1, a prioridade vai para quem perdeu.'}</p>
    <Seg value={mode} opts={[['order', 'Ordem de pick'], ['side', 'Lado do mapa']]} onChange={setMode} />
    <div className="fs-opts">{mode === 'order'
      ? <><button className="btn btn-sm" onClick={() => { applyFirstSelection('order', 'first'); emit(); }}>1º pick</button><button className="btn btn-sm" onClick={() => { applyFirstSelection('order', 'second'); emit(); }}>2º pick (counter)</button></>
      : <><button className="btn btn-sm" onClick={() => { applyFirstSelection('side', 'Azul'); emit(); }}>Lado azul</button><button className="btn btn-sm" onClick={() => { applyFirstSelection('side', 'Vermelho'); emit(); }}>Lado vermelho</button></>}</div>
    <p className="foot" style={{ padding: 0 }}>{mode === 'order' ? '1º pick garante o campeão mais forte do patch; 2º pick fecha o draft com counters nas rotas.' : 'Lado azul fica mais perto de Barão, Arauto e Larvas; o vermelho, do Dragão (+1 nas disputas do seu lado).'}</p>
  </div>;
}

// ---------------- estratégia (pré-jogo) ----------------
function StratCard({ S, i }: { S: Strat; i: number }) {
  const ui = useUI(), on = i === activeStrat;
  return <button className={'stc ' + (on ? 'on' : '')} onClick={() => setActiveStrat(i)} aria-pressed={on}>
    <span className="stc-h"><b>{S.name}</b><span className={'tchip ' + (S.comp ? '' : 'ghost')}>{S.comp ? COMP_NM[S.comp] : 'Livre'}</span></span>
    <span className="stc-p">{ROLES.map(r => { const c = (S.picks[r] || []).map(champById).find(x => x && !(series.fearless && series.locked.has(x.id)));
      return <span className="stc-c" key={r}><small>{ROLE_AB[r]}</small><Ct c={c} px={34} /></span>; })}</span>
    <span className="stc-f"><small>{S.bans.length ? `${S.bans.length} ban${S.bans.length > 1 ? 's' : ''} definidos` : 'Bans automáticos'}</small>
      <span className="linkbtn" role="button" onClick={e => { e.stopPropagation(); ui.openSheet(`Estratégia ${String.fromCharCode(65 + i)}`, () => <StratEditor i={i} />); }}>Editar</span></span>
  </button>;
}
export function StratSection() {
  useGame();
  return <>
    <div className="sec-h"><h2>Estratégia de draft</h2><span className="cap">Escolha o plano</span></div>
    <div className="stl">{stratsOf(G.user).map((S, i) => <StratCard key={i} S={S} i={i} />)}</div>
    <Seg value={draftMode} opts={[['auto', <><Ic n="Sparkles" /> Automático</>], ['manual', <><Ic n="Hand" /> Manual</>]]} onChange={setDraftMode} />
    <p className="foot" style={{ padding: '0 2px', marginTop: -6 }}>{draftMode === 'auto' ? 'O draft roda sozinho seguindo o plano. Se um campeão do plano for banido, pego ou travado pelo Fearless, entra a próxima opção da rota.' : 'Você escolhe cada pick e ban. A lista vem ordenada pelo encaixe de cada jogador, com o plano marcado com estrela.'}</p>
  </>;
}
function StratEditor({ i }: { i: number }) {
  useGame();
  const ui = useUI(), S = stratsOf(G.user)[i];
  const slot = (kind: 'p' | 'b', role: Role | null, k: number) => { const c = champById(kind === 'b' ? S.bans[k] : (S.picks[role!] || [])[k]);
    return <button key={k} className="st-slot" onClick={() => ui.openSheet(kind === 'b' ? `Ban ${k + 1}` : `${rolePtOf(role!)} · opção ${k + 1}`, () => <Chooser i={i} kind={kind} role={role} k={k} />)}>
      <Ct c={c} px={40} /><small>{c ? c.name : kind === 'b' ? 'auto' : '—'}</small></button>; };
  return <>
    <label className="cap" htmlFor="st-name">Nome</label>
    <input className="search" id="st-name" defaultValue={S.name} maxLength={24} onChange={e => { S.name = e.target.value.trim() || 'Estratégia'; emit(); }} />
    <div><span className="cap">Identidade da composição</span>
      <div className="seg st-seg" style={{ marginTop: 8 }}>{([[null, 'Livre'], ...COMP_KEYS.map(k => [k, COMP_NM[k].split(' ')[0]])] as [CompId | null, string][]).map(([k, l]) =>
        <button key={String(k)} aria-pressed={S.comp === k} onClick={() => { S.comp = k; emit(); }}>{l}</button>)}</div>
      <button className="btn btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => { S.picks = suggestPicks(G.user, S.comp); if (S.comp) S.name = COMP_NM[S.comp]; emit(); ui.toast('Picks sugeridos pelo encaixe dos jogadores'); }}><Ic n="Wand2" /> Sugerir picks para essa identidade</button></div>
    <div><span className="cap">Picks por rota · ordem de prioridade</span>
      {ROLES.map(role => <div className="st-row" key={role}><div className="st-pl"><span className="role-b">{ROLE_AB[role]}</span><b>{plFor(G.user, role).nickname}</b></div>
        <div className="st-opts">{[0, 1, 2].map(k => slot('p', role, k))}</div></div>)}</div>
    <div><span className="cap">Bans prioritários</span><div className="st-opts st-bans">{[0, 1, 2, 3, 4].map(k => slot('b', null, k))}</div>
      <p className="foot">Vagas sem ban definido usam as maiores ameaças do adversário.</p></div>
    <button className="btn btn-primary" style={{ flex: 'none' }} onClick={() => { ui.closeSheet(); setActiveStrat(i); }}><Ic n="Check" /> Salvar e usar</button>
  </>;
}
function Chooser({ i, kind, role, k }: { i: number; kind: 'p' | 'b'; role: Role | null; k: number }) {
  useGame();
  const ui = useUI(), S = stratsOf(G.user)[i], pl = role ? plFor(G.user, role) : null;
  const [q, setQ] = useState(''), [all, setAll] = useState(false);
  const cur = kind === 'b' ? S.bans[k] : (S.picks[role!] || [])[k];
  const list = champions.filter(c => kind === 'b' || all || fitsRole(c, role!)).filter(c => !q || c.name.toLowerCase().includes(q))
    .map(c => ({ c, s: kind === 'b' ? threatOf(c) : fitOf(pl!, c) })).sort((a, b) => b.s - a.s).slice(0, 60);
  const pick = (id: string | null) => {
    const arr = kind === 'b' ? S.bans : (S.picks[role!] = S.picks[role!] || []);
    const prev = id ? arr.indexOf(id) : -1;
    if (!id) arr.splice(k, 1); else if (prev >= 0) { arr[prev] = arr[k]; arr[k] = id; } else arr[k] = id;
    for (let j = arr.length - 1; j >= 0; j--) if (!arr[j]) arr.splice(j, 1);
    emit(); ui.openSheet(`Estratégia ${String.fromCharCode(65 + i)}`, () => <StratEditor i={i} />);
  };
  return <>
    <input className="search" type="search" placeholder="Buscar campeão" value={q} onChange={e => setQ(e.target.value.trim().toLowerCase())} aria-label="Buscar campeão" />
    <div style={{ display: 'flex', gap: 8 }}>{kind === 'p' && <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setAll(!all)}>{all ? 'Só da rota' : 'Todas as rotas'}</button>}
      {cur && <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => pick(null)}><Ic n="X" /> Limpar vaga</button>}</div>
    <span className="cap">{kind === 'b' ? `Ordenado por ameaça nas mãos de ${G.opp.tag}` : `Ordenado pelo encaixe de ${pl!.nickname}`}</span>
    <div className="panel">{list.map(({ c, s }) => { const lock = series.fearless && series.locked.has(c.id), m = pl ? pl.mastery[c.id] : null;
      return <button key={c.id} className={'row ' + (c.id === cur ? 'me-row' : '')} style={{ minHeight: 52 }} onClick={() => pick(c.id)}><Ct c={c} px={36} />
        <div className="row-main"><b>{c.name}{lock && <span className="cap red"> · fearless</span>}</b><small>{c.styles.map(x => STYLE_NM[x]).join(' · ')}{m ? ` · maestria ${Math.round(m * 100)}%` : ''}</small></div>
        <span className="num" style={{ font: '700 17px var(--f-num)', color: fitColor(s) }}>{Math.round(s * 100)}%</span></button>; })}
      {!list.length && <p className="muted" style={{ textAlign: 'center', padding: 12 }}>Nenhum campeão encontrado.</p>}</div>
  </>;
}

// ---------------- tela do draft ----------------
function DraftSettings() {
  const ui = useUI(); useGame();
  return <>
    <div><span className="cap">Formato da série</span><div style={{ marginTop: 8 }}><Seg value={series.bo} opts={[[1, 'MD1'], [3, 'MD3'], [5, 'MD5']]} onChange={b => { setFormat(b, series.fearless); ui.closeSheet(); }} /></div></div>
    <div><span className="cap">Fearless</span><div style={{ marginTop: 8 }}><Seg value={series.fearless ? 'on' : 'off'} opts={[['on', 'Ligado'], ['off', 'Desligado']]} onChange={v => { setFormat(series.bo, v === 'on'); ui.closeSheet(); }} /></div>
      <p className="foot">Com Fearless (padrão em 2026), os campeões usados num jogo ficam bloqueados para os dois times no resto da série.</p></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => { ui.closeSheet(); resetDraft(); clearMatch(); emit(); }}><Ic n="RotateCcw" /> Reiniciar</button>
      <button className="btn" style={{ flex: 1 }} onClick={() => { resetDraft(); autoFinish(); ui.closeSheet(); emit(); }}><Ic n="Sparkles" /> Automático</button></div>
  </>;
}
function Timer() {
  const auto = draftMode === 'auto' && !draft.done;
  const t = draft.done ? 30 : auto ? draft.step + 1 : draft.timer, frac = auto ? t / DRAFT_SEQ.length : t / 30, low = !auto && !draft.done && t <= 10;
  const C = 2 * Math.PI * 23;
  return <div className="timer"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23" fill="none" stroke="var(--line)" strokeWidth="3" />
    <circle cx="26" cy="26" r="23" fill="none" stroke={low ? 'var(--red)' : 'var(--blue)'} strokeWidth="3" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} /></svg>
    <b>{draft.done ? '✓' : t}</b></div>;
}
function Bans({ side }: { side: Side }) {
  const bans = draft.bans[side], st = curStep(), active = !!st && st[1] === 'b' && ownerOf(st) === side;
  return <div className={'bans ' + (side === 'red' ? 'r' : '')}>{[0, 1, 2, 3, 4].map(i => { const c = bans[i], now = active && i === bans.length;
    return <span key={i} className={`ban ${c ? '' : 'empty'} ${now ? 'now' : ''}`} title={c ? c.name : ''}>{c ? <Ct c={c} px={26} /> : <span className="ct ct-empty" style={{ width: 26, height: 26 }} />}</span>; })}</div>;
}
function PicksCol({ side }: { side: Side }) {
  const team = side === 'blue' ? G.user : G.opp, picks = picksOf(side), st = curStep();
  const mine = !!st && st[1] === 'p' && ownerOf(st) === side;
  const nextEmpty = mine ? (side === 'blue' ? draft.slot : ROLES.find(r => !picks[r])) : null;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{ROLES.map(role => {
    const p = team.roster.find(x => x.role === role)!, c = picks[role], now = mine && role === nextEmpty;
    const shown = c || (now && side === 'blue' ? draft.hover : null), click = side === 'blue' && mine && !c && draftMode === 'manual';
    return <button key={role} className={`pk ${side === 'red' ? 'r' : ''} ${now ? 'now ' + (side === 'blue' ? 'bl' : 'rd') : ''}`} onClick={click ? () => selectSlot(role) : undefined} tabIndex={click ? 0 : -1} aria-label={`${rolePtOf(role)}: ${p.nickname}`}>
      <Ct c={shown} px={40} extra={shown && !c ? 'pre' : ''} />
      <div><b>{p.nickname}</b><small>{c ? c.name : now ? 'Escolhendo…' : ROLE_AB[role]}</small></div></button>; })}</div>;
}
function Pool() {
  const [f, setF] = useState<string>('ALL'), [q, setQ] = useState('');
  const st = curStep(), banning = !!st && st[1] === 'b', my = userTurn();
  useEffect(() => { if (!banning && draft.slot) setF(draft.slot); else if (banning) setF('ALL'); }, [banning, draft.slot]);
  const pl = !banning && draft.slot ? plFor(G.user, draft.slot) : null;
  const S = curStrat(), planned = new Set(banning ? S.bans : Object.values(S.picks).flat());
  const score = (c: typeof champions[number]) => banning ? threatOf(c) : pl ? fitOf(pl, c) : 0;
  const list = champions.filter(c => (f === 'ALL' || c.role === f || c.secondaryRole === f) && (!q || c.name.toLowerCase().includes(q)))
    .map(c => ({ c, s: score(c), bad: unavailable(c) }))
    .sort((a, b) => (Number(!!a.bad) - Number(!!b.bad)) || (Number(planned.has(b.c.id)) - Number(planned.has(a.c.id))) || (b.s - a.s) || a.c.name.localeCompare(b.c.name));
  return <>
    <div className="chips">{([['ALL', 'Todos'], ['Top', 'Topo'], ['Jungle', 'Selva'], ['Mid', 'Meio'], ['Adc', 'Atirador'], ['Support', 'Suporte']] as [string, string][]).map(([k, l]) =>
      <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
    <input className="search" type="search" placeholder="Buscar campeão" value={q} onChange={e => setQ(e.target.value.trim().toLowerCase())} aria-label="Buscar campeão" />
    <div className="pool">{list.map(({ c, s, bad }) => { const can = my && !bad;
      const tag = bad === 'ban' ? 'Ban' : bad === 'fearless' ? 'Lock' : bad === 'pick' ? 'Check' : planned.has(c.id) ? 'Star' : '';
      return <button key={c.id} className={`pc ${bad ? 'off' : ''} ${planned.has(c.id) && !bad ? 'plan' : ''}`} aria-pressed={draft.hover === c} disabled={!can} onClick={() => hoverChamp(c)} title={`${c.name} · ${STYLE_PT[c.style] || c.style}`}>
        <Ct c={c} px={52} /><span>{c.name}</span>{s ? <em className="pfit" style={{ color: fitColor(s) }}>{Math.round(s * 100)}%</em> : null}{tag && <i className="tag"><Ic n={tag} /></i>}</button>; })}
      {!list.length && <p className="muted" style={{ gridColumn: '1/-1', textAlign: 'center' }}>Nenhum campeão encontrado.</p>}</div>
  </>;
}
function Plan() {
  const S = curStrat();
  const tile = (id: string) => { const c = champById(id); if (!c) return null; const bad = unavailable(c), mine = ROLES.some(r => draft.picks.blue[r] === c) || draft.bans.blue.includes(c);
    return <span key={id} className={`pl-t ${mine ? 'mine' : bad ? 'off' : ''}`} title={c.name}><Ct c={c} px={30} /></span>; };
  return <div className="panel-gold plan">
    <div className="sec-h"><h2 style={{ fontSize: 15 }}><Ic n="Sparkles" /> {S.name}</h2><span className="cap">{S.comp ? COMP_NM[S.comp] : 'Livre'} · automático</span></div>
    <div className="pl-g">{ROLES.map(r => <div className="pl-r" key={r}><span className="role-b">{ROLE_AB[r]}</span>{(S.picks[r] || []).map(tile)}</div>)}
      <div className="pl-r"><span className="role-b" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}><Ic n="Ban" /></span>{S.bans.length ? S.bans.map(tile) : <small className="muted">ameaças do adversário</small>}</div></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setDraftMode('manual')}><Ic n="Hand" /> Assumir controle</button>
      <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => { autoFinish(); emit(); }}><Ic n="FastForward" /> Concluir agora</button></div>
  </div>;
}
export function DraftView({ onStart }: { onStart: () => void }) {
  useGame();
  const ui = useUI();
  useEffect(() => { const id = setInterval(draftTick, draftMode === 'auto' ? 700 : 1000); return () => clearInterval(id); }, []);
  const st = curStep(), bs = Math.round(teamFit('blue') * 100), rs = Math.round(teamFit('red') * 100);
  const firstTag = (series.first === 'blue' ? G.user : G.opp).tag;
  const turn = draft.done ? 'Toque em ir para a partida.'
    : ownerOf(st!) === 'blue' ? <><b className="blue">Sua vez</b> · {st![1] === 'b' ? 'escolha um ban' : 'escolha para ' + (draft.slot ? plFor(G.user, draft.slot).nickname : '')}</>
    : <><span className="red">{G.opp.name}</span> {st![1] === 'b' ? 'está banindo' : 'está escolhendo'}…</>;
  let cta: React.ReactNode = null;
  if (draft.done) cta = <button className="btn btn-primary" onClick={onStart}><Ic n="Swords" /> Ir para a partida</button>;
  else if (draftMode === 'manual') {
    const my = ownerOf(st!) === 'blue', ban = st![1] === 'b', h = draft.hover;
    const txt = !my ? 'Aguardando adversário…' : h ? (ban ? 'Banir ' : 'Confirmar ') + h.name : (ban ? 'Escolha um ban' : 'Escolha seu campeão');
    cta = <button className={'btn btn-primary ' + (h && ban && my ? 'btn-red' : '')} disabled={!my || !h} onClick={lockIn}>{txt}</button>;
  }
  return <>
    <div className="panel-gold" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="d-top"><Bans side="blue" /><Timer /><Bans side="red" /></div>
      <div className="d-phase"><b>{draft.done ? 'Draft completo' : PHASE_LBL(draft.step)}</b><span>{turn}</span></div>
      <div className="d-fit">
        <span className="blue"><small>Encaixe</small>{G.user.tag} {bs ? bs + '%' : '—'}</span>
        <button className="d-opt" onClick={() => ui.openSheet('Opções do draft', () => <DraftSettings />)} aria-label="Opções do draft"><Ic n="Settings2" /><span>Opções</span></button>
        <span className="red r"><small>Encaixe</small>{rs ? rs + '%' : '—'} {G.opp.tag}</span>
      </div>
      <div className="tchips" style={{ justifyContent: 'center', marginTop: 0 }}><span className="tchip ghost">1º pick: {firstTag}</span>{series.fearless && <span className="tchip ghost">Fearless · {series.locked.size} travados</span>}</div>
    </div>
    <div className="picks"><PicksCol side="blue" /><PicksCol side="red" /></div>
    {draftMode === 'auto' && !draft.done ? <Plan /> : !draft.done ? <Pool /> : null}
    <ActionBar>{cta}</ActionBar>
  </>;
}
