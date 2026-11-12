// Modo de cartas (carregado sob demanda pelo App e pela tela inicial): fundar o clube, revelar pacotes, Clube, Cartas (coleção), Loja e as recompensas no resultado.
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { champById, G, LEAGUE, pOvr, ROLE_AB, ROLE_PT, ROLES, tById, teamOvr } from '@/game/core';
import { abandonarRun, abrirClube, abrirPacote, aplicarEscolha, aposSerie, bonusDominio, bonusEntros, C, cartaDe, cartaOvr, chances, continuar, dominio, ehReserva, ehTitular, ELOS, emSerie, entrosamento, escalar, fundar, jogador, noElo, PACOTES, podeEntrar, podeEscalar, proximoJogo, REGRAS, reservar, sair, seguirRun, temSave, type Ganho, type TipoPacote } from '@/game/cartas';
import { series } from '@/game/draft';
import { num, pct } from '@/game/fmt';
import { LIGA_PT } from '@/game/mundo';
import { exportar, haQuanto, importar, type Save } from '@/game/save';
import { M } from '@/game/match';
import { ESCOLHAS, ETAPAS, MEU, RESULTADO_PT, RODADAS, tabela, TORNEIO, type Jogo } from '@/game/run';
import { entradasSuico, suico, VITORIAS_SUICO, type Partida, type Torneio } from '@/game/torneio';
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
    {nota ?? (tit ? <span className="carta-tit"><Ic n="Star" />Titular</span> : ehReserva(k) ? <span className="carta-res">Reserva</span> : null)}</>;
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
    <p style={{ margin: 0 }}>Um jogador do CBLOL por rota. Toda carta começa em Ferro e sobe de elo jogando. O clube nasce com <b>{num(REGRAS.ptsInicio)} pontos</b>: dá para abrir um pacote básico na Loja antes da primeira rodada.</p>
    <Revelar ganhos={ganhos} fim="Conhecer o clube" onDone={() => { abrirClube(); ui.go('clube'); }} />
  </>;
}

// ---------- Clube ----------
function TrocaSheet({ r }: { r: Role }) {
  useGame();
  const ui = useUI(), s = C.save!, v = s.cartas.filter(c => jogador(c.k).role === r).sort((a, b) => cartaOvr(b.k, b.elo) - cartaOvr(a.k, a.elo));
  const pick = (k: string) => { const undo = escalar(k); ui.closeSheet(); if (undo) ui.toast(`${jogador(k).nickname} é o titular`, () => { undo(); }); };
  return <>{!podeEscalar() ? <p className="aviso" role="alert">Termine a partida em andamento para mexer na escalação.</p>
    : emSerie() ? <p className="aviso" role="alert">No meio de uma série só entram as reservas (até {REGRAS.maxReservas}, escolhidas na aba Cartas).</p> : null}
    <div className="panel">{v.map(c => { const p = jogador(c.k), cur = s.tit[r] === c.k; return <button key={c.k} className={'row' + (cur ? ' me-row' : '')} disabled={cur || !podeEntrar(c.k)} onClick={() => pick(c.k)}>
      <div className="row-main"><b>{p.nickname}</b><small><EloNome elo={c.elo} /> · PdL <span className="num">{c.pdl}/{REGRAS.pdlElo}</span> · {p.time}{ehReserva(c.k) ? ' · reserva' : ''}</small></div>
      {cur && <span className="cap">Titular</span>}<span className="ovr">{cartaOvr(c.k, c.elo)}</span></button>; })}</div>
    {v.length < 2 && <p className="foot" style={{ padding: 0 }}>Você só tem uma carta de {ROLE_PT[r].toLowerCase()}. Abra pacotes na Loja para ter opções.</p>}</>;
}
const nomeDe = (id: string) => tById(id).name, tagDe = (id: string) => tById(id).tag;
// 1 entre 3: um reforço antes de cada etapa
function Escolha() {
  const ui = useUI(), r = C.save!.run!, [sel, setSel] = useState('');
  const confirmar = () => { const nm = ESCOLHAS[sel].nome, g = aplicarEscolha(sel); if (g) ui.openSheet('Olheiro · pacote de rota', () => <AbrirSheet ganhos={g} />); else ui.toast(`${nm}: aplicado`); };
  return <>
    <div className="sec-h"><h2>{r.etapa === 0 ? 'Pré-temporada' : `Antes da ${ETAPAS[r.etapa]}`}</h2><span className="cap">Escolha 1 de 3</span></div>
    <div className="panel" role="radiogroup" aria-label="Reforço">{r.opcoes.map(id => { const e = ESCOLHAS[id]; return <button key={id} className={'row esc' + (sel === id ? ' sel-row' : '')} role="radio" aria-checked={sel === id} onClick={() => setSel(id)}>
      <span className="gold"><Ic n={e.ic} /></span><div className="row-main"><b>{e.nome}</b><small>{e.efeito}</small></div>{sel === id && <Ic n="Check" className="gold" />}</button>; })}</div>
    <button className="btn btn-primary" disabled={!sel} onClick={confirmar}>{sel ? `Confirmar ${ESCOLHAS[sel].nome}` : 'Escolha um reforço'}</button>
  </>;
}
const Placar = ({ j }: { j: Jogo }) => { const fim = j.sa >= 0, va = j.sa > j.sb; return <div className="chave-j">
  <span className={fim && !va ? 'lose' : ''}><Crest t={tById(j.a)} size={24} />{tagDe(j.a)}</span><b className="num">{fim ? `${j.sa}-${j.sb}` : 'a jogar'}</b><span className={'r ' + (fim && va ? 'lose' : '')}>{tagDe(j.b)}<Crest t={tById(j.b)} size={24} /></span></div>; };
