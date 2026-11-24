// Sim jobs: the job table, career levels and perks, tuning numbers and achievement ids. Pure data (tweak here).
// Lore: docs/lore/entries/apocrypha/ (kerbstone-cabs, pigeon-drop-depot, wallys-charters, steamer-tickets, mossbank-tubes).
import type { GigKind, JobId, JobPerks, ParcelKind, Personality } from './types';

export interface JobDef {
  id: JobId;
  /** "Taxi Driver". */
  title: string;
  icon: string;
  /** Who you work for. */
  employer: string;
  /** The dispatcher at the depot (a lore character). */
  giver: string;
  /** One line for the board. */
  blurb: string;
  /** The depot kiosk: target spot (visuals.ts searches outward from here for clear dry ground) and its prefab. */
  depot: { x: number; z: number; name: string; prefab: string };
  /** Acorns to sign on the first time (0 = free). */
  licence: number;
  /** Vehicles this job accepts (runtime.ts vehicleOk): 'ground-seats' = a ground vehicle with a passenger seat,
   *  'ground' = any ground vehicle, 'air' = any aircraft, 'boat' = any boat. */
  vehicle: 'ground-seats' | 'ground' | 'air' | 'boat';
  /** Map/HUD colour. */
  color: string;
  /** The achievement whose reward hat/bag is this job's uniform. */
  uniform: { achievement: string; prefab: string };
}

export const JOBS: Record<JobId, JobDef> = {
  taxi: {
    id: 'taxi', title: 'Taxi Driver', icon: '🚖', employer: 'Kerbstone Cabs', giver: 'Mabel Kerbstone',
    blurb: 'Any car with a spare seat. Fares hail you at the kerb: get them there smooth and quick.',
    depot: { x: -30, z: 52, name: 'Kerbstone Cabs rank', prefab: 'cab-rank-booth' },
    licence: 0, vehicle: 'ground-seats', color: '#ffd23f',
    uniform: { achievement: 'gta-job-cabbie', prefab: 'checker-visor' },
  },
  courier: {
    id: 'courier', title: 'Courier', icon: '📦', employer: 'Pigeon-Drop Couriers', giver: 'Sorting-Office Sid',
    blurb: 'Bike, cart or van. Load parcels at the depot and drop them round town and the outskirts.',
    depot: { x: -150, z: 150, name: 'Pigeon-Drop depot', prefab: 'pigeon-drop-depot' },
    licence: 0, vehicle: 'ground', color: '#ff8a3d',
    uniform: { achievement: 'gta-job-courier', prefab: 'pigeon-drop-satchel' },
  },
  pilot: {
    id: 'pilot', title: 'Pilot', icon: '🛩', employer: "Wally's Charters", giver: 'Wind-Sock Wally',
    blurb: 'Charters, scenic loops and cargo drops out of the Desert Airfield. Land soft.',
    depot: { x: 500, z: -80, name: "Wally's charter desk", prefab: 'charter-desk' },
    licence: 150, vehicle: 'air', color: '#7cf0ff',
    uniform: { achievement: 'gta-job-pilot', prefab: 'charter-pilot-cap' },
  },
  boat: {
    id: 'boat', title: 'Boat Driver', icon: '⛴', employer: 'Loch Moss Steamer Co.', giver: 'Purser Tolly',
    blurb: 'Water taxi between the docks and the Steamer loop on Loch Moss. Mind the waves.',
    depot: { x: -724, z: -548, name: 'Steamer ticket booth', prefab: 'steamer-ticket-booth' },
    licence: 80, vehicle: 'boat', color: '#3fd2ff',
    uniform: { achievement: 'gta-job-ferry', prefab: 'ferryman-cap' },
  },
};

/** XP needed to reach level i+1 (index 0 = level 1). Level 6 is the top. */
export const LEVEL_XP: readonly number[] = [0, 100, 250, 500, 900, 1500];
export const MAX_LEVEL = LEVEL_XP.length;

