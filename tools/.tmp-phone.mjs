import puppeteer from 'puppeteer-core';
const [,, url, out, w, h, js] = process.argv;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', e => console.log('ERR', String(e)));
await p.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3500));
if (js) { await p.evaluate(js); await new Promise(r => setTimeout(r, 1000)); }
await p.screenshot({ path: out });
await b.close();