function Chave() {
  const r = C.save!.run!; if (!r.semi.length) return null;
  return <div className="panel form"><span className="cap">Mata-mata · MD5</span><small className="muted">Semifinais</small>{r.semi.map((j, i) => <Placar key={i} j={j} />)}
    {r.final && <><small className="muted">Final</small><Placar j={r.final} /></>}</div>;
}
function Tabela() {
  const s = C.save!, t = tabela(s);
  return <><div className="panel"><table className="tbl"><thead><tr><th>#</th><th>Time</th><th>V-D</th></tr></thead><tbody>
    {t.map((l, i) => <tr key={l.id} className={`${i < 4 ? 'in' : 'out'} ${i === 3 ? 'cut' : ''} ${l.id === MEU ? 'me-row' : ''}`}><td className="muted">{i + 1}</td>
      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Crest t={tById(l.id)} size={24} />{nomeDe(l.id)}{l.id === MEU ? <span className="me cap"> · você</span> : null}</span></td><td>{l.v}-{l.d}</td></tr>)}
  </tbody></table></div><p className="foot" style={{ padding: 0 }}>Todos contra todos em MD1. Os 4 primeiros vão ao mata-mata em MD5 (faixa à esquerda e linha tracejada). Empate em vitórias: vale o confronto direto.</p></>;
}
function ProximoJogo() {
  useGame();
  const ui = useUI(), s = C.save!, j = proximoJogo(s)!, A = tById(j.adv), U = G.user, andando = emSerie();
  // se a última série já acabou e a tela da partida ainda mostra o resultado, o próximo jogo entra ao tocar
  const ir = () => { if (M && M.over && series.over) aposSerie(); ui.go('partida'); };
  return <div className="panel-gold" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="sec-h"><span className="cap gold">Próximo jogo</span><span className="cap">{j.rotulo.split(' · ').slice(1).join(' · ')} · MD{j.bo}</span></div>
    <div className="vs"><div className="side"><Crest t={U} size={48} /><b>{U.name}</b><span className="cap">OVR {teamOvr(U)}</span></div>
      <div className="mid">VS{andando && <div className="num muted" style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--f-num)' }}>{series.wins.blue}-{series.wins.red}</div>}</div>
      <div className="side"><Crest t={A} size={48} /><b>{A.name}</b><span className="cap">OVR {teamOvr(A)}</span></div></div>
    <button className="btn btn-primary" onClick={ir}><Ic n="Play" />{andando ? 'Continuar a série' : 'Ir para a partida'}</button>
  </div>;
}
function ResumoEtapa() {
  const s = C.save!, r = s.run!, h = r.hist[r.hist.length - 1], vaga = h.res === 'campeao' || (h.etapa === 2 && h.res === 'vice');
  const novas = (h.etapa === 2 ? ['LCK', 'LPL'] : ['LCS', 'LEC', 'LCP']).filter(l => !s.regioes.includes(l));
  return <><div className={'banner ' + (h.res === 'campeao' ? 'win' : 'loss')}><i className="gem" aria-hidden="true" /><h2 className="banner-t" style={{ fontSize: 'var(--fs-lg)', letterSpacing: '.06em', textAlign: 'center' }}>{RESULTADO_PT[h.res]}</h2><i className="gem" aria-hidden="true" /></div>
    <div className="panel form"><span className="cap">{ETAPAS[h.etapa]} · run {r.n}</span>
      <div className="prev"><div><span>Fase regular</span><b className="num">{h.pos}º · {h.v}-{h.d}</b></div><div><span>Campeão</span><b>{h.campeao === MEU ? s.clube.nome : nomeDe(h.campeao)}</b></div><div><span>Prêmio</span><b className="num">+{num(h.premio)} pontos</b></div></div>
      {vaga && <p className="aviso"><Ic n="Globe" /> Vaga no {TORNEIO[h.etapa]} garantida{h.etapa === 2 && h.res === 'vice' ? ' (o vice entra pelo play-in)' : ''}. {novas.length ? ` Ao chegar lá, ${novas.length > 1 ? 'as regiões' : 'a região'} ${lista(novas)} ${novas.length > 1 ? 'ficam liberadas' : 'fica liberada'} na Loja.` : ''}</p>}
      <button className="btn btn-primary" onClick={seguirRun}>{vaga ? `Ir para o ${TORNEIO[h.etapa]}` : h.etapa < 2 ? `Seguir para a ${ETAPAS[h.etapa + 1]}` : 'Ver o resumo da run'}</button></div></>;
}
// ---------- torneio internacional ----------
const FORMATO: Record<Torneio['id'], string> = {
  F: '8 times em 2 grupos de dupla eliminação (passam 2 de cada), semifinais e final. Tudo em MD5 com Fearless.',
  M: '11 times. Os 4 mais fracos jogam o play-in e o vencedor entra na chave de 8 em dupla eliminação; o campeão do Brasil entra direto. Tudo em MD5 com Fearless.',
  W: '19 times. O 1º do Brasil e 14 times entram no Suíço de 16; o 2º do Brasil e os 3 mais fracos jogam o play-in (MD3) e o vencedor sobe. Suíço: 3 vitórias classificam, 3 derrotas eliminam (MD1 nas 2 primeiras rodadas, MD3 depois). Mata-mata de 8 em MD5. Fearless em todas as séries.',
};
const tagT = (id: string) => id ? tagDe(id) : 'a definir';
const LadoT = ({ id, perdeu, r }: { id: string; perdeu: boolean; r?: boolean }) => <span className={(r ? 'r ' : '') + (perdeu ? 'lose' : '')}>{r && tagT(id)}{id && <Crest t={tById(id)} size={24} />}{!r && tagT(id)}</span>;
const PlacarT = ({ m }: { m: Partida }) => { const fim = m.sa >= 0, va = m.sa > m.sb;
  return <div className={'chave-j' + (m.a === MEU || m.b === MEU ? ' eu' : '')}><LadoT id={m.a} perdeu={fim && !va} /><b className="num">{fim ? `${m.sa}-${m.sb}` : m.a && m.b ? `MD${m.bo}` : 'x'}</b><LadoT id={m.b} perdeu={fim && va} r /></div>; };
