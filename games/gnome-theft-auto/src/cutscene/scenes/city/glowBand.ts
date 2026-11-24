// city-glow-band-express: the intro (city-glow-band-express-intro, at the Kerbside Exchange, night) and the payoff
// (city-glow-band-express-outro, at the Amphitheater, night). Nina is the client; Dot runs the board; the Velvet
// Toadstools are the band on the dais. Barnaby Jr. (the luna moth) has no prop: he is heard, not seen.
// Quest: quests/cityQuests.ts (city-glow-band-express). Stages: quests/stages/turftonC.ts (kerb-exchange) and
// quests/stages/turftonB.ts (amphitheater).
import { heightAt } from '../../../terrain';
import type { ScriptActor, SceneScript, Vec3 } from '../../script';
import { markOf, spot } from '../story/kit';
import { beat, coverage, cut, exchangeLooks, shot } from '../../direct';

const KERB = 'kerb-exchange';
const AMPH = 'amphitheater';

const DOT = markOf(KERB, 'dot');
const KERB_PLAYER = markOf(KERB, 'player');
const CLIENT = markOf(KERB, 'client');

const ARENA_PLAYER = markOf(AMPH, 'player');
const ARENA_NINA = markOf(AMPH, 'nina');
// The dais is raised (the stage marks carry a 1.2 m lift): stand the band on top of it, not inside it.
const DAIS_LIFT = 1.2;
const onDais = (n: number): { at: Vec3; yaw: number } => {
  const m = markOf(AMPH, 'toadstool', n);
  return { at: [m.at[0], heightAt(m.at[0], m.at[1]) + DAIS_LIFT, m.at[1]], yaw: m.yaw };
};
const DAIS_A = onDais(0);
const DAIS_B = onDais(1);

// Intro: Dot and Nina share one side of the line across the desk; the player gets his own coverage against Dot.
const DESK = coverage('dot', 'nina', 1);
const YOU = coverage('you', 'dot', 1);
// Outro: Nina and the player on the arena floor; the camera stays on the tiers' side so both faces read.
const ARENA = coverage('nina', 'you', -1);

const NINA: ScriptActor = { id: 'nina', preset: 'nina', at: CLIENT.at, yaw: CLIENT.yaw };

export const GLOW_BAND_INTRO: SceneScript = {
  id: 'city-glow-band-express-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  title: 'Glow-Band Express',
  music: 'warm',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: KERB_PLAYER.at, yaw: KERB_PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
    NINA,
  ],
  steps: [
    // Hook: Dot's whistle at the desk, then the board is set: Dot and Nina face each other across the desk.
    cut(spot(KERB, 'wide')),
    { do: 'sfx', id: 'whistle', at: 'dot' },
    { do: 'wait', s: 1.2 },
    ...exchangeLooks('dot', 'nina'),
    cut(DESK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Next! Nina, you are first on the board tonight.' },
    cut(DESK.single('nina', 'mcu')),
    { do: 'say', who: 'nina', text: 'Sugar, the Velvet Toadstools reunite tonight at the Amphitheater.' },
    cut(YOU.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Glow-bands on a push-bike, across town?' },
    cut(DESK.single('nina', 'mcu')),
    { do: 'say', who: 'nina', text: 'The moth is coming too. He insists, sugar.' },
    // The moth headbutts the sign; Nina shoos him off mid-line.
    { do: 'sfx', id: 'bump' },
    cut(DESK.single('nina', 'mcu')),
    { do: 'say', who: 'nina', text: 'Barnaby Jr., no! Not the sign!' },
    cut(YOU.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Who is Barnaby?' },
    cut(DESK.single('nina', 'mcu')),
    { do: 'say', who: 'nina', text: 'My mortal enemy. Do not ask about the lights.' },
    cut(DESK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Clock starts when you leave her stoop. Mind the moth.' },
    cut(YOU.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Ninety seconds, on a push-bike. Got it.' },
    cut(DESK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Bike is by the kerb, lights on. Off you go.' },
    // The button: Nina, already halfway down the pavement, shooing the moth.
    cut(DESK.single('nina', 'mcu')),
    { do: 'say', who: 'nina', text: 'Lights on the bike, sugar. Let\'s glow.' },
    beat('pause'),
  ],
};

export const GLOW_BAND_OUTRO: SceneScript = {
  id: 'city-glow-band-express-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'turfton',
  ambience: 'crowd',
  actors: [
    { id: 'you', player: true, at: ARENA_PLAYER.at, yaw: ARENA_PLAYER.yaw },
    { ...NINA, at: ARENA_NINA.at, yaw: ARENA_NINA.yaw },
    {
      id: 'toad1',
      name: 'Velvet Toadstool',
      look: { hat: 0xc0243a, shirt: 0x1c1c2a, beard: 0xe6e6e6, glasses: true },
      at: DAIS_A.at,
      yaw: DAIS_A.yaw,
    },
    {
      id: 'toad2',
      name: 'Velvet Toadstool',
      look: { hat: 0xf2e6c8, shirt: 0xc0243a, beard: null },
      at: DAIS_B.at,
      yaw: DAIS_B.yaw,
    },
  ],
  steps: [
    // Hook: the band cheers on the dais under a wide shot of the tiers.
    { do: 'stinger', id: 'triumph' },
    cut(spot(AMPH, 'wide')),
    { do: 'gesture', who: 'toad1', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'toad2', name: 'cheer', s: 1.6 },
    beat('pause'),
    // Nina counts the take, one glow-band at a time.
    cut(ARENA.single('nina', 'mcu')),
    { do: 'gesture', who: 'nina', name: 'think', s: 1.4, async: true },
    { do: 'say', who: 'nina', text: 'Forty-two glow-bands sold, sugar. The moth ate one.' },
    beat('beat'),
    cut(ARENA.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Every hat in the tiers is glowing.' },
    // The band's button: the song again, from the top.
    cut(shot('toad1', 'mcu', { toward: 'you' })),
    { do: 'say', who: 'toad1', text: 'Once more, from the top: "Don\'t Mow My Baby Down."' },
    beat('pause'),
  ],
};

export const GLOW_BAND_SCENES: SceneScript[] = [GLOW_BAND_INTRO, GLOW_BAND_OUTRO];
