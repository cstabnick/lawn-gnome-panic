import puppeteer from 'puppeteer-core';
const [,, url, prefix, setup, variantsJson, clip] = process.argv;
const variants = JSON.parse(variantsJson);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 960, height: 600, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', String(e)));
await p.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));
await p.evaluate(setup);
const [x, y, width, height] = clip.split(',').map(Number);
for (let i = 0; i < variants.length; i++) {
  await p.evaluate(`window.__gta.glaze.look(${JSON.stringify(variants[i])})`);
  await new Promise(r => setTimeout(r, 900));
  await p.screenshot({ path: `${prefix}${i}.png`, clip: { x, y, width, height } });
}
await b.close();
