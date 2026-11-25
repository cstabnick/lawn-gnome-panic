// E25 Gnomazon: the packing station, a full-screen touch minigame: orders arrive, pick the items off the shelf grid,
// choose the box, tape it, pick the label, send; a quota bar and the shift clock. DOM only.
import { prefabIconElement } from '@lawn/prefabs';
import { BOX_CAP, BOX_SIZES, GNOMAZON } from './types';
import type { BoxSize, Order, PackedParcel, PackOpts, PackSession, ParcelScore } from './types';
import { KIPPY_LINES, STOCK, makeOrder, scoreParcel, stockItem } from './orders';

const CSS_ID = 'gta-pack-css';
const ID = 'gta-pack-ui';
const TAPE_HOLD = 0.6;
const TAPE_SWIPE = 0.6;
const SENT_WAIT = 1.0;
const STEPS = ['Pick', 'Box', 'Tape', 'Label'];
const SHELF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

const CSS = `
#${ID}{position:fixed;inset:0;z-index:38;pointer-events:auto;display:flex;flex-direction:column;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background:repeating-linear-gradient(0deg,#4a4e54 0 38px,#42464c 38px 40px),#4a4e54;color:#f1f1ee;
  font-family:system-ui,sans-serif;user-select:none;touch-action:manipulation;box-sizing:border-box}
#${ID} *{box-sizing:border-box}
#${ID} button{min-height:44px;min-width:44px;border:2px solid #b4560f;border-radius:10px;background:#e8e8e4;color:#2c2f33;
  font-weight:700;font-size:15px;padding:0 12px;cursor:pointer;touch-action:manipulation}
#${ID} button.on{background:#f28a1e;color:#1d1d1d}
#${ID} .top{flex:none;display:flex;align-items:center;gap:8px;padding:6px 10px;flex-wrap:wrap;background:#2f3236;border-bottom:3px solid #f28a1e}
#${ID} .ttl{font-weight:800;font-size:16px}
#${ID} .clock{font-weight:800;font-size:18px;font-variant-numeric:tabular-nums;color:#f9b45b}
#${ID} .quota{flex:1 1 120px;min-width:100px;height:22px;background:#1c1e21;border-radius:11px;position:relative;overflow:hidden}
#${ID} .quota i{position:absolute;left:0;top:0;bottom:0;width:0;background:#f28a1e;transition:width .3s}
#${ID} .quota.met i{background:#4caf50}
#${ID} .quota b{position:absolute;inset:0;text-align:center;font-size:13px;line-height:22px}
#${ID} .kippy{flex:1 1 100%;font-size:13px;background:#f6f1dc;color:#2c2f33;border-radius:10px;padding:4px 10px;min-height:26px}
#${ID} .kippy::before{content:'KPI-9: ';font-weight:800;color:#b4560f}
#${ID} .steps{flex:none;display:flex;gap:4px;padding:6px 10px}
#${ID} .steps span{flex:1;text-align:center;padding:4px 0;border-radius:6px;background:#2f3236;color:#999;font-weight:700;font-size:13px}
#${ID} .steps span.cur{background:#f28a1e;color:#1d1d1d}
#${ID} .steps span.done{background:#4a6b3c;color:#fff}
#${ID} .body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;padding:0 10px 8px;overflow:auto}
#${ID} .work{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;overflow:auto}
#${ID} .belt{flex:none;min-height:92px;border-radius:8px;border:2px solid #111;overflow:hidden;padding:6px;
  background-image:repeating-linear-gradient(90deg,#2d3033 0 24px,#26282b 24px 28px)}
#${ID} .slip{background:#fffdf4;color:#2c2f33;border-radius:4px 4px 8px 8px;padding:6px 8px;font-size:13px;
  transition:transform .4s,opacity .4s;transform:translateX(0)}
#${ID} .slip.in{transform:translateX(120%);opacity:0}
#${ID} .slip.out{transform:translateX(-120%);opacity:0}
#${ID} .slip .items{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
#${ID} .slip .it{display:flex;align-items:center;gap:4px;font-weight:700}
#${ID} .labels{display:flex;flex-direction:column;gap:6px;margin-top:6px}
#${ID} .labels button{text-align:left;font-size:13px;white-space:normal;padding:6px 10px}
#${ID} .tray{flex:none;min-height:96px;background:#6b5436;border:3px dashed #c9a35e;border-radius:10px;padding:6px;
  display:flex;gap:6px;flex-wrap:wrap;align-content:flex-start;position:relative}
#${ID} .tray.boxed{background:#a77b45;border-style:solid;border-color:#7a5628}
#${ID} .tray .tag{position:absolute;right:8px;top:4px;font-weight:800;font-size:13px;color:#fff;background:#0006;border-radius:6px;padding:0 6px}
#${ID} .pk{width:52px;height:52px;border-radius:8px;background:#fffdf4;display:flex;align-items:center;justify-content:center;
  touch-action:manipulation;animation:gtapk .25s ease-out}
@keyframes gtapk{from{transform:translateY(60px) scale(.5);opacity:0}to{transform:none;opacity:1}}
#${ID} .flap{flex:none;height:46px;border-radius:8px;background:#c9a35e;border:2px solid #7a5628;position:relative;touch-action:none;
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#4a3410;overflow:hidden}
#${ID} .flap .tape{position:absolute;left:0;top:14px;height:18px;width:0;background:#e8d88a;opacity:.9}
#${ID} .flap span{position:relative}
#${ID} .ctl{flex:none;display:flex;gap:6px;flex-wrap:wrap}
#${ID} .ctl button{flex:1 1 70px}
#${ID} .ctl button.send{min-height:56px;font-size:20px;background:#4caf50;border-color:#2e7d32;color:#fff;flex:1 1 100%}
#${ID} .verdict{flex:none;text-align:center;font-size:22px;min-height:28px;color:#f9b45b}
#${ID} .shelf{flex:none;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#${ID} .tile{min-height:64px;padding:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;line-height:1.1;text-align:center}
#${ID} .tile em{font-style:normal;font-size:10px;opacity:.6}
@media (orientation:landscape) and (max-height:600px){
  #${ID} .body{flex-direction:row;overflow:hidden}
  #${ID} .work{flex:1 1 50%}
  #${ID} .shelf{flex:1 1 50%;align-content:start;overflow:auto}
  #${ID} .tile{min-height:52px}
}`;

