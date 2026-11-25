// E24 chef job runtime: starts a shift when the kitchen's "Work a shift" spot fires, runs the kitchen, then pays, books
// the career, takes good dishes home as snacks and unlocks the chef achievements. Plan: docs/roadmaps/gta-batch-3/E24/.
import { play2d } from '../../sound/bus';
import { addItem, registerItem } from '../../inventory';
import { WORK_ACHIEVEMENTS, WORK_JOBS, workTitle } from '../../jobs/workDefs';
import { finishShift, workLevel } from '../shift';
import { registerWorkSounds } from '../sounds';
import type { WorkDeps, WorkJobRuntime } from '../types';
import { SAGE_LINES, DISHES, isRush, makeTickets } from './menu';
import { openKitchen } from './kitchenUi';
import { CHEF_START_EVENT, DISH_IDS, dishItemId, type KitchenSession, type ShiftSummary } from './types';

/** Localstorage key: the dish ids the player has ever served (The Whole Menu). */
const MENU_KEY = 'gta-chef-menu-v1';
/** Dishes taken home from one shift, at most. */
const BAG_MAX = 3;
/** Acorns for a rush shift with no walkouts and no quit. */
const RUSH_BONUS = 20;

const pick = (a: readonly string[]): string => a[Math.floor(Math.random() * a.length)] ?? '';

/** Dish ids served before (localStorage; empty when unavailable). */
function loadMenu(): Set<string> {
  try {
    const raw = localStorage.getItem(MENU_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveMenu(s: Set<string>): void {
  try {
    localStorage.setItem(MENU_KEY, JSON.stringify([...s]));
  } catch {
    // Storage is full or blocked: the achievement just cannot remember this time.
  }
}

export function installChef(deps: WorkDeps): WorkJobRuntime {
  registerWorkSounds();
  for (const id of DISH_IDS) {
    const d = DISHES[id];
    registerItem({ id: dishItemId(id), name: d.name, prefab: d.prefab, kind: 'snack', heal: d.heal, blurb: d.blurb });
  }

  let session: KitchenSession | null = null;

  function onEnd(summary: ShiftSummary): void {
    const dishes = summary.served.reduce((n, s) => n + s.dishes.length, 0);
    const fiveStarTickets = summary.served.filter((s) => s.stars === 5).length;
    const rushBonus = summary.rush && !summary.quit && summary.walkouts === 0;
    finishShift(deps, 'chef', {
      units: summary.served.map((s) => ({ stars: s.stars })),
      extra: { dishes, fiveStarDishes: fiveStarTickets },
      bonus: rushBonus ? RUSH_BONUS : 0,
      bonusNote: rushBonus ? 'Rush bonus' : undefined,
      quote: pick(SAGE_LINES.end),
    });

    // Good dishes (4+ stars) go home in the bag, in order, up to BAG_MAX.
    const took: string[] = [];
    for (const s of summary.served) {
      if (s.stars < 4) continue;
      for (const id of s.dishes) {
        if (took.length >= BAG_MAX) break;
        addItem(dishItemId(id), 1);
        took.push(DISHES[id].name);
      }
    }
    if (took.length) deps.hud.toast(`Took home: ${took.join(', ')}`, 3500);

    if (dishes > 0) deps.increment(WORK_ACHIEVEMENTS.chef, dishes);
    if (summary.served.length >= 6 && summary.served.every((s) => s.stars === 5)) {
      deps.unlock(WORK_ACHIEVEMENTS.fiveStarRush);
    }
    const menu = loadMenu();
    let fresh = 0;
    for (const s of summary.served) {
      for (const id of s.dishes) {
        if (!menu.has(id)) {
          menu.add(id);
          fresh++;
        }
      }
    }
    if (fresh > 0) {
      saveMenu(menu);
      deps.increment(WORK_ACHIEVEMENTS.fullMenu, fresh);
    }
  }

  function start(): void {
    if (session?.isOpen()) return;
    const reason = deps.blocked();
    if (reason) {
      deps.hud.toast(reason);
      return;
    }
    const level = workLevel('chef');
    const rush = isRush(deps.timeLabel());
    const tickets = makeTickets(level, rush, Date.now() & 0xffff);
    session = openKitchen(deps.ui, {
      level,
      title: workTitle('chef', level),
      rush,
      tickets,
      say: (t) => deps.hud.toast('Sage: "' + t + '"', 3500),
      onServe: (_t, stars) => play2d(stars >= 4 ? 'chef-bell' : 'chef-ticket'),
      onEnd,
    });
  }

  window.addEventListener(CHEF_START_EVENT, start);

  // Dev hook: ?chefshift starts a shift 2 s after load (screenshots and smoke tests).
  if (new URLSearchParams(location.search).has('chefshift')) {
    setTimeout(start, 2000);
  }

  const def = WORK_JOBS.chef;
  return {
    update(dt) {
      if (!session) return;
      session.update(dt);
      if (!session.isOpen()) session = null;
    },
    isOpen: () => !!session?.isOpen(),
    blips: () => [{ x: def.place.x, z: def.place.z, color: def.color, label: '🍳 Acorn Diner (chef)', kind: 'shop' }],
  };
}
