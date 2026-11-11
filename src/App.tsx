import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { G } from '@/game/core';
import { series } from '@/game/draft';
import { M } from '@/game/match';
import { applyTeams } from '@/game/session';
import { Crest, Sheet, UICtx, useGame, type Tab, type UI } from '@/ui/common';
import { Elenco } from '@/ui/Elenco';
import { Inicio } from '@/ui/Inicio';
import { Ic } from '@/ui/icons';
import { Liga } from '@/ui/Liga';
import { Motor } from '@/ui/Motor';
import { Partida } from '@/ui/Partida';

applyTeams(3, true);

const TABS: [Tab, string, string][] = [['liga', 'Trophy', 'Liga'], ['elenco', 'Users', 'Elenco'], ['partida', 'Play', 'Partida'], ['motor', 'Gauge', 'Motor']];
// modo de cartas: o Clube faz o papel de Liga + Elenco (o time vem das cartas)
const TABS_C: [Tab, string, string][] = [['clube', 'Shield', 'Clube'], ['cartas', 'Layers', 'Cartas'], ['loja', 'Package', 'Loja'], ['partida', 'Play', 'Partida']];
const ALL = [...TABS, ...TABS_C];
// as telas do modo de cartas ficam num pedaço à parte, fora do carregamento inicial
const Clube = lazy(() => import('@/ui/Cartas').then(m => ({ default: m.Clube })));
const Colecao = lazy(() => import('@/ui/Cartas').then(m => ({ default: m.Colecao })));
const Loja = lazy(() => import('@/ui/Cartas').then(m => ({ default: m.Loja })));

// endereço: a aba depois do "#", ou "elenco/" + id do jogador (a página do jogador entra no histórico, então o "voltar" do celular volta à lista)
const parseHash = () => { const [t, id] = location.hash.slice(1).split('/'); const tab = (ALL.some(x => x[0] === t) ? t : 'liga') as Tab; return { tab, player: tab === 'elenco' && id ? decodeURIComponent(id) : null }; };

export default function App() {
  useGame();
  const [tab, setTab] = useState<Tab>(() => parseHash().tab);
  const [player, setPlayer] = useState<string | null>(() => parseHash().player);
  const [sheet, setSheet] = useState<{ title: string; body: () => ReactNode } | null>(null);
  const [toastMsg, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [elencoView, setElencoView] = useState<'jogadores' | 'taticas'>('jogadores');
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pushed = useRef(false);   // a página do jogador foi aberta por nós (pushState): fechar = history.back()
  const go = useCallback((t0: Tab) => { const t = G.modo === 'cartas' && t0 === 'elenco' ? 'clube' : t0; setTab(t); setPlayer(null); pushed.current = false; try { history.replaceState(null, '', '#' + t); } catch { /* ignore */ } window.scrollTo(0, 0); }, []);
  const openPlayer = useCallback((id: string | null) => {
    if (G.modo === 'cartas') { go('clube'); return; }   // no modo de cartas não há página de jogador: o Clube mostra os titulares
    try {
      if (id) {
        const url = '#elenco/' + encodeURIComponent(id);
        if (location.hash.startsWith('#elenco/')) history.replaceState(null, '', url); else { history.pushState(null, '', url); pushed.current = true; }
      } else if (pushed.current) { pushed.current = false; history.back(); } else history.replaceState(null, '', '#elenco');
    } catch { /* ignore */ }
    setTab('elenco'); setPlayer(id); window.scrollTo(0, 0);
  }, [go]);
  const closeSheet = useCallback(() => setSheet(null), []);
  const ui: UI = useMemo(() => ({
    // abrir uma folha encerra o aviso anterior (ele cobriria o título da folha; quem abre outra coisa já seguiu em frente)
    tab, go, openSheet: (title, body) => { clearTimeout(tt.current); setToast(null); setSheet({ title, body }); }, closeSheet,
    toast: (msg: string, undo?: () => void) => { setToast({ msg, undo }); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(null), undo ? 5000 : 2600); },
    elencoView, setElencoView, player, openPlayer,
  }), [tab, go, closeSheet, elencoView, player, openPlayer]);
  useEffect(() => { const f = () => { const h = parseHash(); setTab(h.tab); setPlayer(h.player); if (!h.player) pushed.current = false; }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  // a aba do endereço pode ser do outro modo (ex.: recarregar em #clube sem save aberto): cai na primeira aba do modo atual
  const tabs = G.modo === 'cartas' ? TABS_C : TABS, cur = tabs.some(x => x[0] === tab) ? tab : tabs[0][0];
  const liveDot = !!(M && M.running && cur !== 'partida');
  const extras = <>{sheet && <Sheet title={sheet.title} onClose={closeSheet}>{sheet.body()}</Sheet>}
    {toastMsg && <div className="toast" role="status">{toastMsg.msg}
      {toastMsg.undo && <button className="toast-undo" onClick={() => { const u = toastMsg.undo!; clearTimeout(tt.current); setToast(null); u(); }}>Desfazer</button>}</div>}</>;
  if (G.modo === 'inicio') return <UICtx.Provider value={ui}><Inicio />{extras}</UICtx.Provider>;
  return <UICtx.Provider value={ui}>
    <header className="hdr"><div className="hdr-in">
      <Crest t={G.user} size={30} />
      <div className="hdr-title"><b>{G.user.name}</b><span>{G.modo === 'cartas' ? 'Modo Cartas' : 'CBLOL 2026'} · contra {G.opp.name}</span></div>
      <div className="series-chip">MD{series.bo} · {series.wins.blue}-{series.wins.red}</div>
    </div></header>
    <main><section className="view">
      {cur === 'liga' && <Liga />}
      {cur === 'elenco' && <Elenco />}
      {cur === 'partida' && <Partida />}
      {cur === 'motor' && <Motor />}
      <Suspense fallback={<p className="foot" role="status">Carregando…</p>}>
        {cur === 'clube' && <Clube />}
        {cur === 'cartas' && <Colecao />}
        {cur === 'loja' && <Loja />}
      </Suspense>
    </section></main>
    <nav className="tabbar" aria-label="Navegação principal"><div className="tabbar-in" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {tabs.map(([k, icon, l]) => <button key={k} className="tab" aria-current={cur === k ? 'page' : undefined} onClick={() => go(k)}><Ic n={icon} />{l}{k === 'partida' && liveDot && <i className="dot" />}</button>)}
    </div></nav>
    {extras}
  </UICtx.Provider>;
}
