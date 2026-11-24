// The Turfton Newcomers' Card: short, friendly tutorial side jobs, one per hobby or system, handed out by Mabel Kerbstone
// at the Central Bus Stop between fares (lore: docs/lore/rulings.md, the newcomers' card ruling; roadmap
// docs/roadmaps/gta-city-lore-quests.md, "Newcomers"). Each job sends the player to the club's host for that hobby,
// teaches the mechanic in 2-3 steps checked through the activity's own public API ('probe' objectives, city/probes.ts),
// and leaves a small perk (perks.ts). They unlock along the story (unlocks.ts) so a new player meets each one naturally.
// Every stamp but the optional party one counts toward the Newcomers' Card achievement (NEWCOMER_CARD_IDS).
import { AIRFIELD, SIDE_VALVE } from '../config';
import { GUN_STORE } from '../gunStore';
import { HIDE } from '../birding/types';
import { LODGE } from '../hunting/species';
import { SHOP as BENT_PIN } from '../fishing/types';
import { ESTATES } from '../lockup/config';
import { JOBS } from '../jobs/defs';
import type { DialogueLine, QuestDef } from './types';

/** The giver id: Mabel's Newcomers' Card desk at the Central Bus Stop (defs.ts GIVERS). */
export const NEWCOMERS_GIVER = 'newcomers-club';
const BUS_STOP: [number, number] = [-13, 28];
const EXCHANGE: [number, number] = [-9, 45];
/** The taxi depot (jobs/defs.ts): the same point the job's kiosk stands at, so the two cannot drift. */
const CAB_RANK: [number, number] = [JOBS.taxi.depot.x, JOBS.taxi.depot.z];
/** In front of the lodge door (LODGE.yaw 0: the door faces +z), not in the walls. */
const LODGE_DOOR: [number, number] = [LODGE.x, LODGE.z + 6];
const PEBBLEWICK_SQUARE: [number, number] = [681, 92];

const MABEL = 'Mabel Kerbstone';
const HOST_LOOK = {
  hazel: { hat: 0x5a6b2e, shirt: 0x8a6a3a, beard: null, hair: { color: 0x6b4a2a, style: 'pigtails' as const } },
  dunnock: { hat: 0x6b7a5a, shirt: 0x4a5a3a, beard: 0xbfb8a8, glasses: true },
  wenna: { hat: 0x2f6f8f, shirt: 0xc9a35a, beard: null, hair: { color: 0x8a5a2a, style: 'pigtails' as const } },
};

/** A Newcomers' Card intro: Mabel at the bus stop hands the player to the host (a talking-head dialogue, street room). */
function card(title: string, lines: [string, string][], hostLook?: DialogueLine['look']): QuestDef['cutscene'] {
  return {
    kind: 'dialogue',
    room: 'street',
    titleCard: `Newcomers' Card: ${title}`,
    lines: lines.map(([speaker, text]) => ({ speaker, text, ...(speaker !== MABEL && hostLook ? { look: hostLook } : {}) })),
  };
}

