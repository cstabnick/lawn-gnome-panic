// The quests. To add one: give it an id, a giver, and objectives. A 'crack' objective needs only each target's name,
// a rough place (`near`) and a clue; the cutscene, the markers, the tracker and the save are all made from this.
import type { GiverDef, QuestDef } from './types';

export const GIVERS: Record<string, GiverDef> = {
  'mulch-club': {
    id: 'mulch-club', label: 'Enter The Mulch Club', x: -16, z: -30,
    exit: { x: -13, z: -30, yaw: Math.PI / 2 }, room: 'mulch-club',
  },
};

const GOLD_HAT = 0xffd23f;

export const QUESTS: readonly QuestDef[] = [
  {
    id: 'first-contract',
    title: 'First Contract',
    giver: 'mulch-club',
    cutscene: { kind: 'contract' },
    demo: true,
    achievement: 'gta-first-contract',
    doneText: 'Contract complete. Don Compost is pleased. (Demo ends here: more contracts coming, so come back to it!)',
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the three marked gnomes',
        targets: [
          { id: 'dibbler', name: 'Dandy Dibbler', near: [-320, 40], hint: 'Mossy Wood', look: { hat: GOLD_HAT, glasses: true } },
          { id: 'gravelbottom', name: 'Gordie Gravelbottom', near: [20, -330], hint: 'Frostbite Fells', look: { hat: GOLD_HAT, beard: 0x3b2a1a } },
          { id: 'spadewell', name: 'Sandy Spadewell', near: [330, 110], hint: 'The Dust Flats', look: { hat: GOLD_HAT, freckles: true } },
        ],
      },
    ],
  },
];

export const questById = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);
