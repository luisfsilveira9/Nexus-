// Modo de cartas: coleção de jogadores reais em elos (Ferro → Desafiante), PdL, pacotes e o time montado a partir das cartas.
// O motor e o draft não mudam: montarTime() entrega um Team comum, com id "meu".
import { clamp, emit, G, LEAGUE, pOvr, ROLES, setTeam, subscribe, tById } from './core';
import { draft, series } from './draft';
import { M } from './match';
import { loadMundo, type Mundo, type WorldPlayer } from './mundo';
import { gravar, ler, pedirPersistencia, SAVE_V, type Owned, type Save } from './save';
import { escolher, jogoAtual, MEU, novaRun, registrarSerie, seguir } from './run';
import { applyTeams, endHooks } from './session';
import { tacticsOf } from './tactics';
import type { Role, Team } from './types';

export { MEU };
export const ELOS = ['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Mestre', 'Grão-Mestre', 'Desafiante'];
// PdL por partida: base da vitória ou da derrota + pdlNota por ponto de nota acima (ou abaixo) da média dos cinco titulares, no mínimo pdlMin;
// o melhor do time na vitória leva pdlMvp a mais. Comparar com o próprio time separa quem jogou bem de quem jogou mal mesmo numa derrota feia.
export const REGRAS = { porElo: 1.2, pdlElo: 100, pdlVit: 15, pdlDer: 6, pdlNota: 3, pdlMin: 1, pdlMvp: 5, pdlRep: 50, ptsVit: 250, ptsDer: 150, ptsInicio: 500,
  raridade: 0.9, descansoBanco: 20, descansoSerie: 30, maxReservas: 3, entrosJogo: 4, entrosTroca: 8, entrosOrg: 5, entrosMax: 1, dominioMax: 0.8 };
// Do OVR real (pesquisa, Chovy 96) para o nível que o motor usa. O ajuste dos 28 times ao Elo real (etapa 2) mostrou que o motor
// separa os times mais do que 22 Elo por ponto quando eles estão longe: reta ajustada aos deslocamentos, erro de ~1,2 ponto.
export const nivel = (ovr: number) => ovr + 1.5 - 0.25 * Math.max(0, ovr - 59);
const delta = (ovr: number, elo: number) => nivel(ovr) - ovr - (9 - elo) * REGRAS.porElo;

export interface Ganho { k: string; nova: boolean; pdl: number; de: number; para: number; nota?: number; mvp?: boolean }   // de/para: elo antes e depois; nota e mvp só no fim de partida
export interface Recompensa { venceu: boolean; pontos: number; ganhos: Ganho[]; fimSerie: boolean }
export const C = { save: null as Save | null, mundo: null as Mundo | null, ultima: null as Recompensa | null, falhaSave: false };

// ---------- cartas ----------
export const jogador = (k: string) => C.mundo!.porChave[k];
export const cartaDe = (k: string) => C.save?.cartas.find(c => c.k === k);
// jogador no nível da carta (elo 9 = nível cheio)
export const noElo = (k: string, elo: number, id = k): WorldPlayer => C.mundo!.montar(k, id, delta(jogador(k).ovr, elo));
const ovrCache: Record<string, number> = {};
export const cartaOvr = (k: string, elo: number) => ovrCache[k + elo] ??= pOvr(noElo(k, elo));
export const ehTitular = (k: string) => !!C.save && Object.values(C.save.tit).includes(k);
// PdL: a partir do Mestre os ganhos valem a metade; a cada 100 a carta sobe um elo; no Desafiante não há mais o que ganhar
function addPdl(o: Owned, n: number): Ganho {
  const de = o.elo; let ganho = 0;
  if (o.elo < 9) { ganho = o.elo >= 7 ? Math.ceil(n / 2) : n; o.pdl += ganho; while (o.pdl >= REGRAS.pdlElo && o.elo < 9) { o.pdl -= REGRAS.pdlElo; o.elo++; } if (o.elo === 9) o.pdl = 0; }
  return { k: o.k, nova: false, pdl: ganho, de, para: o.elo };
}
// carta nova entra em Ferro; repetida vira PdL na que você já tem
function ganharCarta(k: string): Ganho {
  const o = cartaDe(k); if (o) return addPdl(o, REGRAS.pdlRep);
  C.save!.cartas.push({ k, elo: 0, pdl: 0, en: 95, st: 22, mo: 80 }); return { k, nova: true, pdl: 0, de: 0, para: 0 };
}

