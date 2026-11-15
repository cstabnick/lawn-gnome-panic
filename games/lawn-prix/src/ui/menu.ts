// The title / garage screen: pick a vehicle and a mower colour, then Start.
// Plain DOM and inline styles. Everything lives in one container (#lp-menu) under the shared #ui element.
import { getMyGnome } from '@lawn/gnome';
import { MOWER_COLORS, VEHICLES, VEHICLE_ORDER, type RacerChoice, type VehicleId } from '../config';

const GOLD = '#f7d23a';

function hexCss(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Side-view icon. Cart: boxy ride-on with a seat and a steering wheel. Bike: push mower with a long handle. */
function mowerSvg(vehicle: VehicleId, color: number): string {
  const c = hexCss(color);
  const tyre = '#1d1d1d';
  const ground = '<line x1="4" y1="77" x2="116" y2="77" stroke="#2f6b2a" stroke-width="3" stroke-linecap="round"/>';
  if (vehicle === 'cart') {
    return `<svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true">${ground}`
      + `<rect x="20" y="40" width="58" height="20" rx="4" fill="${c}" stroke="${tyre}" stroke-width="2"/>`
      + `<rect x="30" y="24" width="20" height="16" rx="4" fill="#6b4a2b" stroke="${tyre}" stroke-width="2"/>`
      + `<line x1="76" y1="40" x2="92" y2="12" stroke="#555" stroke-width="4" stroke-linecap="round"/>`
      + `<ellipse cx="94" cy="10" rx="8" ry="4" fill="none" stroke="${tyre}" stroke-width="3"/>`
      + `<circle cx="32" cy="64" r="12" fill="${tyre}"/><circle cx="32" cy="64" r="4" fill="#bbb"/>`
      + `<circle cx="88" cy="66" r="8" fill="${tyre}"/><circle cx="88" cy="66" r="3" fill="#bbb"/>`
      + `</svg>`;
  }
  return `<svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true">${ground}`
    + `<rect x="26" y="50" width="46" height="12" rx="3" fill="${c}" stroke="${tyre}" stroke-width="2"/>`
    + `<line x1="66" y1="54" x2="104" y2="10" stroke="#555" stroke-width="4" stroke-linecap="round"/>`
    + `<line x1="98" y1="14" x2="110" y2="6" stroke="${tyre}" stroke-width="6" stroke-linecap="round"/>`
    + `<circle cx="34" cy="66" r="10" fill="${tyre}"/><circle cx="34" cy="66" r="3" fill="#bbb"/>`
    + `<circle cx="78" cy="68" r="8" fill="${tyre}"/><circle cx="78" cy="68" r="3" fill="#bbb"/>`
    + `</svg>`;
}

function statBar(label: string, value01: number): HTMLElement {
  const row = el('div', 'display:flex;align-items:center;gap:8px;margin:3px 0;font-size:13px');
  const name = el('span', 'width:68px;text-align:left', label);
  const track = el('div', 'flex:1;min-width:0;height:10px;border-radius:5px;background:rgba(255,255,255,0.18);overflow:hidden');
  const fill = el('div', `width:${Math.round(clamp01(value01) * 100)}%;height:100%;background:${GOLD};border-radius:5px`);
  track.appendChild(fill);
  row.append(name, track);
  return row;
}

const CARD_CSS = 'flex:1 1 240px;max-width:340px;min-width:0;box-sizing:border-box;padding:14px;border-radius:14px;'
  + 'border:3px solid transparent;background:rgba(255,255,255,0.08);color:#fff;font-family:system-ui,sans-serif;'
  + 'text-align:center;cursor:pointer';

const SWATCH_CSS = 'width:40px;height:40px;border-radius:50%;border:3px solid #fff;padding:0;cursor:pointer;'
  + 'box-sizing:border-box;transition:transform 0.1s';

/** Shows the menu in its own container under ui. onStart fires once (from the Start click or Enter) and the menu removes itself. */
export function showMenu(ui: HTMLElement, initial: RacerChoice, onStart: (choice: RacerChoice) => void): void {
  let vehicle: VehicleId = VEHICLE_ORDER.includes(initial.vehicle) ? initial.vehicle : VEHICLE_ORDER[0];
  const found = MOWER_COLORS.findIndex((c) => c.hex === initial.color);
  let colorIdx = found >= 0 ? found : 0;
  let started = false;

  const box = el('div',
    'position:absolute;inset:0;box-sizing:border-box;overflow-y:auto;display:flex;flex-direction:column;'
    + 'align-items:center;gap:14px;padding:16px 16px 24px;pointer-events:auto;text-align:center;color:#fff;'
    + 'font-family:system-ui,sans-serif;background:linear-gradient(170deg,rgba(18,74,34,0.93),rgba(8,36,18,0.9))');
  box.id = 'lp-menu';

  const title = el('div',
    'font-size:clamp(40px,11vw,84px);font-weight:900;line-height:1;letter-spacing:2px;color:' + GOLD + ';'
    + '-webkit-text-stroke:2px #3a2400;paint-order:stroke fill;'
    + 'text-shadow:0 3px 0 #6b4400,0 6px 0 #3a2400,0 10px 18px rgba(0,0,0,0.5);margin-top:8px',
    'LAWN PRIX');
  const subtitle = el('div', 'font-size:clamp(14px,3.5vw,18px);opacity:0.9', '3 laps. Stay on the mown grass.');

  const gnome = getMyGnome();
  const racing = el('div', 'font-size:15px;font-weight:700;color:#cfeecf',
    gnome ? `Racing as ${gnome.name}` : 'Racing as Gnorman (make your own gnome in the Gnome Creator)');

  const cardRow = el('div', 'display:flex;flex-wrap:wrap;justify-content:center;gap:14px;width:100%;max-width:740px;box-sizing:border-box');
  const cards: Partial<Record<VehicleId, HTMLButtonElement>> = {};
  const icons: Partial<Record<VehicleId, HTMLElement>> = {};

  for (const id of VEHICLE_ORDER) {
    const spec = VEHICLES[id];
    const card = el('button', CARD_CSS);
    card.type = 'button';
    card.id = `lp-vehicle-${id}`;
    card.setAttribute('aria-pressed', 'false');

    const icon = el('div', 'height:80px;display:flex;align-items:center;justify-content:center');
    const name = el('div', 'font-weight:800;font-size:18px;margin-top:4px', spec.name);
    const blurb = el('div', 'font-size:13px;opacity:0.85;margin:4px 0 8px', spec.blurb);
    card.append(
      icon,
      name,
      blurb,
      statBar('Speed', spec.maxSpeed / 20),
      statBar('Accel', spec.accel / 14),
      statBar('Handling', spec.turnRate / 3),
      statBar('Weight', spec.mass / 1.6),
    );
    card.onclick = () => {
      if (started) return;
      vehicle = id;
      refresh();
    };
    cards[id] = card;
    icons[id] = icon;
    cardRow.appendChild(card);
  }

  const swatches: HTMLButtonElement[] = [];
  const swatchRow = el('div', 'display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:420px');
  MOWER_COLORS.forEach((c, i) => {
    const b = el('button', SWATCH_CSS + `;background:${hexCss(c.hex)}`);
    b.type = 'button';
    b.id = `lp-color-${i}`;
    b.title = c.name;
    b.setAttribute('aria-label', c.name);
    b.onclick = () => {
      if (started) return;
      colorIdx = i;
      refresh();
    };
    swatches.push(b);
    swatchRow.appendChild(b);
  });
  const colorLabel = el('div', 'font-size:13px;font-weight:700;opacity:0.9',
    'Mower colour: ');
  const colorName = el('span', '');
  colorLabel.appendChild(colorName);

  const start = el('button',
    'margin-top:4px;padding:14px 48px;border:none;border-radius:14px;background:' + GOLD + ';color:#1b1b1b;'
    + 'font:900 22px system-ui,sans-serif;letter-spacing:2px;cursor:pointer;box-shadow:0 5px 0 #8a6a00;'
    + 'min-width:200px', 'START');
  start.id = 'lp-start';
  start.type = 'button';
  start.onclick = () => begin();

  const hint = el('div', 'font-size:12px;opacity:0.7', 'Keys: ← → vehicle, ↑ ↓ colour, Enter start');

  box.append(title, subtitle, racing, cardRow, colorLabel, swatchRow, start, hint);

  function refresh(): void {
    const color = MOWER_COLORS[colorIdx].hex;
    for (const id of VEHICLE_ORDER) {
      const card = cards[id];
      const icon = icons[id];
      if (!card || !icon) continue;
      const on = id === vehicle;
      card.style.borderColor = on ? GOLD : 'transparent';
      card.style.background = on ? 'rgba(247,210,58,0.16)' : 'rgba(255,255,255,0.08)';
      card.setAttribute('aria-pressed', String(on));
      icon.innerHTML = mowerSvg(id, color);
    }
    swatches.forEach((b, i) => {
      const on = i === colorIdx;
      b.style.boxShadow = on ? '0 0 0 3px #111, 0 0 0 6px ' + GOLD : 'none';
      b.style.transform = on ? 'scale(1.12)' : 'scale(1)';
    });
    colorName.textContent = MOWER_COLORS[colorIdx].name;
  }

  function onKey(e: KeyboardEvent): void {
    if (started) return;
    const n = VEHICLE_ORDER.length;
    const m = MOWER_COLORS.length;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        begin();
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const d = e.key === 'ArrowLeft' ? -1 : 1;
        vehicle = VEHICLE_ORDER[(VEHICLE_ORDER.indexOf(vehicle) + d + n) % n];
        refresh();
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault();
        const d = e.key === 'ArrowUp' ? -1 : 1;
        colorIdx = (colorIdx + d + m) % m;
        refresh();
        break;
      }
    }
  }

  function begin(): void {
    if (started) return;
    started = true;
    window.removeEventListener('keydown', onKey);
    box.remove();
    onStart({ vehicle, color: MOWER_COLORS[colorIdx].hex });
  }

  window.addEventListener('keydown', onKey);
  refresh();
  ui.appendChild(box);
}