export const NEWCOMER_QUESTS: readonly QuestDef[] = [
  {
    id: 'nc-good-neighbour',
    title: 'Good Neighbour',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 60,
    cutscene: card('Good Neighbour', [
      [MABEL, 'New in town, dear? Turfton runs on favours. Small ones, mostly.'],
      ['Dot Pennywort', 'Something always needs a hand out there. Look for the bother, and help.'],
      [MABEL, 'Do one good turn, then come and get your first stamp.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Help out at a street event: a breakdown, a runaway hat, a loose goat', probe: 'street-event', hint: 'Any street event nearby' },
      { kind: 'visit', text: 'Get your first stamp from Mabel at the Central Bus Stop', at: BUS_STOP, radius: 6, hint: 'Central Bus Stop (Downtown)' },
    ],
    doneText: 'First stamp on your Newcomers\' Card. Street events now pay you a little better.',
  },
  {
    id: 'nc-strike-a-pose',
    title: 'Strike a Pose',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 60,
    cutscene: card('Strike a Pose', [
      [MABEL, 'Nina says nobody in Turfton gets anywhere without a bit of swagger.'],
      ['Neon-Moth Nina', 'Sugar, a gnome who can\'t wave is just a garden ornament.'],
      ['Neon-Moth Nina', 'Emote menu, {emote}. Strike something. Then shake a stranger\'s hand.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Open the emote menu ({emote}) and play any emote', probe: 'emote', hint: 'Emote menu' },
      { kind: 'probe', text: 'Do a pair emote (handshake, high five or fist bump) next to a townsgnome', probe: 'pair-emote', hint: 'Emote menu: Social' },
      { kind: 'probe', text: 'Try three different emotes', probe: 'emote', count: 3, hint: 'Emote menu' },
    ],
    doneText: 'Nina approves. Near-miss bonuses are a bit bigger when you show off.',
  },
  {
    id: 'nc-wheel-and-kit',
    title: 'The Wheel and the Kit',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('The Wheel and the Kit', [
      [MABEL, 'Pip wants a word. Something about guns that squirt. I don\'t ask.'],
      ['Pip Potsworth', 'Hold {switchGun}! That\'s the wheel! Pick one!'],
      ['Pip Potsworth', 'The spanner in the middle opens the Pocket Kit. Mods anywhere!'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Open the weapon wheel (hold {switchGun})', probe: 'wheel-open', absolute: true, hint: 'Weapon wheel' },
      { kind: 'probe', text: 'Open the Pocket Kit (the 🔧 in the wheel, or {modKit})', probe: 'kit-open', absolute: true, hint: 'Pocket Kit' },
      { kind: 'visit', text: 'See the full mod bench at Ammu-Gnation on the east edge', at: [GUN_STORE.x - 8, GUN_STORE.z], radius: 10, hint: 'Ammu-Gnation (east edge)' },
    ],
    doneText: 'Pip says Tansy pays more for scrap now that you know your way round a spanner.',
  },
  {
    id: 'nc-lockup',
    title: 'Store It, Call It',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('Store It, Call It', [
      [MABEL, 'Tansy keeps a Lock-Up at Side-Valve. Five bays. She counts them.'],
      ['Tansy Clayfoot', 'Drive it in, it\'s stored. Phone me, the Sling-Lift drops it by you.'],
      ['Tansy Clayfoot', 'Not during a Watch chase. I\'m not flying into that.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Drive any vehicle into the Side-Valve Lock-Up bay to store it', probe: 'lockup-stored', at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z], hint: 'Side-Valve Lock-Up (Old Brick Quarter)' },
      { kind: 'probe', text: 'Open the phone ({phone}), Lock-Up, and call the Sling-Lift', probe: 'spend:Sling-Lift', hint: 'Phone: Lock-Up' },
    ],
    doneText: 'Tansy knocks a bit off every Sling-Lift call for you.',
  },
  {
    id: 'nc-mind-the-verges',
    title: 'Mind the Verges',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('Mind the Verges', [
      [MABEL, 'Councilwoman Vance is looking for volunteers. With mowers.'],
      ['Councilwoman Juniper Vance', 'Verges, flower beds, long grass. The council pays a Lawn Service fee.'],
      ['Councilwoman Juniper Vance', 'Then try the putting-green cart at Patio Heights. Quietly, please.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Mow ten plants with any vehicle: flower beds, ferns, long grass', probe: 'mowed', count: 10, hint: 'Any verge or flower bed' },
      { kind: 'probe', text: 'Find the Putting-Green Cart by the Patio Heights Country Club and drive it', probe: 'golf-cart', absolute: true, at: [185, -185], hint: 'Patio Country Club (Patio Heights)' },
    ],
    doneText: 'The council pays a little more for every Lawn Service job you do.',
  },
  {
    id: 'nc-bent-pin',
    title: 'The Bent Pin',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('The Bent Pin', [
      [MABEL, 'Wenna at the Bent Pin is lonely. Go and buy a rod.'],
      ['Wenna Gudgeon', 'Cast, wait for the bob, reel steady. Measure it, card it, let it go.'],
      ['Wenna Gudgeon', 'I buy the cards. The fish keep their dignity.'],
    ], HOST_LOOK.wenna),
    objectives: [
      { kind: 'probe', text: 'Buy a rod at the Bent Pin counter', probe: 'fish-rod', absolute: true, at: [BENT_PIN.x, BENT_PIN.z], hint: 'The Bent Pin (canal, south bank)' },
      { kind: 'probe', text: 'Cast, wait for a bite, and reel in a fish', probe: 'fish-caught', at: [BENT_PIN.x, BENT_PIN.z - 12], hint: 'The canal by the Bent Pin' },
      { kind: 'probe', text: 'Sell your catch cards to Wenna', probe: 'fish-sold', at: [BENT_PIN.x, BENT_PIN.z], hint: 'The Bent Pin counter' },
    ],
    doneText: 'Wenna pays you a bit more for every catch card.',
  },
  {
    id: 'nc-skyway',
    title: 'Up on the Skyway',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 100,
    cutscene: card('Up on the Skyway', [
      [MABEL, 'Big Wrench Grout wants you to see what Local 404 built.'],
      ['Big Wrench Grout', 'The Skyway. Over the whole town. Get up there and drive it, brother.'],
      ['Big Wrench Grout', 'Then the Span. It stops. You don\'t have to.'],
    ]),
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Drive the Skyway deck across town',
        hint: 'Turfton Skyway',
        points: [
          { at: [-100, -60], height: 7.5, radius: 6, label: 'Skyway deck over Park & Arts' },
          { at: [100, -60], height: 7.5, radius: 6, label: 'Skyway deck over the Greenhouse Strip' },
          { at: [316, -60], height: 7.5, radius: 6, label: 'Skyway deck over Ring Road North-East' },
        ],
      },
      {
        kind: 'checkpoints',
        text: 'Jump the Unfinished Span',
        hint: 'The Unfinished Span',
        points: [
          { at: [610, -30], radius: 8, label: 'The Unfinished Span ramp' },
          { at: [610, 14], height: 5, radius: 6, label: 'Off the end of the Span' },
        ],
      },
    ],
    doneText: 'Grout nods. Speed-trap payouts are a bit bigger for Skyway regulars.',
  },
  {
    id: 'nc-odd-jobs',
    title: 'Odd Jobs',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('Odd Jobs', [
      [MABEL, 'Need Acorns, dear? I dispatch for Kerbstone Cabs, round the corner.'],
      [MABEL, 'Cabs, parcels, charters, boats. Sign on at a depot, do one job.'],
    ]),
    objectives: [
      { kind: 'visit', text: 'Find the Kerbstone Cabs rank round the corner', at: CAB_RANK, radius: 6, hint: 'Kerbstone Cabs rank (Downtown)' },
      { kind: 'probe', text: 'Finish any job: a taxi fare, a parcel round, a charter or a boat trip', probe: 'job-gigs', hint: 'Any job depot' },
    ],
    doneText: 'Mabel takes a bit off your taxi fares. "Staff discount, dear."',
  },
  {
    id: 'nc-take-off',
    title: 'Wings Over the Flats',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 100,
    cutscene: card('Wings Over the Flats', [
      [MABEL, 'Wind-Sock Wally at the airfield says he has three aircraft and no pilots.'],
      ['Wind-Sock Wally', 'Hedge-Hopper, Sycamore Copter, Dandelion Drifter. Pick one. Go up. Come down soft.'],
      ['Wind-Sock Wally', 'Stop on the apron and open the Slipway. Paint it ugly, I don\'t mind.'],
    ]),
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Take any aircraft up through the ring over the Desert Airfield',
        hint: 'Desert Airfield',
        points: [{ at: [AIRFIELD.x, AIRFIELD.z], height: 25, radius: 12, label: 'The ring over the runway' }],
      },
      { kind: 'probe', text: 'Land, stop, and paint or tune it at the Wingwright\'s Slipway', probe: 'spend:Wingwright\'s Slipway', at: [AIRFIELD.x, AIRFIELD.z], hint: 'Wingwright\'s Slipway (stopped, in your aircraft)' },
    ],
    doneText: 'Wally gets you a discount at the Wingwright\'s Slipway.',
  },
  {
    id: 'nc-sky-spotting',
    title: 'Sky Spotting',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('Sky Spotting', [
      [MABEL, 'Hedda from the Tattler wants eyes on the sky.'],
      ['Hedda Galley', 'Banner plane. Over town. Daily. Find it. Read it.'],
      ['Hedda Galley', 'Pigeon-Drop parcels fall too. Catch one. Exclusive.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Find the plane towing the sky banner and get close (look up!)', probe: 'banner-near', absolute: true, hint: 'The sky over Turfton' },
      { kind: 'visit', text: 'Tell Hedda what it said, at the Kerbside Exchange', at: EXCHANGE, radius: 7, hint: 'Kerbside Exchange (Central Bus Stop)' },
    ],
    doneText: 'Hedda tips you off: Pigeon-Drop parcels pay you a bit more.',
  },
  {
    id: 'nc-tuft-and-tally',
    title: 'Tuft & Tally',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 100,
    cutscene: card('Tuft & Tally', [
      [MABEL, 'Hazel Mattock at the Tuft & Tally Lodge takes on beginners. Mossy Wood.'],
      ['Hazel Mattock', 'License first. Then sneak, crouch, knock one over. Nobody gets hurt.'],
      ['Hazel Mattock', 'Comb the tuft, fill your bag, sell it at my counter.'],
    ], HOST_LOOK.hazel),
    objectives: [
      { kind: 'probe', text: 'Buy a Tuft License from Hazel at the lodge', probe: 'hunt-licensed', absolute: true, at: LODGE_DOOR, hint: 'Tuft & Tally Lodge (Mossy Wood)' },
      { kind: 'probe', text: 'Sneak up on a quarry, knock it over, and comb its tuft', probe: 'hunt-combed', hint: 'Mossy Wood' },
      { kind: 'probe', text: 'Sell your bag at the lodge counter', probe: 'hunt-sold', at: LODGE_DOOR, hint: 'Tuft & Tally Lodge counter' },
    ],
    doneText: 'Hazel pays a little more for your tufts from now on.',
  },
  {
    id: 'nc-last-stop-pebblewick',
    title: 'Last Stop, Pebblewick',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 80,
    cutscene: card('Last Stop, Pebblewick', [
      [MABEL, 'There\'s a town past the Dust Flats. Pebblewick. It insists it\'s a town.'],
      [MABEL, 'Drive out there, see the square, ride the Hopper home.'],
    ]),
    objectives: [
      { kind: 'visit', text: 'Get to Pebblewick\'s market square, out past the Dust Flats', at: PEBBLEWICK_SQUARE, radius: 20, hint: 'Pebblewick (far east)' },
      { kind: 'probe', text: 'Ride the Pebblewick Hopper bus (from Pebblewick or the Central Bus Stop)', probe: 'spend:Pebblewick Hopper', hint: 'The Hopper stop' },
    ],
    doneText: 'Mabel gets you a Hopper season ticket: half fare.',
  },
  {
    id: 'nc-reedwatch',
    title: 'Reedwatch',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 100,
    cutscene: card('Reedwatch', [
      [MABEL, 'Dunnock Pell at the Reedwatch Hide wants a quiet newcomer. Can you be quiet?'],
      ['Dunnock Pell', 'Binoculars up. Find a bird. Write it down. Listen for the ones you can\'t see.'],
      ['Dunnock Pell', 'A photograph, if you\'re steady. The Tattler pays for those.'],
    ], HOST_LOOK.dunnock),
    objectives: [
      { kind: 'probe', text: 'Raise your binoculars and log a new bird', probe: 'bird-seen', at: [HIDE.x, HIDE.z], hint: 'Reedwatch Hide (Loch Moss)' },
      { kind: 'probe', text: 'Log a bird by its call', probe: 'bird-heard', hint: 'Listen near the reeds' },
      { kind: 'probe', text: 'Take a bird photograph', probe: 'bird-photos', hint: 'Through the binoculars' },
    ],
    doneText: 'Dunnock signs your card. New birds and bird photos pay a bit more.',
  },
  {
    id: 'nc-hangar-and-boathouse',
    title: 'Hangar and Boathouse',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 100,
    cutscene: card('Hangar and Boathouse', [
      [MABEL, 'Tansy says the Lock-Up is for mowers. Planes and boats need bigger sheds.'],
      ['Tansy Clayfoot', 'Hangar Two at the airfield. The Mossbank Boathouse on the loch. Both for sale.'],
      ['Tansy Clayfoot', 'Go and look. Then take a boat out. Gently.'],
    ]),
    objectives: [
      { kind: 'visit', text: 'Look round Hangar Two at the Desert Airfield', at: [ESTATES.hangar.x, ESTATES.hangar.z], radius: 12, hint: 'Hangar Two (Desert Airfield)' },
      { kind: 'visit', text: 'Look round the Mossbank Boathouse on Loch Moss', at: [ESTATES.boathouse.x, ESTATES.boathouse.z + 10], radius: 12, hint: 'Mossbank Boathouse (Loch Moss)' },
      { kind: 'probe', text: 'Take any boat out on the water', probe: 'boat', absolute: true, hint: 'Any boat' },
    ],
    doneText: 'Tansy put in a word: Hangar Two and the Mossbank Boathouse cost you a little less.',
  },
  {
    id: 'nc-party',
    title: 'Throw a Party (online)',
    giver: NEWCOMERS_GIVER,
    rewardAcorns: 40,
    cutscene: card('Throw a Party', [
      [MABEL, 'Nina says Turfton\'s better with friends. If you have the link, dear.'],
      ['Neon-Moth Nina', 'Online, open Parties. Start one or join one. Offline? Skip it, sugar.'],
    ]),
    objectives: [
      { kind: 'probe', text: 'Online: start or join a party (skip this one offline: abandon it in the Journal)', probe: 'party-on', absolute: true, hint: 'Parties (online)' },
    ],
    doneText: 'Party stamp. Acorn-Flour Cake costs a bit less: bring one next time.',
  },
];

/** The stamps on the Newcomers' Card (every newcomer job except the optional online party one). */
export const NEWCOMER_CARD_IDS: readonly string[] = NEWCOMER_QUESTS.filter((q) => q.id !== 'nc-party').map((q) => q.id);
/** Achievement for a full Newcomers' Card. */
export const NEWCOMER_CARD_ACHIEVEMENT = 'gta-newcomer-card';

/** Pure: every stamp on the card is done. */
export function newcomerCardDone(saves: Readonly<Record<string, { state: string } | undefined>>): boolean {
  return NEWCOMER_CARD_IDS.every((id) => saves[id]?.state === 'done');
}
