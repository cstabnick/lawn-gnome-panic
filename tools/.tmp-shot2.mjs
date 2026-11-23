import puppeteer from 'puppeteer-core';
const [,, url, out, js, clip] = process.argv;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 960, height: 600, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', String(e)));
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await p.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3500));
if (js) { const r = await p.evaluate(js); console.log(JSON.stringify(r)); await new Promise(r => setTimeout(r, 1200)); }
const opts = { path: out };
if (clip) { const [x, y, width, height] = clip.split(',').map(Number); opts.clip = { x, y, width, height }; }
await p.screenshot(opts);
await b.close();
