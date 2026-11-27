// Story row 56 (docs/design/gnome-theft-auto/story-outline.md): A Mortar for a Mower, act IV, chapter 4. Hogweed Sprocket calls
// the overlook (the dispatch radio on Tansy's table): the Underspanners heard about the fort and he has "a small mortar and a
// parachute that almost certainly opens". The player flies a Crop Duster night-low from the overlook strip over the Ring Road
// and along the Skyway to the Unfinished Span (the Hat Watch's vans are out), lands on the open flat south of the Underspan (the
// Span is too narrow and ends in a gap: the outline's fallback), holds the mortar and the rig at Hogweed's welding bench while he
// fits them, and flies back through the Hat Watch's second search to the overlook. The door mortar and the rig go on the crew's
// Crop Duster for row 57; Hogweed now sells parachute parts (said in the outro and doneText only, there is no shop system).
// Scenes: cutscene/scenes/story/m56-mortar-for-a-mower.ts (intro, the fitting, outro).
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm56-mortar-for-a-mower',
      title: 'A Mortar for a Mower',
      giver: 'dust-overlook',
      prereq: 'ch4-runway-flares',
      chapter: 4,
      rewardAcorns: 400,
      achievement: 'gta-almost-certainly',
      radioBulletin: 'm56-mortar-for-a-mower',
      // The Hat Watch's vans are a risk, not a pursuit: a night flight may be noticed once and never chased. Everything on foot is calm.
      hoa: 'off',
      hoaSteps: { 0: { cap: 1 }, 3: { cap: 1 } },
      cutscene: { kind: 'script', script: 'mortar-for-a-mower-intro' },
      outro: { kind: 'script', script: 'mortar-for-a-mower-outro' },
      objectives: [
        {
          kind: 'checkpoints',
          text: 'Fly the Crop Duster night-low over the Ring Road and the Skyway to the Unfinished Span',
          hint: 'The strip below the overlook, then east over the Ring Road and along the Skyway',
          vehicle: { kind: 'plane', at: [236, 40, 1.8] },
          requireVehicle: 'plane',
          seconds: 70,
          points: [
            { at: [303, 25], height: 14, radius: 24, label: "Ring Road North-East, under the Hat Watch's vans (the clock starts)" },
            { at: [326, -60], height: 16, radius: 24, label: 'Skyway deck over the Ring Road' },
            { at: [440, -46], height: 16, radius: 24, label: 'Skyway deck by the airfield' },
            { at: [535, -44], height: 14, radius: 24, label: "The Skyway's east end, past the spotlight vans" },
            { at: [610, -22], height: 10, radius: 22, label: 'The Unfinished Span: mind the gap' },
          ],
        },
        {
          kind: 'visit',
          text: "Land on the open flat south of the Underspan and walk up to Hogweed's bench",
          at: [574, 3],
          radius: 9,
          hint: 'The open ground south of the Underspan, under the Unfinished Span',
          toastOnEnter: 'Hogweed waves a spanner from the other side of his towers. "You minded the gap! You minded it! I owe Pip a biscuit."',
        },
        {
          kind: 'inspect',
          text: 'Hold the door mortar and then the parachute rig at the welding bench while Hogweed fits them',
          verb: 'Hold',
          holdSeconds: 3,
          hint: "Hogweed's welding bench, east side, in the Underspan yard",
          points: [
            {
              at: [577.6, -9],
              label: 'The door mortar, on its bracket',
              note: 'A brass tube on an iron plate with 7:2 chalked on the side. Hogweed rubs it out and writes 2:7. Neither is wrong.',
              prop: 'door-mortar',
              radius: 2.2,
            },
            {
              at: [577.6, -11],
              label: 'The parachute rig, packed twice',
              note: 'A canvas pack stencilled ALMOST CERTAINLY. He stapled a permit to it and signed it himself.',
              prop: 'parachute-rig',
              radius: 2.2,
            },
          ],
          scene: 'mortar-for-a-mower-fit',
        },
        {
          kind: 'checkpoints',
          text: "Fly the fitted Crop Duster back through the Hat Watch's second search to the overlook",
          hint: 'West along the Skyway and over the Ring Road to the Dust Flats overlook',
          vehicle: { kind: 'plane', at: [586, 5, -Math.PI / 2] },
          requireVehicle: 'plane',
          seconds: 80,
          points: [
            { at: [545, -26], height: 16, radius: 24, label: "The Skyway's east end, the second search's lights" },
            { at: [440, -52], height: 16, radius: 24, label: 'Skyway deck by the airfield, vans on the spur' },
            { at: [326, -66], height: 16, radius: 24, label: 'Ring Road North-East, vans nose to tail' },
            { at: [304, 28], height: 12, radius: 24, label: 'The Dust Flats highway bend, the last van' },
            { at: [258, 42], radius: 40, label: 'The overlook strip (the finish)' },
          ],
        },
      ],
      doneText: 'The Crop Duster has a door mortar and a parachute rig that almost certainly opens. Hogweed now sells spare canopy and cord, and, he says, spare almosts.',
    },
  ],
  comms: {
    'm56-mortar-for-a-mower': {
      0: brief(
        ['hogweed', 'Hogweed! The flares are down, the Unmowed are in place, and I have a mortar!'],
        ['hogweed', 'A small one. And a parachute that almost certainly opens. Bring the plane to the Span.'],
        ['hogweed', 'Fly low over the Skyway, past the vans. Four hundred acorns. Mind the gap!'],
      ),
      1: call(['hogweed', 'Land on the flat just south of the shed. The Span is mostly a rumour.']),
      2: call(['hogweed', 'To my bench! Hold the tube, then hold the rig. It almost certainly opens!']),
      3: call(['pip', 'The Hat Watch is searching the Ring Road again. Go round the vans, low and quiet.']),
    },
  },
  plans: {
    'm56-mortar-for-a-mower': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm56-mortar-for-a-mower': [
      'Underspan update: a Crop Duster made what Hogweed Sprocket called "a controlled arrival" south of his workshop at night. The Hat Watch called it a very low hat, and has not filed a form.',
      'Local 404 has served a citation for unauthorised ordnance on an aeroplane door. The Underspan has framed it, beside the one for verticality.',
    ],
  },
};
