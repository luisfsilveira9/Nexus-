import { LEAGUE } from './core';
import type { Split } from './types';

export interface Standing { id: string; w: number; l: number; gw: number; gl: number; form: boolean[] }
export function standings(sp: Split): Standing[] {
  const m: Record<string, Standing> = {};
  LEAGUE.teams.forEach(t => { m[t.id] = { id: t.id, w: 0, l: 0, gw: 0, gl: 0, form: [] }; });
  sp.regular.forEach(([, h, a, hs, as]) => {
    m[h].gw += hs; m[h].gl += as; m[a].gw += as; m[a].gl += hs;
    const hw = hs > as; m[h][hw ? 'w' : 'l']++; m[a][hw ? 'l' : 'w']++;
    m[h].form.push(hw); m[a].form.push(!hw);
  });
  return sp.ordem.map(id => m[id]);
}
