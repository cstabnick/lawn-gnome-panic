// CPU table talk & trash talk for Gnome Billiards, voiced with @lawn/mutter.
import { createMutter, type VoiceSpec } from '@lawn/mutter';
import type { CpuTier } from './cpu';

export type BanterTopic =
  | 'matchStart'
  | 'cpuPot'
  | 'cpuMultiPot'
  | 'cpuMiss'
  | 'cpuFoul'
  | 'playerPot'
  | 'playerMiss'
  | 'playerFoul'
  | 'cpuWin'
  | 'playerWin'
  | 'nag'
  | 'highWager'
  | 'bankShot'
  | 'matchPoint'
  | 'comeback';

export const PLAYER_QUIPS: readonly { id: string; label: string; text: string }[] = [
  { id: 'watch', label: '💬 Watch this', text: 'Watch how a real gnome shoots.' },
  { id: 'luck', label: '💬 Pure luck', text: 'Pure luck! Do it again.' },
  { id: 'chalk', label: '💬 Need chalk?', text: 'Might want to chalk that cue.' },
  { id: 'easy', label: '💬 Too easy', text: 'Too easy. Ready to rack again?' },
];

export const CPU_VOICES: Record<CpuTier, VoiceSpec> = {
  casual: { hz: 112, speed: 0.95, wave: 'triangle', wobble: 0.25 },
  regular: { hz: 74, speed: 0.85, wave: 'saw', sub: 0.8, style: 'words', glide: -0.3 },
  shark: { hz: 98, speed: 1.1, wave: 'saw', formant: 1.05, range: 1.3 },
  cracked: { hz: 84, speed: 1.25, wave: 'square', breath: 0.25, q: 7, range: 0.4 },
};