function TabelaSuico({ t }: { t: Torneio }) {
  const sw = suico(t), ent = entradasSuico(t).filter(Boolean), ord = [...ent].sort((x, y) => sw.vit(y) - sw.vit(x) || sw.der(x) - sw.der(y) || ent.indexOf(x) - ent.indexOf(y));
  return <div className="panel"><table className="tbl"><thead><tr><th>#</th><th>Time</th><th>V-D</th><th>Situação</th></tr></thead><tbody>
    {ord.map((id, i) => { const ok = sw.vit(id) >= VITORIAS_SUICO, out = sw.der(id) >= VITORIAS_SUICO;
      return <tr key={id} className={`${ok ? 'in' : out ? 'out' : ''} ${id === MEU ? 'me-row' : ''}`}><td className="muted">{i + 1}</td>
        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Crest t={tById(id)} size={24} />{tagDe(id)}{id === MEU ? <span className="me cap"> · você</span> : null}</span></td>
        <td>{sw.vit(id)}-{sw.der(id)}</td><td><span className="cap">{ok ? 'Classificado' : out ? 'Eliminado' : 'Em jogo'}</span></td></tr>; })}
  </tbody></table></div>;
}
// as partidas agrupadas por fase; o que já acabou fica recolhido
function ChaveTorneio({ t }: { t: Torneio }) {
  const grupos: [string, Partida[]][] = []; t.partidas.forEach(m => { const k = m.rd ? m.fase : m.fase.split(' · ')[0], g = grupos.find(x => x[0] === k); if (g) g[1].push(m); else grupos.push([k, [m]]); });
  return <>{t.id === 'W' && t.partidas.some(m => m.rd) && <><div className="sec-h"><h2>Suíço</h2><span className="cap">3 vitórias classificam</span></div><TabelaSuico t={t} /></>}
    <div className="sec-h"><h2>Jogos</h2><span className="cap">{t.partidas.filter(m => m.sa >= 0).length} de {t.partidas.length}</span></div>
    {grupos.map(([k, v]) => <details key={k} className="fam" open={v.some(m => m.sa < 0)}><summary><b>{k}</b><span>{v.filter(m => m.sa >= 0).length} de {v.length}</span><Ic n="ChevronRight" /></summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>{v.map(m => <div key={m.id}>{!m.rd && m.fase.includes(' · ') && <small className="cap">{m.fase.split(' · ').slice(1).join(' · ')}</small>}<PlacarT m={m} /></div>)}</div></details>)}</>;
}
function TorneioTela() {
  const t = C.save!.run!.torneio!, ativo = C.save!.run!.fase === 'torneio';
  return <>{ativo ? <ProximoJogo /> : null}
    <div className="panel form"><div className="sec-h"><h2>{t.nome}</h2><span className="cap">Internacional</span></div>
      {t.novas.length > 0 && <p className="aviso"><Ic n="Globe" /> {t.novas.length > 1 ? 'Regiões liberadas' : 'Região liberada'} na Loja: {lista(t.novas)}.</p>}
      <small className="muted">{FORMATO[t.id]}</small></div>
    <ChaveTorneio t={t} /></>;
}
function ResumoTorneio() {
  const s = C.save!, r = s.run!, t = r.torneio!, h = r.intl[r.intl.length - 1];
  return <><div className={'banner ' + (h.res === 'campeao' ? 'win' : 'loss')}><i className="gem" aria-hidden="true" /><h2 className="banner-t" style={{ fontSize: 'var(--fs-lg)', letterSpacing: '.06em', textAlign: 'center' }}>{h.lugar}</h2><i className="gem" aria-hidden="true" /></div>
    <div className="panel form"><span className="cap">{t.nome} · run {r.n}</span>
      <div className="prev"><div><span>Campeão</span><b>{t.campeao === MEU ? s.clube.nome : nomeDe(t.campeao)}</b></div><div><span>Vice-campeão</span><b>{t.vice === MEU ? s.clube.nome : nomeDe(t.vice)}</b></div><div><span>Prêmio</span><b className="num">+{num(h.premio)} pontos</b></div></div>
      <button className="btn btn-primary" onClick={seguirRun}>{r.etapa < 2 ? `Seguir para a ${ETAPAS[r.etapa + 1]}` : 'Ver o resumo da run'}</button></div>
    <ChaveTorneio t={t} /></>;
}
function ResumoRun() {
  const s = C.save!, r = s.run!, total = r.hist.reduce((a, h) => a + h.premio, 0) + r.intl.reduce((a, h) => a + h.premio, 0);
  return <><div className="sec-h"><h2>Fim da run {r.n}</h2><span className="cap">Temporada 2026</span></div>
    <div className="panel">{r.hist.map(h => { const i = r.intl.find(x => x.torneio === TORNEIO[h.etapa]);   // cada internacional logo depois da etapa que deu a vaga
      return <Fragment key={h.etapa}><div className="row" style={{ minHeight: 52 }}><div className="row-main"><b>{ETAPAS[h.etapa]}</b><small>{h.pos}º na fase regular · {h.v}-{h.d}</small></div><span className="cap">{RESULTADO_PT[h.res]}</span></div>
        {i && <div className="row" style={{ minHeight: 52 }}><div className="row-main"><b>{i.torneio}</b><small>Internacional</small></div><span className="cap">{i.lugar}</span></div>}</Fragment>; })}</div>
    <div className="prev"><div><span>Prêmios da run</span><b className="num">+{num(total)} pontos</b></div><div><span>Títulos do clube</span><b className="num">{s.recordes.titulos}</b></div>
      <div><span>Vagas internacionais</span><b>{s.recordes.vagas.length ? s.recordes.vagas.join(', ') : 'nenhuma ainda'}</b></div></div>
    <p className="foot" style={{ padding: 0 }}>Na próxima run ficam as cartas, os elos, o PdL, os pontos e as regiões. Recomeçam a tabela, a condição das cartas, o entrosamento, o domínio da tática e os reforços.</p>
    <button className="btn btn-primary" onClick={seguirRun}>Começar a run {r.n + 1}</button></>;
}
function Temporada() {
  const r = C.save!.run!;
  if (r.fase === 'escolha') return <Escolha />;
  if (r.fase === 'fim') return <ResumoRun />;
  if (r.fase === 'torneio' || r.fase === 'fimTorneio') return r.fase === 'fimTorneio' ? <ResumoTorneio /> : <TorneioTela />;
  return <>{r.fase === 'fimEtapa' ? <ResumoEtapa /> : <ProximoJogo />}<Chave /><Tabela /></>;
}
function AbandonarSheet() { const ui = useUI(), r = C.save!.run!; return <><p style={{ margin: 0 }}>A run {r.n} termina agora. Você fica com as cartas, os elos e os pontos que já ganhou, e a run {r.n + 1} começa do zero (tabela, condição, entrosamento e reforços).</p>
  <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={ui.closeSheet}>Cancelar</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { abandonarRun(); ui.closeSheet(); ui.toast(`Run ${r.n + 1} começou`); }}>Abandonar a run</button></div></>; }
