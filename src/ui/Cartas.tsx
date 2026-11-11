// Modo de cartas (carregado sob demanda pelo App e pela tela inicial): fundar o clube, revelar pacotes, Clube, Cartas (coleção), Loja e as recompensas no resultado.
import { useEffect, useState, type ReactNode } from 'react';
import { champById, G, LEAGUE, pOvr, ROLE_AB, ROLE_PT, ROLES, teamOvr } from '@/game/core';
import { abrirClube, abrirPacote, adversarios, C, cartaDe, cartaOvr, chances, continuar, ehTitular, ELOS, escalar, fundar, jogador, noElo, PACOTES, podeEscalar, REGRAS, sair, temSave, type Ganho, type TipoPacote } from '@/game/cartas';
import { series } from '@/game/draft';
import { num, pct } from '@/game/fmt';
import { LIGA_PT } from '@/game/mundo';
import { exportar, haQuanto, importar, type Save } from '@/game/save';
import { pickTeam, setFormat } from '@/game/session';
import type { Role, Team } from '@/game/types';
import { Bar, Crest, Ct, Seg, useGame, useUI } from './common';
import { condicao, faixaCond } from './cond';
import { Taticas } from './Elenco';
import { Ic } from './icons';

// cor do elo: a escala de qualidade em pares (Ferro/Bronze … Grão-Mestre/Desafiante); o nome do elo vai sempre escrito
const eloCor = (e: number) => `var(--q-${Math.floor(e / 2) + 1})`;
// ícone próprio (não é o emblema da Riot): losango vazado no primeiro elo do par, com miolo no segundo
const EloIc = ({ elo }: { elo: number }) => <svg className="elo-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill="none" stroke={eloCor(elo)} strokeWidth="1.6" />{elo % 2 === 1 && <path d="M8 5 11 8 8 11 5 8Z" fill={eloCor(elo)} />}</svg>;
const EloNome = ({ elo }: { elo: number }) => <span className="elo-l"><EloIc elo={elo} />{ELOS[elo]}</span>;

export function Carta({ k, elo, nota, onClick }: { k: string; elo: number; nota?: ReactNode; onClick?: () => void }) {
  const p = jogador(k), tit = ehTitular(k), body = <>
    <span className="carta-top"><b className="ovr">{cartaOvr(k, elo)}</b><span className="role-b">{ROLE_AB[p.role]}</span></span>
    <b className="carta-n">{p.nickname}</b><small>{p.time} · {p.liga}</small>
    <EloNome elo={elo} />
    {nota ?? (tit ? <span className="carta-tit"><Ic n="Star" />Titular</span> : null)}</>;
  const st = { borderTopColor: eloCor(elo) };
  return onClick ? <button className="carta" style={st} onClick={onClick} aria-label={`${p.nickname}, ${ROLE_PT[p.role]}, ${ELOS[elo]}, OVR ${cartaOvr(k, elo)}${tit ? ', titular' : ''}`}>{body}</button> : <div className="carta" style={st}>{body}</div>;
}
const notaDe = (g: Ganho): ReactNode => g.nova ? <span className="carta-nova"><Ic n="Sparkles" />Nova</span> : <span className="carta-rep">{g.para > g.de ? `Subiu para ${ELOS[g.para]}` : g.pdl ? `Repetida +${g.pdl} PdL` : 'Repetida'}</span>;

// cartas viradas: toque em cada uma, ou "Revelar tudo"
export function Revelar({ ganhos, onDone, fim }: { ganhos: Ganho[]; onDone: () => void; fim: string }) {
  const [vis, setVis] = useState<boolean[]>(() => ganhos.map(() => false)), all = vis.every(Boolean);
  return <>
    <div className="cartas">{ganhos.map((g, i) => vis[i] ? <div className="rev" key={i}><Carta k={g.k} elo={g.para} nota={notaDe(g)} /></div>
      : <button key={i} className="carta verso" onClick={() => setVis(v => v.map((x, j) => x || j === i))} aria-label={`Revelar carta ${i + 1}`}><span className="verso-q">?</span><small>Toque para revelar</small></button>)}</div>
    {all ? <button className="btn btn-primary" onClick={onDone}>{fim}</button> : <button className="btn" onClick={() => setVis(v => v.map(() => true))}>Revelar tudo</button>}
  </>;
}

