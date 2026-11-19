import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGnomeModel } from '@lawn/gnome';
import { PLAYER_LOOK } from '../config';
import { applyAttackAndBlockPose, attachGnomeCosmetics, BLOCK_SECONDS, SWING_SECONDS } from '../playerVisuals';
import {
  ANIM_SITTING,
  ANIM_SMOKING,
  ANIM_TIPSY,
  readAnimFlags,
  readAttackKind,
  readBlockCount,
} from './protocol';

describe('player animation sync protocol validators', () => {
  it('validates and masks animation bitflags', () => {
    const all = ANIM_SITTING | ANIM_SMOKING | ANIM_TIPSY;
    expect(readAnimFlags(all)).toBe(all);
    expect(readAnimFlags(ANIM_SMOKING)).toBe(ANIM_SMOKING);
    expect(readAnimFlags(0xff)).toBe(all);
    expect(readAnimFlags(-1)).toBe(0);
    expect(readAnimFlags('bad')).toBe(0);
    expect(readAnimFlags(undefined)).toBe(0);
  });

  it('validates attack kinds and block counters', () => {
    expect(readAttackKind('chop')).toBe('chop');
    expect(readAttackKind('thrust')).toBe('thrust');
    expect(readAttackKind('ranged')).toBe('ranged');
    expect(readAttackKind('cast')).toBe('cast');
    expect(readAttackKind('unknown')).toBe('chop');
    expect(readAttackKind(undefined)).toBe('chop');

    expect(readBlockCount(5)).toBe(5);
    expect(readBlockCount(5.9)).toBe(5);
    expect(readBlockCount(-2)).toBe(0);
    expect(readBlockCount(undefined)).toBe(0);
  });
});

describe('shared gnome cosmetics and combat poses', () => {
  it('shows smoking cig, spawns smoke puffs, animates puff/sip gestures, and cleans up on dispose', () => {
    const scene = new THREE.Scene();
    const model = createGnomeModel(PLAYER_LOOK);
    scene.add(model.object);
    const rigChildrenBefore = model.rig.children.length;
    const armChildrenBefore = model.arms.right.children.length;

    const cosmetics = attachGnomeCosmetics(model, scene);
    const cigGroup = model.rig.children[rigChildrenBefore];
    const beerGroup = model.arms.right.children[armChildrenBefore];
    expect(cigGroup).toBeDefined();
    expect(beerGroup).toBeDefined();
    expect(cigGroup.visible).toBe(false);
    expect(beerGroup.visible).toBe(false);

    // Start smoking -> cig becomes visible, puff gesture lifts right arm, smoke puff appears.
    cosmetics.triggerPuff();
    cosmetics.update(0.4, { dead: false, smoking: true, tipsy: false, swinging: false });
    expect(cigGroup.visible).toBe(true);
    expect(beerGroup.visible).toBe(false);
    expect(model.arms.right.rotation.x).toBeLessThan(0);

    const visiblePuffs = scene.children.filter((c) => c !== model.object && c.visible);
    expect(visiblePuffs.length).toBeGreaterThan(0);

    // Tipsy -> beer tankard visible, rig sways on Z.
    cosmetics.triggerSip();
    cosmetics.update(0.25, { dead: false, smoking: false, tipsy: true, swinging: false });
    expect(cigGroup.visible).toBe(false);
    expect(beerGroup.visible).toBe(true);
    expect(Math.abs(model.rig.rotation.z)).toBeGreaterThan(0);

    // Dead -> hides both props.
    cosmetics.update(0.1, { dead: true, smoking: true, tipsy: true, swinging: false });
    expect(cigGroup.visible).toBe(false);
    expect(beerGroup.visible).toBe(false);

    // Dispose removes all puff meshes from the scene.
    cosmetics.dispose();
    expect(scene.children).toEqual([model.object]);
  });

  it('applies distinct attack kind poses and shield block pose', () => {
    const model = createGnomeModel(PLAYER_LOOK);
    const midSwing = SWING_SECONDS / 2;

    applyAttackAndBlockPose(model, midSwing, 'thrust', 0);
    expect(model.arms.right.position.z).toBeGreaterThan(0.1);
    expect(model.rig.rotation.y).toBe(0);

    applyAttackAndBlockPose(model, midSwing, 'chop', 0);
    expect(model.rig.rotation.y).toBeLessThan(-0.3);
    expect(model.arms.right.position.z).toBe(0);

    applyAttackAndBlockPose(model, midSwing, 'cast', 0);
    expect(model.arms.left.rotation.x).toBeLessThan(-0.5);

    applyAttackAndBlockPose(model, 0, 'chop', BLOCK_SECONDS / 2);
    expect(model.arms.left.rotation.x).toBeLessThan(-1.0);
  });
});
