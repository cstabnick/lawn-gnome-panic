// The bag at runtime (E08, L33): the phone app and More-menu entry that open the bag sheet, the quick-use dock button
// (key KEYS.snack) that eats the best snack, the effects of every item, and the Crumbs & Co. shop.
import type { Economy } from '../economy';
import { ECON_ACH } from '../econAchievements';
import { type Inventory, ITEM_TUNING, STACK_MAX, itemDef, type ItemDef } from '../inventory';
import { KEYS, isTyping } from '../keys';
import type { Phone } from '../phone/phone';
import type { Sfx, Vehicle } from '../types';
import { registerAction } from '../ui/actions';
import { dockButton } from '../ui/dock';
import { createBagUi } from './bagUi';

export interface BagDeps {
  /** The shared #ui element. */
  ui: HTMLElement;
  hud: { toast(text: string, ms?: number): void };
  phone: Phone;
  economy: Pick<Economy, 'spend' | 'state'>;
  inventory: Inventory;
  play(sfx: Sfx): void;
  achievements: { unlock(id: string): unknown };
  /** The player's health, 0..1. */
  health(): number;
  /** Mend the player by amount (0..1), capped at 1. */
  heal(amount: number): void;
  /** The vehicle the player sits in, or null. */
  vehicle(): Vehicle | null;
  /** Mend a vehicle by amount of hit points (0..1), capped at 1 (vehicles.ts damage levels follow). */
  patchVehicle(v: Vehicle, amount: number): void;
  /** A confetti burst at the player. */
  confetti(): void;
  /** Why the bag cannot be used now (cutscene, Washed Out...), or null. */
  blocked(): string | null;
}

export interface BagBuff {
  speedMult: number;
  jumpMult: number;
  /** HUD label while a buff runs ("Fizz 12s"), or null. */
  label: string | null;
}

export interface Bag {
  update(dt: number): void;
  isOpen(): boolean;
  /** The fizz / float buff now (1, 1, null when none). */
  buff(): BagBuff;
}

const FAB_CSS = `
.gta-bag-fab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  border: 2px solid rgba(255,210,63,0.9);
  border-radius: 10px;
  background: rgba(22,26,30,0.88);
  color: #ffd23f;
  font-weight: 700;
  cursor: pointer;
  pointer-events: auto;
}
`;

const SHEET_REFRESH_S = 0.5;