// "LCS, LEC e LCP"
const lista = (v: string[]) => v.length > 1 ? `${v.slice(0, -1).join(', ')} e ${v[v.length - 1]}` : v[0] ?? '';
const sinal = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 1);
export function Clube() {
  useGame();
  const ui = useUI(), s = C.save!, r = s.run!, U = G.user, [view, setView] = useState<'temporada' | 'time' | 'taticas'>('temporada');
  // "Último salvamento" envelhece sozinho, sem depender de outra mudança na tela
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(t); }, []);
  const dom = dominio(), reservas = s.reservas.map(k => cartaDe(k)!).filter(Boolean);
  return <>
    <div className="panel-gold" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Crest t={U} size={52} /><div className="row-main"><b style={{ fontSize: 'var(--fs-lg)' }}>{U.name}</b><small>Run {r.n} · {r.torneio && (r.fase === 'torneio' || r.fase === 'fimTorneio') ? r.torneio.nome : ETAPAS[r.etapa]}{r.fase === 'regular' ? ` · rodada ${Math.min(RODADAS, r.rodada + 1)} de ${RODADAS}` : r.fase === 'playoffs' ? ' · mata-mata' : ''}</small></div></div>
      <div className="tiles"><div className="tile"><span className="cap">Pontos</span><b>{num(s.pontos)}</b></div><div className="tile"><span className="cap">V-D</span><b>{s.vit}-{s.der}</b></div><div className="tile"><span className="cap">OVR</span><b>{teamOvr(U)}</b></div></div>
    </div>
    <Seg value={view} opts={[['temporada', 'Temporada'], ['time', 'Time'], ['taticas', 'Táticas']]} onChange={setView} />
    {view === 'taticas' ? <Taticas /> : view === 'temporada' ? <Temporada /> : <>
      <div className="sec-h"><h2>Titulares</h2><span className="cap">Toque para trocar</span></div>
      <div className="panel">{U.roster.map(p => { const o = cartaDe(s.tit[p.role])!, cond = condicao(p), [cw, cc] = faixaCond(cond);
        return <button key={p.id} className="row" style={{ minHeight: 64 }} onClick={() => ui.openSheet(`Titular · ${ROLE_PT[p.role]}`, () => <TrocaSheet r={p.role} />)}>
          <span className="role-b">{ROLE_AB[p.role]}</span>
          <div className="row-main"><b>{p.nickname}</b><small><EloNome elo={o.elo} /> · PdL <span className="num">{o.pdl}/{REGRAS.pdlElo}</span></small>
            <small style={{ display: 'block' }}>Condição <span className="num" style={{ color: cc, fontWeight: 700 }}>{cond}</span> {cw.toLowerCase()}</small></div>
          <span className="ovr">{pOvr(p)}</span><span className="dim"><Ic n="ChevronRight" /></span></button>; })}</div>
      <div className="sec-h"><h2>Reservas</h2><span className="cap">{reservas.length} de {REGRAS.maxReservas}</span></div>
      {reservas.length ? <div className="panel">{reservas.map(o => { const p = jogador(o.k); return <div className="row" key={o.k}><span className="role-b">{ROLE_AB[p.role]}</span>
        <div className="row-main"><b>{p.nickname}</b><small><EloNome elo={o.elo} /> · OVR <span className="num">{cartaOvr(o.k, o.elo)}</span></small></div>
        <button className="btn btn-sm" disabled={emSerie() || !podeEscalar()} onClick={() => { reservar(o.k); }}>Tirar</button></div>; })}</div> : null}
      <p className="foot" style={{ padding: 0 }}>Entre os jogos de uma série MD5 só as reservas podem entrar no time. Marque até {REGRAS.maxReservas} cartas como reserva na aba Cartas.</p>
      <div className="sec-h"><h2>Entrosamento e tática</h2><span className="cap">Só nesta run</span></div>
      <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="tile"><span className="cap">Entrosamento</span><b>{entrosamento()}</b><small className="muted">{sinal(bonusEntros())} nas disputas</small></div>
        <div className="tile"><span className="cap">Domínio da tática</span><b>{dom}/10</b><small className="muted">{sinal(bonusDominio())} nas disputas</small></div></div>
      <p className="foot" style={{ padding: 0 }}>Entrosamento sobe {REGRAS.entrosJogo} por jogo com os mesmos cinco e cai {REGRAS.entrosTroca} por titular trocado; cartas do mesmo time real somam {REGRAS.entrosOrg} cada. Em 50 é neutro. O domínio sobe 1 por jogo com a tática atual; trocar de tática começa outra contagem.</p>
    </>}
    <div className="panel form"><span className="cap">Save</span>
      {C.falhaSave ? <p className="aviso" role="alert">O navegador não deixou salvar. Exporte o código agora para não perder o clube.</p>
        : <p style={{ margin: 0 }}>Salvo neste aparelho · último salvamento {haQuanto(s.salvoEm)}.</p>}
      <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => ui.openSheet('Exportar save', () => <ExportSheet />)}><Ic n="Download" />Exportar</button>
        <button className="btn" style={{ flex: 1 }} onClick={() => ui.openSheet('Importar save', () => <ImportSheet />)}><Ic n="Upload" />Importar</button></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><button className="linkbtn" onClick={() => { sair(); }}>Voltar à tela inicial</button>
        {r.fase !== 'fim' && <button className="linkbtn" onClick={() => ui.openSheet('Abandonar a run?', () => <AbandonarSheet />)}>Abandonar a run</button>}</div></div>
  </>;
}

