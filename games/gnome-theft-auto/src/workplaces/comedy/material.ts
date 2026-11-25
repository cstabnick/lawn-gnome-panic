// E24 comedy: the sets, heckles and hecklers. Pure data. The joke: the gnome's craft is hopeless and Le Petit Groan
// (a cellar club in Pardonlin, where disdain is an art form) grills it. Every string stays <= 120 characters.
import type { Beat, ComedySet, CrowdReaction, Heckler } from './types';

function b(line: string, anim: string | undefined, s: number, react: CrowdReaction, heckle?: string): Beat {
  return heckle ? { line, anim, s, react, heckle } : { line, anim, s, react };
}

export const SETS: readonly ComedySet[] = [
  {
    id: 'set-hedges',
    title: 'Hedges: What Is the Deal',
    level: 1,
    intro: 'Our next act has been told many times not to come. Here they are.',
    beats: [
      b('Good evening! Is this thing on? ...It is on. Okay.', 'tap-foot', 3, 'silence'),
      b("What's the deal with hedges? They just... sit there.", 'shrug', 3.5, 'cricket'),
      b('You trim them, they grow back. Like my hopes. Anyway, hedges!', 'scratch-head', 4, 'cough'),
      b("And don't get me started on the other side of a hedge. What IS over there?", 'point', 4, 'heckle',
        'It is a hedge. You have described it twice.'),
      b('Nothing! It is more hedge! ...I thought that one was stronger.', 'facepalm', 4, 'groan'),
      b('Reading from my card: "Hedges, but with a twist." ...The twist is on the back.', 'think', 4.5, 'tomato'),
      b('Thank you, you have been wonderful. Somebody clap. Anybody.', 'bow', 3.5, 'pity-clap'),
    ],
    closer: "You've been great. Statistically, someone was.",
  },
  {
    id: 'set-mower',
    title: 'My Mower and Me',
    level: 2,
    intro: 'A gnome and a lawnmower. We asked for neither. Please be gentle with the silence.',
    beats: [
      b("So I bought a ride-on mower. Let me tell you about the ride-on mower. It's long.", 'cross-arms', 4, 'sigh'),
      b('It has six gears. I used one. I want you to feel that.', 'flex', 3.5, 'silence'),
      b('I go out to the lawn. I turn the key. And the mower... goes.', 'point', 4, 'cricket'),
      b('That is the joke. The mower went. Because you expected it not to.', 'shrug', 4.5, 'heckle',
        'I expected nothing. I am still disappointed.'),
      b('Then it went around the lawn. Then it went around again. (long pause) Again.', 'check-watch', 6, 'groan'),
      b('Funny story, the mower did not hit a single gnome. That is the whole story.', 'scratch-head', 4, 'tomato'),
      b('Anyway. Hedges, am I right? Callback! Nobody? It was a callback.', 'think', 4, 'cough'),
      b('Thanks, I will be here all week. I have to be, the mower has my keys.', 'bow', 3.5, 'pity-clap'),
    ],
    closer: 'You have been a wonderful crowd. I will be in the cellar, with the mower.',
  },
  {
    id: 'set-acorn-economics',
    title: 'Acorn Economics',
    level: 3,
    intro: 'Tonight, jokes about money, from a gnome who has none. Mind the silence, it is load-bearing.',
    beats: [
      b('I was at the bank, and I said, I would like to put my Acorns to work. They said: "Squirrel."', 'point', 4,
        'silence'),
      b("Get it? Because squirrels love acorns. Also 'squirrel away'. Two jokes in one.", 'laugh', 4.5, 'heckle',
        'Explaining it is a third joke. It is worse.'),
      b("I have a savings account. It has savings. It's an account. I have an account of my savings.", 'shrug', 4,
        'pity-clap'),
      b('Interest rates, folks. Interesting? No. That is the pun. Interest... ing.', 'tap-foot', 4.5, 'groan'),
      b('My Acorns are fixed-term. They are fixed. And terminal. (laughs alone) Hah!', 'laugh', 4, 'tomato'),
      b('The market was up. My mood was down. So we balanced. Like an Acornomist.', 'flex', 4, 'cough'),
      b('Reading off the card: "Diversify." I did. I now have a small acorn and a big acorn.', 'think', 5, 'walkout'),
      b('That is a callback to the hedge. The hedge. From the earlier set. Not this one.', 'point', 3.5, 'heckle',
        'We have not seen the earlier set. We are still hurt.'),
      b('I made a joke about inflation and then I blew into a balloon. Please enjoy.', 'cheer', 4, 'tomato'),
    ],
    closer: 'You have been great. Please tip generously, the market is down.',
  },
  {
    id: 'set-prop-comedy',
    title: 'An Evening of Prop Comedy',
    level: 4,
    intro: 'Prop comedy. We are as sorry as you are. Please do not make eye contact with the trowel.',
    beats: [
      b('Okay. Props. (holds up rubber trowel) This is a trowel. Watch. It bends!', 'point', 4, 'silence'),
      b('It bends. Because it is rubber. That is the bit. Wait for the second bend.', 'flex', 5, 'sigh'),
      b('Second bend. (long pause) Do you see? It also bends the other way.', 'think', 6, 'cricket'),
      b('Now a hat. This is a hat that is also a smaller hat. (puts it on) Hat. Hat.', 'bow', 4, 'heckle',
        'This is a hat on a hat. We have dined with the Mayor, we know.'),
      b('The smaller hat has a smaller hat. I did not plan the pattern. It is the pattern.', 'scratch-head', 4.5,
        'groan'),
      b('Next, a puppet! (holds up sock) Hello sock. "Hello gnome." It is me doing the voice.', 'taunt', 4.5, 'tomato'),
      b("Let's do the trowel again. It is a better trowel this time. It bends harder.", 'flex', 4, 'cough'),
      b('Now, audience participation. Somebody hold the trowel. Nobody? It is rubber!', 'beckon', 4, 'walkout'),
      b('I will hold it. Look at me holding it. Look at me. Please look at me.', 'pat-pockets', 4, 'tomato'),
      b('Thank you. The trowel and I have never been so unwell. Good night. Good... night.', 'bow', 3.5, 'pity-clap'),
    ],
    closer: 'Tip your trowel handler. I am the trowel handler. Please tip me.',
  },
  {
    id: 'set-tall-ones',
    title: 'The Tall Ones Are Weird, Right?',
    level: 5,
    intro: 'The headliner. We booked someone else. This is who came. Be as kind as you can, which is not very.',
    beats: [
      b('Okay! Okay! The Tall Ones! Am I right?! They are TALL!', 'air-guitar', 4, 'silence'),
      b("They don't even see us! You know why? Because we're short! That is the premise!", 'point', 4.5, 'groan'),
      b('And they put gnomes on the lawn! On purpose! For decoration! Think about it!', 'shake-fist', 4.5, 'heckle',
        'We thought about it. In 1840. Then we stopped.'),
      b('Have you heard the one where a Tall One steps on a gnome? No? It is not funny. Moving on.', 'shrug', 4,
        'tomato'),
      b("What's the deal with their shoes? Big. Shoes. BIG. Is it a boat? It's a shoe.", 'tap-foot', 5, 'sigh'),
      b('They wear big hats too! Like us! Except theirs is a hair! Theirs is a hat made of head!', 'scratch-head', 4.5,
        'cricket'),
      b('(reading a card) "Tall Ones, but in the garden." ...I wrote this on the back of a seed packet.', 'think', 5,
        'cough'),
      b('Callback to the trowel! Trowel! You will remember the trowel! ...Oh. You left.', 'point', 4, 'walkout'),
      b('Anyway, hedges. Big hedges. Taller than us! The hedges are Tall Ones! Get it!', 'cheer', 4, 'heckle',
        'We got it in the first act. It still does not work.'),
      b('(long pause) (longer pause) I forgot where I was. Is this the end?', 'check-watch', 6, 'tomato'),
      b("And now, a song. It's about the Tall Ones. It rhymes 'giants' with 'lawn pliance'.", 'dance-robot', 5,
        'tomato'),
      b('Thank you, you have been the best crowd, in a long and unlit career.', 'bow', 3.5, 'pity-clap'),
    ],
    closer: "You've been great. Statistically, someone was. Tip the Tall Ones.",
  },
];