// ---------- time ----------
const rosterDe = () => tById(MEU)?.roster ?? [];
// leva energia, estresse, moral e temporada dos titulares em campo para as cartas (a partida mexe nos jogadores do time)
function recolher() { const s = C.save; if (!s) return; rosterDe().forEach(p => { const o = cartaDe((p as WorldPlayer).chave); if (o) { o.en = p.energy; o.st = p.stress; o.mo = p.morale; o.s = p.season; } }); const t = tById(MEU); if (t?.tactics) s.tatica = t.tactics; }
// ---------- entrosamento e domínio da tática (só existem dentro da run) ----------
// entrosamento efetivo: o da run + bônus pelo maior grupo de titulares do mesmo time real
export function entrosamento() { const s = C.save!, n: Record<string, number> = {}; ROLES.forEach(r => { const t = jogador(s.tit[r]).time; n[t] = (n[t] || 0) + 1; });
  return clamp((s.run?.entros ?? 50) + REGRAS.entrosOrg * (Math.max(...Object.values(n)) - 1), 0, 100); }
export const chaveTatica = (t: Team) => { const X = tacticsOf(t); return [X.plan, X.jungle, X.lanes, X.mid].join('|'); };
export const dominio = () => { const t = tById(MEU); return t ? C.save?.run?.dominio[chaveTatica(t)] ?? 0 : 0; };
// pontos somados às rolagens do time: entrosamento 50 = neutro (de −1 a +1) e até +0,8 com a tática dominada (10 jogos)
export const bonusEntros = () => C.save?.run ? (entrosamento() - 50) / 50 * REGRAS.entrosMax : 0;
export const bonusDominio = () => REGRAS.dominioMax * dominio() / 10;
export function montarTime(): Team {
  const s = C.save!, roster = ROLES.map(r => { const o = cartaDe(s.tit[r])!, p = noElo(o.k, o.elo, `${MEU}_${r}`); p.energy = o.en; p.stress = o.st; p.morale = o.mo; p.season = o.s; return p; });
  const t: Team = { id: MEU, name: s.clube.nome, tag: s.clube.tag, status: 'Seu clube', coach: '', budget: 0, chemistry: 80, roster, hue: s.clube.hue, get bonus() { return bonusEntros() + bonusDominio(); } };
  if (s.tatica && roster.some(p => p.id === s.tatica!.shotcaller)) t.tactics = s.tatica;
  setTeam(t); return t;
}
export const adversarios = () => LEAGUE.teams.filter(t => t.id !== C.save?.clube.substitui);
// só dá para mexer na escalação antes do draft começar ou depois do fim da partida (os picks já foram feitos para quem está em campo)
export const podeEscalar = () => M ? M.over : draft.step === 0;
// no meio de uma série (entre os jogos de uma MD5) só entram as reservas
export const emSerie = () => !!series && !series.over && series.wins.blue + series.wins.red > 0;
export const ehReserva = (k: string) => !!C.save?.reservas.includes(k);
export const podeEntrar = (k: string) => podeEscalar() && (!emSerie() || ehReserva(k));
// põe a carta como titular da rota dela (quem sai fica com a vaga de reserva, se ela era reserva); devolve a função que desfaz
export function escalar(k: string): (() => void) | null {
  const s = C.save!, r = jogador(k).role, antes = s.tit[r]; if (!cartaDe(k) || antes === k || !podeEntrar(k)) return null;
  const troca = (entra: string, sai: string) => { recolher(); s.tit[r] = entra; const i = s.reservas.indexOf(entra); if (i >= 0) s.reservas[i] = sai; montarTime(); salvar(); emit(); };
  troca(k, antes); return () => troca(antes, k);
}
// marca ou desmarca uma carta como reserva (até 3, nunca um titular); devolve se mudou
export function reservar(k: string): boolean {
  const s = C.save!, i = s.reservas.indexOf(k); if (emSerie() || !podeEscalar()) return false;
  if (i >= 0) s.reservas.splice(i, 1); else if (!ehTitular(k) && s.reservas.length < REGRAS.maxReservas) s.reservas.push(k); else return false;
  salvar(); emit(); return true;
}