const LINES: Record<CpuTier, Record<BanterTopic, string[]>> = {
  casual: {
    matchStart: [
      'Alright {player}, friendly rack! Try not to scratch.',
      'Hold my mushroom ale, I actually practiced today.',
      'Good luck, {player}! May the felt be kind.',
      'Let’s have a clean game at the Gnomecino.',
    ],
    cpuPot: [
      'Ooh, that actually went in!',
      'Count it! Just like I drew it up.',
      'Haha! Beginner’s luck, twenty years running.',
      'Look at that roll, {player}!',
    ],
    cpuMultiPot: [
      'Two at once?! Somebody clip that!',
      'Whoa, I’m on fire! Watch out, {player}!',
      'Double drop! Did you see that?!',
      'I meant to do that. Probably.',
    ],
    cpuMiss: [
      'Aw, kissed the rail. Your turn, {player}.',
      'So close! Must be a bump in the cloth.',
      'Welp, left you an easy one there.',
      'My cue slipped, I swear!',
    ],
    cpuFoul: [
      'Oops! Free ball for you, {player}.',
      'Not my finest moment. Take ball in hand.',
      'Did the cue ball just vanish? Uh oh.',
      'Foul on me! Be gentle.',
    ],
    playerPot: [
      'Nice shot, {player}!',
      'Clean pot! You’ve got a steady hand.',
      'Ooh, smooth. Very smooth.',
      'Okay, I see you, {player}!',
    ],
    playerMiss: [
      'Ooh, rattled the pocket! Unlucky.',
      'Almost had it, {player}. My turn!',
      'Alright, let’s see what I can do here.',
      'Close! Just a hair thick.',
    ],
    playerFoul: [
      'Ooh, rough break! Thanks for the cue ball.',
      'Ball in hand! Don’t mind if I do.',
      'Foul! Even I know that one hurts.',
      'Yikes, {player}. I’ll take it from here.',
    ],
    cpuWin: [
      'Wait, I won?! Beers on me—uh, on {player}!',
      'GG {player}! That was a blast.',
      'Burdock takes the rack! What a night!',
      'Rematch? I’m feeling lucky!',
    ],
    playerWin: [
      'Well played, {player}! You got me.',
      'Respect! That 8-ball was pure class.',
      'You’re too good for me, {player}.',
      'Tip of the cap to you!',
    ],
    nag: [
      'Take your time, {player}... I’m only growing moss.',
      'Still lining it up, {player}?',
      'Any day now, {player}!',
      'Need a magnifying glass for that cut?',
    ],
    highWager: [
      '{wager} chips on the line?! My hands are shaking!',
      'Whoa, big roller {player} betting {wager} chips!',
      'Easy now, {player}, {wager} chips is half my rent!',
      'Let’s play for {wager} chips then. Gulp.',
    ],
    bankShot: [
      'Whoa! Off the rail and in?!',
      'Banked it! Somebody check the cushions!',
      'Rail magic! I didn’t even know that worked.',
    ],
    matchPoint: [
      'One ball left! Don’t look at my sweating beard.',
      'Match point! Everybody hold your breath!',
      'This is it, {player} — final ball!',
    ],
    comeback: [
      'Hey! Trash talk is above my pay grade, {player}!',
      'Oh yeah? Wait ’til you see my next lucky bounce!',
      'Talk all you want, my ale is still colder than yours!',
    ],
  },
  regular: {
    matchStart: [
      'Welcome to my table, {player}. Keep your hat dry.',
      'I’ve bounced gnomes twice your size, {player}. Rack ’em.',
      'Big Lou runs this back room. Show me what you’ve got.',
      'No sloppy strokes on my felt, {player}.',
    ],
    cpuPot: [
      'Down it goes. Textbook.',
      'Like taking acorns from a squirrel.',
      'Clean. Pay attention, {player}.',
      'That’s how we shoot in the Gnomecino.',
    ],
    cpuMultiPot: [
      'Two down. Don’t blink, {player}.',
      'Cleared the traffic! Big Lou’s warmed up now.',
      'Double trouble. Hope you’re comfortable watching.',
      'Boom. Count ’em both.',
    ],
    cpuMiss: [
      'Tch. Pocket’s tighter than my velvet rope.',
      'Alright, you get a turn, {player}. Don’t waste it.',
      'Left it safe enough. Your problem now.',
      'Hmph. Felt’s running slow tonight.',
    ],
    cpuFoul: [
      'Bah! Take the cue ball, {player}.',
      'Sloppy. Won’t happen again.',
      'You got lucky there, {player}.',
      'Foul. Enjoy the charity.',
    ],
    playerPot: [
      'Not bad, {player}. Not bad at all.',
      'Alright, you can shoot. Let’s see the next one.',
      'Decent cut. Don’t get cocky.',
      'Hmph. Pocketed.',
    ],
    playerMiss: [
      'Haha! Rattled it right out, {player}.',
      'Too much muscle, not enough aim.',
      'Step aside, {player}. Let a bouncer show you.',
      'Missed by a mile. My table.',
    ],
    playerFoul: [
      'Foul! Hand over the rock, {player}.',
      'That’s a house penalty. Big Lou’s ball.',
      'Amateurs. Watch how this is done.',
      'Ball in hand. Big mistake, {player}.',
    ],
    cpuWin: [
      'Table’s mine, {player}. Better luck next rack.',
      'Don’t feel bad. Everybody loses to Big Lou.',
      'Game over. Pay the cashier on your way out.',
      'That’s why I guard the velvet rope.',
    ],
    playerWin: [
      'Alright, {player}, you earned that one. Respect.',
      'Hmph. Fine shooting. Don’t tell the boss.',
      'You got me this time, {player}. Rack again.',
      'Well played. You’re welcome at my table anytime.',
    ],
    nag: [
      'Clock’s ticking, {player}. Shoot already.',
      'I’ve got a door to bounce, {player}. Hurry it up.',
      'Are you aiming or napping?',
      'Hit the ball, {player}, before I rack it myself.',
    ],
    highWager: [
      '{wager} chips? Bold move, {player}. Hope you brought your A-game.',
      'Putting {wager} chips on my felt? I like your nerve.',
      'Big Lou never turns down {wager} chips.',
      'Playing heavy for {wager} chips. Let’s dance.',
    ],
    bankShot: [
      'Clean bank! Now that’s Gnomecino pool.',
      'Off the rubber and straight home.',
      'Bank shot! Respect the cushion.',
    ],
    matchPoint: [
      'On the hill, {player}. One clean shot decides it.',
      'Final ball. Don’t choke now.',
      'One left. Let’s see your nerve.',
    ],
    comeback: [
      'Keep yapping, {player}, and I’ll bounce you past the velvet rope.',
      'Big talk for a gnome with a crooked cue.',
      'Save your breath for the rack, {player}.',
    ],
  },
  shark: {
    matchStart: [
      'Careful, {player}. I eat amateurs for breakfast.',
      'Velvet Vesper doesn’t play for fun. Let’s see your stroke.',
      'Cute cue, {player}. Try to keep up.',
      'Hope you’re ready to watch a clinic.',
    ],
    cpuPot: [
      'Like silk.',
      'Dead center. Did it even touch the jaws?',
      'Too easy.',
      'Watch the shape on the next ball, {player}.',
    ],
    cpuMultiPot: [
      'Two birds, one cue. Effortless.',
      'That’s high-roller billiards, darling.',
      'Double drop. Are you taking notes, {player}?',
      'Precision. Pure precision.',
    ],
    cpuMiss: [
      'Hmm. A rare blemish.',
      'Enjoy your brief visit to the table, {player}.',
      'Try not to embarrass yourself from there.',
      'A tiny misread. Won’t matter.',
    ],
    cpuFoul: [
      'Tch. A slip of the chalk.',
      'Take your freebie, {player}. You’ll need it.',
      'Even sharks blink sometimes.',
      'Ball in hand. Let’s see if you can capitalize.',
    ],
    playerPot: [
      'Oh, a lucky rattle. Good for you.',
      'Not terrible, {player}. Let’s see you run the rack.',
      'Cute shot. Now try the tough ones.',
      'You’re actually trying! Adorable.',
    ],
    playerMiss: [
      'Choked on the cut, {player}?',
      'Thanks for warming up the pockets for me.',
      'That miss just cost you the rack.',
      'My turn. Don’t sit down—actually, do.',
    ],
    playerFoul: [
      'Oh dear. Handing me ball in hand? Fatal.',
      'Amateur hour. Thank you kindly, {player}.',
      'Foul! That’s basically a concession.',
      'Delicious. Watch me clear from here.',
    ],
    cpuWin: [
      'Outclassed, {player}. Better stick to checkers.',
      'Velvet Vesper always collects.',
      'Too sharp, too clean. Want another lesson?',
      'That’s why they call me the Shark.',
    ],
    playerWin: [
      'Impossible! You got the roll of the century, {player}.',
      'Fine. You can shoot. Rematch—right now.',
      'Hmph. Lucky break, {player}. Don’t get used to it.',
      'Well played. I underestimated you.',
    ],
    nag: [
      'Calculating the wind, {player}? We’re indoors.',
      'Staring won’t move the ball, {player}.',
      'I’m losing my edge waiting on you.',
      'Shoot, {player}. Or forfeit.',
    ],
    highWager: [
      '{wager} chips? Oh, now you have my full attention, {player}.',
      'Thank you in advance for the {wager} chips.',
      'Betting {wager} chips against a Shark? Brave. Foolish, too.',
      '{wager} chips in the pot. Let’s make it hurt.',
    ],
    bankShot: [
      'A bank shot! Stylish, darling.',
      'Kissed the rail like it owed us chips.',
      'Geometry with flair. Lovely.',
    ],
    matchPoint: [
      'Final ball. Try not to blink, {player}.',
      'Match point. My favourite moment.',
      'One ball from the payout.',
    ],
    comeback: [
      'Adorable. Let’s see if your cue speaks half as loud, {player}.',
      'Chalk is cheap, {player}. Skill isn’t.',
      'Careful, darling. You’re talking to a Shark.',
    ],
  },
  cracked: {
    matchStart: [
      'Geometry is not optional, {player}.',
      'I already calculated the next three racks.',
      'One mistake and you won’t touch the table again, {player}.',
      'The Chalk Phantom does not miss.',
    ],
    cpuPot: [
      'Inevitable.',
      'Zero margin. Zero doubt.',
      'Watch the angle. Learn.',
      'Dead pocket.',
    ],
    cpuMultiPot: [
      'Two down. The math checks out.',
      'Calculated.',
      'Every collision was already solved, {player}.',
      'Cleanup in progress.',
    ],
    cpuMiss: [
      'An anomaly in the felt. Enjoy your one shot.',
      'Safe enough. Your move, {player}.',
      'Even a phantom tests the rails.',
      'Calculated safety. Good luck.',
    ],
    cpuFoul: [
      'A statistical fluke. Don’t waste it.',
      'Ball in hand. You’ll still need perfection.',
      'Take the ball, {player}. It won’t save you.',
      'Rare error. Corrected.',
    ],
    playerPot: [
      'Adequate.',
      'You found the pocket. Now find the next five.',
      'Acceptable angle, {player}.',
      'Keep going. One miss ends this.',
    ],
    playerMiss: [
      'Suboptimal.',
      'Nice try. Watch how it’s actually done.',
      'You left it wide open, {player}. Fatal.',
      'Thank you. I’ll take the rack from here.',
    ],
    playerFoul: [
      'Ball in hand for me. Game over.',
      'Catastrophic error, {player}.',
      'You just handed a phantom a loaded cue.',
      'Foul. Prepare to watch.',
    ],
    cpuWin: [
      'Flawless. As predicted.',
      'You never stood a chance, {player}.',
      'The Chalk Phantom remains undefeated.',
      'Come back when you’ve solved the table.',
    ],
    playerWin: [
      '...Impressive, {player}. Truly cracked.',
      'You beat the Phantom. The Gnomecino will remember this.',
      'My calculations... failed? Well played, {player}.',
      'A masterclass. Respect.',
    ],
    nag: [
      'I solved this shot 14 seconds ago, {player}.',
      'Hesitation breeds misses, {player}.',
      'The cloth isn’t getting any shorter.',
      'Shoot.',
    ],
    highWager: [
      '{wager} chips against the Phantom? Bold donation, {player}.',
      'You’re wagering {wager} chips? I’ll spend them wisely.',
      'High stakes: {wager} chips. Zero mercy.',
      '{wager} chips on the felt. Prepare for precision.',
    ],
    bankShot: [
      'Incidence equals reflection. Simple.',
      'The cushion obeyed.',
      'Calculated bank. Next.',
    ],
    matchPoint: [
      'Final ball. Inevitability approaches, {player}.',
      'One ball remaining. Zero margin.',
      'Endgame.',
    ],
    comeback: [
      'Words don’t pocket balls, {player}.',
      'Noise is irrelevant. Only angles matter.',
      'You’re talking while I’m solving the table.',
    ],
  },
};

export function pickBanter(
  tier: CpuTier,
  topic: BanterTopic,
  vars?: { player?: string; wager?: number },
  rnd: () => number = Math.random,
  lastLine?: string,
): string {
  const pool = LINES[tier][topic];
  const filtered = lastLine && pool.length > 1 ? pool.filter((l) => l !== lastLine) : pool;
  const raw = filtered[Math.floor(rnd() * filtered.length)] ?? pool[0] ?? '';
  return raw
    .replace(/\{player\}/g, vars?.player ?? 'Gnome')
    .replace(/\{wager\}/g, String(vars?.wager ?? 0));
}

export interface BanterVoice {
  unlock(): void;
  say(text: string, tier: CpuTier): void;
  stop(): void;
}

export function createBanterVoice(isMuted: () => boolean): BanterVoice {
  const mutter = createMutter({ gain: () => (isMuted() ? 0 : 0.45) });
  return {
    unlock: () => mutter.unlock(),
    say: (text, tier) => {
      if (isMuted()) return;
      mutter.say(text, CPU_VOICES[tier], { maxLetters: 44 });
    },
    stop: () => mutter.stop(),
  };
}
