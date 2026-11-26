// Story row 29 "The Kicked Board" (docs/design/gnome-theft-auto/story-outline.md): golf balls keep landing on Route South and
// Tallgrass Commons from over the fence. Fence-Post Frank sends the player down the fence road at speed to the loose board
// (E15's saved, breakable Kicked Board: golf/types.ts KICKED_BOARD), through it into Hedgeworth, where groundskeeper Thrift
// Hosepipe shouts the player off the damp fairway, Dame Peony is glimpsed at the clubhouse and Thrift hides something and
// does not say what; then back out through the board and home. The quest never says whose garden Hedgeworth is, and it
// breaks the board only the way the golf side quests expect (golf-board-broken is the shared probe).
// Scenes: cutscene/scenes/story/m29-the-kicked-board.ts. Stages: stages/story/s29-*.ts.
import { homeDoor } from '../../homes/data';
import { KICKED_BOARD } from '../../golf/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const FRANK_DOOR = homeDoor('frank');
const BOARD: [number, number] = [KICKED_BOARD.x, KICKED_BOARD.z];

const KICKED_BOARD_QUEST: QuestDef = {
  id: 'm29-the-kicked-board',
  title: 'The Kicked Board',
  giver: 'frank-sign',
  prereq: 'm28-sibling-rivalry',
  chapter: 2,
  rewardAcorns: 300,
  radioBulletin: 'm29-the-kicked-board',
  cutscene: { kind: 'script', script: 'm29-the-kicked-board-intro' },
  outro: { kind: 'script', script: 'm29-the-kicked-board-outro' },
  // A loose board and a groundskeeper: nobody in the Hat Watch has heard of either.
  hoa: 'off',
  objectives: [
    {
      kind: 'checkpoints',
      text: 'Drive the fence road south of Tallgrass Commons at speed, the golf balls dropping ahead',
      points: [
        { at: [-950, 420], radius: 9, label: 'Fence road, north end: a ball bounces off the verge' },
        { at: [-950, 485], radius: 9, label: 'Fence road: a ball lands in the road ahead' },
        { at: [-950, 550], radius: 9, label: 'Fence road: two balls, one after the other, like a clock' },
        { at: [-950, 612], radius: 9, label: 'Fence road: the painted arrow, pointing at the fence' },
        { at: [-962, 640], radius: 8, label: 'The loose board, dead ahead' },
      ],
      seconds: 45,
      vehicle: { kind: 'ride-on', at: [-1, 267.5, Math.PI] },
      hint: 'The fence road, west of Tallgrass Commons',
    },
    {
      kind: 'probe',
      text: 'Find the Kicked Board in the fence and go through it',
      probe: 'golf-board-broken',
      absolute: true,
      count: 1,
      at: BOARD,
      hint: 'The Kicked Board (drive through it at speed, or kick it)',
    },
    {
      kind: 'visit',
      text: 'Walk out onto the fairway beyond the board',
      at: [-1017, 638],
      radius: 8,
      hint: 'The fairway inside the Kicked Board',
      scene: 'm29-the-kicked-board-mid',
    },
    {
      kind: 'checkpoints',
      text: 'Flee back out through the Kicked Board and up the fence road',
      points: [
        { at: [BOARD[0], BOARD[1]], radius: 5, label: 'Out through the Kicked Board' },
        { at: [-955, 600], radius: 10, label: 'Back on the fence road' },
        { at: [-950, 520], radius: 10, label: 'Fence road: past the locked gate' },
        { at: [-950, 440], radius: 10, label: 'Fence road: far enough that he stops shouting' },
      ],
      seconds: 60,
      hint: 'The fence road, back north',
    },
    {
      kind: 'visit',
      text: "Tell Frank what is over the fence, at his welcome sign",
      at: [-3, 262],
      radius: 6,
      hint: "Frank's welcome sign, Route South",
    },
  ],
  doneText: "Frank has a ball for his sign and a place over the fence to point at. Whoever is hitting them hits like a clock.",
};

export const STORY: StoryFile = {
  quests: [KICKED_BOARD_QUEST],
  comms: {
    'm29-the-kicked-board': {
      0: brief(
        ['frank', 'Frank. Golf balls keep landing in my road, from over the fence.'],
        ['frank', 'Previously: one gap in the Fence. This is another: a board past Tallgrass Commons.'],
        ['frank', 'Drive the fence road at speed. Hit the board, or kick it. Three hundred Acorns.'],
      ),
      1: call(['frank', 'Board ahead. There is a sign that says no. It has been wrong for years.']),
      2: call(['frank', 'Whoever keeps that fairway will shout. Let him. Look, do not touch the damp bits.']),
      3: call(['frank', 'I heard the board go. And a shout. Come home. Mind the verge.']),
    },
  },
  givers: {
    'frank-sign': {
      id: 'frank-sign',
      name: "Fence-Post Frank's welcome sign",
      label: 'Talk to Fence-Post Frank',
      x: FRANK_DOOR[0],
      z: FRANK_DOOR[1],
      exit: { x: FRANK_DOOR[0] - 2, z: FRANK_DOOR[1], yaw: -Math.PI / 2 },
      room: 'street',
      letter: 'F',
    },
  },
  bulletins: {
    'm29-the-kicked-board': [
      'Fence-Post Frank reports a fourth golf ball since sunrise on Route South and has begun keeping them on his sign. He declined to say who is hitting them.',
      'Residents of Tallgrass Commons say the balls from over the fence arrive "like a clock". A groundskeeper nearby says there is no course, and has gone back to talking to the grass.',
    ],
  },
  plans: {
    'm29-the-kicked-board': { suite: 'story', expect: 'pass' },
  },
};