// ---------- Cartas (coleção) ----------
const ATR: [string, string][] = [['laning', 'Fase de rotas'], ['teamfight', 'Lutas em equipe'], ['map', 'Mapa'], ['mental', 'Mental'], ['mechanics', 'Mecânica'], ['farm', 'Farm']];
function CartaSheet({ k }: { k: string }) {
  useGame();
  const ui = useUI(), o = cartaDe(k); if (!o) return null;
  const p = noElo(k, o.elo), tit = ehTitular(k), res = ehReserva(k), camp = Object.entries(p.mastery).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => champById(id)).filter(Boolean);
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
      : <><button className="btn btn-primary" disabled={!podeEntrar(k)} onClick={por}>Escalar como titular</button>
        <button className="btn" disabled={emSerie() || !podeEscalar() || (!res && C.save!.reservas.length >= REGRAS.maxReservas)} onClick={() => { if (reservar(k)) ui.toast(res ? `${p.nickname} saiu das reservas` : `${p.nickname} está na reserva`); }}>{res ? 'Tirar da reserva' : `Pôr na reserva (${C.save!.reservas.length} de ${REGRAS.maxReservas})`}</button></>}
    {!tit && !podeEscalar() && <p className="aviso">Termine a partida em andamento para mexer na escalação.</p>}
    {!tit && podeEscalar() && emSerie() && !res && <p className="aviso">No meio de uma série só as reservas podem entrar.</p>}
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
    {r.ganhos.map(g => { const o = cartaDe(g.k)!, up = g.para > g.de; return <div key={g.k} className={up ? 'up' : ''}><span>{jogador(g.k).nickname}{g.mvp && <span className="recomp-mvp"><Ic n="Star" />melhor do time</span>}</span>
      <span className="muted">nota <span className="num">{num(g.nota ?? 0, 1)}</span> · {g.pdl ? <b className="num">+{g.pdl} PdL</b> : 'elo máximo'}</span><span>{up ? <><Ic n="Sparkles" />Subiu para <EloNome elo={g.para} /></> : <><EloNome elo={o.elo} /> <span className="num">{o.elo < 9 ? `${o.pdl}/${REGRAS.pdlElo}` : ''}</span></>}</span></div>; })}
    <small className="muted">Base de {r.venceu ? REGRAS.pdlVit : REGRAS.pdlDer} PdL na {r.venceu ? 'vitória' : 'derrota'}, mais ou menos {REGRAS.pdlNota} por ponto de nota acima ou abaixo da média do time{r.venceu ? `; o melhor do time ganha +${REGRAS.pdlMvp}` : ''}.{r.fimSerie ? ` Fim da série: todas as cartas recuperaram ${REGRAS.descansoSerie} de energia.` : ''}</small></div>;
}
