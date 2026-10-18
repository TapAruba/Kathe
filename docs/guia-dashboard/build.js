// Arma el PDF de la guía. Uso: node build.js <entrada.html> <salida.pdf> [carpeta de vistas previas]
// Necesita Playwright con Chromium (en este entorno: /opt/node-tools/node_modules/playwright).
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const [input, output, previews] = process.argv.slice(2);

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.resolve(input), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  // Control: nada se sale de su página ni pisa el pie.
  const report = await page.evaluate(() => Array.from(document.querySelectorAll('.page')).map((pg, i) => {
    const top = pg.getBoundingClientRect().top, limit = pg.clientHeight - 18 * 3.7795;
    let max = 0;
    pg.querySelectorAll('*').forEach((el) => {
      if (el.closest('.foot,.foot-cover,.cover-card,.inc-foot')) return;
      const r = el.getBoundingClientRect(); if (r.height) max = Math.max(max, r.bottom - top);
    });
    const missing = Array.from(pg.querySelectorAll('figure.missing')).length;
    return { page: i + 1, over: Math.round(max - limit), missing };
  }));
  const bad = report.filter((r) => r.over > 0);
  report.forEach((r) => console.log(`pág ${r.page}: ${r.over > 0 ? 'SE PASA ' + r.over + 'px' : 'ok (' + -r.over + 'px libres)'}${r.missing ? ' · faltan ' + r.missing + ' capturas' : ''}`));
  if (errs.length) console.log('Errores:', errs);

  if (previews) {
    const n = report.length;
    for (let i = 0; i < n; i++) {
      const el = (await page.$$('.page'))[i];
      await el.screenshot({ path: path.join(previews, `p${String(i + 1).padStart(2, '0')}.png`) });
    }
  }
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();
  console.log(bad.length ? `${bad.length} páginas se pasan` : 'Todas las páginas entran', '→', output);
})().catch((e) => { console.error(e); process.exit(1); });
