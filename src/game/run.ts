// A run do modo de cartas: uma temporada 2026 do CBLOL com Copa, Etapa 1 e Etapa 2. Cada etapa é todos contra todos em MD1
// (7 rodadas) e mata-mata dos 4 primeiros em MD5. Os jogos entre os outros times são simulados pelo motor, sem transmissão.
// Este arquivo só mexe no estado da run dentro do save; cartas.ts cuida das cartas e liga a run à partida.
import { G, LEAGUE } from './core';
import { autoFinish, ensureFirstSelection, resetDraft, resetSeries, restoreDraftState, snapshotDraftState } from './draft';
import { M, restoreMatch, runToEnd, setupMatch, snapshotMatch } from './match';
import type { Save } from './save';

export const MEU = 'meu';
export const ETAPAS = ['Copa CBLOL', 'Etapa 1', 'Etapa 2'], TORNEIO = ['First Stand', 'MSI', 'Mundial'];
export const RODADAS = 7, PREMIOS = { campeao: 1500, vice: 900, semi: 500, fora: 200 };
export type Resultado = 'campeao' | 'vice' | 'semi' | 'fora';
export const RESULTADO_PT: Record<Resultado, string> = { campeao: 'Campeão', vice: 'Vice-campeão', semi: 'Semifinalista', fora: 'Fora dos playoffs' };
export interface Jogo { a: string; b: string; sa: number; sb: number }   // placar em jogos; -1 = ainda não jogado
export interface RunState {
  n: number; etapa: number; fase: 'escolha' | 'regular' | 'playoffs' | 'fimEtapa' | 'fim';
  opcoes: string[]; efeitos: string[];           // 1 entre 3: o que está em oferta e o que já foi escolhido na run
  rodada: number; jogos: Jogo[][]; semi: Jogo[]; final: Jogo | null;
  entros: number; cinco: string[]; dominio: Record<string, number>;   // entrosamento 0–100, os cinco do último jogo, jogos por tática (até 10)
  hist: { etapa: number; res: Resultado; pos: number; v: number; d: number; premio: number; campeao: string }[];
}
// reforços de 1 entre 3 (pré-temporada e entre as etapas); o efeito de cada um está em cartas.ts (aplicarEscolha)
export const ESCOLHAS: Record<string, { nome: string; ic: string; efeito: string }> = {
  bootcamp: { nome: 'Bootcamp', ic: 'Users', efeito: '+20 de entrosamento agora.' },
  scrims: { nome: 'Scrims', ic: 'Swords', efeito: '+10 de entrosamento e +2 de domínio na tática atual.' },
  analista: { nome: 'Analista de draft', ic: 'ScanEye', efeito: '+4 de domínio na tática atual.' },
  psicologo: { nome: 'Psicólogo', ic: 'Brain', efeito: '−20 de estresse em todas as cartas agora; nesta run, derrotas estressam a metade.' },
  preparador: { nome: 'Preparador físico', ic: 'Dumbbell', efeito: '+30 de energia em todas as cartas agora; nesta run, cada jogo cansa um terço a menos.' },
  patrocinio: { nome: 'Patrocínio', ic: 'Trophy', efeito: '+400 pontos agora.' },
  coach: { nome: 'Treinador de SoloQ', ic: 'Target', efeito: '+20 PdL para os cinco titulares agora.' },
  olheiro: { nome: 'Olheiro', ic: 'Eye', efeito: 'Um pacote de rota grátis (3 cartas) para a rota do seu titular mais fraco.' },
};
const embaralha = <T,>(v: T[]) => { const a = [...v]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const oferta = (r: { efeitos: string[] }) => embaralha(Object.keys(ESCOLHAS).filter(k => !r.efeitos.includes(k) || !['psicologo', 'preparador'].includes(k))).slice(0, 3);
export const timesDaRun = (s: Save) => [MEU, ...LEAGUE.teams.map(t => t.id).filter(id => id !== s.clube.substitui)];
// todos contra todos pelo método do círculo: 7 rodadas de 4 jogos
function calendario(ids: string[]): Jogo[][] {
  const v = embaralha(ids), n = v.length, out: Jogo[][] = [];
  for (let r = 0; r < n - 1; r++) { out.push(Array.from({ length: n / 2 }, (_, i) => ({ a: v[i], b: v[n - 1 - i], sa: -1, sb: -1 }))); v.splice(1, 0, v.pop()!); }
  return out;
}
export function novaRun(s: Save, n: number): RunState {
  const r: RunState = { n, etapa: 0, fase: 'escolha', opcoes: [], efeitos: [], rodada: 0, jogos: calendario(timesDaRun(s)), semi: [], final: null, entros: 30, cinco: [], dominio: {}, hist: [] };
  r.opcoes = oferta(r); return r;
}

// ---------- jogos da IA: resultado pelo motor, sem mexer no que a interface está mostrando ----------
// a vence b? Mesmo caminho da calibração (draft automático + partida até o fim), preservando time do usuário, draft, série e partida.
export function simJogo(a: string, b: string): boolean {
  const u = G.userId, o = G.oppId, d = snapshotDraftState(), m = snapshotMatch();
  G.userId = a; G.oppId = b; resetSeries(1, false); ensureFirstSelection(); resetDraft(); autoFinish(false); setupMatch(); runToEnd(() => {});
  const venceu = M!.bar > 0; restoreMatch(m); restoreDraftState(d); G.userId = u; G.oppId = o; return venceu;
}
export function simSerie(j: Jogo, bo: number) { const alvo = (bo + 1) / 2; j.sa = 0; j.sb = 0; while (j.sa < alvo && j.sb < alvo) { if (simJogo(j.a, j.b)) j.sa++; else j.sb++; } }
const vencedor = (j: Jogo) => j.sa > j.sb ? j.a : j.b, perdedor = (j: Jogo) => j.sa > j.sb ? j.b : j.a;

// ---------- tabela e próximo jogo ----------
export interface Linha { id: string; v: number; d: number }
// classificação da fase regular: vitórias; no empate, confronto direto; depois, a ordem do sorteio do calendário
export function tabela(s: Save): Linha[] {
  const r = s.run!, ids = timesDaRun(s), m: Record<string, Linha> = Object.fromEntries(ids.map(id => [id, { id, v: 0, d: 0 }]));
  const jog = r.jogos.flat().filter(j => j.sa >= 0); jog.forEach(j => { m[vencedor(j)].v++; m[perdedor(j)].d++; });
  const direto = (x: string, y: string) => { const j = jog.find(k => (k.a === x && k.b === y) || (k.a === y && k.b === x)); return j ? (vencedor(j) === x ? -1 : 1) : 0; };
  return ids.map(id => m[id]).sort((x, y) => y.v - x.v || direto(x.id, y.id));
}
export const jogoDaRodada = (r: RunState) => r.jogos[r.rodada]?.find(j => j.a === MEU || j.b === MEU) ?? null;
// o jogo que o clube tem pela frente: adversário, formato e nome (null fora das fases de jogo)
export function jogoAtual(s: Save): { adv: string; bo: number; rotulo: string } | null {
  const r = s.run; if (!r) return null; const outro = (j: Jogo) => j.a === MEU ? j.b : j.a;
  if (r.fase === 'regular') { const j = jogoDaRodada(r); return j ? { adv: outro(j), bo: 1, rotulo: `${ETAPAS[r.etapa]} · Rodada ${r.rodada + 1} de ${RODADAS}` } : null; }
  if (r.fase === 'playoffs') { if (r.final) return { adv: outro(r.final), bo: 5, rotulo: `${ETAPAS[r.etapa]} · Final` }; const j = r.semi.find(x => x.a === MEU || x.b === MEU); return j ? { adv: outro(j), bo: 5, rotulo: `${ETAPAS[r.etapa]} · Semifinal` } : null; }
  return null;
}

// ---------- andamento ----------
function fecharEtapa(s: Save, res: Resultado, pos: number) {
  const r = s.run!, t = tabela(s).find(l => l.id === MEU)!, premio = PREMIOS[res], campeao = vencedor(r.final!);
  r.hist.push({ etapa: r.etapa, res, pos, v: t.v, d: t.d, premio, campeao }); s.pontos += premio; r.fase = 'fimEtapa';
  // vaga no torneio internacional (jogado na etapa 5): campeão da Copa e da Etapa 1; campeão e vice da Etapa 2. A vaga libera regiões na loja.
  if (res === 'campeao') s.recordes.titulos++;
  if (res === 'campeao' || (r.etapa === 2 && res === 'vice')) { const tn = TORNEIO[r.etapa]; if (!s.recordes.vagas.includes(tn)) s.recordes.vagas.push(tn);
    (r.etapa === 2 ? ['LCK', 'LPL'] : ['LCS', 'LEC', 'LCP']).forEach(l => { if (!s.regioes.includes(l)) s.regioes.push(l); }); }
}
// registra a série que o clube acabou de jogar (eu × ele em jogos) e simula o resto da rodada ou da chave
export function registrarSerie(s: Save, eu: number, ele: number) {
  const r = s.run; if (!r) return; const grava = (j: Jogo) => { [j.sa, j.sb] = j.a === MEU ? [eu, ele] : [ele, eu]; };
  if (r.fase === 'regular') {
    const meu = jogoDaRodada(r); if (!meu) return; grava(meu); r.jogos[r.rodada].filter(j => j !== meu).forEach(j => simSerie(j, 1)); r.rodada++;
    if (r.rodada < RODADAS) return;
    const t = tabela(s).map(l => l.id), pos = t.indexOf(MEU) + 1; r.semi = [{ a: t[0], b: t[3], sa: -1, sb: -1 }, { a: t[1], b: t[2], sa: -1, sb: -1 }];
    if (pos <= 4) { r.fase = 'playoffs'; r.semi.filter(j => j.a !== MEU && j.b !== MEU).forEach(j => simSerie(j, 5)); return; }
    r.semi.forEach(j => simSerie(j, 5)); r.final = { a: vencedor(r.semi[0]), b: vencedor(r.semi[1]), sa: -1, sb: -1 }; simSerie(r.final, 5); fecharEtapa(s, 'fora', pos); return;
  }
  if (r.fase !== 'playoffs') return; const pos = tabela(s).findIndex(l => l.id === MEU) + 1;
  if (r.final) { grava(r.final); fecharEtapa(s, eu > ele ? 'campeao' : 'vice', pos); return; }
  const minha = r.semi.find(j => j.a === MEU || j.b === MEU)!; grava(minha);
  r.final = { a: vencedor(r.semi[0]), b: vencedor(r.semi[1]), sa: -1, sb: -1 };
  if (eu < ele) { simSerie(r.final, 5); fecharEtapa(s, 'semi', pos); }
}
export function escolher(s: Save, id: string) { const r = s.run!; if (r.fase !== 'escolha' || !r.opcoes.includes(id)) return false; r.efeitos.push(id); r.opcoes = []; r.fase = 'regular'; return true; }
// depois do resumo da etapa: próxima etapa (com nova escolha) ou fim da run; depois do fim da run: a próxima run
export function seguir(s: Save) {
  const r = s.run!;
  if (r.fase === 'fimEtapa') { if (r.etapa >= 2) { r.fase = 'fim'; s.runs++; return; }
    r.etapa++; r.rodada = 0; r.jogos = calendario(timesDaRun(s)); r.semi = []; r.final = null; r.fase = 'escolha'; r.opcoes = oferta(r); return; }
  if (r.fase === 'fim') s.run = novaRun(s, r.n + 1);
}
