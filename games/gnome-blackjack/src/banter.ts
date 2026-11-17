// What the gnomes say. Lines are data (LINES, GENERIC); banterFor picks a speaker and a line per table event.
import { DEALER_CHAR } from './characters';
import { DEALER, type TableEvent, type TableState } from './config';

export type Topic =
  | 'idle' | 'ownBust' | 'ownBlackjack' | 'ownWin' | 'ownLose' | 'ownDouble' | 'ownSplit' | 'ownHit' | 'ownStand'
  | 'tease' | 'cheer' | 'nag' | 'jealous' | 'dealerBust' | 'hello'
  | 'turn' | 'timeout' | 'welcome' | 'leave' | 'broke' | 'roundStart' | 'reveal' | 'gloat' | 'dealerRise';

const DEALER_KEY = 'dealer';
const MAX_LEN = 90;
const NAME_LEN = 16;
// No seat is ever this index; used to mean "no seat to leave out".
const NONE = -2;

type Banter = { seat: number; text: string };

// Keyed by character id (characters.ts), plus 'dealer'. Missing topics fall back to GENERIC.
export const LINES: Record<string, Partial<Record<Topic, string[]>>> = {
  gnorbert: {
    idle: [
      'Bah. Mushrooms were better in my day.',
      '{other}, that hat has seen better decades.',
      'The mower is coming again. I can hear it sulking.',
      'My glasses are fogged. Or the whole table is.',
      'Worms do not tip. I checked. Twice.',
      'Cheese in a card game? Unthinkable. Cheese is for after.',
      '{other}, stop tapping the table. It is a fine table.',
      'I have counted this shoe. Nobody thanks me for it.',
      'A beard was a beard in my day, and nothing else.',
      'Hmph. Somebody tidy those chips, they are all over.',
    ],
    ownBust: [
      'Bust. Obviously. I said twelve was too high.',
      'Ach, over! My glasses saw it coming.',
      'Twenty-two. The dealer just raised an eyebrow.',
      'Bust. Put it in the grumble book.',
    ],
    ownBlackjack: [
      'Blackjack. Do not look so surprised, I am always right.',
      'Ace and king. Take notes, {other}.',
      'Two cards and a whole lot of smugness.',
      'Blackjack! Quiet, the lot of you. I am admiring it.',
    ],
    ownWin: [
      'Won. Careful, I might get used to this.',
      'Ha! Caution pays, you reckless lot.',
      'That is a win. My glasses are very pleased.',
      'Chips to me. Do not ask for a loan.',
    ],
    ownLose: [
      'Lost it. Pah. Bad luck and worse cards.',
      'The house always wins, as my nan used to say.',
      'Down again. I will sulk on the mushroom patch.',
      'Chips gone. My beard is still mine, at least.',
    ],
    ownDouble: [
      'Double?! My heart cannot take this, {other}.',
      'Doubling at my age. Somebody fetch a cushion.',
      'Double. Only because I am bored.',
      'Doubling. Do not tell my grandmother.',
    ],
    tease: [
      '{name}, you went over. Who taught you to count?',
      '{name} busted. Shocking. Truly shocking.',
      'Ha, {name}! Caution is a word, look it up.',
      '{name}, that hand was a gift and you threw it away.',
    ],
    jealous: [
      '{name} won big? Those chips should be mine.',
      'Oh, {name} again. My glasses are green with envy.',
      'Lucky {name}. Lucky, lucky, lucky.',
      '{name}\'s pile is bigger than my whole garden.',
    ],
    nag: [
      '{name}, the clock is ticking. Tick tock, gnome.',
      '{name}, decide, or I will decide for you, grumpily.',
      'Hurry up, {name}. The mushrooms will not wait.',
      '{name}, I have grown a beard waiting for you.',
    ],
  },
  gnadine: {
    idle: [
      'Who is betting big? Me, that is who. Obviously.',
      '{other}, your chips look scared. Come play with the grown-ups.',
      'Lucky hat, lucky pigtails. I am unbeatable tonight.',
      'Fifty chips or nothing, darling. Nothing is boring.',
      'Cheese is for losers. Big bets are for winners.',
      'Let the lawnmower come. I am ready. Mostly.',
      '{other}, is that a mushroom ale or a sad little puddle?',
      'Ooh, I smell a double coming. Or my lunch.',
      'Dealer, make the cards shiny. Shiny cards win.',
      'I would bet my freckles on this, and they are priceless.',
    ],
    ownBust: [
      'Bust! Worth it. Next hand I go even bigger.',
      'Oops. That one was my fault and I am thrilled.',
      'Over! Doesn\'t matter. I still look fabulous.',
      'Twenty-three! Gnadine does not fold, she busts spectacularly.',
    ],
    ownBlackjack: [
      'BLACKJACK! Somebody get me a bigger chair!',
      'Ace-king! Told you I would be a legend tonight.',
      'Yes! Pay the high roller, pay the high roller!',
      'Blackjack, darlings. Frame this moment.',
    ],
    ownWin: [
      'Chips! Lovely, lovely chips. Bring me more.',
      'Winner winner, pigtails for dinner!',
      'I am on a roll and the roll is made of gold.',
      'Another win. The table is mine and I am keeping it.',
    ],
    ownLose: [
      'Lost it! Fine. Doubling next hand, that is the plan.',
      'Ugh, a loss. I will sulk for exactly one hand.',
      'Bad cards, good hair. Let us call it even.',
      'Losing is just winning with more drama.',
    ],
    ownDouble: [
      'DOUBLE! Oh, I am going all in. Watch me.',
      'Doubling! Fortune favours the bold and the pigtailed.',
      'Double down! Nobody dares me. Except everyone.',
      'Here comes the double. Brace yourselves, gnomes.',
    ],
    tease: [
      '{name} played it safe. How adorable and dull.',
      '{name} busted? Gosh, I would have doubled.',
      'Oh {name}, sweetie, tiny bets are for tiny gnomes.',
      '{name}, that hit was brave. Stupid, but brave.',
    ],
    jealous: [
      '{name} won big? Lucky little pigtails.',
      'Oh, {name} gets all the good luck. Unfair!',
      'Who gave {name} all the shiny chips?',
      'I was going to win that pot. {name} stole it.',
    ],
    nag: [
      '{name}, darling, sitting on your hands does not count.',
      '{name}! The clock! Are you asleep in there?',
      'Come on, {name}, be reckless with me for once.',
      '{name}, hit or stand, just pick a bloomin\' one.',
    ],
  },
  grumbo: {
    idle: [
      'Cards.',
      'Hmm.',
      'Grr. {other}, quiet.',
      'Mower is coming. Always coming.',
      'Beard is itchy. Hat is wet.',
      'Bet. Deal. Bet. Deal.',
      'Mushroom. Good. Eat it.',
      'Worm? No. Not today.',
      'Cheese. Bad. Good cheese, bad game.',
      'Grumbo wins. Grumbo always wins. Nearly.',
    ],
    ownBust: [
      'Bust. Grr.',
      'Too many. Grumbo\'s fault.',
      'Twenty-two. Stupid.',
      'Over. Deal again.',
    ],
    ownBlackjack: [
      'Blackjack. Hah.',
      'Ace. King. Mine.',
      'Yes. Blackjack. Pay up.',
      'Hah! Blackjack, grumble-grumble, good.',
    ],
    ownWin: [
      'Won. Good.',
      'Chips. Mine now.',
      'Win. Hmph. Fine.',
      'Pay me. Yes.',
    ],
    ownLose: [
      'Lost. Rubbish.',
      'Lose. Grr.',
      'Bad luck. Bad deck.',
      'Gone. Chips gone.',
    ],
    ownDouble: [
      'Double. Risky. Do it.',
      'Double, grumble, here we go.',
      'Doubling. Do not talk.',
      'Double! Hah.',
    ],
    tease: [
      '{name} bust. Hah.',
      '{name}, too greedy. Grumbo knew.',
      '{name}? Too many cards. Oops.',
      '{name} hits too much. Silly gnome.',
    ],
    jealous: [
      '{name} won big. Grr.',
      '{name} lucky. Not fair.',
      'Hmph. {name} got the good shoe.',
      '{name} again? Grumbo\'s turn.',
    ],
    nag: [
      '{name}. Hurry.',
      '{name}, decide. Now.',
      'Time, {name}. Going, going.',
      '{name}, wake up. Cards wait.',
    ],
  },
  pebble: {
    idle: [
      'Ooh, ooh! Can I deal next? Pleeease?',
      '{other}, do you think worms count as cards?',
      'I found a mushroom shaped like a king!',
      'Is the mower coming? I want to see it!',
      'Lucky hat! Lucky hat! Lucky hat!',
      '{other}, your beard is awesome. Can I touch it?',
      'I have never been to a casino. This is basically one!',
      'The cards are so shiny. Can I lick one?',
      'Are we allowed to bet cheese? I have cheese.',
      'How many cards till the big one? I am counting!',
    ],
    ownBust: [
      'Oops! Busted! That was sooo fun anyway.',
      'Bust! Ha, I am too quick for my own good.',
      'Argh, twenty-three! Next time I will be slow!',
      'Bust! Do not tell Auntie I busted.',
    ],
    ownBlackjack: [
      'BLACKJACK! Did you see? Did you SEE?',
      'Yes! Yes! Ace and king! Best day ever!',
      'I got blackjack! I am telling my mum!',
      'Blackjack! I am a legend now, right?',
    ],
    ownWin: [
      'I won! I won! Chips for everybody. Okay, for me.',
      'Win! Yay! Can I have a hug, or a chip?',
      'Pebble wins again! Pebble is on fire!',
      'Winning tastes like sherbet on the tongue!',
    ],
    ownLose: [
      'Aw, lost it. Okay. Okay! Next one is mine.',
      'Lost! Boo. But losing is still fun, right?',
      'Oh no, chips gone. Hmph. Fine. FINE.',
      'Bad luck! I will get the next one, promise!',
    ],
    ownDouble: [
      'Double! Double! Doubling is my favourite!',
      'I am doubling! Eek, I am so brave right now!',
      'Double it! Double down! Ooh, scary!',
      'I will double, just like the big gnomes do!',
    ],
    tease: [
      '{name} busted! Haha, you went too far!',
      '{name}, you stopped too soon and still busted!',
      'Oops, {name}! Did you count with your toes?',
      'Ha! {name} went bang! Pop! Bust!',
    ],
    jealous: [
      '{name} got a big win?! That is SO unfair!',
      'Waaah, {name} got all the lucky cards!',
      'I want a big win like {name}! Not fair!',
      '{name} is going to buy a castle with those chips!',
    ],
    nag: [
      '{name}! Come on! Hurry up, hurry up!',
      'Ooh, {name}, the timer is almost done!',
      '{name}, pick a thing! Hit or stand, hit or stand!',
      '{name} is taking foreeever! Hurry!',
    ],
  },
  thistle: {
    idle: [
      'Dearie, do sit up straight at the table.',
      '{other}, love, you have got a leaf in your beard.',
      'Would anyone like a nice mushroom biscuit?',
      'Mind the mower, dears. It has no manners.',
      'Oh, a fine hat, {other}. Did you knit it yourself?',
      'I brought a cheese scone. Nobody has to eat it.',
      'Cards are like grandchildren, dear. Full of surprises.',
      '{other}, I will have you know I am sweet, not soft.',
      'Tea? No? Well, I will have mine cold and bitter.',
      'Hush now, the shoe is thinking, dears.',
    ],
    ownBust: [
      'Oh dear, over. I did warn myself about that.',
      'Bust, dearie. Sweetly bust, but bust all the same.',
      'Twenty-four. Lovely effort, now mind the sums.',
      'Bust! I am far too polite to say I told you so.',
    ],
    ownBlackjack: [
      'Blackjack, dears. Do not gasp, it is unbecoming.',
      'Well. Ace and king. I will allow myself a smile.',
      'Blackjack! Sweet as honey, sharp as a pin, that is me.',
      'Blackjack. Tidy as a garden on a Sunday.',
    ],
    ownWin: [
      'A win! How sweet. Mind you pay me promptly.',
      'Lovely, dearie. Winners get the good biscuit.',
      'I won. I am not gloating. Well, only a little.',
      'Win for Auntie. Sharp as a thistle, that is me.',
    ],
    ownLose: [
      'Lost, dear. Chin up. The thistle always grows back.',
      'Oh, a loss. How very character building of me.',
      'Gone, the chips are. Never mind, I will knit more.',
      'Lost it. I will be sweet about it, and quietly cross.',
    ],
    ownDouble: [
      'Double, dears? I will pretend I am not nervous.',
      'I am doubling! Auntie is feeling reckless today.',
      'A double, love. Sweet, but I do sting if crossed.',
      'Doubling. Do not look at me like that, dear.',
    ],
    tease: [
      '{name}, love, you went over. Count, dear, count.',
      'Oh {name}, that is a bust, and you are so sweet about it.',
      '{name} busted! Shame, dear, I did say to stop.',
      '{name}, a bust is not a hobby, sweetheart.',
    ],
    jealous: [
      'Oh, {name} won big. Lovely for them, I suppose.',
      '{name} again! Such a lucky little gnome, aren\'t they.',
      'I would have won that pot, {name}. I would have won it nicely.',
      '{name}, you are spoiling the table, love. Stop it.',
    ],
    nag: [
      '{name}, dear, the clock is ticking. Chop chop.',
      '{name}, sweetheart, decide before I decide for you.',
      'Hurry along now, {name}. We have not all day, dear.',
      '{name}, love, the timer does not do sympathy.',
    ],
  },
  moss: {
    idle: [
      '{other}, that hat is a statement. A bold one.',
      'Smooth as moss, that is me. Do not blink.',
      'The mower? Pah. I would turn it into a sofa.',
      'Cards, cards, cards. Such a lovely table tonight.',
      '{other}, you have the look of a gnome with plans.',
      'Cheese? Only the finest, darling. Nothing less.',
      'I am not nervous. I am simply extremely relaxed.',
      'Worms: fine company, poor conversation. Like {other}.',
      'Mushroom ale, anyone? I am buying. Obviously.',
      'The shoe whispers to me. It says, relax, Mossimo.',
    ],
    ownBust: [
      'Bust. Fine. Even the smoothest slips on a pebble.',
      'Over, darling. A small blip in a grand evening.',
      'Bust. I would say I meant it, but we both know.',
      'Twenty-two. Sleek, but a little too sleek.',
    ],
    ownBlackjack: [
      'Blackjack. Naturally. Did you expect anything else?',
      'Ace and king. Smooth, like a river stone.',
      'Blackjack, darling. I will sign the autograph later.',
      'Blackjack. Take a bow, the whole table, go on.',
    ],
    ownWin: [
      'A win. Lovely, lovely, lovely chips.',
      'I win, I smile, you pretend it does not sting.',
      'Win again. You are welcome for the entertainment.',
      'The chips come to me, as they always do, darling.',
    ],
    ownLose: [
      'Lost. Doesn\'t matter. Mossimo lands on his feet.',
      'A loss. I will be back, smoother than ever.',
      'Lost it, darling. Let me pretend I meant that.',
      'Ouch. Well, the shine is still on me, isn\'t it?',
    ],
    ownDouble: [
      'Double. Watch me make it look effortless.',
      'I will double. Relax, it is simply how I breathe.',
      'Doubling, darling. Some of us like the view from the top.',
      'A double, smooth as butter. Keep up, {other}.',
    ],
    tease: [
      '{name}, darling, a bust is so last season.',
      'Oh {name}. Bust again. Practise your smile, though.',
      '{name} went over. Such a smooth landing, darling.',
      'Careful, {name}. Going over is not a flattering look.',
    ],
    jealous: [
      '{name} won big? Somebody has been practising.',
      'Lovely win for {name}. I will be taking that back.',
      '{name} is on a roll. Mind you do not roll off.',
      'Oh {name}, you are glowing. Terribly unfair, darling.',
    ],
    nag: [
      '{name}, darling, the clock is running out on you.',
      '{name}, do not keep the table waiting. Be decisive.',
      'Hurry up, {name}. Time does not wait for charm.',
      '{name}, love, the timer wants a decision. So do I.',
    ],
  },
  [DEALER_KEY]: {
    turn: [
      'Your call, {name}.',
      'Your move, {name}. Do not dawdle, the mice are watching.',
      '{name}, it is your turn. Hit, stand, or sulk.',
      'Over to you, {name}. Mind the cards, they bite.',
    ],
    timeout: [
      'Time is up, {name}. The cards decided for you.',
      'Out of time, {name}. I will take that as a stand.',
      '{name}, the clock won. It always does, in my experience.',
      'No decision from {name}. Stand it is, I suppose.',
    ],
    welcome: [
      'Pull up a stump, {name}. Fresh cards, old Gnick.',
      'Welcome to the table, {name}. Mind the mushrooms.',
      'Ah, {name}. Sit down and place your bets, won\'t you?',
      '{name} joins us. Good, the table was getting dull.',
    ],
    leave: [
      'Off you go, {name}. The grass is greener, they say.',
      '{name} has left. Shame. Those were fine chips.',
      'Goodbye, {name}. Come back when the lawn is dry.',
      'Gone, {name}. I will keep your seat warm. Probably not.',
    ],
    broke: [
      '{name} is skint. Here is a fresh stack. Do not waste it.',
      'Broke, {name}? Here is a fresh stack, gnome.',
      '{name}, your purse is empty. Take a fresh stack.',
      'Oh dear, {name}, all gone. Fresh chips, and no tears.',
    ],
    roundStart: [
      'Place your bets, friends. The shoe is warm.',
      'Place your bets. Chips on the felt, if you please.',
      'Bets, please. The cards are waiting, and so am I.',
      'Place your bets. No IOUs, I am too old for them.',
    ],
    reveal: [
      'Let us see what I have got under here.',
      'The hole card, friends. Lift the veil.',
      'Here is my second card. Try not to faint.',
      'Show time. Old Gnick reveals his hand.',
    ],
    gloat: [
      'Blackjack. Oh, I am so sorry, friends.',
      'Blackjack for the house. The house is very pleased.',
      'Ace and ten. Pay the dealer, friends, pay the dealer.',
      'Blackjack. Some of us were born lucky, I suppose.',
    ],
    nag: [
      '{name}, the clock does not stop for pretty faces.',
      'Tick, tock, {name}. Old Gnick is growing older.',
      '{name}, hurry on now. I have a pipe to light.',
      'Time is wearing thin, {name}. Decide, dear gnome.',
    ],
    cheer: [
      'Blackjack! Well played, {name}. Sit back and smile.',
      'Splendid, {name}. Splendid. Now take your winnings.',
      'Ah, {name}, a fine hand. I will remember it, sadly.',
      'Lovely hand, {name}. My knees are very proud.',
    ],
  },
};

