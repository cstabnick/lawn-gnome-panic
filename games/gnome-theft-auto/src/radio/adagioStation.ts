// 96.1 Radio Adagio (E30): Pardonlin's classical station, broadcast from the Opera Hall on the Left Bank. Its host,
// banter, idents, ads and calls. Plain data; content.ts lists it in STATIONS. The music is music/songs/adagio.ts.
// Rules to keep (R-021, R-016, canon house style): nothing gets wet, soaked, dripping or bloody. Clay cracks and is glued back.
import type { Station } from './content';
import { RADIO_SONGS } from './music/songs';

export const ADAGIO_STATION: Station = {
  id: 'adagio',
  name: '96.1 Radio Adagio',
  label: 'Radio Adagio',
  freq: '96.1',
  theme: 'classical',
  // A bonus station: Drive-Time Regular still asks for the three Turfton FM stations only.
  bonus: true,
  sign: { who: 'MAESTRO', text: 'Pardon. You are listening to Radio Adagio, ninety-six point one. Please lower your engine.' },
  songs: RADIO_SONGS.adagio.map(({ title, artist }) => ({ title, artist })),
  banter: [
    { who: 'MAESTRO', text: 'That was slow. The next one is slower. This is the point.' },
    { who: 'MAESTRO', text: 'Radio Adagio, ninety-six point one, from the Opera Hall on the Left Bank. We broadcast at the speed of a thought you have been having carefully since breakfast.' },
    { who: 'MAESTRO', text: 'Pardon. A reminder that the Maestro is on the air until the music ends. The music ends when I say. I have not yet said. It has been since Wednesday.' },
    { who: 'MAESTRO', text: 'You are listening to Radio Adagio. Please lower your engine. Please lower it again. Lower, lower, there. That is the sound of a mower with some respect for an oboe.' },
    { who: 'MAESTRO', text: 'This is Radio Adagio, ninety-six point one, and I am Maestro Ottavio Lento. If you have just tuned in, you have missed nothing. If you tuned in an hour ago, you have missed nothing slowly.' },
    { who: 'MAESTRO', text: 'The weather in Pardonlin: a light drizzle on the Left Bank, a lighter drizzle on the Right, and a hush over the Jardin. It is a perfect day. I am delighted. I will say it again in a minute, at half the speed.' },
    { who: 'MAESTRO', text: 'Driving advice from the Maestro. Indicate. Then wait one bar. Then turn, in three-four time, and arrive looking as if you meant it. The Hatwheel roundabout is a waltz, and you are early.' },
    { who: 'MAESTRO', text: 'Everything should be played slower. Music, naturally. Bread. Queues, though they are already very good. Traffic, which I have asked the Hatwheel about, and the Hatwheel has gone round the question twice.' },
    { who: 'MAESTRO', text: 'The brass section is on strike again. Their demands are a longer lunch and a shorter trombone. The Opera Hall has offered a longer trombone and a shorter lunch. We continue, in strings, and in hope.' },
    { who: 'MAESTRO', text: 'The pigeons on the Opera Hall roof have come in during the rests again. They do not know a rest is for silence. They think it is for them. I have written to the roof. The roof has not replied, which is a form of rest.' },
    { who: 'MAESTRO', text: 'We now present the second movement of a very long piece for strings, played at the speed it was meant to be played, which is the speed of the last gnome in the queue at Brigitte Levain\'s bakery. It is a fine speed. It smells of loaves.' },
    { who: 'MAESTRO', text: 'That was the Thymes Quartet. Four players, one river, and a tune that goes round the Bean Tower and politely asks it to move up. I adore them. I would adopt them, but they do not fit in my flat.' },
    { who: 'MAESTRO', text: 'I am asked what I think of the Blade. I think of it as the loud one. I do not think of it often, and when I do I lower the window and hum something in a minor key until it passes.' },
    { who: 'MAESTRO', text: 'A word to our friends in Turfton, which I am told is "Turf-Ton", as in a ton of turf. It is a very heavy name for a very small town. We love it, and we pronounce it Terfin, and we do not intend to stop.' },
    { who: 'MAESTRO', text: 'Marcel Muet the mime performed outside Café Pardon this morning for four hours. I could not hear a thing. It was the best interval of my week, and I have asked him to do it again, off air, at some length.' },
    { who: 'MAESTRO', text: 'Odile Easelby is painting the Grand Platz again, from the same chair, in the same cap. She has been painting it for six years. The Grand Platz has stopped asking her to hurry. We play her something with a very long cadence.' },
    { who: 'MAESTRO', text: 'Hector Disdain, the waiter at Café Pardon, brought me an espresso at ten o\'clock and sighed. I am told it was a compliment. I played him a slow piece in return. He sighed again, in tempo.' },
    { who: 'MAESTRO', text: 'Fifi Haricot of the Bean Tower is giving a tour of the Bean Tower. Take the ladder. It has four hundred rungs. Do not take them quickly. A rung is a bar line, and you do not trample a bar line.' },
    { who: 'MAESTRO', text: 'Roquette Fromage has a new cheese at the Beetle Market. It is very old and very quiet. It is the only cheese that has ever properly kept the beat, and I hope it is available in a size you can fit in a mower.' },
    { who: 'MAESTRO', text: 'Anatole Bellows is playing his accordion on the quay again. I do not despise the accordion. I merely wish it would let go of a note once in a while, and let the note breathe in the Little Gardens.' },
    { who: 'MAESTRO', text: 'Captain Anchois of Basin Quay has asked me to tell his boat that the opera is half over and it need not leave yet. The boat is not listening. Not even the Basin is that patient, and it is a basin.' },
  ],
  ads: [
    { who: 'AD', text: 'Café Pardon, on Teacup Row. Coffee as small as a thimble and twice as final. Served by Hector Disdain, who will bring it when he is ready, which is the point. Café Pardon: sit, and be sighed at.' },
    { who: 'MAESTRO', text: 'Brigitte Levain\'s bakery, by the Beetle Market. Loaves warm from the oven, and she will not be rushed, and neither will the loaf. Arrive early. Leave late. The queue is a short piece of chamber music.' },
    { who: 'MAESTRO', text: 'Season tickets for the Opera Hall, now on sale. Fourteen concerts, each one longer than the last. Seats not provided. Bring a cushion, a flask and a good long view of the back of a hat.' },
  ],
  calls: [
    { who: 'CALLER (Turfton)', text: 'Can you play something faster? — MAESTRO: Faster than what? — CALLER: Anything. Anything at all. — MAESTRO: Then I shall play the same piece at the same speed, but I shall announce it more briskly. Thank you for calling, Terfin.' },
    { who: 'FIFI HARICOT (on the line, from the Bean Tower)', text: 'Maestro, I am calling from the top of the tower. You can see the whole town. — MAESTRO: And does it look slow from up there? — FIFI: It looks like a very long rest. — MAESTRO: Fifi, you are a poet. Come down. Slowly.' },
    { who: 'ROOSTER (on the line)', text: 'THE BAROMETER IS DROPPING, MAESTRO! — MAESTRO: Then we shall drop with it, Rooster, in a gentle diminuendo. — ROOSTER: THE STRINGS ARE SQUEAKING IN A PATTERN! — MAESTRO: That is a violin. That is what they do. — ROOSTER: THAT IS WHAT THEY WANT YOU TO THINK!' },
    { who: 'LISTENER (the Left Bank)', text: 'The pigeons are on the roof again. — MAESTRO: In a rest? — LISTENER: In the rest. — MAESTRO: They cannot hear the rest. They only hear the pause before the crumbs. I shall write to them, and I shall write at length.' },
  ],
};
