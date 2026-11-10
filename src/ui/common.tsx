import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { getVersion, hue, initials, subscribe } from '@/game/core';
import type { Champion, Team } from '@/game/types';
import { Ic } from './icons';

export const useGame = () => useSyncExternalStore(subscribe, getVersion);

export type Tab = 'liga' | 'elenco' | 'partida' | 'motor';
export interface UI {
  tab: Tab; go: (t: Tab) => void;
  openSheet: (title: string, body: () => ReactNode) => void; closeSheet: () => void;
  toast: (msg: string) => void;
  elencoView: 'jogadores' | 'taticas'; setElencoView: (v: 'jogadores' | 'taticas') => void;
}
export const UICtx = createContext<UI>(null as unknown as UI);
export const useUI = () => useContext(UICtx);

export function Crest({ t, size = 40 }: { t: Team; size?: number }) {
  const h = hue(t.id);
  return <span className="crest" style={{ width: size, height: Math.round(size * 1.1), fontSize: Math.round(size * 0.32), background: `linear-gradient(160deg,hsl(${h} 45% 38%),hsl(${(h + 30) % 360} 55% 16%))` }}>{t.tag}</span>;
}
export function Ct({ c, px, extra }: { c?: Champion | null; px: number; extra?: string }) {
  if (!c) return <span className="ct ct-empty" style={{ width: px, height: px }} />;
  const h = hue(c.id);
  return <span className={'ct ' + (extra || '')} style={{ width: px, height: px, fontSize: Math.round(px * 0.32), background: `radial-gradient(circle at 30% 25%,hsl(${h} 50% 42%),hsl(${(h + 40) % 360} 55% 12%) 75%)` }}>{initials(c.name)}</span>;
}
export const Bar = ({ v, color }: { v: number; color: string }) => <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: color }} /></div>;
export const Html = ({ html, className }: { html: string; className?: string }) => <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return <>
    <div className="scrim" onClick={onClose} />
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}><div className="sheet-in">
      <div className="sheet-grip"><h3>{title}</h3><button className="btn btn-sq btn-sm" onClick={onClose} aria-label="Fechar"><Ic n="X" /></button></div>
      {children}
    </div></div>
  </>;
}
export function ActionBar({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="actionbar"><div className="actionbar-in">{children}</div></div>;
}
export function Seg<T extends string | number>({ value, opts, onChange, className }: { value: T; opts: [T, ReactNode][]; onChange: (v: T) => void; className?: string }) {
  return <div className={'seg ' + (className || '')}>{opts.map(([v, l]) => <button key={String(v)} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
export const fitColor = (s: number) => s >= 0.75 ? 'var(--good)' : s >= 0.6 ? 'var(--gold-1)' : 'var(--muted)';
export const fitClr = (v: number) => v >= 85 ? 'var(--good)' : v >= 76 ? 'var(--gold-1)' : 'var(--red)';
