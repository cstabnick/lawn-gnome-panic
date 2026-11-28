// The home's game logic (E10): Flat 3B is a registered property, the 1,500-Acorn loan is signed at the First Kiln Bank
// during the move-in quest, sleeping in the bed passes time and saves, plus probes, the Interior Decorator achievement
// and the Home app on the Gnomlet tablet. Layout rules live in home/layout.ts; the room and the panel are elsewhere.
import type { Economy } from '../economy';
import { notifySaveChanged } from '../saveHook';
import { ownsProperty, buyProperty, registerProperty } from '../ownership';
import { registerProbe } from '../city/probes';
import { registerGnomletApp, type GnomletCtx } from '../gnomlet/registry';
import { FLAT_ID, FLAT_PROPERTY } from './types';
import {
  addStored, commitLayout, loadLayout, onHomeChange, placedCount, setHomeHooks,
} from './layout';

export const HOME_QUEST_ID = 'm02-roof-on-credit';
/** The objective index right after the First Kiln Bank visit: the loan is signed when the quest reaches it. */
export const HOME_SIGN_STEP = 2;

/** The decorate panel as this module uses it (decorUi.ts implements it). */
export interface HomeDecorPanel {
  open(tab?: 'room' | 'shop' | 'colours'): void;
  close(): void;
  isOpen(): boolean;
}

export interface HomeDeps {
  hud: { toast(text: string, ms?: number): void };
  economy: Pick<Economy, 'state'>;
  /** The player's health (0..1 of full); sleeping sets it to 1. */
  heal(): void;
  /** atmosphere.advanceWorldTime, or null without a sky. */
  advanceWorldTime: ((mode: 'noon' | 'night', seconds?: number) => { done: Promise<void> }) | null;
  nightFactor(): number;
  unlock(id: string): void;
  increment(id: string, by: number): void;
  /** The active quest id (quests.getJournal().activeId), or null. */
  activeQuestId(): string | null;
  /** The current interior id (interiors currentInterior), or null. */
  currentInterior(): string | null;
  decor: HomeDecorPanel;
}

export interface HomeRuntime {
  update(dt: number): void;
  /** Called when a quest reaches a step; signs the flat loan at HOME_SIGN_STEP. */
  onQuestStep(questId: string, step: number): void;
  /** Called at load with the saved quest progress; signs quietly if the bank visit is already behind the player. */
  catchUp(saves: Record<string, { state: 'active' | 'done'; step: number }>): void;
}

// The flat is a property from the start, so the Ledger lists it (its buyHint replaces the Buy button).
registerProperty(FLAT_PROPERTY);

/** Sign the flat loan through the installed ownership. Returns true if the loan was signed now. */
export function signFlatLoan(deps: Pick<HomeDeps, 'hud' | 'unlock'>, quiet = false): boolean {
  if (ownsProperty(FLAT_ID)) return false;
  const r = buyProperty(FLAT_ID);
  if (!r.ok) {
    if (!quiet) deps.hud.toast(r.error);
    return false;
  }
  if (!quiet) {
    deps.hud.toast('Parsley Inkpot stamps it: "1,500 Acorns, on your ledger beside the Kiln-Debt. Mind the walls."', 6000);
  }
  deps.unlock('gta-home-sweet-loan');
  // Housewarming gifts go into storage; the decorate panel places them.
  const l = loadLayout();
  addStored(l, 'armchair');
  addStored(l, 'plant');
  commitLayout(l);
  if (!quiet) {
    deps.hud.toast('Pip left you an armchair, Hyssop a plant. They are in storage: Decorate the flat to place them.');
  }
  return true;
}