type Stage = 'pick' | 'box' | 'tape' | 'label' | 'sent';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const pickLine = (a: readonly string[]): string => a[Math.floor(Math.random() * a.length)] ?? '';
const mmss = (s: number): string => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export function openPackStation(ui: HTMLElement, opts: PackOpts): PackSession {
  if (!document.getElementById(CSS_ID)) {
    const st = el('style');
    st.id = CSS_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.getElementById(ID)?.remove();

  const root = el('div');
  root.id = ID;
  ui.appendChild(root);

  // Top bar.
  const top = el('div', 'top');
  const ttl = el('div', 'ttl', opts.title);
  const clock = el('div', 'clock');
  const quotaEl = el('div', 'quota');
  const quotaFill = el('i');
  const quotaTxt = el('b');
  quotaEl.append(quotaFill, quotaTxt);
  const out = el('button', '', 'Clock out');
  const kippyEl = el('div', 'kippy');
  top.append(ttl, clock, quotaEl, out, kippyEl);
  const stepsEl = el('div', 'steps');
  const stepEls = STEPS.map((s) => stepsEl.appendChild(el('span', '', s)));

  const body = el('div', 'body');
  const work = el('div', 'work');
  const belt = el('div', 'belt');
  const tray = el('div', 'tray');
  const flap = el('div', 'flap');
  const tapeStrip = el('div', 'tape');
  flap.append(tapeStrip, el('span', '', 'Swipe across to tape'));
  const ctl = el('div', 'ctl');
  const verdict = el('div', 'verdict');
  const shelf = el('div', 'shelf');
  work.append(belt, tray, flap, ctl, verdict);
  body.append(work, shelf);
  root.append(top, stepsEl, body);

  // State.
  let isOpen = true;
  let ended = false;
  let clockLeft = opts.shiftS;
  let idleT = 0;
  let idleFlag = false;
  let quotaSaid = false;
  let n = 0;
  let order: Order = makeOrder(opts.level, opts.seed, n);
  let stage: Stage = 'pick';
  let picked: string[] = [];
  let box: BoxSize | null = null;
  let taped = false;
  let label = '';
  let orderT = 0;
  let sentT = 0;
  let holdT = 0;
  let holding = false;
  let swipe: { x0: number; id: number } | null = null;
  const scores: ParcelScore[] = [];

  const say = (line: string): void => {
    kippyEl.textContent = line;
    opts.kippy(line);
  };
  const touch = (): void => { idleT = 0; };

  const buildSlip = (slideIn: boolean): void => {
    belt.textContent = '';
    const slip = el('div', 'slip');
    slip.appendChild(el('b', '', `Order #${order.id + 1}`));
    const items = el('div', 'items');
    const counts = new Map<string, number>();
    for (const id of order.items) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [id, c] of counts) {
      const s = stockItem(id);
      if (!s) continue;
      const it = el('div', 'it');
      it.append(prefabIconElement(s.prefab, s.emoji, 32), el('span', '', `${c} x ${s.name}`));
      items.appendChild(it);
    }
    slip.appendChild(items);
    if (stage === 'label') {
      const labels = el('div', 'labels');
      order.labels.forEach((l, i) => {
        const b = el('button', label === l ? 'on' : '', `${i + 1}. ${l}`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); chooseLabel(i); });
        labels.appendChild(b);
      });
      slip.appendChild(labels);
    }
    belt.appendChild(slip);
    if (slideIn) {
      slip.classList.add('in');
      requestAnimationFrame(() => requestAnimationFrame(() => slip.classList.remove('in')));
    }
  };

  const total = (): number => picked.reduce((s, id) => s + (stockItem(id)?.size ?? 0), 0);

  const render = (): void => {
    const idx = stage === 'pick' ? 0 : stage === 'box' ? 1 : stage === 'tape' ? 2 : 3;
    stepEls.forEach((s, i) => {
      s.className = stage === 'sent' || i < idx ? 'done' : i === idx ? 'cur' : '';
    });
    // Tray.
    tray.textContent = '';
    tray.classList.toggle('boxed', box !== null);
    picked.forEach((id, i) => {
      const s = stockItem(id);
      if (!s) return;
      const b = el('div', 'pk');
      b.appendChild(prefabIconElement(s.prefab, s.emoji, 38));
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); unpick(i); });
      tray.appendChild(b);
    });
    if (!picked.length) tray.appendChild(el('span', '', 'Tap shelf items to fill the box'));
    if (box) tray.appendChild(el('span', 'tag', `Box ${box} (${total()}/${BOX_CAP[box]})`));
    // Flap.
    flap.style.display = stage === 'tape' ? 'flex' : 'none';
    tapeStrip.style.width = taped ? '100%' : '0';
    // Controls.
    ctl.textContent = '';
    if (stage === 'pick' || stage === 'box') {
      if (picked.length) {
        for (const s of BOX_SIZES) {
          const b = el('button', box === s ? 'on' : '', `${s} (${BOX_CAP[s]})`);
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); chooseBox(s); });
          ctl.appendChild(b);
        }
      }
    }
    if (stage === 'tape') {
      const b = el('button', '', 'Hold to tape');
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); holding = true; holdT = 0; touch(); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
        b.addEventListener(ev, () => { holding = false; holdT = 0; if (!taped) tapeStrip.style.width = '0'; });
      }
      ctl.appendChild(b);
    }
    if (stage === 'label' && label) {
      const b = el('button', 'send', 'SEND');
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); send(); });
      ctl.appendChild(b);
    }
  };

  const showOrder = (slide: boolean): void => {
    buildSlip(slide);
    render();
  };

  function pick(id: string): void {
    if (stage !== 'pick') return;
    if (picked.length >= 8) return;
    picked.push(id);
    touch();
    render();
  }
  function unpick(i: number): void {
    if (stage !== 'pick') return;
    picked.splice(i, 1);
    touch();
    render();
  }
  // Picking a size moves the items into that box and goes to taping.
  function chooseBox(s: BoxSize): void {
    if (stage !== 'pick' || !picked.length) return;
    box = s;
    stage = 'tape';
    touch();
    render();
  }
  function doTape(): void {
    if (stage !== 'tape' || taped) return;
    taped = true;
    holding = false;
    stage = 'label';
    touch();
    showOrder(false);
  }
  function chooseLabel(i: number): void {
    if (stage !== 'label') return;
    label = order.labels[i] ?? '';
    touch();
    showOrder(false);
  }
  function updateQuota(): void {
    const sent = scores.length;
    quotaFill.style.width = `${Math.min(100, (sent / Math.max(1, opts.quota)) * 100)}%`;
    quotaTxt.textContent = `${sent} / ${opts.quota}`;
    quotaEl.classList.toggle('met', sent >= opts.quota);
  }
  function send(): void {
    if (stage !== 'label' || !label || !box) return;
    const parcel: PackedParcel = { order, picked: picked.slice(), box, taped, label, seconds: orderT };
    const sc = scoreParcel(parcel);
    scores.push(sc);
    stage = 'sent';
    sentT = 0;
    touch();
    verdict.textContent = `${'★'.repeat(sc.stars)}${'☆'.repeat(5 - sc.stars)}`;
    say(sc.line);
    opts.onParcel?.(sc);
    belt.firstElementChild?.classList.add('out');
    tray.style.opacity = '0.4';
    ctl.textContent = '';
    updateQuota();
    if (scores.length >= opts.quota && !quotaSaid) {
      quotaSaid = true;
      window.setTimeout(() => { if (isOpen) say(pickLine(KIPPY_LINES.quota)); }, 1200);
    }
  }
  function nextOrder(): void {
    n++;
    order = makeOrder(opts.level, opts.seed + n, n);
    stage = 'pick';
    picked = [];
    box = null;
    taped = false;
    label = '';
    orderT = 0;
    verdict.textContent = '';
    tray.style.opacity = '';
    showOrder(true);
  }

  // Shelf tiles.
  STOCK.forEach((s, i) => {
    const b = el('button', 'tile');
    b.append(prefabIconElement(s.prefab, s.emoji, 30), el('span', '', s.name), el('em', '', SHELF_KEYS[i] ?? ''));
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); pick(s.id); });
    shelf.appendChild(b);
  });

  // Tape swipe across the flap.
  flap.addEventListener('pointerdown', (e) => {
    if (stage !== 'tape') return;
    swipe = { x0: e.clientX, id: e.pointerId };
    flap.setPointerCapture?.(e.pointerId);
    touch();
  });
  flap.addEventListener('pointermove', (e) => {
    if (!swipe || swipe.id !== e.pointerId || stage !== 'tape') return;
    const w = flap.getBoundingClientRect().width || 1;
    const f = Math.max(0, (e.clientX - swipe.x0) / w);
    tapeStrip.style.width = `${Math.min(100, f * 100)}%`;
    if (f >= TAPE_SWIPE) { swipe = null; doTape(); }
  });
  const endSwipe = (): void => {
    swipe = null;
    if (stage === 'tape' && !taped) tapeStrip.style.width = '0';
  };
  flap.addEventListener('pointerup', endSwipe);
  flap.addEventListener('pointercancel', endSwipe);

  out.addEventListener('pointerdown', (e) => { e.preventDefault(); finish(true); });

  // Keyboard.
  const onKey = (e: KeyboardEvent): void => {
    if (!isOpen || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    let used = true;
    if (k === 'escape') finish(true);
    else if (k === 'enter') send();
    else if (k === 't') { if (stage === 'tape') { holding = true; touch(); } }
    else if (stage === 'label' && (k === '1' || k === '2' || k === '3')) chooseLabel(Number(k) - 1);
    else if (k === 's' || k === 'm' || k === 'l') chooseBox(k.toUpperCase() as BoxSize);
    else {
      const si = SHELF_KEYS.indexOf(e.key);
      if (si >= 0 && STOCK[si]) pick(STOCK[si].id);
      else used = false;
    }
    if (used) { e.preventDefault(); e.stopPropagation(); }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() === 't') { holding = false; holdT = 0; }
  };
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKeyUp, true);

  function teardown(): void {
    isOpen = false;
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    root.remove();
  }
  function finish(quit: boolean): void {
    if (!isOpen || ended) return;
    ended = true;
    teardown();
    opts.onEnd({ parcels: scores.slice(), quota: opts.quota, quit, idle: idleFlag });
  }

  clock.textContent = mmss(clockLeft);
  updateQuota();
  showOrder(true);
  say(pickLine(KIPPY_LINES.start));

  return {
    update(dt: number): void {
      if (!isOpen) return;
      clockLeft -= dt;
      clock.textContent = mmss(clockLeft);
      if (clockLeft <= 0) { finish(false); return; }
      idleT += dt;
      if (idleT >= GNOMAZON.idleS && !idleFlag) {
        idleFlag = true;
        say(pickLine(KIPPY_LINES.idle));
      }
      if (stage === 'sent') {
        sentT += dt;
        if (sentT >= SENT_WAIT) nextOrder();
        return;
      }
      orderT += dt;
      if (holding && stage === 'tape') {
        holdT += dt;
        tapeStrip.style.width = `${Math.min(100, (holdT / TAPE_HOLD) * 100)}%`;
        idleT = 0;
        if (holdT >= TAPE_HOLD) doTape();
      }
    },
    isOpen: () => isOpen,
    close(): void { if (isOpen) teardown(); },
  };
}
