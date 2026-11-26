// The Dewdrop series (E18, L54): Hogweed Sprocket's three quests that end with the player's own hamster ball
// (dewdrop/config.ts). Unlock beats: unlocks.ts. Design: docs/design/gnome-theft-auto/side-quest-schedule.md section 3.
import { DEWDROP_ACH, DEWDROP_KIND, DEWDROP_PRICE, DEWDROP_QUESTS_IDS } from '../dewdrop/config';
import { SOCIETY_CAST, UNDERSPAN } from '../societies/config';
import type { QuestDef } from './types';

const HOGWEED = SOCIETY_CAST.hogweed;
const HOGWEED_LOOK = { hat: 0x6b4a2e, shirt: 0x8a5a3a, beard: 0xd2691e, glasses: true };
const AT_HOGWEED: [number, number] = [UNDERSPAN.hogweed.x, UNDERSPAN.hogweed.z];
const DOOR = UNDERSPAN.workshopDoor;

export const DEWDROP_QUESTS: readonly QuestDef[] = [
  {
    id: DEWDROP_QUESTS_IDS.prototype,
    title: 'The Rolling Prototype',
    giver: 'hogweed',
    rewardAcorns: 250,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "It was RIGHT HERE. A ball. A clear one. I turned my back for one argument with a warning sign, and the sign was wrong, and the ball left.", look: HOGWEED_LOOK },
        { speaker: 'You', text: 'Where did it go?' },
        { speaker: HOGWEED, text: "Down the verge, picking up speed, toward the bank. It rolls beautifully. That is the problem. Follow it. Do not push it. Do not apologise to it either, it hears that.", look: HOGWEED_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Follow the loose ball along the verge',
        hint: 'West of the Underspan',
        points: [
          { at: [572, -24], radius: 6, label: 'The verge, where the ball left' },
          { at: [558, -14], radius: 6, label: 'A fresh track through the long grass' },
          { at: [552, -6], radius: 6, label: 'A bounce mark, and a bigger bounce mark' },
        ],
      },
      {
        kind: 'visit',
        text: 'Stop the ball at the bank',
        at: [536, -2],
        radius: 5,
        hint: 'The bank, west of the Span',
        toastOnEnter: 'The ball rolls up the bank, thinks about it, and rolls back into your boots. It is empty. It is very pleased with itself.',
      },
      {
        kind: 'visit',
        text: 'Wait for Hogweed to catch up',
        at: AT_HOGWEED,
        radius: 6,
        hint: 'Hogweed Sprocket, the Underspan',
        toastOnEnter: 'Hogweed arrives out of breath, holding a clipboard like a shield. "Nobody was inside it. On purpose."',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "Nobody was inside it on purpose. That is the only safety record I need. It has no seat yet. Come back and we will give it one.", look: HOGWEED_LOOK },
      ],
    },
    doneText: 'The ball is back in the workshop, and Hogweed says nobody was inside it on purpose. It has no seat yet.',
  },
  {
    id: DEWDROP_QUESTS_IDS.rollsOut,
    title: 'Hogweed Rolls Out',
    giver: 'hogweed',
    prereq: DEWDROP_QUESTS_IDS.prototype,
    rewardAcorns: 350,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "A ball with nobody in it is a rumour. I need a seat, and a seat needs three things that nobody will give me. A clear panel. A coil spring. A brass seal-ring.", look: HOGWEED_LOOK },
        { speaker: 'You', text: 'Where from?' },
        { speaker: HOGWEED, text: "The panel from the Greenhouse Strip. The spring from the Compost Heap furnace; Ernie will let it go for a joke about the cold. The ring is in my own scrap heap, and I refuse to dig for it. Principle.", look: HOGWEED_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Take a clear panel from the Greenhouse Strip',
        at: [55, -43],
        radius: 7,
        hint: 'The Greenhouse Strip',
        toastOnEnter: 'A clear panel, slightly steamy. A note on the greenhouse says "NOT FOR SALE". You are not buying it. You are borrowing it. Loudly.',
      },
      {
        kind: 'visit',
        text: "Get a coil spring from Ernie's furnace",
        at: [-255, -60],
        radius: 8,
        hint: 'The Compost Heap',
        toastOnEnter: 'You tell Ernie it is so cold the compost is wearing a hat. He laughs until a spring falls out of his apron. Fair trade.',
      },
      {
        kind: 'visit',
        text: 'Dig a brass seal-ring out of the scrap heap',
        at: [UNDERSPAN.scrapHeap.x - 5, UNDERSPAN.scrapHeap.z - 1],
        radius: 4,
        hint: 'The scrap heap, the Underspan',
        toastOnEnter: 'Under a kettle, under a lampshade: one brass ring, exactly the right size. Hogweed would call it luck. You call it digging.',
      },
      {
        kind: 'visit',
        text: 'Hand the three parts to Hogweed',
        at: AT_HOGWEED,
        radius: 5,
        hint: 'Hogweed Sprocket, the Underspan',
        toastOnEnter: 'Hogweed fits the parts in nine seconds, mutters at the spring, and wheels the ball toward the Span ramp.',
      },
      {
        kind: 'visit',
        text: 'Walk alongside the ball on the Span ramp',
        at: [594, -46],
        radius: 6,
        hint: 'The foot of the Span ramp',
        toastOnEnter: 'The ball rolls out, bounces once, bounces twice, and stops. Hogweed writes "success" on the clipboard, then crosses out "success".',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "It bounced twice and stopped. Twice is the good number. The third bounce needs a gnome inside it. Come back when you are ready to be a very small passenger.", look: HOGWEED_LOOK },
      ],
    },
    doneText: 'It bounced twice and stopped. Hogweed has a plan for the third.',
  },
  {
    id: DEWDROP_QUESTS_IDS.dewdrop,
    title: 'Dewdrop',
    giver: 'hogweed',
    prereq: DEWDROP_QUESTS_IDS.rollsOut,
    rewardAcorns: 0,
    achievement: DEWDROP_ACH.rollWithIt,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "Climb in. Do not lean. Do not look down. Do not look anywhere, actually, the ball does that for you. I have laid out hay bales and tyre ramps. It is a course. It is also a form I have not filled in yet.", look: HOGWEED_LOOK },
        { speaker: 'You', text: 'Is it safe?' },
        { speaker: HOGWEED, text: "It is round. Round is a promise. Roll through the gates and finish at my door.", look: HOGWEED_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Roll the Dewdrop through the hay-bale course',
        hint: 'Under the Unfinished Span',
        vehicle: { kind: DEWDROP_KIND, at: [UNDERSPAN.hogweed.x - 4, UNDERSPAN.hogweed.z - 6, 0] },
        requireVehicle: DEWDROP_KIND,
        points: [
          { at: [570, -30], radius: 6, label: 'First hay-bale gate' },
          { at: [556, -38], radius: 6, label: 'The tyre ramp' },
          { at: [552, -26], radius: 6, label: 'The wide turn, open ground' },
          { at: [550, -10], radius: 6, label: 'The second tyre ramp' },
          { at: [568, -6], radius: 6, label: 'The last hay bales' },
          { at: [DOOR.x - 3, DOOR.z], radius: 5, label: "Hogweed's workshop door (the finish)" },
        ],
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "Sign here. No, here. It is handwritten, and underlined twice. The Dewdrop belongs to you. I have never given anything away. It is a new feeling. I do not like it. Go.", look: HOGWEED_LOOK },
      ],
    },
    doneText: `The Dewdrop is yours. It is parked by the workshop door; replacements are ${DEWDROP_PRICE} Acorns at the workshop.`,
  },
];