/** Gig kinds per job, and the level each unlocks at. */
export const KIND_LEVEL: Record<JobId, Partial<Record<GigKind, number>>> = {
  taxi: { fare: 1, 'player-fare': 1 },
  courier: { route: 1 },
  pilot: { charter: 1, scenic: 2, cargo: 3 },
  boat: { 'water-taxi': 1, ferry: 2 },
};

/** The perks of `job` at `level` (1..MAX_LEVEL). Same rules for every job, with job-specific capacity. */
export function perksFor(job: JobId, level: number): JobPerks {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const kinds = (Object.entries(KIND_LEVEL[job]) as [GigKind, number][]).filter(([, at]) => at <= l).map(([k]) => k);
  const tipMult = 1 + 0.1 * (l >= 2 ? 1 : 0) + 0.1 * (l >= 5 ? 1 : 0);
  const payMult = 1 + 0.08 * (l - 1);
  const spawnMult = l >= 3 ? 1.3 : 1;
  const capacity = job === 'courier' ? Math.min(5, 1 + l) : job === 'boat' ? Math.min(3, 1 + Math.floor(l / 2)) : 1;
  const lines: string[] = [];
  if (l >= 2) lines.push('Tips +10%');
  if (l >= 3) lines.push('Work comes 30% sooner');
  if (l >= 4) lines.push(job === 'taxi' || job === 'courier' ? 'Long hauls to Pebblewick and the outskirts' : 'Longer routes');
  if (l >= 5) lines.push('Tips +20%');
  if (l >= 3) lines.push('Celebrity clients');
  lines.push(`Base pay +${Math.round((payMult - 1) * 100)}%`);
  return { tipMult, payMult, spawnMult, kinds, capacity, lines };
}

export const JOB_TUNING = {
  /** Seconds out of the job vehicle before a running gig fails. */
  outOfVehicleS: 20,
  /** Seconds between the end of one gig and the next offer (divided by perks.spawnMult * surge.spawnMult). */
  nextGigS: 9,
  taxi: {
    /** Kerb pickups are a road node this far from the car (m). */
    pickupMin: 50, pickupMax: 220,
    /** Destinations at least this far from the pickup (m); level >= 4 allows outskirts places. */
    destMin: 120,
    /** Seconds a fare waits at the kerb (hardDue of the pickup stop). */
    patience: 75,
    /** Fare = base + perM * straight-line distance; time limit = dist / cruise + slack. */
    base: 12, perM: 0.09, cruise: 9, slack: 25,
    pickupRadius: 7, dropRadius: 9, maxSpeed: 2.5, dwell: 0.8,
  },
  courier: {
    /** Pay per parcel kind (before condition and time). */
    pay: { food: 22, fragile: 30, heavy: 34, vip: 60, mail: 9 } as Record<ParcelKind, number>,
    /** Seconds per drop leg allowed: dist / cruise + slack; food and vip are tighter (x0.75). */
    cruise: 9, slack: 20,
    dropRadius: 8, maxSpeed: 3, dwell: 1.0, loadRadius: 10, loadDwell: 2.0,
    /** Heavy parcels need spec.mass >= this. */
    heavyMass: 2.5,
    /** Parcels a vehicle carries: push-bike 2, otherwise this many (capped by perks.capacity). */
    bikeCap: 2, defaultCap: 5,
  },
  pilot: {
    charterBase: 45, perM: 0.08, scenicBase: 60, cargoBase: 70,
    landRadius: 14, landSpeed: 3.5, landDwell: 1.2, gateRadius: 26, gateMinAlt: 12, gateMaxAlt: 140,
    cargoRadius: 70, cruise: 25, slack: 45,
  },
  boat: {
    base: 18, perM: 0.1, cruise: 10, slack: 30, dockRadius: 9, maxSpeed: 2.5, dwell: 1.2,
    /** The ferry loop: seconds allowed per leg (due times stack). */
    ferryLeg: 70, ferryPay: 70,
  },
  /** Tips: up to this fraction of base pay at 5 stars (x perks.tipMult). */
  tipMax: 0.35,
  /** Real player fare bonus (Acorns) on top of the fare. */
  playerFareBonus: 25,
  /** Celebrity: base x2, tip x2, comfort counts double. */
  celebrityMult: 2,
} as const;

