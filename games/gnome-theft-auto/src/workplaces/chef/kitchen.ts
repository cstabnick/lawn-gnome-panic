// E24 chef: the Route South Acorn Diner kitchen interior. Defines the interior at import (workplaces/index.ts imports it).
// A walk-in kitchen with a pass, Sage Ladle on the kitchen side, Fence-Post Frank on his stool, and three small stories.
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { defineInterior } from '../../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../../interiors/types';
import { CHEF_KITCHEN_ID, CHEF_START_EVENT } from './types';

/** Warm diner: black-and-white floor tone, cream tile walls, red trim. */
const DINER_THEME: InteriorTheme = { floor: 0x3a3a3c, wall: 0xf2e8d0, trim: 0xb3262e, ceiling: 0xf6eedb, light: 0xffd9a0 };

/** Diner prefabs are made by another worker: skipped (not thrown) while missing. */
function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  return kit.put(id, x, z, yaw, opts);
}

function topOf(obj: THREE.Object3D): number {
  return new THREE.Box3().setFromObject(obj).max.y;
}

const PASS_Y = 1.0;
const PAPER = { bg: 0xf5f0e1, fg: 0x263238 };

defineInterior({
  id: CHEF_KITCHEN_ID,
  name: 'Acorn Diner kitchen',
  prompt: 'Enter the Acorn Diner',
  door: { x: 9.6, z: 252, yaw: Math.PI / 2 },
  exit: { x: 8.4, z: 252, yaw: -Math.PI / 2 },
  size: { w: 14, d: 10, h: 3.6 },
  theme: DINER_THEME,
  ambience: 'farmland',
  build(kit) {
    kit.room();
    // Entrance on the west wall (the Route South side), in the dining strip.
    kit.door(-6.8, 2.5, Math.PI / 2);
    kit.window(-6.95, -0.2, Math.PI / 2, 1.6, 1.0, 1.2);
    kit.sign('ACORN DINER\nKITCHEN: STAFF AND FRANK', -6.95, 2.7, 0.6, Math.PI / 2, { w: 2.2, h: 0.7, bg: 0xb3262e, fg: 0xfff3d6 });
    kit.put('rug', -5.4, 2.5, Math.PI / 2, { solid: false, size: 1.4, tint: 0xb3262e });

    // --- The line along the north wall: griddle, fryer, stove with the stock pot, fridge -------------------------
    putIf(kit, 'diner-griddle', -4.6, -4.3, 0);
    putIf(kit, 'diner-fryer', -2.6, -4.3, 0);
    const stove = putIf(kit, 'stove', -0.4, -4.3, 0);
    if (stove) putIf(kit, 'diner-stock-pot', -0.4, -4.3, 0, { y: topOf(stove), solid: false });
    putIf(kit, 'fridge', 5.9, -4.3, 0);

    // Prep counter with the chopping board.
    kit.block(2.4, 0.9, 0.8, 2.2, -4.5, { color: 0xcfd8dc });
    putIf(kit, 'diner-chopping-board', 2.2, -4.5, 0, { y: 0.9, solid: false });
    putIf(kit, 'diner-dish-rack', 3.8, -4.6, 0, { y: 0.9, solid: false });

    // --- The pass: a counter across the middle with a walkway gap at the west end ---------------------------------
    kit.block(9, PASS_Y, 0.7, 2.0, 0.5, { color: 0xb3262e });
    kit.block(9.1, 0.06, 0.8, 2.0, 0.5, { y: PASS_Y, color: 0xe6ded0, solid: false });
    putIf(kit, 'diner-hatch-shelf', 2.0, 0.5, 0, { y: PASS_Y + 0.06, solid: false });
    putIf(kit, 'diner-pass-bell', 0.2, 0.5, 0, { y: PASS_Y + 0.06, solid: false });
    putIf(kit, 'diner-order-spike', 5.2, 0.5, 0, { y: PASS_Y + 0.06, solid: false });
    putIf(kit, 'diner-ticket-rail', 1.0, -0.4, 0, { y: 1.9, solid: false });

    // --- Sage Ladle at the pass (kitchen side) and the work spot --------------------------------------------------
    kit.npc({
      id: 'sage-ladle',
      name: 'Sage Ladle',
      x: 1.0,
      z: -1.0,
      yaw: 0,
      look: { hat: 0x7da87b, shirt: 0xfafafa, beard: 0xe0e0e0 },
      line: "Apron's on the hook. Tickets are on the rail.",
    });
    kit.spot({
      id: 'chef-work',
      x: -0.6,
      z: -0.8,
      prompt: 'Work a shift (chef)',
      run() {
        window.dispatchEvent(new CustomEvent(CHEF_START_EVENT));
      },
    });

    // --- Fence-Post Frank beyond the hatch, with two stools ---------------------------------------------------------
    kit.put('bar-stool', 3.2, 1.7, 0);
    kit.put('bar-stool', 5.0, 1.7, 0);
    kit.npc({
      id: 'diner-frank',
      name: 'Fence-Post Frank',
      x: 3.2,
      z: 1.7,
      yaw: Math.PI,
      sit: true,
      look: { hat: 0x6d4c41, shirt: 0x8d6e63, beard: 0xbcaaa4 },
      line: "Is it hot? Make it hot. I'll wait. I always wait.",
    });

    // --- Vignette 1: the washing-up mountain by the sink ------------------------------------------------------------
    const sink = kit.put('sink', 6.2, -1.6, -Math.PI / 2);
    let y = topOf(sink);
    for (const [id, dx] of [['mixing-bowl', 0], ['cake-pan', 0.04], ['mixing-bowl', -0.03], ['glaze-pot', 0.02]] as const) {
      const o = putIf(kit, id, 6.2 + dx, -1.6, dx * 20, { y, solid: false, size: 0.4 });
      if (o) y = topOf(o);
    }
    putIf(kit, 'diner-rubber-glove', 6.2, -1.6, 0.4, { y, solid: false });
    kit.put('bar-stool', 5.2, -1.9, 0.6);
    kit.sign('STAFF MUST WASH HATS', 6.95, 2.0, -3.0, -Math.PI / 2, { w: 1.5, h: 0.4, ...PAPER });

    // --- Vignette 2: Frank's corner at the east end of the pass ---------------------------------------------------------
    putIf(kit, 'cocoa-mug', 6.3, 1.3, 0, { y: 1.35, solid: false, size: 0.18 });
    kit.sign('FRANK', 6.3, 1.2, 1.9, Math.PI, { w: 0.5, h: 0.18, bg: 0xb3262e, fg: 0xfff3d6 });
    putIf(kit, 'newspaper', 5.9, 0.5, 0.3, { y: PASS_Y + 0.06, solid: false });
    putIf(kit, 'newspaper', 5.95, 0.52, -0.2, { y: PASS_Y + 0.08, solid: false });
    putIf(kit, 'diner-pie', 6.4, 0.5, 0, { y: PASS_Y + 0.06, solid: false });
    kit.sign('THE BELL IS NOT A TOY\n- FRANK', 0.2, 1.9, 0.9, Math.PI, { w: 1.5, h: 0.5, ...PAPER });

    // --- Vignette 3: the burnt-toast shrine under the heat lamp, west of the line -----------------------------------------
    kit.block(1.0, 0.9, 0.7, -6.3, -4.5, { color: 0xcfd8dc });
    putIf(kit, 'diner-heat-lamp', -6.3, -4.5, 0, { y: 0.9, solid: false });
    const toaster = putIf(kit, 'cursed-toaster', -6.3, -4.5, 0.3, { y: 0.9, solid: false, size: 0.3 });
    if (!toaster) putIf(kit, 'bread-loaf', -6.3, -4.5, 0.3, { y: 0.9, solid: false });
    putIf(kit, 'diner-fire-blanket', -6.85, -3.3, Math.PI / 2, { y: 1.3, solid: false });
    kit.sign('NEVER AGAIN', -6.95, 2.0, -4.2, Math.PI / 2, { w: 1.2, h: 0.4, bg: 0x2b2b2b, fg: 0xff8a65 });

    // --- Signs -------------------------------------------------------------------------------------------------------------
    kit.sign('TODAY: SOUP.\nTOMORROW: ALSO SOUP.', -3.6, 2.2, -4.95, 0, { w: 2.0, h: 0.8, bg: 0x263238, fg: 0xf5f5dc });
    kit.sign('GRUB-FREE KITCHEN\n(DO NOT ASK)', 4.4, 2.5, -4.95, 0, { w: 1.9, h: 0.6, ...PAPER });
    kit.sign('ROTA\nMON SAGE  TUE SAGE\nWED SAGE  THU SAGE\nFRI SAGE  SAT SAGE', -1.6, 2.3, -4.95, 0, { w: 2.0, h: 1.0, ...PAPER });
    kit.put('lamp', -6.2, 1.0, 0, { solid: false });
  },
});
