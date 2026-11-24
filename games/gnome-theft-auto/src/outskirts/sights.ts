// Pebblewick's set pieces and easter eggs (SIGHTS in town.ts): the welcome on arrival, the wishing well, the town
// hall bell, the water tower valve, the notice board, the Old Chrome Combine, and the town's spot sounds.
import { mulberry32 } from '@lawn/level';
import type { TimeLabel } from '../atmosphere';
import type { Economy } from '../economy';
import { playAt } from '../sound';
import type { Hud, Sfx } from '../types';
import type { TownNpcs } from './npcs';
import type { OutskirtsStore } from './save';
import { HEN_PEN, SIGHTS, TOWN, TOWN_ACHIEVEMENTS, TOWN_PIECES, inTown } from './town';

export interface SightsDeps {
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  store: OutskirtsStore;
  npcs: TownNpcs;
  play(sfx: Sfx): void;
  unlock(id: string): void;
}

export interface SightsFrame {
  dt: number;
  px: number;
  pz: number;
  time: TimeLabel;
  /** 0 noon .. 1 deep night (atmosphere.nightFactor()). */
  night: number;
}

export interface TownSights {
  prompt(px: number, pz: number, night: number): string | null;
  interact(px: number, pz: number, night: number): boolean;
  /** The notice board sheet is open. */
  isOpen(): boolean;
  close(): void;
  update(f: SightsFrame): void;
}

type SightKey = keyof typeof SIGHTS;
const SIGHT_KEYS: readonly SightKey[] = ['well', 'bell', 'valve', 'board', 'combine'];

const PROMPTS: Record<SightKey, string> = {
  well: 'Toss an Acorn in the wishing well (1 Acorn)',
  bell: 'Ring the Pebblewick bell',
  valve: 'Open the water tower valve',
  board: 'Read the notice board',
  combine: 'Knock on the Old Combine',
};

const NIGHT = 0.6;
const WELCOME_GAP = 60;
const BELL_COOLDOWN = 4;
const VALVE_COOLDOWN = 30;
const SPOT_RADIUS = 110;
const HUM_RADIUS = 130;
const JACKPOT_EVERY = 12;
const JACKPOT_PAY = 15;
const SPOT_SEED = 0x7077;

const WISH_LINES = [
  'Plink. Somewhere, a pepper feels lucky.',
  'You made a wish. It was about a bigger well.',
  'The coin goes down. Nothing comes back up but an echo.',
  'A wish, a plink, and a faint smell of rain that is not coming.',
];

const NOTICES = [
  'LOST: one hum. Last heard at three in the morning in the eastern dunes. - M. Bucket',
  'The Pebblewick Hopper leaves for Turfton whenever you ask it to. Fare at the stop.',
  'Fizz Cup weekend: the Dry Spoon opens early. Bring your own spoon.',
  'Somebody is tapping the Weeping Line. Reward. See Purslane at the plots.',
  "Ratchet's Mower & Dew: repairs, no questions, some answers.",
  'Town meeting every Dusk on the Green. Topic: still the highway.',
];

const CSS_BOARD = [
  'position:fixed', 'left:50%', 'top:50%', 'transform:translate(-50%,-50%)', 'z-index:60', 'box-sizing:border-box',
  'width:min(480px,calc(100vw - 32px))', 'max-height:calc(100vh - 32px)', 'overflow:auto', 'padding:14px',
  'background:#f1e3c0', 'color:#2b2216', 'border:2px solid #8a6a3a', 'border-radius:10px',
  'box-shadow:0 12px 32px rgba(0,0,0,0.55)', 'font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif',
].join(';');

