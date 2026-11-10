import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { G } from '@/game/core';
import { series } from '@/game/draft';
import { M } from '@/game/match';
import { applyTeams } from '@/game/session';
import { Crest, Sheet, UICtx, useGame, type Tab, type UI } from '@/ui/common';
import { Elenco } from '@/ui/Elenco';
import { Ic } from '@/ui/icons';
import { Liga } from '@/ui/Liga';
import { Motor } from '@/ui/Motor';
import { Partida } from '@/ui/Partida';

applyTeams(3, true);

const TABS: [Tab, string, string][] = [['liga', 'Trophy', 'Liga'], ['elenco', 'Users', 'Elenco'], ['partida', 'Play', 'Partida'], ['motor', 'Gauge', 'Motor']];

export default function App() {
  useGame();
  const [tab, setTab] = useState<Tab>(() => { const h = location.hash.slice(1); return (TABS.some(t => t[0] === h) ? h : 'liga') as Tab; });
  const [sheet, setSheet] = useState<{ title: string; body: () => ReactNode } | null>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [elencoView, setElencoView] = useState<'jogadores' | 'taticas'>('jogadores');
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);
  const go = useCallback((t: Tab) => { setTab(t); try { history.replaceState(null, '', '#' + t); } catch { /* ignore */ } window.scrollTo(0, 0); }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const ui: UI = useMemo(() => ({
    tab, go, openSheet: (title, body) => setSheet({ title, body }), closeSheet,
    toast: (m: string) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(null), 2600); },
    elencoView, setElencoView,
  }), [tab, go, closeSheet, elencoView]);
  useEffect(() => { const f = () => { const h = location.hash.slice(1) as Tab; if (TABS.some(t => t[0] === h)) setTab(h); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const liveDot = !!(M && M.running && tab !== 'partida');
  return <UICtx.Provider value={ui}>
    <header className="hdr"><div className="hdr-in">
      <Crest t={G.user} size={30} />
      <div className="hdr-title"><b>{G.user.name}</b><span>CBLOL 2026 · contra {G.opp.name}</span></div>
      <div className="series-chip">MD{series.bo} · {series.wins.blue}-{series.wins.red}</div>
    </div></header>
    <main><section className="view">
      {tab === 'liga' && <Liga />}
      {tab === 'elenco' && <Elenco />}
      {tab === 'partida' && <Partida />}
      {tab === 'motor' && <Motor />}
    </section></main>
    <nav className="tabbar" aria-label="Navegação principal"><div className="tabbar-in" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {TABS.map(([k, icon, l]) => <button key={k} className="tab" aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}><Ic n={icon} />{l}{k === 'partida' && liveDot && <i className="dot" />}</button>)}
    </div></nav>
    {sheet && <Sheet title={sheet.title} onClose={closeSheet}>{sheet.body()}</Sheet>}
    {toastMsg && <div className="toast">{toastMsg}</div>}
  </UICtx.Provider>;
}
