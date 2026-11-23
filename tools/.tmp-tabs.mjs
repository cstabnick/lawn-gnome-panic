import puppeteer from 'puppeteer-core';
const [,, url, prefix] = process.argv;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 960, height: 600 });
p.on('pageerror', e => console.log('ERR', String(e)));
await p.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000));
for (let i = 0; i < 4; i++) {
  await p.evaluate(`document.querySelectorAll('.gz-tab')[${i}].click()`);
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: `${prefix}${i}.png` });
  const rects = await p.evaluate(`[...document.querySelectorAll('.gz-tab,.gz-card,.gz-swatch,.gz-btn,.gz-range')].filter(e=>e.getBoundingClientRect().width>0).map(e=>[e.className.split(' ')[0], (e.textContent||'').trim().slice(0,18), Math.round(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2), Math.round(e.getBoundingClientRect().y+e.getBoundingClientRect().height/2)].join(':'))`);
  console.log(i, rects.join(' | '));
}
await b.close();