// ---------- save: exportar e importar ----------
function ExportSheet() {
  const ui = useUI(), code = exportar(C.save!);
  const copiar = async () => { try { await navigator.clipboard.writeText(code); ui.toast('Código copiado'); } catch { ui.toast('Não deu para copiar: selecione o texto e copie à mão'); } };
  const baixar = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = `nexus-${C.save!.clube.tag.toLowerCase()}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  return <>
    <p style={{ margin: 0 }}>Guarde este código fora do jogo (mande para você mesmo numa mensagem, por exemplo). Se o navegador apagar o save, é só importar.</p>
    <textarea className="inp code" readOnly value={code} rows={5} aria-label="Código do save" onFocus={e => e.currentTarget.select()} />
    <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" style={{ flex: 1 }} onClick={copiar}><Ic n="Copy" />Copiar</button>
      <button className="btn" style={{ flex: 1 }} onClick={baixar}><Ic n="Download" />Baixar</button></div>
  </>;
}
export function ImportSheet() {
  const ui = useUI(), [txt, setTxt] = useState(''), [erro, setErro] = useState(''), atual = C.save ?? temSave();
  const usar = async (code: string) => { const s: Save | null = importar(code); if (!s || !(await continuar(s))) { setErro('Este código não é um save válido do Nexus.'); return; } ui.closeSheet(); ui.go('clube'); ui.toast(`Save de ${s.clube.nome} carregado`); };
  return <>
    <p style={{ margin: 0 }}>Cole o código exportado ou escolha o arquivo.{atual ? <> <b>O save atual ({atual.clube.nome}) será substituído.</b></> : null}</p>
    <textarea className="inp code" value={txt} rows={4} aria-label="Código do save" placeholder="NEXUS1…" onChange={e => { setTxt(e.target.value); setErro(''); }} />
    <label className="btn"><Ic n="Upload" />Escolher arquivo<input type="file" accept=".txt,text/plain" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void f.text().then(t => { setTxt(t); setErro(''); }); }} /></label>
    {erro && <p className="aviso" role="alert">{erro}</p>}
    <button className="btn btn-primary" disabled={!txt.trim()} onClick={() => void usar(txt)}>Importar</button>
  </>;
}

// ---------- tela inicial e fundação ----------
const CORES: [number, string][] = [[0, 'Vermelho'], [28, 'Laranja'], [48, 'Dourado'], [110, 'Verde'], [170, 'Turquesa'], [215, 'Azul'], [265, 'Roxo'], [320, 'Rosa']];
function Fundar({ onDone, onBack }: { onDone: (g: Ganho[]) => void; onBack: () => void }) {
  const [sub, setSub] = useState(''), [nome, setNome] = useState(''), [tag, setTag] = useState(''), [cor, setCor] = useState(215);
  const nm = nome.trim(), tg = tag.trim().toUpperCase(), ok = !!sub && nm.length >= 2 && tg.length >= 2;
  const prev = { id: 'meu', tag: tg || '?', hue: cor } as Team;
  return <>
    <div className="sec-h"><h2>Fundar o clube</h2><button className="linkbtn" style={{ minWidth: 56 }} onClick={onBack}>Voltar</button></div>
    <div className="panel form"><label className="cap" htmlFor="f-nome">Nome do clube</label>
      <input id="f-nome" className="inp" value={nome} maxLength={22} autoComplete="off" onChange={e => setNome(e.target.value)} />
      <label className="cap" htmlFor="f-tag">Sigla (2 a 4 letras ou números)</label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><input id="f-tag" className="inp" style={{ flex: 1 }} value={tag} maxLength={4} autoComplete="off" autoCapitalize="characters" onChange={e => setTag(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())} /><Crest t={prev} size={44} /></div>
      <span className="cap" id="f-cor">Cor do escudo</span>
      <div className="swatches" role="group" aria-labelledby="f-cor">{CORES.map(([h, l]) => <button key={h} aria-pressed={cor === h} aria-label={l} title={l} onClick={() => setCor(h)}><i style={{ background: `hsl(${h} 50% 40%)` }} />{l}</button>)}</div></div>
    <div className="sec-h"><h2>Sua vaga no CBLOL</h2></div>
    <p className="foot" style={{ padding: 0 }}>Seu clube entra no lugar de um time. Ele sai da liga; os jogadores dele continuam existindo como cartas.</p>
    <div className="panel" role="radiogroup" aria-label="Time substituído">{LEAGUE.teams.map(t => <button key={t.id} className={'row' + (sub === t.id ? ' sel-row' : '')} role="radio" aria-checked={sub === t.id} onClick={() => setSub(t.id)}>
      <Crest t={t} size={34} /><div className="row-main"><b>{t.name}</b><small>{sub === t.id ? 'Sai da liga para você entrar' : `OVR ${teamOvr(t)}`}</small></div>{sub === t.id && <Ic n="Check" className="gold" />}</button>)}</div>
    <button className="btn btn-primary" disabled={!ok} onClick={() => onDone(fundar({ nome: nm, tag: tg, hue: cor, substitui: sub }))}>Fundar e abrir o pacote inicial</button>
    {!ok && <p className="foot" style={{ padding: 0 }}>Falta: {[!nm || nm.length < 2 ? 'nome' : '', tg.length < 2 ? 'sigla' : '', !sub ? 'escolher a vaga' : ''].filter(Boolean).join(', ')}.</p>}
  </>;
}
// fundação em duas fases: formulário e pacote inicial (as cartas viradas)
export function Fundacao({ onBack }: { onBack: () => void }) {
  const ui = useUI(), [ganhos, setGanhos] = useState<Ganho[] | null>(null);
  if (!ganhos) return <Fundar onBack={onBack} onDone={setGanhos} />;
  return <>
    <div className="sec-h"><h2>Pacote inicial</h2><span className="cap">5 cartas · Ferro</span></div>
    <p style={{ margin: 0 }}>Um jogador do CBLOL por rota. Toda carta começa em Ferro e sobe de elo jogando.</p>
    <Revelar ganhos={ganhos} fim="Conhecer o clube" onDone={() => { abrirClube(); ui.go('clube'); }} />
  </>;
}

// ---------- Clube ----------
function TrocaSheet({ r }: { r: Role }) {
  useGame();
  const ui = useUI(), s = C.save!, v = s.cartas.filter(c => jogador(c.k).role === r).sort((a, b) => cartaOvr(b.k, b.elo) - cartaOvr(a.k, a.elo));
  const pick = (k: string) => { const undo = escalar(k); ui.closeSheet(); if (undo) ui.toast(`${jogador(k).nickname} é o titular`, () => { undo(); }); };
  return <>{!podeEscalar() && <p className="aviso" role="alert">Termine a partida em andamento para mexer na escalação.</p>}
    <div className="panel">{v.map(c => { const p = jogador(c.k), cur = s.tit[r] === c.k; return <button key={c.k} className={'row' + (cur ? ' me-row' : '')} disabled={cur || !podeEscalar()} onClick={() => pick(c.k)}>
      <div className="row-main"><b>{p.nickname}</b><small><EloNome elo={c.elo} /> · PdL <span className="num">{c.pdl}/{REGRAS.pdlElo}</span> · {p.time}</small></div>
      {cur && <span className="cap">Titular</span>}<span className="ovr">{cartaOvr(c.k, c.elo)}</span></button>; })}</div>
    {v.length < 2 && <p className="foot" style={{ padding: 0 }}>Você só tem uma carta de {ROLE_PT[r].toLowerCase()}. Abra pacotes na Loja para ter opções.</p>}</>;
}
export function Clube() {
  useGame();
  const ui = useUI(), s = C.save!, U = G.user, [view, setView] = useState<'time' | 'taticas'>('time');
  // "Último salvamento" envelhece sozinho, sem depender de outra mudança na tela
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(t); }, []);
  const fora = LEAGUE.teams.find(t => t.id === s.clube.substitui);
  return <>
    <div className="panel-gold" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Crest t={U} size={52} /><div className="row-main"><b style={{ fontSize: 'var(--fs-lg)' }}>{U.name}</b><small>No lugar de {fora?.name ?? '—'} no CBLOL 2026</small></div></div>
      <div className="tiles"><div className="tile"><span className="cap">Pontos</span><b>{num(s.pontos)}</b></div><div className="tile"><span className="cap">V-D</span><b>{s.vit}-{s.der}</b></div><div className="tile"><span className="cap">OVR</span><b>{teamOvr(U)}</b></div></div>
    </div>
    <Seg value={view} opts={[['time', 'Time'], ['taticas', 'Táticas']]} onChange={setView} />
    {view === 'taticas' ? <Taticas /> : <>
      <div className="sec-h"><h2>Titulares</h2><span className="cap">Toque para trocar</span></div>
      <div className="panel">{U.roster.map(p => { const o = cartaDe(s.tit[p.role])!, cond = condicao(p), [cw, cc] = faixaCond(cond);
        return <button key={p.id} className="row" style={{ minHeight: 64 }} onClick={() => ui.openSheet(`Titular · ${ROLE_PT[p.role]}`, () => <TrocaSheet r={p.role} />)}>
          <span className="role-b">{ROLE_AB[p.role]}</span>
          <div className="row-main"><b>{p.nickname}</b><small><EloNome elo={o.elo} /> · PdL <span className="num">{o.pdl}/{REGRAS.pdlElo}</span></small>
            <small style={{ display: 'block' }}>Condição <span className="num" style={{ color: cc, fontWeight: 700 }}>{cond}</span> {cw.toLowerCase()}</small></div>
          <span className="ovr">{pOvr(p)}</span><span className="dim"><Ic n="ChevronRight" /></span></button>; })}</div>
      <div className="sec-h"><h2>Próximo adversário</h2><span className="cap">MD{series.bo}</span></div>
      <div className="panel">{adversarios().sort((a, b) => teamOvr(a) - teamOvr(b)).map(t => <button key={t.id} className={'row' + (t.id === G.oppId ? ' sel-row' : '')} aria-pressed={t.id === G.oppId} onClick={() => pickTeam('opp', t.id)}>
        <Crest t={t} size={30} /><div className="row-main"><b>{t.name}</b>{t.id === G.oppId && <small>Adversário escolhido</small>}</div><span className="ovr">{teamOvr(t)}</span></button>)}</div>
      <Seg value={series.bo} opts={[[1, 'MD1'], [3, 'MD3'], [5, 'MD5']]} onChange={b => setFormat(b, series.fearless)} />
      <button className="btn btn-primary" onClick={() => ui.go('partida')}><Ic n="Play" />Ir para a partida</button>
      <p className="foot" style={{ padding: 0 }}>Cada partida rende pontos ({REGRAS.ptsVit} na vitória, {REGRAS.ptsDer} na derrota) e PdL para os cinco titulares (+{REGRAS.pdlVit} ou +{REGRAS.pdlDer}). Quem fica no banco descansa; ao fim da série, todos recuperam energia.</p>
    </>}
    <div className="panel form"><span className="cap">Save</span>
      {C.falhaSave ? <p className="aviso" role="alert">O navegador não deixou salvar. Exporte o código agora para não perder o clube.</p>
        : <p style={{ margin: 0 }}>Salvo neste aparelho · último salvamento {haQuanto(s.salvoEm)}.</p>}
      <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => ui.openSheet('Exportar save', () => <ExportSheet />)}><Ic n="Download" />Exportar</button>
        <button className="btn" style={{ flex: 1 }} onClick={() => ui.openSheet('Importar save', () => <ImportSheet />)}><Ic n="Upload" />Importar</button></div>
      <button className="linkbtn" onClick={() => { sair(); }}>Voltar à tela inicial</button></div>
  </>;
}

// ---------- Cartas (coleção) ----------
const ATR: [string, string][] = [['laning', 'Fase de rotas'], ['teamfight', 'Lutas em equipe'], ['map', 'Mapa'], ['mental', 'Mental'], ['mechanics', 'Mecânica'], ['farm', 'Farm']];
function CartaSheet({ k }: { k: string }) {
  useGame();
  const ui = useUI(), o = cartaDe(k); if (!o) return null;
  const p = noElo(k, o.elo), tit = ehTitular(k), camp = Object.entries(p.mastery).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => champById(id)).filter(Boolean);
  const por = () => { const undo = escalar(k); ui.closeSheet(); if (undo) ui.toast(`${p.nickname} é o titular`, () => { undo(); }); };
  return <>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="role-b">{ROLE_AB[p.role]}</span><div className="row-main"><b style={{ fontSize: 'var(--fs-lg)' }}>{p.nickname}</b><small>{p.realName} · {p.time} · {p.liga} ({LIGA_PT[p.liga]})</small></div>
      <div style={{ textAlign: 'right' }}><div className="ovr">{cartaOvr(k, o.elo)}</div><span className="cap">OVR</span></div></div>
    <div className="panel form"><div className="sec-h"><EloNome elo={o.elo} /><span className="muted num">{o.elo < 9 ? `PdL ${o.pdl}/${REGRAS.pdlElo}` : 'Elo máximo'}</span></div>
      {o.elo < 9 && <Bar v={o.pdl} color={eloCor(o.elo)} />}
      <small className="muted">{o.elo < 9 ? `Próximo elo: ${ELOS[o.elo + 1]} (OVR ${cartaOvr(k, o.elo + 1)}). Em Desafiante esta carta chega a ${cartaOvr(k, 9)}.` : 'Esta carta já joga no nível real do jogador em 2026.'}{o.elo >= 7 && o.elo < 9 ? ' A partir do Mestre os ganhos de PdL valem a metade.' : ''}</small></div>
    <div className="prev">{ATR.map(([f, l]) => <div key={f}><span>{l}</span><b className="num">{(p as unknown as Record<string, number>)[f]}</b></div>)}</div>
    <div><span className="cap">Mais jogados em 2026 ({p.jogos} jogos, {pct(p.vit / p.jogos)} de vitórias)</span>
      <div className="camp5">{camp.map(c => <span key={c!.id}><Ct c={c} px={44} /><small>{c!.name}</small></span>)}</div></div>
    {tit ? <p className="foot" style={{ padding: 0 }}>É o seu titular de {ROLE_PT[p.role].toLowerCase()}.</p>
      : <button className="btn btn-primary" disabled={!podeEscalar()} onClick={por}>Escalar como titular</button>}
    {!tit && !podeEscalar() && <p className="aviso">Termine a partida em andamento para mexer na escalação.</p>}
  </>;
}
export function Colecao() {
  useGame();
  const ui = useUI(), s = C.save!, [rota, setRota] = useState<Role | ''>(''), [liga, setLiga] = useState(''), [elo, setElo] = useState(-1);
  const ligas = [...new Set(s.cartas.map(c => jogador(c.k).liga))], elos = [...new Set(s.cartas.map(c => c.elo))].sort((a, b) => a - b);
  const v = s.cartas.filter(c => (!rota || jogador(c.k).role === rota) && (!liga || jogador(c.k).liga === liga) && (elo < 0 || c.elo === elo)).sort((a, b) => cartaOvr(b.k, b.elo) - cartaOvr(a.k, a.elo));
  const total = C.mundo!.jogadores.filter(p => s.regioes.includes(p.liga)).length;
  return <>
    <div className="sec-h"><h2>Cartas</h2><span className="cap">{s.cartas.length} de {total} · {s.regioes.join(', ')}</span></div>
    <div className="chips altos" role="group" aria-label="Rota"><button className="chip" aria-pressed={!rota} onClick={() => setRota('')}>Todas</button>{ROLES.map(r => <button key={r} className="chip" aria-pressed={rota === r} onClick={() => setRota(r)}>{ROLE_PT[r]}</button>)}</div>
    {ligas.length > 1 && <div className="chips altos" role="group" aria-label="Liga"><button className="chip" aria-pressed={!liga} onClick={() => setLiga('')}>Todas as ligas</button>{ligas.map(l => <button key={l} className="chip" aria-pressed={liga === l} onClick={() => setLiga(l)}>{l}</button>)}</div>}
    {elos.length > 1 && <div className="chips altos" role="group" aria-label="Elo"><button className="chip" aria-pressed={elo < 0} onClick={() => setElo(-1)}>Todos os elos</button>{elos.map(e => <button key={e} className="chip" aria-pressed={elo === e} onClick={() => setElo(e)}>{ELOS[e]}</button>)}</div>}
    {v.length ? <div className="cartas">{v.map(c => <Carta key={c.k} k={c.k} elo={c.elo} onClick={() => ui.openSheet(jogador(c.k).nickname, () => <CartaSheet k={c.k} />)} />)}</div>
      : <p className="foot">Nenhuma carta com esses filtros.</p>}
    <p className="foot">Toda carta sai do pacote em Ferro e sobe um elo a cada {REGRAS.pdlElo} Pontos de Liga (PdL). Cada elo vale {num(REGRAS.porElo, 1)} de OVR; em Desafiante a carta joga no nível real do jogador.</p>
  </>;
}

// ---------- Loja ----------
function ChancesSheet({ tipo, alvo }: { tipo: TipoPacote; alvo?: string }) {
  const ch = chances(tipo, alvo);
  return <><p style={{ margin: 0 }}>Chance de cada jogador em <b>cada carta</b> do pacote. Quanto maior o OVR, mais raro. Repetida vira +{REGRAS.pdlRep} PdL na carta que você já tem.</p>
    <div className="panel">{ch.map(({ p, chance }) => <div className="row" key={p.chave} style={{ minHeight: 44 }}><span className="role-b">{ROLE_AB[p.role]}</span>
      <div className="row-main"><b>{p.nickname}</b><small>{p.time}{cartaDe(p.chave) ? ' · você já tem' : ''}</small></div><span className="num">{num(chance * 100, 1)}%</span></div>)}</div></>;
}
function AbrirSheet({ ganhos }: { ganhos: Ganho[] }) { const ui = useUI(); return <Revelar ganhos={ganhos} fim="Guardar cartas" onDone={ui.closeSheet} />; }
export function Loja() {
  useGame();
  const ui = useUI(), s = C.save!, [rota, setRota] = useState<Role>('Top'), [reg, setReg] = useState(s.regioes[0]);
  const comprar = (tipo: TipoPacote, alvo?: string) => { const g = abrirPacote(tipo, alvo); if (g) ui.openSheet(PACOTES[tipo].nome, () => <AbrirSheet ganhos={g} />); };
  const bloco = (tipo: TipoPacote, alvo: string | undefined, extra?: ReactNode, travado?: string) => { const pk = PACOTES[tipo], falta = pk.preco - s.pontos;
    return <div className="panel form" key={tipo}><div className="sec-h"><h2>{pk.nome}</h2><span className="num preco">{num(pk.preco)} pts</span></div>
      <p style={{ margin: 0 }}>{pk.desc}</p>{extra}
      {travado ? <p className="aviso"><Ic n="Lock" /> {travado}</p> : <>
        <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" style={{ flex: 1 }} disabled={falta > 0} onClick={() => comprar(tipo, alvo)}><Ic n="Package" />Abrir</button>
          <button className="btn" onClick={() => ui.openSheet(`Chances · ${pk.nome}`, () => <ChancesSheet tipo={tipo} alvo={alvo} />)}>Ver chances</button></div>
        {falta > 0 && <small className="muted">Faltam {num(falta)} pontos.</small>}</>}</div>; };
  return <>
    <div className="sec-h"><h2>Loja</h2><span className="cap">Seus pontos: <b className="num" style={{ color: 'var(--gold-1)', fontSize: 'var(--fs-md)' }}>{num(s.pontos)}</b></span></div>
    {bloco('basico', undefined)}
    {bloco('rota', rota, <div className="chips altos" role="group" aria-label="Rota do pacote">{ROLES.map(r => <button key={r} className="chip" aria-pressed={rota === r} onClick={() => setRota(r)}>{ROLE_PT[r]}</button>)}</div>)}
    {bloco('regiao', reg, s.regioes.length > 1 ? <div className="chips altos" role="group" aria-label="Região do pacote">{s.regioes.map(r => <button key={r} className="chip" aria-pressed={reg === r} onClick={() => setReg(r)}>{r}</button>)}</div> : undefined,
      s.regioes.length > 1 ? undefined : 'Por enquanto só o CBLOL está liberado. Outras regiões chegam com os torneios internacionais.')}
    <p className="foot">Os pontos vêm só de jogar partidas. Nada na loja custa dinheiro de verdade, e as chances de cada pacote ficam sempre à vista.</p>
  </>;
}

// ---------- recompensas da partida (dentro da folha de resultado) ----------
export function Recompensas() {
  const r = C.ultima; if (G.modo !== 'cartas' || !r) return null;
  return <div className="panel recomp"><div className="sec-h"><span className="cap">Recompensas</span><b className="num">+{num(r.pontos)} pontos</b></div>
    {r.ganhos.map(g => { const o = cartaDe(g.k)!, up = g.para > g.de; return <div key={g.k} className={up ? 'up' : ''}><span>{jogador(g.k).nickname}</span>
      <span className="muted">{g.pdl ? `+${g.pdl} PdL` : 'elo máximo'}</span><span>{up ? <><Ic n="Sparkles" />Subiu para <EloNome elo={g.para} /></> : <><EloNome elo={o.elo} /> <span className="num">{o.elo < 9 ? `${o.pdl}/${REGRAS.pdlElo}` : ''}</span></>}</span></div>; })}
    {r.fimSerie && <small className="muted">Fim da série: todas as cartas recuperaram {REGRAS.descansoSerie} de energia.</small>}</div>;
}
