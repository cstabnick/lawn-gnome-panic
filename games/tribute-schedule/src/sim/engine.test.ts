import { describe, expect, it } from 'vitest';
import { parseRawShitposts } from '../lore/parser';
import { getActiveLore } from '../lore/registry';
import { createSim, stepSim } from './engine';
import type { SimInput } from './types';

function emptyInput(): SimInput {
  return {
    moveX: 0,
    moveZ: 0,
    lookYawDelta: 0,
    lookPitchDelta: 0,
    interact: false,
    nod: false,
    chirp: false,
    toggleFlashlight: false,
  };
}

describe('parseRawShitposts', () => {
  it('parses Discord timestamps, whalebot prefixes, and classifies entities & scams', () => {
    const raw = `
[12:06 PM]whalebot The cone has started humming at 3am.
[1:12 AM]whalebot-dev we are getting scammed at six price points nowview prompt
[2:00 AM]whalebot offering log: sourdough (accepted)
    `;
    const pack = parseRawShitposts(raw, 'custom', 'Test Paste');
    expect(pack.whispers.length).toBe(3);
    expect(pack.whispers[0].entity).toBe('cone');
    expect(pack.scams.length).toBe(1);
    expect(pack.tributes.length).toBe(1);
    expect(pack.tributes[0].accepted).toBe(true);
  });
});

describe('tribute-schedule sim', () => {
  it('advances time to 6:00 AM survival when threats are managed', () => {
    const lore = getActiveLore();
    const sim = createSim(42, lore);

    for (let i = 0; i < 2500; i++) {
      const inp = emptyInput();
      if (sim.fridge.phase === 'waiting_nod') inp.nod = true;
      if (sim.smokeDetector.blinks === 2) inp.chirp = true;
      // Keep dread low to test full 6am completion
      if (sim.dread > 60) sim.dread = 20;
      stepSim(sim, inp, 0.1, lore);
      if (sim.outcome !== 'playing') break;
    }

    expect(sim.outcome).toBe('survived');
    expect(sim.hour).toBe(6);
  });

  it('triggers three_blinks game over if smoke detector double-blink is ignored', () => {
    const lore = getActiveLore();
    const sim = createSim(7, lore);
    sim.smokeDetector.blinks = 2;
    sim.smokeDetector.soonTimer = 1.0;

    for (let i = 0; i < 20; i++) {
      stepSim(sim, emptyInput(), 0.1, lore);
      if (sim.outcome !== 'playing') break;
    }

    expect(sim.outcome).toBe('three_blinks');
    expect(sim.smokeDetector.blinks).toBe(3);
  });
});
