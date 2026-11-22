// Chapter 3: Synergy (Floor 2½). Collectibles rain from the ceiling and turn into other collectibles, a fake
// achievement pops every six seconds, the multiplier keeps doubling, the music speeds up and the narrator tires.
import type { Chapter, ChapterCtx, ItemKind, Pickup } from '../types';
import { ACH } from '../config';
import { formatCount } from '../collect';

const FAKE_ACHIEVEMENTS = [
  'Walked a Bit', 'Collected an Achievement', 'Looked at a Desk', 'Breathed (Ongoing)', 'Got Ten of Something',
  'Got Ten of Something Else', 'Read This', 'Achievement Hunter', 'Achievement Hunter Hunter', 'Stood Near a Coworker',
  "Didn't Wake Anyone", "Didn't Wake Anyone Again", 'Picked Up a Thing You Already Had', 'Found a Secret (Not That One)',
  'Completionist (12%)', 'Synergised', 'Leveraged', 'Circled Back', 'Took It Offline', 'Unlocked: Unlocking',
  'Moved Forward', 'Patience: Waited 0 Seconds', 'Exceeded Expectations (They Were Low)', 'Employee of the Minute',
  "Collector's Edition Collector", 'Remembered to Blink', 'Attended a Meeting (In Spirit)',
  'Opened a Drawer, Emotionally', 'The Grind', 'Number Go Up',
];

const FATIGUE = [
  "I used to have a script. It's in a filing cabinet. I collected it.",
  'Is this the interview, or the dream where you\'re late for the interview? Both have carpet.',
  "Don't wake them. They're on their break. It's been a long break. Since nine.",
  'You know, you could stop. ...No. Look at the numbers. Look at them go.',
  "Somebody on this floor collected so much he became a collectible. We keep him in a drawer. Don't collect the drawer.",
  "Have you noticed the music's got faster? That's not me. That's the economy.",
];

/** More live items than this and the ceiling takes a breather. */
const RAIN_CAP = 300;
/** Most conversion drops a single pickup may cause. */
const MAX_DROPS = 5;
const META: readonly ItemKind[] = ['token', 'star', 'badge'];