export const HECKLES: readonly string[] = [
  'I have seen sadder things. In a museum. On purpose.',
  'Is there an interval? Can it be now?',
  'My grandmother laughed once. She was wrong too.',
  'In Pardonlin we call this "a pause with ambitions".',
  'I would applaud, but I was raised properly.',
  'The silence was the better act.',
  'Is it supposed to be funny, or are we meant to admire the effort?',
  'I came for the cheese. The cheese was at least ironic.',
  'You have the confidence of a much funnier gnome.',
  'I have heard better jokes from a drainpipe. It was more committed.',
  'Please stop. We will sign whatever you like.',
  'I did not know disappointment could be performed live.',
  'That punchline arrived late and without an apology.',
  'There is a door, you know. It is lovely. Look at it.',
  'My soup has more timing, and it is cold.',
  'Bold. Wrong, but bold.',
  'Somewhere, a comedian is feeling a draught.',
  'Do continue. We are collecting evidence.',
  'I have read funnier tax forms. Aloud. To the clerk.',
  'The material is fine. It is the delivery, the content and the idea.',
  'I laughed once, in 1987. It was a misunderstanding.',
  'That was not a joke. That was a request for help.',
  'Is this the part where we clap? We will wait to be told.',
  'The pause was the best bit. Could you do the pause again, but longer?',
];

