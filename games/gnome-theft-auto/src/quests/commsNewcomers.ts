// Mission comms for the Newcomers' Card tutorials (newcomerQuests.ts): the club host's tip as each step starts.
// Same rules as comms.ts: at most 16 words a line, the speaker's own voice, one place name per call.
import type { CommsCall } from './comms';

const brief = (...lines: [string, string][]): CommsCall => ({ mode: 'briefing', lines: lines.map(([who, text]) => ({ who, text })) });
const call = (...lines: [string, string][]): CommsCall => ({ mode: 'call', lines: lines.map(([who, text]) => ({ who, text })) });

/** Hosts who are not in the city cast. */
export const NEWCOMER_CALLER_NAMES: Readonly<Record<string, string>> = {
  hazel: 'Hazel Mattock',
  dunnock: 'Dunnock Pell',
  wenna: 'Wenna Gudgeon',
};

export const NEWCOMER_COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = {
  'nc-good-neighbour': {
    0: brief(['dot', 'Street events pop up near you. Look for the marker, lend a hand.'], ['mabel', 'Any good turn counts, dear. Then come and see me.']),
    1: call(['mabel', 'That\'s the spirit. Back to the Central Bus Stop for your stamp.']),
  },
  'nc-strike-a-pose': {
    0: brief(['nina', 'Emote menu, sugar: {emote}. Pick anything. Make it loud.']),
    1: call(['nina', 'Now a handshake or a high five. Stand next to somebody first.']),
    2: call(['nina', 'Three more. Different ones. Nobody remembers a one-trick gnome.']),
  },
  'nc-wheel-and-kit': {
    0: brief(['pip', 'Hold {switchGun}! The wheel! Go on!']),
    1: call(['pip', 'Spanner in the middle! That\'s the Pocket Kit! Mods anywhere!']),
    2: call(['pip', 'The big bench is at Ammu-Gnation. Every gun is free. The shiny bits aren\'t.']),
  },
  'nc-lockup': {
    0: brief(['tansy', 'Drive anything into my bay at Side-Valve. It\'s stored. That\'s it.']),
    1: call(['tansy', 'Phone, Lock-Up, pick it. The Sling-Lift drops it by you. Small fee.']),
  },
  'nc-mind-the-verges': {
    0: brief(['juniper', 'Flower beds, ferns, long grass. Drive over them. They grow back. Ten, please.']),
    1: call(['juniper', 'The putting-green cart lives by the Country Club. Borrow it. Return optional.']),
  },
  'nc-bent-pin': {
    0: brief(['wenna', 'Rods are on the counter. Cheapest one catches fish fine.']),
    1: call(['wenna', 'Face the water, hold to cast, wait for the bob. Reel steady.']),
    2: call(['wenna', 'Bring me the cards. Fish stay in the canal. Acorns go in your pocket.']),
  },
  'nc-skyway': {
    0: brief(['grout', 'West on-ramp, brother. Up on the deck. Drive it end to end.']),
    1: call(['grout', 'Now the Unfinished Span, east of the airfield. Floor it off the end.']),
  },
  'nc-odd-jobs': {
    0: brief(['mabel', 'Kerbstone Cabs rank is just round the corner, dear.']),
    1: call(['mabel', 'Sign on at any depot. Cabs, parcels, charters, boats. One job.']),
  },
  'nc-take-off': {
    0: brief(['wally', 'Aircraft are on the apron. Throttle, lift, up through my ring. Come down gentle.']),
    1: call(['wally', 'Land it, stop it, open the Slipway. Paint it whatever you like.']),
  },
  'nc-sky-spotting': {
    0: brief(['hedda', 'Banner plane. Low. Slow. Over town. Get under it. Read it.']),
    1: call(['hedda', 'Got it? Exchange. My desk. Now.']),
  },
  'nc-tuft-and-tally': {
    0: brief(['hazel', 'License at my counter first. No license, no tufts.']),
    1: call(['hazel', 'Crouch, come in downwind, knock one over. Then comb it gently.']),
    2: call(['hazel', 'Bag full or not, bring it back. I pay fair.']),
  },
  'nc-last-stop-pebblewick': {
    0: brief(['mabel', 'East past the Dust Flats, dear. Follow the road till it stops being a road.']),
    1: call(['mabel', 'The Hopper stop is by the square. It comes when you ask.']),
  },
  'nc-reedwatch': {
    0: brief(['dunnock', 'Binoculars up. Slowly. Hold on a bird until it\'s logged.']),
    1: call(['dunnock', 'Now listen. Some birds you only hear. The scope shows the call.']),
    2: call(['dunnock', 'Steady now. A photograph. Breathe out first.']),
  },
  'nc-hangar-and-boathouse': {
    0: brief(['tansy', 'Hangar Two first, at the airfield. Look, don\'t buy. Yet.']),
    1: call(['tansy', 'Now the Mossbank Boathouse on Loch Moss. Same deal.']),
    2: call(['tansy', 'Take any boat out. Mind the dock.']),
  },
  'nc-party': {
    0: brief(['nina', 'Online only, sugar. Parties panel, start or join. Offline, just skip it.']),
  },
};