// Used when a character (or the dealer) has no line for a topic.
export const GENERIC: Record<Topic, string[]> = {
  idle: [
    'Lovely night for cards, isn\'t it?',
    'Who fancies a mushroom ale?',
    'The lawnmower is out there somewhere.',
    'Hmm. Interesting shoe tonight.',
    'Cheese, anyone? Nobody? Fine.',
    'Pass the hat, I am wet and grumpy.',
    'A beard is a beard, and mine is magnificent.',
    'Hush, the cards are thinking.',
    'Worms are good company, I am told.',
    'Tap tap. Is this table still on?',
  ],
  ownBust: ['Bust! Ah well.', 'Over. Next hand.', 'Too many. Oops.', 'Bust, and I am fine about it.'],
  ownBlackjack: ['Blackjack! Lovely.', 'Ace and king! Yes!', 'Blackjack, friends. Cheer up.', 'Two cards, big smile. Blackjack.'],
  ownWin: ['Won! Pass the chips.', 'A win. I will take it.', 'Chips for me, thank you kindly.', 'Winning feels good, does it not?'],
  ownLose: ['Lost it. Never mind.', 'Ah, a loss. Next time.', 'Bad luck. Good sport, I am.', 'Lost. Pass the mushroom ale.'],
  ownDouble: ['Double! Here we go.', 'I am doubling, bold as anything.', 'Double it, why not?', 'Doubling. Wish me luck.'],
  ownSplit: ['Split them! Two hands, twice the fun.', 'A pair? I am splitting, obviously.', 'Split. One for me, one for luck.', 'Two hands now. Do not tell my wife.'],
  ownHit: ['Hit me. Nice and gently.', 'One more card, please.', 'Hit. Here is hoping.', 'Another card. Brave gnome.'],
  ownStand: ['Stand. That is me done.', 'I will stay right here, thanks.', 'Stand. Let us see what they do.', 'No more for me. Standing.'],
  tease: ['{name} went over. Ooh.', 'Mind your count, {name}.', 'Ha, {name}! Bust.', '{name}, that was a bold one.'],
  cheer: ['Well played, {name}!', 'Hooray for {name}!', 'Good show, {name}.', 'Nice one, {name}, very nice.'],
  nag: ['{name}, hurry up, please.', 'Clock is ticking, {name}.', 'Come on, {name}. Decide.', '{name}, the cards are waiting.'],
  jealous: ['{name} won big. Typical.', 'Lucky {name}. Not fair.', 'Oh, {name} again?', 'I would have had that pot, {name}.'],
  dealerBust: ['The dealer went bust! Hooray!', 'Ha! The dealer busts again.', 'Over they go! Pay up!', 'Dealer is bust. Lovely news.'],
  hello: ['Hello there, newcomer!', 'Pull up a stump, friend!', 'Evening, stranger. Mind the cheese.', 'Welcome to the table, friend.'],
  turn: ['Your call, {name}.', 'Over to you, {name}.', '{name}, your move.', 'Go on, {name}. Decide.'],
  timeout: ['Time is up, {name}.', 'Out of time, {name}.', '{name}, the clock won.', 'No move from {name}. Stand.'],
  welcome: ['Welcome, {name}!', 'Take a seat, {name}.', 'Good evening, {name}.', 'Ah, {name}. Sit down, friend.'],
  leave: ['Goodbye, {name}.', '{name} has left the table.', 'Off you go, {name}.', 'Farewell, {name}. Mind the grass.'],
  broke: ['{name} is out of chips. Here is a fresh stack.', 'Broke, {name}? Fresh stack, friend.', '{name}, all gone. Here, have more.', 'No chips, {name}? Take a fresh stack.'],
  roundStart: ['Place your bets, friends.', 'Bets, please, friends.', 'Place your bets. The shoe is warm.', 'Chips on the felt, friends.'],
  reveal: ['Here is the hidden card.', 'Let us see the hole card.', 'The second card, friends.', 'Lift the veil. Here it is.'],
  gloat: ['Blackjack for the dealer!', 'Blackjack for the house, friends.', 'Ace and ten. The house wins.', 'Blackjack. Sorry, friends.'],
  dealerRise: [
    'Two barrels and you still could not bust me.',
    'House rules: no shotguns at the table. Place your bets.',
    'Cute spread. Terrible etiquette. Still counts as a stand.',
    'I have survived worse from a lawnmower. Deal goes on.',
    'My waistcoat is ruined. The house remembers, {name}.',
    'Next time try splitting aces instead of my ribs.',
    'Point blank and you still missed twenty-one.',
    'You are lucky I do not count both barrels as a double down.',
  ],
};