export function createBag(deps: BagDeps): Bag {
  const { inventory } = deps;
  let fizz = 0;
  let float = 0;
  let sheetT = 0;

  // ---- Using items ----

  function tryUse(id: string): string | null {
    const why = deps.blocked();
    if (why) return why;
    const def = itemDef(id);
    if (!def) return 'Unknown item.';
    if (inventory.count(id) <= 0) return `No ${def.name} left.`;
    if (def.kind === 'snack' && deps.health() >= 0.999) return 'You are not cracked.';
    if (def.effect === 'patch') {
      const v = deps.vehicle();
      if (!v) return 'Sit in a vehicle first.';
      if (v.hp >= 0.999) return 'It is not damaged.';
    }
    inventory.use(id);
    return null;
  }

  function quickUse(): void {
    const why = deps.blocked();
    if (why) {
      deps.hud.toast(why);
      return;
    }
    const id = inventory.pickQuick(1 - deps.health());
    if (!id) {
      deps.hud.toast('Nothing to eat in the bag.');
      return;
    }
    const err = tryUse(id);
    if (err) deps.hud.toast(err);
  }

  inventory.onItemUse((def: ItemDef) => applyEffect(def));

  function applyEffect(def: ItemDef): void {
    if (def.heal !== undefined) {
      deps.heal(def.heal);
      deps.play('drink');
      deps.hud.toast(def.heal >= 1 ? `${def.name}. Good as new.` : `${def.name}. Cracks mended.`);
      if (def.kind === 'snack') deps.achievements.unlock(ECON_ACH.firstSnack);
      return;
    }
    switch (def.effect) {
      case 'fizz':
        fizz = ITEM_TUNING.fizzS;
        deps.play('drink');
        deps.hud.toast('Fizz! Faster for a while.');
        break;
      case 'float':
        float = ITEM_TUNING.floatS;
        deps.hud.toast('Your hat feels light.');
        break;
      case 'confetti':
        deps.confetti();
        deps.play('stunt');
        break;
      case 'whoopee':
        deps.play('bump');
        deps.hud.toast('Pfffrrrt. Somebody nearby is pretending not to laugh.');
        break;
      case 'patch': {
        const v = deps.vehicle();
        if (v) deps.patchVehicle(v, ITEM_TUNING.patchHp);
        deps.play('door');
        deps.hud.toast('Rust Oil: some of the damage is gone.');
        break;
      }
      default:
        break;
    }
  }

  // ---- Crumbs & Co. ----

  function buy(id: string): string | null {
    const why = deps.blocked();
    if (why) return why;
    const def = itemDef(id);
    if (!def || def.price === undefined) return 'Not sold here.';
    if (inventory.count(id) >= STACK_MAX) return 'Your bag is full of those.';
    if (!deps.economy.spend(def.price, 'Crumbs & Co.')) return `Not enough Acorns (${def.price}).`;
    inventory.add(id, 1);
    deps.play('door');
    deps.hud.toast(`Crumbs & Co. dropped off a ${def.name}.`);
    return null;
  }

  // ---- The sheet, the phone app and the More-menu entry ----

  const ui = createBagUi(deps.ui, {
    inventory,
    acorns: () => deps.economy.state().acorns,
    useItem: tryUse,
    buy,
  });

  function openSheet(): void {
    const why = deps.blocked();
    if (why) deps.hud.toast(why);
    else ui.open('bag');
  }

  deps.phone.addApp({
    id: 'bag',
    label: 'Bag',
    icon: '🎒',
    detail: () => {
      const total = inventory.list().reduce((sum, row) => sum + row.count, 0);
      const q = inventory.quick();
      const quickDef = q && inventory.count(q) > 0 ? itemDef(q) : undefined;
      return `${total} items` + (quickDef ? ` · quick: ${quickDef.name}` : '');
    },
    run: openSheet,
  });
  registerAction('bag', { run: openSheet });

  // ---- The quick-use dock button and key ----

  const style = document.createElement('style');
  style.textContent = FAB_CSS;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gta-bag-fab';
  btn.style.display = 'none';
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  btn.addEventListener('click', () => quickUse());
  dockButton(btn, 'snack');
  registerAction('snack', {
    run: quickUse,
    available: () => btn.style.display !== 'none',
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== KEYS.snack || e.repeat || isTyping(e)) return;
    quickUse();
  });

  function refreshButton(): void {
    let shown = false;
    if (deps.blocked() === null) {
      const id = inventory.pickQuick(1 - deps.health());
      const def = id ? itemDef(id) : undefined;
      if (id && def) {
        shown = true;
        const label = `🍎 ${def.name} ×${inventory.count(id)}`;
        if (btn.textContent !== label) btn.textContent = label;
      }
    }
    btn.style.display = shown ? 'inline-flex' : 'none';
  }

  // ---- Per-frame ----

  return {
    update(dt: number) {
      if (fizz > 0) fizz = Math.max(0, fizz - dt);
      if (float > 0) float = Math.max(0, float - dt);
      refreshButton();
      if (ui.isOpen()) {
        sheetT += dt;
        if (sheetT >= SHEET_REFRESH_S) {
          sheetT = 0;
          ui.refresh();
        }
      } else {
        sheetT = 0;
      }
    },
    isOpen: () => ui.isOpen(),
    buff(): BagBuff {
      const speedMult = fizz > 0 ? ITEM_TUNING.fizzSpeed : 1;
      const jumpMult = Math.max(fizz > 0 ? ITEM_TUNING.fizzJump : 1, float > 0 ? ITEM_TUNING.floatJump : 1);
      let label: string | null = null;
      if (fizz > 0 || float > 0) {
        // The longer one is the HUD label.
        label = fizz >= float ? `Fizz ${Math.ceil(fizz)}s` : `Float ${Math.ceil(float)}s`;
      }
      return { speedMult, jumpMult, label };
    },
  };
}