export const HECKLERS: readonly Heckler[] = [
  { name: 'Professor Grimace', seat: 1 },
  { name: 'Odette Who Has Seen It All', seat: 2 },
  { name: 'The Man Eating Soup Loudly', seat: 5 },
  { name: 'A Critic from Le Moniteur', seat: 0 },
  { name: 'Madame Ennui', seat: 3 },
  { name: 'Baptiste, Disappointed', seat: 6 },
  { name: 'The Gnome Who Came for the Cheese', seat: 8 },
  { name: 'Someone at the Back, Quietly', seat: 9 },
];

/** What the gnome says on a Double Down (explaining the joke, louder). */
export const DOUBLE_DOWN_LINES: readonly string[] = [
  'No, no, because HEDGES. Hedges! Get it? Because they... edge.',
  'Let me do it again, slower. Slower. Sloooower.',
  'It is funnier if you know the mower. Does anyone know the mower?',
  "I'll say it louder. LOUDER. That's how jokes work.",
  'The pun is "interest". Interest. Because it is... interesting. And money.',
  'Okay, same joke, but in a voice. (does a voice) Better?',
  'You missed the setup. Let me redo the setup. Then the joke. Then the setup.',
  'Wait, wait, you are not laughing yet. I will wait. I have time. (waits)',
  'It is a trowel and it is rubber. That is the joke. Both halves.',
  "Fine, I will explain it. I'll explain it until it is funny.",
  'This is the part where you laugh. I will do it first to show you. Hah! Hah!',
  'It killed in rehearsal. The rehearsal was me. Again!',
];

/** Mireille Sans-Rire's verdict after the set, by stars (index 0 = 1 star). */
export const VERDICTS: readonly string[] = [
  'One star. The star was for the exit.',
  'Two stars. One for effort, one for the lighting.',
  'Three stars. It happened. We were there.',
  'Four stars. I did not look at my watch. I looked at the ceiling.',
  'Five stars. You stayed until the end. Nobody else did. Including me.',
];

/** The set to play at `level`, the `played`-th time (cycles through the sets open at that level, newest first). */
export function setFor(level: number, played: number): ComedySet | null {
  const open = SETS.filter((s) => s.level <= level);
  return open.length ? open[(open.length - 1 - (played % open.length) + open.length) % open.length] : null;
}