export const CH3: Chapter = {
  id: 'ch3',
  async run(ctx: ChapterCtx) {
    ctx.music('synergy-loop');
    ctx.intensity(0.5);

    // Every line of dialogue goes through one queue, so ambient lines and the eggs never talk over each other.
    let talking: Promise<void> = Promise.resolve();
    const talk = (fn: () => Promise<void>): Promise<void> => {
      talking = talking.then(fn).catch((e) => { console.error(e); });
      return talking;
    };
    const narrate = (text: string) => talk(() => ctx.say('narrator', text, { auto: 3.5 }));

    await ctx.lines([
      ['narrator', 'Floor two and a half. Synergy. Here, collectibles collect other collectibles, and you collect those.'],
      ['narrator', 'Every hundred of anything becomes a Token of Appreciation. Every ten Tokens become a Star of Recognition. Every five Stars become a Collector\'s Badge.'],
      ['narrator', "Don't write it down. There's a collectible for that too."],
    ]);

    const stops: (() => void)[] = [];

    // Music: rises to full intensity (and tempo) over four minutes.
    let elapsed = 0;
    stops.push(ctx.every(5, () => {
      elapsed += 5;
      ctx.intensity(0.5 + 0.5 * Math.min(1, elapsed / 240));
    }));

    // Goal line.
    const goal = () => ctx.setGoal(`Total: ${formatCount(ctx.collect.total)}   Badges: ${ctx.count('badge')}/2`);
    goal();
    stops.push(ctx.every(1, goal));

    // Rain.
    let raining = true;
    stops.push(ctx.every(1.5, () => {
      if (!raining || ctx.collect.items.length > RAIN_CAP) return;
      ctx.rain('clip', 6, 'maze');
      ctx.rain('sticky', 3, 'maze');
      ctx.rain('acorn', 3, 'aisle');
    }));

    // Conversions: hundreds -> Tokens, tens of Tokens -> Stars, fives of Stars -> Badges. Each drops at your feet.
    const half = { w: ctx.floor().layout.w / 2 - 0.6, d: ctx.floor().layout.d / 2 - 0.6 };
    const dropNear = (kind: ItemKind) => {
      // The offset is only visual: the drop is always within a step of the player.
      const a = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 0.3;
      const x = Math.max(-half.w, Math.min(half.w, ctx.player.pos.x + Math.cos(a) * r));
      const z = Math.max(-half.d, Math.min(half.d, ctx.player.pos.z + Math.sin(a) * r));
      ctx.spawnAt(kind, x, z);
    };
    let base = 0;
    let hundreds = 0;
    let tokenTens = Math.floor(ctx.count('token') / 10);
    let starFives = Math.floor(ctx.count('star') / 5);
    stops.push(ctx.onPickup((p: Pickup) => {
      if (!META.includes(p.kind)) {
        base += p.amount;
        const h = Math.floor(base / 100);
        const due = h - hundreds;
        hundreds = h;
        for (let i = 0; i < Math.min(MAX_DROPS, due); i++) dropNear('token');
      } else if (p.kind === 'token') {
        const t = Math.floor(ctx.count('token') / 10);
        const due = t - tokenTens;
        tokenTens = t;
        for (let i = 0; i < Math.min(MAX_DROPS, due); i++) dropNear('star');
      } else if (p.kind === 'star') {
        ctx.increment(ACH.employee);
        const s = Math.floor(ctx.count('star') / 5);
        const due = s - starFives;
        starFives = s;
        if (due > 0) {
          for (let i = 0; i < Math.min(MAX_DROPS, due); i++) dropNear('badge');
          ctx.sfx('fanfare');
          ctx.toast("Collector's Badge!");
        }
      }
    }));

    // The achievement treadmill.
    let ach = 0;
    stops.push(ctx.every(6, () => {
      ctx.toast('Achievement unlocked', FAKE_ACHIEVEMENTS[ach % FAKE_ACHIEVEMENTS.length]);
      ach++;
      ctx.increment(ACH.employee);
    }));

    // The multiplier.
    let doubled = false;
    stops.push(ctx.every(45, () => {
      ctx.collect.multiplier *= 2;
      if (!doubled) {
        doubled = true;
        void narrate('Your multiplier has doubled. Everything you collect is now worth twice what it was worth, which was nothing, twice.');
      } else {
        ctx.toast(`Multiplier x${formatCount(ctx.collect.multiplier)}`);
      }
    }));

    // The narrator gets tired.
    let tired = 0;
    stops.push(ctx.every(38, () => {
      if (tired >= FATIGUE.length) return;
      void narrate(FATIGUE[tired++]);
    }));

    // Eggs and gags.
    stops.push(ctx.onInteract('arcade', () => {
      void talk(async () => {
        const i = await ctx.choose('WORD OF THE DAY: guess the five-letter word', ['GNOME', 'CLIPS', 'TOKEN', 'SLEEP']);
        if (i === 0) await ctx.say('narrator', 'Correct. The answer is GNOME. It was GNOME yesterday. It will be GNOME tomorrow.');
        else await ctx.say('narrator', 'No. The answer was GNOME. It is always GNOME.');
        ctx.egg('arcade-cabinet');
      });
    }));
    stops.push(ctx.onInteract('sleeper', () => {
      void talk(async () => {
        ctx.name('coworker', 'A Sleeping Coworker');
        try {
          await ctx.say('coworker', "Mm... five more minutes... it's only nine...");
        } finally {
          ctx.name('coworker', 'A Coworker');
        }
      });
    }));
    stops.push(ctx.onInteract('clock', () => {
      void talk(() => ctx.say('narrator', 'Still nine. Of course it is.'));
    }));

    // The end: two Badges, or five minutes.
    await Promise.race([ctx.waitCount('badge', 2), ctx.wait(300)]);
    raining = false;
    for (const s of stops) s();
    await talking;
    await ctx.lines([
      ['narrator', 'Synergy achieved. Your synergy has been noted, filed and collected.'],
      ['narrator', "There's one more floor. The top one. It has everything."],
    ]);
    ctx.setGoal(null);
    await ctx.rideElevator('f4');
  },
};
