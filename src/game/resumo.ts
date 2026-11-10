// "Por que vencemos ou perdemos": frases curtas geradas por regras sobre o que a partida já registrou
// (ouro e chance de vitória minuto a minuto, objetivos do log, estresse e encaixe tático). Nada aqui muda a simulação.
import { fmtT, G, teamOf } from './core';
import { num, pct } from './fmt';
import { mvpOf, type Match } from './match';
import { TACT_FIT, TACT_OPTS, tacticsOf } from './tactics';
import type { Side } from './types';

export type Acao = { tipo: 'jogador'; id: string; l: string } | { tipo: 'taticas'; l: string };
export type Frase = { txt: string; acao?: Acao };

const OBJ_NOME: Record<string, string> = { grubs: 'As Larvas', herald: 'O Arauto', dragon: 'O dragão', baron: 'O Barão', elder: 'O Ancião', soul: 'A Alma' };
const tag = (sd: Side) => teamOf(sd).tag;
const min = (t: number) => Math.round(t / 60) + ' min';   // "′" não existe na Barlow e cai numa fonte reserva com espaço estranho

export function resumoPartida(m: Match): { fatos: Frase[]; acao: Frase | null } {
  const win: Side = m.bar > 0 ? 'blue' : 'red', W = tag(win), fatos: Frase[] = [];
  // o último ponto da linha do tempo é o do fim (chance 100% ou 0%); não é um "momento" de verdade
  const tl = m.over ? m.timeline.slice(0, -1) : m.timeline, gdW = (gd: number) => win === 'blue' ? gd : -gd;

  // 1) ouro: vantagem que nunca mais voltou, ou virada
  const i3 = tl.findIndex(p => gdW(p.gd) >= 3000);
  if (i3 >= 0 && tl.slice(i3).every(p => gdW(p.gd) > 0)) fatos.push({ txt: `${W} abriu 3 mil de ouro aos ${min(tl[i3].t)} e não deixou o adversário voltar.` });
  else { const atras = [...tl].reverse().find(p => gdW(p.gd) <= -1000);
    if (atras && atras.t >= 900) fatos.push({ txt: `Virada: ${W} ainda estava ${num(-gdW(atras.gd) / 1000, 1)} mil atrás em ouro aos ${min(atras.t)}.` }); }

  // 2) maior salto da chance de vitória a favor de quem venceu, com o objetivo que saiu naquele minuto
  let best = 0, bi = -1;
  for (let i = 1; i < tl.length; i++) { const d = (tl[i].wp - tl[i - 1].wp) * (win === 'blue' ? 1 : -1); if (d > best) { best = d; bi = i; } }
  if (bi > 0 && best >= 0.12) {
    const t0 = tl[bi - 1].t, t1 = tl[bi].t, a = Math.round(tl[bi - 1].wp * 100), b = Math.round(tl[bi].wp * 100);
    const ev = m.log.find(e => e.obj && OBJ_NOME[e.obj] && e.side && e.t > t0 - 30 && e.t <= t1);
    // o verbo acompanha o tamanho do salto: cruzar os 50% é virada; 25 pontos ou mais muda o jogo; menos que isso só pesa
    const verbo = (a - 50) * (b - 50) < 0 ? 'virou o jogo' : best >= 0.25 ? 'mudou o jogo' : 'pesou';
    fatos.push({ txt: ev ? `${OBJ_NOME[ev.obj!]} de ${tag(ev.side as Side)} aos ${min(ev.t)} ${verbo}: chance de vitória de ${G.user.tag} de ${a}% para ${b}%.`
      : `Aos ${min(t1)} o jogo ${verbo === 'pesou' ? 'pendeu' : verbo.replace(' o jogo', '')}: chance de vitória de ${G.user.tag} de ${a}% para ${b}%.` });
  }

  // 3) dragões
  const dt = m.drakes.blue + m.drakes.red;
  if (m.soul) fatos.push({ txt: `${tag(m.soul)} fechou a Alma do dragão (${m.drakes[m.soul]} de ${dt} dragões).` });
  else if (dt >= 3 && m.drakes[win] / dt >= 0.75) fatos.push({ txt: `${W} pegou ${m.drakes[win]} de ${dt} dragões.` });
  if (!fatos.length) fatos.push({ txt: `Partida equilibrada: ${W} venceu sem abrir vantagem grande em ouro.` });

  // ação (no máximo uma), sempre sobre o time do usuário: estresse alto ou tática que combina pouco com o elenco
  let acao: Frase | null = null;
  const tenso = [...G.user.roster].sort((x, y) => y.stress - x.stress)[0];
  if (tenso && tenso.stress >= 60) acao = { txt: `Estresse alto em ${tenso.nickname} (${tenso.stress}): uma folga antes do próximo jogo ajuda.`, acao: { tipo: 'jogador', id: tenso.id, l: `Ver ${tenso.nickname}` } };
  else {
    const X = tacticsOf(G.user) as unknown as Record<string, string>;
    const ruim = ['plan', 'jungle', 'lanes', 'mid'].map(k => ({ k, v: X[k], f: X[k] !== 'bal' && TACT_FIT[k]?.[X[k]] ? TACT_FIT[k][X[k]](G.user) : 99 })).sort((x, y) => x.f - y.f)[0];
    if (ruim && ruim.f < 76) { const l = TACT_OPTS[ruim.k].o.find(o => o[0] === ruim.v)?.[1] ?? ruim.v;
      acao = { txt: `${TACT_OPTS[ruim.k].t} "${l}" combina pouco com o elenco (encaixe ${Math.round(ruim.f)}).`, acao: { tipo: 'taticas', l: 'Ver táticas' } }; }
  }
  return { fatos: fatos.slice(0, 3), acao };
}

// MVP com o motivo em uma linha: K/D/A, participação nos abates do time e Role Quest
export function motivoMVP(m: Match, side: Side) {
  const v = mvpOf(side), kills = m.kills[side], q = m.quests[v.p.id];
  const partes = [`${v.s.k}/${v.s.d}/${v.s.a}`];
  if (kills) partes.push(`participou de ${pct(Math.min(1, (v.s.k + v.s.a) / kills))} dos abates`);
  if (q?.done && q.at !== null) partes.push(`Role Quest aos ${fmtT(q.at)}`);
  return { ...v, motivo: partes.join(' · ') };
}
