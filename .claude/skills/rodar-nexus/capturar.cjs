// Dirige o Nexus num Chromium headless (390×844) do início ao fim de uma partida e salva uma captura por tela.
// Uso: node capturar.cjs <url-base> <pasta-saida> [--imagens-reais]
// Sem --imagens-reais, as imagens do Data Dragon são simuladas (o host costuma estar bloqueado nas sessões na nuvem).
// Sai com código 1 se a página lançar erro ou se algum passo não aparecer.
const { chromium } = require('playwright');

const [base = 'http://localhost:5173/', out = '.', ...flags] = process.argv.slice(2);
const real = flags.includes('--imagens-reais');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (!real) await page.route('https://ddragon.leagueoflegends.com/**', route => {
    const id = route.request().url().split('/').pop().replace('.png', '');
    const hue = [...id].reduce((a, c) => a + c.charCodeAt(0) * 37, 0) % 360;
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>` });
  });
  // sorteios fixos: a mesma sequência de eventos a cada execução, para comparar capturas antes/depois
  await page.addInitScript(() => { let s = 42; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ddragon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const url = h => new URL('#' + h, base).href;
  const shot = async n => { await page.screenshot({ path: `${out}/${n}.png` }); console.log('captura', `${out}/${n}.png`); };

  await page.goto(url('liga')); await page.getByText('CBLOL 2026').first().waitFor(); await page.waitForTimeout(600); await shot('1-liga');
  await page.evaluate(() => scrollTo(0, 700)); await page.waitForTimeout(300); await shot('2-liga-tabela');
  await page.goto(url('elenco')); await page.getByText('Titulares').waitFor(); await page.waitForTimeout(500); await shot('3-elenco');
  await page.locator('.row').first().click(); await page.waitForTimeout(700); await shot('4-ficha');
  await page.keyboard.press('Escape');
  await page.goto(url('partida')); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /1º pick/i }).click();
  await page.getByRole('button', { name: /Iniciar draft/i }).click(); await page.waitForTimeout(2500); await shot('5-draft');
  await page.getByText('Draft completo').waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: /Ir para a partida/i }).click();
  await page.getByRole('button', { name: /Iniciar partida/i }).click(); await page.waitForTimeout(7000); await shot('6-partida');
  await page.evaluate(() => scrollTo(0, 900)); await page.waitForTimeout(300); await shot('7-partida-graficos');
  await page.getByRole('button', { name: /Pular para o fim|Simular até o fim/ }).first().click(); await page.waitForTimeout(2500); await shot('8-resultado');
  await page.goto(url('motor')); await page.waitForTimeout(800); await shot('9-motor');

  await browser.close();
  if (errors.length) { console.error('erros na página:\n' + errors.join('\n')); process.exit(1); }
  console.log('ok: fluxo completo sem erros');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
