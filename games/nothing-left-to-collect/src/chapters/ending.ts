// The ending: back in reception at nine o'clock. "Hello." / "I'm not taking the job." Then out of the front doors,
// up into the sky, and down onto Shellshore's beach for the credits and the rest of the gnome's days.
import { ACH } from '../config';
import { formatCount } from '../collect';
import { BEACH_SPAWN, FLIGHT, SKY_LAYOUT } from '../sky';
import type { Chapter, ChapterCtx } from '../types';

/** The landing squash: wide and short, a small overshoot up, then back to the gnome's normal shape. */
async function squashAndSettle(ctx: ChapterCtx): Promise<void> {
  const object = ctx.player.model.object;
  const base = object.scale.clone();
  const pose = (h: number) => object.scale.set(base.x * (2 - h), base.y * h, base.z * (2 - h));
  // [seconds, height] keyframes; the gnome eases linearly between them.
  const keys: [number, number][] = [[0, 0.72], [0.12, 1.08], [0.26, 0.97], [0.34, 1]];
  pose(keys[0]![1]);
  for (let i = 1; i < keys.length; i++) {
    const [t0, h0] = keys[i - 1]!;
    const [t1, h1] = keys[i]!;
    const steps = 3;
    for (let k = 1; k <= steps; k++) {
      pose(h0 + (h1 - h0) * (k / steps));
      await ctx.wait((t1 - t0) / steps);
    }
  }
  object.scale.copy(base);
}

const HELLO = 'Hello.';
const NOT_TAKING = "I'm not taking the job.";

const HELLO_REPLIES = [
  'The Interviewer is ready to see you now.',
  "He says you've done very well. He says that to everyone. He's in the ceiling.",
  'Hello. ...Hello. We could do this all day. We do, actually.',
] as const;

/**
 * Optional acorns along the climb: 3 per leg, alternating 1.5 m to either side. The landing leg gets none,
 * so nothing is left lying about on Shellshore (nobody collects anything there).
 */
function spawnFlightAcorns(ctx: ChapterCtx): void {
  let from: [number, number, number] = [SKY_LAYOUT.spawn.x, 0, SKY_LAYOUT.spawn.z];
  let side = 1;
  for (const leg of FLIGHT.slice(0, -1)) {
    const to = leg.to;
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      const x = from[0] + (to[0] - from[0]) * t + side * 1.5;
      const y = from[1] + (to[1] - from[1]) * t + 0.5;
      const z = from[2] + (to[2] - from[2]) * t;
      ctx.spawnAt('acorn', x, z, y);
      side = -side;
    }
    from = to;
  }
}

export const ENDING: Chapter = {
  id: 'ending',
  async run(ctx) {
    // 1. Reception, nine o'clock.
    ctx.hud.setCountersVisible(false);
    ctx.setGoal(null);
    ctx.music('hold-music');
    ctx.camera('close');
    ctx.setControls('locked');
    ctx.player.teleport(0, 0, -1.2, Math.PI);
    await ctx.wait(1);

    // 2-3. Hello.
    await ctx.say('secretary', 'Hello.');
    let hellos = 0;
    for (;;) {
      const options = hellos < HELLO_REPLIES.length ? [HELLO, NOT_TAKING] : [NOT_TAKING];
      const pick = await ctx.choose(null, options);
      if (options[pick] !== HELLO) break;
      await ctx.say('secretary', HELLO_REPLIES[hellos]!);
      hellos++;
    }

    // 4-7. Not taking the job.
    await ctx.say('player', NOT_TAKING);
    ctx.sfx('stamp');
    await ctx.say('secretary', 'Oh.', { auto: 1.5 });
    await ctx.lines([
      ['secretary', 'Nobody ever says that. They say hello, and then they go upstairs, and then it\'s nine o\'clock again.'],
      ['secretary', "Was it the interview? Or did you nod off in the chair? People do. It's a very comfortable chair."],
    ]);
    await ctx.choose(null, ["I honestly don't know.", 'Both.']);
    await ctx.say('secretary', "Mm. That's what the last one said. Or the next one.");
    await ctx.say('secretary', "Well. Mind the step. And don't collect anything on your way out.");
    ctx.unlock(ACH.notTaking);

    // 8. The doors open.
    ctx.floor().setFrontDoorOpen(true);
    ctx.sfx('door');
    ctx.camera('follow');
    ctx.setControls('walk');
    ctx.setGoal('Leave.');
    const offSecretary = ctx.onInteract('secretary', () => { void ctx.say('secretary', "Go on. It's lovely out."); });
    await ctx.waitArea('front-door');
    offSecretary();

    // 9. Out into the white light.
    ctx.setControls('locked');
    ctx.setGoal(null);
    await ctx.player.moveTo(0, 0, 9, 1.4);
    await ctx.hud.fade(1, 0.8, '#ffffff');

    // 10. The sky.
    await ctx.goToFloor('sky');
    await ctx.hud.fade(0, 0.8, '#ffffff');
    ctx.music('shellshore');
    ctx.intensity(1);
    ctx.camera('sky');
    ctx.setControls('fly');

    // 11. Optional acorns.
    spawnFlightAcorns(ctx);
    ctx.toast('Acorns (Optional)', 'You can ignore these.');

    // 12. Fly. The narrator speaks along the way (not awaited by the flight).
    void (async () => {
      await ctx.wait(4);
      await ctx.say('narrator', "You don't have to collect those.", { auto: 2.5 });
      await ctx.wait(8);
      await ctx.say('narrator', 'You never did.', { auto: 2.5 });
    })();
    for (const leg of FLIGHT) await ctx.player.moveTo(...leg.to, leg.seconds);

    // 13. Landing on Shellshore: the last few metres are a drop, then dust kicks up and the gnome squashes and settles.
    ctx.setControls('locked');
    await ctx.player.moveTo(BEACH_SPAWN.x, BEACH_SPAWN.y, BEACH_SPAWN.z, 0.6);
    ctx.floor().puff?.(BEACH_SPAWN.x, BEACH_SPAWN.z);
    ctx.sfx('thud');
    ctx.camera('follow');
    await squashAndSettle(ctx);
    ctx.setControls('walk');

    // The beach ball: Kick (E) near it. Roll it off the rim and it lands in the sea: an egg.
    ctx.onInteract('beach-ball', () => {
      const pending = ctx.floor().kickBall?.({ x: ctx.player.pos.x, z: ctx.player.pos.z }, 7);
      if (!pending) return;
      void pending.then(async (where) => {
        if (where !== 'water') return;
        ctx.egg('splash');
        await ctx.say('narrator', 'Out of bounds. The ball is in the sea now. Nobody on Shellshore has ever been that far out.', { auto: 3 });
      });
    });

    // 14. Credits.
    await ctx.wait(2);
    await ctx.hud.credits([
      'THE FINAL COLLECTATHON',
      '',
      'Starring',
      'You',
      '',
      'Primrose Paperweight as Herself',
      'The Interviewer as the Ceiling',
      'Sorrel Gluepot as the Water Cooler',
      'Eight Sleeping Coworkers as Themselves, Asleep',
      '',
      `Collected: ${formatCount(ctx.collect.total)}`,
      'Kept: nothing',
      '',
      'Bucketworth & Sons thank you for your interest in the position.',
      '',
      'Thank you for not taking the job.',
    ]);

    // 15. The rest of their days. Then, faintly:
    await ctx.wait(20);
    await ctx.say('pa', '...Hello?', { auto: 2 });
  },
};
