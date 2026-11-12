// Teste de ponta a ponta do Nexus: usa o jogo como um jogador no celular e confere fluxo, seleção e layout.
// Uso: node e2e/e2e.cjs [pasta-das-capturas] [--url http://localhost:5173/] [--so 360x640]
// Sem --url, sobe o Vite sozinho numa porta livre. Sai com código 1 se alguma verificação falhar.
// "FALHA" é defeito de fluxo ou layout quebrado; "aviso" é algo para olhar (texto com reticências, alvo de toque pequeno).
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
let base = opt('--url'); const so = opt('--so'), out = args[0] || path.join(require('node:os').tmpdir(), 'nexus-e2e');
const SIZES = (so ? [so] : ['360x640', '360x700']).map(s => s.split('x').map(Number));
fs.mkdirSync(out, { recursive: true });

const fails = [], warns = []; let nOk = 0, tag = '';
const ok = (nome, cond, det = '') => { if (cond) { nOk++; return true; } fails.push(`[${tag}] ${nome}${det ? ' — ' + det : ''}`); console.log(`  FALHA: ${nome}${det ? ' — ' + det : ''}`); return false; };
const warn = (nome, det) => { const w = `[${tag}] ${nome}: ${det}`; if (!warns.includes(w)) warns.push(w); };

