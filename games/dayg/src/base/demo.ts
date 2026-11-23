// Demo base for ?basedemo=1&spawn=326,402: one of each piece on the Forecourt gravel (roadmap 9 step 0, planner-written).
import type { BaseState, PieceKind, PieceState, SlotKey } from './types';
import { PIECES } from './config';

const DEMO_PLOT = { x0: 320, z0: 410, y: 0, region: 'forecourt' as const };

export function demoBase(seed: number): BaseState {
  const pieces: PieceState[] = [];
  const add = (kind: PieceKind, slot: SlotKey, extra: Partial<PieceState> = {}): void => {
    const hp = PIECES[kind].hp;
    pieces.push({
      id: `piece-${pieces.length + 1}`, kind, slot, side: 1, hp, maxHp: hp,
      open: false, hasLock: false, locked: false, up: false, reinforced: false, overDoor: false, items: [],
      ...extra,
    });
  };
  add('plank-wall', 'e:x:0:0');
  add('plank-wall', 'e:x:1:0');
  add('plank-wall', 'e:z:0:0');
  add('door', 'e:x:2:0', { hasLock: true });
  add('barricade', 'e:z:3:0');
  add('barricade', 'e:x:2:0', { side: 1, overDoor: true });
  add('ladder', 'e:x:0:0', { side: -1 });
  add('ladder', 'e:x:1:0', { side: -1, up: true });
  add('plank-wall', 'e:z:0:1', { hp: 30 });
  add('spike-line', 'c:0:2');
  add('chest', 'c:1:1');
  add('bed', 'c:2:1');
  add('workbench', 'c:0:1');
  add('fire-ring', 'c:1:2');
  return { version: 1, seed, plot: { ...DEMO_PLOT }, pieces, nextId: pieces.length + 1 };
}
