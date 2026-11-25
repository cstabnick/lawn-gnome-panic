// E24 chef job: the shared contracts of the chef modules (menu.ts data and rules, stepWidgets.ts mini-games,
// kitchenUi.ts the ticket rail, kitchen.ts the interior, runtime.ts the glue). Design: docs/design/gnome-theft-auto/
// side-quest-schedule.md section 4 (Sage Ladle, the Route South Acorn Diner, eight dishes, rush hour, levels).

/** The interior id of the diner kitchen (kitchen.ts defineInterior). */
export const CHEF_KITCHEN_ID = 'acorn-diner-kitchen';
/** kitchen.ts's "Work a shift" spot dispatches this window event (no detail); runtime.ts listens and opens the kitchen. */
export const CHEF_START_EVENT = 'gta:chef-start';

export type DishId =
  | 'acorn-cake' | 'dew-clover' | 'root-stew' | 'acorn-toastie' | 'dandelion-fritters' | 'mushroom-coffee'
  | 'mulch-chilli' | 'pie-of-the-day';
export const DISH_IDS: readonly DishId[] = [
  'acorn-cake', 'dew-clover', 'root-stew', 'acorn-toastie', 'dandelion-fritters', 'mushroom-coffee', 'mulch-chilli',
  'pie-of-the-day',
];

/**
 * One mini-step of a dish (stepWidgets.ts draws and plays it):
 *   chop:  tap the board `target` times (each tap a knife chop).
 *   stir:  drag round the pot `target` full circles.
 *   pour:  hold to pour; release with the fill inside `target` +- 0.08 (fill 0..1, rises ~0.45/s while held).
 *   heat:  a needle sweeps a gauge; tap once while it is in the green zone (width 0.2) centred on `target` (0..1).
 *   flip:  tap when the pan's "ready" ring is full, `target` times (each flip a new ring).
 *   plate: tap the `target` garnish items into place in the order shown (numbered).
 */
export type CookStepKind = 'chop' | 'stir' | 'pour' | 'heat' | 'flip' | 'plate';

export interface CookStep {
  kind: CookStepKind;
  /** The instruction shown above the widget: "Chop the clover". */
  label: string;
  /** See CookStepKind: count for chop/stir/flip/plate, 0..1 for pour/heat. */
  target: number;
  /** Seconds before the step's time score starts dropping (it can still be finished after). */
  seconds: number;
  /** The ingredient drawn in the widget, an emoji: "🍀". */
  emoji: string;
}

export interface Dish {
  id: DishId;
  name: string;
  emoji: string;
  /** @lawn/prefabs id of the plated dish (icon in the bag, model on the pass): `diner-${id}`. */
  prefab: string;
  /** Chef level that unlocks it (1..5). */
  level: number;
  steps: readonly CookStep[];
  /** Inventory heal (0..1 of full health) of the dish taken home. */
  heal: number;
  /** One line for the bag: what the menu says about it. */
  blurb: string;
}

export interface Ticket {
  /** 1.. within a shift. */
  id: number;
  /** One to three dishes. */
  dishes: DishId[];
  /** Who ordered: "Fence-Post Frank", "Booth 2", "the coach". */
  from: string;
  /** Seconds it waits on the rail before the customer walks out. */
  patience: number;
  /** Seconds after the shift starts that it slides onto the rail. */
  arriveAt: number;
}

/** A playable mini-step on screen (stepWidgets.ts makeStepWidget). */
export interface StepWidget {
  /** The widget's root, appended by the caller. At least 220 x 220 px of touch area, scales down to 300 px wide screens. */
  el: HTMLElement;
  /** Every animation frame while shown (seconds). */
  update(dt: number): void;
  /** null while playing; 0..100 once the step is finished (accuracy x time, stepWidgets.ts decides). */
  result(): number | null;
  /** Remove listeners and timers (the caller removes `el`). */
  destroy(): void;
}

/** How a shift went (kitchenUi.ts reports it once, at the end). */
export interface ShiftSummary {
  /** One entry per ticket served, its 1..5 stars. */
  served: { stars: number; dishes: DishId[] }[];
  /** Tickets whose customer walked out. */
  walkouts: number;
  /** The player left early ("Hang up the apron"). */
  quit: boolean;
  /** It was a rush shift. */
  rush: boolean;
}

export interface KitchenOpts {
  /** The chef level (1..6): the title in the header. */
  level: number;
  /** "Line Cook". */
  title: string;
  rush: boolean;
  /** The shift's tickets (menu.ts makeTickets), in arrival order. */
  tickets: Ticket[];
  /** Sage's lines at start, after a good ticket, after a walkout (menu.ts SAGE_LINES). */
  say(text: string): void;
  /** A ticket was served (for sounds): stars 1..5. */
  onServe(ticket: Ticket, stars: number): void;
  /** The shift is over (all tickets served or gone, or quit). The UI has closed itself. */
  onEnd(summary: ShiftSummary): void;
}

export interface KitchenSession {
  /** Every frame (seconds): ticket clocks, the active step widget. */
  update(dt: number): void;
  isOpen(): boolean;
  /** Close at once and report onEnd with quit: true. */
  close(): void;
}

/** Item id in the bag (inventory.ts registerItem) of a dish taken home. */
export const dishItemId = (id: DishId): string => `diner-${id}`;
