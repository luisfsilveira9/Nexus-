import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getVersion, hue, initials, subscribe } from '@/game/core';
import { nota } from '@/game/fmt';
import { champIconUrl } from '@/game/ddragon';
import type { Champion, Team } from '@/game/types';
import { Ic } from './icons';

export const useGame = () => useSyncExternalStore(subscribe, getVersion);

export type Tab = 'liga' | 'elenco' | 'partida' | 'motor';
export interface UI {
  tab: Tab; go: (t: Tab) => void;
  openSheet: (title: string, body: () => ReactNode) => void; closeSheet: () => void;
  toast: (msg: string) => void;
  elencoView: 'jogadores' | 'taticas'; setElencoView: (v: 'jogadores' | 'taticas') => void;
  player: string | null; openPlayer: (id: string | null) => void;   // página cheia do jogador (null = lista do elenco)
}
export const UICtx = createContext<UI>(null as unknown as UI);
export const useUI = () => useContext(UICtx);

export function Crest({ t, size = 40 }: { t: Team; size?: number }) {
  const h = hue(t.id);
  return <span className="crest" style={{ width: size, height: Math.round(size * 1.1), fontSize: Math.round(size * 0.32), background: `linear-gradient(160deg,hsl(${h} 45% 38%),hsl(${(h + 30) % 360} 55% 16%))` }}>{t.tag}</span>;
}
// campeões cuja imagem falhou (offline, campeão novo fora da versão) ficam com as iniciais
const iconFailed = new Set<string>();
export function Ct({ c, px, extra }: { c?: Champion | null; px: number; extra?: string }) {
  const [, setFailed] = useState(false);
  if (!c) return <span className="ct ct-empty" style={{ width: px, height: px }} />;
  const h = hue(c.id), showIcon = !iconFailed.has(c.id);
  return <span className={'ct ' + (extra || '')} style={{ width: px, height: px, fontSize: Math.round(px * 0.32), background: `radial-gradient(circle at 30% 25%,hsl(${h} 50% 42%),hsl(${(h + 40) % 360} 55% 12%) 75%)` }}>
    {initials(c.name)}
    {showIcon && <img className="ct-img" src={champIconUrl(c)} alt={c.name} loading="lazy" decoding="async" draggable={false}
      onError={() => { iconFailed.add(c.id); setFailed(true); }} />}
  </span>;
}
export const Bar = ({ v, color }: { v: number; color: string }) => <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: color }} /></div>;
// nota de jogador: fundo na escala --q-* por faixa; o número já informa, a cor só reforça
const NOTA_FAIXAS: [number, string, string][] = [[8, 'Excelente', '--q-5'], [7, 'Bom', '--q-4'], [6.5, 'Ok', '--q-3'], [5.5, 'Abaixo', '--q-2'], [-Infinity, 'Ruim', '--q-1']];
export function NotaBadge({ v }: { v: number }) {
  const [, faixa, cor] = NOTA_FAIXAS.find(([min]) => v >= min)!;
  return <span className="nota-b" role="img" aria-label={`nota ${nota(v)} (${faixa.toLowerCase()})`} style={{ background: `var(${cor})` }}>{nota(v)}</span>;
}
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
// compact: barra mais baixa e centralizada, para controles secundários (ex.: transmissão ao vivo)
export function ActionBar({ children, compact }: { children?: ReactNode; compact?: boolean }) {
  if (!children) return null;
  return <div className={'actionbar' + (compact ? ' compact' : '')}><div className="actionbar-in">{children}</div></div>;
}
export function Seg<T extends string | number>({ value, opts, onChange, className }: { value: T; opts: [T, ReactNode][]; onChange: (v: T) => void; className?: string }) {
  return <div className={'seg ' + (className || '')}>{opts.map(([v, l]) => <button key={String(v)} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
export const fitColor = (s: number) => s >= 0.75 ? 'var(--positive)' : s >= 0.6 ? 'var(--gold-1)' : 'var(--text-muted)';
export const fitClr = (v: number) => v >= 85 ? 'var(--positive)' : v >= 76 ? 'var(--gold-1)' : 'var(--negative)';
