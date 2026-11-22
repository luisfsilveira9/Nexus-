// Verifica os wireframes no Chrome headless. Uso: node check.mjs <pasta> [--shots <pasta>]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
import fs from 'fs'; import path from 'path';

const dir = process.argv[2];
const shots = process.argv.indexOf('--shots') > 0 ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const PROIBIDOS = [/Amadora/, /Desafiante/, /Academy/, /Internacional/, /Live do time/, /Loja de camisas/, /Liga ·/,
  /\btemporada\b(?! 1)/i, /Geradores/, /\bgerador/i, /LORE: (nome|rival|apelido|Fazer live|Refundar|Desafiante|Amadora|Academy)/];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1 });
let total = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
  await page.goto('file://' + path.resolve(dir, f));
  const res = await page.evaluate(() => {
    const out = []; const telas = [...document.querySelectorAll('.tela')];
    telas.forEach((t, ti) => {
      const tr = t.getBoundingClientRect();
      const nome = t.closest('figure')?.querySelector('figcaption b')?.textContent || ('tela ' + ti);
      if (t.scrollHeight > t.clientHeight + 1) out.push(`${nome}: conteúdo passa da altura (${t.scrollHeight} > ${t.clientHeight})`);
      if (t.scrollWidth > t.clientWidth + 1) out.push(`${nome}: rolagem horizontal`);
      t.querySelectorAll('button,[data-alvo]').forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width < 47.5 || r.height < 47.5) out.push(`${nome}: alvo < 48 px (${Math.round(r.width)}×${Math.round(r.height)}) "${b.textContent.trim().slice(0, 30)}"`);
      });
      t.querySelectorAll('*').forEach(el => {
        const temTexto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!temTexto) return;
        const cs = getComputedStyle(el);
        if (parseFloat(cs.fontSize) < 12) out.push(`${nome}: texto < 12 px "${el.textContent.trim().slice(0, 30)}"`);
        if (el.closest('.teclado')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        // dentro da moldura
        if (!el.closest('.rola') && (r.bottom > tr.bottom - 2 + 0.5 || r.right > tr.right - 2 + 0.5 || r.left < tr.left + 2 - 0.5 || r.top < tr.top + 2 - 0.5))
          out.push(`${nome}: texto fora da moldura "${el.textContent.trim().slice(0, 40)}" (${Math.round(r.top - tr.top)},${Math.round(r.bottom - tr.top)})`);
        // corte horizontal não intencional
        if (!el.closest('.corta') && !el.closest('.mono') && el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible')
          out.push(`${nome}: texto cortado na horizontal "${el.textContent.trim().slice(0, 40)}"`);
        // cortado por ancestral com overflow hidden (exceto .rola e a própria tela)
        let a = el.parentElement;
        while (a && a !== t) {
          const ac = getComputedStyle(a);
          if ((ac.overflow === 'hidden' || ac.overflowY === 'hidden') && !a.classList.contains('rola') && !a.classList.contains('corta') && !a.classList.contains('mono') && !el.closest('.corta')) {
            const ar = a.getBoundingClientRect();
            if (r.bottom > ar.bottom + 0.5 || r.right > ar.right + 0.5) out.push(`${nome}: texto escondido por contêiner "${el.textContent.trim().slice(0, 40)}"`);
          }
          if (a.classList.contains('rola')) break;
          a = a.parentElement;
        }
      });
      // sobreposição de alvos (exceto camadas: véu/painel/modal/aviso/dica/teclado)
      const visivel = b => { const ro = b.closest('.rola'); if (!ro) return true; const R = ro.getBoundingClientRect(), r = b.getBoundingClientRect(); return r.top >= R.top - 0.5 && r.bottom <= R.bottom + 0.5; };
      const alvos = [...t.querySelectorAll('button,[data-alvo]')].filter(b => !b.closest('.painel,.modal,.aviso,.dica,.teclado') && !b.parentElement.closest('button,[data-alvo]') && visivel(b));
      for (let i = 0; i < alvos.length; i++) for (let j = i + 1; j < alvos.length; j++) {
        const A = alvos[i].getBoundingClientRect(), B = alvos[j].getBoundingClientRect();
        if (alvos[i].contains(alvos[j]) || alvos[j].contains(alvos[i])) continue;
        if (A.left < B.right - 0.5 && B.left < A.right - 0.5 && A.top < B.bottom - 0.5 && B.top < A.bottom - 0.5) out.push(`${nome}: alvos sobrepostos "${alvos[i].textContent.trim().slice(0, 15)}" × "${alvos[j].textContent.trim().slice(0, 15)}"`);
      }
    });
    return { out, n: telas.length, texto: telas.map(t => t.innerText).join('\n') };
  });
  const prov = PROIBIDOS.filter(rx => rx.test(res.texto)).map(rx => 'termo provisório: ' + rx);
  const prob = [...res.out, ...prov];
  total += prob.length;
  console.log(`${f}: ${res.n} telas, ${prob.length} problema(s)`);
  prob.forEach(p => console.log('   - ' + p));
  if (shots) await page.screenshot({ path: path.join(shots, f.replace('.html', '.png')), fullPage: true });
}
await browser.close();
console.log(total ? `TOTAL: ${total} problema(s)` : 'TOTAL: 0 problemas');
process.exit(total ? 1 : 0);
