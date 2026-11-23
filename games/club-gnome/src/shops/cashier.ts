// The Gnomecino Cashier (Clary Tillbox): trade acorns for chips, one way. Chips never turn back into acorns.
import { OAK, buyChips, claimFreeChips, freeChipsAvailable, getAcorns, getChips, onOakcountChange } from '@lawn/oakcount';
import { openPanel, type PanelCtx } from '../panel';

const NPC_ID = 'clary-tillbox';
const CONFIRM_MS = 4000;
const CONFIRM_ABOVE = 100;
const SAY_LINES = [
  'Pleasure doing business. Mostly.',
  'Chips it is. Enjoy the house edge.',
  'Next!',
  'Counted twice. Correct both times.',
];
const fmt = (n: number): string => n.toLocaleString('en-US');

/** Opens the cashier panel. */
export function openCashier(ctx: PanelCtx): void {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;';

  const balances = document.createElement('div');
  balances.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px 16px;font-size:17px;font-weight:600;';
  const acornsLine = document.createElement('span');
  const chipsLine = document.createElement('span');
  balances.append(acornsLine, chipsLine);

  const rate = document.createElement('p');
  rate.style.cssText = 'margin:0;font-size:14px;color:#5a4632;';
  rate.textContent = `1 acorn = ${OAK.chipsPerAcorn} chips. Chips can't be turned back into acorns. Free chips top you up to ${OAK.freeChipsCap}; only acorns take you past it.`;

  const freeBtn = document.createElement('button');
  freeBtn.type = 'button';
  freeBtn.className = 'cgp-btn';
  freeBtn.style.flex = '1 1 100%';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

  const empty = document.createElement('p');
  empty.style.cssText = 'margin:0;font-size:14px;color:#5a4632;';
  empty.textContent = 'No acorns? Look under the trees outside, and come back every day for a gift.';

  const note = document.createElement('p');
  note.style.cssText = 'margin:0;font-size:13px;color:#5a4632;';
  note.textContent = 'Spend chips at the Prize Counter.';

  wrap.append(balances, rate, freeBtn, row, empty, note);

  type Trade = { label: string; acorns: () => number; confirm: boolean; btn?: HTMLButtonElement };
  const trades: Trade[] = [
    { label: '10', acorns: () => 10, confirm: false },
    { label: '50', acorns: () => 50, confirm: false },
    { label: '100', acorns: () => 100, confirm: true },
    { label: 'All', acorns: () => getAcorns(), confirm: true },
  ];

  let armed: Trade | null = null;
  let armedTimer: ReturnType<typeof setTimeout> | undefined;
  let unsub: (() => void) | undefined;

  const disarm = (): void => {
    armed = null;
    if (armedTimer !== undefined) clearTimeout(armedTimer);
    armedTimer = undefined;
  };

  const labelFor = (t: Trade): string => {
    if (armed === t) return 'Tap again to trade';
    const a = t.acorns();
    const chips = fmt(a * OAK.chipsPerAcorn);
    return t.label === 'All' ? `All my acorns → ${chips} 🪙` : `${t.label} 🌰 → ${chips} 🪙`;
  };

  const render = (): void => {
    const acorns = getAcorns();
    acornsLine.textContent = `🌰 ${fmt(acorns)} acorns`;
    chipsLine.textContent = `🪙 ${fmt(getChips())} chips`;
    empty.style.display = acorns === 0 ? '' : 'none';
    const free = freeChipsAvailable();
    freeBtn.disabled = free <= 0;
    freeBtn.textContent = free > 0 ? `Free chips: +${fmt(free)} 🪙` : `Free chips only top you up to ${OAK.freeChipsCap} 🪙`;
    for (const t of trades) {
      const b = t.btn;
      if (!b) continue;
      const a = t.acorns();
      b.textContent = labelFor(t);
      b.disabled = a <= 0 || acorns < a;
      b.className = armed === t ? 'cgp-btn alt' : 'cgp-btn';
    }
  };

  const trade = (t: Trade): void => {
    const a = t.acorns();
    if (a <= 0 || getAcorns() < a) return;
    if (t.confirm && armed !== t) {
      disarm();
      armed = t;
      armedTimer = setTimeout(() => {
        disarm();
        render();
      }, CONFIRM_MS);
      render();
      return;
    }
    disarm();
    if (!buyChips(a)) {
      render();
      return;
    }
    const c = a * OAK.chipsPerAcorn;
    ctx.npcSay(NPC_ID, SAY_LINES[Math.floor(Math.random() * SAY_LINES.length)]);
    ctx.system(`You traded ${fmt(a)} acorns for ${fmt(c)} chips.`);
    render();
  };

  freeBtn.addEventListener('click', () => {
    disarm();
    const got = claimFreeChips();
    if (got > 0) ctx.system(`Clary slides you ${fmt(got)} free chips.`);
    render();
  });

  for (const t of trades) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cgp-btn';
    b.style.flex = '1 1 140px';
    b.addEventListener('click', () => trade(t));
    t.btn = b;
    row.appendChild(b);
  }

  const panel = openPanel(ctx.ui, {
    title: 'Cashier',
    subtitle: "Clary Tillbox: 'Acorns in, chips out. No refunds. The house has to eat.'",
    onClose: () => {
      unsub?.();
      disarm();
    },
  });
  panel.body.appendChild(wrap);
  unsub = onOakcountChange(() => {
    if (armed && armed.acorns() <= 0) disarm();
    render();
  });
  render();
}