/** Chatter: what NPC fares say (spoken through voice/speech.ts speakAt and shown as a toast). Keyed by personality. */
export const CHATTER: Record<Personality, { board: string[]; ride: string[]; good: string[]; bad: string[] }> = {
  plain: {
    board: ['Afternoon. Just there, please.', 'Thanks for stopping.', 'Nice and easy, if you can.'],
    ride: ['Busy on the paths today.', 'They have painted the hedges again.', 'My cousin drives a combine. Badly.'],
    good: ['Lovely, thank you.', 'Smooth as a glazed hat.'],
    bad: ['I will be walking next time.', 'My hat is in my lap now.'],
  },
  hurry: {
    board: ['Go, go, go! I am late!', 'Faster than the Snail-Coach, please!', 'Step on the pedal, dear.'],
    ride: ['Is there a shortcut?', 'Take the lawn, nobody minds!', 'Every second is an acorn.'],
    good: ['Made it! Keep the change!', 'That was quick. Nice.'],
    bad: ['I could have hopped there.', 'Late. Again. Thanks.'],
  },
  nervous: {
    board: ['Please do not go fast.', 'Is this thing insured?', 'I bruise like a teacup.'],
    ride: ['Mind the bump!', 'Was that a gnome?', 'I am holding my hat on.'],
    good: ['Oh, that was very gentle. Thank you.', 'Not a chip on me!'],
    bad: ['I think I have a hairline crack.', 'Never again. Never.'],
  },
  chatty: {
    board: ['Ooh, a new driver! Where are you from?', 'Have you heard about the loch monster?'],
    ride: ['My neighbour grows prize turnips.', 'Did you see the banner plane?', 'I know the Gnomecino doorman.'],
    good: ['Lovely chat! Same time tomorrow?', 'You are a good listener.'],
    bad: ['You never once said "really?"', 'Well, I never.'],
  },
  celebrity: {
    board: ['No photos. Drive.', 'Sunglasses stay on. Discretion, darling.'],
    ride: ['Is the Tattler following us?', 'Avoid the Greenhouse Strip, the fans.'],
    good: ['Divine. Have an autograph and a tip.', 'You may tell your friends.'],
    bad: ['My agent will hear about this.', 'Ghastly. Simply ghastly.'],
  },
};

/** Achievement ids (packages/achievements/src/catalog.ts). Each has its own cosmetic reward. */
export const JOB_ACHIEVEMENTS = {
  /** 10 taxi fares (target 10) -> head 'checker-visor'. */
  cabbie: 'gta-job-cabbie',
  /** A five-star taxi fare -> neck 'meter-medal'. */
  fiveStar: 'gta-job-five-star',
  /** 15 parcels (target 15) -> back 'pigeon-drop-satchel'. */
  courier: 'gta-job-courier',
  /** A fragile parcel delivered without a scratch -> hand 'bubble-wrap-roll'. */
  notAScratch: 'gta-job-not-a-scratch',
  /** 5 pilot gigs (target 5) -> head 'charter-pilot-cap'. */
  pilot: 'gta-job-pilot',
  /** A landing scoring >= 95 with passengers aboard -> neck 'flight-scarf'. */
  butter: 'gta-job-butter',
  /** A full ferry loop -> head 'ferryman-cap'. */
  ferry: 'gta-job-ferry',
  /** Carry a real online player as a taxi fare -> back 'dispatch-radio'. */
  realFare: 'gta-job-real-fare',
  /** Reach level 5 in any job -> hand 'night-shift-lantern'. */
  career: 'gta-job-career',
  /** 60 seconds towed on a tube (target 60) -> head 'tube-goggles'. */
  tubeRider: 'gta-tube-rider',
  /** Tow 3 riders at once -> neck 'tow-whistle'. */
  towCaptain: 'gta-tow-captain',
  /** Finish the Loch Moss buoy run -> hand 'buoy-pennant'. */
  buoyRun: 'gta-buoy-run',
} as const;

/** The 44 px job-action button, the I key (keys.ts KEYS.jobAction) and the gamepad's right stick press. */
export const JOB_PAD_BUTTON = 11;