async function run(w, h) {
  tag = `${w}x${h}`; console.log(`\n== ${tag} ==`);
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage();
  await page.route('https://ddragon.leagueoflegends.com/**', r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="rgb(50,70,90)"/></svg>' }));
  await page.addInitScript(() => { let s = 42; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ddragon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const btn = (name, o = {}) => page.getByRole('button', { name, ...o });
  const tab = n => page.locator('.tabbar').getByRole('button', { name: n, exact: true }).click();
  const txt = async sel => ((await page.locator(sel).first().textContent()) || '').trim();
  const sheet = page.locator('.sheet');
  const sheetTop = () => sheet.evaluate(e => e.scrollTop);
  const closeSheet = async () => { if (await sheet.count()) await page.keyboard.press('Escape'); };
  let nShot = 0;
  // auditoria de layout da tela atual: rolagem lateral, elementos para fora, conteúdo preso atrás das barras fixas, texto cortado, alvos pequenos
  const layout = async nome => {
    await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${tag}-${String(++nShot).padStart(2, '0')}-${nome}.png` });
    const r = await page.evaluate(() => {
      const vis = e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const lbl = e => (e.getAttribute('aria-label') || e.textContent || e.className || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 32);
      const root = document.querySelector('.sheet') || document.body;
      const scrollsX = e => { for (let p = e.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return true; } return false; };
      const fora = [...root.querySelectorAll('*')].filter(e => vis(e) && !scrollsX(e)).filter(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; }).map(lbl);
      const cortado = [...root.querySelectorAll('b, small, span, h2, h3, p, button')].filter(e => vis(e) && e.children.length === 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(lbl);
      const pequeno = [...root.querySelectorAll('button:not(:disabled), [role=button], a[href], input, textarea')].filter(vis).filter(e => { const b = e.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5; }).map(e => `${lbl(e)} (${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)})`);
      // botões cobertos por outra coisa no ponto central (sobreposição)
      const coberto = [...root.querySelectorAll('button:not(:disabled)')].filter(vis).filter(e => { const b = e.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return false; const t = document.elementFromPoint(x, y); if (!t || e.contains(t) || t.contains(e)) return false; for (let p = t; p; p = p.parentElement) if (['fixed', 'sticky'].includes(getComputedStyle(p).position)) return false; return true; }).map(lbl);   // barras fixas por cima de conteúdo rolável não contam
      return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, fora: [...new Set(fora)].slice(0, 6), cortado: [...new Set(cortado)].slice(0, 8), pequeno: [...new Set(pequeno)].slice(0, 8), coberto: [...new Set(coberto)].slice(0, 6) };
    });
    ok(`${nome}: sem rolagem lateral`, !r.hscroll); ok(`${nome}: nada para fora da tela`, !r.fora.length, r.fora.join(' | '));
    if (r.coberto.length) warn(`${nome}: botão coberto`, r.coberto.join(' | '));
    if (r.cortado.length) warn(`${nome}: texto cortado`, r.cortado.join(' | '));
    if (r.pequeno.length) warn(`${nome}: alvo de toque menor que 44 px`, r.pequeno.join(' | '));
    if (!(await sheet.count())) { // o fim do conteúdo precisa ficar acima das barras fixas
      const livre = await page.evaluate(async () => { const y0 = scrollY, de = document.documentElement; for (let i = 0; i < 3; i++) { de.scrollTop = de.scrollHeight; await new Promise(r => setTimeout(r, 60)); }   // o Chromium às vezes ignora a primeira rolagem logo depois de recarregar
        const els = [...document.querySelectorAll('.view > *')].filter(e => e.getBoundingClientRect().height > 0 && !['fixed', 'sticky'].includes(getComputedStyle(e).position) && !e.classList.contains('actionbar'));
        const fim = Math.max(0, ...els.map(e => e.getBoundingClientRect().bottom)), barras = [...document.querySelectorAll('.tabbar, .actionbar')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.getBoundingClientRect().top);
        const d = { fim: Math.round(fim), barra: Math.round(Math.min(innerHeight, ...barras)), y: Math.round(scrollY), doc: document.documentElement.scrollHeight, ult: els.slice(-2).map(e => `${e.className}@${Math.round(e.getBoundingClientRect().bottom)}`).join(' ') }; de.scrollTop = y0; return d; });
      ok(`${nome}: fim do conteúdo acima das barras fixas`, livre.fim <= livre.barra + 1, `conteúdo termina em ${livre.fim}, barra começa em ${livre.barra} (rolagem ${livre.y} de ${livre.doc}; ${livre.ult})`);
    }
  };
  const openedAtTop = async nome => ok(`${nome}: folha abre no topo`, (await sheetTop()) === 0, `rolagem ${await sheetTop()}`);
  const sec = async (nome, f) => { console.log(`- ${nome}`); try { await f(); } catch (e) { ok(`${nome}: executou até o fim`, false, e.message.split('\n').slice(0, 4).join(' ').split(String.fromCharCode(27)).map((x, k) => k ? x.replace(/^\[\d+m/, '') : x).join('')); await page.screenshot({ path: `${out}/${tag}-ERRO-${nome.replace(/\W+/g, '_')}.png` }).catch(() => {}); await closeSheet().catch(() => {}); } };

  // ================= tela inicial =================
  await page.goto(base); await page.getByRole('heading', { name: 'Modo Cartas' }).waitFor();
  await sec('Tela inicial', async () => {
    ok('mostra os dois modos', await page.getByRole('heading', { name: 'Modo Clássico' }).count() === 1); await layout('inicio');
    await btn('Importar save').click(); await openedAtTop('Importar save'); ok('Importar desabilitado sem código', await btn('Importar', { exact: true }).isDisabled());
    await sheet.locator('textarea').fill('isso não é um save'); await btn('Importar', { exact: true }).click(); ok('código inválido avisa', await sheet.getByRole('alert').count() === 1); await layout('importar-invalido'); await closeSheet();
    await btn('Jogar o Clássico').click(); await page.getByText('Próximo confronto').waitFor();
  });

  // ================= Clássico: Liga =================
  await sec('Liga', async () => {
    await layout('liga-times');
    for (const v of ['Tabela', 'Jogos', 'Playoffs']) { await page.locator('.seg').getByRole('button', { name: v, exact: true }).click(); ok(`aba ${v} marcada`, await page.locator('.seg').getByRole('button', { name: v, exact: true }).getAttribute('aria-pressed') === 'true'); await layout('liga-' + v.toLowerCase());
      const chips = page.locator('.chips .chip'); await chips.first().click(); ok(`${v}: Split 1 marcado`, await chips.first().getAttribute('aria-pressed') === 'true' && await chips.nth(1).getAttribute('aria-pressed') === 'false'); }
    await page.locator('.seg').getByRole('button', { name: 'Times', exact: true }).click();
    // enfrentar e assumir pela folha do time
    await page.locator('button.row', { hasText: 'RED Canids' }).click(); await openedAtTop('folha do time'); await layout('liga-folha-time');
    await sheet.getByRole('button', { name: 'Enfrentar' }).click(); ok('Enfrentar troca o adversário no cabeçalho', (await txt('.hdr-title span')).includes('RED Canids')); ok('Enfrentar fecha a folha', await sheet.count() === 0);
    ok('lista marca o adversário', await page.locator('button.row', { hasText: 'RED Canids' }).locator('text=adversário').count() === 1);
    await page.locator('button.row', { hasText: 'LOS' }).first().click(); await sheet.getByRole('button', { name: 'Assumir' }).click(); ok('Assumir troca o time no cabeçalho', (await txt('.hdr-title b')).includes('LOS'));
    await page.locator('button.row', { hasText: 'LOS' }).first().click(); ok('seu time: Assumir e Enfrentar desabilitados', await sheet.getByRole('button', { name: 'Seu time' }).isDisabled() && await sheet.getByRole('button', { name: 'Enfrentar' }).isDisabled()); await closeSheet();
    // assumir o adversário troca os dois de lugar (ninguém some nem aparece do nada)
    await page.locator('button.row', { hasText: 'RED Canids' }).click(); await sheet.getByRole('button', { name: 'Assumir' }).click(); ok('assumir o adversário troca os dois', (await txt('.hdr-title b')).includes('RED') && (await txt('.hdr-title span')).includes('LOS'), `${await txt('.hdr-title b')} / ${await txt('.hdr-title span')}`);
    await page.locator('button.row', { hasText: 'FURIA' }).first().click(); await sheet.getByRole('button', { name: 'Assumir' }).click();
    // amistoso internacional
    await btn(/Amistoso internacional/).click(); await sheet.getByText('Gen.G').waitFor(); await openedAtTop('Amistoso'); ok('amistoso lista 20 times', await sheet.locator('button.row').count() === 20); await layout('liga-amistoso');
    await sheet.getByRole('button', { name: /T1/ }).click(); ok('amistoso troca o adversário', (await txt('.hdr-title span')).includes('T1'));
    await page.locator('button.row', { hasText: 'LOUD' }).click(); await sheet.getByRole('button', { name: 'Enfrentar' }).click();
    // formato
    await page.locator('.panel-gold .seg').getByRole('button', { name: 'MD3' }).click(); ok('formato aparece no cabeçalho', (await txt('.series-chip')).startsWith('MD3'));
  });

  // ================= Clássico: Elenco =================
  await sec('Elenco', async () => {
    await tab('Elenco'); ok('endereço #elenco', page.url().endsWith('#elenco')); await layout('elenco');
    const rows = page.locator('.panel > button.row'); ok('5 titulares', await rows.count() === 5);
    ok('jogador não é representado por foto de campeão', await rows.locator('.ct, img').count() === 0, `${await rows.locator('.ct, img').count()} ícones de campeão nas linhas`);
    ok('cada linha tem o retrato do jogador', await rows.locator('.retrato').count() === 5);
    const nick = await rows.first().locator('.row-main > b').textContent(); await rows.first().click();
    ok('abre a página do jogador tocado', (await txt('.pp-head .row-main b')) === nick, `tocou ${nick}, abriu ${await txt('.pp-head .row-main b')}`); ok('endereço tem o jogador', /#elenco\/.+/.test(page.url()));
    ok('faixa marca o jogador atual', (await page.locator('.pp-strip [aria-current=true] b').textContent()) === nick); ok('página abre no topo', await page.evaluate(() => scrollY) === 0); await layout('jogador-resumo');
    for (const t of ['Atributos', 'Campeões', 'Temporada']) { await page.locator('.seg').getByRole('button', { name: t, exact: true }).click(); ok(`aba ${t} marcada`, await page.locator('.seg').getByRole('button', { name: t, exact: true }).getAttribute('aria-pressed') === 'true'); await layout('jogador-' + t.toLowerCase());
      if (t === 'Campeões') { const n0 = await page.locator('.row.champ').count(), mais = btn(/ver todos|Ver todos/i); if (await mais.count()) { await mais.first().click(); ok('"ver todos" mostra mais campeões', await page.locator('.row.champ').count() > n0); await layout('jogador-campeoes-todos'); } } }
    // trocar de titular pela faixa mantém a aba
    await page.locator('.pp-strip button').nth(2).click(); const n2 = await page.locator('.pp-strip button').nth(2).locator('b').textContent();
    ok('faixa troca o jogador', (await txt('.pp-head .row-main b')) === n2); ok('aba continua a mesma ao trocar', await page.locator('.seg').getByRole('button', { name: 'Temporada', exact: true }).getAttribute('aria-pressed') === 'true');
    // ação com prévia e desfazer
    await page.locator('.seg').getByRole('button', { name: 'Resumo', exact: true }).click(); const estado = () => txt('.pp-state'), e0 = await estado(), o0 = await txt('.pp-ovr .ovr');
    await page.locator('.actionbar').getByRole('button', { name: /Treino/ }).click(); await openedAtTop('ação'); ok('prévia mostra antes → depois', await sheet.locator('.prev div').count() >= 3); await layout('jogador-acao');
    await sheet.getByRole('button', { name: 'Confirmar' }).click(); ok('ação muda a condição', (await estado()) !== e0); await page.locator('.toast-undo').click(); ok('Desfazer devolve condição e OVR', (await estado()) === e0 && (await txt('.pp-ovr .ovr')) === o0, `${e0} → ${await estado()}`);
    await page.locator('.actionbar').getByRole('button', { name: /Folga/ }).click(); await sheet.getByRole('button', { name: 'Cancelar' }).click(); ok('Cancelar não muda nada', (await estado()) === e0);
    // voltar: botão e "voltar" do celular
    await btn('Voltar ao elenco').click(); ok('botão voltar leva à lista', await page.getByRole('heading', { name: 'Titulares' }).count() === 1 && page.url().endsWith('#elenco'));
    await rows.nth(3).click(); await page.goBack(); await page.waitForTimeout(200); ok('"voltar" do celular leva à lista', await page.getByRole('heading', { name: 'Titulares' }).count() === 1);
    // táticas
    await page.locator('.seg').getByRole('button', { name: /Táticas/ }).click(); await layout('taticas');
    const presets = page.locator('.preset'); if (ok('há presets de tática', await presets.count() >= 4)) { await presets.nth(1).click(); ok('preset escolhido fica marcado e é o único', await presets.nth(1).getAttribute('aria-pressed') === 'true' && await page.locator('.preset[aria-pressed=true]').count() === 1); await page.locator('.toast-undo').click().catch(() => {}); }
    await page.locator('.tune > summary, .tune > button').first().click(); const sc = page.locator('.tc-sc button'); await sc.nth(1).click(); ok('shotcaller escolhido é o único marcado', await sc.nth(1).getAttribute('aria-pressed') === 'true' && await page.locator('.tc-sc [aria-pressed=true]').count() === 1);
    await page.locator('.seg').getByRole('button', { name: /Jogadores/ }).click();
  });

  // ================= estratégia: picks e bans =================
  const pct = async loc => (await loc.locator('.num').allTextContents()).map(t => parseInt(t));
  await sec('Estratégia (picks e bans)', async () => {
    await tab('Partida'); await layout('pre-jogo');
    await page.locator('.stc').first().getByRole('button', { name: 'Editar' }).click(); await openedAtTop('Estratégia'); await layout('estrategia');
    const escolhidos = [];
    for (let k = 0; k < 5; k++) {
      const slot = sheet.locator('.st-bans .st-slot').nth(k); await slot.scrollIntoViewIfNeeded(); const rol = await sheetTop(); await slot.click();
      await sheet.getByText(/Ordenado por ameaça/).waitFor(); ok(`Ban ${k + 1}: título certo`, (await sheet.getAttribute('aria-label')) === `Ban ${k + 1}`);
      await openedAtTop(`Ban ${k + 1}`);
      const nomes = await sheet.locator('.panel button.row .row-main > b').allTextContents(), ps = await pct(sheet.locator('.panel'));
      ok(`Ban ${k + 1}: lista em ordem de ameaça (maior primeiro)`, ps.every((v, i) => !i || ps[i - 1] >= v), ps.slice(0, 6).join(','));
      const rep = escolhidos.filter(n => nomes.includes(n)); ok(`Ban ${k + 1}: já banidos somem da lista`, !rep.length, `continuam: ${rep.join(', ')}`);
      const visivel = await sheet.locator('.panel button.row').first().evaluate(e => { const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }); ok(`Ban ${k + 1}: a maior ameaça está visível sem rolar`, visivel);
      if (k === 0) await layout('ban-lista');
      escolhidos.push(nomes[0]); await sheet.locator('.panel button.row').first().click();
      await sheet.getByText('Bans prioritários').waitFor(); ok(`Ban ${k + 1}: vaga mostra o escolhido`, (await sheet.locator('.st-bans .st-slot').nth(k).locator('small').textContent()) === nomes[0]);
      ok(`Ban ${k + 1}: volta para onde a folha estava`, Math.abs((await sheetTop()) - rol) <= 2, `estava em ${rol}, voltou em ${await sheetTop()}`);
    }
    ok('5 bans diferentes', new Set(escolhidos).size === 5, escolhidos.join(', ')); await layout('estrategia-bans');
    // limpar vaga: o campeão volta a aparecer
    await sheet.locator('.st-bans .st-slot').nth(4).click(); await sheet.getByRole('button', { name: 'Limpar vaga' }).click(); ok('Limpar vaga esvazia', (await sheet.locator('.st-bans .st-slot').nth(4).locator('small').textContent()) === 'auto');
    await sheet.locator('.st-bans .st-slot').nth(4).click(); ok('campeão liberado volta para a lista', (await sheet.locator('.panel button.row .row-main > b').allTextContents()).includes(escolhidos[4])); ok('vaga vazia não oferece "Limpar"', await sheet.getByRole('button', { name: 'Limpar vaga' }).count() === 0);
    await sheet.locator('.panel button.row').first().click();
    // picks: opções da mesma rota não se repetem
    const linha = sheet.locator('.st-row').first(), o1 = await linha.locator('.st-slot small').first().textContent(); await linha.locator('.st-slot').nth(1).click(); await openedAtTop('Pick opção 2');
    const nomesP = await sheet.locator('.panel button.row .row-main > b').allTextContents(); ok('pick: a opção 1 não aparece na lista da opção 2', !nomesP.includes(o1), o1);
    const psP = await pct(sheet.locator('.panel')); ok('pick: lista em ordem de encaixe', psP.every((v, i) => !i || psP[i - 1] >= v)); await layout('pick-lista');
    await sheet.getByRole('button', { name: 'Todas as rotas' }).click(); ok('"Todas as rotas" amplia a lista', (await sheet.locator('.panel button.row').count()) >= nomesP.length);
    await sheet.getByPlaceholder('Buscar campeão').fill('zzzz'); ok('busca sem resultado avisa', await sheet.getByText('Nenhum campeão encontrado').count() === 1); await sheet.getByPlaceholder('Buscar campeão').fill('');
    await sheet.locator('.panel button.row').first().click(); const slots = await linha.locator('.st-slot small').allTextContents(); ok('pick: as 3 opções da rota são diferentes', new Set(slots.filter(s => s !== '—')).size === slots.filter(s => s !== '—').length, slots.join(', '));
    await sheet.getByRole('button', { name: /Salvar e usar/ }).click(); ok('Salvar fecha a folha', await sheet.count() === 0); ok('cartão mostra os bans definidos', (await page.locator('.stc').first().textContent()).includes('5 bans definidos'));
    ok('estratégia salva fica ativa', await page.locator('.stc').first().getAttribute('aria-pressed') === 'true');
  });

  // ================= draft manual =================
  await sec('Draft manual', async () => {
    const fp = btn(/1º pick/i); if (await fp.count()) await fp.click();
    await page.locator('.seg').getByRole('button', { name: /Manual/ }).click(); await btn(/Iniciar draft/).click(); await page.locator('.d-phase').waitFor(); await layout('draft-inicio');
    const usados = () => page.evaluate(() => [...document.querySelectorAll('.ban[title]')].map(e => e.title).filter(Boolean).concat([...document.querySelectorAll('.pk small')].map(e => e.textContent).filter(t => t && !/^(TOP|JG|MID|ADC|SUP|Escolhendo…)$/.test(t))));
    let meus = 0, shot = false;
    for (let g = 0; g < 400 && !(await page.getByText('Draft completo').count()); g++) {
      const cta = page.locator('.actionbar .btn-primary'), t = await cta.textContent().catch(() => '');
      if (/escolha/i.test(t)) {
        const u = await usados(), livres = await page.locator('.pc:not(:disabled) > span:not(.ct)').allTextContents(), rep = u.filter(n => livres.includes(n));
        ok('draft: campeão já usado não fica selecionável', !rep.length, rep.join(', '));
        const naGrade = await page.evaluate(us => [...document.querySelectorAll('.pc')].filter(e => us.includes(e.querySelector('span:not(.ct)').textContent) && !e.classList.contains('off')).map(e => e.textContent), u); ok('draft: usados que aparecem na grade estão marcados como indisponíveis', !naGrade.length, naGrade.join(', '));
        const first = page.locator('.pc:not(:disabled)').first(), nome = await first.locator('span:not(.ct)').first().textContent(); await first.click();
        ok('draft: tocar seleciona e o botão mostra o nome', (await cta.textContent()).toLowerCase().includes(nome.toLowerCase()) && await first.getAttribute('aria-pressed') === 'true', await cta.textContent());
        ok('draft: só um campeão selecionado por vez', await page.locator('.pc[aria-pressed=true]').count() === 1);
        if (!shot) { await layout('draft-escolha'); shot = true; }
        await cta.click(); meus++; ok('draft: confirmado sai dos selecionáveis', !(await page.locator('.pc:not(:disabled) > span:not(.ct)').allTextContents()).includes(nome), nome);
      } else await page.waitForTimeout(300);
    }
    ok('draft chega ao fim', await page.getByText('Draft completo').count() === 1); ok('fiz 10 escolhas (5 bans + 5 picks)', meus === 10, String(meus));
    const u = await usados(); ok('20 campeões no draft, nenhum repetido', u.length === 20 && new Set(u).size === 20, `${u.length} usados, ${new Set(u).size} diferentes`); await layout('draft-completo');
  });

  // ================= partida =================
  await sec('Partida ao vivo', async () => {
    await btn(/Ir para a partida/).click(); await layout('partida-antes'); await btn(/Iniciar partida/).click(); await page.waitForTimeout(2500); await layout('partida-aovivo');
    await btn('Pausar').click(); ok('Pausar vira Continuar', await btn('Continuar').count() === 1); const t0 = await txt('.sb-t, .score .t, .sc-t').catch(() => '');
    await page.waitForTimeout(1500); ok('pausado: o relógio não anda', t0 === await txt('.sb-t, .score .t, .sc-t').catch(() => ''));
    for (const v of ['Lances', 'Gráficos', 'Times', 'Ao vivo']) { await page.locator('.seg').getByRole('button', { name: v, exact: true }).click(); ok(`partida: aba ${v} marcada`, await page.locator('.seg').getByRole('button', { name: v, exact: true }).getAttribute('aria-pressed') === 'true'); await layout('partida-' + v.toLowerCase().replace(/\W/g, '')); }
    await btn('Velocidade 4×').click(); ok('velocidade escolhida é a única marcada', await page.locator('.spd [aria-pressed=true]').count() === 1 && await btn('Velocidade 4×').getAttribute('aria-pressed') === 'true');
    await btn('Modo de transmissão').click(); await openedAtTop('Transmissão'); await layout('partida-modo'); await closeSheet();
    await btn('Próximo lance importante').click(); await page.waitForTimeout(600); ok('próximo lance retoma a partida', await btn('Pausar').count() === 1);
    await btn('Pular para o fim').click(); await openedAtTop('Pular'); await sheet.getByRole('button', { name: /Cancelar|Continuar assistindo|Voltar/ }).first().click().catch(() => closeSheet()); ok('cancelar o pulo não encerra', await page.locator('.banner').count() === 0 && await btn('Pular para o fim').count() === 1);
    await btn('Pular para o fim').click(); await sheet.getByRole('button', { name: 'Pular para o fim' }).click(); await sheet.locator('.banner').waitFor({ timeout: 15000 }); await openedAtTop('Resultado'); await layout('resultado');
    await sheet.evaluate(e => { e.scrollTop = e.scrollHeight; }); await layout('resultado-fim'); await closeSheet();
    await page.locator('.seg').getByRole('button', { name: 'Gráficos', exact: true }).click(); ok('gráfico aparece no fim', await page.locator('.chartbox').count() === 1); await layout('partida-graficos-fim');
    await page.locator('.seg').getByRole('button', { name: 'Lances', exact: true }).click(); const chips = page.locator('.chips .chip'); await chips.nth(1).click(); ok('filtro de lances: um só marcado', await page.locator('.chips .chip[aria-pressed=true]').count() === 1); await layout('partida-lances-fim');
    await btn('Placar').click(); await openedAtTop('Placar'); await layout('placar'); await closeSheet();
  });
  await sec('Série e Fearless', async () => {
    const usadosJ1 = 10; await btn('Próximo jogo').click(); ok('jogo 2 começa no pré-jogo', (await page.locator('.sec-h .cap').first().textContent()).includes('Jogo 2'), await page.locator('.sec-h .cap').first().textContent()); ok('pré-jogo abre no topo', await page.evaluate(() => scrollY) === 0);
    const fp = btn(/1º pick/i); if (await fp.count()) await fp.click();
    await btn(/Iniciar draft/).click(); await page.locator('.d-phase').waitFor(); ok('Fearless trava os 10 campeões do jogo 1', (await page.locator('.tchips').last().textContent()).includes(`${usadosJ1} travados`), await page.locator('.tchips').last().textContent());
    await btn('Opções do draft').click(); await openedAtTop('Opções do draft'); await layout('draft-opcoes'); await sheet.getByRole('button', { name: /Automático/ }).click();
    await page.getByText('Draft completo').waitFor({ timeout: 30000 }); await btn(/Ir para a partida/).click(); await btn('Simular até o fim').click(); await sheet.locator('.banner').waitFor({ timeout: 15000 }); await closeSheet();
    for (let i = 0; i < 2 && await btn('Próximo jogo').count(); i++) { await btn('Próximo jogo').click(); const f = btn(/1º pick/i); if (await f.count()) await f.click(); await page.locator('.seg').getByRole('button', { name: /Automático/ }).click(); await btn(/Iniciar draft/).click(); await page.getByText('Draft completo').waitFor({ timeout: 60000 }); await btn(/Ir para a partida/).click(); await btn('Simular até o fim').click(); await sheet.locator('.banner').waitFor({ timeout: 15000 }); await closeSheet(); }
    ok('fim da série oferece Nova série', await btn('Nova série').count() === 1); await btn('Nova série').click(); ok('nova série zera o placar', (await txt('.series-chip')).endsWith('0-0'), await txt('.series-chip'));
  });
  await sec('Motor', async () => { await tab('Motor'); await layout('motor'); await page.locator('.seg').getByRole('button', { name: '200 jogos' }).click(); await btn(/Rodar calibração/).click(); await page.getByText(/de 14 métricas/).waitFor({ timeout: 60000 }); await layout('motor-resultado'); });

  // ================= modo de cartas: a run =================
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('nexus.save')));
  const reabrir = async mudar => { await page.waitForTimeout(1200); await page.evaluate(f => { const s = JSON.parse(localStorage.getItem('nexus.save')); new Function('s', f)(s); localStorage.setItem('nexus.save', JSON.stringify(s)); }, mudar); await page.reload(); await btn(/Continuar · /).click(); await page.locator('.tiles').first().waitFor(); };
  const visao = n => page.locator('.view > .seg').first().getByRole('button', { name: n, exact: true }).click();
  // joga o jogo marcado até o fim (draft automático + simular); devolve se a série acabou
  const jogar = async () => { const fp = btn(/1º pick/i); if (await fp.count()) await fp.click(); if (await btn(/Iniciar draft/).count()) { await btn(/Iniciar draft/).click(); await page.getByText('Draft completo').waitFor({ timeout: 60000 }); await btn(/Ir para a partida/).click(); }
    await btn('Simular até o fim').click(); await sheet.locator('.recomp').waitFor({ timeout: 20000 }); };
  await sec('Cartas: fundar', async () => {
    await page.goto(base); await page.getByRole('heading', { name: 'Modo Cartas' }).waitFor(); await btn('Fundar meu clube').click(); await page.getByRole('heading', { name: 'Fundar o clube' }).waitFor();
    ok('Fundar bloqueado sem dados', await btn(/Fundar e abrir/).isDisabled()); await page.getByLabel('Nome do clube').fill('Lobos do Sul'); await page.getByLabel(/Sigla/).fill('lds'); ok('sigla vira maiúscula', await page.getByLabel(/Sigla/).inputValue() === 'LDS');
    await btn('Verde').click(); ok('cor: uma só marcada', await page.locator('.swatches [aria-pressed=true]').count() === 1); await page.getByRole('radio', { name: /Leviatán/ }).click(); await page.getByRole('radio', { name: /paiN/ }).click();
    ok('vaga: uma só marcada', await page.locator('[role=radio][aria-checked=true]').count() === 1); await layout('fundar'); await btn(/Fundar e abrir/).click(); await page.getByRole('heading', { name: 'Pacote inicial' }).waitFor(); ok('pacote abre no topo', await page.evaluate(() => scrollY) === 0);
    ok('5 cartas viradas', await page.locator('.carta.verso').count() === 5); await btn('Revelar carta 2').click(); ok('revelar uma vira só ela', await page.locator('.carta.verso').count() === 4); await layout('pacote-inicial');
    await btn('Revelar tudo').click(); ok('uma carta por rota', new Set(await page.locator('.carta .role-b').allTextContents()).size === 5); await btn('Conhecer o clube').click(); await page.getByRole('heading', { name: 'Pré-temporada' }).waitFor(); ok('clube abre no topo', await page.evaluate(() => scrollY) === 0);
    ok('clube novo começa com 500 pontos', (await txt('.tile b')) === '500', await txt('.tile b')); await layout('run-escolha');
  });
  await sec('Run: reforço, loja e primeira rodada', async () => {
    await tab('Partida'); ok('sem jogo marcado antes de escolher o reforço', await page.getByText('Sem jogo marcado').count() === 1); await layout('partida-sem-jogo'); await btn('Ir para o Clube').click();
    const ops = page.locator('[role=radio]'); ok('3 reforços em oferta', await ops.count() === 3); ok('confirmar bloqueado sem escolha', await btn('Escolha um reforço').isDisabled());
    await ops.nth(1).click(); await ops.nth(0).click(); ok('reforço: um só marcado', await page.locator('[role=radio][aria-checked=true]').count() === 1 && await ops.nth(0).getAttribute('aria-checked') === 'true');
    await btn(/^Confirmar /).click(); if (await sheet.count()) { await sheet.getByRole('button', { name: 'Revelar tudo' }).click(); await sheet.getByRole('button', { name: 'Guardar cartas' }).click(); }
    await page.getByText('Próximo jogo').waitFor(); ok('depois do reforço vem a rodada 1 em MD1', (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Rodada 1 de 7 · MD1')); await layout('run-rodada1');
    ok('tabela com 8 times, sem o substituído', await page.locator('.tbl tbody tr').count() === 8 && await page.locator('.tbl', { hasText: 'paiN' }).count() === 0); ok('tabela marca o seu clube', await page.locator('.tbl tr.me-row', { hasText: 'Lobos do Sul' }).count() === 1);
    // os 500 pontos iniciais compram um pacote básico antes da primeira rodada
    await tab('Loja'); ok('pacote básico liberado com os pontos iniciais', await btn('Abrir').first().isEnabled()); await btn('Abrir').first().click(); await openedAtTop('Pacote'); await sheet.getByRole('button', { name: 'Revelar tudo' }).click(); await layout('loja-pacote-inicial'); await sheet.getByRole('button', { name: 'Guardar cartas' }).click();
    ok('pontos descontados do pacote', (await page.locator('.sec-h .num').first().textContent()).replace(/\D/g, '') === '0', await page.locator('.sec-h .num').first().textContent());
    // partida da rodada 1: recompensas com nota, e a temporada anda
    await tab('Clube'); await btn(/Ir para a partida/).click(); ok('vai para a aba Partida', page.url().endsWith('#partida')); ok('formato da run no cabeçalho', (await txt('.series-chip')).startsWith('MD1'));
    const fp = btn(/1º pick/i); if (await fp.count()) await fp.click(); await btn(/Iniciar draft/).click(); await page.getByText('Draft completo').waitFor({ timeout: 60000 });
    await btn('Opções do draft').click().catch(() => {}); if (await sheet.count()) { ok('na run não dá para mudar o formato da série', await sheet.getByText('Formato da série').count() === 0); await closeSheet(); }
    await tab('Clube'); await visao('Time'); await page.locator('.panel > button.row').first().click(); ok('escalação travada durante a partida', await sheet.getByRole('alert').count() === 1 && await sheet.locator('button.row:not(:disabled)').count() === 0); await closeSheet(); await tab('Partida');
    ok('voltar à aba Partida com o draft pronto cai na partida', await btn(/Iniciar partida/).count() === 1); await jogar();
    const linhas = await sheet.locator('.recomp > div:not(.sec-h)').allTextContents(); ok('recompensas listam os 5 titulares com nota e PdL', linhas.length === 5 && linhas.every(l => /nota \d,\d/.test(l) && /\+\d+ PdL/.test(l)), linhas.join(' | '));
    const sv = await save(), vit = sv.vit === 1; ok('pontos da partida: 250 na vitória, 150 na derrota', (await sheet.locator('.recomp .sec-h b').textContent()).includes(vit ? '250' : '150'));
    ok('na vitória, um titular é o melhor do time', !vit || await sheet.locator('.recomp-mvp').count() === 1); await sheet.locator('.recomp').scrollIntoViewIfNeeded(); await layout('run-recompensas'); await closeSheet();
    await btn('Continuar a temporada').click(); ok('Continuar volta ao Clube', page.url().endsWith('#clube')); ok('a rodada avança', (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Rodada 2 de 7'));
    const vd = (await page.locator('.tbl tbody tr td:last-child').allTextContents()).map(t => t.split('-').map(Number)); ok('tabela bate com a rodada: 4 vitórias e 4 derrotas', vd.reduce((a, x) => a + x[0], 0) === 4 && vd.reduce((a, x) => a + x[1], 0) === 4, JSON.stringify(vd)); await layout('run-rodada2');
    await page.waitForTimeout(1200); const s2 = await save(); ok('save guarda a run', s2.v === 2 && s2.run.rodada === 1 && s2.run.fase === 'regular'); const pdls = linhas.map(l => +(l.match(/\+(\d+) PdL/) || [])[1]); ok('titulares com notas diferentes ganham PdL diferentes', new Set(pdls).size > 1, pdls.join(','));
  });
  await sec('Run: coleção, reservas e save', async () => {
    await reabrir('s.pontos = 5000'); ok('continuar mantém pontos e rodada', (await txt('.tile b')).replace(/\D/g, '') === '5000' && (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Rodada 2 de 7'));
    await tab('Loja'); await layout('loja'); await btn('Ver chances').first().click(); await openedAtTop('Chances'); const ch = (await sheet.locator('.row .num').allTextContents()).map(t => parseFloat(t.replace(',', '.')));
    ok('chances somam 100%', Math.abs(ch.reduce((a, b) => a + b, 0) - 100) < 1.5, ch.reduce((a, b) => a + b, 0).toFixed(1)); ok('chances em ordem', ch.every((v, i) => !i || ch[i - 1] >= v)); await layout('loja-chances'); await closeSheet();
    const chipsR = page.locator('[aria-label="Rota do pacote"] .chip'); await chipsR.nth(0).click(); ok('rota do pacote: uma só marcada', await page.locator('[aria-label="Rota do pacote"] [aria-pressed=true]').count() === 1);
    for (let i = 0; i < 2; i++) { await btn('Abrir').nth(1).click(); await openedAtTop('Pacote'); ok('pacote de rota traz 3 cartas viradas', await sheet.locator('.carta.verso').count() === 3); await sheet.getByRole('button', { name: 'Revelar tudo' }).click();
      ok('pacote de Topo só traz Topo', (await sheet.locator('.carta .role-b').allTextContents()).every(t => t === 'TOP')); if (!i) await layout('loja-pacote'); await sheet.getByRole('button', { name: 'Guardar cartas' }).click(); }
    ok('pontos descontados', (await page.locator('.sec-h .num').first().textContent()).replace(/\D/g, '') === '3600', await page.locator('.sec-h .num').first().textContent());
    ok('pacote de região travado com explicação', await page.getByText(/só o CBLOL está liberado/).count() === 1);
    await tab('Cartas'); await layout('cartas'); const total = await page.locator('.cartas .carta').count(); await page.locator('[aria-label="Rota"] .chip', { hasText: 'Topo' }).click();
    const tops = await page.locator('.cartas .carta .role-b').allTextContents(); ok('filtro Topo mostra só Topo', tops.length > 0 && tops.every(t => t === 'TOP') && tops.length < total); ok('filtro: um só marcado', await page.locator('[aria-label="Rota"] [aria-pressed=true]').count() === 1);
    if (ok('há mais de um Topo para trocar', tops.length >= 2, String(tops.length))) {
      const reserva = page.locator('.cartas .carta').filter({ hasNot: page.locator('.carta-tit') }).first(), nome = await reserva.locator('.carta-n').textContent(); await reserva.click(); await openedAtTop('carta'); await layout('carta-folha');
      ok('folha é da carta tocada', (await sheet.getAttribute('aria-label')) === nome); await sheet.getByRole('button', { name: 'Escalar como titular' }).click(); ok('carta escalada ganha a marca de titular', await page.locator('.cartas .carta', { hasText: nome }).locator('.carta-tit').count() === 1);
      ok('só um titular por rota', await page.locator('.cartas .carta .carta-tit').count() === 1); await page.locator('.toast-undo').click(); ok('Desfazer devolve o titular antigo', await page.locator('.cartas .carta', { hasText: nome }).locator('.carta-tit').count() === 0);
      // reservas: marcar pela folha da carta, ver no Clube, tirar
      await page.locator('.cartas .carta', { hasText: nome }).click(); await sheet.getByRole('button', { name: /Pôr na reserva/ }).click(); await closeSheet(); ok('carta marcada como reserva', await page.locator('.cartas .carta', { hasText: nome }).locator('.carta-res').count() === 1);
      await tab('Clube'); await visao('Time'); ok('Clube lista a reserva', (await page.getByRole('heading', { name: 'Reservas' }).locator('..').textContent()).includes('1 de 3')); await layout('clube-time');
      await page.locator('.panel > button.row').first().click(); await openedAtTop('Titular'); await layout('clube-troca'); ok('folha de troca marca o titular atual', await sheet.locator('button.row:disabled').count() === 1);
      await sheet.locator('button.row:not(:disabled)').first().click(); ok('trocar pela folha fecha e muda o titular', await sheet.count() === 0 && (await page.locator('.panel > button.row').first().locator('.row-main > b').textContent()) === nome);
      ok('quem saiu do time herda a vaga de reserva', (await save().then(async () => { await page.waitForTimeout(1000); return (await save()).reservas.length; })) === 1);
      await btn('Tirar').click(); ok('Tirar esvazia as reservas', await btn('Tirar').count() === 0);
    }
    await visao('Táticas'); await layout('clube-taticas'); await visao('Temporada');
    await btn('Exportar').click(); await openedAtTop('Exportar'); const code = await sheet.locator('textarea').inputValue(); ok('código de exportação começa com NEXUS1.', code.startsWith('NEXUS1.')); await layout('exportar'); await closeSheet();
    await btn('Importar').click(); await sheet.locator('textarea').fill(code); await sheet.getByRole('button', { name: 'Importar', exact: true }).click(); await page.waitForTimeout(400); ok('importar o próprio código mantém o clube e a rodada', (await txt('.hdr-title b')) === 'Lobos do Sul' && await sheet.count() === 0 && (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Rodada 2 de 7'));
    await btn('Abandonar a run').click(); await openedAtTop('Abandonar'); await sheet.getByRole('button', { name: 'Cancelar' }).click(); ok('cancelar não abandona', (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Rodada 2 de 7'));
  });
  await sec('Run: fase regular até o fim da etapa', async () => {
    for (let i = 0; i < 6; i++) { await tab('Clube'); await btn(/Ir para a partida/).click(); await jogar(); await closeSheet(); await btn('Continuar a temporada').click(); }
    const s = await save().then(async () => { await page.waitForTimeout(1200); return save(); }); ok('7 rodadas jogadas: todos os 28 jogos têm placar', s.run.jogos.flat().length === 28 && s.run.jogos.flat().every(j => j.sa >= 0));
    ok('depois da 7ª rodada vem o mata-mata ou o resumo', ['playoffs', 'fimEtapa'].includes(s.run.fase), s.run.fase); ok('semifinais são 1º × 4º e 2º × 3º', s.run.semi.length === 2); await layout('run-fim-regular');
    if (s.run.fase === 'fimEtapa') { ok('resumo mostra o resultado e o prêmio', await page.locator('.banner-t').count() === 1 && await page.getByText(/\+\d+ pontos/).count() >= 1); ok('fora dos playoffs: a chave dos outros aparece simulada', await page.locator('.chave-j').count() === 3);
      await btn(/Seguir para a Etapa 1/).click(); ok('nova etapa começa com outra escolha', await page.getByRole('heading', { name: 'Antes da Etapa 1' }).count() === 1 && await page.locator('[role=radio]').count() === 3); await layout('run-escolha-etapa1'); }
  });
  await sec('Run: mata-mata MD5 e reservas na série', async () => {
    // põe o clube numa semifinal (estado montado no save) com uma reserva de Topo
    await reabrir(`const ids = ['meu', ...new Set(s.run.jogos.flat().flatMap(j => [j.a, j.b]).filter(x => x !== 'meu'))]; s.run.fase = 'playoffs'; s.run.rodada = 7; s.run.opcoes = []; s.run.jogos.flat().forEach(j => { if (j.sa < 0) { j.sa = 1; j.sb = 0; } });
      s.run.semi = [{ a: 'meu', b: ids[1], sa: -1, sb: -1 }, { a: ids[2], b: ids[3], sa: 3, sb: 1 }]; s.run.final = null;
      s.reservas = [];`);
    ok('semifinal em MD5', (await page.locator('.panel-gold .sec-h').last().textContent()).includes('Semifinal · MD5')); await layout('run-semifinal');
    await tab('Cartas'); await page.locator('[aria-label="Rota"] .chip', { hasText: 'Topo' }).click(); const res = page.locator('.cartas .carta').filter({ hasNot: page.locator('.carta-tit') }), temRes = await res.count() > 0;
    if (temRes) { await res.first().click(); await sheet.getByRole('button', { name: /Pôr na reserva/ }).click(); await closeSheet(); }
    await tab('Clube'); await btn(/Ir para a partida/).click(); ok('série do mata-mata é MD5', (await txt('.series-chip')).startsWith('MD5')); await jogar(); await closeSheet();
    ok('no meio da série o botão é Próximo jogo', await btn('Próximo jogo').count() === 1 && await btn('Continuar a temporada').count() === 0); await btn('Próximo jogo').click();
    await tab('Clube'); ok('Clube mostra a série em andamento', await btn('Continuar a série').count() === 1); await visao('Time'); await page.locator('.panel > button.row').first().click();
    ok('entre os jogos da série, aviso de que só reservas entram', (await sheet.getByRole('alert').textContent()).includes('reservas')); ok('só a reserva pode entrar', await sheet.locator('button.row:not(:disabled)').count() === (temRes ? 1 : 0)); await layout('run-serie-reservas');
    if (temRes) { await sheet.locator('button.row:not(:disabled)').first().click(); ok('reserva entra no time no meio da série', await sheet.count() === 0); } else await closeSheet();
    for (let g = 0; g < 5; g++) { await tab('Partida'); await jogar(); await closeSheet(); if (await btn('Continuar a temporada').count()) break; await btn('Próximo jogo').click(); }
    await btn('Continuar a temporada').click(); const s = await save().then(async () => { await page.waitForTimeout(1200); return save(); }), semi = s.run.semi[0];
    ok('semifinal registrada como MD5 (alguém com 3)', Math.max(semi.sa, semi.sb) === 3, `${semi.sa}-${semi.sb}`); ok('depois da semifinal: final marcada ou etapa encerrada', s.run.fase === 'fimEtapa' || (s.run.fase === 'playoffs' && !!s.run.final)); await layout('run-pos-semifinal');
  });
  await sec('Run: fim da run, nova run e save antigo', async () => {
    await reabrir(`s.run.etapa = 2; s.run.fase = 'fimEtapa'; s.run.final = s.run.final || { a: s.run.semi[1].a, b: s.run.semi[0].b, sa: 3, sb: 0 }; if (s.run.final.sa < 0) { s.run.final.sa = 0; s.run.final.sb = 3; }
      s.run.hist = [0, 1, 2].map(e => ({ etapa: e, res: e === 2 ? 'vice' : 'fora', pos: 5 - e, v: 2 + e, d: 5 - e, premio: e === 2 ? 900 : 200, campeao: s.run.final.a })); s.recordes.vagas = ['Mundial']; s.regioes = ['CBLOL', 'LCK', 'LPL'];`);
    ok('vice da Etapa 2 mostra a vaga no Mundial', await page.getByText(/Vaga no Mundial garantida/).count() === 1); await layout('run-fim-etapa2'); const pts = (await txt('.tile b')).replace(/\D/g, ''), cartas = (await save()).cartas.length;
    await btn('Ver o resumo da run').click(); ok('resumo da run lista as 3 etapas', await page.getByRole('heading', { name: /Fim da run 1/ }).count() === 1 && await page.locator('.panel > .row').count() === 3); await layout('run-resumo');
    await tab('Partida'); ok('sem jogo no resumo da run', await page.getByText('Sem jogo marcado').count() === 1); await btn('Ir para o Clube').click();
    await btn('Começar a run 2').click(); ok('run 2 começa na pré-temporada', await page.getByRole('heading', { name: 'Pré-temporada' }).count() === 1 && (await page.locator('.panel-gold .row-main small').first().textContent()).includes('Run 2'));
    await page.waitForTimeout(1200); const s = await save(); ok('nova run mantém pontos e cartas', String(s.pontos) === pts && s.cartas.length === cartas, `${s.pontos}/${pts} ${s.cartas.length}/${cartas}`); ok('nova run zera tabela, reforços e entrosamento', s.run.n === 2 && s.run.rodada === 0 && !s.run.efeitos.length && s.run.entros === 30 && s.runs === 1);
    await tab('Loja'); await page.getByRole('heading', { name: 'Pacote de região' }).waitFor({ timeout: 10000 }); ok('regiões liberadas destravam o pacote de região', await page.locator('[aria-label="Região do pacote"] .chip').count() === 3); await layout('loja-regioes'); await tab('Clube');
    await btn('Abandonar a run').click(); await sheet.getByRole('button', { name: 'Abandonar a run' }).click(); ok('abandonar começa a run seguinte', (await page.locator('.panel-gold .row-main small').first().textContent()).includes('Run 3'));
    // save da versão anterior (sem run): migra e começa a primeira run com o que tinha
    await page.waitForTimeout(1200); await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('nexus.save')); s.v = 1; delete s.run; delete s.runs; delete s.reservas; delete s.recordes; localStorage.setItem('nexus.save', JSON.stringify(s)); });
    await page.reload(); ok('save antigo aparece para continuar', await btn(/Continuar · Lobos do Sul/).count() === 1); await layout('inicio-com-save'); await btn(/Continuar/).click(); await page.getByRole('heading', { name: 'Pré-temporada' }).waitFor();
    const m = await page.waitForTimeout(1200).then(save); ok('save antigo migra para a versão 2 com as cartas', m.v === 2 && m.cartas.length === cartas && m.run.n === 1);
    await btn('Voltar à tela inicial').click(); await btn('Fundar outro clube').click(); await openedAtTop('Começar de novo'); await sheet.getByRole('button', { name: 'Cancelar' }).click(); ok('cancelar não apaga o save', await page.evaluate(() => !!localStorage.getItem('nexus.save')));
    await btn('Jogar o Clássico').click(); ok('Clássico não herda o time de cartas', (await txt('.hdr-title b')) === 'FURIA', await txt('.hdr-title b'));
  });
  ok('nenhum erro de JavaScript na página', !errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
}

(async () => {
  let vite = null;
  if (!base) { const port = 5300 + Math.floor(Math.random() * 400); base = `http://localhost:${port}/`;
    vite = spawn(path.join(__dirname, '..', 'node_modules', '.bin', 'vite'), ['--port', String(port), '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
    for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch { /* ainda subindo */ } await new Promise(r => setTimeout(r, 500)); } }
  try { for (const [w, h] of SIZES) await run(w, h); } finally { if (vite) vite.kill(); }
  console.log(`\n${nOk} verificações passaram, ${fails.length} falharam, ${warns.length} avisos. Capturas em ${out}`);
  if (warns.length) console.log('\nAvisos:\n' + warns.map(w => '  ' + w).join('\n'));
  if (fails.length) { console.log('\nFalhas:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
})().catch(e => { console.error('FALHOU:', e); process.exit(1); });
