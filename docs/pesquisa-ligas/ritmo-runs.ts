// Uso: npx tsx docs/pesquisa-ligas/ritmo-runs.ts [contas=20] [runs=8]
// Modelo de ritmo com o jogo de verdade: um jogador automático funda um clube e joga runs inteiras (motor, PdL, pontos, pacotes, escolhas).
// Política: abre pacote básico sempre que pode, escala a melhor carta de cada rota e escolhe um reforço ao acaso.
// Meta combinada: a primeira vaga internacional (título da Copa ou da Etapa 1, ou final da Etapa 2) deve cair entre a 3ª e a 5ª run.
import { ROLES, teamOvr, tById } from '../../src/game/core';
import { autoFinish, draft, ensureFirstSelection, series } from '../../src/game/draft';
import * as K from '../../src/game/cartas';
import { MEU, PREMIOS } from '../../src/game/run';
import { nextSeriesGame, skipSim } from '../../src/game/session';
const CONTAS = +(process.argv[2] || 20), RUNS = +(process.argv[3] || 8);
// para testar outros valores sem editar o jogo: REGRAS='{"pdlRep":20}' PREMIOS='{"campeao":800}' PRECO=600 npx tsx ...
Object.assign(K.REGRAS, JSON.parse(process.env.REGRAS || '{}')); Object.assign(PREMIOS, JSON.parse(process.env.PREMIOS || '{}')); if (process.env.PRECO) K.PACOTES.basico.preco = +process.env.PRECO;
await K.prepararMundo();
const melhorTime = () => { const s = K.C.save!; if (!K.podeEscalar() || K.emSerie()) return; ROLES.forEach(r => { const b = s.cartas.filter(c => K.jogador(c.k).role === r).sort((x, y) => K.cartaOvr(y.k, y.elo) - K.cartaOvr(x.k, x.elo))[0]; if (b.k !== s.tit[r]) K.escalar(b.k); }); };
const res: { vaga: number; titulo: number; ovr: number[]; vit: number[]; cartas: number[]; pac: number[] }[] = [];
for (let c = 0; c < CONTAS; c++) {
  K.fundar({ nome: 'Bot', tag: 'BOT', hue: 0, substitui: ['leviatan', 'pain', 'fluxo', 'vks'][c % 4] }); K.abrirClube();
  const s = K.C.save!, R = { vaga: 0, titulo: 0, ovr: [] as number[], vit: [] as number[], cartas: [] as number[], pac: [] as number[] }; let guarda = 0;
  while (s.run!.n <= RUNS && guarda++ < 5000) {
    const r = s.run!, n = r.n;
    if (r.fase === 'escolha') { K.aplicarEscolha(r.opcoes[Math.floor(Math.random() * r.opcoes.length)]); continue; }
    if (r.fase === 'fimEtapa' || r.fase === 'fim') {
      if (!R.vaga && s.recordes.vagas.length) R.vaga = n; if (!R.titulo && s.recordes.titulos) R.titulo = n;
      if (r.fase === 'fim') { R.ovr[n - 1] = teamOvr(tById(MEU)); R.vit[n - 1] = r.hist.reduce((a, h) => a + h.v, 0); R.cartas[n - 1] = s.cartas.length; R.pac[n - 1] = s.pacotes; }
      K.seguirRun(); continue; }
    while (s.pontos >= K.PACOTES.basico.preco) K.abrirPacote('basico');
    melhorTime(); if (!draft.done) { ensureFirstSelection(); autoFinish(false); } skipSim();
    if (series.over) K.aposSerie(); else nextSeriesGame();
  }
  if (guarda >= 5000) throw new Error('run travou: ' + JSON.stringify({ fase: s.run!.fase, etapa: s.run!.etapa, rodada: s.run!.rodada }));
  res.push(R); console.log(`conta ${c + 1}: 1ª vaga na run ${R.vaga || '—'} · 1º título na run ${R.titulo || '—'} · OVR por run ${R.ovr.join(' ')} · vitórias na fase regular ${R.vit.join(' ')} · cartas ${R.cartas.join(' ')}`);
}
const med = (v: number[]) => { const a = v.filter(x => x > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }, avg = (v: number[]) => (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
console.log(`\n1ª vaga internacional: mediana run ${med(res.map(r => r.vaga))} · até a 2ª ${res.filter(r => r.vaga && r.vaga <= 2).length} · na 3ª a 5ª ${res.filter(r => r.vaga >= 3 && r.vaga <= 5).length} · depois ${res.filter(r => r.vaga > 5).length} · nunca em ${RUNS} runs ${res.filter(r => !r.vaga).length} (de ${CONTAS})`);
for (let i = 0; i < RUNS; i++) console.log(`run ${i + 1}: OVR ${avg(res.map(r => r.ovr[i]))} · vitórias em 21 ${avg(res.map(r => r.vit[i]))} · cartas ${avg(res.map(r => r.cartas[i]))} · pacotes ${avg(res.map(r => r.pac[i]))}`);
process.exit(0);