// ---------- save ----------
export function salvar() { const s = C.save; if (!s) return; C.falhaSave = !gravar(s); }
let pend: ReturnType<typeof setTimeout> | 0 = 0;
subscribe(() => { if (G.modo !== 'cartas' || !C.save || pend) return; pend = setTimeout(() => { pend = 0; if (G.modo === 'cartas' && C.save) { recolher(); salvar(); } }, 800); });
export const temSave = () => ler();
// os adversários não têm gestão de elenco no modo de cartas: voltam à condição de fábrica antes de cada jogo
// (a partida cansa os dois times; sem isto, os times da liga iam ficando exaustos ao longo da run)
const condBase: Record<string, [number, number]> = {};
function descansarLiga() { LEAGUE.teams.forEach(t => t.roster.forEach(p => { const b = condBase[p.id] ??= [p.energy, p.stress]; [p.energy, p.stress] = b; })); }
// aponta a aba Partida para o jogo que a run tem pela frente (fora das fases de jogo fica um adversário qualquer, sem partida)
function prepararJogo() { descansarLiga(); const j = jogoAtual(C.save!); G.userId = MEU; G.oppId = j?.adv ?? adversarios()[0].id; applyTeams(j?.bo ?? 1, true); }
export const temJogo = () => !!C.save && !!jogoAtual(C.save);
function entrar(s: Save) { C.save = s; C.ultima = null; s.run ??= novaRun(s, s.runs + 1); s.reservas = s.reservas.filter(k => s.cartas.some(c => c.k === k) && !Object.values(s.tit).includes(k)); montarTime(); G.modo = 'cartas'; prepararJogo(); emit(); }
// continua o save do aparelho (ou um importado); false se não há save válido
export async function continuar(importado?: Save): Promise<boolean> { C.mundo = await loadMundo(); const s = importado ?? ler(); if (!s || !ROLES.every(r => s.cartas.some(c => c.k === s.tit[r]) && C.mundo!.porChave[s.tit[r]])) return false; s.cartas = s.cartas.filter(c => C.mundo!.porChave[c.k]); entrar(s); salvar(); return true; }
export const prepararMundo = async () => { C.mundo = await loadMundo(); };
// pacote inicial: uma carta por rota, sorteada na metade de baixo do CBLOL (por OVR real)
export function fundar(clube: Save['clube']): Ganho[] {
  const tit = {} as Record<Role, string>;
  ROLES.forEach(r => { const v = C.mundo!.jogadores.filter(p => p.liga === 'CBLOL' && p.role === r).sort((a, b) => a.ovr - b.ovr); tit[r] = v[Math.floor(Math.random() * Math.floor(v.length / 2))].chave; });
  const s: Save = { v: SAVE_V, criadoEm: Date.now(), salvoEm: 0, clube, cartas: [], tit, pontos: REGRAS.ptsInicio, vit: 0, der: 0, pacotes: 0, regioes: ['CBLOL'], reservas: [], run: null, runs: 0, recordes: { titulos: 0, vagas: [], melhor: '' } };
  C.save = s; const g = ROLES.map(r => ganharCarta(tit[r])); pedirPersistencia(); salvar(); return g;
}
// depois de revelar o pacote inicial: entra no modo de cartas com o clube recém-fundado
export function abrirClube() { if (C.save) entrar(C.save); }
export function sair() { if (G.modo === 'cartas') { recolher(); salvar(); } G.modo = 'inicio'; G.userId = 'furia'; G.oppId = 'loud'; applyTeams(3, true); emit(); }
export function entrarClassico() { G.modo = 'classico'; G.userId = 'furia'; G.oppId = 'loud'; applyTeams(3, true); emit(); }

