// E26: who is at each street-race meet and what they say, written from lore (docs/lore/entries/apocrypha/turfton-street-racing.md,
// skyway-foot.md, pardonlin-boucle.md, saltbucket-lay-by.md and the people entries beside them). Contract: MeetCast in ./types.
import type { GnomeLook } from '@lawn/gnome';
import type { RaceRival } from '../quests/types';
import type { MeetCast, MeetId } from './types';

const rival = (
  name: string, look: Partial<GnomeLook>, tint: number, pace: number, grip: number, line: number, aggression: number, taunts: string[],
): RaceRival => ({ name, look, tint, pace, grip, line, aggression, taunts });

/** The questline's rival: a street racer with a grudge, who races in sr-skyway-midnight and the Ring Road finale. */
export const STREET_RIVAL: RaceRival = rival(
  'Sable Throttlewick', { hat: 0x6b2a8a, shirt: 0x1a1a24, beard: null, dress: true, freckles: true }, 0x6b2a8a, 1.0, 1.05, -1, 0.6,
  ['The Ring Road record is my brother\'s. I am only looking after it.', 'Move over. I have been waiting for this tarmac since the impound.'],
);

export const MEET_CAST: Readonly<Record<MeetId, MeetCast>> = {
  'skyway-foot': {
    organiser: {
      id: 'street-skyway-foot', name: 'Ratchet Gaskin', look: { hat: 0xff6a00, shirt: 0x24242c, beard: 0x4a3a2a, glasses: true },
      bubble: 'Skyway Foot, after dark. The Watch knows. The Watch has been told it is a car boot sale.', idle: 'cross-arms',
    },
    bookie: {
      id: 'street-skyway-foot-bookie', name: 'Tuppence Pomfret', look: { hat: 0x2f6b2a, shirt: 0xe8d9a0, beard: 0xb0a090 }, idle: 'tap-foot',
      bubble: 'Wagers on the Skyway Sprint. Acorns only. I do not do IOUs, I do IDKs.',
      takeLines: ['Twenty-five on you? Brave. Noted.', 'Your acorns are on the counter, which is a bonnet.', 'Stake taken. Do not make me look at the receipt.'],
      winLines: ['Paid, and I am smiling through it.', 'You have beaten the odds. I set those odds.', 'Winner. Here, double, and a look.'],
      loseLines: ['Lovely. The house thanks you.', 'Better luck next heat. The house will be here.', 'Your acorns are with me now. They like it here.'],
    },
    flagger: {
      id: 'street-skyway-foot-flagger', name: 'Wick "Chequers" Lisle', look: { hat: 0xf4f4f4, shirt: 0x1a1a1a, beard: null, freckles: true },
      bubble: 'Flag is up. Flag is down. That is the whole job and I have never once got it wrong.', idle: 'look-around',
    },
    residents: [
      {
        id: 'street-skyway-foot-r1', name: 'Kipper Bodkin', look: { hat: 0x8a6a4a, shirt: 0x5a6a7a, beard: 0xd0c8b8 }, idle: 'scratch-head',
        does: 'polishing a hubcap that is not attached to anything', bubble: 'It has not had a car since 1998. It has never been cleaner.',
      },
      {
        id: 'street-skyway-foot-r2', name: 'Verbena Plimsoll', look: { hat: 0xd8342c, shirt: 0xf2e6c8, beard: null, dress: true }, idle: 'think',
        does: 'checking tyre pressures with a thumb and a very serious face', bubble: 'Thirty-two. Thirty-two. Thirty-one, you cheeky tyre.',
      },
    ],
    roster: [
      rival('Bolt-Hole Barney', { hat: 0x2a7a8a, shirt: 0x3a3a3a, beard: 0x6a5a4a }, 0x2a7a8a, 0.92, 0.95, -2, 0.4, ['I have never been here. I was never here. Mind my wing mirror.', 'Slow down, it is a meet, not a race. Oh, it is a race.']),
      rival('Flo Camshaft', { hat: 0xff5fa2, shirt: 0x24242c, beard: null, dress: true }, 0xff5fa2, 0.98, 1.0, 1, 0.5, ['The Carburettors taught me to drift. The Watch taught me to stop.', 'You are in my lane. It is a lane I made up.']),
      rival('Gasket Greaves', { hat: 0xffd21f, shirt: 0x7a4a2a, beard: 0xe0d8c8, glasses: true }, 0xffd21f, 1.02, 1.05, 2, 0.7, ['Low and loud, pal. Low and loud.', 'Mind the pillars. They have never moved for anyone.']),
    ],
    pickupVehicle: 'lowrider',
    signs: [
      { text: 'SKYWAY FOOT', sub: 'Meets after dark. Meets nothing, officially.' },
      { text: 'NO RACING', sub: 'Please do not read this sign aloud while racing.' },
      { text: 'ALL BETS IN ACORNS', sub: 'The house always wins. The house is a Lowrider.' },
      { text: 'CAR BOOT SALE', sub: 'Ask me about my watch.' },
    ],
    vignettes: [
      {
        id: 'sf-hubcap-wall', name: 'The hubcap wall', story: 'A tyre stack and a lamp make a trophy corner: every hubcap lost to a Skyway corner is hung here, with the date.',
        props: [{ id: 'tyre-pile', dx: 0, dz: 0 }, { id: 'oil-drum', dx: 1.6, dz: 0.4 }, { id: 'street-lamp', dx: -1.8, dz: 0.2 }, { id: 'trophy-cup', dx: 0.2, dz: 1.4 }],
      },
      {
        id: 'sf-pit-corner', name: 'The pit corner', story: 'A scrap car on blocks, fuel cans, and a boombox on the bonnet: somebody has been here all week and is not leaving.',
        props: [{ id: 'scrap-car', dx: 0, dz: 0 }, { id: 'fuel-can', dx: 2.2, dz: 0.8 }, { id: 'gsr-boombox', dx: 0.2, dz: -1.4 }, { id: 'camp-stool', dx: -2, dz: 0.6 }],
      },
      {
        id: 'sf-starting-light', name: 'The grid lamp', story: 'Two lamps on a plank and a barrel of spare flags. The Skyway Foot has no lights. It has a gnome with a lamp.',
        props: [{ id: 'street-lamp', dx: -1.5, dz: 0 }, { id: 'street-lamp', dx: 1.5, dz: 0 }, { id: 'barrel', dx: 0.2, dz: 1.4 }, { id: 'crate', dx: -2.4, dz: 1.8 }],
      },
    ],
    crowdLooks: [
      { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null }, { hat: 0x2a7a8a, shirt: 0x5a5a5a, beard: 0xc0b8a8 },
      { hat: 0xd8342c, shirt: 0xe8d9a0, beard: 0x4a3a2a }, { hat: 0xffd21f, shirt: 0x3a3a3a, beard: null, freckles: true },
      { hat: 0x6b2a8a, shirt: 0x24242c, beard: 0x8a7a6a, glasses: true },
    ],
  },

  pardonlin: {
    organiser: {
      id: 'street-pardonlin', name: 'Commissaire Aurelie Fonce', look: { hat: 0x1f3a6a, shirt: 0xf4f4f4, beard: null, dress: true, glasses: true },
      bubble: 'Welcome to Pardonlin. The road is closed, the cones are counted and the race is authorised in triplicate.', idle: 'hands-on-hips',
    },
    bookie: {
      id: 'street-pardonlin-bookie', name: 'Monsieur Bastien Pipette', look: { hat: 0x7a1f3a, shirt: 0xf2e6c8, beard: 0x2a2a2a }, idle: 'think',
      bubble: 'Le Pari. A small wager, nothing so vulgar as a bet. Acorns, please, in a little envelope.',
      takeLines: ['Your envelope is received. How charming.', 'A small wager, noted with a small pen.', 'Stake accepted. Please do not applaud.'],
      winLines: ['Remarkable. Your winnings, in a larger envelope.', 'Bravo. I shall pretend I am not hurt.', 'Victory, and a receipt.'],
      loseLines: ['A pity. The envelope stays with me.', 'Such is racing. Such is envelopes.', 'Next time, perhaps with more conviction.'],
    },
    flagger: {
      id: 'street-pardonlin-flagger', name: 'Odette Marchand', look: { hat: 0xf4f4f4, shirt: 0x1f3a6a, beard: null, dress: true },
      bubble: 'The flag is lowered once, politely. Please do not start before it.', idle: 'cross-arms',
    },
    residents: [
      {
        id: 'street-pardonlin-r1', name: 'Gaspard Lorry', look: { hat: 0x5a6a4a, shirt: 0x8a7a5c, beard: 0xd0c8b8 }, idle: 'think',
        does: 'sweeping the cobbles in front of every car before it starts', bubble: 'Not a pebble. Not for the Grand Prix de Pardonlin.',
      },
      {
        id: 'street-pardonlin-r2', name: 'Mireille Tournesol', look: { hat: 0xffd21f, shirt: 0xe8e0d0, beard: null, dress: true }, idle: 'look-around',
        does: 'measuring the gap between two cones with a ruler, a second time', bubble: 'Two metres and eight centimetres. It is meant to be two and seven.',
      },
    ],
    roster: [
      rival('Hugo Sablier', { hat: 0x1f3a6a, shirt: 0xe8d9a0, beard: 0x5a4632 }, 0x1f3a6a, 0.94, 1.0, 0, 0.3, ['I signal before every corner. Even the ones I invent.', 'Pardon. Pardon. Pardon. Pardon, pardonlin.']),
      rival('Colette Frisson', { hat: 0xd8342c, shirt: 0xf4f4f4, beard: null, dress: true }, 0xd8342c, 1.0, 1.08, -2, 0.4, ['Very correct, very quick. Both can be true.', 'I took the apex. It had a form to sign. I signed.']),
      rival('Anselme Brie', { hat: 0x8a6a4a, shirt: 0x7a1f3a, beard: 0xe0d8c8, glasses: true }, 0x8a6a4a, 0.9, 0.95, 2, 0.2, ['I am in no hurry. Hurry is for baguettes.', 'After you. No, after you. No, after me.']),
    ],
    pickupVehicle: 'deux-pots',
    signs: [
      { text: 'LA BOUCLE DE PARDONLIN', sub: 'Route fermee. Closed road. Closed mind.' },
      { text: 'NO OVERTAKING', sub: 'Ne pas depasser. You will anyway.' },
      { text: 'PARIS', sub: 'Tout pari est une petite enveloppe.' },
      { text: 'COMMISSAIRE', sub: 'Ask me about Form 7.' },
    ],
    vignettes: [
      {
        id: 'pa-cafe-spectators', name: 'The cafe grandstand', story: 'Bistro tables pulled out to the kerb, a chalkboard that says "race", and a vase of geraniums. Pardonlin watches from the cheap seats it has just made.',
        props: [{ id: 'euro-cafe-table', dx: 0, dz: 0 }, { id: 'euro-cafe-chair', dx: -0.9, dz: 0.3 }, { id: 'euro-cafe-chair', dx: 0.9, dz: 0.3 }, { id: 'euro-chalkboard-sign', dx: 1.8, dz: -0.6 }, { id: 'euro-geranium-pot', dx: -1.8, dz: -0.4 }],
      },
      {
        id: 'pa-cone-count', name: 'The cone count', story: 'Bollards in a perfectly straight line, with a podium for the marshal. Everything is counted twice.',
        props: [{ id: 'euro-bollard', dx: -2, dz: 0 }, { id: 'euro-bollard', dx: -1, dz: 0 }, { id: 'euro-bollard', dx: 0, dz: 0 }, { id: 'euro-bollard', dx: 1, dz: 0 }, { id: 'traffic-podium', dx: 0, dz: 1.8 }],
      },
      {
        id: 'pa-marshal-post', name: 'The marshals\' post', story: 'A stop-go paddle, a trough of flowers and a bike rack: the marshals came by bicycle and mean to be there all day.',
        props: [{ id: 'stop-go-paddle', dx: 0, dz: 0 }, { id: 'euro-flower-trough', dx: 1.8, dz: 0.2 }, { id: 'euro-bike-rack', dx: -1.8, dz: 0.4 }, { id: 'euro-bistro-set', dx: 0.2, dz: 2.2 }],
      },
    ],
    crowdLooks: [
      { hat: 0x1f3a6a, shirt: 0xf4f4f4, beard: null, dress: true }, { hat: 0x7a1f3a, shirt: 0xe8d9a0, beard: 0x8a7a6a },
      { hat: 0xf2e6c8, shirt: 0x5a6a4a, beard: 0xd0c8b8, glasses: true }, { hat: 0xd8342c, shirt: 0x1f3a6a, beard: null },
      { hat: 0x2a2a2a, shirt: 0xf4f4f4, beard: 0x2a2a2a },
    ],
  },

  saltbucket: {
    organiser: {
      id: 'street-saltbucket', name: 'Dune Gritstone', look: { hat: 0xe8d9a0, shirt: 0x2a7a8a, beard: 0xd8c8a8, freckles: true },
      bubble: 'Lay-by meet. Sand on the road, gulls on the roof, snacks on the van. Race the coast road if you must.', idle: 'look-around',
    },
    bookie: {
      id: 'street-saltbucket-bookie', name: 'Shingle Nan Trimm', look: { hat: 0xff5fa2, shirt: 0xf2e6c8, beard: null, dress: true }, idle: 'lean-back',
      bubble: 'Wagers taken from a deckchair. Acorns in the bucket, please. The bucket is for acorns.',
      takeLines: ['In the bucket it goes. Plop.', 'Got it. The gulls have not seen it.', 'Stake taken. Hold your hat.'],
      winLines: ['You won! Take it before a gull does.', 'Double, and a sticky seaside handshake.', 'The bucket is lighter, and so am I.'],
      loseLines: ['The sea takes, the bucket keeps.', 'Gone, like the tide. Back again tomorrow.', 'Tough luck. Have a chip.'],
    },
    flagger: {
      id: 'street-saltbucket-flagger', name: 'Spade Ormerod', look: { hat: 0xffd21f, shirt: 0xd8342c, beard: 0x8a6a4a },
      bubble: 'I drop the flag. The gulls drop everything else.', idle: 'tap-foot',
    },
    residents: [
      {
        id: 'street-saltbucket-r1', name: 'Haddock Hobbs', look: { hat: 0xf4f4f4, shirt: 0x2a7a8a, beard: 0xe0d8c8 }, idle: 'stretch',
        does: 'frying chips in the snack van for racers who have not yet finished', bubble: 'Chips on the finish line. Order now, collect when you stop.',
      },
      {
        id: 'street-saltbucket-r2', name: 'Limpet Larkin', look: { hat: 0xd8342c, shirt: 0xe8d9a0, beard: null, freckles: true }, idle: 'think',
        does: 'building a sandcastle copy of the racing line, with a tiny tide wall', bubble: 'Do not drive over turn four. It is the nice turret.',
      },
    ],
    roster: [
      rival('Dinghy Dolores', { hat: 0x2a7a8a, shirt: 0xf4f4f4, beard: null, dress: true }, 0x2a7a8a, 0.93, 0.95, -1, 0.3, ['I came on the bus. I am winning by the bus.', 'The sea is that way. Not here.']),
      rival('Rip-Tide Rufus', { hat: 0xffd21f, shirt: 0x1a3a6a, beard: 0x6a5a4a }, 0xffd21f, 1.0, 1.05, 2, 0.6, ['Sand in the gearbox. Salt in the beard.', 'Outside line is the sea line. I like the sea line.']),
      rival('Winkle Pickering', { hat: 0xe8d9a0, shirt: 0x7a4a2a, beard: 0xc9c2b4, glasses: true }, 0xe8d9a0, 0.9, 0.9, 0, 0.25, ['I was here first. I was here yesterday, too.', 'Mind the gull. The gull minds you.']),
    ],
    pickupVehicle: 'wespa',
    signs: [
      { text: 'SALTBUCKET LAY-BY', sub: 'Parking for racers. Racing for parkers.' },
      { text: 'CHIPS', sub: 'Eat before the Dash. Or after. Or during.' },
      { text: 'MIND THE GULLS', sub: 'They bite the ones who are not paying attention.' },
      { text: 'BETS', sub: 'Taken from the deckchair.' },
    ],
    vignettes: [
      {
        id: 'sb-snack-van', name: 'The snack van', story: 'A stall, a bench and a candyfloss cart: the lay-by feeds everyone, and gulls are watching the queue.',
        props: [{ id: 'boardwalk-stall', dx: 0, dz: 0 }, { id: 'candyfloss-cart', dx: 2, dz: 0.6 }, { id: 'bench', dx: -2, dz: 0.8 }, { id: 'gull-sign', dx: 0.2, dz: 1.8 }],
      },
      {
        id: 'sb-sandcastle-line', name: 'The sandcastle line', story: 'A sandcastle, a bucket and spade, and an umbrella: a model of the road with a very small tide wall.',
        props: [{ id: 'sandcastle', dx: 0, dz: 0 }, { id: 'bucket-and-spade', dx: 1.4, dz: 0.4 }, { id: 'beach-umbrella', dx: -1.8, dz: 0.2 }, { id: 'beach-ball', dx: 0.4, dz: 1.4 }],
      },
      {
        id: 'sb-lifeguard', name: 'The lifeguard chair', story: 'A lifeguard chair facing the road instead of the sea, because the road is the more dangerous of the two.',
        props: [{ id: 'lifeguard-chair', dx: 0, dz: 0 }, { id: 'tin-shy', dx: 2, dz: 0.4 }, { id: 'wooden-post', dx: -1.6, dz: 0.2 }, { id: 'message-bottle', dx: 0.6, dz: 1.4 }],
      },
    ],
    crowdLooks: [
      { hat: 0xe8d9a0, shirt: 0x2a7a8a, beard: 0xc0b8a8 }, { hat: 0xff5fa2, shirt: 0xf4f4f4, beard: null, dress: true },
      { hat: 0xffd21f, shirt: 0xd8342c, beard: null, freckles: true }, { hat: 0x2a7a8a, shirt: 0xe8d9a0, beard: 0x6a5a4a },
      { hat: 0xf4f4f4, shirt: 0x1a3a6a, beard: 0xd8c8a8, glasses: true },
    ],
  },
};
