import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import type { CombatSceneData, EventSceneData } from '../config';
import { getRun, currentBeacon, beaconTier } from '../run';
import type { RunState } from '../run';
import { getEvent } from '../sim/events';
import type { EventChoice, EventOutcome } from '../sim/events';
import { makeCrew } from '../sim/ships';
import { GNOME_NAMES } from '../sim/data';
import { playSfx } from '../audio';
import { makeButton } from '../ui/button';
import type { Button } from '../ui/button';

function pickOutcome(choice: EventChoice): EventOutcome {
  const total = choice.outcomes.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of choice.outcomes) {
    r -= o.weight;
    if (r < 0) return o.outcome;
  }
  return choice.outcomes[choice.outcomes.length - 1].outcome;
}

/** Scrap needed to take the cheapest outcome of a choice, or 0 if some outcome costs nothing. */
function cheapestScrapCost(choice: EventChoice): number {
  if (!choice.outcomes.every((o) => (o.outcome.scrap ?? 0) < 0)) return 0;
  return Math.min(...choice.outcomes.map((o) => -(o.outcome.scrap ?? 0)));
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

// A text event at an event beacon: pick a choice, see the outcome, continue.
export class EventScene extends Phaser.Scene {
  private eventId = '';

  constructor() { super(SCENES.event); }

  init(data: EventSceneData): void {
    this.eventId = data.eventId;
  }

  create(): void {
    const run = getRun(this);
    const ev = getEvent(this.eventId);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 900, 520, 0x101a0c, 0.92);
    this.add.text(GAME_WIDTH / 2, 140, ev.title, { color: COLORS.accent, fontSize: '28px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 190, ev.text, { color: COLORS.text, fontSize: '18px', wordWrap: { width: 820 }, align: 'center' }).setOrigin(0.5, 0);

    const buttons: Button[] = [];
    let chosen = false;

    ev.choices.forEach((choice, i) => {
      const cost = cheapestScrapCost(choice);
      const btn = makeButton(this, GAME_WIDTH / 2, 430 + i * 54, 820, 44, choice.label, () => {
        if (chosen) return;
        chosen = true;
        playSfx('click');
        this.resolve(run, choice, buttons);
      });
      buttons.push(btn);
      if (cost > 0 && run.scrap < cost) btn.setEnabled(false);
    });
  }

  private resolve(run: RunState, choice: EventChoice, buttons: Button[]): void {
    const ship = run.ship;
    const o = pickOutcome(choice);

    const scrapBefore = run.scrap;
    const hullBefore = ship.hull;
    const pineconesBefore = ship.pinecones;
    const crewBefore = ship.crew.length;

    run.scrap = Math.max(0, run.scrap + (o.scrap ?? 0));
    ship.hull = Math.min(ship.maxHull, Math.max(1, ship.hull + (o.hull ?? 0)));
    ship.pinecones = Math.max(0, ship.pinecones + (o.pinecones ?? 0));
    if (o.crew === 1 && ship.crew.length < 6) {
      const name = GNOME_NAMES.find((n) => !ship.crew.some((c) => c.name === n)) ?? 'Gnome';
      ship.crew.push(makeCrew(name, 0));
    } else if (o.crew === -1 && ship.crew.length > 1) {
      ship.crew.pop();
    }

    const parts: string[] = [];
    const scrapDelta = run.scrap - scrapBefore;
    const hullDelta = ship.hull - hullBefore;
    const pineconeDelta = ship.pinecones - pineconesBefore;
    const crewDelta = ship.crew.length - crewBefore;
    if (scrapDelta !== 0) parts.push(`${signed(scrapDelta)} scrap`);
    if (hullDelta !== 0) parts.push(`${signed(hullDelta)} hull`);
    if (pineconeDelta !== 0) parts.push(`${signed(pineconeDelta)} pinecones`);
    if (crewDelta !== 0) parts.push(`${signed(crewDelta)} gnome${Math.abs(crewDelta) === 1 ? '' : 's'}`);
    const summary = parts.length > 0 ? parts.join('  ') : 'No change';

    for (const b of buttons) b.container.setVisible(false);

    this.add.text(GAME_WIDTH / 2, 430, o.text, { color: COLORS.text, fontSize: '20px', wordWrap: { width: 820 }, align: 'center' }).setOrigin(0.5, 0);
    this.add.text(GAME_WIDTH / 2, 540, summary, { color: COLORS.accent, fontSize: '20px' }).setOrigin(0.5);

    makeButton(this, GAME_WIDTH / 2, 610, 240, 50, 'Continue', () => {
      if (o.fight) {
        this.scene.start(SCENES.combat, { tier: beaconTier(currentBeacon(run)), isBoss: false } satisfies CombatSceneData);
      } else {
        this.scene.start(SCENES.map);
      }
    }, 20);
  }
}
