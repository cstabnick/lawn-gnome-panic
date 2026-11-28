// Story row 15 (docs/design/gnome-theft-auto/story-outline.md): Founder's Boot, the extended quest that turns act I into
// act II. p1 Parade Permits: Hedda Galley tells the player where the Boot float's keys are; the player lifts them from the
// parade office. p2 Dress Rehearsal: a night run of the float round the Even-Estates hoarding with the night watch giving
// chase, and home before dawn. The final (kept id, objectives and order from chapter1.ts so old saves resume): the
// tribunal crash, the bailiffs, the getaway; its outro is Juniper's ribbon for Founders' Green, then Vesper.
// Scenes: cutscene/scenes/story/m15-founders-boot.ts (p1, p2) and ch1d.ts (the final's intro and outro).
import type { GnomeLook } from '@lawn/gnome';
import { AMPHITHEATER, SIDE_VALVE } from '../../config';
import { brief, call, type StoryFile } from './kit';

const REGINALD_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, glasses: true };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const BAY: [number, number] = [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z];

const P1 = 'ch1-founders-boot-p1';
const P2 = 'ch1-founders-boot-p2';
const FINAL = 'ch1-founders-boot';

export const STORY: StoryFile = {
  quests: [
    {
      id: P1,
      title: 'Parade Permits',
      giver: 'side-valve',
      prereq: 'm14-drainpipe-court',
      chapter: 1,
      rewardAcorns: 300,
      radioBulletin: P1,
      // The Tattler's desk: Tansy sends the player, Hedda says where the keys are (her intro card).
      cutscene: { kind: 'script', script: 'parade-permits-intro' },
      objectives: [
        {
          kind: 'visit',
          text: 'Slip into the parade office behind City Hall',
          at: [12, -111],
          radius: 7,
          hint: 'The parade office',
          heatOnEnter: 1,
          toastOnEnter: 'A Hat Watch clerk saw a hat go in. Be quick.',
        },
        {
          kind: 'inspect',
          text: "Search the parade office for the Boot float's keys",
          verb: 'Search',
          ordered: true,
          hint: 'The parade office',
          points: [
            { at: [9.5, -108.6], label: 'The duty desk', prop: 'hoa-clipboard', note: 'The float roster. Boot driver: Mayor Mulch. He has never driven anything.' },
            { at: [15, -110.4], label: 'The key board', prop: 'glaze-key-hook-board', note: 'A hook for every float. The hook marked BOOT is empty.' },
            { at: [23, -109.5], label: "The Mayor's cigar box", prop: 'cigar-box', note: 'Under two coats of fresh paint: the Boot float keys. Hedda was right.' },
          ],
        },
        {
          kind: 'visit',
          text: 'Bring the float keys to Tansy at Side-Valve Salvage',
          at: BAY,
          radius: 8,
          hint: 'Side-Valve Salvage bay',
          toastOnEnter: 'Tansy hangs the Boot keys on her own hook. Nobody else touches that hook.',
        },
      ],
      doneText: "Tansy has the Boot float's keys. The Mayor's cigar box has paint in it and nothing else.",
    },
    {
      id: P2,
      title: 'Dress Rehearsal',
      giver: 'side-valve',
      prereq: P1,
      chapter: 1,
      rewardAcorns: 500,
      achievement: 'gta-dress-rehearsal',
      radioBulletin: P2,
      cutscene: { kind: 'script', script: 'dress-rehearsal-intro' },
      outro: { kind: 'script', script: 'dress-rehearsal-outro' },
      objectives: [
        {
          // The float waits where the intro parked it (stage estates-plot-1-east 'boot-float-rehearsal'). It cannot fit the
          // 8 m site gate, so the rehearsal runs round the outside of the hoarding. Damage past half restarts the run.
          kind: 'checkpoints',
          text: 'Rehearse the parade round the Even-Estates hoarding without denting the Boot',
          vehicle: { kind: 'boot-float', at: [-256, -112, 0] },
          requireVehicle: 'boot-float',
          maxDamage: 0.5,
          // The night watch whistles up the Hat Watch the moment the float moves.
          heatOnStart: 2,
          hint: 'Even-Estates, Plot 1',
          points: [
            { at: [-256, -104], radius: 7, label: 'Off the mark' },
            { at: [-260, -88], radius: 8, label: 'The south-east corner' },
            { at: [-296, -86], radius: 8, label: 'Along the yard hoarding' },
            { at: [-336, -92], radius: 8, label: 'The south-west corner' },
            { at: [-342, -112], radius: 7, label: 'Past the site sign' },
            { at: [-333, -138], radius: 8, label: 'The first show-home, over the hoarding' },
          ],
        },
        {
          kind: 'checkpoints',
          text: 'Get the Boot home to Side-Valve before the watch catches up',
          requireVehicle: 'boot-float',
          hint: 'Side-Valve Salvage bay',
          points: [{ at: BAY, radius: 10, label: 'Side-Valve Salvage bay' }],
        },
      ],
      doneText: "The Boot is home, one scrape on the toe. Saturday, it goes down the parade route in daylight.",
    },
    {
      // The final part keeps its id, objectives and order (old saves stay finished; a save mid-quest resumes).
      id: FINAL,
      // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
      hoaSteps: { 1: { cap: 1 } },
      title: "Founder's Boot & The Kangaroo Court",
      giver: 'side-valve',
      prereq: P2,
      chapter: 1,
      rewardAcorns: 700,
      achievement: 'gta-boot-legger',
      radioBulletin: FINAL,
      cutscene: { kind: 'script', script: 'founders-boot-intro' },
      outro: { kind: 'script', script: 'founders-boot-outro' },
      objectives: [
        {
          kind: 'steal-deliver',
          text: "Hijack Gnorwin's Boot Parade Float and crash the Amphitheater tribunal",
          vehicleKind: 'boot-float',
          spawnAt: [2.5, -120, -Math.PI / 2],
          dropAt: [AMPHITHEATER.x, AMPHITHEATER.z + 18],
          radius: 14,
          hint: 'Turfton Amphitheater',
          heatOnEnter: 2,
        },
        {
          kind: 'crack',
          text: 'Scatter Reginald Vance and his HOA Enforcers at the Amphitheater',
          targets: [
            { id: 'reginald-vance', name: 'Reginald "Quarter-Inch" Vance', near: [-90, -80], hint: 'Turfton Amphitheater', look: REGINALD_LOOK },
            { id: 'tribunal-hoa-1', name: 'HOA Bailiff Pike', near: [-82, -84], hint: 'Turfton Amphitheater', look: HOA_LOOK },
            { id: 'tribunal-hoa-2', name: 'HOA Bailiff Reed', near: [-98, -84], hint: 'Turfton Amphitheater', look: HOA_LOOK },
            { id: 'tribunal-hoa-3', name: 'HOA Bailiff Moss', near: [-90, -72], hint: 'Turfton Amphitheater', look: HOA_LOOK },
          ],
        },
        {
          kind: 'steal-deliver',
          text: 'Escape the 4-Hat HOA Van pursuit in Pip\'s getaway Combine back to Side-Valve Salvage',
          vehicleKind: 'combine',
          spawnAt: [AMPHITHEATER.x - 16, AMPHITHEATER.z + 10, Math.PI],
          dropAt: BAY,
          radius: 10,
          hint: 'Side-Valve Salvage bay',
          heatOnEnter: 4,
        },
      ],
      doneText: 'Tribunal adjourned. Tansy\'s deed is stamped, and Vesper knows you\'re not playing by HOA rules.',
    },
  ],
  comms: {
    [P1]: {
      0: brief(
        ['tansy', 'Hedda Galley edits the Tattler. She owed Juniper a favour, so she told you.'],
        ['tansy', 'The Boot float keys sit in the parade office. Nobody guards a parade.'],
        ['tansy', 'Bring them to me. Three hundred acorns. Mind the Hat Watch clerk next door.'],
      ),
      1: call(['hedda', 'Keys never on the hook. Mayor\'s cigar box. Source: nobody.']),
      2: call(['juniper', 'Hedda tells me you were in the parade office. I did not hear that.']),
    },
    [P2]: {
      0: brief(
        ['tansy', 'Nobody has driven the Boot since last Trim Day. Saturday is no day to learn.'],
        ['tansy', 'Round the hoarding at the Even-Estates, every gate. Nobody lives there to complain.'],
        ['pip', 'Five hundred acorns if it comes back whole! Tansy said whole. I said mostly.'],
      ),
      1: call(
        ['pip', 'The night watch called the Hat Watch! Lights off, take it home!'],
        ['tansy', 'My bay. Do not stop for anyone with a whistle.'],
      ),
    },
    [FINAL]: {
      0: brief(
        ['tansy', 'Founder\'s Trim Day. Gnorwin\'s Boot rolls in the parade.'],
        ['tansy', 'Gnorwin Clayfoot, first king of Fescue. Allegedly my great-great-something.'],
        ['tansy', 'Vesper\'s tribunal is at the Amphitheater. Put the Boot in the jury box.'],
      ),
      1: call(['pip', 'Boot\'s in the jury box! Reginald is very upset. Crack his Enforcers!']),
      2: call(
        ['tansy', 'Four hats on your tail. Bring the Combine home. The stamp\'s inked.'],
        ['juniper', 'Get them home in one piece. I have three blocks to sign at dusk.'],
      ),
    },
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P1]: [
      "City Hall reports the keys to Gnorwin's Boot float missing from the parade office. The Mayor says he was keeping them somewhere safe and has forgotten where.",
      'The parade office would like its keys back before Trim Day. A Hat Watch clerk saw a hat go in and is writing a very long report about it.',
    ],
    [P2]: [
      'Night workers at the Even-Estates site report a thirty-foot boot going round the hoarding twice, with its lights off. Levelright Construction says the hoarding is fine.',
      'The Hat Watch chased a parade float across the west fringe last night and lost it. A spokesman says boots are hard to see in the dark.',
    ],
  },
};
