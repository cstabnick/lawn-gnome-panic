// The big tent at Wader's Rest (E17 issue B5): the walk-in interior SOCIETY_INTERIORS.tent. Mother Saxifrage's grey
// canvas hall: the shrine to the Lady, mats in a ring, the rota of rules, reed tea, and two Flock members inside.
// Defined at import time (societies/index.ts imports this file). No chairs anywhere: no sitting on Tuesdays.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { defineInterior, type InteriorKit } from '../../interiors';
import { SOCIETY_CAST, SOCIETY_INTERIORS, TENT_ROOM, WADERS_REST } from '../config';

const N = Math.PI;
const E = Math.PI / 2;
const W = -Math.PI / 2;

const MAT_COUNT = 8;
const MAT_RING_R = 4;
const MAT_SIZE = 1.4;
const MAT_LIFT = 0.03;
const MAT_COLOUR = 0x8a8f94;

/** Eight flat grey mats in a ring round the room centre (not solid: you walk over them). */
function buildMats(kit: InteriorKit): void {
  const geo = new THREE.PlaneGeometry(MAT_SIZE, MAT_SIZE);
  const mat = flatLayer(new THREE.MeshStandardMaterial({ color: MAT_COLOUR, roughness: 0.95 }), LAYER.marking);
  for (let i = 0; i < MAT_COUNT; i++) {
    const a = (i / MAT_COUNT) * Math.PI * 2;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(Math.sin(a) * MAT_RING_R, MAT_LIFT, Math.cos(a) * MAT_RING_R);
    mesh.name = 'tent-mat';
    kit.group.add(mesh);
  }
}

defineInterior({
  id: SOCIETY_INTERIORS.tent,
  name: 'The Big Tent',
  door: WADERS_REST.tentDoor,
  exit: WADERS_REST.tentExit,
  size: TENT_ROOM.size,
  theme: {
    floor: 0xc8b07a, // rush matting, tan
    wall: 0xd9dcd6, // pale grey canvas
    trim: 0x8a7257, // weathered wood
    ceiling: 0x9aa0a6, // grey canvas
    light: 0xf2efe6, // soft
  },
  ambience: 'loch',
  prompt: 'Enter the Big Tent',
  build(kit) {
    kit.room();
    kit.door(TENT_ROOM.door[0], TENT_ROOM.door[1], TENT_ROOM.doorYaw);

    // The shrine to the Lady on the south side, facing the door; a one-leg stone in front of it.
    const [sx, sz] = TENT_ROOM.shrine;
    kit.put('lady-shrine', sx, sz, N);
    kit.put('one-leg-stone', sx, sz - 1.2, 0, { solid: false });

    // The mats in a ring.
    buildMats(kit);

    // Along the canvas walls: the reed tea urn, the rota board, two banners. The middle of the floor stays open.
    kit.put('reed-tea-urn', -6.5, 4, 0);
    kit.put('rota-board', 7.4, -2, -E);
    kit.put('flock-banner', -7.3, -5, E);
    kit.put('flock-banner', 7.3, 4, W);

    // Signs: the rules on the west wall, today's tick-box on the north wall, the prophecy on the south wall.
    kit.sign(
      'THE RULES (as kept)\n1. One leg at every sermon\n2. No sitting on Tuesdays\n3. Pink is for the Lady only\n'
        + '4. Never turn your back on her to eat\n5. A wobble is a thought; a thought is a cup of reed tea',
      -7.9, 2.5, -2, E,
      { w: 3.6, h: 2.5, bg: 0xf5f2ea, fg: 0x2b2f33 },
    );
    kit.sign(
      'TODAY IS:\n[ ] TUESDAY\n[ ] NOT TUESDAY\n(tick one, carefully)',
      -4.5, 2.6, -7.9, 0,
      { w: 2.4, h: 1.3, bg: 0xf5f2ea, fg: 0x2b2f33 },
    );
    kit.sign(
      'PROPHECIES THIS WEEK:\nthe Even Cut, on the longest day.\nAlso rain.',
      0, 2.6, 7.9, N,
      { w: 3.0, h: 1.2, bg: 0xf5f2ea, fg: 0x2b2f33 },
    );

    // Two residents. Sister Plover stands by the rules board (facing it); Novice Pipit stands on a mat.
    const grey = { shirt: 0x8d9096, hat: 0x9aa0a8 };
    kit.npc({
      id: 'plover',
      x: 5.6,
      z: -2,
      yaw: E,
      name: SOCIETY_CAST.plover,
      look: { ...grey, beard: null },
      line: 'Rule six is under discussion. It has been under discussion since the spring.',
    });
    kit.npc({
      id: 'pipit',
      x: 0,
      z: -4,
      yaw: 0,
      name: SOCIETY_CAST.pipit,
      look: { ...grey, beard: 0x7a5c3e },
      line: 'Which leg is it? Mother says either. I keep picking the wrong either.',
    });
  },
});