const isCpu = (st: TableState, seat: number): boolean => !!st.seats[seat]?.cpu;

/** Seated gnomes (humans and CPUs) except `except`. */
const seated = (st: TableState, except: number): number[] =>
  st.seats.flatMap((s, i) => (s && i !== except ? [i] : []));

/** CPU seats except `except`. */
const cpuSeats = (st: TableState, except: number): number[] =>
  seated(st, except).filter(i => st.seats[i]?.cpu);

function pickOf<T>(arr: readonly T[], r: () => number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
}

const cpuPick = (st: TableState, except: number, r: () => number): number | undefined =>
  pickOf(cpuSeats(st, except), r);

const clip = (s: string): string => (s.length > NAME_LEN ? s.slice(0, NAME_LEN - 1) + '…' : s);

const fill = (t: string, v: Record<string, string>): string =>
  t.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

/** A line from `topic` spoken by `speaker` (a seat index or DEALER) about `subject`. */
function say(st: TableState, speaker: number, topic: Topic, subject: number | undefined, r: () => number): Banter | null {
  const isDealer = speaker === DEALER;
  const seat = isDealer ? null : st.seats[speaker];
  if (!isDealer && !seat?.cpu) return null;

  const lines =
    (isDealer ? LINES[DEALER_KEY]?.[topic] : LINES[seat?.character ?? '']?.[topic]) ?? GENERIC[topic];
  const me = isDealer ? DEALER_CHAR.name : seat!.name;
  const subj = subject === undefined ? undefined : st.seats[subject];
  const otherSeat = pickOf(seated(st, speaker), r);
  const other = otherSeat === undefined ? DEALER_CHAR.name : st.seats[otherSeat]!.name;

  const vars = {
    name: clip(subj ? subj.name : 'friend'),
    me: clip(me),
    other: clip(other),
    dealer: DEALER_CHAR.name,
  };
  const ok = lines
    .map(t => fill(t, vars))
    .filter(s => s.length > 0 && s.length <= MAX_LEN && !s.includes('{'));
  const text = pickOf(ok, r);
  return text === undefined ? null : { seat: speaker, text };
}

