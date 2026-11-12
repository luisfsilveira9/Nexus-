// Save do modo de cartas: um JSON versionado no localStorage, com exportar/importar (o navegador interno do celular pode apagar o armazenamento).
import type { RunState } from './run';
import type { Role, SeasonStats, Tactics } from './types';

export const SAVE_V = 3, SAVE_KEY = 'nexus.save';
// carta possuída: k = "liga|nick" (chave do jogador em mundo.ts), elo 0 (Ferro) a 9 (Desafiante), PdL 0–99 dentro do elo
export interface Owned { k: string; elo: number; pdl: number; en: number; st: number; mo: number; s?: SeasonStats }
export interface Save {
  v: number; criadoEm: number; salvoEm: number;
  clube: { nome: string; tag: string; hue: number; substitui: string };
  cartas: Owned[]; tit: Record<Role, string>; pontos: number; vit: number; der: number; pacotes: number;
  regioes: string[]; tatica?: Tactics;
  // v2 (a run): reservas (até 3), a temporada em andamento, quantas runs já terminaram e os recordes da conta
  reservas: string[]; run: RunState | null; runs: number; recordes: { titulos: number; vagas: string[]; melhor: string };
}
// uma função por versão antiga: MIGR[n] leva um save da versão n para a n+1
const MIGR: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  // v1 → v2: o clube e as cartas ficam; a primeira run começa ao entrar (run: null)
  1: s => ({ ...s, v: 2, reservas: [], run: null, runs: 0, recordes: { titulos: 0, vagas: [], melhor: '' } }),
  // v2 → v3 (os internacionais): a run em andamento ganha o campo do torneio e a lista de resultados
  2: s => ({ ...s, v: 3, run: s.run ? { ...(s.run as object), torneio: null, intl: [] } : null }),
};
const valido = (s: unknown): s is Save => { const x = s as Save; return !!x && typeof x === 'object' && x.v === SAVE_V && !!x.clube && typeof x.clube.nome === 'string' && Array.isArray(x.cartas) && x.cartas.every(c => typeof c.k === 'string' && c.elo >= 0 && c.elo <= 9) && !!x.tit && typeof x.pontos === 'number' && Array.isArray(x.reservas) && !!x.recordes; };
export function migrar(raw: unknown): Save | null {
  let s = raw as Record<string, unknown>; if (!s || typeof s !== 'object' || typeof s.v !== 'number' || s.v > SAVE_V) return null;
  while ((s.v as number) < SAVE_V) { const f = MIGR[s.v as number]; if (!f) return null; s = f(s); }
  return valido(s) ? s : null;
}
export function ler(): Save | null { try { const t = localStorage.getItem(SAVE_KEY); return t ? migrar(JSON.parse(t)) : null; } catch { return null; } }
export function gravar(s: Save): boolean { try { s.salvoEm = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; } }
export function apagar() { try { localStorage.removeItem(SAVE_KEY); } catch { /* sem armazenamento */ } }
// pede ao navegador para não apagar o armazenamento sob pressão de espaço (nem todo navegador atende)
export const pedirPersistencia = () => { try { void navigator.storage?.persist?.(); } catch { /* ignore */ } };

// código copiável: "NEXUS1." + JSON em base64 (UTF-8). Serve também como conteúdo do arquivo exportado.
const PRE = 'NEXUS1.';
export function exportar(s: Save): string { const b = new TextEncoder().encode(JSON.stringify(s)); let t = ''; b.forEach(c => { t += String.fromCharCode(c); }); return PRE + btoa(t); }
export function importar(code: string): Save | null {
  try { const c = code.trim(); if (!c.startsWith(PRE)) return null; const t = atob(c.slice(PRE.length).replace(/\s+/g, ''));
    return migrar(JSON.parse(new TextDecoder().decode(Uint8Array.from(t, ch => ch.charCodeAt(0))))); } catch { return null; }
}
export const haQuanto = (ms: number) => { const m = Math.floor((Date.now() - ms) / 60000); return m < 1 ? 'agora há pouco' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)} h` : `há ${Math.floor(m / 1440)} d`; };