/** Install the home runtime. Call once from app.ts. */
export function installHome(deps: HomeDeps): HomeRuntime {
  let sleeping = false;

  const sleep = async (): Promise<void> => {
    if (deps.currentInterior() !== FLAT_ID || sleeping) return;
    sleeping = true;
    try {
      const mode: 'noon' | 'night' = deps.nightFactor() > 0.5 ? 'noon' : 'night';
      await deps.advanceWorldTime?.(mode, 3)?.done;
      deps.heal();
      notifySaveChanged();
      deps.hud.toast(
        mode === 'noon' ? 'Morning. You slept like a fired pot. (Game saved.)' : 'You nap until dark. (Game saved.)',
      );
      deps.unlock('gta-forty-winks');
    } finally {
      sleeping = false;
    }
  };

  setHomeHooks({ sleep, decorate: () => deps.decor.open('room') });

  registerProbe('home-owned', () => (ownsProperty(FLAT_ID) ? 1 : 0));
  registerProbe('home-furnished', () => placedCount(loadLayout()));

  // Interior Decorator: count pieces as they are first placed (moving a piece does not count again).
  let lastPlaced = loadLayout().placedEver;
  onHomeChange((l) => {
    const grown = l.placedEver - lastPlaced;
    lastPlaced = l.placedEver;
    if (grown > 0) deps.increment('gta-interior-decorator', grown);
  });

  registerGnomletApp({
    id: 'home',
    label: 'Home',
    icon: '🏠',
    group: 'money',
    order: 35,
    detail: () => {
      if (!ownsProperty(FLAT_ID)) return 'No home yet';
      const remaining = deps.economy.state().loans.find((l) => l.id === FLAT_ID)?.remaining ?? 0;
      const loan = remaining > 0 ? `loan ${remaining} 🌰` : 'loan paid';
      return `${placedCount(loadLayout())} pieces · ${loan}`;
    },
    open: (root: HTMLElement, ctx: GnomletCtx) => {
      const ac = new AbortController();
      const box = document.createElement('div');
      box.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:10px;font-size:15px;color:inherit;';
      root.appendChild(box);
      const line = (text: string): HTMLParagraphElement => {
        const p = document.createElement('p');
        p.style.margin = '0';
        p.textContent = text;
        box.appendChild(p);
        return p;
      };

      if (!ownsProperty(FLAT_ID)) {
        line('Pip says the bench at Side-Valve is not a home. Ask him about a roof.');
        return () => {
          ac.abort();
          box.remove();
        };
      }

      const l = loadLayout();
      const remaining = deps.economy.state().loans.find((x) => x.id === FLAT_ID)?.remaining ?? 0;
      line('Flat 3B, Saucer Court');
      line(remaining > 0 ? `Loan: ${remaining} 🌰 still owed to the First Kiln Bank` : 'Loan: paid');
      line(`Pieces placed: ${placedCount(l)}`);
      line(`In storage: ${Object.values(l.stored).reduce((a, n) => a + n, 0)}`);

      const button = (label: string, onClick: () => void): void => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = 'min-height:44px;padding:0 12px;font-size:15px;cursor:pointer;';
        b.addEventListener('click', onClick, { signal: ac.signal });
        box.appendChild(b);
      };
      button('Arrange furniture', () => {
        ctx.close();
        deps.decor.open('room');
      });
      button('Furniture shop', () => {
        ctx.close();
        deps.decor.open('shop');
      });
      button('Paint', () => {
        ctx.close();
        deps.decor.open('colours');
      });

      return () => {
        ac.abort();
        box.remove();
      };
    },
  });

  return {
    update: (_dt: number) => {},
    onQuestStep: (questId, step) => {
      if (questId === HOME_QUEST_ID && step >= HOME_SIGN_STEP) signFlatLoan(deps);
    },
    catchUp: (saves) => {
      const s = saves[HOME_QUEST_ID];
      if (!s) return;
      const past = s.state === 'done' || (s.state === 'active' && s.step >= HOME_SIGN_STEP);
      if (past && !ownsProperty(FLAT_ID)) signFlatLoan(deps, true);
    },
  };
}
