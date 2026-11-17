import type { AchievementDef, EquipSlot } from './types';

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ---- Gnome Golf ----
  {
    id: 'golf-nice',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Nice',
    description: 'Par on a hole.',
    reward: { slot: 'head', prefabId: 'golf-visor', label: 'Golf Visor' },
  },
  {
    id: 'golf-how',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'How?!?!?!!',
    description: 'Par or better through 9 holes.',
    reward: { slot: 'hand', prefabId: 'golden-putter', label: 'Golden Putter' },
  },
  {
    id: 'golf-ooops',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Ooops',
    description: 'Hit a ball into the water.',
    reward: { slot: 'head', prefabId: 'bucket-helm', label: 'Bucket Helm' },
  },
  {
    id: 'golf-off-beaten-path',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Off the beaten path',
    description: 'Finish a hole without ever landing on the fairway, hitting from the rough at least once.',
    reward: { slot: 'back', prefabId: 'leaf-cloak', label: 'Leaf Cloak' },
  },
  {
    id: 'golf-crisp-in',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Crisp In',
    description: 'Chip in the ball from off the green.',
    reward: { slot: 'back', prefabId: 'caddie-bag', label: 'Caddie Bag' },
  },

  // ---- Gnome Bowling ----
  {
    id: 'bowling-all-gnomes-down',
    game: 'gnome-bowling',
    gameTitle: 'Gnome Bowling',
    title: 'All gnomes down',
    description: 'Bowl a strike.',
    reward: { slot: 'head', prefabId: 'bowling-pin-hat', label: 'Pin Crown' },
  },
  {
    id: 'bowling-certified-pilgrim',
    game: 'gnome-bowling',
    gameTitle: 'Gnome Bowling',
    title: 'Certified Pilgrim',
    description: 'Bowl a turkey (3 strikes in a row).',
    reward: { slot: 'head', prefabId: 'pilgrim-hat', label: 'Pilgrim Hat' },
  },
  {
    id: 'bowling-7-10-split',
    game: 'gnome-bowling',
    gameTitle: 'Gnome Bowling',
    title: '7-10 inconvenience store',
    description: 'Leave a 7-10 split.',
    reward: { slot: 'hand', prefabId: 'bowling-ball', label: 'House Ball' },
  },

  // ---- Gnome Front ----
  {
    id: 'front-harvest-season',
    game: 'gnome-front',
    gameTitle: 'Gnome Front',
    title: 'Harvest Season',
    description: 'Mow down 3 gnomes in the combine.',
    target: 3,
    reward: { slot: 'hand', prefabId: 'war-hoe', label: 'War Hoe' },
  },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievement(id: string): AchievementDef | undefined {
  return BY_ID.get(id);
}

export function achievementsForGame(game: string): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.game === game);
}

export function equipmentCatalog(slot?: EquipSlot): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.reward && (!slot || a.reward.slot === slot));
}
