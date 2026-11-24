// Turfton stages, part C: the city contract board (the Kerbside Exchange). Conventions and types: ../stages.ts and ./kit.ts.
import { cam, mark, type Stage } from './kit';

export const TURFTON_C_STAGES: readonly Stage[] = [
  {
    id: 'kerb-exchange',
    name: 'The Kerbside Exchange, Central Bus Stop',
    region: 'turfton',
    center: [-14, 45],
    radius: 12,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'new',
    givers: ['kerb-exchange'],
    usedBy: ['city-kerbside-rounds', 'city-impound-run', 'city-glow-band-express', 'city-penthouse-exclusive', 'city-skyway-robbery'],
    look: 'A cork notice-board covered in job slips, a folding office desk with a ticket punch and a stool, a flower-pot, a bench on the pavement, and the snail-coach bus stop up the road.',
    sounds: 'A ticket punch clacking, pinned paper flapping on the board, snail-coach air brakes up the road.',
    marks: [
      mark('dot', [-12.2, 45], [-8.5, 45], 'sit', 'behind the desk, punching a ticket for every job on the board'),
      mark('player', [-8.5, 45], [-12.2, 45], 'stand', 'stands at the desk with a Kiln-Debt receipt'),
      mark('client', [-12, 48.5], [-10.3, 45.2], 'stand', 'holds a crumpled job slip and waits for the punch'),
      mark('hedda', [-15, 42], [-14.6, 45], 'stand', 'reads the job slips on the board with a pencil'),
    ],
    cameras: [
      cam('wide', [-1, 6, 40], [-12, 1.2, 45], 'establishing: the board, the desk and the bus stop up the road'),
      cam('two-shot', [-5.5, 1.6, 45.5], [-12, 1.3, 46.5], 'over the player\'s shoulder onto Dot and the client'),
      cam('board', [-11.5, 1.5, 41], [-14.6, 1.4, 45], 'close on the notice-board and its job slips'),
    ],
    walks: [
      { who: 'dot', points: [[-12.2, 46], [-13, 41]], loop: false, speed: 0.9, pauseS: 4, activity: 'walks from the desk to the board to pin a slip, and back' },
    ],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'notice-board', at: [-15.2, 45], yaw: Math.PI / 2, solid: [1.2, 0.3, 1.6] },
      { prefab: 'office-desk', at: [-10.8, 45], yaw: Math.PI / 2, solid: [0.35, 0.7, 0.8] },
      { prefab: 'chair', at: [-12.6, 45], yaw: Math.PI / 2 },
      { prefab: 'flower-pot', at: [-17, 49], yaw: 0 },
      { prefab: 'bench', at: [-22, 44], yaw: Math.PI / 2, scale: 1.2 },
    ],
  },
];
