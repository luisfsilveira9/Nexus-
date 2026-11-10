// Termo do glossário: sublinhado pontilhado; um toque abre a definição curta.
// Caixa própria e leve (o Popover do Radix somava ~33 kB gzip ao pacote só para isto): abre acima do termo, ou abaixo
// se não couber, sem sair da tela; fecha com Esc, toque fora ou rolagem.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARIO } from '@/game/glossario';

export function Termo({ t, children }: { t: string; children?: ReactNode }) {
  const g = GLOSSARIO[t], id = useId(), btn = useRef<HTMLButtonElement>(null), box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !btn.current || !box.current) return;
    const r = btn.current.getBoundingClientRect(), b = box.current.getBoundingClientRect(), m = 12;
    const left = Math.max(m, Math.min(r.left, innerWidth - b.width - m));
    const top = r.top - b.height - 8 >= m ? r.top - b.height - 8 : r.bottom + 8;
    setPos({ left, top });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.type === 'pointerdown' && (box.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return; setOpen(false); };
    addEventListener('pointerdown', close); addEventListener('keydown', close); addEventListener('scroll', close, true);
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', close); removeEventListener('scroll', close, true); };
  }, [open]);
  if (!g) return <>{children ?? t}</>;
  return <>
    <button ref={btn} type="button" className="termo" aria-expanded={open} aria-controls={id} onClick={() => { setPos(null); setOpen(!open); }}>{children ?? t}</button>
    {open && createPortal(<div ref={box} id={id} role="dialog" aria-label={g.l} className="termo-pop" style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
      <b>{g.l}</b><p>{g.d}</p></div>, document.body)}
  </>;
}

// sublinha a primeira ocorrência de cada termo do glossário dentro de um texto corrido
const KEYS = Object.keys(GLOSSARIO).sort((a, b) => b.length - a.length);
const RE = new RegExp(`(${KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
export function ComTermos({ txt }: { txt: string }) {
  const used = new Set<string>();
  return <>{txt.split(RE).map((part, i) => { if (!GLOSSARIO[part] || used.has(part)) return part; used.add(part); return <Termo key={i} t={part} />; })}</>;
}
