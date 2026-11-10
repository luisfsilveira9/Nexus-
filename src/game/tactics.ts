// Táticas do time: mudam quais lances o time puxa e dão bônus nas rolagens que combinam com o elenco.
import type { Team, Tactics } from './types';

export const TACT_OPTS: Record<string, { t: string; o: [string, string][] }> = {
  plan: { t: 'Plano de jogo', o: [['early', 'Início forte'], ['bal', 'Equilibrado'], ['late', 'Escalar']] },
  jungle: { t: 'Caçador', o: [['farm', 'Power farm'], ['bal', 'Equilibrado'], ['gank', 'Forçar ganks']] },
  lane: { t: 'Alvo dos ganks', o: [['any', 'Livre'], ['Top', 'Topo'], ['Mid', 'Meio'], ['Adc', 'Bot']] },
  lanes: { t: 'Rotas no início', o: [['farm', 'Farmar'], ['bal', 'Equilibrado'], ['aggr', 'Agressivo']] },
  mid: { t: 'Foco do meio de jogo', o: [['macro', 'Objetivos'], ['bal', 'Equilibrado'], ['fight', 'Teamfight'], ['split', 'Split push']] },
};
const avgOf = (team: Team, f: (p: Team['roster'][number]) => number) => team.roster.reduce((a, p) => a + f(p), 0) / 5;
const jgOf = (team: Team) => team.roster.find(p => p.role === 'Jungle')!;
export const TACT_FIT: Record<string, Record<string, (t: Team) => number>> = {
  plan: { early: t => avgOf(t, p => p.laning * 0.6 + p.hid.aggression * 2), late: t => avgOf(t, p => p.teamfight * 0.6 + p.farm * 0.4), bal: () => 75 },
  jungle: { farm: t => jgOf(t).farm, gank: t => jgOf(t).tac.gank, bal: () => 75 },
  lanes: { farm: t => avgOf(t, p => p.farm), aggr: t => avgOf(t, p => (p.laning + p.mechanics) / 2), bal: () => 75 },
  mid: { macro: t => avgOf(t, p => (p.tac.objectives + p.tac.siege + p.map) / 3), fight: t => avgOf(t, p => (p.teamfight + p.tac.initiation + p.tac.peel) / 3),
    split: t => (t.roster.find(p => p.role === 'Top')!.tac.split + avgOf(t, p => p.map)) / 2 - 3, bal: () => 75 },
};
export const TACT_DESC: Record<string, Record<string, string>> = {
  plan: { early: 'Busca vantagem antes dos 20 minutos: mais forte cedo, mais fraco se o jogo passar dos 30.', bal: 'Sem janela preferida.', late: 'Segura o início para crescer no fim: perde um pouco cedo, ganha depois dos 30 minutos.' },
  jungle: { farm: 'O caçador prioriza a própria selva e a quest do pet: menos ganks, mais ouro e Smite melhor mais cedo.', bal: 'Ganka quando aparece oportunidade.', gank: 'O caçador procura ganks o tempo todo: mais jogadas no início, menos farm.' },
  lanes: { farm: 'As rotas evitam trocas e priorizam farm (e as Role Quests): menos abates cedo, mais ouro depois.', bal: 'Troca dano quando é vantajoso.', aggr: 'As rotas forçam trocas e placas: mais duelos e mais abates para os dois lados.' },
  mid: { macro: 'Agrupa por torres, placas, visão e objetivos.', bal: 'Decide conforme o jogo pede.', fight: 'Procura lutas 5 contra 5.', split: 'O topo (nível 20 e TP da quest) pressiona a rota lateral enquanto o time segura o mapa.' },
};
export const TACT_STAT: Record<string, Record<string, string>> = {
  plan: { early: 'Rotas e agressividade', late: 'Luta e farm' }, jungle: { farm: 'Farm do caçador', gank: 'Gank do caçador' },
  lanes: { farm: 'Farm das rotas', aggr: 'Rotas e mecânica' }, mid: { macro: 'Objetivos, cerco e mapa', fight: 'Luta, iniciação e proteção', split: 'Split do topo e mapa do time' },
};
export const bestShotcaller = (team: Team) => [...team.roster].sort((a, b) => b.tac.shotcalling - a.tac.shotcalling)[0].id;
export function suggestTactics(team: Team): Tactics {
  const pick = (k: string, keys: string[]) => keys.map(x => [x, TACT_FIT[k][x](team)] as [string, number]).sort((a, b) => b[1] - a[1])[0];
  const jg = jgOf(team), jungle = jg.tac.gank - jg.farm >= 4 ? 'gank' : jg.farm - jg.tac.gank >= 4 ? 'farm' : 'bal';
  const lanePick = ['Top', 'Mid', 'Adc'].map(r => [r, team.roster.find(p => p.role === r)!.laning] as [string, number]).sort((a, b) => b[1] - a[1])[0][0];
  const mid = pick('mid', ['macro', 'fight', 'split']), plan = pick('plan', ['early', 'late']);
  return { shotcaller: bestShotcaller(team), plan: plan[1] > 80 ? plan[0] : 'bal', jungle, lane: jungle === 'gank' ? lanePick : 'any', lanes: 'bal', mid: mid[1] >= 82 ? mid[0] : 'bal' };
}
export function tacticsOf(team: Team): Tactics { if (!team.tactics) team.tactics = suggestTactics(team); return team.tactics; }
export const tactStr = (team: Team, k: string, v: string) => v === 'bal' || !TACT_FIT[k] || !TACT_FIT[k][v] ? 0 : Math.max(0.2, Math.min(1.5, (TACT_FIT[k][v](team) - 68) / 16));
export const shotcallerOf = (team: Team) => team.roster.find(p => p.id === tacticsOf(team).shotcaller) || team.roster[0];
export function tacticsSummary(team: Team) {
  const X = tacticsOf(team), nm = (k: string, v: string) => (TACT_OPTS[k].o.find(o => o[0] === v) || [])[1] || '';
  return [nm('plan', X.plan), X.jungle === 'gank' ? `ganks ${X.lane === 'any' ? 'livres' : 'no ' + nm('lane', X.lane).toLowerCase()}` : X.jungle === 'farm' ? 'power farm' : 'caçador equilibrado',
    X.lanes === 'aggr' ? 'rotas agressivas' : X.lanes === 'farm' ? 'rotas farmando' : null, X.mid !== 'bal' ? nm('mid', X.mid).toLowerCase() : null].filter(Boolean).join(' · ');
}
