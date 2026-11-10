export type Role = 'Top' | 'Jungle' | 'Mid' | 'Adc' | 'Support';
export type Side = 'blue' | 'red';

export interface Champion {
  id: string; name: string; role: Role; secondaryRole: Role; style: string;
  earlyPower: number; lateScaling: number; cc: number; waveclear: number;
  styles: string[]; tags: string[];
}

export interface Hidden { consistency: number; bigGames: number; pressure: number; versatility: number; aggression: number }

export interface SeasonStats { g: number; w: number; k: number; d: number; a: number; nt: number }

export interface Player {
  id: string; nickname: string; realName: string; role: Role; personality: string;
  laning: number; teamfight: number; map: number; mental: number;
  energy: number; stress: number; morale: number; age?: number;
  mastery: Record<string, number>; mechanics: number; farm: number;
  apt: Record<string, number>; tac: Record<string, number>; hid: Hidden;
  season?: SeasonStats;
}

export interface Tactics { shotcaller: string; plan: string; jungle: string; lane: string; lanes: string; mid: string }

export interface Team {
  id: string; name: string; tag: string; status: string; coach: string;
  budget: number; chemistry: number; roster: Player[]; tactics?: Tactics;
}

export interface League { id: string; name: string; season: string; teams: Team[] }

export interface Split {
  id: string; name: string; periodo: string; campeao: string; vice: string; terceiro: string;
  ordem: string[];
  regular: [string, string, string, number, number][];
  playoffs: [string, string, string, string, number, number][];
}
export interface Season { splits: Split[] }
