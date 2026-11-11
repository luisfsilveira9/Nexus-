// Tela inicial: escolha entre o Modo Cartas (com save) e o Clássico. O resto do modo de cartas (Cartas.tsx) só é baixado quando preciso.
import { lazy, Suspense, useState } from 'react';
import { continuar, entrarClassico, prepararMundo, temSave } from '@/game/cartas';
import { apagar, haQuanto } from '@/game/save';
import { useUI } from './common';

const Fundacao = lazy(() => import('./Cartas').then(m => ({ default: m.Fundacao })));
const ImportSheet = lazy(() => import('./Cartas').then(m => ({ default: m.ImportSheet })));
const espera = <p className="foot" role="status">Carregando…</p>;

export function Inicio() {
  const ui = useUI(), [fundando, setFundando] = useState(false), [carregando, setCarregando] = useState(false);
  const sv = temSave();
  const abrir = async (f: () => Promise<unknown> | void) => { setCarregando(true); try { await prepararMundo(); await f(); } catch { ui.toast('Não deu para carregar os jogadores. Confira a conexão.'); } setCarregando(false); };
  const novo = () => void abrir(() => setFundando(true));
  if (fundando) return <main className="inicio"><section className="view"><Suspense fallback={espera}><Fundacao onBack={() => setFundando(false)} /></Suspense></section></main>;
  return <main className="inicio"><section className="view">
    <h1 className="marca">Nexus<small>eSports Manager · CBLOL 2026</small></h1>
    <div className="panel-gold modo"><span className="cap gold">Novo · com save</span><h2>Modo Cartas</h2>
      <p>Funde um clube com cartas de jogadores reais em Ferro e suba de elo jogando. Abra pacotes com os pontos das partidas.</p>
      {sv ? <><button className="btn btn-primary" disabled={carregando} onClick={() => void abrir(async () => { if (await continuar()) ui.go('clube'); else ui.toast('O save deste aparelho não abriu. Importe um código.'); })}>Continuar · {sv.clube.nome}</button>
        <small className="muted">{sv.cartas.length} cartas · salvo {haQuanto(sv.salvoEm)}</small>
        <button className="linkbtn" disabled={carregando} onClick={() => ui.openSheet('Começar de novo?', () => <><p style={{ margin: 0 }}>O clube <b>{sv.clube.nome}</b> e as {sv.cartas.length} cartas serão apagados deste aparelho. Exporte antes se quiser guardar.</p>
          <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={ui.closeSheet}>Cancelar</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { apagar(); ui.closeSheet(); novo(); }}>Apagar e fundar</button></div></>)}>Fundar outro clube</button></>
        : <button className="btn btn-primary" disabled={carregando} onClick={novo}>{carregando ? 'Carregando…' : 'Fundar meu clube'}</button>}
      <button className="linkbtn" onClick={() => ui.openSheet('Importar save', () => <Suspense fallback={espera}><ImportSheet /></Suspense>)}>Importar save</button></div>
    <div className="panel modo"><span className="cap">Sem save</span><h2>Modo Clássico</h2>
      <p>Assuma um time do CBLOL 2026 como ele é, jogue séries e amistosos internacionais. Recarregar a página reinicia.</p>
      <button className="btn" onClick={() => { entrarClassico(); ui.go('liga'); }}>Jogar o Clássico</button></div>
    <p className="foot">Projeto de fã, gratuito e sem fins comerciais. Não é afiliado nem endossado pela Riot Games, pelo CBLOL ou pelas equipes citadas. Nada no jogo custa dinheiro de verdade.</p>
  </section></main>;
}
