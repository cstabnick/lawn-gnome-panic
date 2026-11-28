// Story row 35 (docs/design/gnome-theft-auto/story-outline.md): The Salvage Raid, the extended quest that ends act II.
// p1 Tuesday: Cam does not come in. His cot is cold and his broom stayed home; a valet ticket sends the player to the
// Patio Gate, where six HOA vans are massing for "one yard, dusk"; race back to the bay. p2 Hold the Bay: raiders on the
// street early; hold Side-Valve Alley while Pip and Tansy load the wrenches; at dusk the raiders leave, the bench lock is
// open, the acorn cell is gone and the broom is gone with it. The final (kept id, objectives, order and comms, so old
// saves resume): the betrayal and Pip's arm (salvage-raid-intro, ch3.ts), the flight north (salvage-raid-outro, ch3b.ts).
// Scenes: cutscene/scenes/story/m35-salvage-raid.ts (p1, p2). Stages: quests/stages/story/s35-salvage-raid.ts.
import type { GnomeLook } from '@lawn/gnome';
import { SIDE_VALVE } from '../../config';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const BAY: [number, number] = [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z];

const P1 = 'ch3-salvage-raid-p1';
const P2 = 'ch3-salvage-raid-p2';
const FINAL = 'ch3-salvage-raid';

