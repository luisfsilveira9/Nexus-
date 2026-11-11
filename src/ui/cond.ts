// Condição do jogador (energia + estresse numa nota só) e a faixa em palavras; usada no Elenco e no Clube.
import type { Player } from '@/game/types';

export const condicao = (p: Player) => Math.round((p.energy + (100 - p.stress)) / 2);
export const faixaCond = (c: number): [string, string] => c >= 70 ? ['Boa', 'var(--positive)'] : c >= 40 ? ['Média', 'var(--q-3)'] : ['Baixa', 'var(--q-1)'];
