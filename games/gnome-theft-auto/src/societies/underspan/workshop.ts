// Hogweed's Workshop (E17 issue B2): the Underspan's walk-in interior (SOCIETY_INTERIORS.workshop) with the Updraft.
// Defined at import time (societies/index.ts imports this file). The room is rebuilt on every entry.
import { getPrefab } from '@lawn/prefabs';
import { defineInterior, interiorToWorld, type InteriorTheme, type PutOpts } from '../../interiors';
import { playAt } from '../../sound/bus';
import { SOCIETY_CAST, SOCIETY_INTERIORS, UNDERSPAN, WORKSHOP_ROOM } from '../config';

const THEME: InteriorTheme = {
  floor: 0x4a4d50, // oily concrete grey
  wall: 0x7a4a2e, // rust-brown corrugated
  trim: 0x9aa3a8, // galvanised grey
  ceiling: 0x1e2124, // dark
  light: 0xffcf8a, // warm
};

const [ux, uz] = WORKSHOP_ROOM.updraft;
const [bx, bz] = WORKSHOP_ROOM.bench;
const [cx, cz] = WORKSHOP_ROOM.dewdropCradle;
const northWall = -WORKSHOP_ROOM.size.d / 2 + 0.05;
const southWall = WORKSHOP_ROOM.size.d / 2 - 0.05;
const westWall = -WORKSHOP_ROOM.size.w / 2 + 0.05;
const POSTER = { bg: 0xf5f0e1, fg: 0x263238 };

defineInterior({
  id: SOCIETY_INTERIORS.workshop,
  name: "Hogweed's Workshop",
  door: UNDERSPAN.workshopDoor,
  exit: UNDERSPAN.workshopExit,
  size: WORKSHOP_ROOM.size,
  theme: THEME,
  ambience: 'city',
  prompt: "Enter Hogweed's Workshop",
  build(kit) {
    // Only prefabs that exist (the catalog may lag behind the layout); kit.put would warn about a missing one.
    const put = (id: string, x: number, z: number, yaw = 0, opts?: PutOpts): void => {
      if (getPrefab(id)) kit.put(id, x, z, yaw, opts);
    };

    kit.room();
    kit.door(WORKSHOP_ROOM.door[0], WORKSHOP_ROOM.door[1], WORKSHOP_ROOM.doorYaw);

    // The Updraft and the way up to the Roost.
    put('updraft-lift', ux, uz, 0);
    kit.stairsTo(
      ux - 1.6,
      uz,
      { x: UNDERSPAN.roostArrive.x, y: UNDERSPAN.roostY, z: UNDERSPAN.roostArrive.z, yaw: UNDERSPAN.roostArrive.yaw },
      'Ride the Updraft',
    );
    kit.sign('THE UPDRAFT\nMk. 7 (Mk. 1-6: ask Nettle)\nKEEP ARMS IN UMBRELLA', ux, 2.6, northWall, 0, { w: 2.4, h: 1.0 });

    // Hogweed's bench, the spool table with blueprints, the citation post and Nettle's hammock.
    put('welding-bench', bx, bz, 0);
    put('spool-table', -3.5, -4, 0);
    put('citation-post', -6.5, -6.6, 0);
    put('workshop-hammock', -9.2, -6.6, Math.PI / 2);

    // The Dewdrop's empty cradle (E18 fills it).
    put('dewdrop-cradle', cx, cz, 0);
    kit.sign('DEWDROP: PENDING\n(DO NOT ASK)', cx, 1.3, cz + 1.6, 0, { w: 1.6, h: 0.6 });

    // Clutter along the walls, kept clear of the door.
    put('underspan-scrap-heap', -8, 6.2, 0.4, { size: 2.5 });
    put('pedal-generator', -4.2, 6.4, 0);
    put('bookshelf', 10.4, -2.4, -Math.PI / 2);
    put('crate', 9.4, 2.0, -0.5);
    put('crate', -10, 3.6, 0.3);

    // Posters and the chalkboard.
    kit.sign('A RULE IS ONLY A PROTOTYPE\nNOBODY TESTED', -6, 2.2, southWall, Math.PI, { w: 2.4, h: 0.8, ...POSTER });
    kit.sign("TODAY'S INVENTION:\nTOMORROW'S CITATION", -1.5, 2.2, southWall, Math.PI, { w: 2.4, h: 0.8, ...POSTER });
    kit.sign('THINGS THAT STAYED UP:\n1. the Span (barely)\n2. Nettle (once)', westWall, 1.8, -4.6, Math.PI / 2, {
      w: 2.4, h: 1.4, bg: 0x2b3a2b, fg: 0xf0f0e0,
    });

    // Residents. Hogweed himself stands outside.
    kit.npc({
      id: 'teasel', name: SOCIETY_CAST.teasel, x: bx, z: bz + 1.7, yaw: Math.PI,
      look: { hat: 0x3a3a3a, shirt: 0x6b4a2e, beard: 0x888888, glasses: true },
      line: 'Visor stays down. The sparks are part of the design.',
    });
    kit.npc({
      id: 'vetch', name: SOCIETY_CAST.vetch, x: -8.8, z: -4.6, yaw: -Math.PI / 2,
      look: { hat: 0x2f4f4f, shirt: 0xb0b7bd, beard: 0x5c4b3a },
      line: "I'm drafting the manifesto. It has a footnote longer than the Span.",
    });
  },
  onEnter() {
    const [x, z] = interiorToWorld(SOCIETY_INTERIORS.workshop, bx, bz);
    playAt('weld-crackle', { x, z });
  },
});