export function createTownSights(deps: SightsDeps): TownSights {
  const rng = mulberry32(SPOT_SEED);
  const roll = (lo: number, hi: number): number => lo + rng() * (hi - lo);
  const pieceAt = (id: string): { x: number; z: number } => {
    const p = TOWN_PIECES.find((q) => q.id === id);
    return p ? { x: p.x, z: p.z } : { x: TOWN.centre.x, z: TOWN.centre.z };
  };
  const windmill = pieceAt('windmill');
  const diner = pieceAt('diner');
  const bellPos = { x: SIGHTS.bell.x, z: SIGHTS.bell.z };
  const chimePos = { x: 646, z: 97 };
  const henPos = { x: (HEN_PEN.minX + HEN_PEN.maxX) / 2, z: (HEN_PEN.minZ + HEN_PEN.maxZ) / 2 };
  const combinePos = { x: TOWN.combine.x, z: TOWN.combine.z };
  const spot = { x: 0, z: 0 };
  const at = (id: string, p: { x: number; z: number }, opts?: { maxDist?: number }): void => {
    spot.x = p.x;
    spot.z = p.z;
    playAt(id, spot, opts);
  };

  let clock = 0;
  let wasInside = false;
  let lastWelcome = -Infinity;
  let lastBell = -Infinity;
  let lastValve = -Infinity;
  let creakDue = roll(7, 12);
  let chimeDue = roll(10, 18);
  let clatterDue = roll(9, 15);
  let cluckDue = roll(6, 12);
  let humDue = 0;

  let sheet: HTMLElement | null = null;

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  };

  function close(): void {
    if (sheet) sheet.remove();
    sheet = null;
    if (typeof document !== 'undefined') document.removeEventListener('keydown', onKey);
  }

  function openBoard(): void {
    if (sheet) return;
    const root = document.createElement('div');
    root.id = 'gta-pw-board';
    root.style.cssText = CSS_BOARD;

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;';
    const title = document.createElement('h2');
    title.textContent = 'Notice board, Pebblewick';
    title.style.cssText = 'margin:0;font-size:18px;';
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = 'Close';
    x.style.cssText = 'min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:1px solid #8a6a3a;background:#fff8e4;color:#2b2216;font:inherit;cursor:pointer;touch-action:manipulation;';
    x.addEventListener('click', () => close());
    head.append(title, x);
    root.appendChild(head);

    for (const line of NOTICES) {
      const p = document.createElement('p');
      p.textContent = line;
      p.style.cssText = 'margin:10px 0;padding-bottom:8px;border-bottom:1px dashed rgba(43,34,22,0.25);';
      root.appendChild(p);
    }

    deps.ui.appendChild(root);
    sheet = root;
    document.addEventListener('keydown', onKey);
  }

  /** The nearest sight whose reach covers (px, pz), or null. */
  function nearestSight(px: number, pz: number): SightKey | null {
    let best: SightKey | null = null;
    let bestD = Infinity;
    for (const k of SIGHT_KEYS) {
      const s = SIGHTS[k];
      const d = Math.hypot(px - s.x, pz - s.z);
      if (d <= s.reach && d < bestD) {
        best = k;
        bestD = d;
      }
    }
    return best;
  }

  function wellInteract(): boolean {
    const { hud, economy, store } = deps;
    if (!economy.spend(1, 'Wishing Well')) {
      hud.toast('You have no Acorn to wish with.');
      return true;
    }
    at('pw-well-plop', SIGHTS.well);
    const n = store.addWish();
    if (n % JACKPOT_EVERY === 0) {
      at('pw-well-cough', SIGHTS.well);
      economy.earn(JACKPOT_PAY, 'Wishing Well');
      store.markJackpot();
      hud.toast(`The well coughs up ${JACKPOT_PAY} Acorns. It does that.`);
    } else {
      hud.toast(WISH_LINES[n % WISH_LINES.length]);
    }
    return true;
  }

  function bellInteract(): boolean {
    if (clock - lastBell < BELL_COOLDOWN) return true;
    lastBell = clock;
    at('pw-bell', bellPos, { maxDist: 200 });
    deps.hud.toast('Dong. Reeve Yarrow glares out of the window.');
    return true;
  }

  function valveInteract(): boolean {
    if (clock - lastValve < VALVE_COOLDOWN) {
      deps.hud.toast('The valve is still dripping.');
      return true;
    }
    lastValve = clock;
    at('pw-valve-gush', SIGHTS.valve);
    deps.npcs.cheer(612, 170, 40);
    deps.hud.toast('Water gurgles down the Weeping Line to the plots.');
    return true;
  }

  function combineInteract(night: number): boolean {
    const { hud, store, unlock } = deps;
    at('pw-combine-knock', combinePos);
    if (night >= NIGHT) {
      at('pw-combine-hum', combinePos, { maxDist: 120 });
      hud.toast('Something inside hums back. Three knocks. Then nothing.');
      store.markKnocked();
      unlock(TOWN_ACHIEVEMENTS.knock);
    } else {
      hud.toast('Clang. Chrome, sand, nothing. It only answers at night.');
    }
    return true;
  }

  return {
    prompt(px, pz) {
      const k = nearestSight(px, pz);
      return k ? PROMPTS[k] : null;
    },

    interact(px, pz, night) {
      const k = nearestSight(px, pz);
      if (!k) return false;
      switch (k) {
        case 'well': return wellInteract();
        case 'bell': return bellInteract();
        case 'valve': return valveInteract();
        case 'board':
          openBoard();
          return true;
        case 'combine': return combineInteract(night);
      }
    },

    isOpen: () => sheet !== null,
    close,

    update(f) {
      clock += f.dt;

      // Arrival: the first update counts as outside, so starting inside is an arrival too.
      const inside = inTown(f.px, f.pz);
      if (inside && !wasInside && clock - lastWelcome >= WELCOME_GAP) {
        lastWelcome = clock;
        const first = deps.store.markVisited();
        if (first) {
          deps.hud.callout?.('PEBBLEWICK', 'Pop. 32. Welcome.');
          deps.hud.toast('Pebblewick: the town at the end of Route East.', 4000);
        } else {
          deps.hud.callout?.('PEBBLEWICK', 'Pop. 32');
        }
        deps.unlock(TOWN_ACHIEVEMENTS.visit);
      }
      wasInside = inside;

      const dTown = Math.hypot(f.px - TOWN.centre.x, f.pz - TOWN.centre.z);
      const dCombine = Math.hypot(f.px - TOWN.combine.x, f.pz - TOWN.combine.z);
      const night = f.night >= NIGHT;

      if (dTown <= SPOT_RADIUS) {
        if (clock >= creakDue) {
          creakDue = clock + roll(7, 12);
          at('pw-windmill-creak', windmill);
        }
        if (clock >= chimeDue) {
          chimeDue = clock + roll(10, 18);
          at('pw-chime', chimePos);
        }
        if (!night && clock >= clatterDue) {
          clatterDue = clock + roll(9, 15);
          at('pw-diner-clatter', diner);
        }
        if (clock >= cluckDue) {
          cluckDue = clock + roll(6, 12);
          at('pw-hen-cluck', henPos);
        }
      }

      if (night && dCombine <= HUM_RADIUS && clock >= humDue) {
        humDue = clock + 8;
        at('pw-combine-hum', combinePos, { maxDist: HUM_RADIUS });
      }
    },
  };
}
