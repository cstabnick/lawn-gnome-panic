// Chapter 4: Everything (Floor ∞). Everything becomes collectible, the furniture included, the numbers hit
// infinity, the HUD breaks, then the Pointlessness: everything stops. "You are finally free to play the game."
import type { Chapter, ChapterCtx } from '../types';
import { ACH } from '../config';
import { clearItems } from '../collect';

const INFINITY = 1e100;
/** Rain is skipped above this many live items, to keep the frame rate usable. */
const MAX_LIVE = 350;
const PHASE_A_SECONDS = 100;

const TOASTS = [
  'Collected a Desk',
  'Collected the Idea of a Desk',
  'Collected a Chair (Sat In)',
  'Collected Gravity (Partial)',
  'Collected the Floor Plan',
  'Collected the Concept of Mondays',
  'Collected Collecting',
  'Your Collection Has a Collection',
  'Its Collection Is Concerned',
  'Collected a Number',
  'Collected a Bigger Number',
  'Ran Out of Numbers',
];

type Say = (text: string, auto?: number) => Promise<void>;

/** Phase A's narration, ~20 s apart, while the player collects. Stops early if `live()` turns false. */
async function narratePhaseA(ctx: ChapterCtx, say: Say, live: () => boolean): Promise<void> {
  const lines = [
    'Collected: one desk. Collected: the idea of a desk.',
    "We're out of words for numbers. The next one is just 'more'.",
    "The counters are leaving the screen. Let them go. They've earned it.",
  ];
  await ctx.wait(10);
  for (let i = 0; i < lines.length; i++) {
    if (!live()) return;
    await say(lines[i], 2);
    if (i === 1 && live()) {
      // The camera pulls back a little after 40 s (10 + 2 lines + waits).
      await ctx.wait(8);
      if (live()) ctx.camera('wide');
      await ctx.wait(12);
    } else if (i < lines.length - 1) {
      await ctx.wait(20);
    }
  }
}

export const CH4: Chapter = {
  id: 'ch4',
  async run(ctx) {
    const unsubs: (() => void)[] = [];
    const stopAll = () => { for (const u of unsubs.splice(0)) u(); };
    // Every narrator line goes through one queue, so the clock never talks over the script.
    let queue: Promise<void> = Promise.resolve();
    const say: Say = (text, auto) => {
      const p = queue.then(() => ctx.say('narrator', text, auto === undefined ? undefined : { auto }));
      queue = p.catch(() => undefined);
      return p;
    };

    // All chapter: the clock.
    ctx.onInteract('clock', () => { void say('Nine. Still. Even up here.'); });

    // ---------- Phase A: everything is collectible ----------
    ctx.music('synergy-loop');
    ctx.intensity(1);
    await say('Floor Infinity. The top. From here, everything is collectible.');
    await say('I mean everything. The desks. The chairs. The plants. Me, probably. Go on.');

    // The furniture turns into loot, one piece every 0.15 s.
    const props = ctx.floor().layout.props;
    let next = 0;
    let converted = 0;
    const stopFurniture = ctx.every(0.15, () => {
      while (next < props.length && props[next].prefab === 'wall-clock') next++;
      if (next >= props.length) { stopFurniture(); return; }
      const i = next++;
      const p = props[i];
      ctx.floor().removeProp(i);
      ctx.spawnAt('anything', p.x, p.z, 0.35, p.prefab);
      if (converted++ % 4 === 0) ctx.sfx('ui');
    });
    unsubs.push(stopFurniture);

    // Office things rain from the ceiling.
    unsubs.push(ctx.every(0.5, () => {
      if (ctx.collect.items.length > MAX_LIVE) return;
      ctx.rain('anything', 6, 'floor');
      ctx.rain('clip', 6, 'floor');
    }));

    // Escalation: x10 every 15 s, a toast every second, the HUD overflows.
    unsubs.push(ctx.every(15, () => { ctx.collect.multiplier *= 10; }));
    let toastAt = 0;
    unsubs.push(ctx.every(1, () => {
      ctx.toast(TOASTS[toastAt % TOASTS.length]);
      toastAt++;
    }));
    unsubs.push(ctx.every(1, () => {
      ctx.hud.setOverflow(Math.min(1, Math.log10(Math.max(1, ctx.collect.total)) / 30));
    }));

    let phaseA = true;
    const narration = narratePhaseA(ctx, say, () => phaseA);

    // Infinity: by collecting, or after 100 s whatever the total.
    await Promise.race([ctx.waitTotal(INFINITY), ctx.wait(PHASE_A_SECONDS)]);
    phaseA = false;
    await narration;
    if (ctx.collect.total < INFINITY) ctx.collect.total = INFINITY;
    // The visible counter shows the infinity too.
    if (ctx.collect.counts.anything < INFINITY) ctx.collect.counts.anything = INFINITY;
    ctx.hud.setOverflow(1);
    await say('Infinity. Congratulations. You have collected infinity.', 2);
    await ctx.wait(1.5);
    await say('...Infinity and one.', 1.5);
    await ctx.wait(1.5);
    await say('...Infinity and two.', 1.5);

    // ---------- Phase B: the Pointlessness ----------
    stopAll();
    ctx.music(null);
    clearItems(ctx.collect);
    for (let i = 0; i < ctx.floor().props.length; i++) ctx.floor().removeProp(i);
    ctx.hud.setOverflow(0);
    ctx.hud.setCounters([]);
    ctx.hud.setCountersVisible(false);
    ctx.setGoal('Collected: everything.   Left to collect: nothing.');
    ctx.sfx('thud');
    ctx.camera('wide');
    ctx.setControls('locked');
    await ctx.wait(3);

    const quiet = (text: string) => say(text, 2.5);
    await quiet('...');
    await quiet("That's it. There's nothing left.");
    await quiet('There\'s nothing left to collect. You have collected all of it.');
    ctx.unlock(ACH.point);
    await ctx.hud.titleCard('', 'The Pointlessness', '');
    await quiet("So. You're free.");
    await quiet('You are finally free to play the game.');

    ctx.setControls('walk');
    ctx.camera('follow');
    ctx.setGoal(null);
    // Nothing happens. The player can walk the empty white floor.
    await ctx.wait(6);

    ctx.music('shellshore');
    ctx.intensity(0);
    await quiet('...The game was the collecting. I\'m sorry. I thought you knew.');
    await ctx.wait(3);
    await quiet("Nobody's ever got this far. Usually they stop at a nice round number and take the job.");

    // The window, once; then the lift, which only goes to L.
    ctx.setGoal('Go back down.');
    let looked = false;
    const lookUnsubs: (() => void)[] = [];
    const look = () => {
      if (looked) return;
      looked = true;
      for (const u of lookUnsubs.splice(0)) u();
      void quiet("That's Shellshore. The beach planet. Nobody collects anything there. They just... sit.")
        .then(() => ctx.intensity(0.5));
    };
    lookUnsubs.push(ctx.onInteract('window', look), ctx.onArea('window-spot', look));
    await ctx.rideElevator('lobby');
    for (const u of lookUnsubs.splice(0)) u();
    // The counters stay hidden: the ending keeps them hidden.
  },
};
