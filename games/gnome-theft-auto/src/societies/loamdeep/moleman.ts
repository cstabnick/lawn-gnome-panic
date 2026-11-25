// DJ Moleman's burrow (E17 issue B12): the hidden interior SOCIETY_INTERIORS.moleman at the bottom of the Long Tunnel.
// One long record plays through speakers dug into the soil. Listen at his decks; he says a line; the Long Tunnel goes
// back up to Loamdeep. defineInterior runs at import time (societies/index.ts imports this file).
import { getPrefab } from '@lawn/prefabs';
import { defineInterior, enterInterior } from '../../interiors';
import type { InteriorKit } from '../../interiors/types';
import { LOAMDEEP, MOLEMAN_BURROW, SOCIETY_INTERIORS } from '../config';
import { updateSocietySave } from '../save';
import { markLongTunnelArrival } from './interior';

const THEME = {
  floor: 0x3b2a1c,   // packed dark earth
  wall: 0x4a2f1f,    // deep brown walls
  trim: 0xb08d3a,    // brass
  ceiling: 0x0d0a08, // black
  light: 0xc07a2a,   // deep amber
};

const LINES = [
  'Seat. Hear it? That\'s your heart, catching up.',
  'The family wants me home for supper. The family always wants me home for supper. I am home. It\'s just further down.',
  'A tunnel has no gaps in it, so the set has none either.',
  'Every record here was dug up by hand. Some of them were dug up by a mole. I am the mole.',
  'You can stand right on the speaker. Everybody does. It tickles, if it pleases you.',
];
let lineIdx = 0;

function say(line: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name: 'DJ Moleman', line } }));
  }
}

/** Puts a prefab if it exists (E17 prefabs land in parallel: a missing one is skipped, not fatal). */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw: number, opts?: Parameters<InteriorKit['put']>[4]): void {
  if (getPrefab(id)) kit.put(id, x, z, yaw, opts);
}

const { size, decks, moleman, arrive, stairsBack } = MOLEMAN_BURROW;

defineInterior({
  id: SOCIETY_INTERIORS.moleman,
  name: "DJ Moleman's Burrow",
  door: LOAMDEEP.door,
  exit: LOAMDEEP.exit,
  size,
  theme: THEME,
  ambience: 'silent',
  hiddenDoor: true,
  onEnter() {
    say('Oh. A visitor. Mind the cable.');
  },
  build(kit) {
    kit.room({ theme: THEME });
    kit.spawn(arrive[0], arrive[1], Math.PI);

    // His decks against the north wall, him behind them facing south.
    putIf(kit, 'moleman-decks', decks[0], decks[1], 0);
    putIf(kit, 'dj-moleman', moleman[0], moleman[1], 0, { solid: false });

    // Speakers dug into the soil in the north corners.
    putIf(kit, 'dug-speaker', -6.6, -6.2, 0);
    putIf(kit, 'dug-speaker', 6.6, -6.2, 0);

    // Crates of records along the east wall.
    putIf(kit, 'root-crate', 7.6, 1.5, -Math.PI / 2);
    putIf(kit, 'root-crate', 7.6, 2.6, -Math.PI / 2);
    putIf(kit, 'root-crate', 6.4, 2.0, -Math.PI / 2);

    // A moss rug on the floor in front of the decks.
    putIf(kit, 'moss-rug', 0, -1.5, 0, { solid: false });

    // The thick cable up into the ceiling, with its sign. Plain architecture (no prefab fits a cable).
    kit.block(0.14, 3.6, 0.14, 3.5, -6.6, { solid: false, color: 0x161616 });
    kit.sign('NOT THE TRANSMITTER', 3.5, 1.5, -6.4, 0, { w: 1.0, h: 0.28, bg: 0x2a1d10, fg: 0xf2d27a });

    // Wall signs.
    kit.sign('THE FLOOR YOU ARE STANDING ON IS THE SPEAKER', -8.85, 1.7, 1.5, Math.PI / 2, { w: 2.2, h: 0.55, bg: 0x2a1d10, fg: 0xf2d27a });
    kit.sign('TO CRESS,\nFROM BELOW', 8.85, 1.6, -2.5, -Math.PI / 2, { w: 1.1, h: 0.7, bg: 0x5a3b22, fg: 0xf6e6c0 });
    kit.sign("PLEASE DO NOT SAY 'MOWER' AND 'KICK DRUM' IN THE SAME BREATH. SAY 'SEAT'.", 8.85, 1.6, 3.5, -Math.PI / 2, { w: 2.4, h: 0.6, bg: 0x2a1d10, fg: 0xf2d27a });

    // Lamps on both side walls.
    putIf(kit, 'mole-lamp-lit', -8.8, -1.5, Math.PI / 2, { y: 1.8, solid: false });
    putIf(kit, 'mole-lamp-lit', -8.8, 4.5, Math.PI / 2, { y: 1.8, solid: false });
    putIf(kit, 'mole-lamp-lit', 8.8, -1.5, -Math.PI / 2, { y: 1.8, solid: false });
    putIf(kit, 'mole-lamp-lit', 8.8, 4.5, -Math.PI / 2, { y: 1.8, solid: false });

    // Listen at the decks: 1.6 m south of them.
    kit.spot({
      id: 'listen-decks',
      x: decks[0],
      z: decks[1] + 1.6,
      prompt: 'Listen at the decks',
      run() {
        updateSocietySave((s) => { s.molemanMet++; });
        say(LINES[lineIdx]);
        lineIdx = (lineIdx + 1) % LINES.length;
      },
    });

    // Back up the Long Tunnel.
    kit.spot({
      id: 'back-up',
      x: stairsBack[0],
      z: stairsBack[1],
      prompt: 'Back up the Long Tunnel',
      run() {
        markLongTunnelArrival();
        enterInterior(SOCIETY_INTERIORS.loamdeep);
      },
    });
  },
});