// ---------- pacotes ----------
export type TipoPacote = 'basico' | 'rota' | 'regiao';
export const PACOTES: Record<TipoPacote, { nome: string; preco: number; n: number; desc: string }> = {
  basico: { nome: 'Pacote básico', preco: 500, n: 3, desc: '3 cartas de qualquer rota, das regiões que você já liberou.' },
  rota: { nome: 'Pacote de rota', preco: 700, n: 3, desc: '3 cartas da rota que você escolher.' },
  regiao: { nome: 'Pacote de região', preco: 700, n: 3, desc: '3 cartas da região que você escolher.' },
};
// chance de cada jogador numa carta do pacote: peso 0,9^(OVR real − 50), entre os que o pacote aceita
export function chances(tipo: TipoPacote, alvo?: string): { p: WorldPlayer; chance: number }[] {
  const s = C.save!, v = C.mundo!.jogadores.filter(p => s.regioes.includes(p.liga) && (tipo !== 'rota' || p.role === alvo) && (tipo !== 'regiao' || p.liga === alvo));
  const w = v.map(p => REGRAS.raridade ** (p.ovr - 50)), tot = w.reduce((a, b) => a + b, 0);
  return v.map((p, i) => ({ p, chance: w[i] / tot })).sort((a, b) => b.chance - a.chance);
}
export function abrirPacote(tipo: TipoPacote, alvo?: string, gratis = false): Ganho[] | null {
  const s = C.save!, pk = PACOTES[tipo], ch = chances(tipo, alvo); if ((!gratis && s.pontos < pk.preco) || !ch.length) return null;
  if (!gratis) s.pontos -= pk.preco; s.pacotes++; recolher();
  const g = Array.from({ length: pk.n }, () => { let x = Math.random(); const c = ch.find(e => (x -= e.chance) <= 0) ?? ch[ch.length - 1]; return ganharCarta(c.p.chave); });
  montarTime(); salvar(); emit(); return g;
}

// ---------- a run: escolhas, andamento e fim de partida ----------
// aplica o reforço escolhido (1 entre 3); o Olheiro devolve as cartas do pacote para revelar
export function aplicarEscolha(id: string): Ganho[] | null {
  const s = C.save!, r = s.run!; if (!escolher(s, id)) return null; recolher(); let g: Ganho[] | null = null;
  const dom = (n: number) => { const k = chaveTatica(tById(MEU)); r.dominio[k] = Math.min(10, (r.dominio[k] || 0) + n); };
  if (id === 'bootcamp') r.entros = clamp(r.entros + 20, 0, 100);
  if (id === 'scrims') { r.entros = clamp(r.entros + 10, 0, 100); dom(2); }
  if (id === 'analista') dom(4);
  if (id === 'psicologo') s.cartas.forEach(o => { o.st = clamp(o.st - 20, 0, 100); });
  if (id === 'preparador') s.cartas.forEach(o => { o.en = clamp(o.en + 30, 0, 100); });
  if (id === 'patrocinio') s.pontos += 400;
  if (id === 'coach') ROLES.forEach(x => addPdl(cartaDe(s.tit[x])!, 20));
  if (id === 'olheiro') { const fraca = ROLES.map(x => cartaDe(s.tit[x])!).sort((a, b) => cartaOvr(a.k, a.elo) - cartaOvr(b.k, b.elo))[0]; g = abrirPacote('rota', jogador(fraca.k).role, true); }
  montarTime(); prepararJogo(); salvar(); emit(); return g;
}
// "Continuar" depois do resumo da etapa ou da run; a run nova recomeça a condição das cartas
export function seguirRun() { const s = C.save!, fim = s.run!.fase === 'fim'; recolher(); seguir(s);
  if (fim) { s.cartas.forEach(o => { o.en = 95; o.st = 22; }); s.reservas = s.reservas.filter(k => !ehTitular(k)); }
  montarTime(); prepararJogo(); salvar(); emit(); }
