// Chapter 1: Orientation. The collectathon tutorial: a trail of acorns, Golden Acorns on the filing cabinets,
// a Skip Tutorial button that does nothing, and a display acorn that is not for collecting.
import type { Chapter, ChapterCtx } from '../types';
import { F1_PLINTH_TOP } from '../floors/f1';

const CABINET_TOP = 1.32;
const DISPLAY = { x: 10, z: -7 };

const SKIP_LINES = [
  'There is no skipping. The tutorial is the job.',
  'You pressed it again. Noted, on your file.',
  'The button is decorative. Like a lot of things on this floor.',
  "Pressing it harder does not help. We've measured.",
];

function wireSkip(ctx: ChapterCtx): void {
  let n = 0;
  ctx.hud.setSkipButton('Skip Tutorial', () => {
    n++;
    if (n <= SKIP_LINES.length) { void ctx.say('narrator', SKIP_LINES[n - 1]); return; }
    if (n === 10) {
      ctx.hud.setSkipButton('Skip Skip Tutorial');
      void ctx.say('narrator', 'Fine. You have skipped skipping the tutorial. Carry on.');
      ctx.egg('skip-tutorial');
      return;
    }
    ctx.sfx('denied');
  });
}

export const CH1: Chapter = {
  id: 'ch1',
  async run(ctx) {
    ctx.music('hold-music');
    const unsubs: (() => void)[] = [];

    // 7. The clock, all chapter.
    unsubs.push(ctx.onInteract('clock', () => { void ctx.say('narrator', "Don't mind the clock. It's always nine here."); }));

    // 1. Welcome.
    await ctx.lines([
      ['narrator', "Ah. The applicant. Welcome to Bucketworth & Sons. I'm the Interviewer. I'll be in the ceiling."],
      ['narrator', 'This is Floor 1, Orientation. Every great career begins the same way: with a line of acorns leading somewhere.'],
    ]);

    // 2. The Skip button that does not skip.
    wireSkip(ctx);

    // The goal line follows the current phase.
    let goal: () => string = () => `Acorns: ${ctx.count('acorn')}/20`;
    const refreshGoal = () => ctx.setGoal(goal());

    // 3. The trail.
    ctx.spawnLine('acorn', 10, { x: 0, z: -7 }, { x: 0, z: -1 });
    ctx.spawnLine('acorn', 10, { x: 1, z: 0 }, { x: 8, z: 4 });

    // 5. The display acorn, set up now so it can be collected any time.
    ctx.spawnAt('acorn', DISPLAY.x, DISPLAY.z, F1_PLINTH_TOP + 0.35);
    const offPlinth = ctx.onArea('plinth', () => {
      offPlinth();
      void ctx.say('narrator', "That acorn is not for collecting. It's a display acorn. It's been there since the founding.");
    });
    unsubs.push(offPlinth);

    let saidOne = false;
    let saidTen = false;
    let tookDisplay = false;
    unsubs.push(ctx.onPickup((p) => {
      if (!tookDisplay && p.kind === 'acorn' && Math.hypot(p.x - DISPLAY.x, p.z - DISPLAY.z) <= 0.6) {
        tookDisplay = true;
        ctx.egg('do-not-collect');
        void ctx.say('narrator', "You collected it. Of course you did. That's the job, isn't it. I'll put it on your file as initiative.");
      }
      const acorns = ctx.count('acorn');
      if (!saidOne && acorns >= 1) {
        saidOne = true;
        void ctx.say('narrator', "Wonderful. That's one. The industry standard is somewhere between three hundred and all of them.");
      }
      if (!saidTen && acorns >= 10) {
        saidTen = true;
        void ctx.say('narrator', "Ten. You're a natural. Or you have a pulse. We test for either.");
      }
      refreshGoal();
    }));
    refreshGoal();

    await ctx.waitCount('acorn', 20);
    await ctx.say('narrator', 'Twenty. On to the advanced material.');

    // 4. Golden Acorns on the filing cabinets.
    for (const z of [-6, -3, 0, 3, 6]) ctx.spawnAt('golden-acorn', -12.8, z, CABINET_TOP + 0.35);
    goal = () => `Golden Acorns: ${ctx.count('golden-acorn')}/5`;
    refreshGoal();
    await ctx.lines([
      ['narrator', "These are Golden Acorns. They're on top of the filing cabinets, because that's where gold goes."],
      ['narrator', 'Jump on the desk, then the cabinet. Space, or the Jump button. Nobody said Collector was a desk job. Well, it is. But you stand on the desk.'],
    ]);
    await ctx.waitCount('golden-acorn', 5);
    await ctx.say('narrator', "Five Golden Acorns. In some companies, that's a pension.");

    // 6. The sweep.
    ctx.spawn('acorn', 25, 'open-plan');
    goal = () => `Acorns: ${ctx.count('acorn')}/45`;
    refreshGoal();
    await ctx.say('narrator', "Now the rest. Twenty-five acorns, scattered about. We scatter them every morning. Then we collect them. Then it's morning again.");
    await ctx.waitCount('acorn', 45);

    // 8. Oriented.
    for (const u of unsubs) u();
    ctx.setGoal(null);
    await ctx.lines([
      ['narrator', "That's every acorn on Floor 1. Orientation complete. You are now oriented."],
      ['narrator', 'Upstairs is Onboarding. It has more things on it. Things are good. Take the lift.'],
    ]);
    ctx.hud.setSkipButton(null);
    await ctx.rideElevator('f2');
  },
};
