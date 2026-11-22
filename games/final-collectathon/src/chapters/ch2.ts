// Chapter 2: Onboarding (Floor 2). The collectathon's second act: more kinds, respawns, an economy, a big number.
import type { Chapter, ChapterCtx } from '../types';
import { ACH } from '../config';
import { F2_DESKS } from '../floors/f2';

/** Desk top of `office-desk` (0.63) plus the usual hover height. */
const DESK_TOP_Y = 0.63 + 0.35;
/** Skip a respawn while more than this many items are live. */
const LIVE_CAP = 250;

const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');

export const CH2: Chapter = {
  id: 'ch2',
  async run(ctx: ChapterCtx) {
    const c = ctx.collect;
    ctx.music('synergy-loop');
    ctx.intensity(0.1);
    ctx.name('coworker', 'Sorrel Gluepot');

    let stage: 'clips' | 'sticky' | 'done' = 'clips';
    let lastIntensity = 0.1;

    const updateGoal = (): void => {
      if (stage === 'done') return;
      const clips = c.counts.clip;
      if (stage === 'clips') ctx.setGoal(`Clips: ${fmt(clips)} / 100`);
      else ctx.setGoal(`Clips: ${fmt(clips)} / 1,000   Sticky Squares: ${fmt(c.counts.sticky)} / 30`);
    };

    // ---- respawning Clips ("retention") ----
    const respawn = (n: number) => () => {
      if (c.items.length > LIVE_CAP) return;
      ctx.spawn('clip', n, 'open-plan');
    };
    let stopRespawn: () => void = () => {};

    // ---- milestones on pickup ----
    let said50 = false, overtime1 = false, faster = false, overtime2 = false;
    ctx.onPickup(() => {
      const clips = c.counts.clip;
      const x = 0.1 + 0.4 * Math.min(1, clips / 1000);
      if (Math.abs(x - lastIntensity) >= 0.01) { lastIntensity = x; ctx.intensity(x); }
      if (stage === 'done') return;
      if (!said50 && clips >= 50) {
        said50 = true;
        void ctx.say('narrator', "Did you notice they come back? That's called retention.");
      }
      if (!overtime1 && clips >= 200) {
        overtime1 = true;
        c.multiplier *= 2;
        ctx.toast('Overtime!', 'Clips now count double. So does everything. We are not sure why.');
      }
      if (!faster && clips >= 300) {
        faster = true;
        stopRespawn();
        stopRespawn = ctx.every(1, respawn(6));
      }
      if (!overtime2 && clips >= 500) {
        overtime2 = true;
        c.multiplier *= 2;
        ctx.toast('Double Overtime!', 'Clips now count quadruple. Everything else is also very pleased.');
      }
      updateGoal();
    });

    // ---- the kiosk: the economy ----
    let shopping = false;
    let bought = false;
    ctx.onInteract('kiosk', () => {
      if (shopping) return;
      shopping = true;
      void (async () => {
        try {
          const have = c.counts.button;
          const i = await ctx.choose(`Bucketworth Kiosk. You have ${fmt(have)} Gold Button${Math.floor(have) === 1 ? '' : 's'}.`,
            ['Bigger Magnet (3 Buttons)', 'Double Clips (5 Buttons)', 'Just looking']);
          if (i === 2) return;
          const price = i === 0 ? 3 : 5;
          if (c.counts.button < price) {
            ctx.sfx('denied');
            await ctx.say('narrator', "You can't afford that. Collect more Gold Buttons. You'll find them where you'd least expect, which is everywhere.");
            return;
          }
          c.counts.button -= price;
          if (i === 0) c.magnet += 0.8;
          else c.multiplier *= 2;
          ctx.sfx('fanfare');
          if (!bought) {
            bought = true;
            await ctx.say('narrator', 'You spent collectibles to collect collectibles faster. Somewhere, an accountant sheds a single tear and buys a magnet.');
          }
        } finally {
          shopping = false;
        }
      })();
    });

    // ---- eggs and gags, all chapter long ----
    let gossip = 0;
    const GOSSIP = [
      'Did you hear? The last applicant is still up on two and a half. Still collecting. Lovely gnome. Glazed look.',
      "I've worked here eleven years. I think. The clock says nine.",
      "Between us, nobody's ever finished the interview. You just sort of... stop.",
    ];
    ctx.onInteract('water-cooler', () => {
      gossip++;
      const line = GOSSIP[gossip - 1];
      if (line) {
        void ctx.say('coworker', line).then(() => { if (gossip === 3) ctx.egg('water-cooler'); });
      } else {
        void ctx.say('coworker', "That's all the gossip. I collect it, I don't make it.");
      }
    });

    let copied = false;
    ctx.onInteract('photocopier', () => {
      if (!copied) {
        copied = true;
        ctx.sfx('whoosh');
        ctx.toast('New collectible: You', 'You (2). Please do not collect the original.');
        void ctx.say('narrator', 'You photocopied yourself. Collected: You (2).').then(() => ctx.egg('photocopier'));
      } else {
        void ctx.say('narrator', "It's out of toner. You used it all on yourself.");
      }
    });

    ctx.onInteract('clock', () => {
      void ctx.say('narrator', "*yawns* Sorry. Long morning. It's been nine o'clock for ages.");
    });

    void ctx.wait(90).then(() => {
      if (stage !== 'done') void ctx.say('narrator', 'If anyone asks, this is the interview. Not a dream. Dreams have fewer forms.');
    });

    // ---- the script ----
    await ctx.say('narrator', "Floor 2. Onboarding. Here you'll be issued your first real collectibles. Acorns are for children and founding members.");

    ctx.spawn('clip', 120, 'open-plan');
    updateGoal();
    stopRespawn = ctx.every(2, respawn(4));
    await ctx.say('narrator', 'These are Clips. Small silver squiggles. They hold paper together, in theory. We hold them apart, and count them.');

    await ctx.waitCount('clip', 100);
    stage = 'sticky';
    ctx.toast('New collectible unlocked: Sticky Squares', 'They were always there. Now you can see them.');
    ctx.spawn('sticky', 40, 'cubicles');
    updateGoal();
    await ctx.say('narrator', "Sticky Squares. Each one has a word on it. Collect enough and they form a sentence. The sentence is 'collect more Sticky Squares.'");

    // Gold Buttons arrive with the 30th Sticky Square, whenever that is.
    void ctx.waitCount('sticky', 30).then(() => {
      if (stage === 'done') return;
      ctx.spawn('button', 8, 'corners');
      ctx.spawn('button', 4, 'storage');
      for (const i of [0, 4, 8]) {
        const d = F2_DESKS[i];
        if (d) ctx.spawnAt('button', d.x, d.z, DESK_TOP_Y);
      }
      void ctx.say('narrator', 'Gold Buttons are money. You can spend them at the kiosk, on things that help you collect things. This is called the economy.');
    });

    await ctx.waitCount('clip', 1000);
    stage = 'done';
    stopRespawn();
    ctx.setGoal(`Clips: 1,000 / 1,000`);
    ctx.unlock(ACH.clipArt);
    await ctx.say('narrator', 'A thousand Clips. Enough to hold together every document Bucketworth & Sons has ever produced. It has produced none. It is mostly collecting.');

    // ---- floor completion ----
    ctx.setGoal('Floor 2: 100%');
    await ctx.wait(3);
    ctx.setGoal('Floor 2: 104%');
    await ctx.say('narrator', "One hundred and four percent. We round up. It's a sign of commitment.");
    await ctx.say('narrator', "Upstairs is Synergy. Floor two and a half. Don't ask about the half.");
    ctx.setGoal('Take the lift to Floor 2½');
    await ctx.rideElevator('f3');
  },
};