export const STORY: StoryFile = {
  quests: [
    {
      id: P1,
      title: 'Tuesday',
      giver: 'side-valve',
      prereq: 'm34-forty-seven-wrenches',
      chapter: 3,
      rewardAcorns: 300,
      radioBulletin: P1,
      // Dawn at the storeroom door: the clock, the cold tea, the cot nobody slept in, and the day of the week.
      cutscene: { kind: 'script', script: 'ch3-salvage-raid-p1-intro' },
      objectives: [
        {
          kind: 'inspect',
          text: "Look over Cam's cot and his broom by the storeroom door",
          verb: 'Look',
          ordered: true,
          hint: 'Side-Valve storeroom',
          points: [
            { at: [-164.4, 85.8], label: "Cam's cot", prop: 'camp-bedroll', note: 'Not slept in. Under the pillow: a Patio Gate valet ticket, stamped TUESDAY.' },
            { at: [-163, 82.2], label: "Cam's broom", prop: 'broom', note: 'His broom, leaning on the wall. Cam has never gone anywhere without it.' },
          ],
        },
        {
          kind: 'visit',
          text: "Walk Cam's route to the Patio Gate",
          at: [150, -123],
          radius: 8,
          hint: 'The Patio Gate',
          toastOnEnter: 'Behind the wall: engines warming up. A lot of engines.',
        },
        {
          kind: 'inspect',
          text: 'Photograph the HOA vans massing behind the Patio Gate',
          verb: 'Photograph',
          hint: 'The Patio Gate',
          scene: 'ch3-salvage-raid-p1-mid',
          points: [
            { at: [147.4, -127.6], label: 'The rota on the gate pillar', prop: 'hoa-clipboard', note: "The rota: SIX VANS. ONE YARD. DUSK. Someone crossed out 'raid' and wrote 'visit'." },
            { at: [150, -133.4], label: 'The van line, through the gate', prop: 'site-cone', note: 'Six HOA vans nose to tail, engines warm, every one pointed at downtown.' },
            { at: [159.2, -126.2], label: 'The fuel cans by the wall', prop: 'fuel-can', note: 'Twelve cans of fuel. The HOA does not mow its own lawn.' },
          ],
        },
        {
          kind: 'checkpoints',
          text: 'Race back to Side-Valve Salvage before the vans roll',
          vehicle: { kind: 'ride-on', at: [140, -122.5, -Math.PI / 2] },
          seconds: 80,
          hint: 'Side-Valve Salvage bay',
          points: [
            { at: [146, -120], radius: 8, label: 'Off the Patio Gate (the clock starts)' },
            { at: [0, -120], radius: 9, label: 'Behind City Hall' },
            { at: [0, 0], radius: 9, label: 'The downtown crossing' },
            { at: [-60, 60], radius: 9, label: 'The Bodega corner' },
            { at: BAY, radius: 9, label: 'Side-Valve Salvage bay' },
          ],
        },
      ],
      doneText: 'Tansy has the photographs: six vans, one yard, dusk. Nobody has seen Cam. His broom is still against the wall.',
    },
    {
      id: P2,
      title: 'Hold the Bay',
      giver: 'side-valve',
      prereq: P1,
      chapter: 3,
      rewardAcorns: 450,
      achievement: 'gta-hold-the-bay',
      radioBulletin: P2,
      // Noon: the wrenches come off the wall into the crate; the acorn stays in the bench lock; raiders on the street.
      cutscene: { kind: 'script', script: 'ch3-salvage-raid-p2-intro' },
      // Dusk: the raiders leave, the bench lock is open, the acorn cell is gone, and Tansy counts. The final starts here.
      outro: { kind: 'script', script: 'ch3-salvage-raid-p2-mid' },
      objectives: [
        {
          // 75 s in all: two waves, so Pip can call the half-way mark.
          kind: 'survive-derby',
          text: 'Hold Side-Valve Alley against the HOA mowers while Pip and Tansy load the crate',
          arena: [-162, 62],
          radius: 16,
          seconds: 40,
          attackers: 5,
          hint: 'Side-Valve Alley',
        },
        {
          kind: 'survive-derby',
          text: 'Hold the alley against the second wave until the crate is in',
          arena: [-162, 62],
          radius: 16,
          seconds: 35,
          attackers: 6,
          hint: 'Side-Valve Alley',
        },
      ],
      doneText: 'The alley held and the crate is loaded. The bench lock is open, the Golden Acorn is gone, and so is the broom.',
    },
    {
      // The final part keeps its id, objectives and order (old saves stay finished; a save mid-quest resumes).
      id: FINAL,
      // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
      hoaSteps: { 0: { cap: 1 } },
      title: 'The Salvage Raid',
      giver: 'side-valve',
      prereq: P2,
      chapter: 3,
      rewardAcorns: 800,
      radioBulletin: FINAL,
      cutscene: { kind: 'script', script: 'salvage-raid-intro' },
      outro: { kind: 'script', script: 'salvage-raid-outro' },
      objectives: [
        {
          kind: 'crack',
          text: 'Break through Turncoat Cam and the HOA raid outside Side-Valve Salvage',
          targets: [
            { id: 'raid-turncoat', name: 'Turncoat Cam', near: [-146, 70], hint: 'Side-Valve Alley', look: { hat: 0xf4f4f8, shirt: 0xc9b99b } },
            { id: 'raid-hoa-1', name: 'HOA Raider Ash', near: [-140, 72], hint: 'Side-Valve Alley', look: HOA_LOOK },
            { id: 'raid-hoa-2', name: 'HOA Raider Slate', near: [-155, 65], hint: 'Side-Valve Alley', look: HOA_LOOK },
            { id: 'raid-hoa-3', name: 'HOA Raider Clay', near: [-130, 82], hint: 'Side-Valve Alley', look: HOA_LOOK },
          ],
        },
        {
          kind: 'visit',
          text: 'Hit the northwest Ring Road to shake the downtown cordon',
          at: [-260, -260],
          radius: 22,
          hint: 'Northwest Ring Road',
        },
        {
          kind: 'steal-deliver',
          text: 'Escape north in Pip\'s Zero-Turn to Frostbite Fells',
          vehicleKind: 'zero-turn',
          spawnAt: [-255, -265, Math.PI / 4],
          dropAt: [0, -340],
          radius: 16,
          hint: 'Frozen Birdbath Basin (Frostbite Fells)',
          heatOnEnter: 3,
        },
      ],
      doneText: 'Side-Valve Salvage is sealed, Vesper holds the Golden Acorn, and you\'re on the run in Frostbite Fells.',
    },
  ],
  comms: {
    [P1]: {
      0: brief(
        ['tansy', "Cam didn't come in. Cam always comes in. His cot's by the storeroom."],
        ['tansy', 'Look over his things. Find his route. Three hundred acorns.'],
      ),
      1: call(['tansy', 'A valet ticket. He parks their cars at the Patio Gate. Go and look.']),
      2: call(
        ['tansy', 'Vans? How many? Photograph them. Tell me what you see.'],
      ),
      3: call(
        ['pip', 'Tansy saw the photos and went quiet! Quiet is bad! Hurry back!'],
      ),
    },
    [P2]: {
      0: brief(
        ['tansy', "They're early. HOA mowers on our street, and the wrenches aren't packed."],
        ['tansy', 'Hold the alley. We load. Four hundred and fifty acorns.'],
        ['pip', 'Nobody touches the bay door! That door is older than me!'],
      ),
      1: call(['pip', 'Crate is half in! More of them coming! Keep them off the door!']),
    },
    // Unchanged from quests/comms.ts (the final keeps its comms).
    [FINAL]: {
      0: call(
        ['tansy', 'Cam sold us. Get Pip out. I\'ll draw them off.'],
        ['tansy', 'Father Loam, up in Frostbite Fells, mends cracked clay. Go north.'],
      ),
      1: call(['tansy', 'Ring Road, northwest. Lose the cordon. Don\'t come back for me.']),
      2: call(['pip', 'Take my Zero-Turn. You drive. I\'m, uh, short an arm.']),
    },
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P1]: [
      'Patio Heights residents report six HOA vans parked nose to tail inside the gate this morning. A spokesman calls it a routine visit.',
      'The valet stand at the Patio Gate stood empty today. The gatehouse says the valet is away on charter business.',
    ],
    [P2]: [
      'HOA mowers circled a salvage yard off the Old Brick Quarter for over a minute this afternoon. The yard did not let them in.',
      'The HOA describes the afternoon as an inspection. A spokesman adds that the inspection is not finished.',
    ],
  },
};