// desistir da run em andamento: os prêmios das etapas já fechadas ficam; começa a próxima
export function abandonarRun() { const s = C.save!; recolher(); s.runs++; s.run = novaRun(s, s.run!.n + 1); s.cartas.forEach(o => { o.en = 95; o.st = 22; }); montarTime(); prepararJogo(); salvar(); emit(); }
// depois de uma série encerrada: prepara o próximo jogo do calendário
export function aposSerie() { prepararJogo(); emit(); }

// fim de partida: pontos, PdL pela nota de cada titular (o melhor do time na vitória leva um bônus), entrosamento, domínio e descanso
endHooks.push(venceu => {
  const s = C.save, m = M; if (G.modo !== 'cartas' || !s || !s.run || !m || G.userId !== MEU) return;
  recolher(); const r = s.run, tit = ROLES.map(x => s.tit[x]), nota = (x: Role) => m.stats[`${MEU}_${x}`]?.nota ?? 6.5;
  const melhor = venceu ? [...ROLES].sort((a, b) => nota(b) - nota(a))[0] : null, media = ROLES.reduce((a, x) => a + nota(x), 0) / 5;
  const ganhos = ROLES.map(x => { const n = nota(x), mvp = x === melhor, base = (venceu ? REGRAS.pdlVit : REGRAS.pdlDer) + Math.round(REGRAS.pdlNota * (n - media)) + (mvp ? REGRAS.pdlMvp : 0);
    return { ...addPdl(cartaDe(s.tit[x])!, Math.max(REGRAS.pdlMin, base)), nota: n, mvp }; });
  const pontos = venceu ? REGRAS.ptsVit : REGRAS.ptsDer; s.pontos += pontos; if (venceu) s.vit++; else s.der++;
  // entrosamento: sobe com os mesmos cinco, cai a cada titular trocado; domínio: +1 por jogo com a mesma tática (até 10)
  const trocados = r.cinco.length ? tit.filter(k => !r.cinco.includes(k)).length : 0; r.entros = clamp(r.entros - REGRAS.entrosTroca * trocados + REGRAS.entrosJogo, 0, 100); r.cinco = tit;
  const kt = chaveTatica(tById(MEU)); r.dominio[kt] = Math.min(10, (r.dominio[kt] || 0) + 1);
  const prep = r.efeitos.includes('preparador'), psi = r.efeitos.includes('psicologo');
  s.cartas.forEach(o => { const t = ehTitular(o.k), d = (t ? 0 : REGRAS.descansoBanco) + (series.over ? REGRAS.descansoSerie : 0) + (t && prep ? 4 : 0);
    o.en = clamp(o.en + d, 0, 100); o.st = clamp(o.st - d / 2 - (t && psi && !venceu ? 4 : 0), 0, 100); });
  descansarLiga(); if (series.over) registrarSerie(s, series.wins.blue, series.wins.red);
  C.ultima = { venceu, pontos, ganhos, fimSerie: series.over };
  // o time em campo acompanha as cartas (descanso e promoção) sem trocar os objetos que a partida encerrada ainda mostra
  const novo = ROLES.map(x => { const o = cartaDe(s.tit[x])!; return noElo(o.k, o.elo, `${MEU}_${x}`); });
  rosterDe().forEach((p, i) => { const o = cartaDe((p as WorldPlayer).chave)!; Object.assign(p, novo[i], { energy: o.en, stress: o.st, morale: o.mo, season: o.s }); });
  salvar();
});
