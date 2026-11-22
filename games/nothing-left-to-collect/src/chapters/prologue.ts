// Prologue: Reception. Primrose Paperweight says "Hello." and sends the applicant up to Floor 1.
import type { Chapter, ChapterCtx } from '../types';
import { ACH } from '../config';

const SECRETARY_IDLE = [
  "The lift is behind me. It's the large door that goes ding.",
  "Nobody has ever been late for an interview here. Time doesn't go that way.",
  "I collect nothing. That's my secret.",
  "Still here? The lift won't ride itself. Well. It will. But not with you in it.",
];

async function shortestInterview(ctx: ChapterCtx): Promise<void> {
  ctx.setControls('locked');
  await ctx.say('narrator', 'And so the applicant turned round and walked straight back out, before the interview could even begin.');
  await ctx.say('narrator', 'A short career. Efficient. No collectibles were harmed.');
  await ctx.hud.credits(['THE END', '', 'The Shortest Interview', '', 'Collected: nothing. Lovely.']);
  ctx.egg('shortest-interview');
  await ctx.hud.fade(1, 0.6);
  ctx.player.teleport(0, 0, 5.5, Math.PI);
  await ctx.hud.fade(0, 0.6);
  await ctx.say('secretary', 'Hello.');
  await ctx.say('secretary', 'You came back. Everyone comes back.');
  ctx.setControls('walk');
}

export const PROLOGUE: Chapter = {
  id: 'prologue',
  async run(ctx) {
    // 1. Fade in on reception.
    ctx.setControls('locked');
    ctx.music('hold-music');
    ctx.camera('close');
    // Open a few steps from the desk and a little to the right, so the close camera (which sits straight behind
    // the player) frames Primrose large and clear beside the gnome instead of tiny and behind it.
    ctx.player.teleport(1.1, 0, -0.4, Math.PI);
    ctx.player.lookAt(0, -4.1);
    await ctx.hud.fade(1, 0);
    await ctx.hud.fade(0, 1.2);

    // 2-3. "Hello."
    await ctx.say('secretary', 'Hello.');
    const c = await ctx.choose(null, ['Hello.', '...', 'Is this the interview?']);
    if (c === 0) {
      await ctx.say('player', 'Hello.');
      ctx.unlock(ACH.hello);
      await ctx.say('secretary', 'Lovely. Nobody says it back.');
    } else if (c === 1) {
      await ctx.say('secretary', "That's fine. Most applicants say less.");
    } else {
      await ctx.say('secretary', 'Everything is the interview. That was the first question. You got it right, probably.');
    }

    // 4. The position.
    await ctx.lines([
      ['secretary', "You're here for the position. The position is Collector."],
      ['secretary', 'Bucketworth & Sons have been collecting since before there was anything to collect.'],
      ['secretary', "Take the lift to Floor 1. The Interviewer will be with you shortly. He's always with you shortly."],
      ['secretary', "Oh, and help yourself to anything that glows. That's sort of the job."],
    ]);

    // 5. Free to walk.
    ctx.camera('follow');
    ctx.setControls('walk');
    ctx.setGoal('Take the lift to Floor 1');

    // 6. Listeners.
    let busy = false;
    let idle = 0;
    let plate = 0;
    const unsubs: (() => void)[] = [];
    const run = (seq: () => Promise<void>) => {
      if (busy) return;
      busy = true;
      void seq().finally(() => { busy = false; });
    };
    const unsubAll = () => { while (unsubs.length) unsubs.pop()!(); };

    unsubs.push(ctx.onInteract('secretary', () => run(async () => {
      const line = SECRETARY_IDLE[idle % SECRETARY_IDLE.length];
      idle++;
      await ctx.say('secretary', line);
    })));

    unsubs.push(ctx.onInteract('nameplate', () => run(async () => {
      plate++;
      if (plate === 1) await ctx.say('narrator', 'It says PRIMROSE PAPERWEIGHT, RECEPTION.');
      else if (plate === 2) await ctx.say('secretary', 'Still Primrose.');
      else if (plate === 3) await ctx.say('secretary', "Primrose. Honestly. It's brass, it doesn't change.");
      else if (plate === 4) {
        await ctx.say('secretary', "...Fine. Today it's Primrose Paperweight, Reception, Second Class.");
        ctx.egg('nameplate');
      } else await ctx.say('secretary', "It's a nameplate, love.");
    })));

    unsubs.push(ctx.onInteract('clock', () => run(async () => {
      await ctx.say('narrator', "Nine o'clock. Interviews are always at nine.");
    })));

    // The Shortest Interview: walking back out of the front door. onArea fires once per entry.
    unsubs.push(ctx.onArea('front-door', () => run(() => shortestInterview(ctx))));

    // Drop the lobby listeners the moment the lift is used, before the floor swaps under them.
    unsubs.push(ctx.onInteract('elevator', unsubAll));

    // 7. Up to Floor 1.
    await ctx.rideElevator('f1');
    unsubAll();
    ctx.setGoal(null);
  },
};
