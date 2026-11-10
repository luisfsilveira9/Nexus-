// Roda a calibração do motor (src/game/calibrate.ts) no app servido pelo Vite e compara cada métrica com a faixa-alvo de 2026.
// Uso: node calibrar.cjs <url-base> [partidas=500] [timeA,timeB]
// Sai com código 1 se alguma métrica ficar fora da faixa.
const { chromium } = require('playwright');

const [base = 'http://localhost:5173/', n = '500', pair] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('https://ddragon.leagueoflegends.com/**', r => r.fulfill({ status: 404, body: '' }));
  await page.goto(new URL('#motor', base).href);
  await page.getByText('CBLOL 2026').first().waitFor();
  const res = await page.evaluate(async ([n, pair]) => {
    const { runCalibration, TARGETS } = await import('/src/game/calibrate.ts');
    const r = runCalibration(n, pair ? pair.split(',') : undefined);
    return { n: r.n, extra: { ftTime: r.values.ftTime, favWin: r.values.favWin },
      rows: TARGETS.map(t => ({ ...t, v: r.values[t.key], ok: r.values[t.key] >= t.lo && r.values[t.key] <= t.hi })) };
  }, [Number(n), pair]);
  await browser.close();

  const f = v => v.toFixed(1).replace('.', ',');
  console.log(`Calibração com ${res.n} partidas${pair ? ` (${pair})` : ' (pares aleatórios)'}\n`);
  for (const r of res.rows) console.log(`${r.ok ? '✓' : '✗'} ${r.label.padEnd(34)} ${f(r.v).padStart(6)} ${r.unit.padEnd(3)} alvo ${f(r.lo)}–${f(r.hi)}  (${r.src})`);
  console.log(`\n  1ª torre em média aos ${f(res.extra.ftTime)} min · favorito (OVR maior) vence ${f(res.extra.favWin)}%`);
  const bad = res.rows.filter(r => !r.ok);
  console.log(`\n${res.rows.length - bad.length} de ${res.rows.length} métricas dentro do alvo`);
  if (bad.length) process.exit(1);
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
