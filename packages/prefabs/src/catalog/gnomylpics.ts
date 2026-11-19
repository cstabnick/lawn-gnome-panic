// New prefabs for gnomylpics. One owner (the gnomylpics adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOMYLPICS: readonly PrefabDef[] = [
  {
    // Built at 1/3 of the sprint finish line: the game builds it with { scale: 3 } so the posts are 3 tall and 7.2 apart.
    id: 'olympic-finish-arch', name: 'Olympic Finish Arch', category: 'prop', uses: ['place'],
    tags: ['finish', 'arch', 'gate', 'sprint', 'olympic', 'post', 'bar', 'white'], emoji: [],
    about: 'A white finish arch for the sprint: two posts and a crossbar across the lane. Built at one third scale.',
    examine: [
      'Two white posts and a crossbar, stretched across the lane like a washing line for runners.',
      'Gnome saying: the arch does not care who came first, only who came through it.',
      'Tip: the crossbar is higher than it looks. Jump at the bar, not the post, and you will land on your feet.',
      'Joke: every gnome who has ever crossed it claims to have been first. The arch has never once disagreed out loud.',
      'The paint on the posts is fresh every spring, because the first runner each year always leaves a mark.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1, 0.05], at: [-1.2, 0.5, 0], c: 'white' },
      { s: 'box', d: [0.05, 1, 0.05], at: [1.2, 0.5, 0], c: 'white' },
      { s: 'box', d: [2.4, 0.05, 0.05], at: [0, 1, 0], c: 'white' },
    ],
  },
  {
    id: 'distance-post', name: 'Distance Post', category: 'prop', uses: ['place'],
    tags: ['marker', 'post', 'distance', 'metres', 'white', 'field', 'olympic'], emoji: [],
    about: 'A small white post beside the track, one per ten metres. The number is painted on as a label by the game.',
    examine: [
      'A small white post beside the track, standing straight so the numbers can be read from the stands.',
      'Gnome saying: the post is never as far as it says on the label, and the label is never as far as the gnome.',
      'Tip: the post marks the distance, not the finish. Keep going past it, or the crowd will boo you.',
      'Joke: the first post was put up by a gnome who measured in hops. Every post since has been an argument about hops.',
      'A bit of paint and a bit of wood, and somehow they are the most looked-at things in the whole field.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.8, 0.08], at: [0, 0.4, 0], c: 'white' },
    ],
  },
];
