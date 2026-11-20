// O mundo de 2026: os 363 jogadores das seis ligas e os 20 times de fora do Brasil que jogaram First Stand, MSI ou Mundial.
// Os dados (mundo-dados.ts, ~35 kB gzip) só são baixados quando alguém pede: loadMundo() usa import() dinâmico.
import { clamp, registerTeams } from './core';
import { masteryFromGames } from './proStats';
import type { Player, Role, Team } from './types';
import type { Linha } from './mundo-dados';

export interface WorldPlayer extends Player { chave: string; liga: string; time: string; pais: string; ovr: number; jogos: number; vit: number }
export interface WorldTeam extends Team { liga: string; torneios: string; elo: number; shift: number }
// montar: cópia nova do jogador (chave = "liga|nick") com id próprio e os atributos deslocados em d pontos (pode ser fracionário)
export interface Mundo { jogadores: WorldPlayer[]; times: WorldTeam[]; porChave: Record<string, WorldPlayer>; montar: (chave: string, id: string, d: number) => WorldPlayer }
export const LIGA_PT: Record<string, string> = { LCK: 'Coreia', LPL: 'China', LEC: 'Europa', LCS: 'Américas', LCP: 'Ásia-Pacífico', CBLOL: 'Brasil' };
export const TORNEIO_PT: Record<string, string> = { F: 'First Stand', M: 'MSI', W: 'Mundial' };
const SK = ['laning', 'teamfight', 'map', 'mental', 'mechanics', 'farm'] as const;

// d = deslocamento do time (ajuste ao Elo real), somado aos atributos de jogo e aos táticos como em docs/pesquisa-ligas/ajustar-elo.ts
function toPlayer(r: Linha, id: string, d: number, D: typeof import('./mundo-dados')): WorldPlayer {
  const [nickname, realName, pais, liga, time, role, ovr, jogos, vit, sk, tac, apt, aggression, versatility, personality, pool] = r;
  const mastery: Record<string, number> = {}; for (let i = 0; i < pool.length; i += 3) mastery[D.CAMPEOES[pool[i]]] = masteryFromGames(pool[i + 1], pool[i + 2]);
  const lv = (v: number) => clamp(Math.round(v + d), 1, 99), s = Object.fromEntries(SK.map((k, i) => [k, lv(sk[i])])) as Record<typeof SK[number], number>;
  return { id, nickname, realName, role: role as Role, personality, ...s, energy: 95, stress: 22, morale: 80, mastery,
    apt: Object.fromEntries(D.APT_K.map((k, i) => [k, apt[i]])), tac: Object.fromEntries(D.TAC_K.map((k, i) => [k, lv(tac[i])])),
    hid: { consistency: 11, bigGames: 11, pressure: 10, versatility, aggression }, chave: `${liga}|${nickname}`, liga, time, pais, ovr, jogos, vit };
}

let cache: Promise<Mundo> | null = null;
export function loadMundo(): Promise<Mundo> {
  return cache ??= import('./mundo-dados').then(D => {
    const jogadores = D.JOGADORES.map((r, i) => toPlayer(r, 'w' + i, 0, D));
    // titulares: em cada rota, quem mais jogou pelo time em 2026
    const times = D.TIMES.map(([id, tag, name, liga, torneios, elo, shift]): WorldTeam => ({ id, tag, name, liga, torneios, elo, shift, status: `${liga} · ${LIGA_PT[liga]}`, coach: '', budget: 0, chemistry: 80,
      roster: (['Top', 'Jungle', 'Mid', 'Adc', 'Support'] as Role[]).map(role => toPlayer(D.JOGADORES.filter(r => r[4] === tag && r[5] === role).sort((a, b) => b[7] - a[7])[0], `${id}_${role}`, shift, D)) }));
    registerTeams(times);
    const linha = Object.fromEntries(D.JOGADORES.map(r => [`${r[3]}|${r[0]}`, r]));
    return { jogadores, times, porChave: Object.fromEntries(jogadores.map(p => [p.chave, p])), montar: (chave, id, d) => toPlayer(linha[chave], id, d, D) };
  });
}
