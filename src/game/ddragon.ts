// Imagens oficiais do Data Dragon (CDN da Riot). Trocar a versão para atualizar as artes.
import type { Champion } from './types';

export const DDRAGON_VERSION = '16.22.1';

// IDs do Data Dragon que não seguem a regra "nome sem pontuação"
const DD_ID: Record<string, string> = {
  belveth: 'Belveth', chogath: 'Chogath', kai_sa: 'Kaisa', khazix: 'Khazix', velkoz: 'Velkoz',
  leblanc: 'Leblanc', nunu_willump: 'Nunu', renata: 'Renata', wukong: 'MonkeyKing',
};

export const ddragonId = (c: Champion) => DD_ID[c.id] ?? c.name.split(/[^A-Za-z]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');

export const champIconUrl = (c: Champion) => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${ddragonId(c)}.png`;