export function banterFor(st: TableState, ev: TableEvent, r: () => number): { seat: number; text: string } | null {
  const gate = (p: number): boolean => r() < p;

  switch (ev.e) {
    case 'roundStart':
      return gate(0.3) ? say(st, DEALER, 'roundStart', undefined, r) : null;
    case 'deal':
      return null;
    case 'turn':
      return gate(0.12) ? say(st, DEALER, 'turn', ev.seat, r) : null;
    case 'hit':
      return gate(0.12) && isCpu(st, ev.seat) ? say(st, ev.seat, 'ownHit', ev.seat, r) : null;
    case 'stand':
      return gate(0.12) && isCpu(st, ev.seat) ? say(st, ev.seat, 'ownStand', ev.seat, r) : null;
    case 'double': {
      if (!gate(0.7)) return null;
      if (isCpu(st, ev.seat)) return say(st, ev.seat, 'ownDouble', ev.seat, r);
      const c = cpuPick(st, ev.seat, r);
      return c === undefined ? null : say(st, c, 'cheer', ev.seat, r);
    }
    case 'split': {
      if (!gate(0.6)) return null;
      if (isCpu(st, ev.seat)) return say(st, ev.seat, 'ownSplit', ev.seat, r);
      const c = cpuPick(st, ev.seat, r);
      return c === undefined ? null : say(st, c, 'cheer', ev.seat, r);
    }
    case 'bust': {
      if (!gate(0.8)) return null;
      const own = isCpu(st, ev.seat);
      if (own && r() < 0.6) return say(st, ev.seat, 'ownBust', ev.seat, r);
      const c = cpuPick(st, ev.seat, r);
      if (c !== undefined) return say(st, c, 'tease', ev.seat, r);
      return own ? say(st, ev.seat, 'ownBust', ev.seat, r) : null;
    }
    case 'blackjack': {
      if (isCpu(st, ev.seat)) return say(st, ev.seat, 'ownBlackjack', ev.seat, r);
      const c = cpuPick(st, ev.seat, r);
      const speaker = c !== undefined && gate(0.5) ? c : DEALER;
      return say(st, speaker, 'cheer', ev.seat, r);
    }
    case 'timeLow': {
      if (!gate(0.75)) return null;
      const cs = cpuSeats(st, ev.seat);
      const k = Math.floor(r() * (cs.length + 1));
      return say(st, k < cs.length ? cs[k] : DEALER, 'nag', ev.seat, r);
    }
    case 'timeout':
      return gate(0.9) ? say(st, DEALER, 'timeout', ev.seat, r) : null;
    case 'dealerReveal':
      return gate(0.3) ? say(st, DEALER, 'reveal', undefined, r) : null;
    case 'dealerBust': {
      if (!gate(0.9)) return null;
      const c = cpuPick(st, NONE, r);
      return c === undefined ? null : say(st, c, 'dealerBust', undefined, r);
    }
    case 'dealerBlackjack':
      return say(st, DEALER, 'gloat', undefined, r);
    case 'result': {
      if (ev.delta >= 20) {
        if (!gate(0.5)) return null;
        if (isCpu(st, ev.seat) && r() < 0.5) return say(st, ev.seat, 'ownWin', ev.seat, r);
        const c = cpuPick(st, ev.seat, r);
        if (c !== undefined) return say(st, c, 'jealous', ev.seat, r);
        return isCpu(st, ev.seat) ? say(st, ev.seat, 'ownWin', ev.seat, r) : null;
      }
      if (ev.result === 'lose' && isCpu(st, ev.seat) && gate(0.2)) {
        return say(st, ev.seat, 'ownLose', ev.seat, r);
      }
      return null;
    }
    case 'broke':
      return say(st, DEALER, 'broke', ev.seat, r);
    case 'join': {
      if (!isCpu(st, ev.seat) && r() < 0.4) {
        const c = cpuPick(st, ev.seat, r);
        if (c !== undefined) return say(st, c, 'hello', ev.seat, r);
      }
      return say(st, DEALER, 'welcome', ev.seat, r);
    }
    case 'leave':
      return gate(0.5) ? say(st, DEALER, 'leave', ev.seat, r) : null;
    case 'dealerRise':
      return say(st, DEALER, 'dealerRise', st.dealerShot?.by, r);
    case 'idle': {
      const c = cpuPick(st, NONE, r);
      return c === undefined ? null : say(st, c, 'idle', undefined, r);
    }
    default:
      return null;
  }
}
