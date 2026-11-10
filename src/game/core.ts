// Estado global do jogo + utilidades. A interface React assina mudanças via subscribe/emit.
import { champions, LEAGUE, SEASON } from './data';
import type { Champion, Player, Role, Side, Team } from './types';

export { champions, LEAGUE, SEASON };
export const ROLES: Role[] = ['Top', 'Jungle', 'Mid', 'Adc', 'Support'];
export const ROLE_PT: Record<Role, string> = { Top: 'Topo', Jungle: 'Selva', Mid: 'Meio', Adc: 'Atirador', Support: 'Suporte' };
export const ROLE_AB: Record<Role, string> = { Top: 'TOP', Jungle: 'JG', Mid: 'MID', Adc: 'ADC', Support: 'SUP' };
export const STYLE_PT: Record<string, string> = { Engage: 'Iniciação', Teamfight: 'Luta em equipe', SplitPush: 'Split push', Pickoff: 'Emboscada', Poke: 'Poke' };
export const PERS_PT: Record<string, string> = { Leader: 'Líder', Star: 'Estrela', Workaholic: 'Workaholic', Quiet: 'Reservado' };
export const STYLE_NM: Record<string, string> = { T: 'Tanque', P: 'Proteção', F: 'Lutador', A: 'Assassino', M: 'Mago', K: 'Poke', H: 'Hipercarry', C: 'Catcher' };
export const TAC_NM: Record<string, string> = { initiation: 'Iniciação', peel: 'Proteção do carry', split: 'Split push', siege: 'Cerco', roaming: 'Roaming', gank: 'Gank', objectives: 'Controle de objetivos', shotcalling: 'Shotcalling' };

export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
export const fmtT = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export const nota = (v: number) => v.toFixed(1).replace('.', ',');
export const other = (sd: Side): Side => sd === 'blue' ? 'red' : 'blue';
export const hue = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0) * 37, 7) % 360;
export const initials = (n: string) => { const w = n.split(/[ '&.]+/).filter(Boolean); return w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2); };

export const pOvr = (p: Player) => Math.round((p.laning + p.teamfight + p.map + p.mental) / 4);
export const teamOvr = (t: Team) => Math.round(t.roster.reduce((a, p) => a + pOvr(p), 0) / 5);
export const champById = (id?: string | null): Champion | undefined => id ? champions.find(c => c.id === id) : undefined;
export const tById = (id: string) => LEAGUE.teams.find(t => t.id === id)!;

LEAGUE.teams.forEach(t => t.roster.forEach(p => { p.id = t.id + '_' + p.role; }));

// ---------- store ----------
let version = 0;
const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getVersion = () => version;
export const emit = () => { version++; listeners.forEach(f => f()); };

// ---------- seleção de times ----------
export const G = {
  userId: 'furia', oppId: 'loud',
  get user(): Team { return tById(G.userId); },
  get opp(): Team { return tById(G.oppId); },
};
export const teamOf = (sd: Side) => sd === 'blue' ? G.user : G.opp;
export const plOf = (sd: Side, role: Role) => teamOf(sd).roster.find(p => p.role === role)!;
export const rolePtOf = (r: Role) => ROLE_PT[r];
