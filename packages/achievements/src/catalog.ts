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
  {
    id: 'golf-ace',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Ace!',
    description: 'Score a hole-in-one.',
    reward: { slot: 'neck', prefabId: 'ace-medallion', label: 'Ace Medallion' },
  },
  {
    id: 'golf-birdie-hunter',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Birdie Hunter',
    description: 'Score 3 birdies or better.',
    target: 3,
    reward: { slot: 'hand', prefabId: 'titanium-driver', label: 'Titanium Driver' },
  },
  {
    id: 'golf-bunker-escape',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Sand Blaster',
    description: 'Blast out of a sand bunker onto the fairway or green 3 times.',
    target: 3,
    reward: { slot: 'head', prefabId: 'golf-bucket-hat', label: 'Sun Bucket Hat' },
  },
  {
    id: 'golf-disc-hole',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Chain Gang',
    description: 'Sink a throw in Gnome Disc mode.',
    reward: { slot: 'back', prefabId: 'disco-pack', label: 'Disco Disc Pack' },
  },
  {
    id: 'golf-nineteenth-hole',
    game: 'gnome-golf',
    gameTitle: 'Gnome Golf',
    title: 'Nineteenth Hole',
    description: 'Drink 3 cans of golf water in a single round.',
    reward: { slot: 'neck', prefabId: 'caddie-towel', label: 'Caddie Towel' },
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
  // ---- Gnome Sweet Gnome ----
  {
    id: 'gsg-mossy-lane',
    game: 'gnome-sweet-gnome',
    gameTitle: 'Gnome Sweet Gnome',
    title: 'Gnome Sweet Gnome',
    description: 'Make over every room on Mossy Lane.',
    reward: { slot: 'head', prefabId: 'mushroom-hood', label: 'Mushroom Hood' },
  },
  {
    id: 'gsg-oakwood',
    game: 'gnome-sweet-gnome',
    gameTitle: 'Gnome Sweet Gnome',
    title: 'Up a Tree',
    description: 'Make over the Oakwood Treehouse.',
    reward: { slot: 'head', prefabId: 'acorn-cap', label: 'Acorn Cap' },
  },
  {
    id: 'gsg-shell-cove',
    game: 'gnome-sweet-gnome',
    gameTitle: 'Gnome Sweet Gnome',
    title: 'Beach Gnome',
    description: 'Make over Shell Cove.',
    reward: { slot: 'neck', prefabId: 'bead-necklace', label: 'Bead Necklace' },
  },
  {
    id: 'gsg-great-wave',
    game: 'gnome-sweet-gnome',
    gameTitle: 'Gnome Sweet Gnome',
    title: 'Rode the Great Wave',
    description: 'Beat level 60.',
    reward: { slot: 'neck', prefabId: 'wool-scarf', label: 'Wool Scarf' },
  },

  // ---- Club Gnome ----
  {
    id: 'club-welcome',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'New at the Club',
    description: 'Walk into Club Gnome for the first time.',
    reward: { slot: 'neck', prefabId: 'name-tag', label: 'Name-Tag' },
  },
  {
    id: 'club-explorer',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'Club Explorer',
    description: 'Visit all four places: Town Square, the Gnomecino, the Arcade and Links Park.',
    target: 4,
    reward: { slot: 'back', prefabId: 'leaf-cloak', label: 'Leaf Cloak' },
  },
  {
    id: 'club-high-roller',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'High Roller',
    description: 'Sit at the High Rollers table in the Gnomecino.',
    reward: { slot: 'head', prefabId: 'dealer-visor', label: 'Dealer Visor' },
  },
  {
    id: 'club-regular',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'Regular',
    description: 'Open 10 games from Club Gnome.',
    target: 10,
    reward: { slot: 'hand', prefabId: 'stout-tankard', label: 'Stout Tankard' },
  },
  {
    id: 'club-chatterbox',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'Chatterbox',
    description: 'Send 25 chat lines in Club Gnome.',
    target: 25,
    reward: { slot: 'neck', prefabId: 'honeycomb-charm', label: 'Honeycomb Charm' },
  },
  {
    id: 'club-crowd',
    game: 'club-gnome',
    gameTitle: 'Club Gnome',
    title: 'Crowd Pleaser',
    description: 'Be in one place with 5 other gnomes.',
    reward: { slot: 'head', prefabId: 'pointy-hat', label: 'Pointy Hat' },
  },
  // ---- Paragnormal ----
  {
    id: 'para-escape',
    game: 'paragnormal',
    gameTitle: 'Paragnormal',
    title: 'Garden Air',
    description: 'Escape through the Garden Pet-Door.',
    reward: { slot: 'neck', prefabId: 'tall-eye-charm', label: 'Tall-eye Charm' },
  },
  {
    id: 'para-lights-out',
    game: 'paragnormal',
    gameTitle: 'Paragnormal',
    title: 'Lights Out',
    description: 'Have the lantern gutter out three times in one house.',
    reward: { slot: 'hand', prefabId: 'candle', label: 'Candle' },
  },
  {
    id: 'para-shh',
    game: 'paragnormal',
    gameTitle: 'Paragnormal',
    title: 'Shh',
    description: 'Stay hidden while The Hush brushes past you.',
    reward: { slot: 'head', prefabId: 'mushroom-hood', label: 'Mushroom Hood' },
  },
  {
    id: 'para-bells',
    game: 'paragnormal',
    gameTitle: 'Paragnormal',
    title: 'Three Bells',
    description: 'Ring all three Soul-Bells in one house.',
    reward: { slot: 'back', prefabId: 'leaf-cloak', label: 'Leaf Cloak' },
  },

  // ---- Incregnomtal ----
  {
    id: 'inc-first-mulch',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'First Mowing Day',
    description: 'Survive your first visit from Old Saturday and rake up some Mulch.',
    reward: { slot: 'hand', prefabId: 'hedge-shears', label: 'Hedge Shears' },
  },
  {
    id: 'inc-wish-maker',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'Dandelion Blower',
    description: 'Pull 20 dandelions off the lawn.',
    reward: { slot: 'head', prefabId: 'thimble-helm', label: 'Thimble Helm' },
  },
  {
    id: 'inc-good-boy',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'Good Boy, Biscuit',
    description: 'Befriend the Great Biscuit with a game of fetch.',
    reward: { slot: 'head', prefabId: 'mole-crown', label: 'Mole Crown' },
  },
  {
    id: 'inc-dry-survivor',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'Dry Summer Survivor',
    description: 'Make it through Week 4 when the Tall Ones\' tap slows to a trickle.',
    reward: { slot: 'hand', prefabId: 'watering-can', label: 'Watering Can' },
  },
  {
    id: 'inc-all-critters',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'Friend of the Yard',
    description: 'Befriend 6 different garden critters.',
    reward: { slot: 'neck', prefabId: 'honeycomb-charm', label: 'Honeycomb Charm' },
  },
  {
    id: 'inc-yard-of-the-year',
    game: 'incregnomtal',
    gameTitle: 'Incregnomtal',
    title: 'Yard of the Year',
    description: 'Tame Old Saturday and ride him across the lawn.',
    reward: { slot: 'hand', prefabId: 'hand-rake', label: 'Hand Rake' },
  },
  {
    id: 'prix-trial-first',
    game: 'lawn-prix',
    gameTitle: 'Lawn Prix',
    title: 'Against the Clock',
    description: 'Finish a Time Trial and leave a ghost on the course.',
    reward: { slot: 'head', prefabId: 'keep-helm', label: 'Keep Helm' },
  },
  {
    id: 'prix-ghost-buster',
    game: 'lawn-prix',
    gameTitle: 'Lawn Prix',
    title: 'Ghost Buster',
    description: 'Beat your own ghost in a Time Trial.',
    reward: { slot: 'neck', prefabId: 'reed-charm', label: 'Reed Charm' },
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
